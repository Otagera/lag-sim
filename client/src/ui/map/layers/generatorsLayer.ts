// D1 — Generator glows
// Where the grid fails, generators run. This is the most Lagos-specific visual detail:
// poor zones have dark windows BUT scattered warm-orange generator dots at street level.
// VI has almost none (grid power); Makoko has a full scatter of them.
// Driven live by zone.powerDeficit = max(0, 60 - infrastructure).

import { Container, Graphics, Sprite, Texture } from 'pixi.js'
import type { MapState } from '../../../state/mapSelectors'
import { mulberry32 } from '../buildings'
import { getLGAGeometry, pointInPolygon } from '../geoProjection'
import { isoToScreen, TILE_H } from '../projection'
import type { MapLayer } from '../types'

const GEN_COLOR = 0xe88a30 // muted diesel-orange (was 0xff9a46 — too hot)
const MAX_GEN = 250 // was 600 — generators should be a spare sprinkle, not a mass
const MAX_DEFICIT = 60

// Diesel generator chug — low pulse, never too bright
function genAlpha(t: number, phase: number): number {
  const main = Math.sin(t * 0.85 + phase)
  const spur = Math.sin(t * 3.1 + phase * 1.4) * 0.28
  return Math.max(0.1, Math.min(0.35, 0.22 + main * 0.08 + spur * 0.04))
}

interface GenDot {
  sprite: Sprite
  screenX: number
  screenY: number
  phase: number
  zoneIdx: number
  deficitThreshold: number // lights when zone.powerDeficit >= this
}

interface GeneratorPlacement {
  a: number
  b: number
  phase: number
  zoneIdx: number
  deficitThreshold: number
}

interface GeneratorPoolSpec {
  poly: [number, number][]
  rng: () => number
  maxForZone: number
}

interface PolygonBounds {
  aMin: number
  aMax: number
  bMin: number
  bMax: number
}

interface GeneratorRuntime {
  glowG: Graphics
  dotContainer: Container
  gens: GenDot[]
  prevDeficits: number[]
  t: number
}

function createPoolSeed(key: string): number {
  return key.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) * 17 + 7
}

function getPolygonBounds(poly: [number, number][]): PolygonBounds {
  let aMin = Infinity
  let aMax = -Infinity
  let bMin = Infinity
  let bMax = -Infinity

  for (const [a, b] of poly) {
    if (a < aMin) aMin = a
    if (a > aMax) aMax = a
    if (b < bMin) bMin = b
    if (b > bMax) bMax = b
  }

  return { aMin, aMax, bMin, bMax }
}

function getBoundsArea(bounds: PolygonBounds): number {
  return (bounds.aMax - bounds.aMin) * (bounds.bMax - bounds.bMin)
}

function groupGeneratorPoolsByZone(): Map<number, GeneratorPoolSpec[]> {
  const zonePools = new Map<number, GeneratorPoolSpec[]>()

  for (const lga of getLGAGeometry()) {
    const pools = zonePools.get(lga.zoneIdx) ?? []
    pools.push({
      poly: lga.isoPolygon,
      rng: mulberry32(createPoolSeed(lga.key)),
      maxForZone: 0,
    })
    zonePools.set(lga.zoneIdx, pools)
  }

  return zonePools
}

function assignPoolCaps(zonePools: Map<number, GeneratorPoolSpec[]>) {
  for (const pools of zonePools.values()) {
    const areas = pools.map((pool) => getBoundsArea(getPolygonBounds(pool.poly)))
    const totalArea = areas.reduce((sum, area) => sum + area, 0)

    for (let i = 0; i < pools.length; i++) {
      pools[i].maxForZone = Math.max(
        1,
        Math.floor(((areas[i] / totalArea) * MAX_GEN) / pools.length),
      )
    }
  }
}

function samplePoolGenerators(
  pool: GeneratorPoolSpec,
  zoneIdx: number,
  ox: number,
  oy: number,
  remaining: number,
  addGeneratorPair: (gen: GeneratorPlacement, ox: number, oy: number) => void,
): number {
  const limit = Math.min(pool.maxForZone, remaining)
  if (limit <= 0) return 0

  const bounds = getPolygonBounds(pool.poly)
  let placed = 0

  for (let attempt = 0; attempt < pool.maxForZone * 20 && placed < limit; attempt++) {
    const a = bounds.aMin + pool.rng() * (bounds.aMax - bounds.aMin)
    const b = bounds.bMin + pool.rng() * (bounds.bMax - bounds.bMin)
    if (!pointInPolygon(a, b, pool.poly)) continue

    addGeneratorPair(
      {
        a,
        b,
        phase: pool.rng() * Math.PI * 2,
        zoneIdx,
        deficitThreshold: (placed / pool.maxForZone) * (MAX_DEFICIT - 2) + 2,
      },
      ox,
      oy,
    )
    placed++
  }

  return placed
}

function populateGeneratorPools(
  zonePools: Map<number, GeneratorPoolSpec[]>,
  ox: number,
  oy: number,
  addGeneratorPair: (gen: GeneratorPlacement, ox: number, oy: number) => void,
) {
  let total = 0

  for (const [zoneIdx, pools] of zonePools) {
    for (const pool of pools) {
      total += samplePoolGenerators(pool, zoneIdx, ox, oy, MAX_GEN - total, addGeneratorPair)
      if (total >= MAX_GEN) return
    }
  }
}

function syncPrevDeficits(state: MapState, prevDeficits: number[]) {
  for (let i = 0; i < state.zones.length; i++) {
    prevDeficits[i] = state.zones[i]?.powerDeficit ?? 0
  }
}

function detectGlowChange(state: MapState, prevDeficits: number[]): boolean {
  let glowDirty = false

  for (let i = 0; i < state.zones.length; i++) {
    const deficit = state.zones[i]?.powerDeficit ?? 0
    if (Math.abs(deficit - prevDeficits[i]) <= 2) continue

    prevDeficits[i] = deficit
    glowDirty = true
  }

  return glowDirty
}

function animateGeneratorDots(state: MapState, gens: GenDot[], t: number) {
  for (const gen of gens) {
    const zone = state.zones[gen.zoneIdx]
    const active = zone != null && zone.powerDeficit >= gen.deficitThreshold
    if (!active) {
      if (gen.sprite.visible) gen.sprite.visible = false
      continue
    }

    if (!gen.sprite.visible) gen.sprite.visible = true
    gen.sprite.alpha = genAlpha(t, gen.phase)
  }
}

function createGeneratorRuntime(glowG: Graphics, dotContainer: Container): GeneratorRuntime {
  return {
    glowG,
    dotContainer,
    gens: [],
    prevDeficits: new Array(8).fill(0),
    t: 0,
  }
}

function clearPool(runtime: GeneratorRuntime) {
  runtime.dotContainer.removeChildren()
  runtime.gens.length = 0
}

function resetPool(runtime: GeneratorRuntime) {
  clearPool(runtime)
}

function buildGeneratorSprite(dot: { x: number; y: number }, color: number): Sprite {
  const sprite = new Sprite(Texture.WHITE)
  sprite.width = 2
  sprite.height = 2
  sprite.anchor.set(0.5, 0.5)
  sprite.x = dot.x
  sprite.y = dot.y
  sprite.tint = color
  sprite.visible = false
  return sprite
}

function addGeneratorPair(
  runtime: GeneratorRuntime,
  gen: GeneratorPlacement,
  ox: number,
  oy: number,
) {
  const { x, y } = isoToScreen(gen.a, gen.b, ox, oy)
  const sprite = buildGeneratorSprite({ x, y: y + TILE_H }, GEN_COLOR)

  runtime.dotContainer.addChild(sprite)
  runtime.gens.push({
    sprite,
    screenX: x,
    screenY: y + TILE_H,
    phase: gen.phase,
    zoneIdx: gen.zoneIdx,
    deficitThreshold: gen.deficitThreshold,
  })
}

function buildGeneratorPool(runtime: GeneratorRuntime, ox: number, oy: number, state: MapState) {
  void state
  resetPool(runtime)
  const zonePools = groupGeneratorPoolsByZone()
  assignPoolCaps(zonePools)
  populateGeneratorPools(zonePools, ox, oy, (gen, screenOx, screenOy) => {
    addGeneratorPair(runtime, gen, screenOx, screenOy)
  })
}

function rebuildGlow(runtime: GeneratorRuntime, state: MapState) {
  runtime.glowG.clear()
  for (const gen of runtime.gens) {
    const zone = state.zones[gen.zoneIdx]
    if (!zone || zone.powerDeficit < gen.deficitThreshold) continue
    runtime.glowG.circle(gen.screenX, gen.screenY, 4).fill({ color: GEN_COLOR, alpha: 0.1 })
  }
}

function updateGenerators(runtime: GeneratorRuntime, state: MapState, dt: number) {
  runtime.t += dt / 1000
  if (detectGlowChange(state, runtime.prevDeficits)) rebuildGlow(runtime, state)
  animateGeneratorDots(state, runtime.gens, runtime.t)
}

function destroyRuntime(runtime: GeneratorRuntime) {
  runtime.gens.length = 0
}

export function createGeneratorsLayer(): MapLayer {
  const container = new Container()
  const glowG = new Graphics()
  const dotContainer = new Container()

  glowG.blendMode = 'add'
  dotContainer.blendMode = 'add'

  container.addChild(glowG)
  container.addChild(dotContainer)
  const runtime = createGeneratorRuntime(glowG, dotContainer)

  return {
    container,

    init(state: MapState, w: number, h: number) {
      const ox = w / 2 - 10
      const oy = (h - 324) / 2 + 4
      buildGeneratorPool(runtime, ox, oy, state)
      rebuildGlow(runtime, state)
      syncPrevDeficits(state, runtime.prevDeficits)
    },

    update(state: MapState, dt: number) {
      updateGenerators(runtime, state, dt)
    },

    destroy() {
      container.destroy({ children: true })
      destroyRuntime(runtime)
    },
  }
}
