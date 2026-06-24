import * as PALETTE from './cityPalette'

// ---- Seeded PRNG ----
export function mulberry32(seed: number): () => number {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ---- Resolved types ----
export interface ResolvedBuilding {
  cx: number; cy: number
  w: number; d: number; h: number
  roofColor: string; wallColor: string; shadowColor: string
  accentColor?: string
  type: 'residential' | 'mixedUse' | 'glassTower' | 'stilt'
  depthLayer: number
  sortY: number
}

export interface ResolvedTree {
  cx: number; cy: number
  canopyR: number; canopyColor: string; trunkColor: string
  isPalm: boolean
  isMangrove?: boolean
  sortY: number
}

export interface ResolvedVehicle {
  cx: number; cy: number
  color: string; accentColor: string
  w: number; h: number
  isBRT: boolean
  rot: number
  sortY: number
}

export interface ResolvedBoat {
  cx: number; cy: number
  w: number; h: number
  hullColor: string; accentColor: string
  type: 'ferry' | 'canoe' | 'cargo' | 'speedboat'
  rot: number
  sortY: number
}

export interface ResolvedLandmass {
  points: [number, number][]
  color: string
  isIsland: boolean
  sortY: number
}

export interface ResolvedRoad {
  points: [number, number][]
  w: number
  level: 'primary' | 'secondary' | 'local'
  sortY: number
}

export interface ResolvedBridge {
  x1: number; y1: number; x2: number; y2: number
  w: number; type: 'cable' | 'suspension' | 'simple'
  sortY: number
}

export interface ResolvedPin {
  cx: number; cy: number; color: string
  sortY: number
}

export interface ResolvedMarketStall {
  cx: number; cy: number; canopyColor: string
  w: number; h: number
  sortY: number
}

export interface ResolvedStreetlight {
  cx: number; cy: number; sortY: number
}

export interface ResolvedBillboard {
  cx: number; cy: number; color: string; sortY: number
}

export interface ResolvedMarketZone {
  cx: number; cy: number; rx: number; ry: number
}

export interface ResolvedWalkway {
  points: [number, number][]
  sortY: number
}

export interface ResolvedScene {
  seed: number
  landmasses: ResolvedLandmass[]
  roads: ResolvedRoad[]
  bridges: ResolvedBridge[]
  buildings: ResolvedBuilding[]
  trees: ResolvedTree[]
  marketStalls: ResolvedMarketStall[]
  marketZones: ResolvedMarketZone[]
  vehicles: ResolvedVehicle[]
  boats: ResolvedBoat[]
  pins: ResolvedPin[]
  streetlights: ResolvedStreetlight[]
  billboards: ResolvedBillboard[]
  walkways: ResolvedWalkway[]
}

// ---- Helpers ----
function rngRange(rng: () => number, min: number, max: number): number {
  return min + rng() * (max - min)
}

function rngInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rngRange(rng, min, max + 1))
}

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)]
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function pointInEllipse(px: number, py: number, cx: number, cy: number, rx: number, ry: number): boolean {
  return ((px - cx) / rx) ** 2 + ((py - cy) / ry) ** 2 <= 1
}

// ---- Organic landmass generation ----
function perturbPolygon(pts: [number, number][], amp: number, subdivisions: number, rng: () => number): [number, number][] {
  let result: [number, number][] = pts.map(p => [p[0], p[1]])
  for (let s = 0; s < subdivisions; s++) {
    const next: [number, number][] = []
    for (let i = 0; i < result.length; i++) {
      const [x, y] = result[i]
      const [nx, ny] = result[(i + 1) % result.length]
      const mx = (x + nx) / 2 + rngRange(rng, -amp, amp)
      const my = (y + ny) / 2 + rngRange(rng, -amp, amp)
      next.push([x, y])
      next.push([mx, my])
    }
    result = next
  }
  return result
}

// ---- Build zone ----
interface BuildZone {
  districtKey: string
  cx: number; cy: number; rx: number; ry: number
  type: ResolvedBuilding['type']
  density: number; gridW: number; gridH: number
  minW: number; maxW: number
  minD: number; maxD: number
  minH: number; maxH: number
  depthLayer: number
}

function generateInZone(rng: () => number, z: BuildZone, roofs: string[], walls: string[], shadows: string[], accent: string | undefined): ResolvedBuilding[] {
  const buildings: ResolvedBuilding[] = []
  for (let x = z.cx - z.rx; x < z.cx + z.rx; x += z.gridW) {
    for (let y = z.cy - z.ry; y < z.cy + z.ry; y += z.gridH) {
      if (rng() > z.density) continue
      const px = x
      const py = y
      if (!pointInEllipse(px, py, z.cx, z.cy, z.rx, z.ry)) continue
      let w = rngRange(rng, z.minW, z.maxW)
      let d = rngRange(rng, z.minD, z.maxD)
      let h = rngRange(rng, z.minH, z.maxH)
      // 8% become chunky hero buildings — breaks up procedural monotony
      if (z.type !== 'glassTower' && rng() < 0.08) {
        w *= 1.6; d *= 1.4; h *= 1.2
      }
      buildings.push({
        cx: px, cy: py, w, d, h,
        roofColor: pick(rng, roofs),
        wallColor: pick(rng, walls),
        shadowColor: pick(rng, shadows),
        accentColor: accent,
        type: z.type,
        depthLayer: z.depthLayer,
        sortY: py + d / 2 + h,
      })
    }
  }
  return buildings
}

// ---- Vegetation generator ----
function generateTrees(rng: () => number, allBuildings: ResolvedBuilding[], zones: BuildZone[], extraCount: number): ResolvedTree[] {
  const trees: ResolvedTree[] = []
  const avoid = allBuildings.map(b => ({ x: b.cx, y: b.cy, r: Math.max(b.w, b.d) * 0.5 + 5 }))
  const avoidTree = (x: number, y: number) => avoid.some(a => Math.hypot(x - a.x, y - a.y) < a.r)

  for (const z of zones) {
    const count = Math.round((z.rx * z.ry) / 180)
    for (let i = 0; i < count; i++) {
      for (let attempt = 0; attempt < 20; attempt++) {
        const a = rng() * Math.PI * 2
        const r = Math.sqrt(rng()) * Math.min(z.rx, z.ry) * 0.85
        const px = z.cx + Math.cos(a) * r * (z.rx / Math.min(z.rx, z.ry))
        const py = z.cy + Math.sin(a) * r
        if (avoidTree(px, py)) continue
        const isPalm = rng() > 0.5
        trees.push({
          cx: px, cy: py,
          canopyR: rngRange(rng, isPalm ? 4 : 5, isPalm ? 7 : 11),
          canopyColor: pick(rng, isPalm ? PALETTE.VEGETATION.palmCanopy : PALETTE.VEGETATION.shrub),
          trunkColor: isPalm ? PALETTE.VEGETATION.palmTrunk : '#7A6A4A',
          isPalm,
          sortY: py + (isPalm ? 5 : 10),
        })
        break
      }
    }
  }

  // Extra random trees scattered across the scene
  for (let i = 0; i < extraCount; i++) {
    for (let attempt = 0; attempt < 20; attempt++) {
      const px = rngRange(rng, 10, 500)
      const py = rngRange(rng, 10, 350)
      if (avoidTree(px, py)) continue
      trees.push({
        cx: px, cy: py,
        canopyR: rngRange(rng, 4, 10),
        canopyColor: pick(rng, PALETTE.VEGETATION.shrub),
        trunkColor: '#7A6A4A',
        isPalm: false,
        sortY: py + 8,
      })
      break
    }
  }
  return trees
}

// ---- Mangroves (clustered coastal patches with gaps) ----
function generateMangroves(rng: () => number): ResolvedTree[] {
  const mangroves: ResolvedTree[] = []
  const clusterCenters: [number, number, number][] = [
    // Mainland south coast — clusters with gaps between
    [50, 150, 5], [78, 153, 4], [110, 156, 5], [140, 160, 3],
    [175, 162, 5], [210, 165, 4], [250, 164, 5], [290, 161, 3],
    [330, 157, 5], [365, 153, 4], [400, 150, 4], [435, 148, 3],
    // Lagos Island north edge
    [85, 197, 3], [105, 194, 4], [130, 195, 3], [155, 193, 4],
    // Victoria Island north edge
    [245, 190, 4], [280, 188, 3], [320, 186, 4], [355, 184, 3],
    // Makoko edges
    [192, 212, 3], [238, 214, 3],
    // Lekki north shore
    [130, 263, 4], [165, 261, 3], [200, 260, 4], [240, 261, 3], [280, 263, 3],
  ]
  for (const [cx, cy, radius] of clusterCenters) {
    const count = rngInt(rng, 3, 2 * Math.round(radius))
    for (let i = 0; i < count; i++) {
      const angle = rng() * Math.PI * 2
      const r = Math.sqrt(rng()) * radius
      const px = cx + Math.cos(angle) * r * 1.5 + rngRange(rng, -1, 1)
      const py = cy + Math.sin(angle) * r + rngRange(rng, -1, 1)
      mangroves.push({
        cx: px, cy: py,
        canopyR: rngRange(rng, 2, 4.5),
        canopyColor: pick(rng, ['#2D5A27', '#1E3A1A', '#3A6A30']),
        trunkColor: '#5A4030',
        isPalm: false,
        isMangrove: true,
        sortY: py + 3,
      })
    }
  }
  return mangroves
}

// ---- Roadside tree rows ----
function generateRoadsideTrees(rng: () => number, roads: ResolvedRoad[]): ResolvedTree[] {
  const trees: ResolvedTree[] = []
  for (const r of roads.filter(rr => rr.level === 'primary')) {
    for (let i = 0; i < r.points.length; i += 2) {
      const [x, y] = r.points[i]
      const side = (i % 4 < 2) ? -1 : 1
      const px = x + side * (r.w + rngRange(rng, 3, 6))
      const py = y + rngRange(rng, -1, 1)
      if (rng() > 0.6) continue
      trees.push({
        cx: px, cy: py,
        canopyR: rngRange(rng, 3, 6),
        canopyColor: pick(rng, ['#6B8E5A', '#5E7D4A', '#7AA06A']),
        trunkColor: '#7A6A4A',
        isPalm: false,
        isMangrove: false,
        sortY: py + 6,
      })
    }
  }
  return trees
}

// ---- Roads ----
function bezierPoints(x1: number, y1: number, cx: number, cy: number, x2: number, y2: number, steps: number): [number, number][] {
  const pts: [number, number][] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const px = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * cx + t * t * x2
    const py = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * cy + t * t * y2
    pts.push([Math.round(px), Math.round(py)])
  }
  return pts
}

function generateRoadHierarchy(rng: () => number, zones: BuildZone[]): ResolvedRoad[] {
  const roads: ResolvedRoad[] = []
  const zoneMap = new Map(zones.map(z => [z.districtKey, z]))

  // Arterial road: Lagos-Badagry Expressway (east-west across mainland)
  const arterialPts: [number, number][] = []
  for (let i = 0; i <= 24; i++) {
    const t = i / 24
    const x = 15 + t * 470
    const y = 92 + Math.sin(t * Math.PI * 1.5) * 4
    arterialPts.push([Math.round(x), Math.round(y)])
  }
  roads.push({ points: arterialPts, w: 20, level: 'primary', sortY: 95 })

  // Ring road (roughly follows mainland shoreline)
  const ringPoints: [number, number][] = [
    [20, 48], [60, 20], [140, 15], [240, 18], [340, 15], [440, 22],
    [470, 40], [460, 70], [470, 100], [445, 130], [420, 145],
    [370, 150], [320, 158], [270, 162], [220, 160], [170, 156],
    [120, 150], [70, 148], [35, 140], [20, 115], [22, 80],
    [18, 60],
  ]
  roads.push({ points: ringPoints, w: 14, level: 'primary', sortY: 95 })

  // Primary roads: connect major district centers with slight curves
  const primary: [string, string, number, number][] = [
    ['alimosho', 'oshodi', 100, 95],
    ['oshodi', 'surulere', 230, 95],
    ['oshodi', 'lagosIsland', 150, 145],
    ['lagosIsland', 'victoriaIsland', 200, 215],
    ['victoriaIsland', 'lekki', 280, 250],
  ]
  for (const [k1, k2, cx, cy] of primary) {
    const z1 = zoneMap.get(k1)
    const z2 = zoneMap.get(k2)
    if (!z1 || !z2) continue
    const pts = bezierPoints(z1.cx, z1.cy, cx, cy, z2.cx, z2.cy, 16)
    roads.push({ points: pts, w: 13, level: 'primary', sortY: (z1.cy + z2.cy) / 2 })
  }

  // Secondary roads: feed into districts
  const secondary: [string, string][] = [
    ['oshodi', 'periphery'],
    ['alimosho', 'lagosIsland'],
    ['surulere', 'victoriaIsland'],
    ['lagosIsland', 'lekki'],
    ['alimosho', 'ringway'],
    ['surulere', 'ringway'],
    ['oshodi', 'ringway'],
  ]
  for (const [k1, k2] of secondary) {
    const z1 = zoneMap.get(k1)
    if (!z1) continue
    let mcx: number, mcy: number
    if (k2 === 'ringway') {
      const nearest = ringPoints.reduce((best, pt) => {
        const dist = Math.hypot(pt[0] - z1.cx, pt[1] - z1.cy)
        return dist < best.dist ? { pt, dist } : best
      }, { pt: ringPoints[0], dist: Infinity })
      mcx = (z1.cx + nearest.pt[0]) / 2 + rngRange(rng, -10, 10)
      mcy = (z1.cy + nearest.pt[1]) / 2 + rngRange(rng, -8, 8)
      const pts = bezierPoints(z1.cx, z1.cy, mcx, mcy, nearest.pt[0], nearest.pt[1], 10)
      roads.push({ points: pts, w: 5, level: 'secondary', sortY: (z1.cy + nearest.pt[1]) / 2 })
      continue
    }
    const z2 = zoneMap.get(k2)
    if (!z2) continue
    mcx = (z1.cx + z2.cx) / 2 + rngRange(rng, -20, 20)
    mcy = (z1.cy + z2.cy) / 2 + rngRange(rng, -15, 15)
    const pts = bezierPoints(z1.cx, z1.cy, mcx, mcy, z2.cx, z2.cy, 10)
    roads.push({ points: pts, w: 5, level: 'secondary', sortY: (z1.cy + z2.cy) / 2 })
  }

  // Secondary: cross-streets connecting major roads
  const crossStreets = [
    [90, 65, 90, 145],
    [235, 65, 235, 150],
    [370, 65, 370, 145],
    [160, 60, 160, 140],
    [305, 65, 305, 145],
  ]
  for (const [x, y1, , y2] of crossStreets) {
    const pts: [number, number][] = [[x, y1], [x, y2]]
    roads.push({ points: pts, w: 5, level: 'secondary', sortY: (y1 + y2) / 2 })
  }

  // Local roads: grid within each zone
  for (const z of zones) {
    const countH = Math.round(z.rx / 20)
    const countV = Math.round(z.ry / 16)
    for (let i = 1; i < countH; i++) {
      const x = z.cx - z.rx + i * (2 * z.rx / countH)
      const pts: [number, number][] = [
        [x, z.cy - z.ry * 0.85],
        [x, z.cy + z.ry * 0.85],
      ]
      roads.push({ points: pts, w: 2, level: 'local', sortY: z.cy })
    }
    for (let i = 1; i < countV; i++) {
      const y = z.cy - z.ry + i * (2 * z.ry / countV)
      const pts: [number, number][] = [
        [z.cx - z.rx * 0.85, y],
        [z.cx + z.rx * 0.85, y],
      ]
      roads.push({ points: pts, w: 2, level: 'local', sortY: y })
    }
  }

  return roads
}

// ---- Vehicles ----
function generateVehicles(rng: () => number, roads: ResolvedRoad[]): ResolvedVehicle[] {
  const vehicles: ResolvedVehicle[] = []
  const dense = roads.filter(r => r.level === 'primary')
  const medium = roads.filter(r => r.level === 'secondary')

  for (const r of dense) {
    const count = rngInt(rng, 4, 8)
    for (let i = 0; i < count; i++) {
      const t = rng()
      const idx = Math.floor(t * (r.points.length - 1))
      const f = t * (r.points.length - 1) - idx
      const p1 = r.points[idx], p2 = r.points[Math.min(idx + 1, r.points.length - 1)]
      const cx = lerp(p1[0], p2[0], f)
      const cy = lerp(p1[1], p2[1], f)
      const dx = p2[0] - p1[0], dy = p2[1] - p1[1]
      const rot = Math.atan2(dy, dx)
      const rv = rng()
      if (rv < 0.35) {
        vehicles.push({ cx, cy, color: PALETTE.VEHICLES.danfo, accentColor: PALETTE.VEHICLES.danfoAccent, w: 5.5, h: 3, isBRT: false, rot, sortY: cy })
      } else if (rv < 0.55) {
        vehicles.push({ cx, cy, color: PALETTE.VEHICLES.brt, accentColor: PALETTE.VEHICLES.brtAccent, w: 7, h: 3.5, isBRT: true, rot, sortY: cy })
      } else if (rv < 0.7) {
        vehicles.push({ cx, cy, color: PALETTE.VEHICLES.taxi, accentColor: PALETTE.VEHICLES.taxi, w: 4.5, h: 2.5, isBRT: false, rot, sortY: cy })
      } else {
        vehicles.push({ cx, cy, color: pick(rng, PALETTE.VEHICLES.car), accentColor: pick(rng, PALETTE.VEHICLES.car), w: 4, h: 2.2, isBRT: false, rot, sortY: cy })
      }
    }
  }

  for (const r of medium) {
    const count = rngInt(rng, 2, 4)
    for (let i = 0; i < count; i++) {
      const t = rng()
      const idx = Math.floor(t * (r.points.length - 1))
      const f = t * (r.points.length - 1) - idx
      const p1 = r.points[idx], p2 = r.points[Math.min(idx + 1, r.points.length - 1)]
      const cx = lerp(p1[0], p2[0], f)
      const cy = lerp(p1[1], p2[1], f)
      const rot = Math.atan2(p2[1] - p1[1], p2[0] - p1[0])
      if (rng() > 0.4) {
        vehicles.push({ cx, cy, color: pick(rng, PALETTE.VEHICLES.car), accentColor: pick(rng, PALETTE.VEHICLES.car), w: 3, h: 1.8, isBRT: false, rot, sortY: cy })
      } else {
        vehicles.push({ cx, cy, color: pick(rng, PALETTE.VEHICLES.motorcycle), accentColor: pick(rng, PALETTE.VEHICLES.motorcycle), w: 2, h: 1.2, isBRT: false, rot, sortY: cy })
      }
    }
  }
  return vehicles
}

// ---- Boats ----
function generateBoats(rng: () => number): ResolvedBoat[] {
  const spots: [number, number, string][] = [
    // Mainland-to-island lagoon channel
    [90, 180, 'ferry'], [120, 188, 'canoe'], [145, 178, 'ferry'],
    [175, 195, 'canoe'], [210, 190, 'cargo'], [240, 192, 'canoe'],
    [275, 185, 'ferry'], [310, 188, 'canoe'], [345, 182, 'cargo'],
    [155, 210, 'canoe'], [190, 215, 'ferry'], [260, 215, 'canoe'],
    [135, 225, 'cargo'], [290, 225, 'canoe'], [170, 240, 'canoe'],
    // Makoko water channels
    [198, 212, 'canoe'], [208, 220, 'canoe'], [215, 224, 'canoe'],
    [222, 218, 'canoe'], [228, 226, 'canoe'], [202, 230, 'canoe'],
    [224, 232, 'canoe'], [210, 234, 'canoe'],
    // Makoko moorings (clustered)
    [205, 240, 'canoe'], [215, 238, 'canoe'], [220, 240, 'canoe'],
    // Lagos Island waterfront (ferries at terminals)
    [118, 248, 'ferry'], [138, 245, 'ferry'], [158, 248, 'ferry'],
    [125, 252, 'cargo'], [150, 255, 'cargo'],
    // Victoria Island marina
    [290, 235, 'ferry'], [310, 238, 'canoe'], [330, 235, 'ferry'],
    [345, 240, 'cargo'], [370, 238, 'canoe'],
    // Lekki shore
    [120, 260, 'ferry'], [200, 255, 'canoe'], [280, 250, 'cargo'],
    [145, 290, 'canoe'], [230, 280, 'ferry'], [310, 285, 'canoe'],
    // Atlantic (south)
    [100, 310, 'cargo'], [180, 305, 'canoe'], [260, 310, 'ferry'],
    [320, 305, 'cargo'], [140, 320, 'canoe'], [220, 325, 'ferry'],
    // Speedboats
    [165, 205, 'speedboat'], [250, 220, 'speedboat'], [195, 225, 'speedboat'],
    [325, 218, 'speedboat'], [140, 232, 'speedboat'],
    // More ferries in the lagoon channel
    [75, 185, 'ferry'], [105, 192, 'ferry'], [160, 200, 'ferry'],
    [220, 195, 'ferry'], [295, 195, 'ferry'],
    // More canoes near Makoko + mainland
    [185, 205, 'canoe'], [195, 218, 'canoe'], [225, 220, 'canoe'],
    [235, 230, 'canoe'], [172, 192, 'canoe'], [255, 205, 'canoe'],
    // Cargo boats near jetties
    [110, 254, 'cargo'], [145, 252, 'cargo'], [280, 242, 'cargo'],
    // Speedboats at marinas
    [300, 232, 'speedboat'], [340, 228, 'speedboat'],
  ]
  const boats: ResolvedBoat[] = []
  for (const [cx, cy, type] of spots) {
    const w = type === 'ferry' ? 9 : type === 'cargo' ? 7 : type === 'speedboat' ? 5 : 3.5
    const h = type === 'ferry' ? 3 : type === 'cargo' ? 2.5 : type === 'speedboat' ? 2 : 1.5
    const hull = type === 'ferry' ? PALETTE.BOATS.ferry : type === 'cargo' ? PALETTE.BOATS.cargo : type === 'speedboat' ? '#D05030' : PALETTE.BOATS.canoe
    const accent = type === 'ferry' ? PALETTE.BOATS.ferryAccent : type === 'cargo' ? PALETTE.BOATS.cargoAccent : type === 'speedboat' ? '#F0F0F0' : PALETTE.BOATS.canoe
    boats.push({
      cx, cy, w, h, hullColor: hull, accentColor: accent,
      type: type as 'ferry' | 'canoe' | 'cargo' | 'speedboat',
      rot: rngRange(rng, -0.15, 0.15),
      sortY: cy + h,
    })
  }
  return boats
}

// ---- Market stalls ----
function generateMarketStalls(rng: () => number, zone: BuildZone): ResolvedMarketStall[] {
  const stalls: ResolvedMarketStall[] = []
  for (let x = zone.cx - zone.rx * 0.7; x < zone.cx + zone.rx * 0.7; x += 3.5) {
    for (let y = zone.cy - zone.ry * 0.6; y < zone.cy + zone.ry * 0.6; y += 3) {
      if (rng() > 0.55) continue
      const px = x + rngRange(rng, -2, 2)
      const py = y + rngRange(rng, -2, 2)
      if (!pointInEllipse(px, py, zone.cx, zone.cy, zone.rx, zone.ry)) continue
      const sizeMul = rngRange(rng, 0.6, 1.4)
      stalls.push({
        cx: px, cy: py,
        canopyColor: pick(rng, [...PALETTE.MARKET.canopies, '#D04040', '#E07030', '#40A0C0', '#D0B030']),
        w: rngRange(rng, 2.5, 5.5) * sizeMul,
        h: rngRange(rng, 2, 4.5) * sizeMul,
        sortY: py + 3,
      })
    }
  }
  return stalls
}

// ---- Bridges ----
function buildBridge(x1: number, y1: number, x2: number, y2: number, w: number, type: 'cable' | 'suspension' | 'simple'): ResolvedBridge {
  return { x1, y1, x2, y2, w, type, sortY: (y1 + y2) / 2 }
}

// ---- Streetlights ----
function generateStreetlights(rng: () => number, roads: ResolvedRoad[]): ResolvedStreetlight[] {
  const lights: ResolvedStreetlight[] = []
  for (const r of roads.filter(rr => rr.level !== 'local')) {
    for (let i = 2; i < r.points.length - 1; i += 4) {
      const [x, y] = r.points[i]
      const offset = rngRange(rng, -3, 3)
      lights.push({ cx: x + offset, cy: y - 2, sortY: y })
    }
  }
  return lights
}

// ---- Billboards ----
function generateBillboards(rng: () => number, roads: ResolvedRoad[]): ResolvedBillboard[] {
  const boards: ResolvedBillboard[] = []
  const colors = ['#E07040', '#3A9BC8', '#D4A030', '#50B080', '#C060C0']
  for (const r of roads.filter(rr => rr.level === 'primary')) {
    for (let i = 3; i < r.points.length - 1; i += 6) {
      const [x, y] = r.points[i]
      boards.push({
        cx: x + rngRange(rng, -4, 4),
        cy: y - rngRange(rng, 4, 8),
        color: pick(rng, colors),
        sortY: y - 4,
      })
    }
  }
  return boards
}

// ---- Main generator ----
export function generateCityScene(seed: number): ResolvedScene {
  const rng = mulberry32(seed)

  // ---- Build zones (elliptical) ----
  const zones: BuildZone[] = [
    // Mainland: periphery (very sparse — urban fringe)
    { districtKey: 'periphery', cx: 250, cy: 35, rx: 230, ry: 38, type: 'residential', density: 0.60, gridW: 16, gridH: 12, minW: 4, maxW: 7, minD: 3, maxD: 5, minH: 3, maxH: 5, depthLayer: 0 },
    // Mainland: west (Alimosho — mid-density residential)
    { districtKey: 'alimosho', cx: 90, cy: 100, rx: 88, ry: 65, type: 'residential', density: 0.80, gridW: 10, gridH: 8, minW: 5, maxW: 7, minD: 3, maxD: 5, minH: 3, maxH: 8, depthLayer: 0 },
    // Mainland: center (Oshodi — mixed-use, higher)
    { districtKey: 'oshodi', cx: 235, cy: 105, rx: 82, ry: 65, type: 'mixedUse', density: 0.78, gridW: 10, gridH: 8, minW: 5, maxW: 8, minD: 4, maxD: 5, minH: 5, maxH: 14, depthLayer: 1 },
    // Mainland: east (Surulere — mixed-use)
    { districtKey: 'surulere', cx: 370, cy: 100, rx: 82, ry: 60, type: 'mixedUse', density: 0.75, gridW: 10, gridH: 8, minW: 5, maxW: 8, minD: 4, maxD: 5, minH: 5, maxH: 14, depthLayer: 0 },
    // Fill gap between Oshodi and Surulere
    { districtKey: 'surulere', cx: 305, cy: 105, rx: 25, ry: 55, type: 'mixedUse', density: 0.68, gridW: 10, gridH: 8, minW: 4, maxW: 7, minD: 3, maxD: 5, minH: 4, maxH: 10, depthLayer: 0 },
    // Fill gap between Alimosho and Periphery
    { districtKey: 'periphery', cx: 90, cy: 55, rx: 55, ry: 30, type: 'residential', density: 0.65, gridW: 7, gridH: 6, minW: 4, maxW: 7, minD: 3, maxD: 5, minH: 3, maxH: 6, depthLayer: 0 },
    // Industrial block between Alimosho and lagoon
    { districtKey: 'alimosho', cx: 160, cy: 140, rx: 32, ry: 20, type: 'residential', density: 0.70, gridW: 8, gridH: 7, minW: 6, maxW: 12, minD: 3, maxD: 5, minH: 2, maxH: 5, depthLayer: 0 },
    // Island: Lagos Island
    { districtKey: 'lagosIsland', cx: 135, cy: 218, rx: 48, ry: 32, type: 'mixedUse', density: 0.75, gridW: 8, gridH: 6, minW: 5, maxW: 7, minD: 4, maxD: 5, minH: 5, maxH: 12, depthLayer: 1 },
    // Island: Victoria Island (high-density business district)
    { districtKey: 'ikoyi', cx: 215, cy: 215, rx: 30, ry: 18, type: 'residential', density: 0.38, gridW: 15, gridH: 13, minW: 9, maxW: 20, minD: 7, maxD: 13, minH: 5, maxH: 14, depthLayer: 1 },
    { districtKey: 'victoriaIsland', cx: 310, cy: 212, rx: 72, ry: 48, type: 'glassTower', density: 0.75, gridW: 8, gridH: 6, minW: 7, maxW: 9, minD: 4, maxD: 5, minH: 22, maxH: 40, depthLayer: 1 },
    // Stilt: Makoko micro-zone West (spread further apart)
    { districtKey: 'makoko', cx: 192, cy: 228, rx: 10, ry: 8, type: 'stilt', density: 0.90, gridW: 4, gridH: 3, minW: 2, maxW: 5, minD: 2, maxD: 3, minH: 2, maxH: 4, depthLayer: 2 },
    // Stilt: Makoko micro-zone Center
    { districtKey: 'makoko', cx: 214, cy: 232, rx: 8, ry: 7, type: 'stilt', density: 0.88, gridW: 4, gridH: 3, minW: 2, maxW: 5, minD: 2, maxD: 3, minH: 2, maxH: 4, depthLayer: 2 },
    // Stilt: Makoko micro-zone North
    { districtKey: 'makoko', cx: 206, cy: 215, rx: 7, ry: 6, type: 'stilt', density: 0.85, gridW: 4, gridH: 3, minW: 2, maxW: 4, minD: 2, maxD: 3, minH: 2, maxH: 3, depthLayer: 2 },
    // Stilt: Makoko micro-zone East
    { districtKey: 'makoko', cx: 234, cy: 226, rx: 8, ry: 7, type: 'stilt', density: 0.90, gridW: 4, gridH: 3, minW: 2, maxW: 5, minD: 2, maxD: 3, minH: 2, maxH: 4, depthLayer: 2 },
    // South: Lekki
    { districtKey: 'lekki', cx: 230, cy: 298, rx: 85, ry: 32, type: 'mixedUse', density: 0.70, gridW: 12, gridH: 10, minW: 5, maxW: 8, minD: 4, maxD: 5, minH: 5, maxH: 14, depthLayer: 2 },
  ]

  // Dense cores (small tight zones for visual contrast)
  zones.push({
    districtKey: 'alimosho', cx: 85, cy: 100, rx: 28, ry: 22, type: 'residential', density: 0.85, gridW: 8, gridH: 6, minW: 4, maxW: 6, minD: 3, maxD: 5, minH: 5, maxH: 12, depthLayer: 0,
  })
  zones.push({
    districtKey: 'oshodi', cx: 235, cy: 105, rx: 20, ry: 18, type: 'mixedUse', density: 0.82, gridW: 9, gridH: 7, minW: 5, maxW: 8, minD: 4, maxD: 5, minH: 8, maxH: 18, depthLayer: 1,
  })
  zones.push({
    districtKey: 'surulere', cx: 370, cy: 100, rx: 18, ry: 16, type: 'mixedUse', density: 0.80, gridW: 9, gridH: 7, minW: 5, maxW: 7, minD: 4, maxD: 5, minH: 8, maxH: 16, depthLayer: 0,
  })
  zones.push({
    districtKey: 'victoriaIsland', cx: 310, cy: 210, rx: 28, ry: 22, type: 'glassTower', density: 0.85, gridW: 11, gridH: 8, minW: 8, maxW: 12, minD: 5, maxD: 7, minH: 38, maxH: 50, depthLayer: 1,
  })
  zones.push({
    districtKey: 'ekoAtlantic', cx: 362, cy: 214, rx: 24, ry: 18, type: 'glassTower', density: 0.65, gridW: 12, gridH: 9, minW: 6, maxW: 9, minD: 3, maxD: 5, minH: 12, maxH: 24, depthLayer: 1,
  })

  // ---- Generate buildings ----
  const allBuildings: ResolvedBuilding[] = []
  for (const z of zones) {
    let roofs: string[], walls: string[], shadows: string[], accent: string | undefined
    if (z.type === 'residential') {
      roofs = PALETTE.RESIDENTIAL.roofs; walls = PALETTE.RESIDENTIAL.walls; shadows = PALETTE.RESIDENTIAL.shadows; accent = undefined
    } else if (z.type === 'mixedUse') {
      roofs = PALETTE.MIXED_USE.roofs; walls = PALETTE.MIXED_USE.walls; shadows = PALETTE.MIXED_USE.shadows; accent = PALETTE.MIXED_USE.windowColor
    } else if (z.type === 'glassTower') {
      roofs = PALETTE.GLASS_TOWER.glass; walls = PALETTE.GLASS_TOWER.glass; shadows = PALETTE.GLASS_TOWER.glassShadow; accent = PALETTE.GLASS_TOWER.highlight
    } else {
      roofs = PALETTE.STILT.roofs; walls = PALETTE.STILT.walls; shadows = [PALETTE.STILT.wood]; accent = undefined
    }
    if (z.districtKey === 'ikoyi') {
      roofs = ['#C87860','#B86848','#D08070','#C07058','#BC6850','#C87060']
      walls = ['#F2EAD8','#EEE6CC','#F4EEE0','#F0E8D4','#EEEADC','#F2ECD8']
      shadows = ['#CEC0A0','#C4B898','#D0C4A4','#C8BAA0','#CCBEA4','#C8BAA2']
      accent = undefined
    }
    if (z.districtKey === 'lekki') {
      roofs = ['#D8D4C8','#D0CCB8','#E0DCC8','#D4D0BC','#DCDAC8','#D8D4C0']
      walls = ['#F2F0E8','#EEECD8','#F4F0E4','#F0EEE0','#F2EFDC','#EEECE0']
      shadows = ['#C8C4B8','#C4C0B0','#CCCAB8','#C8C4B4','#CACAB6','#C6C0AE']
      accent = undefined
    }
    allBuildings.push(...generateInZone(rng, z, roofs, walls, shadows, accent))
  }

  // Eko Atlantic supertall — Victoria Island hero building
  allBuildings.push({
    cx: 304, cy: 207,
    w: 16, d: 11, h: 65,
    roofColor: '#A0C8E8',
    wallColor: '#B0D4F0',
    shadowColor: '#6A8AAA',
    accentColor: '#E0F0FF',
    type: 'glassTower',
    depthLayer: 1,
    sortY: 207 + 3.5 + 50,
  })

  // ---- Roads ----
  const roads = generateRoadHierarchy(rng, zones)

  // ---- Trees + mangroves + roadside ----
  const allTrees = generateTrees(rng, allBuildings, zones, 25)
  const mangroves = generateMangroves(rng)
  const roadsideTrees = generateRoadsideTrees(rng, roads)
  allTrees.push(...mangroves, ...roadsideTrees)

  // ---- Bridges ----
  const bridges: ResolvedBridge[] = [
    // Third Mainland Bridge (iconic — wider + taller pylons)
    buildBridge(150, 158, 115, 208, 6.5, 'cable'),
    // Lekki-Ikoyi Bridge (hero suspension — wider)
    buildBridge(308, 180, 282, 265, 6, 'suspension'),
    // Carter Bridge (connecting Lagos Island to mainland west)
    buildBridge(68, 188, 78, 148, 5, 'simple'),
    // Victoria Island link
    buildBridge(195, 170, 255, 195, 5, 'cable'),
    // Makoko boardwalk (pedestrian)
    buildBridge(182, 192, 200, 220, 2.5, 'simple'),
    // Bridge to Lekki
    buildBridge(190, 252, 175, 270, 4, 'simple'),
  ]

  // ---- Walkways (Makoko boardwalks) ----
  const walkways: ResolvedWalkway[] = [
    { points: [[192, 228], [206, 215], [214, 232]], sortY: 220 },
    { points: [[214, 232], [234, 226]], sortY: 232 },
    { points: [[192, 228], [186, 222]], sortY: 226 },
    { points: [[206, 215], [202, 210]], sortY: 214 },
    { points: [[214, 232], [220, 234]], sortY: 232 },
    { points: [[234, 226], [240, 220]], sortY: 226 },
  ]

  // ---- Vehicles ----
  const vehicles = generateVehicles(rng, roads)
  // Market loading trucks near Lagos Island market
  for (const [tx, ty] of [[108, 242], [130, 245], [155, 242]]) {
    vehicles.push({
      cx: tx, cy: ty, color: '#807060', accentColor: '#605040',
      w: 6, h: 3, isBRT: false, rot: 0, sortY: ty,
    })
  }

  // ---- Boats ----
  const boats = generateBoats(rng)

  // ---- Market stalls ----
  const marketZoneLagos = zones.find(z => z.districtKey === 'lagosIsland')!
  const marketStalls = generateMarketStalls(rng, marketZoneLagos)
  const oshodiZone = zones.find(z => z.districtKey === 'oshodi')
  if (oshodiZone) marketStalls.push(...generateMarketStalls(rng, { ...oshodiZone, cx: 235, cy: 105, rx: 25, ry: 20 }))

  // Market zones for high-density patchwork renderer
  const marketZones: ResolvedMarketZone[] = [
    { cx: 128, cy: 220, rx: 28, ry: 16 },  // Balogun / Lagos Island
    { cx: 235, cy: 105, rx: 24, ry: 18 },   // Tejuosho / Oshodi
  ]

  // ---- Pins — one per unique district zone ----
  const seen = new Set<string>()
  const pins: ResolvedPin[] = []
  const pinColors = PALETTE.PINS.colors
  let pinIdx = 0
  for (const z of zones) {
    if (seen.has(z.districtKey)) continue
    seen.add(z.districtKey)
    pins.push({
      cx: z.cx,
      cy: z.cy - 18,
      color: pinColors[pinIdx % pinColors.length],
      sortY: z.cy + 8,
    })
    pinIdx++
  }

  // ---- Streetlights and billboards ----
  const streetlights = generateStreetlights(rng, roads)
  const billboards = generateBillboards(rng, roads)

  // ---- Organic landmasses ----
  const mainlandRaw: [number, number][] = [
    [5, 5], [60, 3], [120, 7], [180, 4], [250, 6], [320, 3], [390, 5], [460, 4],
    [485, 15],
    [475, 35],
    [490, 55],
    [460, 72],
    [478, 92],
    [445, 108],
    [460, 128],
    [425, 140],
    [445, 155],
    [405, 165],
    [380, 152],
    [350, 168],
    [325, 155],
    [295, 170],
    [270, 158],
    [240, 168],
    [215, 155],
    [190, 165],
    [165, 152],
    [140, 162],
    [110, 150],
    [85, 160],
    [60, 148],
    [35, 158],
    [15, 142],
    [8, 118],
    [20, 95],
    [6, 70],
    [18, 48],
    [4, 25],
  ]
  const mainlandPts = perturbPolygon(mainlandRaw, 7, 2, rng)

  const lagosRaw: [number, number][] = [
    [68, 198], [92, 190], [120, 195], [155, 190], [185, 196],
    [195, 210], [188, 228], [165, 242], [130, 250], [98, 240],
    [78, 225], [65, 210],
  ]
  const lagosPts = perturbPolygon(lagosRaw, 5, 1, rng)

  const vicRaw: [number, number][] = [
    [220, 192], [260, 186], [305, 188], [345, 182], [385, 190],
    [398, 206], [388, 224], [355, 240], [310, 248], [268, 240],
    [238, 225], [222, 210],
  ]
  const vicPts = perturbPolygon(vicRaw, 5, 1, rng)

  const mkWest: [number, number][] = [
    [186, 222], [198, 218], [204, 224], [200, 234], [186, 236],
  ]
  const mkCenter: [number, number][] = [
    [210, 226], [222, 222], [228, 228], [222, 238], [208, 236],
  ]
  const mkNorth: [number, number][] = [
    [202, 210], [212, 206], [216, 212], [210, 218], [202, 216],
  ]
  const mkEast: [number, number][] = [
    [230, 218], [240, 214], [246, 222], [240, 232], [228, 230],
  ]
  const mkWestPts = perturbPolygon(mkWest, 2, 1, rng)
  const mkCenterPts = perturbPolygon(mkCenter, 2, 1, rng)
  const mkNorthPts = perturbPolygon(mkNorth, 2, 1, rng)
  const mkEastPts = perturbPolygon(mkEast, 2, 1, rng)

  const lekkiRaw: [number, number][] = [
    [105, 268], [155, 260], [210, 264], [260, 260], [310, 265],
    [350, 262], [362, 278], [348, 300], [310, 318], [260, 328],
    [200, 330], [155, 315], [118, 298], [102, 282],
  ]
  const lekkiPts = perturbPolygon(lekkiRaw, 6, 1, rng)

  const landmasses: ResolvedLandmass[] = [
    { points: mainlandPts, color: '#EADDCD', isIsland: false, sortY: 180 },
    { points: lagosPts, color: '#E8DCC4', isIsland: true, sortY: 255 },
    { points: vicPts, color: '#E8DCC4', isIsland: true, sortY: 255 },
    { points: mkWestPts, color: '#C8B898', isIsland: true, sortY: 236 },
    { points: mkCenterPts, color: '#C8B898', isIsland: true, sortY: 238 },
    { points: mkNorthPts, color: '#C8B898', isIsland: true, sortY: 224 },
    { points: mkEastPts, color: '#C8B898', isIsland: true, sortY: 234 },
    { points: lekkiPts, color: '#EADDCD', isIsland: false, sortY: 340 },
  ]

  allBuildings.sort((a, b) => a.sortY - b.sortY)
  allTrees.sort((a, b) => a.sortY - b.sortY)

  return {
    seed,
    landmasses,
    roads,
    bridges,
    buildings: allBuildings,
    trees: allTrees,
    marketStalls,
    marketZones,
    vehicles,
    boats,
    pins,
    streetlights,
    billboards,
    walkways,
  }
}
