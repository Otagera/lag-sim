import type { GameState } from '../state/types'
import { calculateHiddenDrag } from './dragEngine'
import { drawNextEvent, firePendingDelayed } from './eventEngine'
import { calculateWeeklyExpenditure } from './expenditureEngine'
import { applyFactionDeltaState, drift } from './factionEngine'
import { drawGodfatherAsk, shouldDrawGodfather } from './godfatherEngine'
import { processProjects } from './projectEngine'
import { calculateWeeklyRevenue } from './revenueEngine'
import { applyDelta } from './statEngine'

const CONSTITUENCY_TRUST_WEIGHTS: Partial<Record<string, number>> = {
  alimosho: 40 / 3,
  periphery: 40 / 3,
  makoko: 40 / 3,
  lagosIsland: 10,
  victoriaIsland: 10,
  lekki: 10,
  surulere: 15,
  oshodi: 15,
}

export function tick(state: GameState): GameState {
  let next: GameState = {
    ...state,
    week: state.week + 1,
    eventsResolvedThisWeek: 0,
    stats: { ...state.stats },
  }

  const revenue = calculateWeeklyRevenue(next)
  const expenditure = calculateWeeklyExpenditure(next)
  next = { ...next, lastWeekRevenue: revenue, lastWeekExpenditure: expenditure }

  const capitalSpend = next.capitalProjects
    .filter((p) => p.status === 'active')
    .reduce((sum, p) => sum + p.weeklyDraw, 0)
  const drag = calculateHiddenDrag(next, capitalSpend)
  const leakageRate = 0.15 + (next.stats.corruptionPressure / 100) * 0.25
  const capitalEfficiency = 1 - (capitalSpend > 0 ? leakageRate : 0)

  const netFlow = revenue.total - expenditure.total
  next.stats.cashReserve += netFlow
  next.stats.igr = revenue.total
  next.stats.expenditure = expenditure.total
  next.stats.capitalEfficiency = Math.max(0, Math.min(1, capitalEfficiency))

  // Apply FAAC variance
  next.stats.cashReserve += drag.faacVariance
  next = { ...next, faacVarianceAccumulated: next.faacVarianceAccumulated + Math.abs(drag.faacVariance) }
  if (Math.abs(drag.faacVariance) > 2) {
    next = {
      ...next,
      timeline: [
        ...next.timeline,
        {
          week: next.week,
          type: 'delayed-consequence' as const,
          title: 'FAAC Volatility',
          description: `Federal allocation ${drag.faacVariance > 0 ? 'surged' : 'fell'} by ₦${Math.abs(drag.faacVariance).toFixed(1)}bn this week.`,
        },
      ],
    }
  }

  // Passive corruption rise
  next = applyDelta(next, { corruptionPressure: 0.5 })

  next.stats.ghostWorkerRate = Math.min(0.2, next.stats.ghostWorkerRate + drag.ghostRegenRate)
  next.stats.baseOverheads += drag.overheadCreep
  next.stats.contractorBacklog = Math.max(
    0,
    next.stats.contractorBacklog + 0.1 - expenditure.contractorPayment,
  )

  // Loan payoff: reduce outstanding balance and clean up completed loans
  if (next.activeLoans.length > 0) {
    const updatedLoans = next.activeLoans.map((loan) => ({
      ...loan,
      outstanding: Math.max(0, loan.outstanding - loan.weeklyRepayment),
    }))
    const completedLoans = updatedLoans.filter((l) => l.outstanding <= 0)
    const remainingLoans = updatedLoans.filter((l) => l.outstanding > 0)
    for (const loan of completedLoans) {
      next = applyDelta(next, {
        weeklyDebtRepayment: -loan.weeklyRepayment,
        weeklyDebtInterest: -loan.weeklyInterest,
      })
    }
    next = { ...next, activeLoans: remainingLoans }
  }
  // Reduce debt stock by what was repaid this week
  if (next.stats.weeklyDebtRepayment > 0) {
    next = applyDelta(next, { debtStock: -next.stats.weeklyDebtRepayment })
  }

  next = processProjects(next)

  const { state: afterDelayed } = firePendingDelayed(next)
  next = afterDelayed

  const driftDelta = drift(next.factions)
  if (Object.keys(driftDelta).length > 0) {
    next = applyFactionDeltaState(next, driftDelta)
  }

  // publicTrust drifts toward constituency-weighted average (10% pull per week)
  const weightedTrust =
    Object.entries(next.constituencyApproval).reduce(
      (sum, [key, val]) => sum + (CONSTITUENCY_TRUST_WEIGHTS[key] ?? 0) * val,
      0,
    ) / 100
  const trustDelta = (weightedTrust - next.stats.publicTrust) * 0.1
  if (Math.abs(trustDelta) > 0.01) {
    next = applyDelta(next, { publicTrust: trustDelta })
  }

  next = checkGameOver(next)

  if (!next.isGameOver) {
    if (!next.activeEvent) {
      const event = drawNextEvent(next)
      if (event) {
        next = { ...next, activeEvent: event }
      }
    }
    if (shouldDrawGodfather(next)) {
      const message = drawGodfatherAsk(next)
      if (message) {
        next = { ...next, activeGodfatherMessage: message }
      }
    }
  }

  next = applyDelta(next, { infrastructureScore: -0.3 })

  return next
}

function checkGameOver(state: GameState): GameState {
  if (state.isGameOver) return state

  const next = { ...state }

  if (next.stats.cashReserve < 0) {
    next.consecutiveBankruptWeeks++
    if (next.consecutiveBankruptWeeks >= 3) {
      return {
        ...next,
        isGameOver: true,
        gameOverReason: 'Bankruptcy: Lagos State is insolvent. Civil servants cannot be paid.',
      }
    }
  } else {
    next.consecutiveBankruptWeeks = 0
  }

  if (next.stats.federalRelationship < -40 && next.stats.infrastructureScore < 25) {
    return {
      ...next,
      isGameOver: true,
      gameOverReason: 'Federal Government has taken over Lagos State administration.',
    }
  }

  if (next.stats.publicTrust < 15 && next.stats.youthTension > 85) {
    return {
      ...next,
      isGameOver: true,
      gameOverReason: 'Mass uprising has overwhelmed the state government.',
    }
  }

  if (next.factions.partyGodfathers < 10 && next.week > 52) {
    return {
      ...next,
      isGameOver: true,
      gameOverReason: 'The party has removed you from office.',
    }
  }

  if (next.week > 208) {
    return {
      ...next,
      isGameOver: true,
      gameOverReason: 'Your term has ended. Check your final scorecard.',
    }
  }

  return next
}
