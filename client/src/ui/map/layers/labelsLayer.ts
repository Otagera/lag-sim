// Layer 7 — LGA labels: key names always visible, all names on hover with
// approval percentage. Click highlights the LGA (future: connect to panel).

import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { useGameStore } from '../../../state/gameStore'
import type { MapState } from '../../../state/mapSelectors'
import type { ConstituencyKey } from '../../../state/types'
import { getLGAGeometry } from '../geoProjection'
import { isoToScreen } from '../projection'
import type { MapLayer } from '../types'

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
const LGA_LABELS: Set<string> = new Set([
  'Lagos Island',
  'Eti Osa',
  'Ibeju Lekki',
  'Ikeja',
  'Alimosho',
  'Surulere',
  'Apapa',
])

function createLabelSprite(text: string, x: number, y: number, style: TextStyle): Text {
  const label = new Text({ text, style })
  label.anchor.set(0.5, 0)
  label.x = x
  label.y = y
  return label
}

function buildLabelSprites(ox: number, oy: number): Text[] {
  return getLGAGeometry().flatMap((lga) => {
    if (!LGA_LABELS.has(lga.name)) return []
    const { x, y } = isoToScreen(lga.centroid[0], lga.centroid[1], ox, oy)
    const label = createLabelSprite(lga.name, x, y + 12, LABEL_STYLE)
    label.alpha = 0.3
    label.zIndex = 50
    return [label]
  })
}

function updateLabels(labels: Text[], _state: MapState) {
  for (const label of labels) {
    label.visible = true
    label.alpha = 0.3
  }
}

function buildHitTargets(
  container: Container,
  ox: number,
  oy: number,
  showLabel: (name: string, key: ConstituencyKey, x: number, y: number) => void,
  hideLabel: () => void,
) {
  container.removeChildren()
  for (const lga of getLGAGeometry()) {
    const { x, y } = isoToScreen(lga.centroid[0], lga.centroid[1], ox, oy)
    const hit = new Graphics()
    hit.circle(x, y, 18).fill({ color: 0xffffff, alpha: 0 })
    hit.eventMode = 'static'
    hit.cursor = 'pointer'
    hit.label = lga.name
    hit.on('pointerover', () => showLabel(lga.name, lga.key, x, y))
    hit.on('pointerout', hideLabel)
    container.addChild(hit)
  }
}

function destroyText(container: Container, label: Text | null) {
  if (!label) return null
  container.removeChild(label)
  label.destroy()
  return null
}

export function createLabelsLayer(): MapLayer {
  const container = new Container()
  const alwaysC = new Container()
  const hitC = new Container()
  container.eventMode = 'static'
  container.sortableChildren = true
  container.addChild(alwaysC)
  container.addChild(hitC)

  let _ox = 0,
    _oy = 0
  let _labels: Text[] = []
  let _activeLabel: Text | null = null
  let _activeValue: Text | null = null

  const hideLabel = () => {
    _activeLabel = destroyText(hitC, _activeLabel)
    _activeValue = destroyText(hitC, _activeValue)
  }

  const showLabel = (name: string, key: ConstituencyKey, cx: number, cy: number) => {
    hideLabel()
    const store = useGameStore.getState()
    const approval = store.constituencyApproval[key] ?? 50

    _activeLabel = createLabelSprite(name, cx, cy - 14, LABEL_STYLE)
    _activeLabel.alpha = 0.65
    _activeLabel.zIndex = 100
    hitC.addChild(_activeLabel)

    _activeValue = createLabelSprite(`${approval}%`, cx, cy - 2, HOVER_STYLE)
    _activeValue.alpha = 0.55
    _activeValue.zIndex = 100
    hitC.addChild(_activeValue)
  }

  return {
    container,
    init(_state: MapState, w: number, h: number) {
      _ox = w / 2 - 10
      _oy = (h - 324) / 2 + 4
      _labels = buildLabelSprites(_ox, _oy)
      alwaysC.removeChildren()
      alwaysC.addChild(..._labels)
      buildHitTargets(hitC, _ox, _oy, showLabel, hideLabel)
    },

    update(state: MapState, _dt: number) {
      updateLabels(_labels, state)
    },

    destroy() {
      _labels = []
      container.destroy({ children: true })
    },
  }
}
