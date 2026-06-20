import { useGameStore } from '../state/gameStore'
import type { ConstituencyKey } from '../state/types'

const CONSTITUENCY_LABELS: Record<ConstituencyKey, string> = {
  lagosIsland: 'Lagos Isl.',
  victoriaIsland: 'VI',
  lekki: 'Lekki',
  surulere: 'Surulere',
  oshodi: 'Oshodi',
  alimosho: 'Alimosho',
  periphery: 'Periphery',
  makoko: 'Makoko',
}

function approvalColor(value: number): string {
  if (value >= 50) return 'var(--success-9)'
  if (value >= 35) return 'var(--warning-9)'
  return 'var(--error-9)'
}

function ApprovalBar({ constituencyKey, value }: { constituencyKey: ConstituencyKey; value: number }) {
  return (
    <div>
      <div className="flex justify-between mb-px">
        <span className="label-caps truncate mr-1">{CONSTITUENCY_LABELS[constituencyKey]}</span>
        <span className="label-caps shrink-0" style={{ color: 'var(--text)' }}>{value}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden" style={{ backgroundColor: 'var(--neutral-4)' }}>
        <div
          className="h-full transition-all"
          style={{ width: `${value}%`, backgroundColor: approvalColor(value) }}
        />
      </div>
    </div>
  )
}

const ALL_CONSTITUENCIES: ConstituencyKey[] = [
  'lagosIsland', 'victoriaIsland', 'lekki', 'surulere',
  'oshodi', 'alimosho', 'periphery', 'makoko',
]

export function PollPanel() {
  const approval = useGameStore((s) => s.constituencyApproval)

  return (
    <div className="p-2 border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
      <h2 className="label-caps mb-2">Polling</h2>
      <div className="grid grid-cols-2 gap-x-3 gap-y-2">
        {ALL_CONSTITUENCIES.map((key) => (
          <ApprovalBar key={key} constituencyKey={key} value={approval[key]} />
        ))}
      </div>
    </div>
  )
}
