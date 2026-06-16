import { crisisEvents } from '../data/events/crisis'
import { economyEvents } from '../data/events/economy'
import { infrastructureEvents } from '../data/events/infrastructure'
import { politicalEvents } from '../data/events/political'
import { socialEvents } from '../data/events/social'
import { transportEvents } from '../data/events/transport'
import type { EventCard, GameState, PendingEvent, TimelineEntry } from '../state/types'
import { applyConstituencyImpact } from './constituencyEngine'
import { applyFactionDelta } from './factionEngine'
import { applyDelta } from './statEngine'

export const ALL_EVENTS: EventCard[] = [
  ...transportEvents,
  ...infrastructureEvents,
  ...politicalEvents,
  ...crisisEvents,
  ...economyEvents,
  ...socialEvents,
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

function getEventWeight(event: EventCard): number {
  return event.weight ?? SEVERITY_WEIGHT[event.severity]
}

function weightedSelect(pool: EventCard[]): EventCard | null {
  const weights = pool.map(getEventWeight)
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

  const available = ALL_EVENTS.filter((e) => isEventAvailable(state, e))

  const triggered = available.find((e) => e.triggerCondition?.(state))
  if (triggered) return triggered

  const pool = available.filter((e) => !e.triggerCondition)
  if (pool.length === 0) return null

  return weightedSelect(pool)
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
    next = applyDelta(next, { politicalCapital: -choice.politicalCapitalCost })
  }

  if (choice.corruptionTrigger) {
    next = applyDelta(next, { corruptionPressure: 3 })
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
  }

  return {
    ...next,
    activeEvent: null,
    pendingDelayed,
    resolvedEvents,
    eventCooldowns,
    eventsResolvedThisWeek: next.eventsResolvedThisWeek + 1,
    timeline: [...next.timeline, timelineEntry],
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
    next = {
      ...next,
      timeline: [
        ...next.timeline,
        {
          week: state.week,
          type: 'delayed-consequence',
          title: pending.sourceEventTitle,
          description: pending.consequence.eventText,
        } as TimelineEntry,
      ],
    }
  }

  return { state: next, fired }
}
