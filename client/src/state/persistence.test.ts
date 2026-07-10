import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { STARTING_STATE } from '../data/startingState'
import { saveGame, loadGame, hasSavedGame, clearSave, migrate } from './persistence'
import type { GameState } from './types'
import { ALL_EVENTS } from '../engine/eventEngine'
import { SAVE_VERSION } from '../version'

const STORAGE_KEY = 'lagos-governor-sim-save'

function clone(s: GameState): GameState {
  return JSON.parse(JSON.stringify(s))
}

const store = new Map<string, string>()

Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
    get length() { return store.size },
    key: (i: number) => [...store.keys()][i] ?? null,
  },
  configurable: true,
})

beforeEach(() => {
  store.clear()
})

describe('saveGame / loadGame', () => {
  it('saves and loads game state', () => {
    const state = clone(STARTING_STATE)
    saveGame(state)
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull()
    const loaded = loadGame()
    expect(loaded).not.toBeNull()
    expect(loaded!.week).toBe(1)
    expect(loaded!.stats.cashReserve).toBe(45)
    expect(loaded!.factions.partyGodfathers).toBe(65)
  })

  it('returns null when no save exists', () => {
    expect(hasSavedGame()).toBe(false)
    expect(loadGame()).toBeNull()
  })

  it('activeEvent is reconstructed from ID on load', () => {
    const state = clone(STARTING_STATE)
    // Set an active event
    const event = ALL_EVENTS[0]
    if (event) {
      state.activeEvent = event
    }
    saveGame(state)
    const loaded = loadGame()
    expect(loaded).not.toBeNull()
    if (loaded && event) {
      expect(loaded.activeEvent).not.toBeNull()
      expect(loaded.activeEvent!.id).toBe(event.id)
      expect(loaded.activeEvent!.title).toBe(event.title)
    }
  })

  it('activeEvent is null when saved id does not match any event', () => {
    const raw = JSON.stringify({
      ...STARTING_STATE,
      activeEventId: 'nonexistent-event-id',
      eventQueueIds: [],
    })
    localStorage.setItem(STORAGE_KEY, raw)
    const loaded = loadGame()
    expect(loaded).not.toBeNull()
    expect(loaded!.activeEvent).toBeNull()
  })

  it('reconstructs eventQueue from IDs on load', () => {
    const state = clone(STARTING_STATE)
    state.eventQueue = [ALL_EVENTS[0], ALL_EVENTS[1]].filter(Boolean) as typeof ALL_EVENTS
    saveGame(state)
    const loaded = loadGame()
    expect(loaded).not.toBeNull()
    expect(loaded!.eventQueue).toHaveLength(2)
  })

  it('hasSavedGame returns true after save', () => {
    expect(hasSavedGame()).toBe(false)
    saveGame(clone(STARTING_STATE))
    expect(hasSavedGame()).toBe(true)
  })

  it('clearSave removes saved data', () => {
    saveGame(clone(STARTING_STATE))
    expect(hasSavedGame()).toBe(true)
    clearSave()
    expect(hasSavedGame()).toBe(false)
  })

  it('handles corrupted JSON gracefully', () => {
    localStorage.setItem(STORAGE_KEY, 'not-valid-json')
    const result = loadGame()
    expect(result).toBeNull()
  })
})

// ── migrate() unit tests ──────────────────────────────────────────────────────

describe('migrate: version detection and chain', () => {
  afterEach(() => vi.restoreAllMocks())

  it('v1 save (no version field) gets stamped with current version', () => {
    const v1Raw = { week: 5, activeEventId: null, eventQueueIds: [] }
    const result = migrate(v1Raw as Record<string, unknown>)
    expect(result.version).toBe(SAVE_VERSION)
  })

  it('v1 save with explicit version: 1 gets migrated to current', () => {
    const v1Raw = { version: 1, week: 10, activeEventId: null, eventQueueIds: [] }
    const result = migrate(v1Raw)
    expect(result.version).toBe(SAVE_VERSION)
  })

  it('current-version save is returned unchanged (no extra mutations)', () => {
    const current = { version: SAVE_VERSION, week: 20, activeEventId: null, eventQueueIds: [] }
    const result = migrate(current)
    expect(result.version).toBe(SAVE_VERSION)
    expect(result.week).toBe(20)
  })

  it('v6 beta-batch saves are stamped forward to current version', () => {
    const v6Raw = {
      version: 6,
      week: 27,
      activeEventId: null,
      eventQueueIds: [],
      projectStatuses: {},
      commissionedProjects: [],
    }
    const result = migrate(v6Raw)
    expect(result.version).toBe(SAVE_VERSION)
    expect(result.week).toBe(27)
  })

  it('future-version save (version > SAVE_VERSION) logs a warning and still returns data', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const futureRaw = { version: SAVE_VERSION + 5, week: 99, activeEventId: null, eventQueueIds: [] }
    const result = migrate(futureRaw)
    expect(warnSpy).toHaveBeenCalledOnce()
    expect(warnSpy.mock.calls[0][0]).toContain('newer than game version')
    // Still returns the data — don't lose a future save
    expect(result.week).toBe(99)
  })

  it('migration preserves all existing fields', () => {
    const v1Raw = {
      week: 42,
      activeEventId: null,
      eventQueueIds: [],
      stats: { cashReserve: 99 },
      factions: { partyGodfathers: 30 },
    }
    const result = migrate(v1Raw as Record<string, unknown>)
    expect((result as Record<string, unknown>).stats).toEqual({ cashReserve: 99 })
    expect((result as Record<string, unknown>).factions).toEqual({ partyGodfathers: 30 })
  })
})

// ── loadGame: migration integration ──────────────────────────────────────────

describe('loadGame: loads and migrates old saves', () => {
  afterEach(() => vi.restoreAllMocks())

  it('loads a v1 save (no version field) and fills missing fields from STARTING_STATE', () => {
    // Simulate what a v1 save looked like: only the original fields, no phase-2 state
    const v1Save = {
      week: 15,
      activeEventId: null,
      eventQueueIds: [],
      stats: { ...STARTING_STATE.stats },
      factions: { ...STARTING_STATE.factions },
      constituencyApproval: { ...STARTING_STATE.constituencyApproval },
      resolvedEvents: ['some-event'],
      // Deliberately missing: deputy, commissioners, activeNPCs, inCampaignMode, etc.
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(v1Save))
    const loaded = loadGame()
    expect(loaded).not.toBeNull()
    expect(loaded!.week).toBe(15)
    // STARTING_STATE defaults fill in missing phase-2 fields
    expect(loaded!.deputy).toBeNull()
    expect(loaded!.commissioners).toEqual({})
    expect(loaded!.inCampaignMode).toBe(false)
    expect(loaded!.resolvedEvents).toContain('some-event')
  })

  it('loaded v1 save has STARTING_STATE defaults for all missing phase-2 NPC fields', () => {
    const v1Save = {
      week: 8,
      activeEventId: null,
      eventQueueIds: [],
      stats: { ...STARTING_STATE.stats },
      factions: { ...STARTING_STATE.factions },
      constituencyApproval: { ...STARTING_STATE.constituencyApproval },
      resolvedEvents: [],
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(v1Save))
    const loaded = loadGame()
    expect(loaded).not.toBeNull()
    expect(loaded!.activeNPCs.npc1.isActive).toBe(false)
    expect(loaded!.activeNPCs.npc2.isActive).toBe(false)
    expect(loaded!.activeNPCs.npc3.isActive).toBe(false)
  })

  it('round-trip: save v2 game and reload produces identical state', () => {
    const state = clone(STARTING_STATE)
    state.week = 30
    state.stats.cashReserve = 77
    state.factions.partyGodfathers = 42
    saveGame(state)
    const loaded = loadGame()
    expect(loaded).not.toBeNull()
    expect(loaded!.week).toBe(30)
    expect(loaded!.stats.cashReserve).toBe(77)
    expect(loaded!.factions.partyGodfathers).toBe(42)
  })

  it('saved game embeds current SAVE_VERSION', () => {
    saveGame(clone(STARTING_STATE))
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    expect(raw.version).toBe(SAVE_VERSION)
  })
})
