import { BellRing, GanttChartSquare, MapPinned, Network, Trophy, Wallet } from 'lucide-react'

import type { DockTabConfig } from './dockTypes'

export const DOCK_TABS: DockTabConfig[] = [
  { id: 'briefing', label: 'Briefing', question: 'What needs my attention?', Icon: BellRing },
  { id: 'treasury', label: 'Treasury', question: 'Can we pay for this?', Icon: Wallet },
  { id: 'power', label: 'Power', question: "Who's with me, and who's against me?", Icon: Network },
  { id: 'lagos', label: 'Lagos', question: 'Where is Lagos hurting?', Icon: MapPinned },
  {
    id: 'delivery',
    label: 'Delivery',
    question: 'What are we delivering?',
    Icon: GanttChartSquare,
  },
  {
    id: 'legacy',
    label: 'Legacy',
    question: 'Are we on track to win / leave a legacy?',
    Icon: Trophy,
  },
]
