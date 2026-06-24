// Shared building generation — consumed by both buildingsLayer (rendering) and
// lightsLayer (window placement). Calling generateBuildings() twice with no
// args returns identical arrays because everything is deterministically seeded.

import type { ZoneType } from '../../data/lagosLayout'
import { pointInPolygon, getLGAGeometry, lgaToZone } from './geoProjection'
import type { ConstituencyKey } from '../../state/types'

export interface Building {
  a: number
  b: number
  floors: number
  fp: number       // footprint size (1 or 2 grid cells)
  type: ZoneType
  zoneId: string
  zoneIdx: number  // index into CITY_ZONES
  lgaKey: ConstituencyKey
}

export function mulberry32(seed: number) {
  let s = seed
  return (): number => {
    s += 0x6d2b79f5
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) >>> 0
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function floorRange(type: ZoneType): [number, number] {
  switch (type) {
    case 'towers':     return [4, 10]
    case 'mid-rise':   return [2, 4]
    case 'port':       return [1, 3]
    case 'stilt':      return [1, 1]
    default:           return [1, 2]
  }
}

function footprint(type: ZoneType, rng: () => number): number {
  if (type === 'towers')   return rng() < 0.3 ? 2 : 1
  if (type === 'mid-rise') return rng() < 0.4 ? 2 : 1
  return 1
}

// ── Per-LGA building type mapping ───────────────────────────────────────────
const LGA_TYPE: Record<string, ZoneType> = {
  lagosIsland:     'mid-rise',
  etiOsa:          'towers',
  ibejuLekki:      'towers',
  surulere:        'dense-low',
  amuwoOdofin:     'port',
  apapa:           'port',
  oshodiIsolo:     'dense-low',
  mushin:          'dense-low',
  shomolu:         'dense-low',
  kosofe:          'dense-low',
  lagosMainland:   'dense-low',
  ikeja:           'dense-low',
  alimosho:        'dense-low',
  agege:           'dense-low',
  ifakoIjaye:      'dense-low',
  badagry:         'sprawl-low',
  epe:             'sprawl-low',
  ikorodu:         'sprawl-low',
  ojo:             'port',
  ajeromiIfelodun: 'port',
}

const LGA_DENSITY: Record<string, number> = {
  lagosIsland:     0.60,
  etiOsa:          0.38,
  ibejuLekki:      0.18,
  surulere:        0.55,
  amuwoOdofin:     0.35,
  apapa:           0.35,
  oshodiIsolo:     0.55,
  mushin:          0.55,
  shomolu:         0.55,
  kosofe:          0.55,
  lagosMainland:   0.55,
  ikeja:           0.55,
  alimosho:        0.45,
  agege:           0.45,
  ifakoIjaye:      0.45,
  badagry:         0.20,
  epe:             0.28,
  ikorodu:         0.28,
  ojo:             0.35,
  ajeromiIfelodun: 0.35,
}

export function generateBuildings(): Building[] {
  const buildings: Building[] = []
  const BUDGET = 3600
  // Real LGA polygons are smaller than the old oversized rectangles.
  // With half-grid (0.5-step) positions and this density multiplier, we hit
  // the full budget of 3600 buildings distributed across the 20 real LGAs.
  const DENSITY_MULT = 1.25
  const lgas = getLGAGeometry()

  outer:
  for (const lga of lgas) {
    const type = LGA_TYPE[lga.key] ?? 'dense-low'
    const density = Math.min(0.95, (LGA_DENSITY[lga.key] ?? 0.3) * DENSITY_MULT)
    const rng = mulberry32(lga.key.split('').reduce((a, c) => a + c.charCodeAt(0), 0))
    const [minF, maxF] = floorRange(type)

    const { aMin, aMax, bMin, bMax } = lga.bounds
    const aLo = Math.floor(aMin * 2), aHi = Math.ceil(aMax * 2)
    const bLo = Math.floor(bMin * 2), bHi = Math.ceil(bMax * 2)
    for (let ai = aLo; ai <= aHi; ai++) {
      for (let bi = bLo; bi <= bHi; bi++) {
        if (buildings.length >= BUDGET) break outer
        const aa = ai / 2, bb = bi / 2
        if (!pointInPolygon(aa, bb, lga.isoPolygon)) continue
        if (rng() > density) continue
        const fp = footprint(type, rng)
        const floors = minF + Math.floor(rng() * (maxF - minF + 1))
        const z = lgaToZone(lga.key)
        buildings.push({ a: aa, b: bb, floors, fp, type, zoneId: z.zoneId, zoneIdx: z.zoneIdx, lgaKey: lga.key })
      }
    }
  }

  return buildings.sort((x, y) => (x.a + x.b) - (y.a + y.b))
}
