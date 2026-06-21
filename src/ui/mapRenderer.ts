import {
  DISTRICTS,
  type DistrictDef,
  type MapLayer,
  LAYER_CONFIG,
  interpolateColor,
  borderColor,
  getLayerValue,
} from './mapData'

function pointInPolygon(px: number, py: number, polygon: [number, number][]): boolean {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1]
    const xj = polygon[j][0], yj = polygon[j][1]
    if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}

export function hitTestDistrict(
  mx: number, my: number,
  scale: number, ox: number, oy: number,
): DistrictDef | null {
  for (const d of DISTRICTS) {
    const scaled = d.points.map(([x, y]) => [x * scale + ox, y * scale + oy] as [number, number])
    if (pointInPolygon(mx, my, scaled)) return d
  }
  return null
}

export function renderMap(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  scale: number, ox: number, oy: number,
  layer: MapLayer,
  approval: Record<string, number>,
  infraScore: number,
  securityIndex: number,
  youthTension: number,
  hoveredKey: string | null,
) {
  ctx.clearRect(0, 0, w, h)

  const waterTop = 148 * scale + oy
  const waterBottom = 258 * scale + oy

  // Landmass background
  ctx.fillStyle = '#EADDCD'
  ctx.fillRect(0, 0, w, h)

  // Lagoon / water
  ctx.beginPath()
  ctx.rect(0, waterTop, w, waterBottom - waterTop)
  ctx.fillStyle = '#7BC4C4'
  ctx.globalAlpha = 0.45
  ctx.fill()
  ctx.globalAlpha = 1

  // District polygons — back to front
  const drawOrder = [
    'periphery',
    'alimosho', 'oshodi', 'surulere',
    'lagosIsland', 'makoko', 'victoriaIsland',
    'lekki',
  ] as const

  for (const key of drawOrder) {
    const d = DISTRICTS.find(x => x.key === key)
    if (!d) continue

    const scaled = d.points.map(([x, y]) => [
      x * scale + ox,
      y * scale + oy,
    ] as [number, number])

    const layerVal = getLayerValue(layer, d.key, approval, infraScore, securityIndex, youthTension)
    const cfg = LAYER_CONFIG[layer]
    const [r, g, b, a] = interpolateColor(layerVal, cfg.inverted)
    const bCol = borderColor(layerVal, cfg.inverted)
    const isHovered = hoveredKey === d.key

    ctx.beginPath()
    ctx.moveTo(scaled[0][0], scaled[0][1])
    for (let i = 1; i < scaled.length; i++) {
      ctx.lineTo(scaled[i][0], scaled[i][1])
    }
    ctx.closePath()

    ctx.fillStyle = d.baseColor
    ctx.fill()

    ctx.fillStyle = `rgba(${r},${g},${b},${a})`
    ctx.fill()

    ctx.strokeStyle = isHovered ? '#FFFFFF' : bCol
    ctx.lineWidth = isHovered ? 2.5 * scale : 1.5 * scale
    ctx.stroke()
  }

  // Floor offset for constant layout
  // Pins
  for (const d of DISTRICTS) {
    const cx = d.centroid[0] * scale + ox
    const cy = d.centroid[1] * scale + oy - 12 * scale
    const layerVal = getLayerValue(layer, d.key, approval, infraScore, securityIndex, youthTension)
    const isHovered = hoveredKey === d.key
    const pinR = isHovered ? 18 * scale : 15 * scale

    ctx.beginPath()
    ctx.arc(cx, cy, pinR, 0, Math.PI * 2)
    ctx.fillStyle = isHovered ? '#F0C040' : '#D4A030'
    ctx.fill()
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 2 * scale
    ctx.stroke()

    ctx.fillStyle = '#FFFFFF'
    const fontSize = Math.round(11 * scale)
    ctx.font = `bold ${fontSize}px "Archivo Narrow", sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(layerVal.toFixed(0), cx, cy)

    ctx.fillStyle = '#666666'
    ctx.font = `${Math.round(9 * scale)}px "Archivo Narrow", sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillText(d.label, cx, cy + pinR + 3 * scale)
  }

  // Hover tooltip
  if (hoveredKey) {
    const d = DISTRICTS.find(x => x.key === hoveredKey)
    if (d) {
      const cx = d.centroid[0] * scale + ox
      const cy = d.centroid[1] * scale + oy
      const layerVal = getLayerValue(layer, d.key, approval, infraScore, securityIndex, youthTension)
      const cfg = LAYER_CONFIG[layer]

      const text = `${d.label}: ${cfg.inverted ? 100 - layerVal : layerVal}%`
      ctx.font = `${Math.round(10 * scale)}px "Archivo Narrow", sans-serif`
      const tw = ctx.measureText(text).width
      const pad = 6 * scale
      const bx = cx - tw / 2 - pad
      const by = cy + 32 * scale
      const bw = tw + pad * 2
      const bh = 20 * scale

      ctx.fillStyle = 'rgba(255,255,255,0.92)'
      ctx.strokeStyle = '#CCCCCC'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.roundRect(bx, by, bw, bh, 3)
      ctx.fill()
      ctx.stroke()

      ctx.fillStyle = '#333333'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(text, cx, by + bh / 2)
    }
  }
}
