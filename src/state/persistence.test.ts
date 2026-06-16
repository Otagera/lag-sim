import { describe, it, expect, beforeEach } from 'vitest'
import { STARTING_STATE } from '../data/startingState'
import { saveGame, loadGame, hasSavedGame, clearSave } from './persistence'
import type { GameState } from './types'
import { ALL_EVENTS } from '../engine/eventEngine'

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
