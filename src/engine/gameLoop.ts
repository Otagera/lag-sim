import type { GameState } from '../state/types'
import { weeklyTick } from './budgetEngine'
import { drawNextEvent, firePendingDelayed } from './eventEngine'
import { applyFactionDeltaState, drift } from './factionEngine'
import { drawGodfatherAsk, shouldDrawGodfather } from './godfatherEngine'
import { applyDelta } from './statEngine'

export function tick(state: GameState): GameState {
  // 1. Increment week & reset weekly counters
  let next: GameState = {
    ...state,
    week: state.week + 1,
    eventsResolvedThisWeek: 0,
  }

  // 2. Run budgetEngine.weeklyTick
  const budgetDelta = weeklyTick(next)
  next = applyDelta(next, budgetDelta)

  // 3. Run factionEngine.drift
  const driftDelta = drift(next.factions)
  if (Object.keys(driftDelta).length > 0) {
    next = applyFactionDeltaState(next, driftDelta)
  }

  // 4. Fire any pendingDelayed events that are due
  const { state: afterDelayed } = firePendingDelayed(next)
  next = afterDelayed

  // 5. Check game over conditions
  next = checkGameOver(next)

  // 6. Draw/trigger next event card(s) and godfather messages
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

  // 7. Passive stat decay
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

  // Federal Takeover: federalRelationship < -40 AND infrastructureScore < 25
  if (next.stats.federalRelationship < -40 && next.stats.infrastructureScore < 25) {
    return {
      ...next,
      isGameOver: true,
      gameOverReason: 'Federal Government has taken over Lagos State administration.',
    }
  }

  // Mass Uprising: publicTrust < 15 AND youthTension > 85
  if (next.stats.publicTrust < 15 && next.stats.youthTension > 85) {
    return {
      ...next,
      isGameOver: true,
      gameOverReason: 'Mass uprising has overwhelmed the state government.',
    }
  }

  // Party Removal: partyGodfathers < 10 AND week > 52
  if (next.factions.partyGodfathers < 10 && next.week > 52) {
    return {
      ...next,
      isGameOver: true,
      gameOverReason: 'The party has removed you from office.',
    }
  }

  // Term End: week > 208
  if (next.week > 208) {
    return {
      ...next,
      isGameOver: true,
      gameOverReason: 'Your term has ended. Check your final scorecard.',
    }
  }

  return next
}
