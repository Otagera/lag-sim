export interface Point {
  x: number
  y: number
}

export interface JourneyAnchor extends Point {
  /** null for the start anchor; otherwise the target index this waypoint represents */
  targetIndex: number | null
}

export interface JourneySegment {
  p0: Point
  p1: Point
  p2: Point
  p3: Point
}

const VIEWPORT_WIDTH = 900
const VIEWPORT_HEIGHT = 220
const START_X = 60
const END_X = 840
const CENTER_Y = 130
const Y_WOBBLE = 20

export const JOURNEY_VIEWBOX = { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT }

// One start anchor plus one anchor per target, evenly spaced, alternating a
// small y-offset so the road reads as a route rather than a straight bar.
export function computeAnchors(targetCount: number): JourneyAnchor[] {
  const anchors: JourneyAnchor[] = [{ x: START_X, y: CENTER_Y, targetIndex: null }]
  for (let i = 0; i < targetCount; i++) {
    const x = START_X + ((i + 1) * (END_X - START_X)) / targetCount
    const y = CENTER_Y + (i % 2 === 0 ? -Y_WOBBLE : Y_WOBBLE)
    anchors.push({ x, y, targetIndex: i })
  }
  return anchors
}

// Control points offset by a fraction of dx/dy from each endpoint (not
// pinned to fixed tangents) so the curve's direction — and anything that
// orients off its tangent (the traveler marker, arrowheads) — responds to
// the segment's actual slope. Same technique as buildTreePath in the
// research graph prototype.
export function buildJourneySegment(p0: Point, p3: Point): JourneySegment {
  const dx = p3.x - p0.x
  const dy = p3.y - p0.y
  const p1: Point = { x: p0.x + dx * 0.35, y: p0.y + dy * 0.15 }
  const p2: Point = { x: p3.x - dx * 0.35, y: p3.y - dy * 0.15 }
  return { p0, p1, p2, p3 }
}

export function segmentPath(seg: JourneySegment): string {
  return `M ${seg.p0.x} ${seg.p0.y} C ${seg.p1.x} ${seg.p1.y}, ${seg.p2.x} ${seg.p2.y}, ${seg.p3.x} ${seg.p3.y}`
}

function cubicAt(a: number, b: number, c: number, d: number, t: number): number {
  const mt = 1 - t
  return mt ** 3 * a + 3 * mt ** 2 * t * b + 3 * mt * t ** 2 * c + t ** 3 * d
}

export function bezierPoint(seg: JourneySegment, t: number): Point {
  return {
    x: cubicAt(seg.p0.x, seg.p1.x, seg.p2.x, seg.p3.x, t),
    y: cubicAt(seg.p0.y, seg.p1.y, seg.p2.y, seg.p3.y, t),
  }
}

function cubicDerivativeAt(a: number, b: number, c: number, d: number, t: number): number {
  const mt = 1 - t
  return 3 * mt ** 2 * (b - a) + 6 * mt * t * (c - b) + 3 * t ** 2 * (d - c)
}

export function bezierTangentAngleDeg(seg: JourneySegment, t: number): number {
  const dx = cubicDerivativeAt(seg.p0.x, seg.p1.x, seg.p2.x, seg.p3.x, t)
  const dy = cubicDerivativeAt(seg.p0.y, seg.p1.y, seg.p2.y, seg.p3.y, t)
  return (Math.atan2(dy, dx) * 180) / Math.PI
}

// Traveler position: sequential, not averaged. The traveler travels toward
// whichever target is the first *not yet met* one (segments[i] leads from
// the previous waypoint to target i's own waypoint), at that target's own
// progress fraction — so it only advances past a waypoint once that target
// actually hits 100%, instead of drifting ahead on a blended average that
// looks like it skipped an unfinished step.
export function travelerPosition(
  segments: JourneySegment[],
  targetProgress: number[],
): { point: Point; angleDeg: number } {
  if (segments.length === 0) return { point: { x: START_X, y: CENTER_Y }, angleDeg: 0 }
  let segIndex = segments.length - 1
  let segT = 1
  for (let i = 0; i < targetProgress.length && i < segments.length; i++) {
    if (targetProgress[i] < 1) {
      segIndex = i
      segT = Math.max(0, Math.min(1, targetProgress[i]))
      break
    }
  }
  const seg = segments[segIndex]
  return { point: bezierPoint(seg, segT), angleDeg: bezierTangentAngleDeg(seg, segT) }
}

// Lane-marker dashes sampled at fixed steps along each segment (arc-length
// isn't computed exactly — sampling by t is a close enough approximation for
// short, gently-curved segments like these).
export function sampleLaneMarkers(seg: JourneySegment, count: number): Point[] {
  const points: Point[] = []
  for (let i = 0; i < count; i++) {
    const t = (i + 0.5) / count
    points.push(bezierPoint(seg, t))
  }
  return points
}
