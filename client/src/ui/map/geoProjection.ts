// GeoJSON → iso grid (a, b) projection pipeline
// Loads the 20 Lagos LGA polygons from the existing GeoJSON in /public/data
// Projects each vertex: equirectangular lat/lng → normalized → iso (a,b) space
// Keeps the 8-zone stat system intact. LGAs map to zones for lighting stats.

import { CITY_ZONES } from '../../data/lagosLayout'
import type { ConstituencyKey } from '../../state/types'
import { SHAPE_TO_LGA } from '../lagosGeoJSON'

type GeoJSONPosition = [number, number]

type PointGeometry = {
  type: 'Point'
  coordinates: GeoJSONPosition
}

type LineStringGeometry = {
  type: 'LineString'
  coordinates: GeoJSONPosition[]
}

type PolygonGeometry = {
  type: 'Polygon'
  coordinates: GeoJSONPosition[][]
}

type Geometry = PointGeometry | LineStringGeometry | PolygonGeometry

type FeatureProperties = {
  shapeName?: string
  [key: string]: unknown
}

type Feature = {
  type: 'Feature'
  properties: FeatureProperties
  geometry: Geometry | null
}

type FeatureCollection = {
  type: 'FeatureCollection'
  features: Feature[]
}

type ProjectionSpan = {
  lngMin: number
  lngMax: number
  latMin: number
  latMax: number
}

type GridRange = { aMin: number; aMax: number; bMin: number; bMax: number }

type IsoPoint = [number, number]

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
  span: ProjectionSpan,
  gridRange: GridRange,
): IsoPoint {
  const nx = (lng - span.lngMin) / (span.lngMax - span.lngMin)
  const ny = 1 - (lat - span.latMin) / (span.latMax - span.latMin)
  const a = gridRange.aMin + ny * (gridRange.aMax - gridRange.aMin)
  const b = gridRange.bMin + nx * (gridRange.bMax - gridRange.bMin)
  return [a, b]
}

// Simple Douglas-Peucker simplification
function simplifyPoints(points: IsoPoint[], threshold: number): IsoPoint[] {
  if (points.length <= 3) return points
  let maxDist = 0
  let maxIdx = 0
  const [ax, ay] = points[0]
  const [bx, by] = points[points.length - 1]

  for (let i = 1; i < points.length - 1; i++) {
    const [px, py] = points[i]
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
    const left = simplifyPoints(points.slice(0, maxIdx + 1), threshold)
    const right = simplifyPoints(points.slice(maxIdx), threshold)
    return [...left.slice(0, -1), ...right]
  }
  return [points[0], points[points.length - 1]]
}

function projectPoint(
  coords: GeoJSONPosition,
  span: ProjectionSpan,
  gridRange: GridRange,
): IsoPoint {
  return lngLatToIso(coords[0], coords[1], span, gridRange)
}

function projectLineString(
  coords: GeoJSONPosition[],
  span: ProjectionSpan,
  gridRange: GridRange,
): IsoPoint[] {
  return coords.map((coord) => projectPoint(coord, span, gridRange))
}

function projectPolygon(
  coords: GeoJSONPosition[][],
  span: ProjectionSpan,
  gridRange: GridRange,
  simplifyThreshold: number,
): IsoPoint[] {
  const ring = coords[0] ?? []
  const rawPoints = projectLineString(ring, span, gridRange)

  if (rawPoints.length <= 1) return rawPoints

  // CRITICAL: GeoJSON rings are closed (first === last). Strip the closing
  // vertex before simplification, then re-close. Otherwise simplifyPoints
  // sees a zero-length segment and returns a degenerate 2-vertex polygon.
  const openPoints = rawPoints.slice(0, -1)
  const simplified = simplifyPoints(openPoints, simplifyThreshold)
  return simplified.length > 0 ? [...simplified, simplified[0]] : simplified
}

function getGeometryCoordinates(geometry: Geometry | null): GeoJSONPosition[] {
  if (!geometry) return []

  switch (geometry.type) {
    case 'Point':
      return [geometry.coordinates]
    case 'LineString':
      return geometry.coordinates
    case 'Polygon':
      return geometry.coordinates[0] ?? []
  }
}

function buildProjectionSpan(features: Feature[]): ProjectionSpan {
  let lngMin = Infinity
  let lngMax = -Infinity
  let latMin = Infinity
  let latMax = -Infinity

  for (const feature of features) {
    for (const [lng, lat] of getGeometryCoordinates(feature.geometry)) {
      if (lng < lngMin) lngMin = lng
      if (lng > lngMax) lngMax = lng
      if (lat < latMin) latMin = lat
      if (lat > latMax) latMax = lat
    }
  }

  const lngPad = (lngMax - lngMin) * 0.05
  const latPad = (latMax - latMin) * 0.05

  return {
    lngMin: lngMin - lngPad,
    lngMax: lngMax + lngPad,
    latMin: latMin - latPad,
    latMax: latMax + latPad,
  }
}

function calculateCentroid(points: IsoPoint[]): IsoPoint {
  let aTotal = 0
  let bTotal = 0

  for (const [a, b] of points) {
    aTotal += a
    bTotal += b
  }

  return [aTotal / points.length, bTotal / points.length]
}

function calculateBounds(points: IsoPoint[]): ProjectedLGA['bounds'] {
  let aMin = Infinity
  let aMax = -Infinity
  let bMin = Infinity
  let bMax = -Infinity

  for (const [a, b] of points) {
    if (a < aMin) aMin = a
    if (a > aMax) aMax = a
    if (b < bMin) bMin = b
    if (b > bMax) bMax = b
  }

  return { aMin, aMax, bMin, bMax }
}

function buildProjectedLGA(
  feature: Feature,
  name: string,
  points: IsoPoint[],
  bounds: ProjectedLGA['bounds'],
): ProjectedLGA | null {
  const shapeName = name || feature.properties.shapeName
  if (!shapeName) return null

  const key = SHAPE_TO_LGA[shapeName]
  if (!key) return null

  const zone = lgaToZone(key)

  return {
    key,
    name: shapeName,
    isoPolygon: points,
    centroid: calculateCentroid(points),
    bounds,
    zoneId: zone.zoneId,
    zoneIdx: zone.zoneIdx,
  }
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
  geoJSON: FeatureCollection,
  gridRange = { aMin: 3, aMax: 79, bMin: 3, bMax: 79 },
  simplifyThreshold = 0.25,
): ProjectedLGA[] {
  const span = buildProjectionSpan(geoJSON.features)

  const result: ProjectedLGA[] = []

  for (const feature of geoJSON.features) {
    const name = feature.properties.shapeName
    if (!feature.geometry || !name) continue

    const { geometry } = feature
    const points =
      geometry.type === 'Point'
        ? [projectPoint(geometry.coordinates, span, gridRange)]
        : geometry.type === 'LineString'
          ? projectLineString(geometry.coordinates, span, gridRange)
          : projectPolygon(geometry.coordinates, span, gridRange, simplifyThreshold)
    if (points.length === 0) continue

    const projectedLGA = buildProjectedLGA(feature, name, points, calculateBounds(points))
    if (projectedLGA) result.push(projectedLGA)
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
