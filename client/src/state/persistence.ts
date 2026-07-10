import { STARTING_STATE } from '../data/startingState'
import { ALL_EVENTS } from '../engine/eventEngine'
import { SAVE_VERSION } from '../version'
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

function migrateV3toV4(raw: RawSaveData): RawSaveData {
  // v4 adds currentTerm for second-term re-election play; all existing saves are term 1
  return { ...raw, currentTerm: 1, version: 4 }
}

function migrateV4toV5(raw: RawSaveData): RawSaveData {
  // v5 adds goal tracking; existing saves have no goal selected
  return { ...raw, selectedGoalId: null, version: 5 }
}

function migrateV5toV6(raw: RawSaveData): RawSaveData {
  // v6 adds projectStatuses + commissionedProjects for the Projects system
  return { ...raw, projectStatuses: {}, commissionedProjects: [], version: 6 }
}

function migrateV6toV7(raw: RawSaveData): RawSaveData {
  // v7 is the 0.7 beta batch. No GameState shape change; stamp saves forward.
  return { ...raw, version: 7 }
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
  if (version < 4) data = migrateV3toV4(data)
  if (version < 5) data = migrateV4toV5(data)
  if (version < 6) data = migrateV5toV6(data)
  if (version < 7) data = migrateV6toV7(data)

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
