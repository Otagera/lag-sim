import { useGameStore } from '../state/gameStore'
import type { ConstituencyKey } from '../state/types'

const CONSTITUENCY_LABELS: Record<ConstituencyKey, string> = {
  lagosIsland: 'Lagos Island',
  victoriaIsland: 'Victoria Island',
  lekki: 'Lekki',
  surulere: 'Surulere',
  oshodi: 'Oshodi',
  alimosho: 'Alimosho',
  periphery: 'Periphery',
  makoko: 'Makoko',
}

function ApprovalBar({
  constituencyKey,
  value,
}: {
  constituencyKey: ConstituencyKey
  value: number
}) {
  const color = value >= 50 ? 'bg-green-600' : value >= 35 ? 'bg-yellow-600' : 'bg-red-600'

  return (
    <div>
      <div className="flex justify-between text-xs mb-0.5">
        <span className="text-gray-300">{CONSTITUENCY_LABELS[constituencyKey]}</span>
        <span className="text-gray-400">{value}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-700 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

const ALL_CONSTITUENCIES: ConstituencyKey[] = [
  'lagosIsland',
  'victoriaIsland',
  'lekki',
  'surulere',
  'oshodi',
  'alimosho',
  'periphery',
  'makoko',
]

export function PollPanel() {
  const approval = useGameStore((s) => s.constituencyApproval)

  return (
    <div className="rounded-lg bg-gray-800 p-3 space-y-3">
      <h2 className="text-sm font-semibold text-gray-400 uppercase">Polling</h2>
      {ALL_CONSTITUENCIES.map((key) => (
        <ApprovalBar key={key} constituencyKey={key} value={approval[key]} />
      ))}
    </div>
  )
}
