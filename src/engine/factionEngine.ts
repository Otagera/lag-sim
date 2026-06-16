import type { FactionDelta, FactionKey, FactionState, GameState } from '../state/types'

const DRIFT_FACTOR = 2
const NEUTRAL = 50

const DRIFTING_FACTIONS: FactionKey[] = [
  'businessCommunity',
  'informalEconomy',
  'federalGovt',
  'civilSocietyMedia',
  'lgChairmen',
]

export function applyFactionDelta(factions: FactionState, delta: FactionDelta): FactionState {
  const updated = { ...factions }
  for (const [key, change] of Object.entries(delta)) {
    if (change === undefined) continue
    const current = updated[key as keyof typeof updated]
    updated[key as keyof typeof updated] = Math.max(-100, Math.min(100, current + change))
  }
  return updated
}

export function applyFactionDeltaState(state: GameState, delta: FactionDelta): GameState {
  return { ...state, factions: applyFactionDelta(state.factions, delta) }
}

export function drift(factions: FactionState): FactionDelta {
  const delta: FactionDelta = {}
  for (const key of DRIFTING_FACTIONS) {
    const current = factions[key]
    if (current > NEUTRAL) {
      delta[key] = -DRIFT_FACTOR
    } else if (current < NEUTRAL) {
      delta[key] = DRIFT_FACTOR
    }
  }
  return delta
}
