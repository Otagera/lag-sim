import type { ConstituencyKey } from '../state/types'

export type MapLayer = 'approval' | 'infrastructure' | 'security' | 'youthTension'

export interface DistrictDef {
  key: ConstituencyKey
  label: string
  points: [number, number][]
  centroid: [number, number]
  baseColor: string
}

export const BASE_W = 500
export const BASE_H = 360

export const DISTRICTS: DistrictDef[] = [
  {
    key: 'periphery',
    label: 'Periphery',
    points: [[130, 10], [370, 10], [370, 55], [130, 55]],
    centroid: [250, 32],
    baseColor: '#9BB59B',
  },
  {
    key: 'alimosho',
    label: 'Alimosho',
    points: [[30, 60], [145, 60], [145, 130], [105, 155], [30, 140]],
    centroid: [90, 100],
    baseColor: '#C4A882',
  },
  {
    key: 'oshodi',
    label: 'Oshodi',
    points: [[155, 60], [265, 60], [265, 125], [235, 145], [155, 125]],
    centroid: [210, 98],
    baseColor: '#B8B28A',
  },
  {
    key: 'surulere',
    label: 'Surulere',
    points: [[275, 60], [380, 60], [380, 125], [350, 145], [275, 125]],
    centroid: [330, 98],
    baseColor: '#D4BB94',
  },
  {
    key: 'lagosIsland',
    label: 'Lagos Island',
    points: [[55, 175], [145, 165], [180, 200], [145, 235], [55, 220]],
    centroid: [115, 200],
    baseColor: '#D4C8A9',
  },
  {
    key: 'makoko',
    label: 'Makoko',
    points: [[155, 190], [255, 175], [285, 210], [255, 245], [155, 230]],
    centroid: [220, 210],
    baseColor: '#8FBCB3',
  },
  {
    key: 'victoriaIsland',
    label: 'Victoria Island',
    points: [[265, 170], [370, 160], [405, 195], [370, 230], [265, 215]],
    centroid: [330, 198],
    baseColor: '#D4C078',
  },
  {
    key: 'lekki',
    label: 'Lekki',
    points: [[155, 265], [370, 250], [390, 295], [350, 320], [155, 300]],
    centroid: [275, 285],
    baseColor: '#A5C2A5',
  },
]

export const LAYER_CONFIG: Record<MapLayer, {
  label: string
  inverted: boolean
}> = {
  approval: { label: 'Approval', inverted: false },
  infrastructure: { label: 'Infra', inverted: false },
  security: { label: 'Security', inverted: false },
  youthTension: { label: 'Youth', inverted: true },
}

export function interpolateColor(value: number, inverted: boolean): [number, number, number, number] {
  const v = Math.max(0, Math.min(100, inverted ? 100 - value : value))
  let r: number, g: number, b: number
  if (v < 50) {
    const t = v / 50
    r = Math.round(200 + (190 - 200) * t)
    g = Math.round(60 + (170 - 60) * t)
    b = Math.round(60 + (40 - 60) * t)
  } else {
    const t = (v - 50) / 50
    r = Math.round(190 + (60 - 190) * t)
    g = Math.round(170 + (175 - 170) * t)
    b = Math.round(40 + (65 - 40) * t)
  }
  return [r, g, b, 0.35]
}

export function borderColor(value: number, inverted: boolean): string {
  const v = Math.max(0, Math.min(100, inverted ? 100 - value : value))
  if (v >= 70) return '#5BA85B'
  if (v >= 45) return '#D4A030'
  return '#C04040'
}

// Isometric projection: maps flat 2D coords to 30-degree diamond grid
export function projectToIso(x: number, y: number, scale: number, ox: number, oy: number): [number, number] {
  // Raw isometric width = ~745px; fit factor centers within 500x360
  const isoX = (x - y) * 0.866
  const isoY = (x + y) * 0.5
  const fitFactor = 0.62
  const baseX = (isoX + 312) * fitFactor + 25
  const baseY = isoY * fitFactor + 45
  return [baseX * scale + ox, baseY * scale + oy]
}

export function getLayerValue(
  layer: MapLayer,
  districtKey: ConstituencyKey,
  approval: Record<string, number>,
  infraScore: number,
  securityIndex: number,
  youthTension: number,
): number {
  switch (layer) {
    case 'approval': return approval[districtKey] ?? 50
    case 'infrastructure': return infraScore
    case 'security': return securityIndex
    case 'youthTension': return youthTension
  }
}
