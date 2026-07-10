// D2 — Traffic streams (discrete moving dots, NOT solid lines)
// Each vehicle is a single small dot (2px) moving along a road path.
// Normal blend mode — no additive blending (that creates glowing pipes).
// Only bridge path crosses water (Third Mainland Bridge).
// Building lights dominate; traffic is a faint secondary hint of motion.
// Pre-allocated sprite pool — no per-frame allocation.

import { Container, Sprite, Texture } from 'pixi.js'
import { CITY_ZONES } from '../../../data/lagosLayout'
import type { MapState } from '../../../state/mapSelectors'
import { mulberry32 } from '../buildings'
import { isoToScreen } from '../projection'
import type { MapLayer } from '../types'

// ── Road path definitions in iso space ───────────────────────────────────────
// All coordinates are (a, b) pairs matching the city's iso grid.
// Routes stay on land except the Third Mainland Bridge (intentional water cross).

interface RoadPath {
  id: string
  waypoints: [number, number][]
  zoneId: string
  dotCount: number
  speedBase: number
  isBridge: boolean
  brtShare: number
}

// Hard cap: ~212 total dots (down from 750). Each dot is 2px, clearly spaced.
const ROADS: RoadPath[] = [
  // Third Mainland Bridge — the iconic lagoon crossing, moderate stream
  {
    id: 'bridge',
    waypoints: [
      [22, 34],
      [28, 34],
      [36, 34],
      [42, 33],
      [48, 33],
      [52, 33],
    ],
    zoneId: 'mainland',
    dotCount: 45,
    speedBase: 0.18,
    isBridge: true,
    brtShare: 0.1,
  },
  // Mainland east-west (Oshodi / Mushin corridor)
  {
    id: 'mainland-ew',
    waypoints: [
      [3, 18],
      [10, 18],
      [18, 18],
      [28, 18],
      [38, 18],
    ],
    zoneId: 'mainland',
    dotCount: 38,
    speedBase: 0.13,
    isBridge: false,
    brtShare: 0.08,
  },
  // Mainland north-south (Ikeja → bridge approach)
  {
    id: 'mainland-ns',
    waypoints: [
      [14, 5],
      [14, 12],
      [16, 20],
      [18, 28],
      [20, 34],
    ],
    zoneId: 'mainland',
    dotCount: 24,
    speedBase: 0.1,
    isBridge: false,
    brtShare: 0.05,
  },
  // Alimosho corridor (Lagos-Ibadan Expressway approach)
  {
    id: 'alimosho',
    waypoints: [
      [30, 4],
      [36, 6],
      [42, 8],
      [48, 10],
    ],
    zoneId: 'alimosho',
    dotCount: 18,
    speedBase: 0.12,
    isBridge: false,
    brtShare: 0.0,
  },
  // Apapa port road (slow, heavy freight, kept sparse)
  {
    id: 'apapa',
    waypoints: [
      [46, 12],
      [50, 16],
      [54, 22],
      [56, 28],
    ],
    zoneId: 'apapa',
    dotCount: 16,
    speedBase: 0.08,
    isBridge: false,
    brtShare: 0.0,
  },
  // Lagos Island / Marina arterial
  {
    id: 'island',
    waypoints: [
      [52, 30],
      [55, 34],
      [58, 38],
      [59, 44],
    ],
    zoneId: 'lagosIsland',
    dotCount: 26,
    speedBase: 0.15,
    isBridge: false,
    brtShare: 0.15,
  },
  // Lekki-Epe Expressway (fast, lowest density)
  {
    id: 'lekki',
    waypoints: [
      [60, 56],
      [65, 61],
      [70, 65],
      [75, 70],
    ],
    zoneId: 'lekki',
    dotCount: 18,
    speedBase: 0.2,
    isBridge: false,
    brtShare: 0.05,
  },
  // Ikorodu road (sprawl, slow, sparse)
  {
    id: 'ikorodu',
    waypoints: [
      [4, 46],
      [8, 50],
      [14, 55],
      [20, 60],
    ],
    zoneId: 'ikorodu',
    dotCount: 16,
    speedBase: 0.09,
    isBridge: false,
    brtShare: 0.0,
  },
]

// Pre-computed zone indices (never looked up per frame)
const ROAD_ZONE_IDX = ROADS.map((r) => CITY_ZONES.findIndex((z) => z.id === r.zoneId))

// Dimmer tints — deliberately less saturated than window lights.
// Window gold (255,210,140) is the brightest element. Traffic is secondary.
const DANFO_COLOR = 0xd4a840 // muted gold-yellow, dimmer than window gold
const BRT_COLOR = 0x4a7ec8 // muted blue
const HEADLIGHT_COLOR = 0xc8c0a0 // off-white, faint warm

interface TrafficDot {
  sprite: Sprite
  pathIdx: number
  t: number
  speed: number
  isBRT: boolean
}

function pathPos(waypoints: [number, number][], t: number, ox: number, oy: number) {
  const n = waypoints.length - 1
  if (n === 0) return isoToScreen(waypoints[0][0], waypoints[0][1], ox, oy)
  const seg = Math.min(Math.floor(t * n), n - 1)
  const segT = t * n - seg
  const [a0, b0] = waypoints[seg]
  const [a1, b1] = waypoints[seg + 1]
  return isoToScreen(a0 + (a1 - a0) * segT, b0 + (b1 - b0) * segT, ox, oy)
}

export function createTrafficLayer(): MapLayer {
  // NO additive blend — normal blending keeps dots as discrete small lights
  const container = new Container()

  let _ox = 0,
    _oy = 0
  const _dots: TrafficDot[] = []

  function buildPool(ox: number, oy: number) {
    _ox = ox
    _oy = oy
    container.removeChildren()
    _dots.length = 0

    for (let pi = 0; pi < ROADS.length; pi++) {
      const road = ROADS[pi]
      const rng = mulberry32(pi * 77773 + 13)

      for (let i = 0; i < road.dotCount; i++) {
        const r = rng()
        const isBRT = r < road.brtShare
        const isHeadlight = !isBRT && r < road.brtShare + 0.2

        const color = isBRT ? BRT_COLOR : isHeadlight ? HEADLIGHT_COLOR : DANFO_COLOR

        // Each vehicle = one small 2px dot (not a line segment)
        const sp = new Sprite(Texture.WHITE)
        sp.width = 2
        sp.height = 2
        sp.anchor.set(0.5, 0.5)
        sp.tint = color
        // Low alpha: traffic is secondary to building windows
        sp.alpha = isBRT ? 0.4 : isHeadlight ? 0.28 : 0.35

        // Space dots evenly along path with slight random offset
        const startT = i / road.dotCount + rng() * (1 / road.dotCount) * 0.6
        const pos = pathPos(road.waypoints, startT, ox, oy)
        sp.x = pos.x
        sp.y = pos.y

        container.addChild(sp)
        _dots.push({
          sprite: sp,
          pathIdx: pi,
          t: startT,
          // Narrower speed variation = gentle clustering, not pile-up
          speed: road.speedBase * (0.8 + rng() * 0.4),
          isBRT,
        })
      }
    }
  }

  return {
    container,

    init(_state: MapState, w: number, h: number) {
      _ox = w / 2 - 10
      _oy = (h - 324) / 2 + 4
      buildPool(_ox, _oy)
    },

    update(state: MapState, dt: number) {
      const dtSec = dt / 1000

      for (const dot of _dots) {
        const road = ROADS[dot.pathIdx]
        const zi = ROAD_ZONE_IDX[dot.pathIdx]
        const zone = state.zones[zi]
        const infra = zone?.infrastructure ?? 50

        if (road.isBridge && state.globalEvent === 'blackout') continue

        const speedMult = Math.max(0.2, infra / 50)
        dot.t += dot.speed * speedMult * dtSec
        if (dot.t >= 1) dot.t -= 1

        const pos = pathPos(road.waypoints, dot.t, _ox, _oy)
        dot.sprite.x = pos.x
        dot.sprite.y = pos.y
      }
    },

    destroy() {
      container.destroy({ children: true })
      _dots.length = 0
    },
  }
}
