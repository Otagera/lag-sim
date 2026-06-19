import { chainEvents } from '../data/events/chains'
import { characterEvents } from '../data/events/characters'
import { crisisEvents } from '../data/events/crisis'
import { economyEvents } from '../data/events/economy'
import { electionEvents } from '../data/events/election'
import { infrastructureEvents } from '../data/events/infrastructure'
import { politicalEvents } from '../data/events/political'
import { riotEvents } from '../data/events/riot'
import { routineEvents } from '../data/events/routine'
import { socialEvents } from '../data/events/social'
import { transportEvents } from '../data/events/transport'
import type { EventCard, GameState, PendingEvent, TimelineEntry } from '../state/types'
import { applyConstituencyImpact } from './constituencyEngine'
import { applyFactionDelta } from './factionEngine'
import { getSeasonModifier } from './seasonEngine'
import { applyDelta } from './statEngine'

export const ALL_EVENTS: EventCard[] = [
  ...transportEvents,
  ...infrastructureEvents,
  ...politicalEvents,
  ...crisisEvents,
  ...economyEvents,
  ...socialEvents,
  ...routineEvents,
  ...characterEvents,
  ...electionEvents,
  ...chainEvents,
  ...riotEvents,
]

function isEventAvailable(state: GameState, event: EventCard): boolean {
  if (state.resolvedEvents.includes(event.id)) return false
  if (event.id in state.eventCooldowns) {
    if (state.week < state.eventCooldowns[event.id]) return false
  }
  if (event.week !== undefined && state.week < event.week) return false
  return true
}

const SEVERITY_WEIGHT: Record<EventCard['severity'], number> = {
  low: 3,
  medium: 2,
  high: 1,
  critical: 1,
}

function getEventWeight(event: EventCard, floodMultiplier = 1): number {
  const base = event.weight ?? SEVERITY_WEIGHT[event.severity]
  return event.season === 'wet' ? base * floodMultiplier : base
}

function weightedSelect(pool: EventCard[], floodMultiplier = 1): EventCard | null {
  const weights = pool.map((e) => getEventWeight(e, floodMultiplier))
  const total = weights.reduce((sum, w) => sum + w, 0)
  if (total <= 0) return null

  let roll = Math.random() * total
  for (let i = 0; i < pool.length; i++) {
    roll -= weights[i]
    if (roll <= 0) return pool[i]
  }
  return pool[pool.length - 1]
}

export function drawNextEvent(state: GameState): EventCard | null {
  if (state.activeEvent) return null
  if (state.eventsResolvedThisWeek >= 2) return null

  // Check event queue first (chain follow-ups take priority)
  if (state.eventQueue.length > 0) {
    return state.eventQueue[0]
  }

  const available = ALL_EVENTS.filter((e) => isEventAvailable(state, e))

  const triggered = available.find((e) => e.triggerCondition?.(state))
  if (triggered) return triggered

  // Riot mode: normal pool suspended, only riot management events eligible
  if (state.riotModeActive) {
    const riotPool = available.filter((e) => e.category === 'riot')
    if (riotPool.length === 0) return null
    return weightedSelect(riotPool)
  }

  const pool = available.filter((e) => !e.triggerCondition && e.category !== 'riot')
  if (pool.length === 0) return null

  const { floodEventWeightMultiplier } = getSeasonModifier(state.week)
  return weightedSelect(pool, floodEventWeightMultiplier)
}

export function resolveEvent(state: GameState, event: EventCard, choiceId: string): GameState {
  const choice = event.choices.find((c) => c.id === choiceId)
  if (!choice) return state

  let next = applyDelta(state, choice.immediate)

  if (choice.factionImpact) {
    next = {
      ...next,
      factions: applyFactionDelta(next.factions, choice.factionImpact),
    }
  }

  if (choice.constituencyImpact) {
    next = applyConstituencyImpact(next, choice.constituencyImpact)
  }

  if (choice.politicalCapitalCost) {
    const { politicalCapitalCostScale } = getSeasonModifier(state.week)
    const scaledCost = Math.round(choice.politicalCapitalCost * politicalCapitalCostScale)
    next = applyDelta(next, { politicalCapital: -scaledCost })
  }

  if (choice.corruptionTrigger) {
    next = applyDelta(next, { corruptionPressure: 3 })
  }

  if (choice.setFlags) {
    next = { ...next, stateFlags: { ...next.stateFlags, ...choice.setFlags } }
  }

  let pendingDelayed = [...next.pendingDelayed]
  if (choice.delayed) {
    const pending: PendingEvent = {
      id: `${event.id}-${choice.id}`,
      firesOnWeek: state.week + choice.delayed.weekOffset,
      consequence: choice.delayed,
      sourceEventTitle: event.title,
    }
    pendingDelayed = [...pendingDelayed, pending].sort((a, b) => a.firesOnWeek - b.firesOnWeek)
  }

  // Manage event queue:
  // 1. If this event came from the front of the queue, remove it
  let eventQueue = [...next.eventQueue]
  if (eventQueue.length > 0 && eventQueue[0].id === event.id) {
    eventQueue = eventQueue.slice(1)
  }

  // 2. If the choice chains to a follow-up event, enqueue it
  if (choice.followUpEventId) {
    const followUp = ALL_EVENTS.find((e) => e.id === choice.followUpEventId)
    if (followUp && isEventAvailable(next, followUp)) {
      eventQueue = [...eventQueue, followUp]
    }
  }

  let resolvedEvents = [...next.resolvedEvents]
  const eventCooldowns = { ...next.eventCooldowns }
  if (event.isRecurring && event.cooldownWeeks) {
    eventCooldowns[event.id] = state.week + event.cooldownWeeks
  } else {
    resolvedEvents = [...resolvedEvents, event.id]
  }

  const timelineEntry: TimelineEntry = {
    week: state.week,
    type: 'event',
    title: event.title,
    description: choice.label,
    statDelta: choice.immediate,
    factionDelta: choice.factionImpact,
  }

  // Track campaign decisions for vote share calculation
  const campaignDecisions =
    event.category === 'election'
      ? [...next.campaignDecisions, choice.id]
      : next.campaignDecisions

  return {
    ...next,
    activeEvent: null,
    eventQueue,
    pendingDelayed,
    resolvedEvents,
    eventCooldowns,
    eventsResolvedThisWeek: next.eventsResolvedThisWeek + 1,
    timeline: [...next.timeline, timelineEntry],
    campaignDecisions,
  }
}

export function firePendingDelayed(state: GameState): {
  state: GameState
  fired: PendingEvent[]
} {
  const fired: PendingEvent[] = []
  const remaining: PendingEvent[] = []

  for (const pending of state.pendingDelayed) {
    if (state.week >= pending.firesOnWeek) {
      fired.push(pending)
    } else {
      remaining.push(pending)
    }
  }

  if (fired.length === 0) return { state, fired: [] }

  let next = { ...state, pendingDelayed: remaining }

  for (const pending of fired) {
    next = applyDelta(next, pending.consequence.delta)
    if (pending.consequence.factionImpact) {
      next = {
        ...next,
        factions: applyFactionDelta(next.factions, pending.consequence.factionImpact),
      }
    }
    if (pending.consequence.constituencyImpact) {
      next = applyConstituencyImpact(next, pending.consequence.constituencyImpact)
    }

    // If the delayed consequence chains to a follow-up event, enqueue it
    if (pending.consequence.followUpEventId) {
      const followUp = ALL_EVENTS.find((e) => e.id === pending.consequence.followUpEventId)
      if (followUp) {
        next = { ...next, eventQueue: [...(next.eventQueue || []), followUp] }
      }
    }

    next = {
      ...next,
      timeline: [
        ...next.timeline,
        {
          week: state.week,
          type: 'delayed-consequence',
          title: pending.sourceEventTitle,
          description: pending.consequence.eventText,
          statDelta: pending.consequence.delta,
          factionDelta: pending.consequence.factionImpact,
        } as TimelineEntry,
      ],
    }
  }

  return { state: next, fired }
}
