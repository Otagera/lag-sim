import type { ConstituencyKey } from '../state/types'

export type MapLayer = 'approval' | 'infrastructure' | 'security' | 'youthTension'

export const LAYER_CONFIG: Record<
  MapLayer,
  {
    label: string
    inverted: boolean
  }
> = {
  approval: { label: 'Approval', inverted: false },
  infrastructure: { label: 'Infra', inverted: false },
  security: { label: 'Security', inverted: false },
  youthTension: { label: 'Youth', inverted: true },
}

export function interpolateColor(
  value: number,
  inverted: boolean,
): [number, number, number, number] {
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
export function projectToIso(
  x: number,
  y: number,
  scale: number,
  ox: number,
  oy: number,
): [number, number] {
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
    case 'approval':
      return approval[districtKey] ?? 50
    case 'infrastructure':
      return infraScore
    case 'security':
      return securityIndex
    case 'youthTension':
      return youthTension
  }
}
