import type { GameState, NPCKey, NPCState } from '../state/types'
import { calculateHiddenDrag } from './dragEngine'
import { calculateVoteShare } from './electionEngine'
import { drawNextEvent, firePendingDelayed } from './eventEngine'
import { calculateWeeklyExpenditure } from './expenditureEngine'
import { applyFactionDeltaState, drift } from './factionEngine'
import { applyFashemuPhaseTransition, drawGodfatherAsk, shouldDrawGodfather } from './godfatherEngine'
import { emergencyBridgeLoan } from './debtEngine'
import { removalResolutionEvent } from '../data/events/characters'
import { processProjects } from './projectEngine'
import { calculateWeeklyRevenue } from './revenueEngine'
import { getSeasonModifier } from './seasonEngine'
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

  // Apply FAAC variance (scaled by season — wet season = wilder swings)
  const mod = getSeasonModifier(next.week)
  const scaledFaacVariance = drag.faacVariance * mod.faacVarianceScale
  next.stats.cashReserve += scaledFaacVariance
  next = { ...next, faacVarianceAccumulated: next.faacVarianceAccumulated + Math.abs(scaledFaacVariance) }
  if (Math.abs(scaledFaacVariance) > 2) {
    next = {
      ...next,
      timeline: [
        ...next.timeline,
        {
          week: next.week,
          type: 'delayed-consequence' as const,
          title: 'FAAC Volatility',
          description: `Federal allocation ${scaledFaacVariance > 0 ? 'surged' : 'fell'} by ₦${Math.abs(scaledFaacVariance).toFixed(1)}bn this week.${mod.isWetSeason ? ' (Rainy season amplification)' : ''}`,
        },
      ],
    }
  }

  // Budget crunch (Dec–Jan): Abuja withholds a fraction of FAAC
  if (mod.faacBasePenalty > 0) {
    const penalty = revenue.faac * mod.faacBasePenalty
    next.stats.cashReserve -= penalty
  }

  // Federal election year: federalRelationship drifts down each week
  if (mod.federalRelationshipWeeklyDrift !== 0) {
    next = applyDelta(next, { federalRelationship: mod.federalRelationshipWeeklyDrift })
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

  // Activate NPCs based on conditions
  next = activateNPCs(next)

  // Fashemu phase transitions
  next = applyFashemuPhaseTransition(next)

  // LGA election result calculation (mandatory week 86)
  if (next.week === 86 && !next.lgaElectionHeld) {
    next = resolveLGAElection(next)
  }

  // Enter campaign mode at week 195
  if (next.week >= 195 && !next.inCampaignMode) {
    next = { ...next, inCampaignMode: true }
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

function activateNPCs(state: GameState): GameState {
  const npcs = { ...state.activeNPCs }
  let changed = false

  // NEO activates when corruptionPressure > 35 or procurement scandal resolved
  if (!npcs.neo.isActive) {
    if (
      state.stats.corruptionPressure > 35 ||
      state.resolvedEvents.includes('ibeju-lekki-property') ||
      state.resolvedEvents.includes('building-approval-bury')
    ) {
      npcs.neo = { ...npcs.neo, isActive: true, activeWeek: state.week }
      changed = true
    }
  }

  // Dayo activates when youthTension > 55 or Makoko resolved badly
  if (!npcs.dayo.isActive) {
    if (
      state.stats.youthTension > 55 ||
      (state.resolvedEvents.includes('makoko-demolition-order') && state.stats.publicTrust < 45)
    ) {
      npcs.dayo = { ...npcs.dayo, isActive: true, activeWeek: state.week }
      changed = true
    }
  }

  // SMJ activates when partyGodfathers < 45 or Fashemu refused
  if (!npcs.smj.isActive) {
    if (state.factions.partyGodfathers < 45 || state.godfatherRefusalCount >= 2) {
      npcs.smj = { ...npcs.smj, isActive: true, activeWeek: state.week }
      changed = true
    }
  }

  if (!changed) return state
  return { ...state, activeNPCs: npcs as Record<NPCKey, NPCState> }
}

function resolveLGAElection(state: GameState): GameState {
  // Calculate LGA result: base from lgChairmen faction score
  const lgBase = (state.factions.lgChairmen / 100) * 20
  const fashemuBonus = state.fashemuPhase === 'active' ? 4 : 0

  // Check how election was run
  const ranPartyMachine = state.resolvedEvents.includes('lga-election-buildup') &&
    state.timeline.some((e) => e.title === 'LGA Elections: Campaign Begins' && e.description === 'Mobilise Party Machine')
  const ranIndependent = state.resolvedEvents.includes('lga-election-buildup') &&
    state.timeline.some((e) => e.title === 'LGA Elections: Campaign Begins' && e.description === 'Independent Mobilisation')

  const campaignBonus = ranPartyMachine ? 3 : ranIndependent ? 2 : 0

  const loyalLGAs = Math.round(Math.min(20, Math.max(0, lgBase + fashemuBonus + campaignBonus)))
  const lgaElectionResult = (loyalLGAs / 20) * 100

  let next: GameState = {
    ...state,
    lgaElectionResult,
    lgaElectionHeld: true,
    timeline: [
      ...state.timeline,
      {
        week: state.week,
        type: 'milestone',
        title: 'LGA Election Results',
        description: `${loyalLGAs}/20 LGAs returned party-aligned chairmen. Result: ${lgaElectionResult.toFixed(0)}%.`,
      },
    ],
  }

  // Permanent penalty if result is poor
  if (lgaElectionResult < 40) {
    next = {
      ...next,
      factions: {
        ...next.factions,
        lgChairmen: next.factions.lgChairmen - 8,
      },
    }
  }

  return next
}

function checkGameOver(state: GameState): GameState {
  if (state.isGameOver) return state

  let next = { ...state }

  if (next.stats.cashReserve < 0) {
    if (next.consecutiveBankruptWeeks === 0) {
      next = emergencyBridgeLoan(next)
      if (next.stats.cashReserve >= 0) return next
    }
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
    if (next.impeachmentStage === 0) {
      next = {
        ...next,
        impeachmentStage: 1,
        eventQueue: [...next.eventQueue, removalResolutionEvent],
      }
    } else if (next.impeachmentStage === 1) {
      const resolved = next.resolvedEvents.includes('removal-resolution-first-reading')
      if (resolved) {
        const defied = next.timeline.some(
          (e) =>
            e.title === 'Removal Resolution: First Reading' &&
            e.description === 'Defy the Assembly',
        )
        if (defied) {
          return {
            ...next,
            impeachmentStage: 2,
            isGameOver: true,
            gameOverReason: 'The Lagos State House of Assembly voted to remove you from office.',
          }
        }
        next = { ...next, impeachmentStage: 0 }
      }
    }
  } else if (next.factions.partyGodfathers >= 10 && next.impeachmentStage === 1) {
    next = {
      ...next,
      impeachmentStage: 0,
      eventQueue: next.eventQueue.filter((e) => e.id !== 'removal-resolution-first-reading'),
    }
  }

  if (next.week > 208) {
    const electionResult = calculateVoteShare(next)
    const reElected = electionResult > 50

    let fashemuEndingPath = next.fashemuEndingPath
    if (!fashemuEndingPath) {
      const cooopedEFCC = next.timeline.some(
        (e) => e.title === 'EFCC Contact: The Fashemu File' && e.description === 'Cooperate Quietly',
      )
      if (next.fashemuPhase === 'dead') fashemuEndingPath = 'D'
      else if (cooopedEFCC) fashemuEndingPath = 'C'
      else if (next.godfatherRefusalCount >= 4) fashemuEndingPath = 'B'
      else if (next.godfatherComplianceCount >= 3) fashemuEndingPath = 'A'
    }

    return {
      ...next,
      electionResult,
      reElected,
      fashemuEndingPath,
      isGameOver: true,
      gameOverReason: 'Your term has ended. Check your final scorecard.',
    }
  }

  return next
}
