import type { CSSProperties, ReactNode } from 'react'

export type WatermarkPlacement =
  | 'center'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'

interface WatermarkLayerProps {
  children: ReactNode
  opacity?: number
  rotationDeg?: number
  tile?: boolean
  tileCount?: number
  /** Offset into the ring of 8 non-center grid cells to start placing tiles
   *  from (0-7). The grid's center cell is never used — it belongs to the
   *  centered seal, and a tile there would land on top of it. Callers that
   *  both tile (e.g. two different party logos at once) must still use
   *  non-overlapping ranges or their tiles stack on identical positions. */
  startCell?: number
  /** Where a non-tiled mark sits. Only one caller should use 'center' at a
   *  time — two centered marks superimpose into one illegible jumble. */
  placement?: WatermarkPlacement
  zIndex?: number
}

const GRID_COLS = 3

// Tile positions skip the center cell (index 4) so tiled marks ring the
// centered seal instead of crossing through it.
const TILE_CELLS = [0, 1, 2, 3, 5, 6, 7, 8]

const PLACEMENT_STYLES: Record<WatermarkPlacement, CSSProperties> = {
  center: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
  'top-left': { top: '4%', left: '3%' },
  'top-right': { top: '4%', right: '3%' },
  'bottom-left': { bottom: '4%', left: '3%' },
  'bottom-right': { bottom: '4%', right: '3%' },
}

// Generalizes the layering convention already established by
// ElectionWatermark.tsx (pointer-events:none, low opacity, optional rotation)
// so any SVG mark can be dropped in as a faint underlay. Uses `absolute`
// (against a relatively-positioned parent) rather than ElectionWatermark's
// own `fixed`/full-viewport approach — this prototype demos the watermark
// contained within a panel, and `fixed` gets force-converted to `relative`
// inside Style Lab's `.sl-tab-section` override CSS, which wouldn't actually
// fill the container the way `inset: 0` intends.
export function WatermarkLayer({
  children,
  opacity = 0.035,
  rotationDeg = 0,
  tile = false,
  tileCount = 6,
  startCell = 0,
  placement = 'center',
  zIndex = 1,
}: WatermarkLayerProps) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex,
        pointerEvents: 'none',
        overflow: 'hidden',
        opacity,
        transform: `rotate(${rotationDeg}deg)`,
      }}
    >
      {tile ? (
        Array.from({ length: Math.min(tileCount, TILE_CELLS.length) }).map((_, i) => {
          const cell = TILE_CELLS[(startCell + i) % TILE_CELLS.length]
          const row = Math.floor(cell / GRID_COLS)
          const col = cell % GRID_COLS
          return (
            <div
              key={`tile-${cell}`}
              style={{
                position: 'absolute',
                top: `${8 + row * 30}%`,
                left: `${8 + col * 30}%`,
              }}
            >
              {children}
            </div>
          )
        })
      ) : (
        <div style={{ position: 'absolute', ...PLACEMENT_STYLES[placement] }}>{children}</div>
      )}
    </div>
  )
}
