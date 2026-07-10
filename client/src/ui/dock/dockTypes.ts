import type { LucideIcon } from 'lucide-react'

export type DockTab = 'briefing' | 'treasury' | 'power' | 'lagos' | 'delivery' | 'legacy'

export type DockBadgeTone = 'neutral' | 'info' | 'warning' | 'danger' | 'success' | 'accent'

export type DockBadge = {
  value: number | string
  tone?: DockBadgeTone
  ariaLabel?: string
}

export type DockTabConfig = {
  id: DockTab
  label: string
  question: string
  Icon: LucideIcon
}
