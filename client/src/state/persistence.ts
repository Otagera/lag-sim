import { STARTING_STATE } from '../data/startingState'
import { ALL_EVENTS } from '../engine/eventEngine'
import { MIN_LOADABLE_SAVE_VERSION, SAVE_VERSION } from '../version'
import type { EventCard, GameState } from './types'

const SAVE_KEY = 'lagos-governor-sim-save'
const HINTS_KEY = 'lagos-governor-sim-seen-hints'
const TOUR_KEY = 'lagos-governor-sim-tour-done'

export type SerializableState = Omit<GameState, 'activeEvent' | 'eventQueue'> & {
  version: number
  activeEventId: string | null
  eventQueueIds: string[]
  savedAt?: string
}

type RawSaveData = Record<string, unknown>

function lookupEvent(id: string): EventCard | undefined {
  return ALL_EVENTS.find((e) => e.id === id)
}

export function toSerializable(state: GameState): SerializableState {
  const { activeEvent, eventQueue, ...rest } = state
  return {
    ...rest,
    version: SAVE_VERSION,
    activeEventId: activeEvent?.id ?? null,
    eventQueueIds: eventQueue.map((e) => e.id),
    savedAt: new Date().toISOString(),
  }
}

export function fromSerializable(data: SerializableState): GameState {
  const { activeEventId, eventQueueIds, ...rest } = data

  const activeEvent = activeEventId ? (lookupEvent(activeEventId) ?? null) : null
  const eventQueue = eventQueueIds
    .map((id) => lookupEvent(id))
    .filter((e): e is EventCard => e !== undefined)

  // Merge with STARTING_STATE so missing fields from old saves get defaults
  return { ...STARTING_STATE, ...rest, activeEvent, eventQueue }
}

// ── Version gate ──────────────────────────────────────────────────────────────

let discardedOldSave = false

/** True once if the last load threw away a save from an older, incompatible version. */
export function consumeDiscardedSaveNotice(): boolean {
  const was = discardedOldSave
  discardedOldSave = false
  return was
}

/** Whether a raw save (local or cloud) can be loaded by this version. */
export function isLoadableSave(raw: RawSaveData): boolean {
  const version = typeof raw.version === 'number' ? raw.version : 1
  return version >= MIN_LOADABLE_SAVE_VERSION
}

/**
 * Validates a raw save against the current version. Saves older than
 * MIN_LOADABLE_SAVE_VERSION are not migrated (breaking change in v8) — returns null.
 */
export function migrate(raw: RawSaveData): SerializableState | null {
  const version = typeof raw.version === 'number' ? raw.version : 1
  if (version < MIN_LOADABLE_SAVE_VERSION) return null
  if (version > SAVE_VERSION) {
    console.warn(
      `[persistence] Save version ${version} is newer than game version ${SAVE_VERSION}. ` +
        `Loading anyway — some features may not work correctly.`,
    )
  }
  return raw as SerializableState
}

// ── Public API ────────────────────────────────────────────────────────────────

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
    const parsed = JSON.parse(raw) as RawSaveData
    if (!parsed || typeof parsed.week !== 'number') return null
    const migrated = migrate(parsed)
    if (!migrated) {
      localStorage.removeItem(SAVE_KEY)
      discardedOldSave = true
      return null
    }
    return fromSerializable(migrated)
  } catch (e) {
    console.warn('Failed to load saved game:', e)
    return null
  }
}

export function hasSavedGame(): boolean {
  const raw = localStorage.getItem(SAVE_KEY)
  if (raw === null) return false
  try {
    const parsed = JSON.parse(raw) as RawSaveData
    if (!isLoadableSave(parsed)) {
      localStorage.removeItem(SAVE_KEY)
      discardedOldSave = true
      return false
    }
  } catch {
    return false
  }
  return true
}

export function clearSave(): void {
  localStorage.removeItem(SAVE_KEY)
}

const HINTS_SEPARATOR = ','

export function saveSeenHints(ids: string[]): void {
  try {
    localStorage.setItem(HINTS_KEY, ids.join(HINTS_SEPARATOR))
  } catch (e) {
    console.warn('Failed to save seen hints:', e)
  }
}

export function loadSeenHints(): string[] {
  try {
    const raw = localStorage.getItem(HINTS_KEY)
    if (!raw) return []
    return raw.split(HINTS_SEPARATOR).filter(Boolean)
  } catch {
    return []
  }
}

/** Whether the onboarding tour has been completed on this device (survives new game). */
export function hasSeenTour(): boolean {
  try {
    return localStorage.getItem(TOUR_KEY) === '1'
  } catch {
    return false
  }
}

/** Mark the onboarding tour as seen (persists across saves). */
export function markTourSeen(): void {
  try {
    localStorage.setItem(TOUR_KEY, '1')
  } catch {
    // localStorage unavailable — non-critical
  }
}
