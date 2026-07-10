// Layer 1 — Ground: LGA polygons from real GeoJSON projected into iso space.
// The 20 Lagos LGA polygons drawn as filled land shapes over a deep blue-black
// water background. Lagoon and Atlantic rendered with animated shimmer so the
// water splits the city recognizably into mainland + islands at a glance.

import { Container, Graphics, Sprite, Texture } from 'pixi.js'
import type { MapState } from '../../../state/mapSelectors'
import { getLGAGeometry, getProjectedBounds } from '../geoProjection'
import { isoToScreen, TILE_H, TILE_W } from '../projection'
import type { MapLayer } from '../types'

// ── Water palette (deep blue-black, reads unmistakably as night water) ────
// Land is warm dark-brown-grey; water is saturated cool blue-black. The
// contrast at the land-water edge is what makes the lagoon visible.
const WATER_BASE = 0x051825 // entire grid water fill
const ATLANTIC = 0x041220 // deep ocean
const LAGOON_FILL = 0x0a1e30 // shallower inland lagoon
const LAGOON_EDGE = 0x1a5880 // coastline / lagoon edge stroke

// ── Zone ground colors (warm dark brown-grey to contrast with cool blue water) ──
const ZONE_SHADES: Record<string, number> = {
  mainland: 0x1e1c1a,
  ikorodu: 0x201e1c,
  alimosho: 0x1c1a18,
  apapa: 0x22201e,
  lagosIsland: 0x1a1816,
  viIkoyi: 0x181614,
  lekki: 0x1c1a18,
  makoko: 0x161412,
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
  [47, 28],
  [50, 28],
  [54, 32],
  [56, 38],
  [58, 44],
  [56, 48],
  [52, 50],
  [48, 48],
  [44, 42],
  [44, 36],
  [45, 30],
]

// ── Atlantic Ocean polygon (everything south of the islands) ────────────────
function atlanticPolygon(isoBounds: {
  aMin: number
  aMax: number
  bMin: number
  bMax: number
}): [number, number][] {
  const aStart = Math.max(isoBounds.aMax - 8, 65)
  return [
    [aStart, isoBounds.bMin],
    [aStart, isoBounds.bMax + 5],
    [isoBounds.aMax + 5, isoBounds.bMax + 5],
    [isoBounds.aMax + 5, isoBounds.bMin],
  ]
}

// ── Ray-cast point-in-polygon for shimmer placement ────────────────────────
function pointInPolygon(a: number, b: number, polygon: [number, number][]): boolean {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [ai, bi] = polygon[i]
    const [aj, bj] = polygon[j]
    if (bi > b !== bj > b && a < ((aj - ai) * (b - bi)) / (bj - bi) + ai) inside = !inside
  }
  return inside
}

interface Shimmer {
  sprite: Sprite
  phase: number
  speed: number
}

interface GroundLayerState {
  width: number
  height: number
  ox: number
  oy: number
  t: number
}

interface GroundLayerRuntime {
  container: Container
  graphics: Graphics
  shimmerContainer: Container
  shimmers: Shimmer[]
}

function toScreenPath(polygon: [number, number][], ox: number, oy: number): number[] {
  return polygon.flatMap(([a, b]) => {
    const { x, y } = isoToScreen(a, b, ox, oy)
    return [x, y]
  })
}

function buildWaterBase(ctx: Graphics, ox: number, oy: number, w: number, h: number) {
  if (w === 0 || h === 0) return

  const isoBounds = getProjectedBounds()
  ctx.rect(0, 0, w, h).fill(0x07090f)

  const gridCorners = [
    isoToScreen(isoBounds.aMin, isoBounds.bMin, ox, oy),
    isoToScreen(isoBounds.aMin, isoBounds.bMax + 5, ox, oy),
    isoToScreen(isoBounds.aMax + 5, isoBounds.bMax + 5, ox, oy),
    isoToScreen(isoBounds.aMax + 5, isoBounds.bMin, ox, oy),
  ]
  ctx.poly(gridCorners.flatMap((p) => [p.x, p.y])).fill(WATER_BASE)

  const atlPts = toScreenPath(atlanticPolygon(isoBounds), ox, oy)
  ctx.poly(atlPts).fill(ATLANTIC)

  const lagPts = toScreenPath(LAGOON, ox, oy)
  ctx.poly(lagPts).fill(LAGOON_FILL)
}

function buildGroundTiles(
  ctx: Graphics,
  ox: number,
  oy: number,
  w: number,
  h: number,
  tileW: number,
  tileH: number,
) {
  if (w === 0 || h === 0) return

  void tileW
  void tileH

  for (const lga of getLGAGeometry()) {
    const pts = toScreenPath(lga.isoPolygon, ox, oy)
    ctx.poly(pts).fill(lgaFill(lga.key, lga.zoneId))
  }
}

function buildWaterEdge(ctx: Graphics, ox: number, oy: number, w: number, h: number) {
  if (w === 0 || h === 0) return
  ctx.poly(toScreenPath(LAGOON, ox, oy)).stroke({ color: LAGOON_EDGE, width: 1.5, alpha: 0.5 })
}

function buildGroundBoundaries(ctx: Graphics, ox: number, oy: number) {
  const lgas = getLGAGeometry()

  for (const lga of lgas) {
    const pts = toScreenPath(lga.isoPolygon, ox, oy)
    ctx.poly(pts).stroke({ color: 0x0e1828, width: 0.8, alpha: 0.35 })
  }

  for (const lga of lgas) {
    const pts = toScreenPath(lga.isoPolygon, ox, oy)
    ctx.poly(pts).stroke({ color: LAGOON_EDGE, width: 1.2, alpha: 0.5 })
  }
}

function buildGroundGrid(ctx: Graphics, ox: number, oy: number, w: number, h: number) {
  if (w === 0 || h === 0) return

  const isoBounds = getProjectedBounds()
  const STEP = 10
  for (let a = Math.floor(isoBounds.aMin / STEP) * STEP; a <= isoBounds.aMax; a += STEP) {
    const s = isoToScreen(a, isoBounds.bMin, ox, oy)
    const e = isoToScreen(a, isoBounds.bMax, ox, oy)
    ctx.moveTo(s.x, s.y).lineTo(e.x, e.y).stroke({ color: 0x26293a, width: 0.5, alpha: 0.1 })
  }

  for (let b = Math.floor(isoBounds.bMin / STEP) * STEP; b <= isoBounds.bMax; b += STEP) {
    const s = isoToScreen(isoBounds.aMin, b, ox, oy)
    const e = isoToScreen(isoBounds.aMax, b, ox, oy)
    ctx.moveTo(s.x, s.y).lineTo(e.x, e.y).stroke({ color: 0x26293a, width: 0.5, alpha: 0.1 })
  }
}

function polygonBounds(polygon: [number, number][]) {
  let aMin = Infinity
  let aMax = -Infinity
  let bMin = Infinity
  let bMax = -Infinity

  for (const [a, b] of polygon) {
    if (a < aMin) aMin = a
    if (a > aMax) aMax = a
    if (b < bMin) bMin = b
    if (b > bMax) bMax = b
  }

  return { aMin, aMax, bMin, bMax }
}

function createShimmer(x: number, y: number): Shimmer {
  const sprite = new Sprite(Texture.WHITE)
  sprite.width = 4
  sprite.height = 1
  sprite.anchor.set(0.5, 0.5)
  sprite.x = x
  sprite.y = y + TILE_H
  sprite.tint = 0x88bbee
  sprite.alpha = 0

  return {
    sprite,
    phase: Math.random() * Math.PI * 2,
    speed: 0.3 + Math.random() * 0.5,
  }
}

function addShimmerDots(
  shimmerC: Container,
  ox: number,
  oy: number,
  polygon: [number, number][],
  count: number,
  shimmers: Shimmer[],
) {
  const { aMin, aMax, bMin, bMax } = polygonBounds(polygon)
  let placed = 0

  for (let attempt = 0; attempt < count * 30 && placed < count; attempt++) {
    const a = aMin + Math.random() * (aMax - aMin)
    const b = bMin + Math.random() * (bMax - bMin)
    if (!pointInPolygon(a, b, polygon)) continue

    const { x, y } = isoToScreen(a, b, ox, oy)
    const shimmer = createShimmer(x, y)
    shimmerC.addChild(shimmer.sprite)
    shimmers.push(shimmer)
    placed++
  }
}

function buildShimmerSparkles(
  shimmerC: Container,
  ox: number,
  oy: number,
  w: number,
  h: number,
  layer: GroundLayerRuntime,
) {
  shimmerC.removeChildren()
  layer.shimmers.length = 0
  if (w === 0 || h === 0) return

  addShimmerDots(shimmerC, ox, oy, LAGOON, 80, layer.shimmers)
  addShimmerDots(shimmerC, ox, oy, atlanticPolygon(getProjectedBounds()), 40, layer.shimmers)
}

function renderGroundLayer(state: GroundLayerState, layer: GroundLayerRuntime) {
  const { graphics } = layer
  graphics.clear()
  if (state.width === 0 || state.height === 0) return

  buildWaterBase(graphics, state.ox, state.oy, state.width, state.height)
  buildWaterEdge(graphics, state.ox, state.oy, state.width, state.height)
  buildGroundTiles(graphics, state.ox, state.oy, state.width, state.height, TILE_W, TILE_H)
  buildGroundBoundaries(graphics, state.ox, state.oy)
  buildGroundGrid(graphics, state.ox, state.oy, state.width, state.height)
}

function configureGroundLayer(state: GroundLayerState, w: number, h: number) {
  state.width = w
  state.height = h
  state.ox = w / 2 - 10
  state.oy = (h - 324) / 2 + 4
  state.t = 0
}

function updateShimmerAlpha(shimmers: Shimmer[], t: number) {
  for (const sh of shimmers) {
    sh.sprite.alpha = 0.03 + 0.1 * (0.5 + 0.5 * Math.sin(t * sh.speed + sh.phase))
  }
}

function updateGroundLayer(state: GroundLayerState, layer: GroundLayerRuntime) {
  updateShimmerAlpha(layer.shimmers, state.t)
}

function createGroundLayerRuntime(): GroundLayerRuntime {
  const container = new Container()
  const graphics = new Graphics()
  const shimmerContainer = new Container()
  container.addChild(graphics)
  container.addChild(shimmerContainer)

  return {
    container,
    graphics,
    shimmerContainer,
    shimmers: [],
  }
}

export function createGroundLayer(): MapLayer {
  const state: GroundLayerState = { width: 0, height: 0, ox: 0, oy: 0, t: 0 }
  const layer = createGroundLayerRuntime()

  return {
    container: layer.container,
    init(_state: MapState, w: number, h: number) {
      configureGroundLayer(state, w, h)
      renderGroundLayer(state, layer)
      buildShimmerSparkles(
        layer.shimmerContainer,
        state.ox,
        state.oy,
        state.width,
        state.height,
        layer,
      )
    },
    update(_state: MapState, dt: number) {
      state.t += dt / 1000
      updateGroundLayer(state, layer)
    },
    destroy() {
      layer.container.destroy({ children: true })
      layer.shimmers.length = 0
    },
  }
}
