import type { Container } from 'pixi.js'
import type { MapState } from '../../state/mapSelectors'

export interface MapLayer {
  container: Container
  init(state: MapState, width: number, height: number): void
  update(state: MapState, dt: number): void
  destroy(): void
}
