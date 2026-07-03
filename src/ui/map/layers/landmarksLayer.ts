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

export function createLandmarksLayer(): MapLayer {
  const container = new Container()
  const g = new Graphics()
  const bridgeDotsC = new Container()
  container.addChild(g)
  container.addChild(bridgeDotsC)

  let _ox = 0,
    _oy = 0
  let _t = 0
  const _dots: { sprite: Sprite; pathIdx: number; t: number; speed: number }[] = []

  function drawStatic(ox: number, oy: number) {
    g.clear()
    _ox = ox
    _oy = oy

    // ── Third Mainland Bridge structure ───────────────────────────────────
    // Lit ribbon/deck spanning the lagoon from mainland to island
    const dPts = BRIDGE_WAYPOINTS.map(([a, b]) => isoToScreen(a, b, ox, oy))
    // Draw the bridge deck as a 6px-wide filled ribbon
    for (let i = 0; i < dPts.length - 1; i++) {
      const p0 = dPts[i],
        p1 = dPts[i + 1]
      const dx = p1.x - p0.x,
        dy = p1.y - p0.y
      const len = Math.sqrt(dx * dx + dy * dy)
      if (len < 0.1) continue
      const nx = (-dy / len) * 3,
        ny = (dx / len) * 3 // perpendicular, 3px half-width
      g.poly([
        p0.x + nx,
        p0.y + ny,
        p1.x + nx,
        p1.y + ny,
        p1.x - nx,
        p1.y - ny,
        p0.x - nx,
        p0.y - ny,
      ]).fill({ color: DECK_COLOR, alpha: 0.6 })
      // Glow under the deck (brighter, thinner)
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
    // Bridge pillars at intervals
    for (let i = 1; i < dPts.length - 1; i++) {
      const p = dPts[i]
      // Narrow vertical pillar
      g.rect(p.x - 1, p.y - 6, 2, 14).fill({ color: 0x2a4060, alpha: 0.6 })
    }

    // ── Lekki-Ikoyi cable-stayed bridge (A-frame pylon) ───────────────────
    const { x: ax, y: ay } = isoToScreen(LEKKI_IKOYI_A[0], LEKKI_IKOYI_A[1], ox, oy)
    const { x: bx, y: by } = isoToScreen(LEKKI_IKOYI_B[0], LEKKI_IKOYI_B[1], ox, oy)
    // Pylon: two legs spreading from the apex
    const apexX = (ax + bx) / 2,
      apexY = (ay + by) / 2 - 30
    const legSpread = 12
    // Left leg
    g.moveTo(apexX - 1, apexY)
      .lineTo(ax - legSpread, ay)
      .stroke({ color: PYLON_COLOR, width: 2, alpha: 0.55 })
    // Right leg
    g.moveTo(apexX + 1, apexY)
      .lineTo(bx + legSpread, by)
      .stroke({ color: PYLON_COLOR, width: 2, alpha: 0.55 })
    // Cross beam at mid-height
    const midY = (apexY + ay) / 2
    g.moveTo(ax - legSpread * 0.5, midY)
      .lineTo(bx + legSpread * 0.5, midY)
      .stroke({ color: PYLON_COLOR, width: 1.5, alpha: 0.4 })
    // Cable lines radiating from apex to deck
    const cableCount = 5
    for (let i = 1; i <= cableCount; i++) {
      const t = i / (cableCount + 1)
      const cx = ax + (bx - ax) * t,
        cy = ay + (by - ay) * t
      g.moveTo(apexX, apexY).lineTo(cx, cy).stroke({ color: 0x4a6a8a, width: 0.8, alpha: 0.2 })
    }

    // ── Apapa port cranes (gantry silhouettes) ────────────────────────────
    for (const [ca, cb] of APAPA_CRANES) {
      const { x, y } = isoToScreen(ca, cb, ox, oy)
      const craneH = 16,
        craneW = 6
      // Vertical post
      g.rect(x - 0.8, y - craneH, 1.6, craneH).fill({ color: CRANE_COLOR, alpha: 0.55 })
      // Horizontal boom at top
      g.rect(x - craneW, y - craneH, craneW * 2, 1.5).fill({ color: CRANE_COLOR, alpha: 0.45 })
      // Cross braces (diagonal)
      g.moveTo(x - craneW, y - craneH)
        .lineTo(x - 1, y - craneH + 6)
        .stroke({ color: CRANE_COLOR, width: 0.8, alpha: 0.25 })
      g.moveTo(x + craneW, y - craneH)
        .lineTo(x + 1, y - craneH + 6)
        .stroke({ color: CRANE_COLOR, width: 0.8, alpha: 0.25 })
    }

    // ── National Theatre (crown/dome silhouette) ──────────────────────────
    const { x: ntx, y: nty } = isoToScreen(NAT_THEATRE[0], NAT_THEATRE[1], ox, oy)
    // Dome: a tiered crown shape (wider base → narrower top)
    const domeW = 12,
      domeH = 14
    g.moveTo(ntx - domeW, nty)
      .lineTo(ntx - domeW * 0.8, nty - domeH * 0.5)
      .lineTo(ntx - domeW * 0.4, nty - domeH * 0.85)
      .lineTo(ntx, nty - domeH)
      .lineTo(ntx + domeW * 0.4, nty - domeH * 0.85)
      .lineTo(ntx + domeW * 0.8, nty - domeH * 0.5)
      .lineTo(ntx + domeW, nty)
      .stroke({ color: DOME_COLOR, width: 1.5, alpha: 0.4 })
    // Fill the dome shape
    // Fill with a subtle warm light
    g.moveTo(ntx - domeW, nty)
      .lineTo(ntx - domeW * 0.8, nty - domeH * 0.5)
      .lineTo(ntx - domeW * 0.4, nty - domeH * 0.85)
      .lineTo(ntx, nty - domeH)
      .lineTo(ntx + domeW * 0.4, nty - domeH * 0.85)
      .lineTo(ntx + domeW * 0.8, nty - domeH * 0.5)
      .lineTo(ntx + domeW, nty)
      .closePath()
      .fill({ color: 0x2a3a2a, alpha: 0.35 })

    // ── VI towers cluster (tall silhouettes on Eti-Osa skyline) ──────────
    for (const [ta, tb] of VI_TOWERS) {
      const { x, y } = isoToScreen(ta, tb, ox, oy)
      const th = 18 + ((ta * 7 + tb * 3) % 20)
      const tw = 4 + ((ta * 3 + tb * 7) % 3)
      // Tower body
      g.rect(x - tw / 2, y - th, tw, th).fill({ color: TOWER_COLOR, alpha: 0.5 })
      // Antenna/spire on top
      g.moveTo(x, y - th)
        .lineTo(x, y - th - 4)
        .stroke({ color: TOWER_COLOR, width: 1, alpha: 0.3 })
      // Window dots on tower face
      const winRng = mulberry32(Math.round(ta * 100 + tb))
      for (let f = 0; f < Math.floor(th / 3); f++) {
        if (winRng() > 0.35) continue
        const wy = y - th + 3 + f * 3
        const tx = x + (winRng() - 0.5) * tw * 0.5
        g.circle(tx, wy, 0.8).fill({ color: WINDOW_TINT, alpha: 0.25 })
      }
    }
  }

  // ── Bridge traffic dots (moving along the bridge) ─────────────────────
  function buildBridgeDots(ox: number, oy: number) {
    bridgeDotsC.removeChildren()
    _dots.length = 0
    const N = 25
    const rng = mulberry32(999)
    for (let i = 0; i < N; i++) {
      const sp = new Sprite(Texture.WHITE)
      sp.width = 2
      sp.height = 2
      sp.anchor.set(0.5, 0.5)
      sp.tint = 0xd4b860
      sp.alpha = 0.3 + rng() * 0.2
      const startT = i / N + rng() * (1 / N) * 0.5
      const pos = bridgePos(startT, ox, oy)
      sp.x = pos.x
      sp.y = pos.y
      bridgeDotsC.addChild(sp)
      _dots.push({
        sprite: sp,
        pathIdx: i,
        t: startT,
        speed: 0.12 + rng() * 0.08,
      })
    }
  }

  function bridgePos(t: number, ox: number, oy: number): { x: number; y: number } {
    const n = BRIDGE_WAYPOINTS.length - 1
    if (n === 0) return isoToScreen(BRIDGE_WAYPOINTS[0][0], BRIDGE_WAYPOINTS[0][1], ox, oy)
    const seg = Math.min(Math.floor(t * n), n - 1)
    const segT = t * n - seg
    const [a0, b0] = BRIDGE_WAYPOINTS[seg]
    const [a1, b1] = BRIDGE_WAYPOINTS[seg + 1]
    return isoToScreen(a0 + (a1 - a0) * segT, b0 + (b1 - b0) * segT, ox, oy)
  }

  return {
    container,
    init(_state: MapState, w: number, h: number) {
      const ox = w / 2 - 10
      const oy = (h - 324) / 2 + 4
      drawStatic(ox, oy)
      buildBridgeDots(ox, oy)
    },
    update(_state: MapState, dt: number) {
      _t += dt / 1000
      for (const dot of _dots) {
        dot.t += (dot.speed * dt) / 1000
        if (dot.t >= 1) dot.t -= 1
        const pos = bridgePos(dot.t, _ox, _oy)
        dot.sprite.x = pos.x
        dot.sprite.y = pos.y
        // Gentle pulse
        dot.sprite.alpha = 0.25 + 0.15 * Math.sin(_t * 2.0 + dot.pathIdx)
      }
    },
    destroy() {
      container.destroy({ children: true })
      _dots.length = 0
    },
  }
}
