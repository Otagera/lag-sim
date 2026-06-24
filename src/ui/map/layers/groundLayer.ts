// Layer 1 — Ground: LGA polygons from real GeoJSON projected into iso space.
// The 20 Lagos LGA polygons drawn as filled land shapes over a water background.
// LGA boundaries are faintly visible via subtle per-LGA shade variation.
// Lagoon and Atlantic are rendered as water between/around the LGA shapes.

import { Container, Graphics } from 'pixi.js'
import type { MapLayer } from '../types'
import type { MapState } from '../../../state/mapSelectors'
import { isoToScreen } from '../projection'
import { getLGAGeometry, getProjectedBounds } from '../geoProjection'

// ── Zone ground colors (dark night palette, slightly varied so boundaries read) ──
// Each zone gets a base shade; individual LGA polygons within it shift ±1–2.
const ZONE_SHADES: Record<string, number> = {
  mainland:   0x1a1d24,
  ikorodu:    0x1c1f26,
  alimosho:   0x181b22,
  apapa:      0x1e2128,
  lagosIsland:0x161922,
  viIkoyi:    0x14171e,
  lekki:      0x191c23,
  makoko:     0x13161c,
}

function lgaFill(key: string, zoneId: string): number {
  const base = ZONE_SHADES[zoneId] ?? 0x1a1d24
  const hash = key.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const dr = ((hash & 3) - 1) * 2
  const dg = (((hash >> 2) & 3) - 1) * 2
  const db = (((hash >> 4) & 3) - 1) * 2
  const r = Math.max(0, Math.min(255, ((base >> 16) & 0xff) + dr))
  const g = Math.max(0, Math.min(255, ((base >> 8) & 0xff) + dg))
  const b = Math.max(0, Math.min(255, (base & 0xff) + db))
  return (r << 16) | (g << 8) | b
}

// ── Approximate lagoon polygon in iso space ──────────────────────────────────
// The channel between mainland (NW) and island (SE) LGAs.
const LAGOON: [number, number][] = [
  [47, 28], [50, 28], [54, 32], [56, 38], [58, 44],
  [56, 48], [52, 50], [48, 48], [44, 42], [44, 36], [45, 30],
]

// ── Atlantic Ocean polygon (everything south of the islands) ────────────────
function atlanticPolygon(isoBounds: { aMin: number; aMax: number; bMin: number; bMax: number }): [number, number][] {
  const aStart = Math.max(isoBounds.aMax - 8, 65)
  return [
    [aStart, isoBounds.bMin], [aStart, isoBounds.bMax + 5],
    [isoBounds.aMax + 5, isoBounds.bMax + 5], [isoBounds.aMax + 5, isoBounds.bMin],
  ]
}

export function createGroundLayer(): MapLayer {
  const container = new Container()
  const g = new Graphics()
  container.addChild(g)

  let _w = 0, _h = 0
  let _ox = 0, _oy = 0

  function draw() {
    g.clear()
    if (_w === 0 || _h === 0) return

    const lgas = getLGAGeometry()
    const isoBounds = getProjectedBounds()

    // ── Sky ───────────────────────────────────────────────────────────────
    g.rect(0, 0, _w, _h).fill(0x07090f)

    // ── Water base (entire iso grid area) ─────────────────────────────────
    const gridCorners = [
      isoToScreen(isoBounds.aMin, isoBounds.bMin, _ox, _oy),
      isoToScreen(isoBounds.aMin, isoBounds.bMax + 5, _ox, _oy),
      isoToScreen(isoBounds.aMax + 5, isoBounds.bMax + 5, _ox, _oy),
      isoToScreen(isoBounds.aMax + 5, isoBounds.bMin, _ox, _oy),
    ]
    g.poly(gridCorners.flatMap(p => [p.x, p.y])).fill(0x0c1a2c)

    // ── Atlantic Ocean (darker deep water) ────────────────────────────────
    const atlPts = atlanticPolygon(isoBounds).map(([a, b]) => isoToScreen(a, b, _ox, _oy))
    g.poly(atlPts.flatMap(p => [p.x, p.y])).fill(0x081220)

    // ── Lagoon (shallower, slightly lighter) ──────────────────────────────
    const lagPts = LAGOON.map(([a, b]) => isoToScreen(a, b, _ox, _oy))
    g.poly(lagPts.flatMap(p => [p.x, p.y])).fill(0x0f1f2e)
    g.poly(lagPts.flatMap(p => [p.x, p.y])).stroke({ color: 0x1a4870, width: 1, alpha: 0.4 })

    // ── LGA land polygons ─────────────────────────────────────────────────
    for (const lga of lgas) {
      const pts = lga.isoPolygon.map(([a, b]) => isoToScreen(a, b, _ox, _oy))
      const fill = lgaFill(lga.key, lga.zoneId)
      g.poly(pts.flatMap(p => [p.x, p.y])).fill(fill)
    }

    // ── LGA boundary strokes (subtle LGA-to-LGA borders) ─────────────────
    for (const lga of lgas) {
      const pts = lga.isoPolygon.map(([a, b]) => isoToScreen(a, b, _ox, _oy))
      g.poly(pts.flatMap(p => [p.x, p.y]))
        .stroke({ color: 0x0e1828, width: 0.8, alpha: 0.35 })
    }

    // ── Coastline (land-water edge, brighter) ─────────────────────────────
    for (const lga of lgas) {
      const pts = lga.isoPolygon.map(([a, b]) => isoToScreen(a, b, _ox, _oy))
      g.poly(pts.flatMap(p => [p.x, p.y]))
        .stroke({ color: 0x1a4870, width: 1, alpha: 0.45 })
    }

    // ── Faint iso grid lines ──────────────────────────────────────────────
    const STEP = 10
    for (let a = Math.floor(isoBounds.aMin / STEP) * STEP; a <= isoBounds.aMax; a += STEP) {
      const s = isoToScreen(a, isoBounds.bMin, _ox, _oy)
      const e = isoToScreen(a, isoBounds.bMax, _ox, _oy)
      g.moveTo(s.x, s.y).lineTo(e.x, e.y)
        .stroke({ color: 0x26293a, width: 0.5, alpha: 0.10 })
    }
    for (let b = Math.floor(isoBounds.bMin / STEP) * STEP; b <= isoBounds.bMax; b += STEP) {
      const s = isoToScreen(isoBounds.aMin, b, _ox, _oy)
      const e = isoToScreen(isoBounds.aMax, b, _ox, _oy)
      g.moveTo(s.x, s.y).lineTo(e.x, e.y)
        .stroke({ color: 0x26293a, width: 0.5, alpha: 0.10 })
    }
  }

  return {
    container,
    init(_state: MapState, w: number, h: number) {
      _w = w; _h = h
      _ox = w / 2 - 10
      _oy = (h - 324) / 2 + 4
      draw()
    },
    update() {},
    destroy() { container.destroy({ children: true }) },
  }
}
