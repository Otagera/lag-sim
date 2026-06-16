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
      <div className="flex justify-between text-[10px] mb-px">
        <span className="text-gray-300 truncate mr-1">{CONSTITUENCY_LABELS[constituencyKey]}</span>
        <span className="text-gray-400 shrink-0">{value}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-gray-700 overflow-hidden">
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
    <div className="rounded-lg bg-gray-800 p-2">
      <h2 className="text-[11px] font-semibold text-gray-400 uppercase mb-1.5">Polling</h2>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
        {ALL_CONSTITUENCIES.map((key) => (
          <ApprovalBar key={key} constituencyKey={key} value={approval[key]} />
        ))}
      </div>
    </div>
  )
}
