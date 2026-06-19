import { godfatherAskPool } from '../data/godfatherAsks'
import type { GameState, GodfatherMessage, StatDelta } from '../state/types'
import { applyFactionDelta } from './factionEngine'
import { applyDelta } from './statEngine'

function pickRandomAsk(state: GameState): (typeof godfatherAskPool)[number] | null {
  const available = godfatherAskPool.filter((a) => !state.usedGodfatherAskIds.includes(a.id))
  if (available.length === 0) return null
  return available[Math.floor(Math.random() * available.length)]
}

export function shouldDrawGodfather(state: GameState): boolean {
  if (state.activeGodfatherMessage) return false
  if (state.usedGodfatherAskIds.length >= godfatherAskPool.length) return false
  if (state.week < 3) return false

  const weeksSinceLast = state.week - state.lastGodfatherWeek

  if (state.lastGodfatherWeek === 0) {
    return weeksSinceLast >= 3 && Math.random() < 0.25
  }

  if (weeksSinceLast < 3) return false
  if (weeksSinceLast >= 8) return true

  const chance = (weeksSinceLast - 2) * 0.15
  return Math.random() < chance
}

export function drawGodfatherAsk(state: GameState): GodfatherMessage | null {
  const template = pickRandomAsk(state)
  if (!template) return null

  return {
    id: template.id,
    week: state.week,
    text: template.text,
    ask: {
      type: template.type,
      description: template.askDescription,
      onAccept: template.onAccept,
      onRefuse: template.onRefuse,
    },
  }
}

export function resolveGodfather(
  state: GameState,
  message: GodfatherMessage,
  accepted: boolean,
): GameState {
  const choice = accepted ? message.ask.onAccept : message.ask.onRefuse
  const { factionImpact, ...statDelta } = choice

  let newState = applyDelta(state, statDelta as StatDelta)

  if (factionImpact) {
    newState = {
      ...newState,
      factions: applyFactionDelta(newState.factions, factionImpact),
    }
  }

  newState = {
    ...newState,
    godfatherMessages: [...newState.godfatherMessages, message],
    usedGodfatherAskIds: [...newState.usedGodfatherAskIds, message.id],
    lastGodfatherWeek: state.week,
    activeGodfatherMessage: null,
  }

  if (accepted) {
    newState = { ...newState, godfatherComplianceCount: newState.godfatherComplianceCount + 1 }
  } else {
    newState = {
      ...newState,
      godfatherRefusalCount: newState.godfatherRefusalCount + 1,
    }
    newState = applyEscalation(newState, newState.godfatherRefusalCount)
  }

  return newState
}

function applyEscalation(state: GameState, refusalCount: number): GameState {
  switch (refusalCount) {
    case 1:
      return state
    case 2:
      return {
        ...state,
        factions: applyFactionDelta(state.factions, { lgChairmen: -8 }),
      }
    case 3:
      return applyDelta(
        {
          ...state,
          factions: applyFactionDelta(state.factions, { partyGodfathers: -10 }),
        },
        { politicalCapital: -15 },
      )
    default:
      return applyDelta(
        {
          ...state,
          factions: applyFactionDelta(state.factions, { federalGovt: -2, partyGodfathers: -5 }),
        },
        { federalRelationship: -2, corruptionPressure: 1 },
      )
  }
}
