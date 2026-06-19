import { STARTING_STATE } from '../data/startingState'
import { ALL_EVENTS } from '../engine/eventEngine'
import type { EventCard, GameState } from './types'

const SAVE_KEY = 'lagos-governor-sim-save'

type SerializableState = Omit<GameState, 'activeEvent' | 'eventQueue'> & {
  activeEventId: string | null
  eventQueueIds: string[]
}

function lookupEvent(id: string): EventCard | undefined {
  return ALL_EVENTS.find((e) => e.id === id)
}

function toSerializable(state: GameState): SerializableState {
  const { activeEvent, eventQueue, ...rest } = state
  return {
    ...rest,
    activeEventId: activeEvent?.id ?? null,
    eventQueueIds: eventQueue.map((e) => e.id),
  }
}

function fromSerializable(data: SerializableState): GameState {
  const { activeEventId, eventQueueIds, ...rest } = data

  const activeEvent = activeEventId ? (lookupEvent(activeEventId) ?? null) : null
  const eventQueue = eventQueueIds
    .map((id) => lookupEvent(id))
    .filter((e): e is EventCard => e !== undefined)

  // Merge with STARTING_STATE so missing fields from old saves get defaults
  return { ...STARTING_STATE, ...rest, activeEvent, eventQueue }
}

export function saveGame(state: GameState): void {
  try {
    const serializable = toSerializable(state)
    localStorage.setItem(SAVE_KEY, JSON.stringify(serializable))
  } catch (e) {
    console.warn('Failed to save game:', e)
  }
}

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as SerializableState
    if (!data || typeof data.week !== 'number') return null
    return fromSerializable(data)
  } catch (e) {
    console.warn('Failed to load saved game:', e)
    return null
  }
}

export function hasSavedGame(): boolean {
  return localStorage.getItem(SAVE_KEY) !== null
}

export function clearSave(): void {
  localStorage.removeItem(SAVE_KEY)
}
