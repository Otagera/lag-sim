// Layer 2 — LGA boundary outlines (replaces old zone rectangles)
// Draws the projected LGA polygon edges as subtle white boundaries.
// This makes the 20 LGA shapes visible and connects the map to the polling panel.

import { Container, Graphics } from 'pixi.js'
import type { MapLayer } from '../types'
import type { MapState } from '../../../state/mapSelectors'
import { isoToScreen } from '../projection'
import { getLGAGeometry } from '../geoProjection'

export function createRoadsLayer(): MapLayer {
  const container = new Container()
  const g = new Graphics()
  container.addChild(g)

  return {
    container,
    init(_state: MapState, _w: number, _h: number) {
      const ox = _w / 2 - 10
      const oy = (_h - 324) / 2 + 4
      g.clear()

      const lgas = getLGAGeometry()
      for (const lga of lgas) {
        const pts = lga.isoPolygon.map(([a, b]) => isoToScreen(a, b, ox, oy))
        g.poly(pts.flatMap(p => [p.x, p.y]))
          .stroke({ color: 0x2a3a5a, width: 0.8, alpha: 0.30 })
      }
    },
    update() {},
    destroy() { container.destroy({ children: true }) },
  }
}
