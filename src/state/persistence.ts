import { STARTING_STATE } from '../data/startingState'
import { ALL_EVENTS } from '../engine/eventEngine'
import { SAVE_VERSION } from '../version'
import type { EventCard, GameState } from './types'

const SAVE_KEY = 'lagos-governor-sim-save'

type SerializableState = Omit<GameState, 'activeEvent' | 'eventQueue'> & {
  version: number
  activeEventId: string | null
  eventQueueIds: string[]
}

type RawSaveData = Record<string, unknown>

function lookupEvent(id: string): EventCard | undefined {
  return ALL_EVENTS.find((e) => e.id === id)
}

function toSerializable(state: GameState): SerializableState {
  const { activeEvent, eventQueue, ...rest } = state
  return {
    ...rest,
    version: SAVE_VERSION,
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

// ── Migration chain ───────────────────────────────────────────────────────────

function migrateV1toV2(raw: RawSaveData): RawSaveData {
  // v1 had no `version` field. All new phase-2 fields (deputy, commissioners,
  // activeNPCs, inCampaignMode, etc.) are handled by the STARTING_STATE merge
  // in fromSerializable — no structural renames needed, purely additive.
  return { ...raw, version: 2 }
}

function migrateV2toV3(raw: RawSaveData): RawSaveData {
  // v3 adds choiceUseCounts for diminishing returns tracking; default to empty object
  return { ...raw, choiceUseCounts: {}, version: 3 }
}

/**
 * Applies any needed migrations to bring a raw save up to SAVE_VERSION.
 * Exported so persistence tests can verify migration logic in isolation.
 */
export function migrate(raw: RawSaveData): SerializableState {
  const version = typeof raw.version === 'number' ? raw.version : 1

  if (version > SAVE_VERSION) {
    console.warn(
      `[persistence] Save version ${version} is newer than game version ${SAVE_VERSION}. ` +
        `Loading anyway — some features may not work correctly.`,
    )
    return raw as SerializableState
  }

  let data: RawSaveData = raw
  if (version < 2) data = migrateV1toV2(data)
  if (version < 3) data = migrateV2toV3(data)

  return data as SerializableState
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
    return fromSerializable(migrated)
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
