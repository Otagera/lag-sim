// Layer 5 — LGA labels: name + approval on hover.
// Hit targets at each LGA centroid reveal a faint label on pointer-over.

import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import type { MapLayer } from '../types'
import type { MapState } from '../../../state/mapSelectors'
import { isoToScreen } from '../projection'
import { getLGAGeometry } from '../geoProjection'

const LABEL_STYLE = new TextStyle({
  fontFamily: 'Archivo Narrow, sans-serif',
  fontSize: 10,
  fill: 0xaabbcc,
  letterSpacing: 0.5,
})

export function createLabelsLayer(): MapLayer {
  const container = new Container()
  container.eventMode = 'static'
  container.sortableChildren = true

  let _ox = 0, _oy = 0
  let _activeLabel: Text | null = null
  let _activeValue: Text | null = null

  function buildHitTargets() {
    const lgas = getLGAGeometry()
    for (const lga of lgas) {
      const { x, y } = isoToScreen(lga.centroid[0], lga.centroid[1], _ox, _oy)

      // Invisible hit circle for hover detection
      const hit = new Graphics()
      hit.circle(x, y, 18).fill({ color: 0xffffff, alpha: 0 })
      hit.eventMode = 'static'
      hit.cursor = 'pointer'

      // Store LGA data on the graphics object
      hit.label = lga.name

      hit.on('pointerover', () => {
        showLabel(lga.name, x, y)
      })
      hit.on('pointerout', () => {
        hideLabel()
      })

      container.addChild(hit)
    }
  }

  function showLabel(name: string, cx: number, cy: number) {
    hideLabel()

    _activeLabel = new Text({ text: name, style: LABEL_STYLE })
    _activeLabel.anchor.set(0.5, 0)
    _activeLabel.x = cx
    _activeLabel.y = cy - 14
    _activeLabel.alpha = 0.65
    _activeLabel.zIndex = 100
    container.addChild(_activeLabel)
  }

  function hideLabel() {
    if (_activeLabel) {
      container.removeChild(_activeLabel)
      _activeLabel.destroy()
      _activeLabel = null
    }
    if (_activeValue) {
      container.removeChild(_activeValue)
      _activeValue.destroy()
      _activeValue = null
    }
  }

  return {
    container,

    init(_state: MapState, w: number, h: number) {
      _ox = w / 2 - 10
      _oy = (h - 324) / 2 + 4
      buildHitTargets()
    },

    update() {
      // Labels shown on hover only — no per-frame update
    },

    destroy() {
      container.destroy({ children: true })
    },
  }
}
