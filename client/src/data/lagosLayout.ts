import type { ConstituencyKey } from '../state/types'

export type ZoneType =
  | 'dense-low'
  | 'sprawl-low'
  | 'mid-rise'
  | 'towers'
  | 'stilt'
  | 'port'
  | 'lagoon'
  | 'atlantic'

export interface LagosZone {
  id: string
  label: string
  parentConstituencies: ConstituencyKey[]
  aMin: number
  aMax: number
  bMin: number
  bMax: number
  type: ZoneType
  density: number // 0–1 probability a grid cell gets a building
}

// Iso grid is ~100×80 units. Origin (0,0) maps to NW corner.
// a-axis runs NE, b-axis runs SE.
// Mainland is NW (low a, low b), Lekki is SE (high a, high b).
export const LAGOS_ZONES: LagosZone[] = [
  {
    id: 'mainland',
    label: 'Mainland',
    parentConstituencies: [
      'mushin',
      'surulere',
      'oshodiIsolo',
      'shomolu',
      'lagosMainland',
      'ikeja',
      'kosofe',
    ],
    aMin: 2,
    aMax: 42,
    bMin: 2,
    bMax: 36,
    type: 'dense-low',
    density: 0.55,
  },
  {
    id: 'ikorodu',
    label: 'Ikorodu',
    parentConstituencies: ['ikorodu', 'epe'],
    aMin: 2,
    aMax: 24,
    bMin: 42,
    bMax: 68,
    type: 'sprawl-low',
    density: 0.28,
  },
  {
    id: 'alimosho',
    label: 'Alimosho',
    parentConstituencies: ['alimosho', 'agege', 'ifakoIjaye'],
    aMin: 28,
    aMax: 52,
    bMin: 2,
    bMax: 18,
    type: 'dense-low',
    density: 0.45,
  },
  {
    id: 'apapa',
    label: 'Apapa',
    parentConstituencies: ['apapa', 'amuwoOdofin', 'ajeromiIfelodun', 'ojo'],
    aMin: 44,
    aMax: 60,
    bMin: 10,
    bMax: 28,
    type: 'port',
    density: 0.35,
  },
  {
    id: 'lagosIsland',
    label: 'Lagos Island',
    parentConstituencies: ['lagosIsland'],
    aMin: 50,
    aMax: 62,
    bMin: 28,
    bMax: 44,
    type: 'mid-rise',
    density: 0.6,
  },
  {
    id: 'viIkoyi',
    label: 'Victoria Island / Ikoyi',
    parentConstituencies: ['etiOsa'],
    aMin: 54,
    aMax: 68,
    bMin: 44,
    bMax: 58,
    type: 'towers',
    density: 0.38,
  },
  {
    id: 'lekki',
    label: 'Lekki',
    parentConstituencies: ['ibejuLekki', 'etiOsa'],
    aMin: 58,
    aMax: 80,
    bMin: 58,
    bMax: 74,
    type: 'towers',
    density: 0.18,
  },
  {
    id: 'makoko',
    label: 'Makoko',
    parentConstituencies: ['lagosMainland'],
    aMin: 40,
    aMax: 50,
    bMin: 34,
    bMax: 42,
    type: 'stilt',
    density: 0.52,
  },
  // Water bodies — density 0, no buildings
  {
    id: 'lagoon',
    label: 'Lagos Lagoon',
    parentConstituencies: [],
    aMin: 44,
    aMax: 58,
    bMin: 28,
    bMax: 62,
    type: 'lagoon',
    density: 0,
  },
  {
    id: 'atlantic',
    label: 'Atlantic Ocean',
    parentConstituencies: [],
    aMin: 66,
    aMax: 82,
    bMin: 14,
    bMax: 80,
    type: 'atlantic',
    density: 0,
  },
]

export const CITY_ZONES = LAGOS_ZONES.filter((z) => z.density > 0)
export const WATER_ZONES = LAGOS_ZONES.filter((z) => z.density === 0)
