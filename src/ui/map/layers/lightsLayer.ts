import { Container, Graphics, Sprite, Texture } from 'pixi.js'
import { CITY_ZONES, type ZoneType } from '../../../data/lagosLayout'
import type { MapLens, MapState, ZoneMapState } from '../../../state/mapSelectors'
import { generateBuildings, mulberry32 } from '../buildings'
import { FLOOR_H, isoToScreen, TILE_H, TILE_W } from '../projection'
import type { MapLayer } from '../types'

// ── Math helpers ──────────────────────────────────────────────────────────────

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.min(1, Math.max(0, t))
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v))
}

// ── FIX 1 — Non-linear infrastructure → litFraction ─────────────────────────
// Exponential curve punishes low end: infra 12 → 1% lit, infra 90 → 83% lit.
// The OLD linear curve left every zone in a "moderately lit" band.
function litFrac(infrastructure: number): number {
  const norm = infrastructure / 100
  return clamp(norm ** 2.2, 0.01, 0.97)
}

// ── FIX 2 — Widened trust → colour with furious red at low end ───────────────
// Five stops: furious red (angry) → angry orange → uneasy amber → gold → warm white-gold.
// A trust-25 zone glows unmistakably RED. A trust-85 zone glows warm GOLD.
// No blue/cool tint in window lights — blue stays in sky and water only.
interface Stop {
  at: number
  r: number
  g: number
  b: number
}
const TRUST_STOPS: Stop[] = [
  { at: 0.0, r: 235, g: 70, b: 55 }, // furious red
  { at: 0.3, r: 240, g: 120, b: 70 }, // angry orange
  { at: 0.55, r: 245, g: 175, b: 100 }, // uneasy amber
  { at: 0.8, r: 255, g: 210, b: 140 }, // settled gold
  { at: 1.0, r: 255, g: 235, b: 180 }, // content warm white-gold
]

function interpolateStops(stops: Stop[], t: number): number {
  const clamped = clamp(t, 0, 1)
  let lo = stops[0],
    hi = stops[stops.length - 1]
  for (let i = 0; i < stops.length - 1; i++) {
    if (clamped >= stops[i].at && clamped <= stops[i + 1].at) {
      lo = stops[i]
      hi = stops[i + 1]
      break
    }
  }
  const span = hi.at - lo.at
  const f = span > 0 ? (clamped - lo.at) / span : 0
  const r = Math.round(lerp(lo.r, hi.r, f))
  const g = Math.round(lerp(lo.g, hi.g, f))
  const b = Math.round(lerp(lo.b, hi.b, f))
  return (r << 16) | (g << 8) | b
}

function trustToColor(trust: number): number {
  return interpolateStops(TRUST_STOPS, trust / 100)
}

// ── Lens-specific colour ramps ─────────────────────────────────────────────
// Infra lens: critical red → adequate yellow → excellent green
const INFRA_STOPS: Stop[] = [
  { at: 0.0, r: 230, g: 55, b: 45 }, // critical
  { at: 0.3, r: 240, g: 130, b: 55 }, // poor
  { at: 0.55, r: 245, g: 200, b: 75 }, // adequate
  { at: 0.8, r: 145, g: 220, b: 100 }, // good
  { at: 1.0, r: 90, g: 240, b: 120 }, // excellent
]

// Security lens: dangerous red → safe cool-white
const SECURITY_STOPS: Stop[] = [
  { at: 0.0, r: 225, g: 45, b: 45 }, // dangerous
  { at: 0.35, r: 238, g: 130, b: 65 }, // unsafe
  { at: 0.6, r: 238, g: 205, b: 125 }, // moderate
  { at: 0.8, r: 175, g: 218, b: 255 }, // safe
  { at: 1.0, r: 200, g: 232, b: 255 }, // very safe
]

// Youth tension lens: calm teal → burning red (HIGH tension = hot)
const YOUTH_STOPS: Stop[] = [
  { at: 0.0, r: 150, g: 228, b: 195 }, // calm
  { at: 0.3, r: 245, g: 218, b: 118 }, // mild
  { at: 0.6, r: 255, g: 158, b: 55 }, // rising
  { at: 0.8, r: 248, g: 88, b: 58 }, // hot
  { at: 1.0, r: 238, g: 48, b: 48 }, // critical
]

function getColorForLens(z: ZoneMapState, lens: MapLens): number {
  switch (lens) {
    case 'infrastructure':
      return interpolateStops(INFRA_STOPS, z.infrastructure / 100)
    case 'security':
      return interpolateStops(SECURITY_STOPS, z.security / 100)
    case 'youth':
      return interpolateStops(YOUTH_STOPS, z.youthTension / 100)
    default:
      return trustToColor(z.trust)
  }
}

// ── FIX 3 — Stark flicker difference (stable vs failing) ─────────────────────
// Stable:   gentle breathe — barely distinguishable from steady
// Unstable: double-sine irregular failing-bulb feel — anxious, alarming
// Crisis:   unstable branch + base×0.5 — barely alive, gasping hard
function windowAlpha(
  t: number,
  phase: number,
  security: number,
  crisis: ZoneMapState['crisisState'],
  base: number,
): number {
  const stability = security / 100
  const effectiveBase = crisis === 'crisis' ? base * 0.5 : base

  let raw: number
  if (stability > 0.65 && crisis !== 'crisis') {
    // Rock-steady, barely-there breathe
    raw = effectiveBase * (0.88 + 0.12 * Math.sin(t * 1.0 + phase))
  } else {
    // Unstable / crisis: double-sine for irregular failing-bulb feel
    const intensity = 1 - stability
    const f =
      Math.sin(t * (3 + intensity * 7) + phase) * Math.sin(t * (1.7 + intensity * 3) + phase * 1.4)
    raw = effectiveBase * (0.35 + 0.65 * Math.abs(f))
  }
  // Hard cap: windows never clip to white — they remain distinct lit dots
  return clamp(raw, 0, 0.85)
}

// ── Glow bloom — height-damped so towers don't runaway-bloom ─────────────────
// Taller buildings are already bright from many windows stacking; their per-zone
// glow should be a SOFT HALO around the cluster, not a wash OVER it.
// heightDamp = 1 / (1 + avgFloors × 0.04) — tall zones get less bloom.
const GLOW_R_MULT: Record<ZoneType, number> = {
  towers: 2.8,
  'mid-rise': 1.8,
  'dense-low': 0.5,
  'sprawl-low': 0.4,
  port: 1.0,
  stilt: 0.8,
  lagoon: 0,
  atlantic: 0,
}

// Typical average floor count per zone type (used only for height damping)
const AVG_FLOORS: Record<ZoneType, number> = {
  towers: 7,
  'mid-rise': 3,
  'dense-low': 1.5,
  'sprawl-low': 1.2,
  port: 1.5,
  stilt: 1,
  lagoon: 0,
  atlantic: 0,
}

function drawZoneGlow(
  g: Graphics,
  cx: number,
  cy: number,
  radius: number,
  color: number,
  intensity: number,
) {
  if (intensity < 0.04 || radius < 4) return
  const steps = 6
  for (let i = 0; i < steps; i++) {
    const r = radius * (1 - i / steps)
    const a = intensity * ((i + 1) / steps) * 0.1 // soft halo, no white blowout
    g.circle(cx, cy, r).fill({ color, alpha: a })
  }
}

// ── Darkness overlay (building face dimming by infra + height) ───────────────
// Tall buildings (towers) need a darker overlay so their many lit windows pop
// against the silhouette. Short houses need less overlay so they read clearly.
// faceBrightness = (0.18 + 0.30*(infra/100)^1.5) × lerp(1.0, 0.8, heightFactor)
// darknessAlpha  = max(0, 1 - brightness/0.45) × 0.55
function faceDarknessAlpha(infrastructure: number, zoneType: ZoneType): number {
  const heightFactor = clamp((AVG_FLOORS[zoneType] ?? 1) / 10, 0, 1)
  const brightness = (0.18 + 0.3 * (infrastructure / 100) ** 1.5) * lerp(1.0, 0.8, heightFactor)
  return Math.max(0, 1 - brightness / 0.45) * 0.55
}

// ── Window position helpers ───────────────────────────────────────────────────
function windowsForBuilding(
  a: number,
  b: number,
  floors: number,
  fp: number,
  ox: number,
  oy: number,
): Array<{ x: number; y: number }> {
  const { x: sx, y: sy } = isoToScreen(a, b, ox, oy)
  const faceBase = sy + fp * 3
  const xL = sx - fp * 2
  const xR = sx + fp * 2
  const pts: Array<{ x: number; y: number }> = []
  for (let f = 0; f < floors; f++) {
    const wy = faceBase - (f + 0.5) * FLOOR_H
    pts.push({ x: xL, y: wy })
    pts.push({ x: xR, y: wy })
  }
  return pts
}

// ── D4 — Water reflection & shimmer ──────────────────────────────────────────
// VI towers cast vertical light pillars + horizontal ripple lines into the lagoon.
// Lagos Island adds a softer secondary reflection.
// Lens-aware: color follows the active map lens.
function drawReflection(g: Graphics, state: MapState, ox: number, oy: number, t: number) {
  g.clear()

  const vi = state.zones.find((z) => z.id === 'viIkoyi')
  const island = state.zones.find((z) => z.id === 'lagosIsland')

  // ── VI reflection — dominant: tall towers cast strong vertical light ─────
  if (vi) {
    const baseAlpha = litFrac(vi.infrastructure) * 0.22
    if (baseAlpha >= 0.01) {
      const color = getColorForLens(vi, state.lens)

      // Horizontal ripple lines (shimmering water surface)
      for (let i = 0; i < 16; i++) {
        const shimX = Math.sin(t * 0.55 + i * 1.25) * 8
        const xC = ox + 18 + shimX
        const yC = oy + 187 + i * 4
        const lineW = 44 + Math.sin(t * 0.38 + i * 0.52) * 8
        const a = baseAlpha * (0.45 + 0.55 * Math.sin(t * 1.2 + i * 0.9)) * (1 - i * 0.038)
        if (a < 0.005) continue
        g.moveTo(xC - lineW / 2, yC)
          .lineTo(xC + lineW / 2, yC)
          .stroke({ color, width: 1.5, alpha: a })
      }

      // Vertical light pillars — towers produce narrow streaks in the water
      for (let j = 0; j < 10; j++) {
        const shimX = Math.sin(t * 0.32 + j * 1.42) * 4
        const x = ox + 8 + j * 6 + shimX
        const yS = oy + 185
        const pilH = 14 + Math.round(Math.sin(t * 0.68 + j * 0.94) * 5)
        const a = baseAlpha * 0.85 * (0.55 + 0.45 * Math.sin(t * 1.05 + j * 1.15))
        if (a < 0.005) continue
        g.moveTo(x, yS)
          .lineTo(x, yS + pilH)
          .stroke({ color, width: 1, alpha: a })
      }
    }
  }

  // ── Lagos Island — softer secondary shimmer ──────────────────────────────
  if (island) {
    const baseAlpha = litFrac(island.infrastructure) * 0.13
    if (baseAlpha >= 0.01) {
      const color = getColorForLens(island, state.lens)
      for (let i = 0; i < 10; i++) {
        const shimX = Math.sin(t * 0.62 + i * 1.08) * 6
        const xC = ox + 4 + shimX
        const yC = oy + 192 + i * 4
        const lineW = 28 + Math.sin(t * 0.48 + i * 0.6) * 5
        const a = baseAlpha * (0.38 + 0.62 * Math.sin(t * 1.1 + i * 0.82)) * (1 - i * 0.048)
        if (a < 0.005) continue
        g.moveTo(xC - lineW / 2, yC)
          .lineTo(xC + lineW / 2, yC)
          .stroke({ color, width: 1.2, alpha: a })
      }
    }
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface WindowDot {
  sprite: Sprite
  phase: number
  threshold: number // lit when zone.litFraction >= threshold
  zoneIdx: number
  floors: number // for height-aware alpha: short buildings stay bright, tall ones tamed
}

interface ZoneDisplay {
  litFraction: number
  color: number
  security: number
  youthTension: number
  crisisState: ZoneMapState['crisisState']
  infrastructure: number // stored so we can detect changes for darkness rebuild
  trust: number // stored so we can detect changes for glow rebuild
}

// ── Main factory ──────────────────────────────────────────────────────────────

export function createLightsLayer(): MapLayer {
  const container = new Container()
  const darknessG = new Graphics() // darkens building silhouettes
  const glowContainer = new Container()
  const reflectG = new Graphics()
  const windowContainer = new Container()

  glowContainer.blendMode = 'screen' // screen asymptotes to bright, never hard-clips to white
  reflectG.blendMode = 'add'

  container.addChild(darknessG)
  container.addChild(glowContainer)
  container.addChild(reflectG)
  container.addChild(windowContainer)

  let _ox = 0,
    _oy = 0,
    _t = 0
  let _prevLens: MapLens = 'approval'
  const _zones: ZoneDisplay[] = []
  const _dots: WindowDot[] = []

  // ── Build helpers ──────────────────────────────────────────────────────────

  function buildZoneDisplays(state: MapState) {
    _zones.length = 0
    for (const z of state.zones) {
      _zones.push({
        litFraction: litFrac(z.infrastructure),
        color: getColorForLens(z, state.lens),
        security: z.security,
        youthTension: z.youthTension,
        crisisState: z.crisisState,
        infrastructure: z.infrastructure,
        trust: z.trust,
      })
    }
  }

  function buildWindows() {
    windowContainer.removeChildren()
    _dots.length = 0
    const buildings = generateBuildings()
    const tex = Texture.WHITE

    for (const bld of buildings) {
      const wpts = windowsForBuilding(bld.a, bld.b, bld.floors, bld.fp, _ox, _oy)
      const rng = mulberry32(bld.a * 997 + bld.b * 31 + 7)

      for (const { x, y } of wpts) {
        const threshold = rng()
        const phase = rng() * Math.PI * 2

        const sp = new Sprite(tex)
        sp.width = 2
        sp.height = 1
        sp.anchor.set(0.5, 0.5)
        sp.x = x
        sp.y = y
        sp.alpha = 0

        windowContainer.addChild(sp)
        _dots.push({ sprite: sp, phase, threshold, zoneIdx: bld.zoneIdx, floors: bld.floors })
      }
    }
  }

  function buildGlow(state: MapState) {
    glowContainer.removeChildren()
    for (let zi = 0; zi < CITY_ZONES.length; zi++) {
      const zone = CITY_ZONES[zi]
      const zd = _zones[zi]
      if (!zd) continue

      const trust = state.zones[zi]?.trust ?? 50
      const heightDamp = 1 / (1 + (AVG_FLOORS[zone.type] ?? 1) * 0.04)
      const gIntensity = zd.litFraction ** 1.3 * (trust / 100) * 0.5 * heightDamp
      if (gIntensity < 0.05) continue

      const ac = (zone.aMin + zone.aMax) / 2
      const bc = (zone.bMin + zone.bMax) / 2
      const { x: cx, y: cy } = isoToScreen(ac, bc, _ox, _oy)

      const aSpan = (zone.aMax - zone.aMin) * 2
      const radius = Math.max(10, aSpan * (GLOW_R_MULT[zone.type] ?? 1.0))

      const gg = new Graphics()
      drawZoneGlow(gg, cx, cy, radius, zd.color, gIntensity)
      glowContainer.addChild(gg)
    }
  }

  function buildDarkness(state: MapState) {
    darknessG.clear()
    for (let zi = 0; zi < CITY_ZONES.length; zi++) {
      const zone = CITY_ZONES[zi]
      const infra = state.zones[zi]?.infrastructure ?? 50
      const alpha = faceDarknessAlpha(infra, zone.type)
      if (alpha < 0.02) continue

      const corners = [
        isoToScreen(zone.aMin, zone.bMin, _ox, _oy),
        isoToScreen(zone.aMin, zone.bMax, _ox, _oy),
        isoToScreen(zone.aMax, zone.bMax, _ox, _oy),
        isoToScreen(zone.aMax, zone.bMin, _ox, _oy),
      ]
      darknessG.poly(corners.flatMap((p) => [p.x, p.y])).fill({ color: 0x000000, alpha })
    }
  }

  // ── MapLayer interface ─────────────────────────────────────────────────────

  return {
    container,

    init(state: MapState, w: number, h: number) {
      _ox = w / 2 - 10
      _oy = (h - 324) / 2 + 4

      buildZoneDisplays(state)
      buildWindows()
      buildGlow(state)
      buildDarkness(state)
    },

    update(state: MapState, dt: number) {
      _t += dt / 1000

      // Detect if we need to rebuild static layers
      let infraChanged = false
      let trustChanged = false

      // Lens change triggers full color + glow rebuild
      if (state.lens !== _prevLens) {
        _prevLens = state.lens
        trustChanged = true
      }

      for (let i = 0; i < state.zones.length; i++) {
        const z = state.zones[i]
        const zd = _zones[i]
        if (!zd) continue

        const newLit = litFrac(z.infrastructure)
        const newColor = getColorForLens(z, state.lens)

        if (Math.abs(z.infrastructure - zd.infrastructure) > 0.5) infraChanged = true
        if (Math.abs(z.trust - zd.trust) > 0.5) trustChanged = true
        if (Math.abs(z.security - zd.security) > 0.5) trustChanged = true
        if (Math.abs(z.youthTension - zd.youthTension) > 0.5) trustChanged = true

        zd.litFraction = newLit
        zd.color = newColor
        zd.security = z.security
        zd.youthTension = z.youthTension
        zd.crisisState = z.crisisState
        zd.infrastructure = z.infrastructure
        zd.trust = z.trust
      }

      if (infraChanged) buildDarkness(state)
      if (infraChanged || trustChanged) buildGlow(state)

      // Per-frame window updates (tint + flicker alpha)
      // Height-aware base: short houses keep near-full brightness; tall towers tamed.
      // MAX_HEIGHT=10 matches floorRange 'towers' upper bound in buildings.ts.
      const MAX_HEIGHT = 10
      for (const dot of _dots) {
        const zd = _zones[dot.zoneIdx]
        if (!zd) continue
        if (zd.litFraction < dot.threshold) {
          if (dot.sprite.alpha !== 0) dot.sprite.alpha = 0
        } else {
          const heightFactor = clamp(dot.floors / MAX_HEIGHT, 0, 1)
          const baseAlpha = lerp(0.62, 0.42, heightFactor)
          dot.sprite.tint = zd.color
          dot.sprite.alpha = windowAlpha(_t, dot.phase, zd.security, zd.crisisState, baseAlpha)
        }
      }

      // Water reflection (redrawn every frame for shimmer)
      drawReflection(reflectG, state, _ox, _oy, _t)
    },

    destroy() {
      container.destroy({ children: true })
      _dots.length = 0
      _zones.length = 0
    },
  }
}

void TILE_W
void TILE_H
