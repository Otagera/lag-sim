// Layer 7 — LGA labels: key names always visible, all names on hover with
// approval percentage. Click highlights the LGA (future: connect to panel).

import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import type { MapLayer } from '../types'
import type { MapState } from '../../../state/mapSelectors'
import { isoToScreen } from '../projection'
import { getLGAGeometry } from '../geoProjection'
import { useGameStore } from '../../../state/gameStore'
import type { ConstituencyKey } from '../../../state/types'

const LABEL_STYLE = new TextStyle({
  fontFamily: 'Archivo Narrow, sans-serif',
  fontSize: 10,
  fill: 0x8899aa,
  letterSpacing: 0.5,
})

const HOVER_STYLE = new TextStyle({
  fontFamily: 'Archivo Narrow, sans-serif',
  fontSize: 11,
  fill: 0xccddee,
  letterSpacing: 0.5,
})

// 7 key LGAs always visible — these are the recognisable anchors
const ALWAYS_VISIBLE: Set<string> = new Set([
  'Lagos Island',
  'Eti Osa',
  'Ibeju Lekki',
  'Ikeja',
  'Alimosho',
  'Surulere',
  'Apapa',
])

export function createLabelsLayer(): MapLayer {
  const container = new Container()
  const alwaysC = new Container()
  const hitC = new Container()
  container.eventMode = 'static'
  container.sortableChildren = true
  container.addChild(alwaysC)
  container.addChild(hitC)

  let _ox = 0, _oy = 0
  let _activeLabel: Text | null = null
  let _activeValue: Text | null = null

  function buildAlwaysVisible() {
    alwaysC.removeChildren()
    const lgas = getLGAGeometry()
    for (const lga of lgas) {
      if (!ALWAYS_VISIBLE.has(lga.name)) continue
      const { x, y } = isoToScreen(lga.centroid[0], lga.centroid[1], _ox, _oy)
      const label = new Text({ text: lga.name, style: LABEL_STYLE })
      label.anchor.set(0.5, 0)
      label.x = x
      label.y = y + 12
      label.alpha = 0.30
      label.zIndex = 50
      alwaysC.addChild(label)
    }
  }

  function buildHitTargets() {
    hitC.removeChildren()
    const lgas = getLGAGeometry()
    for (const lga of lgas) {
      const { x, y } = isoToScreen(lga.centroid[0], lga.centroid[1], _ox, _oy)

      const hit = new Graphics()
      hit.circle(x, y, 18).fill({ color: 0xffffff, alpha: 0 })
      hit.eventMode = 'static'
      hit.cursor = 'pointer'
      hit.label = lga.name
      const key = lga.key

      hit.on('pointerover', () => {
        showLabel(lga.name, key, x, y)
      })
      hit.on('pointerout', () => {
        hideLabel()
      })

      hitC.addChild(hit)
    }
  }

  function showLabel(name: string, key: ConstituencyKey, cx: number, cy: number) {
    hideLabel()

    const store = useGameStore.getState()
    const approval = store.constituencyApproval[key] ?? 50

    _activeLabel = new Text({ text: name, style: LABEL_STYLE })
    _activeLabel.anchor.set(0.5, 0)
    _activeLabel.x = cx
    _activeLabel.y = cy - 14
    _activeLabel.alpha = 0.65
    _activeLabel.zIndex = 100
    hitC.addChild(_activeLabel)

    _activeValue = new Text({ text: `${approval}%`, style: HOVER_STYLE })
    _activeValue.anchor.set(0.5, 0)
    _activeValue.x = cx
    _activeValue.y = cy - 2
    _activeValue.alpha = 0.55
    _activeValue.zIndex = 100
    hitC.addChild(_activeValue)
  }

  function hideLabel() {
    if (_activeLabel) {
      hitC.removeChild(_activeLabel)
      _activeLabel.destroy()
      _activeLabel = null
    }
    if (_activeValue) {
      hitC.removeChild(_activeValue)
      _activeValue.destroy()
      _activeValue = null
    }
  }

  return {
    container,

    init(_state: MapState, w: number, h: number) {
      _ox = w / 2 - 10
      _oy = (h - 324) / 2 + 4
      buildAlwaysVisible()
      buildHitTargets()
    },

    update(_state: MapState, _dt: number) {
      // Hover labels shown on pointer event — no per-frame update needed
    },

    destroy() {
      container.destroy({ children: true })
    },
  }
}
