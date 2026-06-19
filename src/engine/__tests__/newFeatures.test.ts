import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { STARTING_STATE } from '../../data/startingState'
import type { EventCard, GameState } from '../../state/types'
import { ALL_EVENTS, drawNextEvent, resolveEvent } from '../eventEngine'
import { tick } from '../gameLoop'
import { SAVE_VERSION } from '../../version'
import { saveGame, loadGame } from '../../state/persistence'

function clone(s: GameState): GameState {
  return JSON.parse(JSON.stringify(s))
}

// ── maxTotalFirings ──────────────────────────────────────────────────────────

describe('maxTotalFirings: event firing limit', () => {
  beforeEach(() => vi.spyOn(Math, 'random').mockReturnValue(0.5))
  afterEach(() => vi.restoreAllMocks())

  it('allows a recurring event to fire up to maxTotalFirings times', () => {
    const limitedEvent: EventCard = {
      id: 'limited-recurring',
      title: 'Limited Recurring',
      body: 'Fires at most 3 times',
      severity: 'low',
      category: 'economy',
      isRecurring: true,
      cooldownWeeks: 1,
      maxTotalFirings: 3,
      choices: [{ id: 'c1', label: 'OK', description: '', immediate: {}, factionImpact: {} }],
    }
    ALL_EVENTS.push(limitedEvent)

    let state = clone(STARTING_STATE)
    // Resolve it 3 times, incrementing week past cooldown each time
    for (let i = 0; i < 3; i++) {
      state.week = (i + 1) * 2
      state = resolveEvent(state, limitedEvent, 'c1')
    }
    // After 3 resolutions it should be blocked
    state.week = 10
    const available = drawNextEvent(state)
    expect(available?.id).not.toBe('limited-recurring')

    ALL_EVENTS.pop()
  })

  it('blocks a maxTotalFirings event after threshold is reached regardless of cooldown', () => {
    const limitedEvent: EventCard = {
      id: 'limited-once',
      title: 'One Shot',
      body: 'Only fires once',
      severity: 'medium',
      category: 'economy',
      isRecurring: true,
      cooldownWeeks: 4,
      maxTotalFirings: 1,
      choices: [{ id: 'c1', label: 'OK', description: '', immediate: {}, factionImpact: {} }],
    }
    ALL_EVENTS.push(limitedEvent)

    let state = clone(STARTING_STATE)
    state = resolveEvent(state, limitedEvent, 'c1')
    // Move past cooldown
    state.week = 50
    const available = drawNextEvent(state)
    expect(available?.id).not.toBe('limited-once')

    ALL_EVENTS.pop()
  })

  it('allows draw before maxTotalFirings limit is reached', () => {
    const limitedEvent: EventCard = {
      id: 'limited-three',
      title: 'Three Shots',
      body: 'Fires up to 3 times',
      severity: 'low',
      category: 'economy',
      isRecurring: true,
      cooldownWeeks: 1,
      maxTotalFirings: 3,
      triggerCondition: () => true,
      choices: [{ id: 'c1', label: 'OK', description: '', immediate: {}, factionImpact: {} }],
    }
    ALL_EVENTS.push(limitedEvent)

    const state = clone(STARTING_STATE)
    // Fired 0 times — should be available
    const event = drawNextEvent(state)
    expect(event?.id).toBe('limited-three')

    ALL_EVENTS.pop()
  })

  it('all routine events have maxTotalFirings set', () => {
    const routineIds = [
      'routine-budget-allocation',
      'routine-media-cycle',
      'routine-igr-optimisation',
      'routine-security-assessment',
      'routine-maintenance-cycle',
      'routine-youth-engagement',
      'routine-constituency-visit',
      'routine-sanitation-drive',
    ]
    for (const id of routineIds) {
      const event = ALL_EVENTS.find((e) => e.id === id)
      expect(event, `${id} not found`).toBeDefined()
      expect(event!.maxTotalFirings, `${id} missing maxTotalFirings`).toBeGreaterThan(0)
    }
  })
})

// ── capital-flight-warning ───────────────────────────────────────────────────

describe('capital-flight-warning event', () => {
  it('exists in ALL_EVENTS', () => {
    const event = ALL_EVENTS.find((e) => e.id === 'capital-flight-warning')
    expect(event).toBeDefined()
    expect(event!.isRecurring).toBe(true)
  })

  it('only triggers when corruptionPressure >= 70', () => {
    const event = ALL_EVENTS.find((e) => e.id === 'capital-flight-warning')!
    const lowCorruption = { ...clone(STARTING_STATE), stats: { ...STARTING_STATE.stats, corruptionPressure: 60 } }
    const highCorruption = { ...clone(STARTING_STATE), stats: { ...STARTING_STATE.stats, corruptionPressure: 70 } }
    expect(event.triggerCondition!(lowCorruption)).toBe(false)
    expect(event.triggerCondition!(highCorruption)).toBe(true)
  })

  it('anti-corruption-audit reduces corruptionPressure and business community gains', () => {
    const event = ALL_EVENTS.find((e) => e.id === 'capital-flight-warning')!
    const state = { ...clone(STARTING_STATE), stats: { ...STARTING_STATE.stats, corruptionPressure: 75 } }
    const result = resolveEvent(state, event, 'anti-corruption-audit')
    expect(result.stats.corruptionPressure).toBeLessThan(75)
    expect(result.factions.businessCommunity).toBeGreaterThan(STARTING_STATE.factions.businessCommunity)
  })

  it('ignore-warning reduces igr and increases corruptionPressure', () => {
    const event = ALL_EVENTS.find((e) => e.id === 'capital-flight-warning')!
    const state = { ...clone(STARTING_STATE), stats: { ...STARTING_STATE.stats, corruptionPressure: 75 } }
    const result = resolveEvent(state, event, 'ignore-warning')
    expect(result.stats.igr).toBeLessThan(state.stats.igr)
    expect(result.stats.corruptionPressure).toBeGreaterThan(75)
    expect(result.factions.businessCommunity).toBeLessThan(STARTING_STATE.factions.businessCommunity)
  })

  it('dispute-report reduces igr without touching corruptionPressure', () => {
    const event = ALL_EVENTS.find((e) => e.id === 'capital-flight-warning')!
    const state = { ...clone(STARTING_STATE), stats: { ...STARTING_STATE.stats, corruptionPressure: 75 } }
    const result = resolveEvent(state, event, 'dispute-report')
    expect(result.stats.igr).toBeLessThan(state.stats.igr)
    expect(result.stats.corruptionPressure).toBe(75) // unchanged
  })

  it('triggers in drawNextEvent when corruptionPressure >= 70', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const state = {
      ...clone(STARTING_STATE),
      stats: { ...STARTING_STATE.stats, corruptionPressure: 75 },
    }
    const event = drawNextEvent(state)
    expect(event?.id).toBe('capital-flight-warning')
    vi.restoreAllMocks()
  })
})

// ── party-summit-offer ───────────────────────────────────────────────────────

describe('party-summit-offer event', () => {
  it('exists in ALL_EVENTS', () => {
    const event = ALL_EVENTS.find((e) => e.id === 'party-summit-offer')
    expect(event).toBeDefined()
    expect(event!.isRecurring).toBe(true)
  })

  it('only triggers when godfathers < 25, week > 52, and impeachmentStage === 0', () => {
    const event = ALL_EVENTS.find((e) => e.id === 'party-summit-offer')!
    const base = clone(STARTING_STATE)

    // All conditions met
    const triggered = { ...base, week: 60, factions: { ...base.factions, partyGodfathers: 20 }, impeachmentStage: 0 }
    expect(event.triggerCondition!(triggered)).toBe(true)

    // godfathers too high
    const tooHigh = { ...base, week: 60, factions: { ...base.factions, partyGodfathers: 30 }, impeachmentStage: 0 }
    expect(event.triggerCondition!(tooHigh)).toBe(false)

    // too early
    const tooEarly = { ...base, week: 40, factions: { ...base.factions, partyGodfathers: 20 }, impeachmentStage: 0 }
    expect(event.triggerCondition!(tooEarly)).toBe(false)

    // already impeached
    const impeached = { ...base, week: 60, factions: { ...base.factions, partyGodfathers: 20 }, impeachmentStage: 1 }
    expect(event.triggerCondition!(impeached)).toBe(false)
  })

  it('attend-make-concessions gives largest godfather boost', () => {
    const event = ALL_EVENTS.find((e) => e.id === 'party-summit-offer')!
    const state = { ...clone(STARTING_STATE), factions: { ...STARTING_STATE.factions, partyGodfathers: 20 } }
    const result = resolveEvent(state, event, 'attend-make-concessions')
    expect(result.factions.partyGodfathers).toBe(40)
    expect(result.stats.politicalCapital).toBe(85) // 100 - 15
  })

  it('boycott-summit reduces godfathers further', () => {
    const event = ALL_EVENTS.find((e) => e.id === 'party-summit-offer')!
    const state = { ...clone(STARTING_STATE), factions: { ...STARTING_STATE.factions, partyGodfathers: 20 } }
    const result = resolveEvent(state, event, 'boycott-summit')
    expect(result.factions.partyGodfathers).toBe(10)
    expect(result.factions.civilSocietyMedia).toBeGreaterThan(STARTING_STATE.factions.civilSocietyMedia)
  })
})

// ── impeachment 3-stage chain ─────────────────────────────────────────────────

describe('3-stage impeachment arc', () => {
  beforeEach(() => vi.spyOn(Math, 'random').mockReturnValue(0.5))
  afterEach(() => vi.restoreAllMocks())

  it('queues removal-resolution-reading (not old first-reading id) on low godfathers', () => {
    const state = {
      ...clone(STARTING_STATE),
      week: 53,
      factions: { ...STARTING_STATE.factions, partyGodfathers: 8 },
    }
    const result = tick(state)
    expect(result.eventQueue.some((e) => e.id === 'removal-resolution-reading')).toBe(true)
    expect(result.eventQueue.some((e) => e.id === 'removal-resolution-first-reading')).toBe(false)
  })

  it('stage-2 committee event exists in ALL_EVENTS and can be chained', () => {
    const committee = ALL_EVENTS.find((e) => e.id === 'removal-resolution-committee')
    expect(committee).toBeDefined()
    expect(committee!.severity).toBe('critical')
  })

  it('stage-3 floor vote event exists in ALL_EVENTS', () => {
    const floorVote = ALL_EVENTS.find((e) => e.id === 'removal-resolution-floor-vote')
    expect(floorVote).toBeDefined()
    const acceptChoice = floorVote!.choices.find((c) => c.id === 'accept-outcome')
    expect(acceptChoice!.setFlags?.['conceded-to-assembly']).toBe(true)
  })

  it('conceded-to-assembly flag triggers game over on next tick', () => {
    const state = {
      ...clone(STARTING_STATE),
      week: 54,
      impeachmentStage: 1,
      factions: { ...STARTING_STATE.factions, partyGodfathers: 8 },
      stateFlags: { 'conceded-to-assembly': true },
    }
    const result = tick(state)
    expect(result.isGameOver).toBe(true)
    expect(result.impeachmentStage).toBe(2)
  })

  it('does not re-queue removal event when impeachmentStage is already 1', () => {
    const state = {
      ...clone(STARTING_STATE),
      week: 55,
      impeachmentStage: 1,
      factions: { ...STARTING_STATE.factions, partyGodfathers: 8 },
      eventQueue: [],
    }
    const result = tick(state)
    const queued = result.eventQueue.filter((e) => e.id === 'removal-resolution-reading')
    expect(queued).toHaveLength(0)
  })

  it('resets impeachmentStage to 0 when godfathers recover to >= 20', () => {
    const state = {
      ...clone(STARTING_STATE),
      week: 55,
      impeachmentStage: 1,
      factions: { ...STARTING_STATE.factions, partyGodfathers: 22 },
      eventQueue: [{ id: 'removal-resolution-reading', title: '', body: '', severity: 'critical' as const, category: 'political' as const, choices: [] }],
    }
    const result = tick(state)
    expect(result.impeachmentStage).toBe(0)
    expect(result.eventQueue.some((e) => e.id === 'removal-resolution-reading')).toBe(false)
  })
})

// ── grant freeze count ────────────────────────────────────────────────────────

describe('grantFreezeCount tracking', () => {
  beforeEach(() => vi.spyOn(Math, 'random').mockReturnValue(0.5))
  afterEach(() => vi.restoreAllMocks())

  it('increments grantFreezeCount on each freeze', () => {
    // Set up state where corruption streak >= 3 and no active freeze
    const state = {
      ...clone(STARTING_STATE),
      highCorruptionWeeks: 3,
      grantFreezeDuration: 0,
      grantFreezeCount: 0,
      stats: { ...STARTING_STATE.stats, corruptionPressure: 80 },
    }
    const result = tick(state)
    expect(result.grantFreezeCount).toBe(1)
    expect(result.grantFreezeDuration).toBeGreaterThan(0)
  })

  it('does not double-freeze when grantFreezeDuration already active', () => {
    const state = {
      ...clone(STARTING_STATE),
      highCorruptionWeeks: 4,
      grantFreezeDuration: 5,
      grantFreezeCount: 1,
      stats: { ...STARTING_STATE.stats, corruptionPressure: 80 },
    }
    const result = tick(state)
    expect(result.grantFreezeCount).toBe(1) // not incremented
  })
})

// ── tickInitiative deduplication guard ────────────────────────────────────────

describe('tickInitiative completion event deduplication', () => {
  beforeEach(() => vi.spyOn(Math, 'random').mockReturnValue(0.5))
  afterEach(() => vi.restoreAllMocks())

  it('does not enqueue completion event if already in resolvedEvents', () => {
    const state = {
      ...clone(STARTING_STATE),
      activeInitiative: {
        id: 'paye-enforcement',
        name: 'PAYE Enforcement Drive',
        weeksRemaining: 1,
        totalWeeks: 10,
        completionEventId: 'paye-enforcement-result',
      },
      resolvedEvents: ['paye-enforcement-result'],
    }
    const result = tick(state)
    expect(result.activeInitiative).toBeNull()
    expect(result.eventQueue.some((e) => e.id === 'paye-enforcement-result')).toBe(false)
  })

  it('does not enqueue completion event if already queued', () => {
    const completionEvent = ALL_EVENTS.find((e) => e.id === 'paye-enforcement-result')!
    const state = {
      ...clone(STARTING_STATE),
      activeInitiative: {
        id: 'paye-enforcement',
        name: 'PAYE Enforcement Drive',
        weeksRemaining: 1,
        totalWeeks: 10,
        completionEventId: 'paye-enforcement-result',
      },
      eventQueue: [completionEvent],
    }
    const result = tick(state)
    expect(result.activeInitiative).toBeNull()
    // Should still have only one copy in queue
    const count = result.eventQueue.filter((e) => e.id === 'paye-enforcement-result').length
    expect(count).toBe(1)
  })
})

// ── export versioning ────────────────────────────────────────────────────────

describe('export versioning', () => {
  it('SAVE_VERSION is a positive integer', () => {
    expect(typeof SAVE_VERSION).toBe('number')
    expect(SAVE_VERSION).toBeGreaterThan(0)
    expect(Number.isInteger(SAVE_VERSION)).toBe(true)
  })

  it('persistence saveGame embeds version field', () => {
    const stored: Record<string, string> = {}
    const mockStorage = {
      getItem: (k: string) => stored[k] ?? null,
      setItem: (k: string, v: string) => { stored[k] = v },
      removeItem: (k: string) => { delete stored[k] },
    }
    vi.stubGlobal('localStorage', mockStorage)

    saveGame(clone(STARTING_STATE))
    const raw = stored['lagos-governor-sim-save']
    expect(raw).toBeDefined()
    const parsed = JSON.parse(raw)
    expect(parsed.version).toBe(SAVE_VERSION)

    vi.unstubAllGlobals()
  })

  it('loadGame still works on saves without version field (backwards compat)', () => {
    const stored: Record<string, string> = {}
    const mockStorage = {
      getItem: (k: string) => stored[k] ?? null,
      setItem: (k: string, v: string) => { stored[k] = v },
      removeItem: (k: string) => { delete stored[k] },
    }
    vi.stubGlobal('localStorage', mockStorage)

    // Save without version
    const bare = { ...clone(STARTING_STATE), activeEventId: null, eventQueueIds: [] }
    delete (bare as Record<string, unknown>)['activeEvent']
    delete (bare as Record<string, unknown>)['eventQueue']
    stored['lagos-governor-sim-save'] = JSON.stringify(bare)

    const loaded = loadGame()
    expect(loaded).not.toBeNull()
    expect(loaded!.week).toBe(STARTING_STATE.week)

    vi.unstubAllGlobals()
  })
})
