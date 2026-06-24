// Isometric rendering primitives for the district canvas view.
// sx/sy = TOP VERTEX of the isometric rhombus tile at ground level (z=0).

export const TILE_W  = 48
export const TILE_H  = 24
export const FLOOR_H = 14

export interface BuildingColors {
  roof:  string
  left:  string
  right: string
}

export function isoToScreen(
  col: number, row: number, z: number,
  ox: number, oy: number,
): [number, number] {
  return [
    (col - row) * (TILE_W / 2) + ox,
    (col + row) * (TILE_H / 2) - z * FLOOR_H + oy,
  ]
}

// ── Palette ──────────────────────────────────────────────────────────────────

// Warm Lagos palette: terracotta for poor, amber for mid, teal glass for upscale.
export function buildingColors(approval: number, character: string): BuildingColors {
  if (character === 'industrial')
    return { roof: '#A8A088', left: '#888070', right: '#6C6858' }
  if (character === 'upscale' || approval > 85)
    return { roof: '#E0E8F0', left: '#407898', right: '#7CC0D0' }
  if (approval > 65)
    return { roof: '#E8C060', left: '#C8980C', right: '#A87820' }
  if (approval > 40)
    return { roof: '#D48048', left: '#B06028', right: '#904018' }
  return { roof: '#C86040', left: '#A04020', right: '#883010' }
}

export function roadColor(infraScore: number): string {
  return infraScore > 60 ? '#8A7860' : '#B09050'
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function rhombus(ctx: CanvasRenderingContext2D, sx: number, sy: number, fill: string) {
  ctx.fillStyle = fill
  ctx.beginPath()
  ctx.moveTo(sx,              sy)
  ctx.lineTo(sx + TILE_W / 2, sy + TILE_H / 2)
  ctx.lineTo(sx,              sy + TILE_H)
  ctx.lineTo(sx - TILE_W / 2, sy + TILE_H / 2)
  ctx.closePath()
  ctx.fill()
}

// ── Ground tiles ──────────────────────────────────────────────────────────────

export function drawGround(ctx: CanvasRenderingContext2D, sx: number, sy: number, color: string) {
  rhombus(ctx, sx, sy, color)
  ctx.strokeStyle = 'rgba(0,0,0,0.025)'
  ctx.lineWidth = 0.5
  ctx.stroke()
}

export function drawBeachTile(ctx: CanvasRenderingContext2D, sx: number, sy: number) {
  rhombus(ctx, sx, sy, '#E8D498')
  // Subtle sand ripple
  ctx.fillStyle = 'rgba(255,255,240,0.18)'
  ctx.beginPath()
  ctx.moveTo(sx - TILE_W * 0.25, sy + TILE_H * 0.52)
  ctx.lineTo(sx + TILE_W * 0.25, sy + TILE_H * 0.52)
  ctx.lineTo(sx + TILE_W * 0.20, sy + TILE_H * 0.62)
  ctx.lineTo(sx - TILE_W * 0.30, sy + TILE_H * 0.62)
  ctx.closePath()
  ctx.fill()
}

export function drawWater(ctx: CanvasRenderingContext2D, sx: number, sy: number) {
  // Shallow lagoon water on top of deep background
  rhombus(ctx, sx, sy, '#1E9AA8')

  // Foam/shimmer
  ctx.fillStyle = 'rgba(255,255,255,0.16)'
  ctx.beginPath()
  ctx.moveTo(sx - TILE_W * 0.30, sy + TILE_H * 0.33)
  ctx.lineTo(sx + TILE_W * 0.08, sy + TILE_H * 0.33)
  ctx.lineTo(sx + TILE_W * 0.04, sy + TILE_H * 0.48)
  ctx.lineTo(sx - TILE_W * 0.34, sy + TILE_H * 0.48)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = 'rgba(255,255,255,0.08)'
  ctx.beginPath()
  ctx.moveTo(sx + TILE_W * 0.05, sy + TILE_H * 0.58)
  ctx.lineTo(sx + TILE_W * 0.30, sy + TILE_H * 0.58)
  ctx.lineTo(sx + TILE_W * 0.26, sy + TILE_H * 0.70)
  ctx.lineTo(sx + TILE_W * 0.01, sy + TILE_H * 0.70)
  ctx.closePath()
  ctx.fill()
}

export function drawRoad(ctx: CanvasRenderingContext2D, sx: number, sy: number, color: string) {
  rhombus(ctx, sx, sy, color)
  // Defined road border
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'
  ctx.lineWidth = 0.8
  ctx.setLineDash([])
  ctx.beginPath()
  ctx.moveTo(sx,              sy)
  ctx.lineTo(sx + TILE_W / 2, sy + TILE_H / 2)
  ctx.lineTo(sx,              sy + TILE_H)
  ctx.lineTo(sx - TILE_W / 2, sy + TILE_H / 2)
  ctx.closePath()
  ctx.stroke()
  // Center divider dash
  ctx.strokeStyle = 'rgba(255,255,255,0.22)'
  ctx.lineWidth = 1
  ctx.setLineDash([3, 5])
  ctx.beginPath()
  ctx.moveTo(sx, sy + 4)
  ctx.lineTo(sx, sy + TILE_H - 4)
  ctx.stroke()
  ctx.setLineDash([])
}

// ── Building ──────────────────────────────────────────────────────────────────
// roofStyle: 'flat' = standard flat roof box
//            'pyramid' = hip roof (residential/waterfront)
//            'glass' = tall box with floor-line details (upscale)

export function drawBuilding(
  ctx: CanvasRenderingContext2D,
  sx: number, sy: number,
  floors: number,
  colors: BuildingColors,
  roofStyle: 'flat' | 'pyramid' | 'glass' = 'flat',
) {
  const h  = floors * FLOOR_H
  const hw = TILE_W / 2   // 24
  const hh = TILE_H / 2   // 12

  // Left face: D → C → C' → D'
  ctx.fillStyle = colors.left
  ctx.beginPath()
  ctx.moveTo(sx - hw, sy + hh)
  ctx.lineTo(sx,      sy + TILE_H)
  ctx.lineTo(sx,      sy + TILE_H - h)
  ctx.lineTo(sx - hw, sy + hh - h)
  ctx.closePath()
  ctx.fill()
  // Warm amber shadow overlay (sun from upper-right → left face in deep shade)
  ctx.fillStyle = 'rgba(45,30,20,0.13)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(0,0,0,0.12)'
  ctx.lineWidth = 0.5
  ctx.stroke()

  // Right face: B → C → C' → B'
  ctx.fillStyle = colors.right
  ctx.beginPath()
  ctx.moveTo(sx + hw, sy + hh)
  ctx.lineTo(sx,      sy + TILE_H)
  ctx.lineTo(sx,      sy + TILE_H - h)
  ctx.lineTo(sx + hw, sy + hh - h)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = 'rgba(0,0,0,0.12)'
  ctx.stroke()

  if (roofStyle === 'glass') {
    // Roof: A' → B' → C' → D'
    ctx.fillStyle = colors.roof
    ctx.beginPath()
    ctx.moveTo(sx,      sy - h)
    ctx.lineTo(sx + hw, sy + hh - h)
    ctx.lineTo(sx,      sy + TILE_H - h)
    ctx.lineTo(sx - hw, sy + hh - h)
    ctx.closePath()
    ctx.fill()
    ctx.strokeStyle = 'rgba(0,0,0,0.12)'
    ctx.stroke()

    // Horizontal floor lines on right face (glass grid)
    if (floors >= 2) {
      ctx.strokeStyle = 'rgba(255,255,255,0.20)'
      ctx.lineWidth = 0.6
      for (let f = 1; f < floors; f++) {
        const lineY = sy + TILE_H - h + f * FLOOR_H
        ctx.beginPath()
        ctx.moveTo(sx + hw, lineY - hh)
        ctx.lineTo(sx,      lineY)
        ctx.stroke()
        // Left face
        ctx.beginPath()
        ctx.moveTo(sx - hw, lineY - hh)
        ctx.lineTo(sx,      lineY)
        ctx.stroke()
      }
    }

    // Window parallelograms (both faces)
    if (floors >= 2) {
      const mx = 5
      const mv = 3
      ctx.fillStyle = 'rgba(170,230,245,0.50)'
      for (let f = 1; f < floors; f++) {
        const yBot = sy + hh - (f - 1) * FLOOR_H - mv
        const yTop = sy + hh - f * FLOOR_H + mv
        const x1 = sx - hw + mx, x2 = sx - mx
        ctx.beginPath()
        ctx.moveTo(x1, yBot + (x1 - (sx - hw)) * 0.5)
        ctx.lineTo(x2, yBot + (x2 - (sx - hw)) * 0.5)
        ctx.lineTo(x2, yTop + (x2 - (sx - hw)) * 0.5)
        ctx.lineTo(x1, yTop + (x1 - (sx - hw)) * 0.5)
        ctx.closePath()
        ctx.fill()
      }
      ctx.fillStyle = 'rgba(140,200,220,0.44)'
      for (let f = 1; f < floors; f++) {
        const yBot = sy + TILE_H - (f - 1) * FLOOR_H - mv
        const yTop = sy + TILE_H - f * FLOOR_H + mv
        const x1 = sx + mx, x2 = sx + hw - mx
        ctx.beginPath()
        ctx.moveTo(x1, yBot - (x1 - sx) * 0.5)
        ctx.lineTo(x2, yBot - (x2 - sx) * 0.5)
        ctx.lineTo(x2, yTop - (x2 - sx) * 0.5)
        ctx.lineTo(x1, yTop - (x1 - sx) * 0.5)
        ctx.closePath()
        ctx.fill()
      }
    }
  } else if (roofStyle === 'pyramid') {
    // Hip/pyramid roof instead of flat top
    const pitchH = 9
    const Px = sx, Py = sy + hh - h - pitchH  // peak above roof center

    // Back slopes — always terracotta (Lagos zinc/tile roof colour)
    ctx.fillStyle = '#C23828'
    ctx.beginPath()  // back-left: A' → D' → Peak
    ctx.moveTo(sx,      sy - h)
    ctx.lineTo(sx - hw, sy + hh - h)
    ctx.lineTo(Px, Py)
    ctx.closePath()
    ctx.fill()
    ctx.beginPath()  // back-right: A' → B' → Peak
    ctx.moveTo(sx,      sy - h)
    ctx.lineTo(sx + hw, sy + hh - h)
    ctx.lineTo(Px, Py)
    ctx.closePath()
    ctx.fill()

    // Left front slope: D' → C' → Peak
    ctx.fillStyle = '#A82818'
    ctx.beginPath()
    ctx.moveTo(sx - hw, sy + hh - h)
    ctx.lineTo(sx,      sy + TILE_H - h)
    ctx.lineTo(Px, Py)
    ctx.closePath()
    ctx.fill()
    ctx.strokeStyle = 'rgba(0,0,0,0.15)'
    ctx.lineWidth = 0.5
    ctx.stroke()

    // Right front slope: B' → C' → Peak (darkest, most in shadow)
    ctx.fillStyle = '#8C1C0C'
    ctx.beginPath()
    ctx.moveTo(sx + hw, sy + hh - h)
    ctx.lineTo(sx,      sy + TILE_H - h)
    ctx.lineTo(Px, Py)
    ctx.closePath()
    ctx.fill()
    ctx.strokeStyle = 'rgba(0,0,0,0.15)'
    ctx.stroke()

    // Small window hints on left face
    if (floors >= 2) {
      const mx = 5, mv = 3
      ctx.fillStyle = 'rgba(200,170,130,0.45)'
      for (let f = 1; f < floors; f++) {
        const yBot = sy + hh - (f - 1) * FLOOR_H - mv
        const yTop = sy + hh - f * FLOOR_H + mv
        const x1 = sx - hw + mx, x2 = sx - mx
        ctx.beginPath()
        ctx.moveTo(x1, yBot + (x1 - (sx - hw)) * 0.5)
        ctx.lineTo(x2, yBot + (x2 - (sx - hw)) * 0.5)
        ctx.lineTo(x2, yTop + (x2 - (sx - hw)) * 0.5)
        ctx.lineTo(x1, yTop + (x1 - (sx - hw)) * 0.5)
        ctx.closePath()
        ctx.fill()
      }
    }
  } else {
    // Flat roof: A' → B' → C' → D'
    ctx.fillStyle = colors.roof
    ctx.beginPath()
    ctx.moveTo(sx,      sy - h)
    ctx.lineTo(sx + hw, sy + hh - h)
    ctx.lineTo(sx,      sy + TILE_H - h)
    ctx.lineTo(sx - hw, sy + hh - h)
    ctx.closePath()
    ctx.fill()
    ctx.strokeStyle = 'rgba(0,0,0,0.12)'
    ctx.stroke()

    // Window parallelograms (both faces)
    if (floors >= 2) {
      const mx = 5, mv = 3
      ctx.fillStyle = 'rgba(155,205,235,0.48)'
      for (let f = 1; f < floors; f++) {
        const yBot = sy + hh - (f - 1) * FLOOR_H - mv
        const yTop = sy + hh - f * FLOOR_H + mv
        const x1 = sx - hw + mx, x2 = sx - mx
        ctx.beginPath()
        ctx.moveTo(x1, yBot + (x1 - (sx - hw)) * 0.5)
        ctx.lineTo(x2, yBot + (x2 - (sx - hw)) * 0.5)
        ctx.lineTo(x2, yTop + (x2 - (sx - hw)) * 0.5)
        ctx.lineTo(x1, yTop + (x1 - (sx - hw)) * 0.5)
        ctx.closePath()
        ctx.fill()
      }
      ctx.fillStyle = 'rgba(130,175,210,0.42)'
      for (let f = 1; f < floors; f++) {
        const yBot = sy + TILE_H - (f - 1) * FLOOR_H - mv
        const yTop = sy + TILE_H - f * FLOOR_H + mv
        const x1 = sx + mx, x2 = sx + hw - mx
        ctx.beginPath()
        ctx.moveTo(x1, yBot - (x1 - sx) * 0.5)
        ctx.lineTo(x2, yBot - (x2 - sx) * 0.5)
        ctx.lineTo(x2, yTop - (x2 - sx) * 0.5)
        ctx.lineTo(x1, yTop - (x1 - sx) * 0.5)
        ctx.closePath()
        ctx.fill()
      }
    }
  }
}

// ── Cascading skyscraper (3-tier stepback) ────────────────────────────────────

// Non-exported helper: draws one isometric box with window grid.
function isoBox(
  ctx: CanvasRenderingContext2D,
  sx: number, sy: number,
  hw: number, hh: number, h: number,
  leftCol: string, rightCol: string, roofCol: string,
) {
  // Left face (shadow side)
  ctx.fillStyle = leftCol
  ctx.beginPath()
  ctx.moveTo(sx - hw, sy + hh)
  ctx.lineTo(sx,      sy + hh * 2)
  ctx.lineTo(sx,      sy + hh * 2 - h)
  ctx.lineTo(sx - hw, sy + hh - h)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = 'rgba(45,30,20,0.12)'
  ctx.fill()  // warm shadow overlay

  // Right face (lit side)
  ctx.fillStyle = rightCol
  ctx.beginPath()
  ctx.moveTo(sx + hw, sy + hh)
  ctx.lineTo(sx,      sy + hh * 2)
  ctx.lineTo(sx,      sy + hh * 2 - h)
  ctx.lineTo(sx + hw, sy + hh - h)
  ctx.closePath()
  ctx.fill()

  // Window grid on right face — 3 evenly-spaced horizontal bands + 3 vertical columns
  if (h >= 8) {
    ctx.strokeStyle = 'rgba(255,255,255,0.28)'
    ctx.lineWidth = 0.7
    for (let f = 1; f <= 3; f++) {
      const ly = sy + hh * 2 - h + (f * h / 4)
      ctx.beginPath()
      ctx.moveTo(sx + hw, ly - hh)
      ctx.lineTo(sx,      ly)
      ctx.stroke()
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'
    ctx.lineWidth = 0.6
    for (const t of [0.25, 0.5, 0.75]) {
      const vx   = sx + t * hw
      const vBot = sy + hh * 2 - t * hh
      ctx.beginPath()
      ctx.moveTo(vx, vBot)
      ctx.lineTo(vx, vBot - h)
      ctx.stroke()
    }
  }

  // Roof (A'→B'→C'→D' — shifted up by h)
  ctx.fillStyle = roofCol
  ctx.beginPath()
  ctx.moveTo(sx,      sy - h)
  ctx.lineTo(sx + hw, sy + hh - h)
  ctx.lineTo(sx,      sy + hh * 2 - h)
  ctx.lineTo(sx - hw, sy + hh - h)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = 'rgba(0,0,0,0.15)'
  ctx.lineWidth = 0.5
  ctx.stroke()
}

// Three cascading tiers with decreasing footprint — VI-style glass tower.
export function drawSkyscraperTower(
  ctx: CanvasRenderingContext2D,
  sx: number, sy: number,
  floors: number,
) {
  const totalH = floors * FLOOR_H
  const hw     = TILE_W / 2   // 24
  const hh     = TILE_H / 2   // 12
  const h1     = totalH * 0.42
  const h2     = totalH * 0.34
  const h3     = totalH * 0.24

  // Base → mid → spire (back to front in painter's order)
  isoBox(ctx, sx, sy,           hw,        hh,        h1, '#3A7090', '#7CC0D0', '#E0E8F0')
  isoBox(ctx, sx, sy - h1,      hw * 0.75, hh * 0.75, h2, '#4882A0', '#8ECAD8', '#EFF4F8')
  isoBox(ctx, sx, sy - h1 - h2, hw * 0.45, hh * 0.45, h3, '#5892B0', '#A4D8EC', '#F8FAFD')
}

// ── Tree ──────────────────────────────────────────────────────────────────────

export function drawTree(ctx: CanvasRenderingContext2D, sx: number, sy: number, size = 1) {
  const cx = sx
  const cy = sy + TILE_H / 2
  const r  = 10 * size

  // Ground drop shadow — dark, compact, isometric footprint
  ctx.fillStyle = 'rgba(40,35,30,0.22)'
  ctx.beginPath()
  ctx.ellipse(cx + 2, cy + 3, r * 1.3, r * 0.55, 0, 0, Math.PI * 2)
  ctx.fill()

  // Trunk
  ctx.strokeStyle = '#5A4533'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.lineTo(cx, cy - r * 1.2)
  ctx.stroke()

  // Canopy — muted olive base (realistic Lagos dry-season foliage)
  const canopyY = cy - r * 1.2
  ctx.fillStyle = '#4A7A40'
  ctx.beginPath()
  ctx.arc(cx, canopyY, r, 0, Math.PI * 2)
  ctx.fill()

  // Mid cluster — brighter upper-left lobe
  ctx.fillStyle = '#5A9048'
  ctx.beginPath()
  ctx.arc(cx - r * 0.25, canopyY - r * 0.35, r * 0.55, 0, Math.PI * 2)
  ctx.fill()

  // Lit crescent — sun from upper-right, offset inside upper-left of canopy
  ctx.fillStyle = 'rgba(255,255,255,0.14)'
  ctx.beginPath()
  ctx.arc(cx - r * 0.20, canopyY - r * 0.20, r * 0.75, 0, Math.PI * 2)
  ctx.fill()
}

// ── Danfo bus ─────────────────────────────────────────────────────────────────
// Sits flush on the road tile — bottom edges align with tile surface.

export function drawDanfo(ctx: CanvasRenderingContext2D, sx: number, sy: number) {
  const bw = TILE_W * 0.21   // ~10px half-width — fits neatly in road lane
  const bd = TILE_H * 0.25   // ~6px depth
  const bh = 8               // height

  const bx = sx
  const by = sy + TILE_H * 0.10

  // Road contact patch — ellipse flush with pavement
  ctx.fillStyle = 'rgba(0,0,0,0.18)'
  ctx.beginPath()
  ctx.ellipse(bx, by + bd * 1.65, bw * 0.88, bd * 0.55, 0, 0, Math.PI * 2)
  ctx.fill()

  // Chassis cast shadow — offset isometric twin shifted bottom-right
  const os = 1.8  // shadow offset in screen px (sun from upper-right)
  ctx.fillStyle = 'rgba(0,0,0,0.22)'
  ctx.beginPath()
  ctx.moveTo(bx - bw + os, by + bd + os)
  ctx.lineTo(bx      + os, by + bd * 2 + os)
  ctx.lineTo(bx      + os, by + bd * 2 - bh + os)
  ctx.lineTo(bx - bw + os, by + bd - bh + os)
  ctx.closePath()
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(bx + bw + os, by + bd + os)
  ctx.lineTo(bx      + os, by + bd * 2 + os)
  ctx.lineTo(bx      + os, by + bd * 2 - bh + os)
  ctx.lineTo(bx + bw + os, by + bd - bh + os)
  ctx.closePath()
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(bx      + os, by - bh + os)
  ctx.lineTo(bx + bw + os, by + bd - bh + os)
  ctx.lineTo(bx      + os, by + bd * 2 - bh + os)
  ctx.lineTo(bx - bw + os, by + bd - bh + os)
  ctx.closePath()
  ctx.fill()

  // Left face (deep gold)
  ctx.fillStyle = '#C8A800'
  ctx.beginPath()
  ctx.moveTo(bx - bw, by + bd)
  ctx.lineTo(bx,      by + bd * 2)
  ctx.lineTo(bx,      by + bd * 2 - bh)
  ctx.lineTo(bx - bw, by + bd - bh)
  ctx.closePath()
  ctx.fill()

  // Right face (vivid canary yellow)
  ctx.fillStyle = '#FFD100'
  ctx.beginPath()
  ctx.moveTo(bx + bw, by + bd)
  ctx.lineTo(bx,      by + bd * 2)
  ctx.lineTo(bx,      by + bd * 2 - bh)
  ctx.lineTo(bx + bw, by + bd - bh)
  ctx.closePath()
  ctx.fill()

  // Charcoal stripe 1 — upper band (right face)
  ctx.fillStyle = '#1A1A26'
  ctx.beginPath()
  ctx.moveTo(bx + bw, by + bd - bh * 0.28)
  ctx.lineTo(bx,      by + bd * 2 - bh * 0.28)
  ctx.lineTo(bx,      by + bd * 2 - bh * 0.43)
  ctx.lineTo(bx + bw, by + bd - bh * 0.43)
  ctx.closePath()
  ctx.fill()

  // Charcoal stripe 2 — lower band (right face)
  ctx.fillStyle = '#1A1A26'
  ctx.beginPath()
  ctx.moveTo(bx + bw, by + bd - bh * 0.57)
  ctx.lineTo(bx,      by + bd * 2 - bh * 0.57)
  ctx.lineTo(bx,      by + bd * 2 - bh * 0.72)
  ctx.lineTo(bx + bw, by + bd - bh * 0.72)
  ctx.closePath()
  ctx.fill()

  // Windscreen (right face, bright cyan)
  ctx.fillStyle = 'rgba(185,240,255,0.68)'
  ctx.beginPath()
  ctx.moveTo(bx + bw * 0.22, by + bd * 1.78 - bh)
  ctx.lineTo(bx + bw * 0.90, by + bd * 1.22 - bh)
  ctx.lineTo(bx + bw * 0.90, by + bd * 1.22 - bh * 0.78)
  ctx.lineTo(bx + bw * 0.22, by + bd * 1.78 - bh * 0.78)
  ctx.closePath()
  ctx.fill()

  // Roof — A'→B'→C'→D' (shifted up by bh so it caps the walls)
  ctx.fillStyle = '#E8B800'
  ctx.beginPath()
  ctx.moveTo(bx,      by - bh)           // A' far
  ctx.lineTo(bx + bw, by + bd - bh)      // B' right
  ctx.lineTo(bx,      by + bd * 2 - bh)  // C' near
  ctx.lineTo(bx - bw, by + bd - bh)      // D' left
  ctx.closePath()
  ctx.fill()
  // Roof edge outline to separate from sky
  ctx.strokeStyle = 'rgba(0,0,0,0.18)'
  ctx.lineWidth = 0.6
  ctx.stroke()
}

// ── Crane ─────────────────────────────────────────────────────────────────────

export function drawCrane(ctx: CanvasRenderingContext2D, sx: number, sy: number) {
  const base = sy + TILE_H * 0.6
  const top  = sy - 50

  ctx.strokeStyle = '#909090'
  ctx.lineWidth = 3
  ctx.beginPath(); ctx.moveTo(sx, base); ctx.lineTo(sx, top); ctx.stroke()
  ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(sx - 18, top); ctx.lineTo(sx + 24, top); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(sx - 18, top); ctx.lineTo(sx - 18, top + 10); ctx.stroke()
  ctx.lineWidth = 1
  ctx.strokeStyle = '#666'
  ctx.beginPath(); ctx.moveTo(sx + 18, top); ctx.lineTo(sx + 18, top + 22); ctx.stroke()
  ctx.fillStyle = '#888'
  ctx.beginPath(); ctx.arc(sx + 18, top + 24, 3, 0, Math.PI * 2); ctx.fill()
}

// ── Market stall — vivid umbrella cluster on ground plane ─────────────────────

const UMBRELLA_PALETTE = ['#E83030', '#F0C020', '#2888E0', '#28A840', '#E030A0', '#F07020', '#9030C8']

export function drawMarketStall(
  ctx: CanvasRenderingContext2D,
  sx: number, sy: number,
  _awningColor: string,   // kept for API compat; palette is fixed vivid set
) {
  const cx = sx
  const cy = sy + TILE_H / 2

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.12)'
  ctx.beginPath()
  ctx.ellipse(cx + 2, cy + 2, TILE_W * 0.38, TILE_H * 0.38 * 0.5, 0, 0, Math.PI * 2)
  ctx.fill()

  // 12 umbrella canopies — tight bustling cluster
  const slots = [
    { dx: -9, dy: -4 }, { dx:  4, dy: -6 }, { dx: -4, dy:  4 }, { dx: 10, dy:  0 },
    { dx:  1, dy:  7 }, { dx: -12, dy: 1 }, { dx:  7, dy: -2 }, { dx: -6, dy:  8 },
    { dx: 12, dy:  5 }, { dx: -1, dy: 10 }, { dx:  8, dy:  9 }, { dx: -10, dy: -7 },
  ]
  for (let i = 0; i < slots.length; i++) {
    const { dx, dy } = slots[i]
    const ux = cx + dx, uy = cy + dy
    ctx.fillStyle = UMBRELLA_PALETTE[i % UMBRELLA_PALETTE.length]
    ctx.beginPath()
    ctx.ellipse(ux, uy, 7.5, 3.5, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,0.28)'
    ctx.beginPath()
    ctx.ellipse(ux - 1.2, uy - 0.5, 3.5, 1.5, 0, 0, Math.PI * 2)
    ctx.fill()
  }
}

// ── Ferry ─────────────────────────────────────────────────────────────────────
// Large passenger ferry — white hull, blue cabin, 2.3× wider than a danfo.

export function drawFerry(ctx: CanvasRenderingContext2D, sx: number, sy: number) {
  const bw = TILE_W * 0.46
  const bd = TILE_H * 0.28
  const bh = 11

  const bx = sx
  const by = sy + TILE_H * 0.05

  // Water contact shadow
  ctx.fillStyle = 'rgba(0,0,0,0.14)'
  ctx.beginPath()
  ctx.ellipse(bx, by + bd * 1.7, bw * 0.90, bd * 0.48, 0, 0, Math.PI * 2)
  ctx.fill()

  // Hull — left face (shadow side)
  ctx.fillStyle = '#B8C2C8'
  ctx.beginPath()
  ctx.moveTo(bx - bw, by + bd)
  ctx.lineTo(bx,      by + bd * 2)
  ctx.lineTo(bx,      by + bd * 2 - bh)
  ctx.lineTo(bx - bw, by + bd - bh)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = 'rgba(30,20,15,0.12)'
  ctx.fill()

  // Hull — right face (lit, white)
  ctx.fillStyle = '#E8EEF2'
  ctx.beginPath()
  ctx.moveTo(bx + bw, by + bd)
  ctx.lineTo(bx,      by + bd * 2)
  ctx.lineTo(bx,      by + bd * 2 - bh)
  ctx.lineTo(bx + bw, by + bd - bh)
  ctx.closePath()
  ctx.fill()

  // Blue waterline stripe on right face
  ctx.fillStyle = '#1A5880'
  ctx.beginPath()
  ctx.moveTo(bx + bw, by + bd - bh * 0.18)
  ctx.lineTo(bx,      by + bd * 2 - bh * 0.18)
  ctx.lineTo(bx,      by + bd * 2 - bh * 0.32)
  ctx.lineTo(bx + bw, by + bd - bh * 0.32)
  ctx.closePath()
  ctx.fill()

  // Hull roof / deck (white)
  ctx.fillStyle = '#F0F4F8'
  ctx.beginPath()
  ctx.moveTo(bx,      by - bh)
  ctx.lineTo(bx + bw, by + bd - bh)
  ctx.lineTo(bx,      by + bd * 2 - bh)
  ctx.lineTo(bx - bw, by + bd - bh)
  ctx.closePath()
  ctx.fill()

  // Superstructure (cabin) — smaller box on deck
  const ch = 7, cw = bw * 0.50, cd = bd * 0.50
  const cabY = by - bh

  ctx.fillStyle = '#1E5490'
  ctx.beginPath()
  ctx.moveTo(bx - cw, cabY + cd)
  ctx.lineTo(bx,      cabY + cd * 2)
  ctx.lineTo(bx,      cabY + cd * 2 - ch)
  ctx.lineTo(bx - cw, cabY + cd - ch)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = 'rgba(30,20,15,0.14)'
  ctx.fill()

  ctx.fillStyle = '#3070B8'
  ctx.beginPath()
  ctx.moveTo(bx + cw, cabY + cd)
  ctx.lineTo(bx,      cabY + cd * 2)
  ctx.lineTo(bx,      cabY + cd * 2 - ch)
  ctx.lineTo(bx + cw, cabY + cd - ch)
  ctx.closePath()
  ctx.fill()

  // Cabin windows
  ctx.fillStyle = 'rgba(180,225,250,0.72)'
  ctx.beginPath()
  ctx.moveTo(bx + cw * 0.20, cabY + cd * 1.80 - ch * 0.25)
  ctx.lineTo(bx + cw * 0.82, cabY + cd * 1.18 - ch * 0.25)
  ctx.lineTo(bx + cw * 0.82, cabY + cd * 1.18 - ch * 0.75)
  ctx.lineTo(bx + cw * 0.20, cabY + cd * 1.80 - ch * 0.75)
  ctx.closePath()
  ctx.fill()
}

// ── Keke (tricycle) ───────────────────────────────────────────────────────────
// Smaller than danfo — yellow-green canopy, open sides, nimble road presence.

export function drawKeke(ctx: CanvasRenderingContext2D, sx: number, sy: number) {
  const bw = TILE_W * 0.14
  const bd = TILE_H * 0.18
  const bh = 6

  const bx = sx
  const by = sy + TILE_H * 0.12

  // Road contact shadow
  ctx.fillStyle = 'rgba(0,0,0,0.16)'
  ctx.beginPath()
  ctx.ellipse(bx, by + bd * 1.6, bw * 0.85, bd * 0.50, 0, 0, Math.PI * 2)
  ctx.fill()

  // Body — left face (dark green)
  ctx.fillStyle = '#3E7018'
  ctx.beginPath()
  ctx.moveTo(bx - bw, by + bd)
  ctx.lineTo(bx,      by + bd * 2)
  ctx.lineTo(bx,      by + bd * 2 - bh)
  ctx.lineTo(bx - bw, by + bd - bh)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = 'rgba(30,20,10,0.18)'
  ctx.fill()

  // Body — right face (bright yellow-green)
  ctx.fillStyle = '#88C030'
  ctx.beginPath()
  ctx.moveTo(bx + bw, by + bd)
  ctx.lineTo(bx,      by + bd * 2)
  ctx.lineTo(bx,      by + bd * 2 - bh)
  ctx.lineTo(bx + bw, by + bd - bh)
  ctx.closePath()
  ctx.fill()

  // Black canopy roof
  ctx.fillStyle = '#1A1A1A'
  ctx.beginPath()
  ctx.moveTo(bx,      by - bh)
  ctx.lineTo(bx + bw, by + bd - bh)
  ctx.lineTo(bx,      by + bd * 2 - bh)
  ctx.lineTo(bx - bw, by + bd - bh)
  ctx.closePath()
  ctx.fill()
}

// ── Jetty / pier ──────────────────────────────────────────────────────────────
// Brown wooden pier extending from beach tile edge into the lagoon.

export function drawJetty(ctx: CanvasRenderingContext2D, sx: number, sy: number) {
  const startY = sy + TILE_H          // bottom vertex of beach tile
  const length = TILE_H * 2.6        // extends ~2.6 tile-rows south
  const wStart = TILE_W * 0.30
  const wEnd   = TILE_W * 0.20

  // Plank deck (one tapered quad)
  ctx.fillStyle = '#8B5E3C'
  ctx.beginPath()
  ctx.moveTo(sx - wStart / 2, startY)
  ctx.lineTo(sx + wStart / 2, startY)
  ctx.lineTo(sx + wEnd   / 2, startY + length)
  ctx.lineTo(sx - wEnd   / 2, startY + length)
  ctx.closePath()
  ctx.fill()

  // Plank gaps (horizontal lines)
  ctx.strokeStyle = 'rgba(0,0,0,0.28)'
  ctx.lineWidth = 0.8
  for (let i = 1; i <= 4; i++) {
    const t = i / 5
    const y = startY + t * length
    const w = wStart + (wEnd - wStart) * t
    ctx.beginPath()
    ctx.moveTo(sx - w / 2, y)
    ctx.lineTo(sx + w / 2, y)
    ctx.stroke()
  }

  // Side rails
  ctx.strokeStyle = '#5A3820'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(sx - wStart / 2, startY)
  ctx.lineTo(sx - wEnd   / 2, startY + length)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(sx + wStart / 2, startY)
  ctx.lineTo(sx + wEnd   / 2, startY + length)
  ctx.stroke()

  // End post
  ctx.fillStyle = '#4A2C10'
  ctx.fillRect(sx - 2, startY + length - 5, 4, 8)
}

// ── Billboard ─────────────────────────────────────────────────────────────────
// Slim pole + vibrant advertising face — VI / Lekki road-adjacent clutter.

const BOARD_PALETTE = ['#E83020', '#1A68C0', '#F0A800', '#228040']

export function drawBillboard(ctx: CanvasRenderingContext2D, sx: number, sy: number) {
  const poleX = sx + TILE_W * 0.10
  const poleY = sy + TILE_H * 0.60
  const poleH = 22
  const bw = 18, bh = 11

  // Support pole
  ctx.fillStyle = '#686868'
  ctx.fillRect(poleX - 1, poleY - poleH, 2, poleH)

  // Board face
  const colorIdx = Math.floor(Math.abs((sx * 3 + sy * 7)) % BOARD_PALETTE.length)
  ctx.fillStyle = BOARD_PALETTE[colorIdx]
  ctx.fillRect(poleX - bw / 2, poleY - poleH - bh, bw, bh)

  // White border
  ctx.strokeStyle = '#FFFFFF'
  ctx.lineWidth = 0.8
  ctx.strokeRect(poleX - bw / 2, poleY - poleH - bh, bw, bh)

  // Simulated ad content (2 white lines)
  ctx.fillStyle = 'rgba(255,255,255,0.35)'
  ctx.fillRect(poleX - bw / 2 + 2, poleY - poleH - bh + 2,  bw - 4, 3)
  ctx.fillRect(poleX - bw / 2 + 2, poleY - poleH - bh + 7,  bw - 8, 2)
}

// ── Boat ──────────────────────────────────────────────────────────────────────

export function drawBoat(ctx: CanvasRenderingContext2D, sx: number, sy: number) {
  const cx = sx, cy = sy + TILE_H / 2

  // Hull
  ctx.fillStyle = '#E8E0D0'
  ctx.beginPath()
  ctx.ellipse(cx, cy + 1, 9, 3.5, -0.15, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#A89070'
  ctx.lineWidth = 0.5
  ctx.stroke()

  // Mast
  ctx.strokeStyle = '#806040'
  ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(cx + 1, cy - 1); ctx.lineTo(cx + 1, cy - 15); ctx.stroke()

  // Sail
  ctx.fillStyle = 'rgba(248,248,240,0.88)'
  ctx.beginPath()
  ctx.moveTo(cx + 1, cy - 15)
  ctx.lineTo(cx + 12, cy - 5)
  ctx.lineTo(cx + 1, cy - 1)
  ctx.closePath()
  ctx.fill()
}
