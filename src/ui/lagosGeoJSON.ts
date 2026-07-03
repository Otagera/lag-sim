import type { FeatureCollection } from 'geojson'
import type { CapitalProject, ConstituencyKey } from '../state/types'
import type { MapLayer } from './mapData'
import { getLayerValue, LAYER_CONFIG } from './mapData'

// Bijective: geoBoundaries shapeName → game LGA key.
// shapeName values must match public/data/lagos-lgas.geojson exactly.
export const SHAPE_TO_LGA: Record<string, ConstituencyKey> = {
  'Lagos Island': 'lagosIsland',
  'Eti Osa': 'etiOsa',
  'Ibeju Lekki': 'ibejuLekki',
  Surulere: 'surulere',
  'Amuwo Odofin': 'amuwoOdofin',
  Apapa: 'apapa',
  'Oshodi/Isolo': 'oshodiIsolo',
  Mushin: 'mushin',
  Shomolu: 'shomolu',
  Kosofe: 'kosofe',
  'Lagos Mainland': 'lagosMainland',
  Ikeja: 'ikeja',
  Alimosho: 'alimosho',
  Agege: 'agege',
  'Ifako/Ijaye': 'ifakoIjaye',
  Badagry: 'badagry',
  Epe: 'epe',
  Ikorodu: 'ikorodu',
  Ojo: 'ojo',
  'Ajeromi/Ifelodun': 'ajeromiIfelodun',
}

// Inverse: LGA key → geoBoundaries shapeName (for highlight filter)
export const LGA_TO_SHAPE: Record<ConstituencyKey, string> = Object.fromEntries(
  Object.entries(SHAPE_TO_LGA).map(([shape, key]) => [key, shape]),
) as Record<ConstituencyKey, string>

const FILL = { stable: '#84cc86', warning: '#ceb47e', crisis: '#c56c65' }

// Builds a Maplibre 'match' expression mapping each LGA shapeName → fill color.
export function buildFillExpression(
  approval: Record<string, number>,
  layer: MapLayer | null,
  infraScore: number,
  securityIndex: number,
  youthTension: number,
): unknown[] {
  const pairs: unknown[] = []

  for (const [shapeName, lgaKey] of Object.entries(SHAPE_TO_LGA)) {
    const raw = layer
      ? getLayerValue(layer, lgaKey, approval, infraScore, securityIndex, youthTension)
      : (approval[lgaKey] ?? 50)
    const v = layer && LAYER_CONFIG[layer].inverted ? 100 - raw : raw
    const color = v >= 60 ? FILL.stable : v >= 40 ? FILL.warning : FILL.crisis
    pairs.push(shapeName, color)
  }

  return ['match', ['get', 'shapeName'], ...pairs, '#aaaaaa']
}

// Approximate centroids for each Lagos LGA (lng, lat)
export const LGA_CENTROIDS: Record<ConstituencyKey, [number, number]> = {
  lagosIsland: [3.394, 6.455],
  etiOsa: [3.432, 6.438],
  ibejuLekki: [3.7, 6.48],
  surulere: [3.35, 6.5],
  amuwoOdofin: [3.302, 6.46],
  apapa: [3.362, 6.445],
  oshodiIsolo: [3.337, 6.548],
  mushin: [3.355, 6.558],
  shomolu: [3.388, 6.557],
  kosofe: [3.42, 6.59],
  lagosMainland: [3.378, 6.503],
  ikeja: [3.342, 6.6],
  alimosho: [3.265, 6.59],
  agege: [3.315, 6.618],
  ifakoIjaye: [3.275, 6.643],
  badagry: [2.878, 6.42],
  epe: [3.98, 6.585],
  ikorodu: [3.505, 6.62],
  ojo: [3.188, 6.48],
  ajeromiIfelodun: [3.335, 6.47],
}

export function buildProjectsGeoJSON(projects: CapitalProject[]): FeatureCollection {
  const visible = projects.filter((p) => p.status === 'active' || p.status === 'stalled')
  return {
    type: 'FeatureCollection',
    features: visible.map((p) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: LGA_CENTROIDS[p.location] },
      properties: {
        status: p.status,
        name: p.name,
        progress: Math.round(p.effectiveProgress),
        weeksRemaining: p.weeksRemaining,
      },
    })),
  }
}
