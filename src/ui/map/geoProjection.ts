// GeoJSON → iso grid (a, b) projection pipeline
// Loads the 20 Lagos LGA polygons from the existing GeoJSON in /public/data
// Projects each vertex: equirectangular lat/lng → normalized → iso (a,b) space
// Keeps the 8-zone stat system intact. LGAs map to zones for lighting stats.

import { CITY_ZONES } from '../../data/lagosLayout'
import type { ConstituencyKey } from '../../state/types'
import { SHAPE_TO_LGA } from '../lagosGeoJSON'

export interface ProjectedLGA {
  key: ConstituencyKey
  name: string
  isoPolygon: [number, number][] // closed ring in (a,b) iso space
  centroid: [number, number] // (a,b) centroid for labels
  bounds: { aMin: number; aMax: number; bMin: number; bMax: number }
  zoneId: string // parent zone for stats
  zoneIdx: number // index into CITY_ZONES
}

// Pre-computed LGA → zone mapping (reverse of CITY_ZONES[i].parentConstituencies)
// First zone that contains a constituency wins (consistent priority)
const BUILD_LGA_ZONE = () => {
  const map: Record<string, { zoneId: string; zoneIdx: number }> = {}
  for (let i = 0; i < CITY_ZONES.length; i++) {
    const z = CITY_ZONES[i]
    for (const key of z.parentConstituencies) {
      if (!map[key]) map[key] = { zoneId: z.id, zoneIdx: i }
    }
  }
  // Badagry is not in any zone's parentConstituencies — assign to 'ikorodu' (sprawl-low periphery)
  if (!map.badagry) map.badagry = { zoneId: 'ikorodu', zoneIdx: 1 }
  return map
}
const LGA_ZONE = BUILD_LGA_ZONE()

// Get zone info for a constituency key
export function lgaToZone(key: ConstituencyKey): { zoneId: string; zoneIdx: number } {
  return LGA_ZONE[key] ?? { zoneId: 'mainland', zoneIdx: 0 }
}

// ── Projection math ─────────────────────────────────────────────────────────

function lngLatToIso(
  lng: number,
  lat: number,
  span: { lngMin: number; lngMax: number; latMin: number; latMax: number },
  gridRange: { aMin: number; aMax: number; bMin: number; bMax: number },
): [number, number] {
  const nx = (lng - span.lngMin) / (span.lngMax - span.lngMin)
  const ny = 1 - (lat - span.latMin) / (span.latMax - span.latMin)
  const a = gridRange.aMin + ny * (gridRange.aMax - gridRange.aMin)
  const b = gridRange.bMin + nx * (gridRange.bMax - gridRange.bMin)
  return [a, b]
}

// Simple Douglas-Peucker simplification
function simplifyRing(pts: [number, number][], threshold: number): [number, number][] {
  if (pts.length <= 3) return pts
  let maxDist = 0
  let maxIdx = 0
  const [ax, ay] = pts[0]
  const [bx, by] = pts[pts.length - 1]

  for (let i = 1; i < pts.length - 1; i++) {
    const [px, py] = pts[i]
    const dx = bx - ax
    const dy = by - ay
    const len = Math.sqrt(dx * dx + dy * dy)
    if (len === 0) continue
    const dist = Math.abs((ay - py) * dx - (ax - px) * dy) / len
    if (dist > maxDist) {
      maxDist = dist
      maxIdx = i
    }
  }

  if (maxDist > threshold) {
    const left = simplifyRing(pts.slice(0, maxIdx + 1), threshold)
    const right = simplifyRing(pts.slice(maxIdx), threshold)
    return [...left.slice(0, -1), ...right]
  }
  return [pts[0], pts[pts.length - 1]]
}

// Ray-casting point-in-polygon test
export function pointInPolygon(a: number, b: number, polygon: [number, number][]): boolean {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [ai, bi] = polygon[i]
    const [aj, bj] = polygon[j]
    if (bi > b !== bj > b && a < ((aj - ai) * (b - bi)) / (bj - bi) + ai) {
      inside = !inside
    }
  }
  return inside
}

// ── Main projection ─────────────────────────────────────────────────────────

export function projectGeoJSON(
  geoJSON: any,
  gridRange = { aMin: 3, aMax: 79, bMin: 3, bMax: 79 },
  simplifyThreshold = 0.25,
): ProjectedLGA[] {
  const features = geoJSON.features as any[]

  // Compute Mercator-like projection (equirectangular is fine at 6.4°N)
  let lngMin = Infinity,
    lngMax = -Infinity
  let latMin = Infinity,
    latMax = -Infinity
  for (const f of features) {
    for (const [lng, lat] of f.geometry.coordinates[0]) {
      if (lng < lngMin) lngMin = lng
      if (lng > lngMax) lngMax = lng
      if (lat < latMin) latMin = lat
      if (lat > latMax) latMax = lat
    }
  }

  // Add 5% padding
  const lngPad = (lngMax - lngMin) * 0.05
  const latPad = (latMax - latMin) * 0.05
  const span = {
    lngMin: lngMin - lngPad,
    lngMax: lngMax + lngPad,
    latMin: latMin - latPad,
    latMax: latMax + latPad,
  }

  const result: ProjectedLGA[] = []

  for (const f of features) {
    const name = f.properties.shapeName as string
    const key = SHAPE_TO_LGA[name]
    if (!key) continue

    const ring = f.geometry.coordinates[0] as number[][]
    const rawPts: [number, number][] = ring.map(([lng, lat]: number[]) =>
      lngLatToIso(lng, lat, span, gridRange),
    )

    // CRITICAL: GeoJSON rings are closed (first === last). Strip the closing
    // vertex before simplification, then re-close. Otherwise simplifyRing
    // sees a zero-length segment and returns a degenerate 2-vertex polygon.
    const openPts = rawPts.slice(0, -1)
    const simplified = simplifyRing(openPts, simplifyThreshold)
    const isoPolygon: [number, number][] = [...simplified, simplified[0]]

    // Compute centroid (vertex average)
    let ca = 0,
      cb = 0
    for (const [a, b] of isoPolygon) {
      ca += a
      cb += b
    }
    ca /= isoPolygon.length
    cb /= isoPolygon.length

    // Bounds
    let aMin = Infinity,
      aMax = -Infinity,
      bMin = Infinity,
      bMax = -Infinity
    for (const [a, b] of isoPolygon) {
      if (a < aMin) aMin = a
      if (a > aMax) aMax = a
      if (b < bMin) bMin = b
      if (b > bMax) bMax = b
    }

    const z = lgaToZone(key)
    result.push({
      key,
      name,
      isoPolygon,
      centroid: [ca, cb],
      bounds: { aMin, aMax, bMin, bMax },
      zoneId: z.zoneId,
      zoneIdx: z.zoneIdx,
    })
  }

  return result
}

// ── Cached singleton ────────────────────────────────────────────────────────

let _cached: ProjectedLGA[] | null = null
let _cachedBounds: { aMin: number; aMax: number; bMin: number; bMax: number } | null = null

export async function loadLGAGeometry(
  gridRange = { aMin: 3, aMax: 79, bMin: 3, bMax: 79 },
): Promise<ProjectedLGA[]> {
  if (_cached) return _cached
  const res = await fetch('/data/lagos-lgas.geojson')
  const geo = await res.json()
  _cached = projectGeoJSON(geo, gridRange)

  // Compute overall bounds
  let aMin = Infinity,
    aMax = -Infinity,
    bMin = Infinity,
    bMax = -Infinity
  for (const lga of _cached) {
    if (lga.bounds.aMin < aMin) aMin = lga.bounds.aMin
    if (lga.bounds.aMax > aMax) aMax = lga.bounds.aMax
    if (lga.bounds.bMin < bMin) bMin = lga.bounds.bMin
    if (lga.bounds.bMax > bMax) bMax = lga.bounds.bMax
  }
  _cachedBounds = { aMin, aMax, bMin, bMax }
  return _cached
}

export function getLGAGeometry(): ProjectedLGA[] {
  return _cached ?? []
}

export function getProjectedBounds() {
  return _cachedBounds ?? { aMin: 0, aMax: 82, bMin: 0, bMax: 80 }
}
