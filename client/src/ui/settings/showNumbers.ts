import { useSyncExternalStore } from 'react'

/**
 * "Show the numbers" — whether panels lead with raw values (opinion scores,
 * ledger entries, pressure) or with faces, tone and prose. Both layers stay
 * reachable either way; this only sets the emphasis.
 *
 * Default: off for a first-time player on this device, on for everyone else.
 * The default is decided once at boot (before the first save is written) and
 * then persisted, so it doesn't flip after the first autosave.
 */

const KEY = 'excellency-show-numbers'
// Existing device-level keys that mean "has played before"
const SAVE_KEY = 'lagos-governor-sim-save'
const TOUR_KEY = 'lagos-governor-sim-tour-done'

let current = true
const listeners = new Set<() => void>()

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // storage unavailable — keep the in-memory value
  }
}

/** Call once at startup, before any game state is saved. */
export function initShowNumbers(): void {
  const stored = safeGet(KEY)
  if (stored === '1' || stored === '0') {
    current = stored === '1'
    return
  }
  const returning = safeGet(SAVE_KEY) !== null || safeGet(TOUR_KEY) === '1'
  current = returning
  safeSet(KEY, current ? '1' : '0')
}

export function getShowNumbers(): boolean {
  return current
}

export function setShowNumbers(value: boolean): void {
  current = value
  safeSet(KEY, value ? '1' : '0')
  for (const l of listeners) l()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useShowNumbers(): [boolean, (value: boolean) => void] {
  const value = useSyncExternalStore(subscribe, getShowNumbers, getShowNumbers)
  return [value, setShowNumbers]
}
