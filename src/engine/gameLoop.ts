import type { GameState } from '../state/types'
import { weeklyTick } from './budgetEngine'
import { drawNextEvent, firePendingDelayed } from './eventEngine'
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
  // (stub — drift logic TBD)

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

  // Bankruptcy: cashReserve < 0 for 3 consecutive weeks
  // (tracking not yet implemented — placeholder)

  // Federal Takeover: federalRelationship < -40 AND infrastructureScore < 25
  if (state.stats.federalRelationship < -40 && state.stats.infrastructureScore < 25) {
    return {
      ...state,
      isGameOver: true,
      gameOverReason: 'Federal Government has taken over Lagos State administration.',
    }
  }

  // Mass Uprising: publicTrust < 15 AND youthTension > 85
  if (state.stats.publicTrust < 15 && state.stats.youthTension > 85) {
    return {
      ...state,
      isGameOver: true,
      gameOverReason: 'Mass uprising has overwhelmed the state government.',
    }
  }

  // Party Removal: partyGodfathers < 10 AND week > 52
  if (state.factions.partyGodfathers < 10 && state.week > 52) {
    return {
      ...state,
      isGameOver: true,
      gameOverReason: 'The party has removed you from office.',
    }
  }

  // Term End: week > 208
  if (state.week > 208) {
    return {
      ...state,
      isGameOver: true,
      gameOverReason: 'Your term has ended. Check your final scorecard.',
    }
  }

  return state
}
