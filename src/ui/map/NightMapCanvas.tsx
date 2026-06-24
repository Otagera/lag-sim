import { useEffect, useRef } from 'react'
import { Application } from 'pixi.js'
import { useGameStore } from '../../state/gameStore'
import { selectMapState, type MapLens } from '../../state/mapSelectors'
import type { MapLayer } from './types'
import { loadLGAGeometry } from './geoProjection'
import { createGroundLayer }     from './layers/groundLayer'
import { createRoadsLayer }      from './layers/roadsLayer'
import { createBuildingsLayer }  from './layers/buildingsLayer'
import { createGeneratorsLayer } from './layers/generatorsLayer'
import { createTrafficLayer }    from './layers/trafficLayer'
import { createBoatsLayer }      from './layers/boatsLayer'
import { createLabelsLayer }     from './layers/labelsLayer'
import { createLandmarksLayer }  from './layers/landmarksLayer'
import { createLightsLayer }     from './layers/lightsLayer'

interface Props { lens: MapLens }

export function NightMapCanvas({ lens }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const lensRef = useRef<MapLens>(lens)
  // Keep ref in sync without triggering a Pixi re-init
  lensRef.current = lens

  useEffect(() => {
    if (!containerRef.current) return
    const el = containerRef.current

    let aborted = false
    let appInstance: Application | null = null

    const run = async () => {
      const w = el.clientWidth  || 800
      const h = el.clientHeight || 380

      // Load GeoJSON and project to iso space before any layer inits
      try { await loadLGAGeometry() } catch { /* fallback — layers use zone rects */ }

      const app = new Application()
      try {
        await app.init({
          width: w,
          height: h,
          backgroundColor: 0x07090f,
          antialias: true,
          preference: 'webgl',
        })
      } catch {
        return
      }

      if (aborted) { app.destroy(); return }

      appInstance = app
      el.appendChild(app.canvas as HTMLCanvasElement)

      const mapState = selectMapState(useGameStore.getState(), lensRef.current)
      const layers: MapLayer[] = [
        createGroundLayer(),
        createRoadsLayer(),
        createBuildingsLayer(),
        createGeneratorsLayer(),  // D1: street-level generator glows
        createTrafficLayer(),     // D2: danfo / BRT / headlight streams
        createBoatsLayer(),       // D3: ferries, canoes, cargo
        createLandmarksLayer(),   // Iconic Lagos structures + bridge lights
        createLabelsLayer(),      // LGA name labels on hover
        createLightsLayer(),      // B + D4: windows, glow, reflection
      ]

      for (const layer of layers) {
        layer.init(mapState, w, h)
        app.stage.addChild(layer.container)
      }

      app.ticker.add((ticker) => {
        if (aborted) return
        const state = selectMapState(useGameStore.getState(), lensRef.current)
        for (const layer of layers) {
          layer.update(state, ticker.deltaMS)
        }
      })
    }

    run()

    return () => {
      aborted = true
      if (appInstance) {
        appInstance.destroy(true, { children: true })
        appInstance = null
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', display: 'block', lineHeight: 0 }}
    />
  )
}
