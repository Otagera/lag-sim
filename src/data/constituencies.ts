import type { ConstituencyKey } from '../state/types'

export type ZoneInfo = {
  key: ConstituencyKey
  label: string
  description: string
}

export const CONSTITUENCIES: ZoneInfo[] = [
  { key: 'lagosIsland', label: 'Lagos Island', description: 'Central business district' },
  { key: 'victoriaIsland', label: 'Victoria Island', description: 'Affluent commercial hub' },
  { key: 'lekki', label: 'Lekki', description: 'Fast-growing suburban corridor' },
  { key: 'surulere', label: 'Surulere', description: 'Middle-class heartland' },
  { key: 'oshodi', label: 'Oshodi', description: 'Transport and market nexus' },
  { key: 'alimosho', label: 'Alimosho', description: 'Most populous LGA' },
  { key: 'periphery', label: 'Periphery', description: 'Badagry, Epe, Ikorodu' },
  { key: 'makoko', label: 'Makoko', description: 'Waterfront slum community' },
]
