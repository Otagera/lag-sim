import { BRIDGE as BCOL, LAND, VEHICLES as VCOL, WATER } from '../data/cityPalette'
import type {
  ResolvedBillboard,
  ResolvedBoat,
  ResolvedBridge,
  ResolvedBuilding,
  ResolvedLandmass,
  ResolvedMarketStall,
  ResolvedMarketZone,
  ResolvedPin,
  ResolvedRoad,
  ResolvedScene,
  ResolvedStreetlight,
  ResolvedTree,
  ResolvedVehicle,
} from '../data/cityScene'
import { mulberry32 } from '../data/cityScene'
import { projectToIso } from './mapData'

// ---- Depth multiplier ----
function depthMul(depthLayer: number): number {
  if (depthLayer === 0) return 0.85
  if (depthLayer === 2) return 1.0
  return 1.0
}

type IsoPoint = [number, number]

type RoadBase = {
  points: IsoPoint[]
  scale: number
  width: number
}

type BridgeBase = {
  x1: number
  y1: number
  x2: number
  y2: number
  dx: number
  dy: number
  nx: number
  ny: number
  scale: number
  width: number
}

type StandardBuildingBase = {
  kind: 'standard'
  scale: number
  cx: number
  cy: number
  w: number
  d: number
  h: number
  t: IsoPoint
  r: IsoPoint
  bt: IsoPoint
  l: IsoPoint
}

type GlassTierBase = {
  kind: 'glassTier'
  scale: number
  h: number
  t: IsoPoint
  r: IsoPoint
  bt: IsoPoint
  l: IsoPoint
}

type BuildingBase = StandardBuildingBase | GlassTierBase

function roadStrokeColor(r: ResolvedRoad, isLit: boolean): string {
  if (isLit) {
    if (r.level === 'primary') return '#B8A060'
    if (r.level === 'secondary') return '#C8B070'
    return '#D8C088'
  }
  if (r.level === 'primary') return 'rgba(60,45,20,0.55)'
  return 'rgba(100,80,50,0.35)'
}

function drawRoadPath(
  ctx: CanvasRenderingContext2D,
  r: ResolvedRoad,
  base: RoadBase,
  half: number,
) {
  const { points, scale, width } = base
  const edgeColor = r.level === 'primary' ? '#907038' : '#A89050'
  const shadowOffset = (r.level === 'primary' ? 3 : 1.5) * scale

  ctx.strokeStyle = roadStrokeColor(r, false)
  ctx.lineWidth = width + (r.level === 'primary' ? 2 : 1) * scale
  ctx.beginPath()
  ctx.moveTo(points[0][0], points[0][1] + shadowOffset)
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1] + shadowOffset)
  ctx.stroke()

  ctx.strokeStyle = roadStrokeColor(r, true)
  ctx.lineWidth = width
  ctx.beginPath()
  ctx.moveTo(points[0][0], points[0][1])
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1])
  ctx.stroke()

  if (r.level === 'local') return

  ctx.strokeStyle = edgeColor
  ctx.lineWidth = r.level === 'primary' ? 1.2 * scale : 0.6 * scale
  for (let side = -1; side <= 1; side += 2) {
    ctx.beginPath()
    for (let i = 0; i < points.length; i++) {
      const di = Math.max(0, Math.min(i, points.length - 2))
      const dx = points[di + 1][0] - points[di][0]
      const dy = points[di + 1][1] - points[di][1]
      const len = Math.hypot(dx, dy) || 1
      const px = (-dy / len) * half * side
      const py = (dx / len) * half * side
      if (i === 0) ctx.moveTo(points[i][0] + px, points[i][1] + py)
      else ctx.lineTo(points[i][0] + px, points[i][1] + py)
    }
    ctx.stroke()
  }
}

function drawRoadMarkings(
  ctx: CanvasRenderingContext2D,
  r: ResolvedRoad,
  base: RoadBase,
  half: number,
) {
  void half
  if (r.level !== 'primary') return

  const { points, scale } = base

  ctx.strokeStyle = 'rgba(200,190,170,0.6)'
  ctx.lineWidth = 0.8 * scale
  ctx.setLineDash([4 * scale, 5 * scale])
  ctx.beginPath()
  ctx.moveTo(points[0][0], points[0][1])
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1])
  ctx.stroke()
  ctx.setLineDash([])

  ctx.strokeStyle = 'rgba(40,130,200,0.30)'
  ctx.lineWidth = 2.5 * scale
  ctx.setLineDash([3 * scale, 6 * scale])
  ctx.beginPath()
  ctx.moveTo(points[0][0], points[0][1])
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1])
  ctx.stroke()
  ctx.setLineDash([])
}

function drawBridgeDeck(
  ctx: CanvasRenderingContext2D,
  r: ResolvedBridge,
  base: BridgeBase,
  half: number,
  waterY: number,
) {
  void r
  void half

  ctx.strokeStyle = 'rgba(160,140,120,0.2)'
  ctx.lineWidth = base.width + 2 * base.scale
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(base.x1, base.y1 + waterY)
  ctx.lineTo(base.x2, base.y2 + waterY)
  ctx.stroke()

  ctx.strokeStyle = BCOL.deck
  ctx.lineWidth = base.width
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(base.x1, base.y1)
  ctx.lineTo(base.x2, base.y2)
  ctx.stroke()
}

function drawBridgePiers(
  ctx: CanvasRenderingContext2D,
  r: ResolvedBridge,
  base: BridgeBase,
  half: number,
  waterY: number,
) {
  void half
  void waterY

  if (r.type === 'cable') {
    const midX = (base.x1 + base.x2) / 2
    const midY = (base.y1 + base.y2) / 2
    const pylonH = 12 * base.scale

    ctx.strokeStyle = BCOL.pylon
    ctx.lineWidth = 2.5 * base.scale
    ctx.beginPath()
    ctx.moveTo(midX, midY - pylonH)
    ctx.lineTo(midX, midY)
    ctx.stroke()

    ctx.lineWidth = 1.5 * base.scale
    ctx.beginPath()
    ctx.moveTo(midX - 3 * base.scale, midY - pylonH * 0.6)
    ctx.lineTo(midX + 3 * base.scale, midY - pylonH * 0.6)
    ctx.stroke()

    ctx.strokeStyle = BCOL.cable
    ctx.lineWidth = 0.5 * base.scale
    for (const [dx, dy] of [
      [base.x2 - midX, base.y2 - midY],
      [base.x1 - midX, base.y1 - midY],
    ]) {
      for (let i = 0; i <= 6; i++) {
        const t = i / 6
        const ex = midX + dx * t
        const ey = midY + dy * t
        ctx.beginPath()
        ctx.moveTo(midX, midY - pylonH)
        ctx.lineTo(ex, ey)
        ctx.stroke()
      }
    }
    return
  }

  if (r.type !== 'suspension') return

  const pylonH = 10 * base.scale
  const p1x = base.x1 + base.dx * 0.25
  const p1y = base.y1 + base.dy * 0.25
  const p2x = base.x1 + base.dx * 0.75
  const p2y = base.y1 + base.dy * 0.75

  ctx.strokeStyle = BCOL.pylon
  ctx.lineWidth = 2.5 * base.scale
  ctx.beginPath()
  ctx.moveTo(p1x, p1y - pylonH)
  ctx.lineTo(p1x, p1y)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(p2x, p2y - pylonH)
  ctx.lineTo(p2x, p2y)
  ctx.stroke()

  ctx.strokeStyle = BCOL.cable
  ctx.lineWidth = 1.2 * base.scale
  ctx.beginPath()
  for (let i = 0; i <= 20; i++) {
    const t = i / 20
    const px = lerp(lerp(base.x1, p1x, t), lerp(p1x, p2x, t), t)
    const py = lerp(lerp(base.y1, p1y - pylonH, t), lerp(p1y - pylonH, p2y - pylonH, t), t)
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.stroke()

  ctx.lineWidth = 0.3 * base.scale
  for (let i = 1; i < 10; i++) {
    const t = i / 10
    const deckX = lerp(base.x1, base.x2, t)
    const deckY = lerp(base.y1, base.y2, t)
    const cableY = deckY - pylonH * Math.sin(t * Math.PI)
    ctx.beginPath()
    ctx.moveTo(deckX, deckY)
    ctx.lineTo(deckX, cableY)
    ctx.stroke()
  }
}

function drawBridgeRails(
  ctx: CanvasRenderingContext2D,
  r: ResolvedBridge,
  base: BridgeBase,
  half: number,
  waterY: number,
) {
  void r
  void waterY

  ctx.strokeStyle = BCOL.deckShadow
  ctx.lineWidth = 0.5 * base.scale
  for (let s = -1; s <= 1; s += 2) {
    ctx.beginPath()
    ctx.moveTo(base.x1 + base.nx * half * s, base.y1 + base.ny * half * s)
    ctx.lineTo(base.x2 + base.nx * half * s, base.y2 + base.ny * half * s)
    ctx.stroke()
  }
}

function glassTowerTiers(base: StandardBuildingBase): GlassTierBase[] {
  const tiers = [
    { wFactor: 1.0, dFactor: 1.0, hStart: 0, hEnd: base.h * 0.4 },
    { wFactor: 0.78, dFactor: 0.78, hStart: base.h * 0.4, hEnd: base.h * 0.72 },
    { wFactor: 0.55, dFactor: 0.55, hStart: base.h * 0.72, hEnd: base.h },
  ]

  return tiers.map((tier) => {
    const tw = base.w * tier.wFactor
    const td = base.d * tier.dFactor
    const baseShift = tier.hStart
    return {
      kind: 'glassTier',
      scale: base.scale,
      h: tier.hEnd - tier.hStart,
      t: [base.cx, base.cy - td / 2 - baseShift],
      r: [base.cx + tw / 2, base.cy - baseShift],
      bt: [base.cx, base.cy + td / 2 - baseShift],
      l: [base.cx - tw / 2, base.cy - baseShift],
    }
  })
}

function drawGlassTierShell(
  ctx: CanvasRenderingContext2D,
  b: ResolvedBuilding,
  base: GlassTierBase,
) {
  ctx.beginPath()
  ctx.moveTo(base.l[0], base.l[1])
  ctx.lineTo(base.bt[0], base.bt[1])
  ctx.lineTo(base.bt[0], base.bt[1] - base.h)
  ctx.lineTo(base.l[0], base.l[1] - base.h)
  ctx.closePath()
  ctx.fillStyle = b.shadowColor
  ctx.fill()

  ctx.beginPath()
  ctx.moveTo(base.r[0], base.r[1])
  ctx.lineTo(base.bt[0], base.bt[1])
  ctx.lineTo(base.bt[0], base.bt[1] - base.h)
  ctx.lineTo(base.r[0], base.r[1] - base.h)
  ctx.closePath()
  ctx.fillStyle = b.wallColor
  ctx.fill()

  ctx.beginPath()
  ctx.moveTo(base.t[0], base.t[1] - base.h)
  ctx.lineTo(base.r[0], base.r[1] - base.h)
  ctx.lineTo(base.bt[0], base.bt[1] - base.h)
  ctx.lineTo(base.l[0], base.l[1] - base.h)
  ctx.closePath()
  ctx.fillStyle = b.roofColor
  ctx.fill()
}

function drawStandardBuildingWalls(
  ctx: CanvasRenderingContext2D,
  b: ResolvedBuilding,
  base: StandardBuildingBase,
) {
  ctx.beginPath()
  ctx.moveTo(base.l[0], base.l[1])
  ctx.lineTo(base.bt[0], base.bt[1])
  ctx.lineTo(base.bt[0], base.bt[1] + base.h)
  ctx.lineTo(base.l[0], base.l[1] + base.h)
  ctx.closePath()
  ctx.fillStyle = b.shadowColor
  ctx.fill()
  ctx.fillStyle = 'rgba(40, 30, 20, 0.08)'
  ctx.fill()

  ctx.beginPath()
  ctx.moveTo(base.r[0], base.r[1])
  ctx.lineTo(base.bt[0], base.bt[1])
  ctx.lineTo(base.bt[0], base.bt[1] + base.h)
  ctx.lineTo(base.r[0], base.r[1] + base.h)
  ctx.closePath()
  ctx.fillStyle = b.wallColor
  ctx.fill()
  ctx.fillStyle = 'rgba(255, 250, 240, 0.04)'
  ctx.fill()
}

function drawStandardBuildingRoof(
  ctx: CanvasRenderingContext2D,
  b: ResolvedBuilding,
  base: StandardBuildingBase,
  half: number,
) {
  if (b.type === 'residential') {
    const roofTopY = base.cy - base.h
    const roofPitch = base.d * 0.4
    const ridgeCenter: IsoPoint = [base.cx, roofTopY - base.d / 2 - roofPitch]
    const ridgeFront: IsoPoint = [base.cx, roofTopY + base.d / 2 - roofPitch]
    const leftCorner: IsoPoint = [base.cx - half, roofTopY]
    const rightCorner: IsoPoint = [base.cx + half, roofTopY]
    const frontCorner: IsoPoint = [base.cx, roofTopY + base.d / 2]

    ctx.beginPath()
    ctx.moveTo(leftCorner[0], leftCorner[1])
    ctx.lineTo(frontCorner[0], frontCorner[1])
    ctx.lineTo(ridgeFront[0], ridgeFront[1])
    ctx.lineTo(ridgeCenter[0], ridgeCenter[1])
    ctx.closePath()
    ctx.fillStyle = b.shadowColor
    ctx.fill()

    ctx.beginPath()
    ctx.moveTo(rightCorner[0], rightCorner[1])
    ctx.lineTo(frontCorner[0], frontCorner[1])
    ctx.lineTo(ridgeFront[0], ridgeFront[1])
    ctx.lineTo(ridgeCenter[0], ridgeCenter[1])
    ctx.closePath()
    ctx.fillStyle = b.roofColor
    ctx.fill()
    return
  }

  ctx.beginPath()
  ctx.moveTo(base.t[0], base.t[1])
  ctx.lineTo(base.r[0], base.r[1])
  ctx.lineTo(base.bt[0], base.bt[1])
  ctx.lineTo(base.l[0], base.l[1])
  ctx.closePath()
  ctx.fillStyle = b.roofColor
  ctx.fill()
}

function drawBuildingShell(
  ctx: CanvasRenderingContext2D,
  b: ResolvedBuilding,
  base: BuildingBase,
  half: number,
) {
  if (base.kind === 'glassTier') {
    drawGlassTierShell(ctx, b, base)
    return
  }

  drawStandardBuildingWalls(ctx, b, base)
  drawStandardBuildingRoof(ctx, b, base, half)

  ctx.strokeStyle = 'rgba(0,0,0,0.06)'
  ctx.lineWidth = 0.4 * base.scale
  ctx.stroke()

  ctx.strokeStyle = 'rgba(255,255,255,0.22)'
  ctx.lineWidth = 0.6 * base.scale
  ctx.beginPath()
  ctx.moveTo(base.bt[0], base.bt[1])
  ctx.lineTo(base.bt[0], base.bt[1] + base.h)
  ctx.stroke()
}

function drawBuildingDetails(
  ctx: CanvasRenderingContext2D,
  b: ResolvedBuilding,
  base: BuildingBase,
  half: number,
) {
  void half

  if (base.kind === 'glassTier') {
    ctx.strokeStyle = 'rgba(200,220,240,0.08)'
    ctx.lineWidth = 0.3 * base.scale
    const leftWidth = Math.hypot(base.bt[0] - base.l[0], base.bt[1] - base.l[1])
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 3; col++) {
        ctx.fillStyle = 'rgba(200,220,255,0.06)'
        ctx.fillRect(
          base.l[0] + ((base.bt[0] - base.l[0]) * (col + 0.4)) / 3,
          base.l[1] - base.h + ((row + 0.3) * base.h) / 4,
          leftWidth * 0.06,
          base.h * 0.12,
        )
      }
    }

    const rightWidth = Math.hypot(base.bt[0] - base.r[0], base.bt[1] - base.r[1])
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 3; col++) {
        ctx.fillStyle = 'rgba(200,230,255,0.10)'
        ctx.fillRect(
          base.r[0] + ((base.bt[0] - base.r[0]) * (col + 0.4)) / 3,
          base.r[1] - base.h + ((row + 0.3) * base.h) / 4,
          rightWidth * 0.06,
          base.h * 0.12,
        )
      }
    }
    return
  }

  glassDetails(ctx, b, base.scale, base.l, base.bt, base.h, 'left')
  glassDetails(ctx, b, base.scale, base.r, base.bt, base.h, 'right')
}

function drawBuildingShadow(
  ctx: CanvasRenderingContext2D,
  b: ResolvedBuilding,
  base: BuildingBase,
  half: number,
) {
  if (base.kind === 'glassTier' || b.type !== 'stilt') return

  ctx.strokeStyle = '#3A3028'
  ctx.lineWidth = 1.5 * base.scale
  const width = half * 2
  for (let pi = -0.3; pi <= 0.3; pi += 0.6) {
    for (let pj = -0.25; pj <= 0.25; pj += 0.5) {
      const px = base.cx + pi * width
      const py = base.cy + pj * base.d
      ctx.beginPath()
      ctx.moveTo(px, py)
      ctx.lineTo(px, py + base.h + 4 * base.scale)
      ctx.stroke()
    }
  }
}

// ---- Water ----
function drawWater(ctx: CanvasRenderingContext2D, w: number, h: number, scale: number) {
  const grad = ctx.createRadialGradient(w / 2, h * 0.45, h * 0.15, w / 2, h / 2, w * 0.85)
  grad.addColorStop(0, '#7BCAD3')
  grad.addColorStop(0.25, '#5FB5C6')
  grad.addColorStop(0.5, '#4EA5BB')
  grad.addColorStop(1, '#2F7088')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)

  ctx.strokeStyle = WATER.waveLine
  ctx.lineWidth = 1.2 * scale
  for (let row = 0; row < 60; row++) {
    const baseY = row * 8 * scale
    if (baseY > h) break
    ctx.beginPath()
    for (let x = 0; x < w; x += 3 * scale) {
      const wy = baseY + Math.sin((x / scale + row * 18) * 0.03) * 1.8 * scale
      if (x === 0) ctx.moveTo(x, wy)
      else ctx.lineTo(x, wy)
    }
    ctx.stroke()
  }
}

// ---- Landmass with beach edge ----
function drawLandmass(
  ctx: CanvasRenderingContext2D,
  lm: ResolvedLandmass,
  scale: number,
  ox: number,
  oy: number,
) {
  const pts = lm.points.map(([x, y]) => projectToIso(x, y, scale, ox, oy))

  ctx.save()
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.strokeStyle = 'rgba(123, 202, 211, 0.45)'
  ctx.lineWidth = 16 * scale
  ctx.beginPath()
  ctx.moveTo(pts[0][0], pts[0][1])
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1])
  ctx.closePath()
  ctx.stroke()
  ctx.restore()

  ctx.beginPath()
  ctx.moveTo(pts[0][0], pts[0][1] + 3 * scale)
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1] + 3 * scale)
  ctx.closePath()
  ctx.fillStyle = LAND.shadow
  ctx.fill()

  ctx.beginPath()
  ctx.moveTo(pts[0][0], pts[0][1])
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1])
  ctx.closePath()
  ctx.fillStyle = lm.color
  ctx.fill()

  if (lm.isIsland) {
    ctx.strokeStyle = LAND.beachEdge
    ctx.lineWidth = 4 * scale
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(pts[0][0], pts[0][1])
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1])
    ctx.closePath()
    ctx.stroke()

    ctx.strokeStyle = LAND.beach
    ctx.lineWidth = 2.5 * scale
    ctx.beginPath()
    ctx.moveTo(pts[0][0], pts[0][1])
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1])
    ctx.closePath()
    ctx.stroke()
  }

  ctx.strokeStyle = LAND.edge
  ctx.lineWidth = 1.2 * scale
  ctx.beginPath()
  ctx.moveTo(pts[0][0], pts[0][1])
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1])
  ctx.closePath()
  ctx.stroke()
}

// ---- Roads with hierarchy ----
function drawRoad(
  ctx: CanvasRenderingContext2D,
  r: ResolvedRoad,
  scale: number,
  ox: number,
  oy: number,
) {
  const width = r.w * scale
  const half = width / 2
  const base: RoadBase = {
    points: r.points.map(([x, y]) => projectToIso(x, y, scale, ox, oy)),
    scale,
    width,
  }

  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  drawRoadPath(ctx, r, base, half)
  drawRoadMarkings(ctx, r, base, half)
}

// ---- Bridges ----
function drawBridge(
  ctx: CanvasRenderingContext2D,
  b: ResolvedBridge,
  scale: number,
  ox: number,
  oy: number,
) {
  const [x1, y1] = projectToIso(b.x1, b.y1, scale, ox, oy)
  const [x2, y2] = projectToIso(b.x2, b.y2, scale, ox, oy)
  const width = b.w * scale
  const half = width / 2
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.hypot(dx, dy) || 1
  const base: BridgeBase = {
    x1,
    y1,
    x2,
    y2,
    dx,
    dy,
    nx: -dy / len,
    ny: dx / len,
    scale,
    width,
  }
  const waterY = 2 * scale

  drawBridgeDeck(ctx, b, base, half, waterY)
  drawBridgeRails(ctx, b, base, half, waterY)
  drawBridgePiers(ctx, b, base, half, waterY)
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

// ---- Building ----
function drawBuilding(
  ctx: CanvasRenderingContext2D,
  b: ResolvedBuilding,
  scale: number,
  ox: number,
  oy: number,
) {
  const [cx, cy] = projectToIso(b.cx, b.cy, scale, ox, oy)
  const w = b.w * scale
  const d = b.d * scale
  const h = b.h * scale
  const dm = depthMul(b.depthLayer)
  const half = w / 2
  const base: StandardBuildingBase = {
    kind: 'standard',
    scale,
    cx,
    cy,
    w,
    d,
    h,
    t: [cx, cy - d / 2],
    r: [cx + w / 2, cy],
    bt: [cx, cy + d / 2],
    l: [cx - w / 2, cy],
  }

  if (dm < 1) ctx.globalAlpha = dm

  if (b.type === 'glassTower') {
    for (const tier of glassTowerTiers(base)) {
      drawBuildingShell(ctx, b, tier, half)
      drawBuildingDetails(ctx, b, tier, half)
    }
    if (dm < 1) ctx.globalAlpha = 1
    return
  }

  drawBuildingShadow(ctx, b, base, half)
  drawBuildingShell(ctx, b, base, half)
  drawBuildingDetails(ctx, b, base, half)

  if (dm < 1) ctx.globalAlpha = 1
}

function glassDetails(
  ctx: CanvasRenderingContext2D,
  b: ResolvedBuilding,
  scale: number,
  start: [number, number],
  end: [number, number],
  h: number,
  side: 'left' | 'right',
) {
  if (b.type !== 'glassTower') return
  ctx.strokeStyle = 'rgba(200,220,240,0.10)'
  ctx.lineWidth = 0.3 * scale
  const wallW = Math.hypot(end[0] - start[0], end[1] - start[1])
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 4; col++) {
      const gx = start[0] + ((end[0] - start[0]) * (col + 0.5)) / 4
      const gy = start[1] + ((end[1] - start[1]) * (col + 0.5)) / 4
      ctx.fillStyle = side === 'left' ? 'rgba(200,220,255,0.08)' : 'rgba(200,230,255,0.12)'
      ctx.fillRect(gx - wallW * 0.04, gy + ((row + 0.3) * h) / 6, wallW * 0.08, h * 0.1)
    }
  }
  if (side === 'right') {
    ctx.fillStyle = 'rgba(255,255,255,0.12)'
    ctx.beginPath()
    ctx.moveTo(start[0] + (end[0] - start[0]) * 0.2, start[1] + h * 0.1)
    ctx.lineTo(start[0] + (end[0] - start[0]) * 0.25, start[1] + h * 0.1)
    ctx.lineTo(start[0] + (end[0] - start[0]) * 0.2, start[1] + h * 0.6)
    ctx.lineTo(start[0] + (end[0] - start[0]) * 0.15, start[1] + h * 0.6)
    ctx.closePath()
    ctx.fill()
  }
}

// ---- Tree ----
function drawTree(
  ctx: CanvasRenderingContext2D,
  t: ResolvedTree,
  scale: number,
  ox: number,
  oy: number,
) {
  const [cx, cy] = projectToIso(t.cx, t.cy, scale, ox, oy)
  const cr = t.canopyR * scale

  ctx.fillStyle = 'rgba(140,120,100,0.25)'
  ctx.beginPath()
  ctx.ellipse(cx, cy, cr * 1.2, cr * 0.6, 0, 0, Math.PI * 2)
  ctx.fill()

  if (t.isMangrove) {
    ctx.fillStyle = t.canopyColor
    ctx.beginPath()
    ctx.arc(cx, cy, cr, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#1E3A1A'
    ctx.beginPath()
    ctx.arc(cx - cr * 0.3, cy + cr * 0.2, cr * 0.6, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#3A6A30'
    ctx.beginPath()
    ctx.arc(cx + cr * 0.3, cy - cr * 0.1, cr * 0.5, 0, Math.PI * 2)
    ctx.fill()
    return
  }

  ctx.strokeStyle = t.trunkColor
  ctx.lineWidth = 1.5 * scale
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.lineTo(cx, cy - cr * 1.2)
  ctx.stroke()

  const canopyY = cy - cr * 1.2
  if (t.isPalm) {
    ctx.strokeStyle = t.canopyColor
    ctx.lineWidth = 1.8 * scale
    for (let a = 0; a < 6; a++) {
      const angle = (a / 6) * Math.PI * 2
      ctx.beginPath()
      ctx.moveTo(cx, canopyY)
      ctx.quadraticCurveTo(
        cx + Math.cos(angle) * cr * 0.6,
        canopyY - cr * 0.4,
        cx + Math.cos(angle) * cr,
        canopyY + Math.sin(angle) * cr * 0.5,
      )
      ctx.stroke()
    }
  } else {
    ctx.fillStyle = t.canopyColor
    ctx.beginPath()
    ctx.arc(cx, canopyY, cr, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,0.15)'
    ctx.beginPath()
    ctx.arc(cx - cr * 0.2, canopyY - cr * 0.2, cr * 0.7, 0, Math.PI * 2)
    ctx.fill()
  }
}

// ---- Vehicle ----
function drawVehicle(
  ctx: CanvasRenderingContext2D,
  v: ResolvedVehicle,
  scale: number,
  ox: number,
  oy: number,
) {
  const [cx, cy] = projectToIso(v.cx, v.cy, scale, ox, oy)
  const w2 = v.w * scale
  const h2 = v.h * scale
  ctx.fillStyle = 'rgba(0,0,0,0.12)'
  ctx.beginPath()
  ctx.ellipse(cx, cy + 1.2 * scale, w2 / 2, h2 / 2, v.rot, 0, Math.PI * 2)
  ctx.fill()

  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(v.rot)

  ctx.fillStyle = v.color
  ctx.fillRect(-w2 / 2, -h2 / 2, w2, h2)
  ctx.fillStyle = v.accentColor
  ctx.fillRect(-w2 / 2, -h2 / 2, w2 * 0.25, h2)
  ctx.strokeStyle = 'rgba(0,0,0,0.1)'
  ctx.lineWidth = 0.3 * scale
  ctx.strokeRect(-w2 / 2, -h2 / 2, w2, h2)

  if (v.isBRT) {
    ctx.fillStyle = 'rgba(255,255,255,0.2)'
    ctx.fillRect(-w2 * 0.3, -h2 * 0.3, w2 * 0.6, h2 * 0.15)
  }

  if (v.color === VCOL.danfo) {
    ctx.fillStyle = 'rgba(40,35,30,0.65)'
    ctx.fillRect(-w2 * 0.38, -h2 * 0.2, w2 * 0.76, h2 * 0.1)
    ctx.fillRect(-w2 * 0.38, h2 * 0.1, w2 * 0.76, h2 * 0.1)
  }

  ctx.restore()
}

// ---- Boat ----
function drawBoat(
  ctx: CanvasRenderingContext2D,
  b: ResolvedBoat,
  scale: number,
  ox: number,
  oy: number,
) {
  const [cx, cy] = projectToIso(b.cx, b.cy, scale, ox, oy)
  const w2 = b.w * scale
  const h2 = b.h * scale

  if (b.type !== 'canoe') {
    drawWake(ctx, cx, cy, b.rot, b.w, scale)
  }

  ctx.fillStyle = 'rgba(0,0,0,0.06)'
  ctx.beginPath()
  ctx.ellipse(cx, cy + 1.2 * scale, w2 / 2, h2 / 2 + 0.5 * scale, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = b.hullColor
  ctx.beginPath()
  if (b.type === 'canoe') {
    ctx.moveTo(cx - w2 / 2, cy)
    ctx.quadraticCurveTo(cx, cy - h2, cx + w2 / 2, cy)
    ctx.quadraticCurveTo(cx, cy + h2, cx - w2 / 2, cy)
  } else if (b.type === 'speedboat') {
    ctx.moveTo(cx + w2 / 2, cy)
    ctx.lineTo(cx - w2 / 2, cy - h2 / 2)
    ctx.lineTo(cx - w2 / 2, cy + h2 / 2)
    ctx.closePath()
  } else {
    ctx.ellipse(cx, cy, w2 / 2, h2 / 2, 0, 0, Math.PI * 2)
  }
  ctx.fill()

  ctx.strokeStyle = b.accentColor
  ctx.lineWidth = 0.8 * scale
  if (b.type === 'speedboat') {
    ctx.beginPath()
    ctx.moveTo(cx + w2 * 0.2, cy)
    ctx.lineTo(cx - w2 * 0.3, cy)
    ctx.stroke()
    ctx.fillStyle = b.accentColor
    ctx.fillRect(cx - w2 * 0.1, cy - h2 * 0.3, w2 * 0.25, h2 * 0.4)
  } else {
    ctx.beginPath()
    ctx.ellipse(cx, cy, w2 * 0.35, h2 * 0.25, 0, 0, Math.PI * 2)
    ctx.stroke()
  }
}

// ---- Market stall ----
function drawMarketStall(
  ctx: CanvasRenderingContext2D,
  m: ResolvedMarketStall,
  scale: number,
  ox: number,
  oy: number,
) {
  const [cx, cy] = projectToIso(m.cx, m.cy, scale, ox, oy)
  const w2 = m.w * scale
  const h2 = m.h * scale

  ctx.fillStyle = 'rgba(0,0,0,0.08)'
  ctx.beginPath()
  ctx.moveTo(cx - w2 * 0.5, cy + 2 * scale)
  ctx.lineTo(cx, cy + w2 * 0.3 + 2 * scale)
  ctx.lineTo(cx + w2 * 0.5, cy + 2 * scale)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = m.canopyColor
  ctx.beginPath()
  ctx.moveTo(cx - w2 * 0.5, cy)
  ctx.lineTo(cx, cy - h2)
  ctx.lineTo(cx + w2 * 0.5, cy)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = 'rgba(255,255,255,0.15)'
  ctx.beginPath()
  ctx.moveTo(cx - w2 * 0.3, cy)
  ctx.lineTo(cx, cy - h2 * 0.7)
  ctx.lineTo(cx + w2 * 0.1, cy)
  ctx.closePath()
  ctx.fill()

  ctx.strokeStyle = '#8B7B4A'
  ctx.lineWidth = 0.5 * scale
  ctx.beginPath()
  ctx.moveTo(cx - w2 * 0.45, cy)
  ctx.lineTo(cx - w2 * 0.45, cy + 1 * scale)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(cx + w2 * 0.45, cy)
  ctx.lineTo(cx + w2 * 0.45, cy + 1 * scale)
  ctx.stroke()
}

// ---- High-density market patchwork ----
const MARKET_PATCH_COLORS = ['#E07040', '#D4A030', '#C04040', '#3A9BC8', '#E8A040', '#50B080']

function drawMarketZone(
  ctx: CanvasRenderingContext2D,
  z: ResolvedMarketZone,
  seed: number,
  scale: number,
  ox: number,
  oy: number,
) {
  const rng = mulberry32(seed + Math.round(z.cx * 100 + z.cy * 3))
  for (let i = 0; i < 150; i++) {
    const rx = z.cx + (rng() - 0.5) * z.rx * 1.4
    const ry = z.cy + (rng() - 0.5) * z.ry * 1.4
    const [sx, sy] = projectToIso(rx, ry, scale, ox, oy)
    const stallSize = (2 + rng() * 3) * scale

    ctx.fillStyle = MARKET_PATCH_COLORS[Math.floor(rng() * MARKET_PATCH_COLORS.length)]
    ctx.beginPath()
    ctx.arc(sx, sy, stallSize, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = 'rgba(255,255,255,0.2)'
    ctx.beginPath()
    ctx.arc(sx, sy, stallSize, 0, Math.PI, true)
    ctx.fill()
  }
}

// ---- Streetlight ----
function drawStreetlight(
  ctx: CanvasRenderingContext2D,
  s: ResolvedStreetlight,
  scale: number,
  ox: number,
  oy: number,
) {
  const [cx, cy] = projectToIso(s.cx, s.cy, scale, ox, oy)
  ctx.strokeStyle = '#A09888'
  ctx.lineWidth = 0.6 * scale
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.lineTo(cx, cy - 4 * scale)
  ctx.stroke()
  ctx.fillStyle = '#C8C0B0'
  ctx.beginPath()
  ctx.arc(cx, cy - 4.5 * scale, 1 * scale, 0, Math.PI * 2)
  ctx.fill()
}

// ---- Billboard ----
function drawBillboard(
  ctx: CanvasRenderingContext2D,
  b: ResolvedBillboard,
  scale: number,
  ox: number,
  oy: number,
) {
  const [cx, cy] = projectToIso(b.cx, b.cy, scale, ox, oy)
  const bw = 3 * scale
  const bh = 2.5 * scale

  ctx.fillStyle = 'rgba(0,0,0,0.08)'
  ctx.fillRect(cx - bw / 2 + 0.5 * scale, cy - bh / 2 + 0.5 * scale, bw, bh)

  ctx.fillStyle = b.color
  ctx.fillRect(cx - bw / 2, cy - bh / 2, bw, bh)

  ctx.strokeStyle = 'rgba(0,0,0,0.1)'
  ctx.lineWidth = 0.3 * scale
  ctx.strokeRect(cx - bw / 2, cy - bh / 2, bw, bh)

  ctx.strokeStyle = '#888078'
  ctx.lineWidth = 0.5 * scale
  ctx.beginPath()
  ctx.moveTo(cx, cy + bh / 2)
  ctx.lineTo(cx, cy + bh / 2 + 2 * scale)
  ctx.stroke()
}

// ---- Pin ----
function drawPin(
  ctx: CanvasRenderingContext2D,
  p: ResolvedPin,
  scale: number,
  ox: number,
  oy: number,
) {
  const [cx, cy] = projectToIso(p.cx, p.cy, scale, ox, oy)
  const r = 8 * scale

  const time = performance.now() * 0.003
  const phaseOffset = (p.cx + p.cy) * 0.04
  const bounce = Math.sin(time + phaseOffset) * 3 * scale
  const floatOffset = 28 * scale + bounce
  const pinY = cy - floatOffset
  const shadowShrink = 1.0 - (bounce / (6 * scale)) * 0.15

  ctx.fillStyle = 'rgba(0,0,0,0.13)'
  ctx.beginPath()
  ctx.ellipse(cx, cy, r * 0.8 * shadowShrink, r * 0.4 * shadowShrink, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = p.color
  ctx.beginPath()
  ctx.arc(cx, pinY - r * 1.3, r, -Math.PI / 6, Math.PI + Math.PI / 6)
  ctx.lineTo(cx, pinY)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.arc(cx, pinY - r * 1.3, r * 0.55, 0, Math.PI * 2)
  ctx.fill()
}

// ---- Walkway ----
function drawWalkway(
  ctx: CanvasRenderingContext2D,
  pts: [number, number][],
  scale: number,
  ox: number,
  oy: number,
) {
  const scaled = pts.map(([x, y]) => projectToIso(x, y, scale, ox, oy))
  ctx.strokeStyle = '#8B7B5A'
  ctx.lineWidth = 1.2 * scale
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(scaled[0][0], scaled[0][1])
  for (let i = 1; i < scaled.length; i++) ctx.lineTo(scaled[i][0], scaled[i][1])
  ctx.stroke()
  ctx.strokeStyle = '#A09070'
  ctx.lineWidth = 0.4 * scale
  ctx.setLineDash([1.5 * scale, 2 * scale])
  ctx.beginPath()
  ctx.moveTo(scaled[0][0], scaled[0][1])
  for (let i = 1; i < scaled.length; i++) ctx.lineTo(scaled[i][0], scaled[i][1])
  ctx.stroke()
  ctx.setLineDash([])
}

// ---- Boat wake ----
function drawWake(
  ctx: CanvasRenderingContext2D,
  bx: number,
  by: number,
  rot: number,
  w: number,
  scale: number,
) {
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'
  ctx.lineWidth = 0.5 * scale
  ctx.lineCap = 'round'
  const wakeLen = w * 0.8 * scale
  const ang = rot + Math.PI
  ctx.beginPath()
  ctx.moveTo(bx + Math.cos(ang) * w * 0.4 * scale, by + Math.sin(ang) * w * 0.4 * scale)
  ctx.lineTo(bx + Math.cos(ang) * wakeLen, by + Math.sin(ang) * wakeLen)
  ctx.stroke()
  for (const side of [-1, 1]) {
    const sa = rot - (Math.PI / 4) * side
    ctx.beginPath()
    ctx.moveTo(bx + Math.cos(rot) * w * 0.1 * scale, by + Math.sin(rot) * w * 0.1 * scale)
    ctx.lineTo(bx + Math.cos(sa) * wakeLen * 0.6, by + Math.sin(sa) * wakeLen * 0.6)
    ctx.stroke()
  }
}

// ---- Ferry terminal dock ----
function drawFerryTerminal(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  ox: number,
  oy: number,
) {
  const [px, py] = projectToIso(x, y, scale, ox, oy)
  const dw = 5 * scale
  const dh = 3 * scale
  ctx.fillStyle = '#8B7B5A'
  ctx.fillRect(px - dw / 2, py - dh, dw, dh)
  ctx.fillStyle = '#A09070'
  ctx.fillRect(px - dw / 2 + 0.5 * scale, py - dh + 0.5 * scale, dw - scale, dh - scale)
  ctx.fillStyle = '#B0A080'
  ctx.fillRect(px - dw * 0.4, py - dh - 2 * scale, dw * 0.8, 1.5 * scale)
  ctx.strokeStyle = '#706050'
  ctx.lineWidth = 0.5 * scale
  ctx.beginPath()
  ctx.moveTo(px, py - dh)
  ctx.lineTo(px, py - dh - 2 * scale)
  ctx.stroke()
}

// ---- Main render ----
export function drawCity(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  scale: number,
  ox: number,
  oy: number,
  scene: ResolvedScene,
) {
  drawWater(ctx, w, h, scale)

  for (const lm of scene.landmasses) drawLandmass(ctx, lm, scale, ox, oy)
  for (const r of scene.roads) drawRoad(ctx, r, scale, ox, oy)
  for (const b of scene.bridges) drawBridge(ctx, b, scale, ox, oy)
  for (const ww of scene.walkways) drawWalkway(ctx, ww.points, scale, ox, oy)

  const terminals: [number, number][] = [
    [115, 250],
    [135, 248],
    [290, 238],
    [90, 182],
    [200, 258],
  ]
  for (const [tx, ty] of terminals) drawFerryTerminal(ctx, tx, ty, scale, ox, oy)

  const depthElements: { sortY: number; draw: () => void }[] = []
  for (const b of scene.buildings) {
    const b2 = b
    depthElements.push({ sortY: b.sortY, draw: () => drawBuilding(ctx, b2, scale, ox, oy) })
  }
  for (const t of scene.trees) {
    const t2 = t
    depthElements.push({ sortY: t.sortY, draw: () => drawTree(ctx, t2, scale, ox, oy) })
  }
  for (const m of scene.marketStalls) {
    const m2 = m
    depthElements.push({ sortY: m.sortY, draw: () => drawMarketStall(ctx, m2, scale, ox, oy) })
  }
  for (const v of scene.vehicles) {
    const v2 = v
    depthElements.push({ sortY: v.sortY, draw: () => drawVehicle(ctx, v2, scale, ox, oy) })
  }
  for (const b of scene.boats) {
    const b2 = b
    depthElements.push({ sortY: b.sortY, draw: () => drawBoat(ctx, b2, scale, ox, oy) })
  }
  for (const s of scene.streetlights) {
    const s2 = s
    depthElements.push({ sortY: s.sortY, draw: () => drawStreetlight(ctx, s2, scale, ox, oy) })
  }
  for (const b of scene.billboards) {
    const b2 = b
    depthElements.push({ sortY: b.sortY, draw: () => drawBillboard(ctx, b2, scale, ox, oy) })
  }

  depthElements.sort((a, b) => a.sortY - b.sortY)
  for (const el of depthElements) el.draw()

  for (const p of scene.pins) drawPin(ctx, p, scale, ox, oy)

  for (const z of scene.marketZones) drawMarketZone(ctx, z, scene.seed, scale, ox, oy)

  ctx.globalAlpha = 1
}
