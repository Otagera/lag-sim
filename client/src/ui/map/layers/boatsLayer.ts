// D3 — Boats, ferries & Makoko canoes
// The lagoon is a working waterway — ferries crossing, canoes drifting near Makoko,
// cargo ships patrolling near Apapa. Activity scales with economic vitality of VI/Island.
// All pre-allocated, no per-frame allocation. Hard cap: 40 boats total.

import { Container, Sprite, Texture } from 'pixi.js'
import type { MapState } from '../../../state/mapSelectors'
import { mulberry32 } from '../buildings'
import { isoToScreen } from '../projection'
import type { MapLayer } from '../types'

// ── Boat path definitions in iso space ───────────────────────────────────────
// Lagoon zone: a=44-58, b=28-62
// Makoko zone: a=40-50, b=34-42
// Apapa zone:  a=44-60, b=10-28

type BoatType = 'ferry' | 'canoe' | 'cargo'
type BoatWaypoint = [number, number]

interface BoatPath {
  type: BoatType
  waypoints: BoatWaypoint[]
  looping: boolean // true = wrap t; false = ping-pong
  count: number // boats on this path
  speedBase: number
  color: number
  baseAlpha: number
  size: number // sprite px
}

interface BoatSpriteOptions {
  x: number
  y: number
  size: number
  tint: number
  alpha: number
  texture?: Texture
}

const boatRoute = (waypoints: BoatWaypoint[]) => waypoints

function createBoatSprite({ x, y, size, tint, alpha, texture = Texture.WHITE }: BoatSpriteOptions) {
  const sprite = new Sprite(texture)
  sprite.width = size
  sprite.height = size
  sprite.anchor.set(0.5, 0.5)
  sprite.tint = tint
  sprite.alpha = alpha
  sprite.x = x
  sprite.y = y
  return sprite
}

const BOAT_PATHS: BoatPath[] = [
  // Ferries crossing the central lagoon (north-south routes)
  {
    type: 'ferry',
    waypoints: boatRoute([
      [45, 32],
      [48, 36],
      [51, 38],
    ]),
    looping: true,
    count: 2,
    speedBase: 0.04,
    color: 0xfff0c0,
    baseAlpha: 0.65,
    size: 2,
  },
  {
    type: 'ferry',
    waypoints: boatRoute([
      [47, 42],
      [50, 46],
      [53, 48],
    ]),
    looping: true,
    count: 2,
    speedBase: 0.032,
    color: 0xffe8a8,
    baseAlpha: 0.55,
    size: 2,
  },
  // Canoes near Makoko — dim, slow, close to the stilt settlements
  {
    type: 'canoe',
    waypoints: boatRoute([
      [42, 36],
      [44, 38],
      [46, 36],
      [44, 34],
    ]),
    looping: true,
    count: 3,
    speedBase: 0.022,
    color: 0xb07838,
    baseAlpha: 0.32,
    size: 1,
  },
  {
    type: 'canoe',
    waypoints: boatRoute([
      [41, 37],
      [43, 39],
      [45, 38],
      [43, 36],
    ]),
    looping: true,
    count: 2,
    speedBase: 0.018,
    color: 0xa06830,
    baseAlpha: 0.28,
    size: 1,
  },
  // Cargo ships near Apapa — very slow, large nav lights
  {
    type: 'cargo',
    waypoints: boatRoute([
      [50, 16],
      [52, 20],
      [54, 24],
      [52, 20],
    ]),
    looping: false, // patrol back and forth
    count: 1,
    speedBase: 0.014,
    color: 0xff4444, // red port nav light
    baseAlpha: 0.58,
    size: 3,
  },
  {
    type: 'cargo',
    waypoints: boatRoute([
      [52, 18],
      [54, 22],
      [56, 26],
      [54, 22],
    ]),
    looping: false,
    count: 1,
    speedBase: 0.011,
    color: 0xffffff, // starboard white nav light
    baseAlpha: 0.48,
    size: 2,
  },
  // Second ferry run — shorter, more active near Eko Bridge
  {
    type: 'ferry',
    waypoints: boatRoute([
      [46, 38],
      [48, 42],
      [50, 44],
    ]),
    looping: true,
    count: 1,
    speedBase: 0.028,
    color: 0xf0e0b0,
    baseAlpha: 0.5,
    size: 2,
  },
]

interface BoatDot {
  sprite: Sprite
  pathIdx: number
  t: number
  speed: number
  dir: 1 | -1 // for ping-pong paths
}

function boatPos(waypoints: BoatWaypoint[], t: number, ox: number, oy: number) {
  const n = waypoints.length - 1
  if (n === 0) return isoToScreen(waypoints[0][0], waypoints[0][1], ox, oy)
  const seg = Math.min(Math.floor(t * n), n - 1)
  const segT = t * n - seg
  const [a0, b0] = waypoints[seg]
  const [a1, b1] = waypoints[seg + 1]
  return isoToScreen(a0 + (a1 - a0) * segT, b0 + (b1 - b0) * segT, ox, oy)
}

function boatActivityMultiplier(state: MapState) {
  const vi = state.zones.find((z) => z.id === 'viIkoyi')
  const island = state.zones.find((z) => z.id === 'lagosIsland')
  const economy = ((vi?.trust ?? 50) + (island?.trust ?? 50)) / 2
  return Math.max(0.2, economy / 60)
}

function advanceBoat(boat: BoatDot, path: BoatPath, dtSec: number) {
  if (path.looping) {
    boat.t = (boat.t + boat.speed * dtSec) % 1
    return
  }

  boat.t += boat.speed * boat.dir * dtSec
  if (boat.t >= 1) {
    boat.t = 1
    boat.dir = -1
  } else if (boat.t <= 0) {
    boat.t = 0
    boat.dir = 1
  }
}

function buildBoatPool(container: Container, ox: number, oy: number) {
  container.removeChildren()
  const boats: BoatDot[] = []

  for (let pi = 0; pi < BOAT_PATHS.length; pi++) {
    const path = BOAT_PATHS[pi]
    const rng = mulberry32(pi * 44449 + 7)

    for (let i = 0; i < path.count; i++) {
      const startT = rng()
      const pos = boatPos(path.waypoints, startT, ox, oy)
      const sprite = createBoatSprite({
        x: pos.x,
        y: pos.y,
        size: path.size,
        tint: path.color,
        alpha: path.baseAlpha,
      })

      container.addChild(sprite)
      boats.push({
        sprite,
        pathIdx: pi,
        t: startT,
        speed: path.speedBase * (0.75 + rng() * 0.5),
        dir: 1,
      })
    }
  }

  return boats
}

function updateBoats(state: MapState, boats: BoatDot[], dtSec: number, ox: number, oy: number) {
  const actMult = boatActivityMultiplier(state)
  let writeIdx = 0

  for (const boat of boats) {
    const path = BOAT_PATHS[boat.pathIdx]

    boat.sprite.alpha = path.baseAlpha * actMult
    boat.sprite.visible = boat.sprite.alpha > 0
    advanceBoat(boat, path, dtSec)

    const pos = boatPos(path.waypoints, boat.t, ox, oy)
    boat.sprite.x = pos.x
    boat.sprite.y = pos.y
    boats[writeIdx++] = boat
  }

  boats.length = writeIdx
  return boats
}

export function createBoatsLayer(): MapLayer {
  const container = new Container()
  container.blendMode = 'add'

  let ox = 0
  let oy = 0
  let boats: BoatDot[] = []

  return {
    container,

    init(_state: MapState, w: number, h: number) {
      ox = w / 2 - 10
      oy = (h - 324) / 2 + 4
      boats = buildBoatPool(container, ox, oy)
    },

    update(state: MapState, dt: number) {
      boats = updateBoats(state, boats, dt / 1000, ox, oy)
    },

    destroy() {
      container.destroy({ children: true })
      boats = []
    },
  }
}
