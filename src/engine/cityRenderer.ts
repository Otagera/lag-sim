import type {
  ResolvedScene,
  ResolvedBuilding,
  ResolvedTree,
  ResolvedVehicle,
  ResolvedBoat,
  ResolvedLandmass,
  ResolvedRoad,
  ResolvedBridge,
  ResolvedPin,
  ResolvedMarketStall,
  ResolvedMarketZone,
  ResolvedStreetlight,
  ResolvedBillboard,
} from '../data/cityScene'
import { mulberry32 } from '../data/cityScene'
import { WATER, LAND, BRIDGE as BCOL, VEHICLES as VCOL } from '../data/cityPalette'
import { projectToIso } from '../ui/mapData'

// ---- Depth multiplier ----
function depthMul(depthLayer: number): number {
  // 0 = background (lighter, less contrast)
  // 1 = midground (normal)
  // 2 = foreground (stronger)
  if (depthLayer === 0) return 0.85
  if (depthLayer === 2) return 1.0
  return 1.0
}

// ---- Water ----
function drawWater(ctx: CanvasRenderingContext2D, w: number, h: number, scale: number) {
  // Radial depth gradient — bright teal at land cores, deep navy at frame
  const grad = ctx.createRadialGradient(w / 2, h * 0.45, h * 0.15, w / 2, h / 2, w * 0.85)
  grad.addColorStop(0, '#7BCAD3')
  grad.addColorStop(0.25, '#5FB5C6')
  grad.addColorStop(0.5, '#4EA5BB')
  grad.addColorStop(1, '#2F7088')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)

  // Wave lines
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
function drawLandmass(ctx: CanvasRenderingContext2D, lm: ResolvedLandmass, scale: number, ox: number, oy: number) {
  const pts = lm.points.map(([x, y]) => projectToIso(x, y, scale, ox, oy))

  // Shallow water fringe (coastal reef)
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

  // Shadow offset
  ctx.beginPath()
  ctx.moveTo(pts[0][0], pts[0][1] + 3 * scale)
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1] + 3 * scale)
  ctx.closePath()
  ctx.fillStyle = LAND.shadow
  ctx.fill()

  // Main fill
  ctx.beginPath()
  ctx.moveTo(pts[0][0], pts[0][1])
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1])
  ctx.closePath()
  ctx.fillStyle = lm.color
  ctx.fill()

  // Beach edge for islands (wider sandy fringe)
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

  // Subtle coastline edge
  ctx.strokeStyle = LAND.edge
  ctx.lineWidth = 1.2 * scale
  ctx.beginPath()
  ctx.moveTo(pts[0][0], pts[0][1])
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1])
  ctx.closePath()
  ctx.stroke()
}

// ---- Roads with hierarchy ----
function drawRoad(ctx: CanvasRenderingContext2D, r: ResolvedRoad, scale: number, ox: number, oy: number) {
  const pts = r.points.map(([x, y]) => projectToIso(x, y, scale, ox, oy))

  const roadColor = r.level === 'primary' ? '#F0E8D8' : r.level === 'secondary' ? '#E8DDD0' : '#F0E8DC'
  const edgeColor = r.level === 'primary' ? '#C8B898' : '#D8CEBE'

  // Shadow (heavier for primary)
  ctx.strokeStyle = r.level === 'primary' ? 'rgba(120,100,80,0.25)' : 'rgba(160,140,120,0.2)'
  ctx.lineWidth = (r.w + (r.level === 'primary' ? 2 : 1)) * scale
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(pts[0][0], pts[0][1] + (r.level === 'primary' ? 3 : 1.5) * scale)
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1] + (r.level === 'primary' ? 3 : 1.5) * scale)
  ctx.stroke()

  // Road surface
  ctx.strokeStyle = roadColor
  ctx.lineWidth = r.w * scale
  ctx.beginPath()
  ctx.moveTo(pts[0][0], pts[0][1])
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1])
  ctx.stroke()

  // Edge lines on non-local
  if (r.level !== 'local') {
    ctx.strokeStyle = edgeColor
    ctx.lineWidth = r.level === 'primary' ? 1.2 * scale : 0.6 * scale
    for (let side = -1; side <= 1; side += 2) {
      ctx.beginPath()
      for (let i = 0; i < pts.length; i++) {
        const di = Math.max(0, Math.min(i, pts.length - 2))
        const dx = pts[di + 1][0] - pts[di][0]
        const dy = pts[di + 1][1] - pts[di][1]
        const len = Math.hypot(dx, dy) || 1
        const px = (-dy / len) * (r.w * scale / 2) * side
        const py = (dx / len) * (r.w * scale / 2) * side
        if (i === 0) ctx.moveTo(pts[i][0] + px, pts[i][1] + py)
        else ctx.lineTo(pts[i][0] + px, pts[i][1] + py)
      }
      ctx.stroke()
    }
  }

  // Center line + BRT on primary
  if (r.level === 'primary') {
    // Center line (dashed)
    ctx.strokeStyle = 'rgba(200,190,170,0.6)'
    ctx.lineWidth = 0.8 * scale
    ctx.setLineDash([4 * scale, 5 * scale])
    ctx.beginPath()
    ctx.moveTo(pts[0][0], pts[0][1])
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1])
    ctx.stroke()
    ctx.setLineDash([])

    // BRT corridor (blue band visible at zoom-out)
    ctx.strokeStyle = 'rgba(40,130,200,0.30)'
    ctx.lineWidth = 2.5 * scale
    ctx.setLineDash([3 * scale, 6 * scale])
    ctx.beginPath()
    ctx.moveTo(pts[0][0], pts[0][1])
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1])
    ctx.stroke()
    ctx.setLineDash([])
  }
}

// ---- Bridges ----
function drawBridge(ctx: CanvasRenderingContext2D, b: ResolvedBridge, scale: number, ox: number, oy: number) {
  const [x1, y1] = projectToIso(b.x1, b.y1, scale, ox, oy)
  const [x2, y2] = projectToIso(b.x2, b.y2, scale, ox, oy)
  const hw = b.w * scale / 2
  const dx = x2 - x1, dy = y2 - y1
  const len = Math.hypot(dx, dy) || 1
  const nx = -dy / len, ny = dx / len

  // Shadow
  ctx.strokeStyle = 'rgba(160,140,120,0.2)'
  ctx.lineWidth = b.w * scale + 2 * scale
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(x1, y1 + 2 * scale)
  ctx.lineTo(x2, y2 + 2 * scale)
  ctx.stroke()

  // Deck
  ctx.strokeStyle = BCOL.deck
  ctx.lineWidth = b.w * scale
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()

  // Deck edge
  ctx.strokeStyle = BCOL.deckShadow
  ctx.lineWidth = 0.5 * scale
  for (let s = -1; s <= 1; s += 2) {
    ctx.beginPath()
    ctx.moveTo(x1 + nx * hw * s, y1 + ny * hw * s)
    ctx.lineTo(x2 + nx * hw * s, y2 + ny * hw * s)
    ctx.stroke()
  }

  if (b.type === 'cable') {
    // Cable-stayed bridge: tall pylon at center
    const midX = (x1 + x2) / 2
    const midY = (y1 + y2) / 2
    const pylonH = 12 * scale

    // Pylon
    ctx.strokeStyle = BCOL.pylon
    ctx.lineWidth = 2.5 * scale
    ctx.beginPath()
    ctx.moveTo(midX, midY - pylonH)
    ctx.lineTo(midX, midY)
    ctx.stroke()

    // Cross beam
    ctx.lineWidth = 1.5 * scale
    ctx.beginPath()
    ctx.moveTo(midX - 3 * scale, midY - pylonH * 0.6)
    ctx.lineTo(midX + 3 * scale, midY - pylonH * 0.6)
    ctx.stroke()

    // Cables from pylon top to deck
    ctx.strokeStyle = BCOL.cable
    ctx.lineWidth = 0.5 * scale
    for (let i = 0; i <= 6; i++) {
      const t = i / 6
      const dx2 = x2 - midX, dy2 = y2 - midY
      const ex = midX + dx2 * t, ey = midY + dy2 * t
      ctx.beginPath()
      ctx.moveTo(midX, midY - pylonH)
      ctx.lineTo(ex, ey)
      ctx.stroke()
    }
    for (let i = 0; i <= 6; i++) {
      const t = i / 6
      const dx2 = x1 - midX, dy2 = y1 - midY
      const ex = midX + dx2 * t, ey = midY + dy2 * t
      ctx.beginPath()
      ctx.moveTo(midX, midY - pylonH)
      ctx.lineTo(ex, ey)
      ctx.stroke()
    }
  } else if (b.type === 'suspension') {
    // Suspension bridge: two pylons + curved cables
    const pylonH = 10 * scale
    const p1x = x1 + dx * 0.25, p1y = y1 + dy * 0.25
    const p2x = x1 + dx * 0.75, p2y = y1 + dy * 0.75

    // Pylons
    ctx.strokeStyle = BCOL.pylon
    ctx.lineWidth = 2.5 * scale
    ctx.beginPath()
    ctx.moveTo(p1x, p1y - pylonH)
    ctx.lineTo(p1x, p1y)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(p2x, p2y - pylonH)
    ctx.lineTo(p2x, p2y)
    ctx.stroke()

    // Main cable (parabolic)
    ctx.strokeStyle = BCOL.cable
    ctx.lineWidth = 1.2 * scale
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    for (let i = 0; i <= 20; i++) {
      const t = i / 20
      const px = lerp(lerp(x1, p1x, t), lerp(p1x, p2x, t), t)
      const py = lerp(lerp(y1, p1y - pylonH, t), lerp(p1y - pylonH, p2y - pylonH, t), t)
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.stroke()

    // Vertical suspenders
    ctx.lineWidth = 0.3 * scale
    for (let i = 1; i < 10; i++) {
      const t = i / 10
      const deckX = lerp(x1, x2, t), deckY = lerp(y1, y2, t)
      const cableY = deckY - pylonH * Math.sin(t * Math.PI)
      ctx.beginPath()
      ctx.moveTo(deckX, deckY)
      ctx.lineTo(deckX, cableY)
      ctx.stroke()
    }
  }
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

// ---- Building ----
function drawBuilding(ctx: CanvasRenderingContext2D, b: ResolvedBuilding, scale: number, ox: number, oy: number) {
  const [cx, cy] = projectToIso(b.cx, b.cy, scale, ox, oy)
  const w = b.w * scale
  const d = b.d * scale
  const h = b.h * scale
  const dm = depthMul(b.depthLayer)

  if (dm < 1) ctx.globalAlpha = dm

  // ---- Cascading tiered skyscraper ----
  if (b.type === 'glassTower') {
    const tiers = [
      { wFactor: 1.0, dFactor: 1.0, hStart: 0, hEnd: h * 0.4 },
      { wFactor: 0.78, dFactor: 0.78, hStart: h * 0.4, hEnd: h * 0.72 },
      { wFactor: 0.55, dFactor: 0.55, hStart: h * 0.72, hEnd: h },
    ]
    for (const tier of tiers) {
      const tw = w * tier.wFactor
      const td = d * tier.dFactor
      const baseShift = tier.hStart
      const tierH = tier.hEnd - tier.hStart

      const t_t: [number, number] = [cx, cy - td / 2 - baseShift]
      const r_t: [number, number] = [cx + tw / 2, cy - baseShift]
      const b_t: [number, number] = [cx, cy + td / 2 - baseShift]
      const l_t: [number, number] = [cx - tw / 2, cy - baseShift]

      // Left wall (shadow)
      ctx.beginPath()
      ctx.moveTo(l_t[0], l_t[1])
      ctx.lineTo(b_t[0], b_t[1])
      ctx.lineTo(b_t[0], b_t[1] - tierH)
      ctx.lineTo(l_t[0], l_t[1] - tierH)
      ctx.closePath()
      ctx.fillStyle = b.shadowColor
      ctx.fill()

      // Right wall (lit)
      ctx.beginPath()
      ctx.moveTo(r_t[0], r_t[1])
      ctx.lineTo(b_t[0], b_t[1])
      ctx.lineTo(b_t[0], b_t[1] - tierH)
      ctx.lineTo(r_t[0], r_t[1] - tierH)
      ctx.closePath()
      ctx.fillStyle = b.wallColor
      ctx.fill()

      // Top roof
      ctx.beginPath()
      ctx.moveTo(t_t[0], t_t[1] - tierH)
      ctx.lineTo(r_t[0], r_t[1] - tierH)
      ctx.lineTo(b_t[0], b_t[1] - tierH)
      ctx.lineTo(l_t[0], l_t[1] - tierH)
      ctx.closePath()
      ctx.fillStyle = b.roofColor
      ctx.fill()

      // Window grid on left wall
      ctx.strokeStyle = 'rgba(200,220,240,0.08)'
      ctx.lineWidth = 0.3 * scale
      const lw = Math.hypot(b_t[0] - l_t[0], b_t[1] - l_t[1])
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 3; col++) {
          ctx.fillStyle = 'rgba(200,220,255,0.06)'
          ctx.fillRect(
            l_t[0] + (b_t[0] - l_t[0]) * (col + 0.4) / 3,
            l_t[1] - tierH + (row + 0.3) * tierH / 4,
            lw * 0.06, tierH * 0.12,
          )
        }
      }

      // Window grid on right wall
      const rw = Math.hypot(b_t[0] - r_t[0], b_t[1] - r_t[1])
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 3; col++) {
          ctx.fillStyle = 'rgba(200,230,255,0.10)'
          ctx.fillRect(
            r_t[0] + (b_t[0] - r_t[0]) * (col + 0.4) / 3,
            r_t[1] - tierH + (row + 0.3) * tierH / 4,
            rw * 0.06, tierH * 0.12,
          )
        }
      }
    }
    if (dm < 1) ctx.globalAlpha = 1
    return
  }

  // ---- Standard box walls (residential, mixedUse, stilt) ----
  const t: [number, number] = [cx, cy - d / 2]
  const r: [number, number] = [cx + w / 2, cy]
  const bt: [number, number] = [cx, cy + d / 2]
  const l: [number, number] = [cx - w / 2, cy]

  // Stilt: pilings (dark charcoal)
  if (b.type === 'stilt') {
    ctx.strokeStyle = '#3A3028'
    ctx.lineWidth = 1.5 * scale
    for (let pi = -0.3; pi <= 0.3; pi += 0.6) {
      for (let pj = -0.25; pj <= 0.25; pj += 0.5) {
        const px = cx + pi * w, py = cy + pj * d
        ctx.beginPath()
        ctx.moveTo(px, py)
        ctx.lineTo(px, py + h + 4 * scale)
        ctx.stroke()
      }
    }
  }

  // Left wall (shadow side)
  ctx.beginPath()
  ctx.moveTo(l[0], l[1])
  ctx.lineTo(bt[0], bt[1])
  ctx.lineTo(bt[0], bt[1] + h)
  ctx.lineTo(l[0], l[1] + h)
  ctx.closePath()
  ctx.fillStyle = b.shadowColor
  ctx.fill()
  ctx.fillStyle = 'rgba(40, 30, 20, 0.08)'
  ctx.fill()

  glassDetails(ctx, b, scale, l, bt, h, 'left')

  // Right wall (lit side)
  ctx.beginPath()
  ctx.moveTo(r[0], r[1])
  ctx.lineTo(bt[0], bt[1])
  ctx.lineTo(bt[0], bt[1] + h)
  ctx.lineTo(r[0], r[1] + h)
  ctx.closePath()
  ctx.fillStyle = b.wallColor
  ctx.fill()
  ctx.fillStyle = 'rgba(255, 250, 240, 0.04)'
  ctx.fill()

  glassDetails(ctx, b, scale, r, bt, h, 'right')

  // ---- Pitched gable roof (residential) ----
  if (b.type === 'residential') {
    const roofTopY = cy - h
    const roofPitch = d * 0.4
    const ridgeCenter: [number, number] = [cx, roofTopY - d / 2 - roofPitch]
    const ridgeFront: [number, number] = [cx, roofTopY + d / 2 - roofPitch]
    const leftCorner: [number, number] = [cx - w / 2, roofTopY]
    const rightCorner: [number, number] = [cx + w / 2, roofTopY]
    const frontCorner: [number, number] = [cx, roofTopY + d / 2]

    // Left sloped face (shadow side)
    ctx.beginPath()
    ctx.moveTo(leftCorner[0], leftCorner[1])
    ctx.lineTo(frontCorner[0], frontCorner[1])
    ctx.lineTo(ridgeFront[0], ridgeFront[1])
    ctx.lineTo(ridgeCenter[0], ridgeCenter[1])
    ctx.closePath()
    ctx.fillStyle = b.shadowColor
    ctx.fill()

    // Right sloped face (lit side)
    ctx.beginPath()
    ctx.moveTo(rightCorner[0], rightCorner[1])
    ctx.lineTo(frontCorner[0], frontCorner[1])
    ctx.lineTo(ridgeFront[0], ridgeFront[1])
    ctx.lineTo(ridgeCenter[0], ridgeCenter[1])
    ctx.closePath()
    ctx.fillStyle = b.roofColor
    ctx.fill()
  } else {
    // ---- Flat roof (mixedUse, stilt) ----
    ctx.beginPath()
    ctx.moveTo(t[0], t[1])
    ctx.lineTo(r[0], r[1])
    ctx.lineTo(bt[0], bt[1])
    ctx.lineTo(l[0], l[1])
    ctx.closePath()
    ctx.fillStyle = b.roofColor
    ctx.fill()
  }

  ctx.strokeStyle = 'rgba(0,0,0,0.06)'
  ctx.lineWidth = 0.4 * scale
  ctx.stroke()

  // Crisp corner highlight
  ctx.strokeStyle = 'rgba(255,255,255,0.22)'
  ctx.lineWidth = 0.6 * scale
  ctx.beginPath()
  ctx.moveTo(bt[0], bt[1])
  ctx.lineTo(bt[0], bt[1] + h)
  ctx.stroke()

  if (dm < 1) ctx.globalAlpha = 1
}

function glassDetails(ctx: CanvasRenderingContext2D, b: ResolvedBuilding, scale: number,
  start: [number, number], end: [number, number], h: number, side: 'left' | 'right') {
  if (b.type !== 'glassTower') return
  ctx.strokeStyle = 'rgba(200,220,240,0.10)'
  ctx.lineWidth = 0.3 * scale
  const wallW = Math.hypot(end[0] - start[0], end[1] - start[1])
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 4; col++) {
      const gx = start[0] + (end[0] - start[0]) * (col + 0.5) / 4
      const gy = start[1] + (end[1] - start[1]) * (col + 0.5) / 4
      ctx.fillStyle = side === 'left' ? 'rgba(200,220,255,0.08)' : 'rgba(200,230,255,0.12)'
      ctx.fillRect(gx - wallW * 0.04, gy + (row + 0.3) * h / 6, wallW * 0.08, h * 0.1)
    }
  }
  // Reflection streak (right side only)
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
function drawTree(ctx: CanvasRenderingContext2D, t: ResolvedTree, scale: number, ox: number, oy: number) {
  const [cx, cy] = projectToIso(t.cx, t.cy, scale, ox, oy)
  const cr = t.canopyR * scale

  // Ground shadow — squashed ellipse anchors tree to isometric floor
  ctx.fillStyle = 'rgba(140,120,100,0.25)'
  ctx.beginPath()
  ctx.ellipse(cx, cy, cr * 1.2, cr * 0.6, 0, 0, Math.PI * 2)
  ctx.fill()

  if (t.isMangrove) {
    // Mangroves: dense dark clusters hugging coastline
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

  // Trunk
  ctx.strokeStyle = t.trunkColor
  ctx.lineWidth = 1.5 * scale
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.lineTo(cx, cy - cr * 1.2)
  ctx.stroke()

  // Canopy
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
    // Shaded canopy with multi-toned circles
    ctx.fillStyle = t.canopyColor
    ctx.beginPath()
    ctx.arc(cx, canopyY, cr, 0, Math.PI * 2)
    ctx.fill()
    // Lit side highlight
    ctx.fillStyle = 'rgba(255,255,255,0.15)'
    ctx.beginPath()
    ctx.arc(cx - cr * 0.2, canopyY - cr * 0.2, cr * 0.7, 0, Math.PI * 2)
    ctx.fill()
  }
}

// ---- Vehicle ----
function drawVehicle(ctx: CanvasRenderingContext2D, v: ResolvedVehicle, scale: number, ox: number, oy: number) {
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

  // Danfo stripes: two charcoal-black bands along the body
  if (v.color === VCOL.danfo) {
    ctx.fillStyle = 'rgba(40,35,30,0.65)'
    ctx.fillRect(-w2 * 0.38, -h2 * 0.2, w2 * 0.76, h2 * 0.1)
    ctx.fillRect(-w2 * 0.38, h2 * 0.1, w2 * 0.76, h2 * 0.1)
  }

  ctx.restore()
}

// ---- Boat ----
function drawBoat(ctx: CanvasRenderingContext2D, b: ResolvedBoat, scale: number, ox: number, oy: number) {
  const [cx, cy] = projectToIso(b.cx, b.cy, scale, ox, oy)
  const w2 = b.w * scale
  const h2 = b.h * scale

  // Wake (skip for stationary canoes)
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
    // Sleek speedboat: pointed bow, flat stern
    ctx.moveTo(cx + w2 / 2, cy)
    ctx.lineTo(cx - w2 / 2, cy - h2 / 2)
    ctx.lineTo(cx - w2 / 2, cy + h2 / 2)
    ctx.closePath()
  } else {
    ctx.ellipse(cx, cy, w2 / 2, h2 / 2, 0, 0, Math.PI * 2)
  }
  ctx.fill()

  // Superstructure stripe
  ctx.strokeStyle = b.accentColor
  ctx.lineWidth = 0.8 * scale
  if (b.type === 'speedboat') {
    ctx.beginPath()
    ctx.moveTo(cx + w2 * 0.2, cy)
    ctx.lineTo(cx - w2 * 0.3, cy)
    ctx.stroke()
    // Cabin
    ctx.fillStyle = b.accentColor
    ctx.fillRect(cx - w2 * 0.1, cy - h2 * 0.3, w2 * 0.25, h2 * 0.4)
  } else {
    ctx.beginPath()
    ctx.ellipse(cx, cy, w2 * 0.35, h2 * 0.25, 0, 0, Math.PI * 2)
    ctx.stroke()
  }
}

// ---- Market stall ----
function drawMarketStall(ctx: CanvasRenderingContext2D, m: ResolvedMarketStall, scale: number, ox: number, oy: number) {
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

  // Support poles
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

// ---- High-density market patchwork (Balogun / Tejuosho) ----
const MARKET_PATCH_COLORS = ['#E07040', '#D4A030', '#C04040', '#3A9BC8', '#E8A040', '#50B080']

function drawMarketZone(ctx: CanvasRenderingContext2D, z: ResolvedMarketZone, seed: number, scale: number, ox: number, oy: number) {
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

    // Highlight slice
    ctx.fillStyle = 'rgba(255,255,255,0.2)'
    ctx.beginPath()
    ctx.arc(sx, sy, stallSize, 0, Math.PI, true)
    ctx.fill()
  }
}

// ---- Streetlight ----
function drawStreetlight(ctx: CanvasRenderingContext2D, s: ResolvedStreetlight, scale: number, ox: number, oy: number) {
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
function drawBillboard(ctx: CanvasRenderingContext2D, b: ResolvedBillboard, scale: number, ox: number, oy: number) {
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

  // Support pole
  ctx.strokeStyle = '#888078'
  ctx.lineWidth = 0.5 * scale
  ctx.beginPath()
  ctx.moveTo(cx, cy + bh / 2)
  ctx.lineTo(cx, cy + bh / 2 + 2 * scale)
  ctx.stroke()
}

// ---- Pin ----
function drawPin(ctx: CanvasRenderingContext2D, p: ResolvedPin, scale: number, ox: number, oy: number) {
  const [cx, cy] = projectToIso(p.cx, p.cy, scale, ox, oy)
  const r = 11 * scale

  // Time-driven staggered bounce
  const time = performance.now() * 0.003
  const phaseOffset = (p.cx + p.cy) * 0.04
  const bounce = Math.sin(time + phaseOffset) * 3 * scale
  const floatOffset = 14 * scale + bounce
  const pinY = cy - floatOffset
  const shadowShrink = 1.0 - (bounce / (6 * scale)) * 0.15

  // Ground drop shadow (shrinks as pin rises)
  ctx.fillStyle = 'rgba(0,0,0,0.13)'
  ctx.beginPath()
  ctx.ellipse(cx, cy, r * 0.8 * shadowShrink, r * 0.4 * shadowShrink, 0, 0, Math.PI * 2)
  ctx.fill()

  // Teardrop pin body
  ctx.fillStyle = p.color
  ctx.beginPath()
  ctx.arc(cx, pinY - r * 1.3, r, -Math.PI / 6, Math.PI + Math.PI / 6)
  ctx.lineTo(cx, pinY)
  ctx.closePath()
  ctx.fill()

  // White inner badge
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.arc(cx, pinY - r * 1.3, r * 0.55, 0, Math.PI * 2)
  ctx.fill()
}

// ---- Walkway ----
function drawWalkway(ctx: CanvasRenderingContext2D, pts: [number, number][], scale: number, ox: number, oy: number) {
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
function drawWake(ctx: CanvasRenderingContext2D, bx: number, by: number, rot: number, w: number, scale: number) {
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
    const sa = rot - Math.PI / 4 * side
    ctx.beginPath()
    ctx.moveTo(bx + Math.cos(rot) * w * 0.1 * scale, by + Math.sin(rot) * w * 0.1 * scale)
    ctx.lineTo(bx + Math.cos(sa) * wakeLen * 0.6, by + Math.sin(sa) * wakeLen * 0.6)
    ctx.stroke()
  }
}

// ---- Ferry terminal dock ----
function drawFerryTerminal(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, ox: number, oy: number) {
  const [px, py] = projectToIso(x, y, scale, ox, oy)
  const dw = 5 * scale
  const dh = 3 * scale
  // Pier
  ctx.fillStyle = '#8B7B5A'
  ctx.fillRect(px - dw / 2, py - dh, dw, dh)
  // Deck
  ctx.fillStyle = '#A09070'
  ctx.fillRect(px - dw / 2 + 0.5 * scale, py - dh + 0.5 * scale, dw - scale, dh - scale)
  // Roof
  ctx.fillStyle = '#B0A080'
  ctx.fillRect(px - dw * 0.4, py - dh - 2 * scale, dw * 0.8, 1.5 * scale)
  // Pole
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
  w: number, h: number,
  scale: number, ox: number, oy: number,
  scene: ResolvedScene,
) {
  drawWater(ctx, w, h, scale)

  for (const lm of scene.landmasses) drawLandmass(ctx, lm, scale, ox, oy)
  for (const r of scene.roads) drawRoad(ctx, r, scale, ox, oy)
  for (const b of scene.bridges) drawBridge(ctx, b, scale, ox, oy)
  for (const w of scene.walkways) drawWalkway(ctx, w.points, scale, ox, oy)

  // Ferry terminals
  const terminals: [number, number][] = [
    [115, 250], [135, 248], [290, 238], [90, 182], [200, 258],
  ]
  for (const [tx, ty] of terminals) drawFerryTerminal(ctx, tx, ty, scale, ox, oy)

  // Depth-sorted elements
  const depthElements: { sortY: number; draw: () => void }[] = []
  for (const b of scene.buildings) { const b2 = b; depthElements.push({ sortY: b.sortY, draw: () => drawBuilding(ctx, b2, scale, ox, oy) }) }
  for (const t of scene.trees) { const t2 = t; depthElements.push({ sortY: t.sortY, draw: () => drawTree(ctx, t2, scale, ox, oy) }) }
  for (const m of scene.marketStalls) { const m2 = m; depthElements.push({ sortY: m.sortY, draw: () => drawMarketStall(ctx, m2, scale, ox, oy) }) }
  for (const v of scene.vehicles) { const v2 = v; depthElements.push({ sortY: v.sortY, draw: () => drawVehicle(ctx, v2, scale, ox, oy) }) }
  for (const b of scene.boats) { const b2 = b; depthElements.push({ sortY: b.sortY, draw: () => drawBoat(ctx, b2, scale, ox, oy) }) }
  for (const s of scene.streetlights) { const s2 = s; depthElements.push({ sortY: s.sortY, draw: () => drawStreetlight(ctx, s2, scale, ox, oy) }) }
  for (const b of scene.billboards) { const b2 = b; depthElements.push({ sortY: b.sortY, draw: () => drawBillboard(ctx, b2, scale, ox, oy) }) }

  depthElements.sort((a, b) => a.sortY - b.sortY)
  for (const el of depthElements) el.draw()

  for (const p of scene.pins) drawPin(ctx, p, scale, ox, oy)

  // High-density market patchwork overlay (after all depth-sorted elements)
  for (const z of scene.marketZones) drawMarketZone(ctx, z, scene.seed, scale, ox, oy)

  ctx.globalAlpha = 1
}
