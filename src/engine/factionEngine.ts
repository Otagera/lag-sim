import type { FactionDelta, FactionState, GameState } from '../state/types'

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

export function drift(): FactionDelta {
  return {}
}
