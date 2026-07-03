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

export function createGeneratorsLayer(): MapLayer {
  const container = new Container()
  const glowG = new Graphics()
  const dotContainer = new Container()

  glowG.blendMode = 'add'
  dotContainer.blendMode = 'add'

  container.addChild(glowG)
  container.addChild(dotContainer)

  let _t = 0
  const _gens: GenDot[] = []
  const _prevDeficits: number[] = new Array(8).fill(0)

  function buildPool(ox: number, oy: number) {
    dotContainer.removeChildren()
    _gens.length = 0
    let total = 0

    const lgas = getLGAGeometry()
    const zonePools = new Map<
      number,
      { poly: [number, number][]; rng: () => number; maxForZone: number }[]
    >()

    // Group LGAs by zoneIdx
    for (const lga of lgas) {
      const arr = zonePools.get(lga.zoneIdx) ?? []
      arr.push({
        poly: lga.isoPolygon,
        rng: mulberry32(lga.key.split('').reduce((a, c) => a + c.charCodeAt(0), 0) * 17 + 7),
        maxForZone: 0,
      })
      zonePools.set(lga.zoneIdx, arr)
    }

    // Assign max generators per zone (proportional to zone area)
    for (const [, pools] of zonePools) {
      let totalArea = 0
      for (const p of pools) {
        const ba =
          p.poly.reduce((s, [a]) => Math.max(s, a), 0) -
          p.poly.reduce((s, [a]) => Math.min(s, a), 0)
        const bb =
          p.poly.reduce((s, [, b]) => Math.max(s, b), 0) -
          p.poly.reduce((s, [, b]) => Math.min(s, b), 0)
        totalArea += ba * bb
      }
      for (const p of pools) {
        const ba =
          p.poly.reduce((s, [a]) => Math.max(s, a), 0) -
          p.poly.reduce((s, [a]) => Math.min(s, a), 0)
        const bb =
          p.poly.reduce((s, [, b]) => Math.max(s, b), 0) -
          p.poly.reduce((s, [, b]) => Math.min(s, b), 0)
        p.maxForZone = Math.max(1, Math.floor((((ba * bb) / totalArea) * MAX_GEN) / pools.length))
      }
    }

    for (const [zi, pools] of zonePools) {
      for (const pool of pools) {
        const { poly, rng, maxForZone } = pool
        // Bounding box for rejection sampling
        let aMin = Infinity,
          aMax = -Infinity,
          bMin = Infinity,
          bMax = -Infinity
        for (const [a, b] of poly) {
          if (a < aMin) aMin = a
          if (a > aMax) aMax = a
          if (b < bMin) bMin = b
          if (b > bMax) bMax = b
        }

        let placed = 0
        for (
          let attempt = 0;
          attempt < maxForZone * 20 && placed < maxForZone && total < MAX_GEN;
          attempt++
        ) {
          const a = aMin + rng() * (aMax - aMin)
          const b = bMin + rng() * (bMax - bMin)
          if (!pointInPolygon(a, b, poly)) continue

          const { x, y } = isoToScreen(a, b, ox, oy)

          const sp = new Sprite(Texture.WHITE)
          sp.width = 2
          sp.height = 2
          sp.anchor.set(0.5, 0.5)
          sp.x = x
          sp.y = y + TILE_H
          sp.tint = GEN_COLOR
          sp.visible = false
          dotContainer.addChild(sp)

          _gens.push({
            sprite: sp,
            screenX: x,
            screenY: y + TILE_H,
            phase: rng() * Math.PI * 2,
            zoneIdx: zi,
            deficitThreshold: (placed / maxForZone) * (MAX_DEFICIT - 2) + 2,
          })
          placed++
          total++
        }
      }
    }
  }

  function rebuildGlow(state: MapState) {
    glowG.clear()
    for (const gen of _gens) {
      const zone = state.zones[gen.zoneIdx]
      if (!zone || zone.powerDeficit < gen.deficitThreshold) continue
      // Single soft circle — no inner core (was two overlapping = hotspot). Sparse sprinkle, never a mass.
      glowG.circle(gen.screenX, gen.screenY, 4).fill({ color: GEN_COLOR, alpha: 0.1 })
    }
  }

  return {
    container,

    init(state: MapState, w: number, h: number) {
      const ox = w / 2 - 10
      const oy = (h - 324) / 2 + 4
      buildPool(ox, oy)
      rebuildGlow(state)
      for (let i = 0; i < state.zones.length; i++) {
        _prevDeficits[i] = state.zones[i]?.powerDeficit ?? 0
      }
    },

    update(state: MapState, dt: number) {
      _t += dt / 1000

      // Rebuild glow geometry if any zone deficit shifted meaningfully
      let glowDirty = false
      for (let i = 0; i < state.zones.length; i++) {
        const d = state.zones[i]?.powerDeficit ?? 0
        if (Math.abs(d - _prevDeficits[i]) > 2) {
          _prevDeficits[i] = d
          glowDirty = true
        }
      }
      if (glowDirty) rebuildGlow(state)

      // Per-frame: toggle visibility and animate alpha
      for (const gen of _gens) {
        const zone = state.zones[gen.zoneIdx]
        const active = zone != null && zone.powerDeficit >= gen.deficitThreshold
        if (!active) {
          if (gen.sprite.visible) gen.sprite.visible = false
          continue
        }
        if (!gen.sprite.visible) gen.sprite.visible = true
        gen.sprite.alpha = genAlpha(_t, gen.phase)
      }
    },

    destroy() {
      container.destroy({ children: true })
      _gens.length = 0
    },
  }
}
