import { Container, Graphics } from 'pixi.js'
import type { ZoneType } from '../../../data/lagosLayout'
import type { MapState } from '../../../state/mapSelectors'
import { type Building, generateBuildings, mulberry32 } from '../buildings'
import { FLOOR_H, isoToScreen, TILE_H, TILE_W } from '../projection'
import type { MapLayer } from '../types'

// ── Types ─────────────────────────────────────────────────────────────────────
interface FaceColors {
  top: number
  left: number
  right: number
}

// ── Color palettes — 4 variants per zone type ────────────────────────────────
// All deliberately dark (night silhouettes). Windows from lightsLayer sit on top.
const PALETTES: Record<ZoneType, FaceColors[]> = {
  'dense-low': [
    { top: 0x2a3a50, left: 0x18253a, right: 0x22304a },
    { top: 0x2d3d4e, left: 0x1b2838, right: 0x243248 },
    { top: 0x263248, left: 0x162234, right: 0x1f2c40 },
    { top: 0x2f3e52, left: 0x1d293c, right: 0x27334c },
  ],
  'sprawl-low': [
    { top: 0x253345, left: 0x162030, right: 0x1e2b3c },
    { top: 0x283544, left: 0x182535, right: 0x222e40 },
    { top: 0x222e40, left: 0x141e2e, right: 0x1c2838 },
    { top: 0x2b3648, left: 0x1a2434, right: 0x233040 },
  ],
  'mid-rise': [
    { top: 0x304258, left: 0x1c2d44, right: 0x27384e },
    { top: 0x344a60, left: 0x20324a, right: 0x2b3d54 },
    { top: 0x2d3e55, left: 0x1a2a40, right: 0x25354c },
    { top: 0x384c62, left: 0x22364c, right: 0x2e4058 },
  ],
  towers: [
    { top: 0x48607e, left: 0x2c4060, right: 0x3c5270 }, // steel blue
    { top: 0x4a6588, left: 0x2d426c, right: 0x3d5578 }, // deeper glass
    { top: 0x506878, left: 0x30485a, right: 0x40586a }, // concrete grey
    { top: 0x3e5870, left: 0x264052, right: 0x324862 }, // dark prestige
  ],
  stilt: [
    { top: 0x283848, left: 0x182838, right: 0x22323e },
    { top: 0x25343e, left: 0x162630, right: 0x1e2e38 },
    { top: 0x2a3a48, left: 0x1a2a38, right: 0x223242 },
    { top: 0x263040, left: 0x162030, right: 0x1e2a38 },
  ],
  port: [
    { top: 0x2a3848, left: 0x182535, right: 0x222e40 },
    { top: 0x2c3e50, left: 0x1a2c3e, right: 0x243648 },
    { top: 0x284050, left: 0x183042, right: 0x203848 },
    { top: 0x2e3a4a, left: 0x1c2a3a, right: 0x253242 },
  ],
  lagoon: [{ top: 0x0b1a2d, left: 0x0b1a2d, right: 0x0b1a2d }],
  atlantic: [{ top: 0x06101e, left: 0x06101e, right: 0x06101e }],
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function lighten(hex: number, f: number): number {
  const d = Math.round(f * 255)
  const r = Math.min(255, ((hex >> 16) & 0xff) + d)
  const g = Math.min(255, ((hex >> 8) & 0xff) + d)
  const b = Math.min(255, (hex & 0xff) + d)
  return (r << 16) | (g << 8) | b
}

// Core iso-box: top face + left face + right face
function drawIsoBox(
  g: Graphics,
  sx: number,
  sy: number,
  hw: number,
  hh: number,
  totalH: number,
  col: FaceColors,
) {
  const th = hh * 2
  // top (roof rhombus)
  g.poly([
    sx,
    sy - totalH,
    sx + hw,
    sy - totalH + hh,
    sx,
    sy - totalH + th,
    sx - hw,
    sy - totalH + hh,
  ]).fill(col.top)
  // left face (b-side parallelogram)
  g.poly([sx - hw, sy - totalH + hh, sx, sy - totalH + th, sx, sy + th, sx - hw, sy + hh]).fill(
    col.left,
  )
  // right face (a-side parallelogram)
  g.poly([sx + hw, sy - totalH + hh, sx, sy - totalH + th, sx, sy + th, sx + hw, sy + hh]).fill(
    col.right,
  )
}

// ── Residential (dense-low / sprawl-low) ─────────────────────────────────────
// v0: plain box  v1/v3: peaked roof  v2: flat parapet
function drawLowrise(
  g: Graphics,
  sx: number,
  sy: number,
  hw: number,
  hh: number,
  totalH: number,
  col: FaceColors,
  v: number,
) {
  drawIsoBox(g, sx, sy, hw, hh, totalH, col)

  if (v === 1 || v === 3) {
    // Peaked roof: small triangle above the roof diamond
    const peakH = Math.max(2, Math.round(hw * 0.55))
    g.poly([
      sx,
      sy - totalH - peakH,
      sx + hw * 0.72,
      sy - totalH + hh * 0.42,
      sx - hw * 0.72,
      sy - totalH + hh * 0.42,
    ]).fill(0x141c26)
  } else if (v === 2) {
    // Flat parapet: thin darker strip capping both faces
    const ph = 2
    g.poly([
      sx - hw,
      sy - totalH + hh,
      sx,
      sy - totalH + hh * 2,
      sx,
      sy - totalH + hh * 2 + ph,
      sx - hw,
      sy - totalH + hh + ph,
    ]).fill(0x101820)
    g.poly([
      sx + hw,
      sy - totalH + hh,
      sx,
      sy - totalH + hh * 2,
      sx,
      sy - totalH + hh * 2 + ph,
      sx + hw,
      sy - totalH + hh + ph,
    ]).fill(0x121c24)
  }
}

// ── Mid-rise commercial / residential block ───────────────────────────────────
// All variants get a concrete parapet. v2/v3 add a rooftop unit (water tank).
function drawMidrise(
  g: Graphics,
  sx: number,
  sy: number,
  hw: number,
  hh: number,
  totalH: number,
  col: FaceColors,
  v: number,
) {
  drawIsoBox(g, sx, sy, hw, hh, totalH, col)

  // Concrete parapet (1px cap on both faces — defines the skyline edge)
  const ph = 1
  g.poly([
    sx - hw,
    sy - totalH + hh,
    sx,
    sy - totalH + hh * 2,
    sx,
    sy - totalH + hh * 2 + ph,
    sx - hw,
    sy - totalH + hh + ph,
  ]).fill(0x0d1520)
  g.poly([
    sx + hw,
    sy - totalH + hh,
    sx,
    sy - totalH + hh * 2,
    sx,
    sy - totalH + hh * 2 + ph,
    sx + hw,
    sy - totalH + hh + ph,
  ]).fill(0x0f1822)

  if ((v === 2 || v === 3) && hw >= 3) {
    // Rooftop unit: tiny iso box sitting on the roof center
    const tw = Math.max(1.5, hw * 0.35)
    const th = Math.max(1, hh * 0.35)
    const rh = 3
    g.poly([
      sx,
      sy - totalH - rh,
      sx + tw,
      sy - totalH - rh + th,
      sx,
      sy - totalH - rh + th * 2,
      sx - tw,
      sy - totalH - rh + th,
    ]).fill(0x1a2535)
    g.poly([
      sx - tw,
      sy - totalH - rh + th,
      sx,
      sy - totalH - rh + th * 2,
      sx,
      sy - totalH + th * 2,
      sx - tw,
      sy - totalH + th,
    ]).fill(0x121c2a)
    g.poly([
      sx + tw,
      sy - totalH - rh + th,
      sx,
      sy - totalH - rh + th * 2,
      sx,
      sy - totalH + th * 2,
      sx + tw,
      sy - totalH + th,
    ]).fill(0x151f2e)
  }
}

// ── Tower (VI / Lekki high-rise) ──────────────────────────────────────────────
// v0: plain  v1: antenna  v2: antenna + dish dot  v3: glass bands + antenna
function drawTower(
  g: Graphics,
  sx: number,
  sy: number,
  hw: number,
  hh: number,
  totalH: number,
  col: FaceColors,
  v: number,
) {
  drawIsoBox(g, sx, sy, hw, hh, totalH, col)

  if (v === 3) {
    // Glass curtain wall: horizontal highlight bands every 2 floors on right face
    const floors = Math.round(totalH / FLOOR_H)
    for (let f = 1; f < floors; f += 2) {
      const y = sy - f * FLOOR_H
      g.poly([sx + hw, y - hh, sx, y, sx, y + 1, sx + hw, y - hh + 1]).fill({
        color: lighten(col.right, 0.1),
        alpha: 0.65,
      })
    }
  }

  if (v >= 1) {
    // Communication antenna above apex
    const aH = Math.max(4, Math.round(totalH * 0.13))
    g.moveTo(sx, sy - totalH)
      .lineTo(sx, sy - totalH - aH)
      .stroke({ color: 0x5a6878, width: 1 })
    if (v === 2) {
      // Dish / beacon dot at antenna tip
      g.circle(sx, sy - totalH - aH, 1).fill(0x6a7888)
    }
  }
}

// ── Stilt huts (Makoko) ───────────────────────────────────────────────────────
// All stilt buildings: box + peaked roof + visible stilt posts below
function drawStilt(
  g: Graphics,
  sx: number,
  sy: number,
  hw: number,
  hh: number,
  totalH: number,
  col: FaceColors,
) {
  // Stilt posts visible below the ground level of the hut
  const stiltH = 3
  for (const dx of [-hw * 0.5, 0, hw * 0.5]) {
    g.moveTo(sx + dx, sy + hh * 0.55)
      .lineTo(sx + dx, sy + hh * 0.55 + stiltH)
      .stroke({ color: 0x141e26, width: 1 })
  }

  drawIsoBox(g, sx, sy, hw, hh, totalH, col)

  // Peaked roof on all stilt huts — most recognisable silhouette
  const peakH = Math.max(2, Math.round(hw * 0.6))
  g.poly([
    sx,
    sy - totalH - peakH,
    sx + hw * 0.78,
    sy - totalH + hh * 0.38,
    sx - hw * 0.78,
    sy - totalH + hh * 0.38,
  ]).fill(0x0e1520)
}

// ── Port / industrial (Apapa) ─────────────────────────────────────────────────
// v0/2: warehouse box  v1/3: container stacks  v2: crane protrusion
function drawPort(
  g: Graphics,
  sx: number,
  sy: number,
  hw: number,
  hh: number,
  totalH: number,
  col: FaceColors,
  v: number,
) {
  drawIsoBox(g, sx, sy, hw, hh, totalH, col)

  if (v === 1 || v === 3) {
    // Container stacks: alternating coloured bands on right face
    const nBands = Math.min(Math.round(totalH / FLOOR_H), 3)
    for (let f = 0; f < nBands; f++) {
      const y1 = sy - (f + 1) * FLOOR_H
      const y2 = y1 + FLOOR_H - 1
      const bc = f % 2 === 0 ? 0x1e3040 : 0x283848
      g.poly([
        sx + hw * 0.25,
        y1 + hh * 0.4,
        sx + hw * 0.85,
        y1 + hh * 0.85,
        sx + hw * 0.85,
        y2 + hh * 0.85,
        sx + hw * 0.25,
        y2 + hh * 0.4,
      ]).fill(bc)
    }
  }

  if (v === 2) {
    // Simple jib crane: vertical post + horizontal arm
    const postH = 5
    const armW = hw * 0.7
    g.moveTo(sx + hw * 0.45, sy - totalH)
      .lineTo(sx + hw * 0.45, sy - totalH - postH)
      .stroke({ color: 0x3a4c5c, width: 1 })
    g.moveTo(sx + hw * 0.45, sy - totalH - postH)
      .lineTo(sx + hw * 0.45 + armW, sy - totalH - postH)
      .stroke({ color: 0x3a4c5c, width: 1 })
  }
}

// ── Dispatch ──────────────────────────────────────────────────────────────────
function drawBuilding(g: Graphics, bld: Building, ox: number, oy: number) {
  const tw = TILE_W * bld.fp
  const th = TILE_H * bld.fp
  const hw = tw / 2
  const hh = th / 2
  const totalH = bld.floors * FLOOR_H

  const { x: sx, y: sy } = isoToScreen(bld.a, bld.b, ox, oy)

  // Stable per-building variant: seed is distinct from buildings.ts / lightsLayer seeds
  const rng = mulberry32(bld.a * 100003 + bld.b * 9973 + bld.zoneIdx * 317 + 42)
  const palette = PALETTES[bld.type]
  const v = palette.length > 1 ? Math.floor(rng() * palette.length) : 0
  const col = palette[v]

  switch (bld.type) {
    case 'towers':
      drawTower(g, sx, sy, hw, hh, totalH, col, v)
      break
    case 'mid-rise':
      drawMidrise(g, sx, sy, hw, hh, totalH, col, v)
      break
    case 'stilt':
      drawStilt(g, sx, sy, hw, hh, totalH, col)
      break
    case 'port':
      drawPort(g, sx, sy, hw, hh, totalH, col, v)
      break
    default:
      drawLowrise(g, sx, sy, hw, hh, totalH, col, v)
      break
  }
}

// ── Layer factory ─────────────────────────────────────────────────────────────
export function createBuildingsLayer(): MapLayer {
  const container = new Container()

  function render(w: number, h: number) {
    const ox = w / 2 - 10
    const oy = (h - 324) / 2 + 4
    container.removeChildren()
    const g = new Graphics()
    container.addChild(g)
    for (const bld of generateBuildings()) {
      drawBuilding(g, bld, ox, oy)
    }
    void TILE_W
    void TILE_H
  }

  return {
    container,
    init(_state: MapState, w: number, h: number) {
      render(w, h)
    },
    update() {
      /* static — lightsLayer handles all dynamic content */
    },
    destroy() {
      container.destroy({ children: true })
    },
  }
}
