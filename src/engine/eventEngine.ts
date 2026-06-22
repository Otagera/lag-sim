import { chainEvents } from '../data/events/chains'
import { characterEvents } from '../data/events/characters'
import { NPC_DECK_EVENTS } from '../data/events/npcDecks'
import { campaignEraEvents } from '../data/events/campaign'
import { crisisEvents } from '../data/events/crisis'
import { economyEvents } from '../data/events/economy'
import { electionEvents } from '../data/events/election'
import { finaleEvents } from '../data/events/finale'
import { infrastructureEvents } from '../data/events/infrastructure'
import { midgameEvents } from '../data/events/midgame'
import { phase4Events } from '../data/events/phase4'
import { term2Events } from '../data/events/term2'
import { politicalEvents } from '../data/events/political'
import { riotEvents } from '../data/events/riot'
import { routineEvents } from '../data/events/routine'
import { socialEvents } from '../data/events/social'
import { transportEvents } from '../data/events/transport'
import type { EventCard, GameState, PendingEvent, StatKey, TimelineEntry } from '../state/types'
import { applyConstituencyImpact } from './constituencyEngine'
import { applyFactionDelta } from './factionEngine'
import { createProject } from './projectEngine'
import { getSeasonModifier } from './seasonEngine'
import { applyDelta } from './statEngine'

export const ALL_EVENTS: EventCard[] = [
  // phase4Events first: gives their trigger-condition outcomes (e.g. populist shield)
  // priority over other simultaneously-triggered events
  ...phase4Events,
  ...transportEvents,
  ...infrastructureEvents,
  ...politicalEvents,
  ...crisisEvents,
  ...economyEvents,
  ...socialEvents,
  ...routineEvents,
  ...characterEvents,
  ...electionEvents,
  ...midgameEvents,
  ...campaignEraEvents,
  ...finaleEvents,
  ...term2Events,
  ...chainEvents,
  ...riotEvents,
  ...NPC_DECK_EVENTS,
]

function isEventAvailable(state: GameState, event: EventCard): boolean {
  if (event.id in state.eventCooldowns) {
    if (state.week < state.eventCooldowns[event.id]) return false
  }
  if (event.week !== undefined && state.week < event.week) return false
  if (event.maxWeek !== undefined && state.week > event.maxWeek) return false
  if (event.maxTotalFirings !== undefined) {
    const count = state.resolvedEvents.filter((id) => id === event.id).length
    if (count >= event.maxTotalFirings) return false
    return true
  }
  if (state.resolvedEvents.includes(event.id)) return false
  return true
}

const SEVERITY_WEIGHT: Record<EventCard['severity'], number> = {
  low: 3,
  medium: 2,
  high: 1,
  critical: 1,
}

function getEventWeight(event: EventCard, floodMultiplier = 1, mediaDampening = 0): number {
  const base = event.weight ?? SEVERITY_WEIGHT[event.severity]
  let weight = event.season === 'wet' ? base * floodMultiplier : base
  // Information commissioner loyalty reduces probability of hostile media/civil-society events
  if (mediaDampening > 0) {
    const mediaImpact = event.factionImpact?.civilSocietyMedia ?? 0
    if (mediaImpact < -3) weight *= 1 - mediaDampening
  }
  return weight
}

function weightedSelect(pool: EventCard[], floodMultiplier = 1, mediaDampening = 0): EventCard | null {
  const weights = pool.map((e) => getEventWeight(e, floodMultiplier, mediaDampening))
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

  const triggered = available.find(
    (e) =>
      e.triggerCondition?.(state) &&
      !e.npcArchetype &&
      !(e.requiresInitiativeSlot && state.activeInitiative) &&
      (e.category !== 'election' || state.inCampaignMode),
  )
  if (triggered) return triggered

  // Riot mode: normal pool suspended, only riot management events eligible
  if (state.riotModeActive) {
    const riotPool = available.filter((e) => e.category === 'riot')
    if (riotPool.length === 0) return null
    return weightedSelect(riotPool)
  }

  const pool = available.filter(
    (e) => !e.triggerCondition
      && e.category !== 'riot'
      && !e.npcArchetype
      && !(e.requiresInitiativeSlot && state.activeInitiative)
      && (e.category !== 'election' || state.inCampaignMode),
  )
  if (pool.length === 0) return null

  const { floodEventWeightMultiplier } = getSeasonModifier(state.week)
  const infoComm = state.commissioners?.['information']
  const mediaDampening = infoComm ? (infoComm.loyalty / 100) * 0.25 : 0
  return weightedSelect(pool, floodEventWeightMultiplier, mediaDampening)
}

export function resolveEvent(state: GameState, event: EventCard, choiceId: string): GameState {
  const choice = event.choices.find((c) => c.id === choiceId)
  if (!choice) return state

  // Diminishing returns: read usage count from original state before any mutations
  const drKey = `${event.id}:${choice.id}`
  const drUses = choice.diminishingReturns ? (state.choiceUseCounts?.[drKey] ?? 0) : 0

  // Scale positive stat gains down on repeat use; costs (negative values) are never discounted
  let effectiveImmediate = choice.immediate
  if (choice.diminishingReturns && drUses > 0) {
    const scale = Math.max(0.2, 1 - drUses * 0.25)
    effectiveImmediate = Object.fromEntries(
      Object.entries(choice.immediate ?? {}).map(([k, v]) => [
        k,
        typeof v === 'number' && v > 0 ? Math.round(v * scale * 10) / 10 : v,
      ]),
    ) as Record<StatKey, number>
  }

  let next = applyDelta(state, effectiveImmediate)

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

  if (choice.resentmentDelta !== undefined && next.deputy) {
    next = {
      ...next,
      deputy: {
        ...next.deputy,
        resentment: Math.max(0, Math.min(100, next.deputy.resentment + choice.resentmentDelta)),
      },
    }
  }

  if (choice.launchInitiative) {
    next = { ...next, activeInitiative: choice.launchInitiative }
  }

  if (choice.launchProject) {
    const p = choice.launchProject
    const project = createProject(p.name, p.location, p.totalCost, p.weeklyDraw, p.weeksRemaining, p.contractorId)
    next = { ...next, capitalProjects: [...next.capitalProjects, project] }
  }

  if (choice.setSuspensionWeeks !== undefined) {
    next = { ...next, emergencySuspensionWeeks: choice.setSuspensionWeeks }
  }

  if (choice.setLitigationTimer !== undefined) {
    next = {
      ...next,
      litigationActive: choice.setLitigationTimer > 0,
      litigationTimer: choice.setLitigationTimer,
    }
  }

  if (choice.npcImpact) {
    const npcs = { ...next.activeNPCs }
    for (const [archetypeKey, delta] of Object.entries(choice.npcImpact)) {
      for (const slot of ['npc1', 'npc2', 'npc3'] as const) {
        if (npcs[slot].archetypeKey === archetypeKey) {
          npcs[slot] = {
            ...npcs[slot],
            relationship: Math.max(-100, Math.min(100, npcs[slot].relationship + delta)),
          }
        }
      }
    }
    next = { ...next, activeNPCs: npcs }
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

  // Diminishing returns: escalating penalties and counter increment
  let choiceUseCounts = next.choiceUseCounts ?? {}
  if (choice.diminishingReturns) {
    if (drUses >= 2) next = applyDelta(next, { corruptionPressure: drUses * 2 })
    if (drUses >= 3) {
      next = { ...next, factions: applyFactionDelta(next.factions, { civilSocietyMedia: -(drUses * 3) }) }
    }
    choiceUseCounts = { ...choiceUseCounts, [drKey]: drUses + 1 }
  }

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
    choiceUseCounts,
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
      if (followUp && isEventAvailable(next, followUp)) {
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
