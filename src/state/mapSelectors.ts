import { CITY_ZONES, type ZoneType } from '../data/lagosLayout'
import type { ConstituencyKey, GameState } from './types'

// ── Lens type — drives colour ramp in the night map ──────────────────────────
export type MapLens = 'approval' | 'infrastructure' | 'security' | 'youth'

export interface ZoneMapState {
  id: string
  parentConstituencies: ConstituencyKey[]
  trust: number // weighted toward worst constituent (0-100)
  infrastructure: number // trust-adjusted per-zone infra (0-100)
  security: number // global securityIndex (0-100)
  youthTension: number // global youthTension (0-100)
  population: number // static proxy — zone density
  powerDeficit: number
  activeEvents: string[]
  crisisState: 'none' | 'warning' | 'crisis'
}

export interface MapState {
  zones: ZoneMapState[]
  globalEvent: 'none' | 'blackout' | 'dawn' | 'flood'
  lens: MapLens
}

// Per-zone infrastructure multiplier (structural — towers privately maintained,
// stilt zones chronically under-served).
const INFRA_MULT: Record<ZoneType, number> = {
  towers: 1.4,
  'mid-rise': 1.15,
  'dense-low': 0.85,
  'sprawl-low': 0.7,
  port: 0.75,
  stilt: 0.25,
  lagoon: 0,
  atlantic: 0,
}

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v))
}

// Weighted toward the weakest constituent: avg×0.55 + min×0.45.
// This means ONE failing LGA in a zone makes the whole zone read as stressed —
// matching what the polling panel shows (Lagos Mainland 20% drags mainland zone).
function zoneApproval(state: GameState, keys: ConstituencyKey[]): number {
  if (keys.length === 0) return 50
  const values = keys.map((k) => state.constituencyApproval[k] ?? 50)
  const avg = values.reduce((a, b) => a + b, 0) / values.length
  const min = Math.min(...values)
  return avg * 0.55 + min * 0.45
}

function crisisState(trust: number): ZoneMapState['crisisState'] {
  if (trust >= 55) return 'none'
  if (trust >= 35) return 'warning'
  return 'crisis'
}

export function selectMapState(state: GameState, lens: MapLens = 'approval'): MapState {
  const globalInfra = state.stats.infrastructureScore
  const globalSec = state.stats.securityIndex
  const globalYouth = state.stats.youthTension

  const zones: ZoneMapState[] = CITY_ZONES.map((zone) => {
    const trust = zoneApproval(state, zone.parentConstituencies)

    // Trust-adjusted infra: a zone with collapsing approval also loses effective
    // infrastructure (services degrade, maintenance stops). Range ±20 pts.
    const baseInfra = globalInfra * INFRA_MULT[zone.type]
    const trustAdj = (trust - 50) * 0.4
    const infra = clamp(baseInfra + trustAdj, 5, 95)

    return {
      id: zone.id,
      parentConstituencies: zone.parentConstituencies,
      trust,
      infrastructure: infra,
      security: globalSec,
      youthTension: globalYouth,
      population: zone.density,
      powerDeficit: Math.max(0, 60 - infra),
      activeEvents: [],
      crisisState: crisisState(trust),
    }
  })

  return { zones, globalEvent: 'none', lens }
}
