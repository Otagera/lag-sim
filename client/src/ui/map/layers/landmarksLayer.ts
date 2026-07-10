// Layer 6 — Lagos landmark silhouettes & bridge lights.
// Five unmistakable Lagos structures drawn at their real projected positions.
// Third Mainland Bridge is the highest-impact: a lit ribbon crossing the lagoon.
// Lekki-Ikoyi cable-stayed bridge, Apapa port cranes, National Theatre dome,
// and the VI towers cluster complete the recognizability set.

import { Container, Graphics, Sprite, Texture } from 'pixi.js'
import type { MapState } from '../../../state/mapSelectors'
import { mulberry32 } from '../buildings'
import { isoToScreen } from '../projection'
import type { MapLayer } from '../types'

// ── Landmark positions in iso space ────────────────────────────────────────

const BRIDGE_WAYPOINTS: [number, number][] = [
  [20, 34],
  [26, 34],
  [32, 34],
  [38, 33.5],
  [44, 33],
  [50, 33],
]

// Lekki-Ikoyi cable-stayed bridge — single A-frame pylon
const LEKKI_IKOYI_A: [number, number] = [61, 52]
// LEKKI_IKOYI_B is where the bridge reaches the other side
const LEKKI_IKOYI_B: [number, number] = [63, 54]

// Apapa port — 3 gantry cranes just inland from the water
const APAPA_CRANES: [number, number][] = [
  [48, 18],
  [50, 18],
  [52, 18],
]

// National Theatre Iganmu — near mainland waterfront
const NAT_THEATRE: [number, number] = [46, 30]

// VI towers cluster — 5 tall towers
const VI_TOWERS: [number, number][] = [
  [59, 47],
  [60, 47.5],
  [61, 47],
  [60, 48.5],
  [59.5, 46.5],
]

const DECK_COLOR = 0x2a4a70
const DECK_GLOW = 0x5588bb
const PYLON_COLOR = 0x3a5a7a
const CRANE_COLOR = 0x334455
const DOME_COLOR = 0x3a4a5a
const TOWER_COLOR = 0x2a3a5a
const WINDOW_TINT = 0xd4b860

type BridgeDot = {
  sprite: Sprite
  pathIdx: number
  t: number
  speed: number
}

type LandmarkAnimationState = {
  ox: number
  oy: number
  elapsed: number
  dt: number
}

function drawBridgeArches(g: Graphics, ox: number, oy: number) {
  const points = BRIDGE_WAYPOINTS.map(([a, b]) => isoToScreen(a, b, ox, oy))

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i]
    const p1 = points[i + 1]
    const dx = p1.x - p0.x
    const dy = p1.y - p0.y
    const len = Math.sqrt(dx * dx + dy * dy)
    if (len < 0.1) continue

    const nx = (-dy / len) * 3
    const ny = (dx / len) * 3

    g.poly([
      p0.x + nx,
      p0.y + ny,
      p1.x + nx,
      p1.y + ny,
      p1.x - nx,
      p1.y - ny,
      p0.x - nx,
      p0.y - ny,
    ]).fill({
      color: DECK_COLOR,
      alpha: 0.6,
    })
    g.poly([
      p0.x + nx * 0.5,
      p0.y + ny * 0.5,
      p1.x + nx * 0.5,
      p1.y + ny * 0.5,
      p1.x - nx * 0.5,
      p1.y - ny * 0.5,
      p0.x - nx * 0.5,
      p0.y - ny * 0.5,
    ]).fill({ color: DECK_GLOW, alpha: 0.2 })
  }

  for (const point of points.slice(1, -1)) {
    g.rect(point.x - 1, point.y - 6, 2, 14).fill({ color: 0x2a4060, alpha: 0.6 })
  }
}

function drawBridgeCables(g: Graphics, ox: number, oy: number) {
  const { x: ax, y: ay } = isoToScreen(LEKKI_IKOYI_A[0], LEKKI_IKOYI_A[1], ox, oy)
  const { x: bx, y: by } = isoToScreen(LEKKI_IKOYI_B[0], LEKKI_IKOYI_B[1], ox, oy)
  const apexX = (ax + bx) / 2
  const apexY = (ay + by) / 2 - 30
  const legSpread = 12

  g.moveTo(apexX - 1, apexY)
    .lineTo(ax - legSpread, ay)
    .stroke({ color: PYLON_COLOR, width: 2, alpha: 0.55 })
  g.moveTo(apexX + 1, apexY)
    .lineTo(bx + legSpread, by)
    .stroke({ color: PYLON_COLOR, width: 2, alpha: 0.55 })

  const midY = (apexY + ay) / 2
  g.moveTo(ax - legSpread * 0.5, midY)
    .lineTo(bx + legSpread * 0.5, midY)
    .stroke({ color: PYLON_COLOR, width: 1.5, alpha: 0.4 })

  const cableCount = 5
  for (let i = 1; i <= cableCount; i++) {
    const t = i / (cableCount + 1)
    const cx = ax + (bx - ax) * t
    const cy = ay + (by - ay) * t
    g.moveTo(apexX, apexY).lineTo(cx, cy).stroke({ color: 0x4a6a8a, width: 0.8, alpha: 0.2 })
  }
}

function drawApapaCranes(g: Graphics, ox: number, oy: number) {
  for (const [a, b] of APAPA_CRANES) {
    const { x, y } = isoToScreen(a, b, ox, oy)
    const craneH = 16
    const craneW = 6

    g.rect(x - 0.8, y - craneH, 1.6, craneH).fill({ color: CRANE_COLOR, alpha: 0.55 })
    g.rect(x - craneW, y - craneH, craneW * 2, 1.5).fill({ color: CRANE_COLOR, alpha: 0.45 })
    g.moveTo(x - craneW, y - craneH)
      .lineTo(x - 1, y - craneH + 6)
      .stroke({ color: CRANE_COLOR, width: 0.8, alpha: 0.25 })
    g.moveTo(x + craneW, y - craneH)
      .lineTo(x + 1, y - craneH + 6)
      .stroke({ color: CRANE_COLOR, width: 0.8, alpha: 0.25 })
  }
}

function drawNationalTheatre(g: Graphics, ox: number, oy: number) {
  const { x, y } = isoToScreen(NAT_THEATRE[0], NAT_THEATRE[1], ox, oy)
  const domeW = 12
  const domeH = 14
  const domePoints = [
    x - domeW,
    y,
    x - domeW * 0.8,
    y - domeH * 0.5,
    x - domeW * 0.4,
    y - domeH * 0.85,
    x,
    y - domeH,
    x + domeW * 0.4,
    y - domeH * 0.85,
    x + domeW * 0.8,
    y - domeH * 0.5,
    x + domeW,
    y,
  ]

  g.poly(domePoints).stroke({ color: DOME_COLOR, width: 1.5, alpha: 0.4 })
  g.poly(domePoints).fill({ color: 0x2a3a2a, alpha: 0.35 })
}

function drawVITowers(g: Graphics, ox: number, oy: number) {
  for (const [a, b] of VI_TOWERS) {
    const { x, y } = isoToScreen(a, b, ox, oy)
    const towerHeight = 18 + ((a * 7 + b * 3) % 20)
    const towerWidth = 4 + ((a * 3 + b * 7) % 3)

    g.rect(x - towerWidth / 2, y - towerHeight, towerWidth, towerHeight).fill({
      color: TOWER_COLOR,
      alpha: 0.5,
    })
    g.moveTo(x, y - towerHeight)
      .lineTo(x, y - towerHeight - 4)
      .stroke({ color: TOWER_COLOR, width: 1, alpha: 0.3 })

    const winRng = mulberry32(Math.round(a * 100 + b))
    for (let floor = 0; floor < Math.floor(towerHeight / 3); floor++) {
      if (winRng() > 0.35) continue
      const windowY = y - towerHeight + 3 + floor * 3
      const windowX = x + (winRng() - 0.5) * towerWidth * 0.5
      g.circle(windowX, windowY, 0.8).fill({ color: WINDOW_TINT, alpha: 0.25 })
    }
  }
}

function drawLandmarksBase(g: Graphics, ox: number, oy: number) {
  drawBridgeArches(g, ox, oy)
  drawBridgeCables(g, ox, oy)
  drawApapaCranes(g, ox, oy)
  drawNationalTheatre(g, ox, oy)
  drawVITowers(g, ox, oy)
}

function buildStaticLandmarks(g: Graphics, ox: number, oy: number) {
  g.clear()
  drawLandmarksBase(g, ox, oy)
}

function drawLandmarkLabel(sprite: Sprite, name: string, x: number, y: number) {
  sprite.name = name
  sprite.x = x
  sprite.y = y
}

function bridgePos(t: number, ox: number, oy: number): { x: number; y: number } {
  const segments = BRIDGE_WAYPOINTS.length - 1
  if (segments === 0) {
    return isoToScreen(BRIDGE_WAYPOINTS[0][0], BRIDGE_WAYPOINTS[0][1], ox, oy)
  }

  const segment = Math.min(Math.floor(t * segments), segments - 1)
  const segmentT = t * segments - segment
  const [a0, b0] = BRIDGE_WAYPOINTS[segment]
  const [a1, b1] = BRIDGE_WAYPOINTS[segment + 1]
  return isoToScreen(a0 + (a1 - a0) * segmentT, b0 + (b1 - b0) * segmentT, ox, oy)
}

function buildBridgeDots(bridgeDotsC: Container, ox: number, oy: number): BridgeDot[] {
  bridgeDotsC.removeChildren()

  const dots: BridgeDot[] = []
  const dotCount = 25
  const rng = mulberry32(999)

  for (let i = 0; i < dotCount; i++) {
    const sprite = new Sprite(Texture.WHITE)
    sprite.width = 2
    sprite.height = 2
    sprite.anchor.set(0.5, 0.5)
    sprite.tint = 0xd4b860
    sprite.alpha = 0.3 + rng() * 0.2

    const startT = i / dotCount + rng() * (1 / dotCount) * 0.5
    const pos = bridgePos(startT, ox, oy)
    drawLandmarkLabel(sprite, `bridge-dot-${i}`, pos.x, pos.y)
    bridgeDotsC.addChild(sprite)

    dots.push({
      sprite,
      pathIdx: i,
      t: startT,
      speed: 0.12 + rng() * 0.08,
    })
  }

  return dots
}

function updateLandmarks(state: LandmarkAnimationState, dots: BridgeDot[]) {
  state.elapsed += state.dt / 1000

  for (const dot of dots) {
    dot.t += (dot.speed * state.dt) / 1000
    if (dot.t >= 1) dot.t -= 1

    const pos = bridgePos(dot.t, state.ox, state.oy)
    dot.sprite.x = pos.x
    dot.sprite.y = pos.y
    dot.sprite.alpha = 0.25 + 0.15 * Math.sin(state.elapsed * 2 + dot.pathIdx)
  }
}

export function createLandmarksLayer(): MapLayer {
  const container = new Container()
  const g = new Graphics()
  const bridgeDotsC = new Container()
  container.addChild(g)
  container.addChild(bridgeDotsC)

  const animationState: LandmarkAnimationState = { ox: 0, oy: 0, elapsed: 0, dt: 0 }
  let dots: BridgeDot[] = []

  const drawStatic = (ox: number, oy: number) => {
    animationState.ox = ox
    animationState.oy = oy
    buildStaticLandmarks(g, ox, oy)
  }

  return {
    container,
    init(_state: MapState, w: number, h: number) {
      const ox = w / 2 - 10
      const oy = (h - 324) / 2 + 4
      drawStatic(ox, oy)
      dots = buildBridgeDots(bridgeDotsC, ox, oy)
    },
    update(_state: MapState, dt: number) {
      animationState.dt = dt
      updateLandmarks(animationState, dots)
    },
    destroy() {
      container.destroy({ children: true })
      dots.length = 0
    },
  }
}
