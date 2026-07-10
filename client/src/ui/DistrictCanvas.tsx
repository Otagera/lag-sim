import { useEffect, useRef } from 'react'
import { generateCityScene } from '../data/cityScene'
import { DISTRICT_PROFILES, type DistrictProfile } from '../data/districtProfiles'
import type { CapitalProject, ConstituencyKey } from '../state/types'
import { drawCity } from './cityRenderer'
import {
  type BuildingColors,
  buildingColors,
  drawBeachTile,
  drawBillboard,
  drawBoat,
  drawBuilding,
  drawCrane,
  drawDanfo,
  drawFerry,
  drawGround,
  drawJetty,
  drawKeke,
  drawMarketStall,
  drawRoad,
  drawSkyscraperTower,
  drawTree,
  isoToScreen,
  roadColor,
  TILE_H,
  TILE_W,
} from './isometric'

const COLS = 10
const ROWS = 8
const ROAD_ROW = 4
const ROAD_COL = 5

function seedRng(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s ^= s << 13
    s = s >>> 0
    s ^= s >> 17
    s = s >>> 0
    s ^= s << 5
    s = s >>> 0
    return s / 0xffffffff
  }
}

function shiftHex(hex: string, d: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, v))
  const r = clamp(parseInt(hex.slice(1, 3), 16) + d)
  const g = clamp(parseInt(hex.slice(3, 5), 16) + d)
  const b = clamp(parseInt(hex.slice(5, 7), 16) + d)
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`
}
function shiftColors(c: BuildingColors, d: number): BuildingColors {
  return { roof: shiftHex(c.roof, d), left: shiftHex(c.left, d), right: shiftHex(c.right, d) }
}

function applySouthWaterEdge(mask: boolean[][], profile: DistrictProfile, rng: () => number): void {
  for (let col = 0; col < COLS; col++) {
    mask[col][ROWS - 1] = false
    mask[col][ROWS - 2] = false
    if (rng() < 0.5) mask[col][ROWS - 3] = false
    if (rng() < 0.18) {
      mask[col][ROWS - 4] = false
      if (rng() < 0.35) mask[col][ROWS - 5] = false
    }
  }
  if (profile.character === 'waterfront' || profile.density === 'sparse') {
    for (let col = 0; col < COLS; col++) {
      if (rng() < 0.22) mask[col][0] = false
      if (rng() < 0.08) mask[col][1] = false
    }
  }
}

function applyEastWaterEdge(mask: boolean[][], _profile: DistrictProfile, rng: () => number): void {
  for (let row = 0; row < ROWS; row++) {
    mask[COLS - 1][row] = false
    mask[COLS - 2][row] = false
    if (rng() < 0.5) mask[COLS - 3][row] = false
    if (rng() < 0.18) {
      mask[COLS - 4][row] = false
      if (rng() < 0.35) mask[COLS - 5][row] = false
    }
  }
}

function generateLandMask(profile: DistrictProfile, seed: number): boolean[][] {
  const rng = seedRng(seed + 4000)
  const mask: boolean[][] = Array.from({ length: COLS }, () => Array(ROWS).fill(true))

  if (!profile.hasWater) {
    if (rng() < 0.35) mask[0][0] = false
    if (rng() < 0.35) mask[COLS - 1][0] = false
    return mask
  }

  if (profile.waterEdge === 'south') {
    applySouthWaterEdge(mask, profile, rng)
  } else if (profile.waterEdge === 'east') {
    applyEastWaterEdge(mask, profile, rng)
  }

  return mask
}

function chaikin(pts: [number, number][], iters = 3): [number, number][] {
  let p = [...pts]
  for (let k = 0; k < iters; k++) {
    const n: [number, number][] = []
    const len = p.length
    for (let j = 0; j < len; j++) {
      const a = p[j],
        b = p[(j + 1) % len]
      n.push([0.75 * a[0] + 0.25 * b[0], 0.75 * a[1] + 0.25 * b[1]])
      n.push([0.25 * a[0] + 0.75 * b[0], 0.25 * a[1] + 0.75 * b[1]])
    }
    p = n
  }
  return p
}

function buildIslandPoly(
  landMask: boolean[][],
  seed: number,
  ox: number,
  oy: number,
): [number, number][] {
  const rng = seedRng(seed + 7000)
  const jit = (s: number) => (rng() - 0.5) * s
  const ctrl: [number, number][] = []

  for (let col = 0; col < COLS; col++) {
    if (landMask[col]?.[0]) {
      const [sx, sy] = isoToScreen(col, 0, 0, ox, oy)
      ctrl.push([sx + jit(14), sy - 12 + jit(6)])
    }
  }
  for (let row = 1; row < ROWS; row++) {
    if (landMask[COLS - 1]?.[row]) {
      const [sx, sy] = isoToScreen(COLS - 1, row, 0, ox, oy)
      ctrl.push([sx + TILE_W / 2 + 12 + jit(10), sy + TILE_H / 2 + jit(8)])
    }
  }
  for (let col = COLS - 1; col >= 0; col--) {
    let br = -1
    for (let row = ROWS - 1; row >= 0; row--) {
      if (landMask[col]?.[row]) {
        br = row
        break
      }
    }
    if (br >= 0) {
      const [sx, sy] = isoToScreen(col, br, 0, ox, oy)
      ctrl.push([sx + jit(16), sy + TILE_H + 12 + jit(10)])
    }
  }
  for (let row = ROWS - 1; row >= 1; row--) {
    if (landMask[0]?.[row]) {
      const [sx, sy] = isoToScreen(0, row, 0, ox, oy)
      ctrl.push([sx - TILE_W / 2 - 12 + jit(10), sy + TILE_H / 2 + jit(8)])
    }
  }

  return ctrl
}

function isAdjacentToSea(col: number, row: number, mask: boolean[][]): boolean {
  const dirs = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ]
  return dirs.some(([dc, dr]) => {
    const nc = col + dc,
      nr = row + dr
    return nc >= 0 && nc < COLS && nr >= 0 && nr < ROWS && !mask[nc][nr]
  })
}

function distToRoad(col: number, row: number): number {
  return Math.min(Math.abs(row - ROAD_ROW), Math.abs(col - ROAD_COL))
}

type Zone = 'ikoyi' | 'vi' | 'lekki'

function getZone(col: number): Zone {
  return col <= 2 ? 'ikoyi' : col <= 6 ? 'vi' : 'lekki'
}

const ZONE_CONFIG: Record<
  Zone,
  {
    minFloors: number
    maxFloors: number
    buildProb: number
    treeProb: number
    roofStyle: RoofStyle
  }
> = {
  ikoyi: { minFloors: 1, maxFloors: 3, buildProb: 0.42, treeProb: 0.32, roofStyle: 'pyramid' },
  vi: { minFloors: 3, maxFloors: 14, buildProb: 0.85, treeProb: 0.04, roofStyle: 'glass' },
  lekki: { minFloors: 2, maxFloors: 5, buildProb: 0.62, treeProb: 0.2, roofStyle: 'glass' },
}

const VI_LANDMARKS: Array<{ col: number; row: number; floors: number }> = [
  { col: 4, row: 2, floors: 14 },
  { col: 4, row: 3, floors: 12 },
  { col: 5, row: 2, floors: 16 },
  { col: 5, row: 3, floors: 10 },
  { col: 6, row: 2, floors: 13 },
]

const ZONE_GROUND: Record<Zone, string> = {
  ikoyi: '#C8B870',
  vi: '#C4BCA0',
  lekki: '#D4C878',
}

type RoofStyle = 'flat' | 'pyramid' | 'glass'

type TileObj =
  | { kind: 'empty' }
  | { kind: 'building'; floors: number; shade: number; roofStyle: RoofStyle }
  | { kind: 'tree'; size: number }
  | { kind: 'marketStall'; awning: string }
  | { kind: 'crane' }
  | { kind: 'boat' }
  | { kind: 'danfo' }
  | { kind: 'ferry' }
  | { kind: 'keke' }
  | { kind: 'jetty' }
  | { kind: 'billboard' }

const CRANE_SLOTS: [number, number][] = [
  [2, 2],
  [7, 2],
  [2, 5],
  [7, 5],
  [5, 3],
]
const AWNING_COLORS = ['#E04040', '#3898E8', '#F0C840', '#60C060', '#E880B0']

function roofStyleFor(character: string): RoofStyle {
  if (character === 'upscale') return 'glass'
  if (character === 'residential' || character === 'waterfront') return 'pyramid'
  return 'flat'
}

function groundColorFor(character: string): string {
  if (character === 'industrial') return '#B4A888'
  if (character === 'waterfront') return '#D8C488'
  if (character === 'upscale') return '#D0B870'
  return '#D4B060'
}

// ── Object map building helpers ──────────────────────────────────────────────

function placeVILandmarks(
  objMap: TileObj[][],
  isSea: (c: number, r: number) => boolean,
  isRoad: (c: number, r: number) => boolean,
) {
  for (const lm of VI_LANDMARKS) {
    if (lm.col < COLS && lm.row < ROWS && !isSea(lm.col, lm.row) && !isRoad(lm.col, lm.row)) {
      objMap[lm.col][lm.row] = {
        kind: 'building',
        floors: lm.floors,
        shade: 0,
        roofStyle: 'glass',
      }
    }
  }
}

function placeTileContent(
  objMap: TileObj[][],
  col: number,
  row: number,
  r: number,
  tp: number,
  bp: number,
  activeRS: RoofStyle,
  zone: Zone | null,
  approval: number,
  isMarket: boolean,
  beach: boolean,
  rngObj: () => number,
  rngObj2: () => number,
) {
  if (isMarket) {
    objMap[col][row] =
      r < 0.8
        ? {
            kind: 'marketStall',
            awning: AWNING_COLORS[Math.floor(rngObj() * AWNING_COLORS.length)],
          }
        : { kind: 'empty' }
  } else if (r < tp) {
    const size = beach ? 0.85 + rngObj() * 0.55 : 0.75 + rngObj() * 0.55
    objMap[col][row] = { kind: 'tree', size }
  } else if (r - tp < bp && !beach) {
    const shadeVariants = [-14, 0, 10]
    const shade = shadeVariants[Math.floor(rngObj() * 3)]
    let floors: number
    if (zone) {
      const zCfg = ZONE_CONFIG[zone]
      const span = zCfg.maxFloors - zCfg.minFloors
      const baseF = zCfg.minFloors + Math.floor(rngObj2() * (span + 1))
      floors = Math.max(zCfg.minFloors, Math.min(zCfg.maxFloors, baseF))
      if (zone === 'vi' && col + row <= 7) floors = Math.max(floors, 5)
    } else {
      const base =
        activeRS === 'glass' ? 2 + Math.floor(approval / 20) : 1 + Math.floor(approval / 30)
      const d = col + row
      const maxF = d < 4 ? 2 : activeRS === 'glass' ? 7 : 3
      floors = Math.max(1, Math.min(maxF, base + Math.floor(rngObj2() * 3) - 1))
    }
    objMap[col][row] = { kind: 'building', floors, shade, roofStyle: activeRS }
  }
}

function fillObjectTile(
  objMap: TileObj[][],
  col: number,
  row: number,
  profile: DistrictProfile,
  approval: number,
  isEtiOsa: boolean,
  baseBP: number,
  baseTP: number,
  isSea: (c: number, r: number) => boolean,
  isRoad: (c: number, r: number) => boolean,
  isBeach: (c: number, r: number) => boolean,
  distToRoadLocal: (c: number, r: number) => number,
  rngObj: () => number,
  rngObj2: () => number,
) {
  if (isSea(col, row) || isRoad(col, row)) return
  if (objMap[col][row].kind !== 'empty') return

  const r = rngObj()
  const dist = distToRoadLocal(col, row)
  const beach = isBeach(col, row)

  const zone = isEtiOsa ? getZone(col) : null
  const zCfg = zone ? ZONE_CONFIG[zone] : null
  const activeRS = zCfg ? zCfg.roofStyle : roofStyleFor(profile.character)
  const activeBP = zCfg ? zCfg.buildProb : baseBP
  const activeTP = zCfg ? zCfg.treeProb : baseTP

  const bp = dist <= 1 ? Math.min(activeBP * 1.35, 0.92) : dist >= 4 ? activeBP * 0.55 : activeBP
  const tp = beach
    ? activeTP * 2.5
    : dist >= 4
      ? activeTP * 1.8
      : dist <= 1
        ? activeTP * 0.3
        : activeTP

  placeTileContent(
    objMap,
    col,
    row,
    r,
    tp,
    bp,
    activeRS,
    zone,
    approval,
    profile.hasMarket && col < ROAD_COL && row > ROAD_ROW,
    beach,
    rngObj,
    rngObj2,
  )
}

function buildObjectMap(
  profile: DistrictProfile,
  approval: number,
  isEtiOsa: boolean,
  _activeProjects: CapitalProject[],
  isSea: (c: number, r: number) => boolean,
  isRoad: (c: number, r: number) => boolean,
  isBeach: (c: number, r: number) => boolean,
  distToRoadLocal: (c: number, r: number) => number,
): TileObj[][] {
  const objMap: TileObj[][] = Array.from({ length: COLS }, () =>
    Array<TileObj>(ROWS).fill({ kind: 'empty' }),
  )

  const baseBP = profile.density === 'dense' ? 0.72 : profile.density === 'moderate' ? 0.55 : 0.32
  const baseTP = profile.density === 'dense' ? 0.06 : 0.14

  if (isEtiOsa) placeVILandmarks(objMap, isSea, isRoad)

  const rngObj = seedRng(profile.seed)
  const rngObj2 = seedRng(profile.seed + 1000)

  for (let col = 0; col < COLS; col++) {
    for (let row = 0; row < ROWS; row++) {
      fillObjectTile(
        objMap,
        col,
        row,
        profile,
        approval,
        isEtiOsa,
        baseBP,
        baseTP,
        isSea,
        isRoad,
        isBeach,
        distToRoadLocal,
        rngObj,
        rngObj2,
      )
    }
  }

  return objMap
}

// ── Placement helpers ────────────────────────────────────────────────────────

function placeProjectCranes(
  objMap: TileObj[][],
  activeProjects: CapitalProject[],
  profile: DistrictProfile,
  isSea: (c: number, r: number) => boolean,
  isRoad: (c: number, r: number) => boolean,
) {
  for (const [cc, cr] of [
    ...activeProjects.slice(0, 3).map((_, i) => CRANE_SLOTS[i]),
    ...(profile.hasPort ? ([[8, 1]] as [number, number][]) : []),
  ] as [number, number][]) {
    if (cc < COLS && cr < ROWS && !isSea(cc, cr) && !isRoad(cc, cr)) {
      objMap[cc][cr] = { kind: 'crane' }
    }
  }
}

function placeBoats(objMap: TileObj[][], seed: number, isSea: (c: number, r: number) => boolean) {
  const boatRng = seedRng(seed + 6000)
  for (let col = 0; col < COLS; col++) {
    for (let row = 0; row < ROWS; row++) {
      if (isSea(col, row) && boatRng() < 0.18) {
        objMap[col][row] = { kind: 'boat' }
      }
    }
  }
}

function placeDanfos(
  objMap: TileObj[][],
  seed: number,
  isSea: (c: number, r: number) => boolean,
  isRoad: (c: number, r: number) => boolean,
) {
  const danfoRng = seedRng(seed + 2000)
  const danfoCount = 4 + Math.floor(danfoRng() * 3)
  const dPool: [number, number][] = []
  for (let col = 0; col < COLS; col++) {
    for (let row = 0; row < ROWS; row++) {
      if (isRoad(col, row) && !isSea(col, row)) dPool.push([col, row])
    }
  }
  for (let i = 0; i < danfoCount && dPool.length > 0; i++) {
    const idx = Math.floor(danfoRng() * dPool.length)
    const [dc, dr] = dPool.splice(idx, 1)[0]
    objMap[dc][dr] = { kind: 'danfo' }
  }
}

function placeFerries(objMap: TileObj[][], seed: number, isSea: (c: number, r: number) => boolean) {
  const ferryRng = seedRng(seed + 3000)
  for (let col = 4; col <= 8; col++) {
    for (let row = 5; row < ROWS; row++) {
      if (isSea(col, row) && objMap[col][row].kind === 'empty' && ferryRng() < 0.18) {
        objMap[col][row] = { kind: 'ferry' }
      }
    }
  }
}

function placeJetties(
  objMap: TileObj[][],
  isSea: (c: number, r: number) => boolean,
  isBeach: (c: number, r: number) => boolean,
) {
  for (const jc of [3, 7]) {
    for (let row = ROWS - 1; row >= 0; row--) {
      if (!isSea(jc, row) && isBeach(jc, row) && objMap[jc][row].kind === 'empty') {
        objMap[jc][row] = { kind: 'jetty' }
        break
      }
    }
  }
}

function placeKekes(
  objMap: TileObj[][],
  seed: number,
  isSea: (c: number, r: number) => boolean,
  isRoad: (c: number, r: number) => boolean,
) {
  const kekeRng = seedRng(seed + 4000)
  const kekeCount = 2 + Math.floor(kekeRng() * 2)
  const kPool: [number, number][] = []
  for (let col = 0; col < COLS; col++) {
    for (let row = 0; row < ROWS; row++) {
      if (isRoad(col, row) && !isSea(col, row) && objMap[col][row].kind === 'empty') {
        kPool.push([col, row])
      }
    }
  }
  for (let i = 0; i < kekeCount && kPool.length > 0; i++) {
    const idx = Math.floor(kekeRng() * kPool.length)
    const [kc, kr] = kPool.splice(idx, 1)[0]
    objMap[kc][kr] = { kind: 'keke' }
  }
}

function placeBillboards(
  objMap: TileObj[][],
  isSea: (c: number, r: number) => boolean,
  isRoad: (c: number, r: number) => boolean,
) {
  for (const [bc, br] of [
    [3, 3],
    [8, 3],
  ] as [number, number][]) {
    if (
      bc < COLS &&
      br < ROWS &&
      !isSea(bc, br) &&
      !isRoad(bc, br) &&
      objMap[bc][br].kind === 'empty'
    ) {
      objMap[bc][br] = { kind: 'billboard' }
    }
  }
}

function placeEtiOsaFeatures(
  objMap: TileObj[][],
  seed: number,
  isSea: (c: number, r: number) => boolean,
  isBeach: (c: number, r: number) => boolean,
  isRoad: (c: number, r: number) => boolean,
) {
  placeFerries(objMap, seed, isSea)
  placeJetties(objMap, isSea, isBeach)
  placeKekes(objMap, seed, isSea, isRoad)
  placeBillboards(objMap, isSea, isRoad)
}

// ── Drawing helpers ──────────────────────────────────────────────────────────

function drawWaterBackground(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const waterBg = ctx.createRadialGradient(
    width * 0.5,
    height * 0.55,
    height * 0.08,
    width * 0.5,
    height * 0.55,
    width * 0.72,
  )
  waterBg.addColorStop(0, '#5FB5C6')
  waterBg.addColorStop(0.5, '#4498B0')
  waterBg.addColorStop(1, '#2A6882')
  ctx.fillStyle = waterBg
  ctx.fillRect(0, 0, width, height)
}

function drawWaveLines(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'
  ctx.lineWidth = 1.0
  for (let row = 0; row < 45; row++) {
    const baseY = row * 10
    if (baseY > height) break
    ctx.beginPath()
    for (let x = 0; x <= width; x += 4) {
      const wy = baseY + Math.sin((x + row * 20) * 0.03) * 1.5
      if (x === 0) ctx.moveTo(x, wy)
      else ctx.lineTo(x, wy)
    }
    ctx.stroke()
  }
}

function drawIslandBase(
  ctx: CanvasRenderingContext2D,
  smoothPoly: [number, number][],
  groundBase: string,
) {
  ctx.save()
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(smoothPoly[0][0], smoothPoly[0][1])
  for (let i = 1; i < smoothPoly.length; i++) ctx.lineTo(smoothPoly[i][0], smoothPoly[i][1])
  ctx.closePath()
  ctx.strokeStyle = 'rgba(100,200,215,0.32)'
  ctx.lineWidth = 24
  ctx.stroke()
  ctx.fillStyle = groundBase
  ctx.fill()
  ctx.strokeStyle = 'rgba(222,198,128,0.48)'
  ctx.lineWidth = 5
  ctx.stroke()
  ctx.restore()
}

function drawSeawall(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  col: number,
  row: number,
  isSea: (c: number, r: number) => boolean,
) {
  const wallH = 5
  if (isSea(col, row + 1)) {
    ctx.fillStyle = '#A8A098'
    ctx.beginPath()
    ctx.moveTo(sx - TILE_W / 2, sy + TILE_H / 2)
    ctx.lineTo(sx, sy + TILE_H)
    ctx.lineTo(sx, sy + TILE_H + wallH)
    ctx.lineTo(sx - TILE_W / 2, sy + TILE_H / 2 + wallH)
    ctx.closePath()
    ctx.fill()
    ctx.strokeStyle = '#D8D0C4'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(sx - TILE_W / 2, sy + TILE_H / 2)
    ctx.lineTo(sx, sy + TILE_H)
    ctx.stroke()
  }
  if (isSea(col + 1, row)) {
    ctx.fillStyle = '#B4AC9C'
    ctx.beginPath()
    ctx.moveTo(sx + TILE_W / 2, sy + TILE_H / 2)
    ctx.lineTo(sx, sy + TILE_H)
    ctx.lineTo(sx, sy + TILE_H + wallH)
    ctx.lineTo(sx + TILE_W / 2, sy + TILE_H / 2 + wallH)
    ctx.closePath()
    ctx.fill()
    ctx.strokeStyle = '#D8D0C4'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(sx + TILE_W / 2, sy + TILE_H / 2)
    ctx.lineTo(sx, sy + TILE_H)
    ctx.stroke()
  }
}

function drawTileShadow(ctx: CanvasRenderingContext2D, sx: number, sy: number) {
  ctx.fillStyle = 'rgba(0,0,0,0.18)'
  ctx.beginPath()
  ctx.moveTo(sx, sy)
  ctx.lineTo(sx + TILE_W / 2, sy + TILE_H / 2)
  ctx.lineTo(sx, sy + TILE_H)
  ctx.lineTo(sx - TILE_W / 2, sy + TILE_H / 2)
  ctx.closePath()
  ctx.fill()
}

function drawTileAt(
  ctx: CanvasRenderingContext2D,
  objMap: TileObj[][],
  col: number,
  row: number,
  d: number,
  sx: number,
  sy: number,
  profile: DistrictProfile,
  isEtiOsa: boolean,
  isSea: (c: number, r: number) => boolean,
  isRoad: (c: number, r: number) => boolean,
  isBeach: (c: number, r: number) => boolean,
  rColor: string,
  groundBase: string,
  groundRng: () => number,
) {
  if (isSea(col, row)) return

  if (isRoad(col, row)) {
    const roadC = isEtiOsa && (row === 1 || col === 2) ? shiftHex(rColor, 10) : rColor
    drawRoad(ctx, sx, sy, roadC)
    const isIntersection = isEtiOsa
      ? (row === ROAD_ROW || row === 1) && (col === ROAD_COL || col === 2)
      : col === ROAD_COL && row === ROAD_ROW
    if (isIntersection) {
      ctx.fillStyle = 'rgba(255,255,255,0.12)'
      ctx.beginPath()
      ctx.arc(sx, sy + TILE_H / 2, TILE_W * 0.14, 0, Math.PI * 2)
      ctx.fill()
    }
  } else if (isBeach(col, row)) {
    drawBeachTile(ctx, sx, sy)
    if (profile.character === 'upscale' && profile.hasWater) {
      drawSeawall(ctx, sx, sy, col, row, isSea)
    }
  } else {
    const shift = Math.round((groundRng() - 0.5) * 14)
    const tileBg = isEtiOsa ? ZONE_GROUND[getZone(col)] : groundBase
    drawGround(ctx, sx, sy, shiftHex(tileBg, shift))

    const obj = objMap[col][row]
    if (
      obj.kind === 'building' ||
      obj.kind === 'crane' ||
      obj.kind === 'marketStall' ||
      obj.kind === 'billboard'
    ) {
      drawTileShadow(ctx, sx, sy)
    }
  }

  if (d < 5) {
    const alpha = (5 - d) * 0.022
    ctx.fillStyle = `rgba(10,80,100,${alpha.toFixed(3)})`
    ctx.beginPath()
    ctx.moveTo(sx, sy)
    ctx.lineTo(sx + TILE_W / 2, sy + TILE_H / 2)
    ctx.lineTo(sx, sy + TILE_H)
    ctx.lineTo(sx - TILE_W / 2, sy + TILE_H / 2)
    ctx.closePath()
    ctx.fill()
  }
}

function renderGroundPass(
  ctx: CanvasRenderingContext2D,
  objMap: TileObj[][],
  profile: DistrictProfile,
  ox: number,
  oy: number,
  isEtiOsa: boolean,
  isSea: (c: number, r: number) => boolean,
  isRoad: (c: number, r: number) => boolean,
  isBeach: (c: number, r: number) => boolean,
  rColor: string,
  groundBase: string,
) {
  const groundRng = seedRng(profile.seed + 500)
  for (let d = 0; d <= COLS + ROWS - 2; d++) {
    for (let col = Math.max(0, d - ROWS + 1); col <= Math.min(COLS - 1, d); col++) {
      const row = d - col
      const [sx, sy] = isoToScreen(col, row, 0, ox, oy)
      drawTileAt(
        ctx,
        objMap,
        col,
        row,
        d,
        sx,
        sy,
        profile,
        isEtiOsa,
        isSea,
        isRoad,
        isBeach,
        rColor,
        groundBase,
        groundRng,
      )
    }
  }
}

function drawObjectAt(
  ctx: CanvasRenderingContext2D,
  obj: TileObj,
  sx: number,
  sy: number,
  isEtiOsa: boolean,
  bColsBase: BuildingColors,
) {
  if (obj.kind === 'building') {
    if (obj.roofStyle === 'glass' && obj.floors >= 5) {
      drawSkyscraperTower(ctx, sx, sy, obj.floors)
    } else if (obj.roofStyle === 'glass' && obj.floors <= 3) {
      const lr: BuildingColors = {
        roof: shiftHex('#C86446', obj.shade),
        left: shiftHex('#B89860', obj.shade),
        right: shiftHex('#E8DCC4', obj.shade),
      }
      drawBuilding(ctx, sx, sy, obj.floors, lr, 'flat')
    } else if (isEtiOsa && obj.roofStyle === 'pyramid') {
      const iColors: BuildingColors = {
        roof: shiftHex('#C86446', obj.shade),
        left: shiftHex('#C4B890', obj.shade),
        right: shiftHex('#DCD0B0', obj.shade),
      }
      drawBuilding(ctx, sx, sy, obj.floors, iColors, 'pyramid')
    } else {
      const colors = obj.shade !== 0 ? shiftColors(bColsBase, obj.shade) : bColsBase
      drawBuilding(ctx, sx, sy, obj.floors, colors, obj.roofStyle)
    }
  } else if (obj.kind === 'tree') {
    drawTree(ctx, sx, sy, obj.size)
  } else if (obj.kind === 'marketStall') {
    drawMarketStall(ctx, sx, sy, obj.awning)
  } else if (obj.kind === 'crane') {
    drawBuilding(ctx, sx, sy, 1, bColsBase, 'flat')
    drawCrane(ctx, sx, sy)
  } else if (obj.kind === 'boat') {
    drawBoat(ctx, sx, sy)
  } else if (obj.kind === 'danfo') {
    drawDanfo(ctx, sx, sy)
  } else if (obj.kind === 'ferry') {
    drawFerry(ctx, sx, sy)
  } else if (obj.kind === 'keke') {
    drawKeke(ctx, sx, sy)
  } else if (obj.kind === 'jetty') {
    drawJetty(ctx, sx, sy)
  } else if (obj.kind === 'billboard') {
    drawBillboard(ctx, sx, sy)
  }
}

function renderObjectPass(
  ctx: CanvasRenderingContext2D,
  objMap: TileObj[][],
  ox: number,
  oy: number,
  isEtiOsa: boolean,
  bColsBase: BuildingColors,
) {
  for (let d = 0; d <= COLS + ROWS - 2; d++) {
    for (let col = Math.max(0, d - ROWS + 1); col <= Math.min(COLS - 1, d); col++) {
      const row = d - col
      const [sx, sy] = isoToScreen(col, row, 0, ox, oy)
      drawObjectAt(ctx, objMap[col][row], sx, sy, isEtiOsa, bColsBase)
    }
  }
}

function drawVignette(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const vignette = ctx.createLinearGradient(0, height - 30, 0, height)
  vignette.addColorStop(0, 'rgba(0,0,0,0)')
  vignette.addColorStop(1, 'rgba(0,20,30,0.22)')
  ctx.fillStyle = vignette
  ctx.fillRect(0, height - 30, width, 30)
}

function drawDistrictCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  lgaKey: ConstituencyKey,
  approval: number,
  infraScore: number,
  activeProjects: CapitalProject[],
) {
  const ox = width * 0.47
  const oy = 80

  drawWaterBackground(ctx, width, height)
  drawWaveLines(ctx, width, height)

  const profile = DISTRICT_PROFILES[lgaKey]
  const bColsBase = buildingColors(approval, profile.character)
  const rColor = roadColor(infraScore)
  const groundBase = groundColorFor(profile.character)
  const landMask = generateLandMask(profile, profile.seed)
  const isEtiOsa = (lgaKey as string) === 'etiOsa'

  const islandPoly = buildIslandPoly(landMask, profile.seed, ox, oy)
  const smoothPoly = chaikin(islandPoly, 3)
  if (smoothPoly.length >= 3) {
    drawIslandBase(ctx, smoothPoly, groundBase)
  }

  const isSea = (col: number, row: number) =>
    col < 0 || col >= COLS || row < 0 || row >= ROWS || !landMask[col][row]
  const isBeach = (col: number, row: number) =>
    landMask[col]?.[row] && isAdjacentToSea(col, row, landMask)
  const isRoadFn = (col: number, row: number) =>
    isEtiOsa
      ? row === ROAD_ROW || row === 1 || col === ROAD_COL || col === 2
      : row === ROAD_ROW || col === ROAD_COL
  const distToRoadLocal = (col: number, row: number) =>
    isEtiOsa
      ? Math.min(
          Math.abs(row - ROAD_ROW),
          Math.abs(row - 1),
          Math.abs(col - ROAD_COL),
          Math.abs(col - 2),
        )
      : distToRoad(col, row)

  const objMap = buildObjectMap(
    profile,
    approval,
    isEtiOsa,
    activeProjects,
    isSea,
    isRoadFn,
    isBeach,
    distToRoadLocal,
  )
  placeProjectCranes(objMap, activeProjects, profile, isSea, isRoadFn)
  placeBoats(objMap, profile.seed, isSea)
  placeDanfos(objMap, profile.seed, isSea, isRoadFn)
  if (isEtiOsa) placeEtiOsaFeatures(objMap, profile.seed, isSea, isBeach, isRoadFn)

  renderGroundPass(
    ctx,
    objMap,
    profile,
    ox,
    oy,
    isEtiOsa,
    isSea,
    isRoadFn,
    isBeach,
    rColor,
    groundBase,
  )
  renderObjectPass(ctx, objMap, ox, oy, isEtiOsa, bColsBase)
  drawVignette(ctx, width, height)
}

export interface DistrictCanvasProps {
  lgaKey: ConstituencyKey
  approval: number
  infraScore: number
  youthTension: number
  activeProjects: CapitalProject[]
  width?: number
  height?: number
}

export function DistrictCanvas({
  lgaKey,
  approval,
  infraScore,
  activeProjects,
  width = 640,
  height = 340,
}: DistrictCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio ?? 1
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    if (lgaKey === 'etiOsa') {
      const scene = generateCityScene(DISTRICT_PROFILES[lgaKey].seed + Math.round(approval))
      drawCity(ctx, width, height, 1, 0, 0, scene)
      return
    }

    drawDistrictCanvas(ctx, width, height, lgaKey, approval, infraScore, activeProjects)
  }, [lgaKey, approval, infraScore, width, height, activeProjects])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  )
}
