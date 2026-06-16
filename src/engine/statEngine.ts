import type { GameState, StatDelta, StatKey } from '../state/types'

const BOUNDS: Partial<Record<StatKey, { min: number; max: number }>> = {
  publicTrust: { min: 0, max: 100 },
  infrastructureScore: { min: 0, max: 100 },
  securityIndex: { min: 0, max: 100 },
  politicalCapital: { min: 0, max: 200 },
  corruptionPressure: { min: 15, max: 80 },
  federalRelationship: { min: -50, max: 50 },
  igr: { min: 0, max: Infinity },
  expenditure: { min: 0, max: Infinity },
  youthTension: { min: 0, max: 100 },
}

export function applyDelta(state: GameState, delta: StatDelta): GameState {
  const newStats = { ...state.stats }

  for (const [key, change] of Object.entries(delta)) {
    if (change === undefined) continue
    const statKey = key as StatKey
    const current = newStats[statKey]
    const raw = current + change
    const bounds = BOUNDS[statKey]
    newStats[statKey] = bounds ? Math.max(bounds.min, Math.min(bounds.max, raw)) : raw
  }

  return { ...state, stats: newStats }
}
