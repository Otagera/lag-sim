import type { GameState } from '../state/types'
import { getDeviceId, sendEvent, type AnalyticsEvent } from './telemetry'

let previousState: GameState | null = null

function hashDeviceId(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    const char = id.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36)
}

function buildBase(state: GameState): Omit<AnalyticsEvent, 'event_type' | 'event_data'> {
  return {
    session_id: crypto.randomUUID(),
    device_id_hash: hashDeviceId(getDeviceId()),
    week: state.week,
    archetype: state.runMeta.archetype,
  }
}

export function instrumentNewGame(state: GameState) {
  previousState = state
  sendEvent({
    ...buildBase(state),
    event_type: 'session_start',
    event_data: {
      archetype: state.runMeta.archetype,
      goal: state.selectedGoalId,
    },
  })
}

function instrumentChoice(state: GameState, choiceId: string, eventId: string) {
  const choice = state.activeEvent?.choices.find((c) => c.id === choiceId)
  sendEvent({
    ...buildBase(state),
    event_type: 'choice_resolved',
    event_data: {
      event_id: eventId,
      choice_id: choiceId,
      choice_label: choice?.label,
      stats_before: previousState?.stats,
      stats_after: state.stats,
      factions_before: previousState?.factions,
      factions_after: state.factions,
    },
  })
}

function instrumentGameOver(state: GameState) {
  sendEvent({
    ...buildBase(state),
    event_type: 'game_over',
    event_data: {
      game_over_type: state.gameOverType,
      game_over_reason: state.gameOverReason,
      week: state.week,
      current_term: state.currentTerm,
      re_elected: state.reElected,
      election_result: state.electionResult,
      reached_second_term: state.currentTerm === 2,
      stats: state.stats,
      factions: state.factions,
      constituency_approval: state.constituencyApproval,
    },
  })
}

function instrumentWeekTick(state: GameState) {
  sendEvent({
    ...buildBase(state),
    event_type: 'week_tick',
    event_data: {
      stats: state.stats,
      factions: state.factions,
      revenue: state.lastWeekRevenue,
      expenditure: state.lastWeekExpenditure,
    },
  })
}

export function instrumentStateChange(next: GameState) {
  const prev = previousState
  if (!prev) {
    previousState = next
    return
  }

  if (next.week !== prev.week && !next.isGameOver) {
    instrumentWeekTick(next)
  }

  if (next.isGameOver && !prev.isGameOver) {
    instrumentGameOver(next)
  }

  previousState = next
}

export function instrumentChoiceResolved(next: GameState, choiceId: string, eventId: string) {
  instrumentChoice(next, choiceId, eventId)
  previousState = next
}
