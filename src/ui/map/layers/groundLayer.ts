// Layer 1 — Ground: LGA polygons from real GeoJSON projected into iso space.
// The 20 Lagos LGA polygons drawn as filled land shapes over a deep blue-black
// water background. Lagoon and Atlantic rendered with animated shimmer so the
// water splits the city recognizably into mainland + islands at a glance.

import { Container, Graphics, Sprite, Texture } from 'pixi.js'
import type { MapLayer } from '../types'
import type { MapState } from '../../../state/mapSelectors'
import { isoToScreen, TILE_H } from '../projection'
import { getLGAGeometry, getProjectedBounds } from '../geoProjection'

// ── Water palette (deep blue-black, reads unmistakably as night water) ────
// Land is warm dark-brown-grey; water is saturated cool blue-black. The
// contrast at the land-water edge is what makes the lagoon visible.
const WATER_BASE  = 0x051825   // entire grid water fill
const ATLANTIC    = 0x041220   // deep ocean
const LAGOON_FILL = 0x0a1e30   // shallower inland lagoon
const LAGOON_EDGE = 0x1a5880   // coastline / lagoon edge stroke

// ── Zone ground colors (warm dark brown-grey to contrast with cool blue water) ──
const ZONE_SHADES: Record<string, number> = {
  mainland:   0x1e1c1a,
  ikorodu:    0x201e1c,
  alimosho:   0x1c1a18,
  apapa:      0x22201e,
  lagosIsland:0x1a1816,
  viIkoyi:    0x181614,
  lekki:      0x1c1a18,
  makoko:     0x161412,
}

function lgaFill(key: string, zoneId: string): number {
  const base = ZONE_SHADES[zoneId] ?? 0x1e1c1a
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

// ── Ray-cast point-in-polygon for shimmer placement ────────────────────────
function pointInPolygon(a: number, b: number, polygon: [number, number][]): boolean {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [ai, bi] = polygon[i]; const [aj, bj] = polygon[j]
    if ((bi > b) !== (bj > b) && a < (aj - ai) * (b - bi) / (bj - bi) + ai) inside = !inside
  }
  return inside
}

export function createGroundLayer(): MapLayer {
  const container    = new Container()
  const g            = new Graphics()
  const shimmerC     = new Container()
  container.addChild(g)
  container.addChild(shimmerC)

  let _w = 0, _h = 0
  let _ox = 0, _oy = 0
  let _t = 0
  interface Shimmer { sprite: Sprite; phase: number; speed: number }
  const _shimmers: Shimmer[] = []

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
    g.poly(gridCorners.flatMap(p => [p.x, p.y])).fill(WATER_BASE)

    // ── Atlantic Ocean (deeper, darker) ──────────────────────────────────
    const atlPts = atlanticPolygon(isoBounds).map(([a, b]) => isoToScreen(a, b, _ox, _oy))
    g.poly(atlPts.flatMap(p => [p.x, p.y])).fill(ATLANTIC)

    // ── Lagoon (shallower, slightly lighter — the key geographic feature) ─
    const lagPts = LAGOON.map(([a, b]) => isoToScreen(a, b, _ox, _oy))
    g.poly(lagPts.flatMap(p => [p.x, p.y])).fill(LAGOON_FILL)
    g.poly(lagPts.flatMap(p => [p.x, p.y])).stroke({ color: LAGOON_EDGE, width: 1.5, alpha: 0.50 })

    // ── LGA land polygons (warm dark brown-grey — contrast with cool water) ─
    for (const lga of lgas) {
      const pts = lga.isoPolygon.map(([a, b]) => isoToScreen(a, b, _ox, _oy))
      const fill = lgaFill(lga.key, lga.zoneId)
      g.poly(pts.flatMap(p => [p.x, p.y])).fill(fill)
    }

    // ── LGA boundary strokes ──────────────────────────────────────────────
    for (const lga of lgas) {
      const pts = lga.isoPolygon.map(([a, b]) => isoToScreen(a, b, _ox, _oy))
      g.poly(pts.flatMap(p => [p.x, p.y]))
        .stroke({ color: 0x0e1828, width: 0.8, alpha: 0.35 })
    }

    // ── Coastline (land-water edge — brighter to separate land from water) ─
    for (const lga of lgas) {
      const pts = lga.isoPolygon.map(([a, b]) => isoToScreen(a, b, _ox, _oy))
      g.poly(pts.flatMap(p => [p.x, p.y]))
        .stroke({ color: LAGOON_EDGE, width: 1.2, alpha: 0.50 })
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

  function buildShimmer() {
    shimmerC.removeChildren()
    _shimmers.length = 0
    const isoBounds = getProjectedBounds()
    const atl = atlanticPolygon(isoBounds)

    // Inject 80 shimmer points into lagoon and 40 into Atlantic
    const allWater = [LAGOON, atl]
    const counts = [80, 40]
    for (let wi = 0; wi < allWater.length; wi++) {
      const poly = allWater[wi]
      let aMin = Infinity, aMax = -Infinity, bMin = Infinity, bMax = -Infinity
      for (const [a, b] of poly) {
        if (a < aMin) aMin = a; if (a > aMax) aMax = a
        if (b < bMin) bMin = b; if (b > bMax) bMax = b
      }
      const N = counts[wi]
      let placed = 0
      for (let attempt = 0; attempt < N * 30 && placed < N; attempt++) {
        const a = aMin + Math.random() * (aMax - aMin)
        const b = bMin + Math.random() * (bMax - bMin)
        if (!pointInPolygon(a, b, poly)) continue
        const { x, y } = isoToScreen(a, b, _ox, _oy)
        const sp = new Sprite(Texture.WHITE)
        sp.width = 4
        sp.height = 1
        sp.anchor.set(0.5, 0.5)
        sp.x = x
        sp.y = y + TILE_H
        sp.tint = 0x88bbee
        sp.alpha = 0
        shimmerC.addChild(sp)
        _shimmers.push({ sprite: sp, phase: Math.random() * Math.PI * 2, speed: 0.3 + Math.random() * 0.5 })
        placed++
      }
    }
  }

  return {
    container,
    init(_state: MapState, w: number, h: number) {
      _w = w; _h = h
      _ox = w / 2 - 10
      _oy = (h - 324) / 2 + 4
      _t = 0
      draw()
      buildShimmer()
    },
    update(_state: MapState, dt: number) {
      _t += dt / 1000
      for (const sh of _shimmers) {
        const a = 0.03 + 0.10 * (0.5 + 0.5 * Math.sin(_t * sh.speed + sh.phase))
        sh.sprite.alpha = a
      }
    },
    destroy() {
      container.destroy({ children: true })
      _shimmers.length = 0
    },
  }
}
