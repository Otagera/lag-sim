export const TILE_W = 8 // iso tile width in px
export const TILE_H = 4 // always TILE_W / 2 for 2:1 iso
export const FLOOR_H = 5 // px per building floor — 5 gives towers more vertical drama

export function isoToScreen(
  a: number,
  b: number,
  originX: number,
  originY: number,
): { x: number; y: number } {
  return {
    x: originX + (a - b) * (TILE_W / 2),
    y: originY + (a + b) * (TILE_H / 2),
  }
}

// For painting buildings back-to-front (painters' algorithm):
// buildings with lower a+b are further away and should be drawn first.
export function sortByDepth<T extends { a: number; b: number }>(items: T[]): T[] {
  return items.slice().sort((x, y) => x.a + x.b - (y.a + y.b))
}

// Returns the screen bounding box of the full iso grid.
export function gridBounds(aMax: number, bMax: number, originX: number, originY: number) {
  const topLeft = isoToScreen(0, 0, originX, originY)
  const topRight = isoToScreen(0, bMax, originX, originY)
  const bottomLeft = isoToScreen(aMax, 0, originX, originY)
  const bottomRight = isoToScreen(aMax, bMax, originX, originY)

  return {
    minX: Math.min(topLeft.x, topRight.x, bottomLeft.x, bottomRight.x),
    maxX: Math.max(topLeft.x, topRight.x, bottomLeft.x, bottomRight.x),
    minY: Math.min(topLeft.y, topRight.y, bottomLeft.y, bottomRight.y),
    maxY: Math.max(topLeft.y, topRight.y, bottomLeft.y, bottomRight.y),
  }
}
