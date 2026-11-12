import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { STARTING_STATE } from '../data/startingState'
import {
  clearSave,
  consumeDiscardedSaveNotice,
  hasSavedGame,
  isLoadableSave,
  loadGame,
  migrate,
  saveGame,
} from './persistence'
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
      version: SAVE_VERSION,
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

// ── Version gate (v8 breaking change: no migrations) ─────────────────────────

describe('migrate: version gate', () => {
  afterEach(() => vi.restoreAllMocks())

  it('rejects saves without a version field (v1)', () => {
    expect(migrate({ week: 5, activeEventId: null, eventQueueIds: [] })).toBeNull()
  })

  it('rejects saves older than MIN_LOADABLE_SAVE_VERSION', () => {
    expect(migrate({ version: 7, week: 10, activeEventId: null, eventQueueIds: [] })).toBeNull()
  })

  it('accepts current-version saves unchanged', () => {
    const current = { version: SAVE_VERSION, week: 20, activeEventId: null, eventQueueIds: [] }
    const result = migrate(current)
    expect(result?.version).toBe(SAVE_VERSION)
    expect(result?.week).toBe(20)
  })

  it('future-version save logs a warning and still returns data', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const result = migrate({ version: SAVE_VERSION + 5, week: 99, activeEventId: null, eventQueueIds: [] })
    expect(warnSpy).toHaveBeenCalledOnce()
    expect(result?.week).toBe(99)
  })
})

describe('loadGame / hasSavedGame: old saves are discarded', () => {
  it('loadGame returns null for a v7 save, removes it, and raises the notice once', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 7, week: 15, activeEventId: null, eventQueueIds: [] }))
    expect(loadGame()).toBeNull()
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    expect(consumeDiscardedSaveNotice()).toBe(true)
    expect(consumeDiscardedSaveNotice()).toBe(false)
  })

  it('hasSavedGame is false for an incompatible save and discards it', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 6, week: 30 }))
    expect(hasSavedGame()).toBe(false)
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    expect(consumeDiscardedSaveNotice()).toBe(true)
  })

  it('isLoadableSave mirrors the gate', () => {
    expect(isLoadableSave({ version: SAVE_VERSION })).toBe(true)
    expect(isLoadableSave({ version: 7 })).toBe(false)
    expect(isLoadableSave({})).toBe(false)
  })

  it('round-trip: save and reload produces identical state, including ledgers', () => {
    const state = clone(STARTING_STATE)
    state.week = 30
    state.stats.cashReserve = 77
    state.fashemuLedger = [{ reason: 'refused-him', value: -20, week: 12, decay: 'slow' }]
    saveGame(state)
    const loaded = loadGame()
    expect(loaded).not.toBeNull()
    expect(loaded!.week).toBe(30)
    expect(loaded!.stats.cashReserve).toBe(77)
    expect(loaded!.fashemuLedger).toEqual(state.fashemuLedger)
  })

  it('saved game embeds current SAVE_VERSION', () => {
    saveGame(clone(STARTING_STATE))
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    expect(raw.version).toBe(SAVE_VERSION)
  })
})
