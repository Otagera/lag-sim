import { fashemuAsks, generalGodfatherPool } from '../data/godfatherAsks'
import type { EventCard, FashemuPhase, GameState, GodfatherMessage, StatDelta } from '../state/types'
import { applyFactionDelta } from './factionEngine'
import { applyDelta } from './statEngine'

const FASHEMU_WEEK_GATES = [8, 26, 52, 85] as const

function isFashemuAskReady(state: GameState, askIndex: number): boolean {
  if (askIndex >= fashemuAsks.length) return false
  const weekGate = FASHEMU_WEEK_GATES[askIndex]
  return state.week >= weekGate
}

function pickFashemuAsk(state: GameState): (typeof fashemuAsks)[number] | null {
  if (state.fashemuAskIndex >= fashemuAsks.length) return null
  if (!isFashemuAskReady(state, state.fashemuAskIndex)) return null
  return fashemuAsks[state.fashemuAskIndex]
}

function pickGeneralAsk(state: GameState): (typeof generalGodfatherPool)[number] | null {
  const available = generalGodfatherPool.filter(
    (a) => !state.usedGodfatherAskIds.includes(a.id),
  )
  if (available.length === 0) return null
  return available[Math.floor(Math.random() * available.length)]
}

export function shouldDrawGodfather(state: GameState): boolean {
  // Check inbox for pending godfather ask (Phase D unified inbox)
  if (state.inbox.some((m) => m.isGodfatherAsk && !m.actioned)) return false
  if (state.fashemuPhase === 'dead') return false
  if (state.week < 3) return false

  const weeksSinceLast = state.week - state.lastGodfatherWeek

  // Fashemu main arc takes priority — check if one is ready
  if (state.fashemuAskIndex < fashemuAsks.length) {
    if (isFashemuAskReady(state, state.fashemuAskIndex) && weeksSinceLast >= 3) return true
  }

  // General pool secondary asks
  if (state.usedGodfatherAskIds.length >= generalGodfatherPool.length) return false
  if (weeksSinceLast < 3) return false
  if (weeksSinceLast >= 8) return true

  const chance = (weeksSinceLast - 2) * 0.12
  return Math.random() < chance
}

export function drawGodfatherAsk(state: GameState): GodfatherMessage | null {
  // Fashemu main arc first
  const fashemuTemplate = pickFashemuAsk(state)
  if (fashemuTemplate) {
    return {
      id: fashemuTemplate.id,
      week: state.week,
      text: fashemuTemplate.text,
      ask: {
        type: fashemuTemplate.type,
        description: fashemuTemplate.askDescription,
        onAccept: fashemuTemplate.onAccept,
        onRefuse: fashemuTemplate.onRefuse,
      },
    }
  }

  // General pool
  const template = pickGeneralAsk(state)
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

export function godfatherToEventCard(message: GodfatherMessage): EventCard {
  return {
    id: message.id,
    title: 'A Request from Chief Fashemu',
    body: message.text,
    severity: 'high',
    category: 'godfather',
    choices: [
      {
        id: `${message.id}:accept`,
        label: 'Accept',
        description: message.ask.description,
        immediate: message.ask.onAccept as any,
        factionImpact: message.ask.onAccept.factionImpact ?? {},
      },
      {
        id: `${message.id}:refuse`,
        label: 'Refuse',
        description: `Decline: ${message.ask.description}`,
        immediate: message.ask.onRefuse as any,
        factionImpact: message.ask.onRefuse.factionImpact ?? {},
      },
    ],
  }
}

export function resolveGodfather(
  state: GameState,
  message: GodfatherMessage,
  accepted: boolean,
  inboxMessageId?: string,
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

  const isFashemuAsk = fashemuAsks.some((a) => a.id === message.id)

  newState = {
    ...newState,
    godfatherMessages: [...newState.godfatherMessages, message],
    usedGodfatherAskIds: [...newState.usedGodfatherAskIds, message.id],
    lastGodfatherWeek: state.week,
    activeGodfatherMessage: null,
    inbox: newState.inbox.map((m) =>
      (inboxMessageId !== undefined && m.id === inboxMessageId) ||
      (inboxMessageId === undefined && m.isGodfatherAsk && !m.actioned)
        ? { ...m, read: true, actioned: true }
        : m,
    ),
  }

  if (accepted) {
    newState = { ...newState, godfatherComplianceCount: newState.godfatherComplianceCount + 1 }
    if (isFashemuAsk) {
      newState = {
        ...newState,
        fashemuAskIndex: newState.fashemuAskIndex + 1,
        fashemuRelationship: Math.min(100, newState.fashemuRelationship + 15),
        fashemuPhase: 'active',
      }
    }
  } else {
    newState = {
      ...newState,
      godfatherRefusalCount: newState.godfatherRefusalCount + 1,
    }
    if (isFashemuAsk) {
      newState = {
        ...newState,
        fashemuAskIndex: newState.fashemuAskIndex + 1,
        fashemuRelationship: Math.max(0, newState.fashemuRelationship - 20),
      }
    }
    newState = applyEscalation(newState, newState.godfatherRefusalCount)
  }

  return newState
}

export function applyFashemuPhaseTransition(state: GameState): GameState {
  if (state.fashemuPhase === 'dead') return state

  const refusals = state.godfatherRefusalCount
  // const rel = state.fashemuRelationship
  void state.fashemuRelationship // available for phase transition logic
  const hasCoopedWithEFCC = state.resolvedEvents.includes('fashemu-efcc-contact') &&
    state.timeline.some(
      (e) => e.title === 'EFCC Contact: The Fashemu File' && e.description === 'Cooperate Quietly',
    )

  let newPhase: FashemuPhase = state.fashemuPhase

  if (state.resolvedEvents.includes('fashemu-death')) {
    newPhase = 'dead'
  } else if (hasCoopedWithEFCC) {
    newPhase = 'reconciled'
  } else if (refusals >= 4 && state.resolvedEvents.includes('fashemu-public-break')) {
    // Check if player chose fight back or cooperate-efcc
    const breakEntry = state.timeline.find((e) => e.title === 'The Boa Strikes: Public Confrontation')
    if (breakEntry?.description === 'Open Back-Channel Talks') {
      newPhase = 'reconciled'
    } else {
      newPhase = 'break'
    }
  } else if (refusals >= 3) {
    newPhase = 'warning'
  } else if (state.godfatherComplianceCount >= 2) {
    newPhase = 'active'
  } else if (state.fashemuAskIndex === 0) {
    newPhase = 'dormant'
  } else {
    newPhase = 'active'
  }

  if (newPhase === state.fashemuPhase) return state
  return { ...state, fashemuPhase: newPhase }
}

export function applyEscalation(state: GameState, refusalCount: number): GameState {
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
