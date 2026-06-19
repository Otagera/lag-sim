import { useGameStore } from '../state/gameStore'
import type { DeputyKey } from '../state/types'

const DEPUTY_ROLES: Record<DeputyKey, string> = {
  technocrat: 'Technocrat',
  politician: 'Politician',
  loyalist: 'Party Loyalist',
  reformer: 'Reformer',
  traditionalist: 'Traditionalist',
  economist: 'Economist',
  'security-chief': 'Security Chief',
}

const DEPUTY_TRIGGER: Record<DeputyKey, string> = {
  technocrat: 'Infra < 35',
  politician: 'LG Chairmen < 35',
  loyalist: 'Trust < 40',
  reformer: 'Corruption > 55',
  traditionalist: 'Godfather refusals > 2',
  economist: 'Cash < ₦5bn',
  'security-chief': 'Security < 40',
}

function ResentmentBar({ value, revealed }: { value: number; revealed: boolean }) {
  if (revealed) {
    return <p className="text-[9px] text-gray-500 italic">Consequence resolved — loyalty restored</p>
  }
  const pct = Math.round(value)
  const color = value >= 70 ? 'bg-red-500' : value >= 40 ? 'bg-orange-500' : 'bg-green-600'
  return (
    <div>
      <div className="flex justify-between text-[9px] text-gray-500 mb-0.5">
        <span>Resentment</span>
        <span>{pct} / 100</span>
      </div>
      <div className="h-1.5 w-full bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      {value >= 60 && (
        <p className="text-[9px] text-red-400 mt-0.5">Consequence event imminent</p>
      )}
      {value >= 40 && value < 60 && (
        <p className="text-[9px] text-orange-400 mt-0.5">Deputy growing restless</p>
      )}
    </div>
  )
}

export function DeputyPanel() {
  const deputy = useGameStore((s) => s.deputy)
  if (!deputy) return null

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 p-3">
      <h3 className="text-xs font-bold text-gray-200 mb-2">Deputy Governor</h3>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold text-white">{DEPUTY_ROLES[deputy.key]}</p>
          {deputy.revealed && (
            <span className="text-[9px] text-gray-500 bg-gray-700 px-1.5 py-0.5 rounded">Revealed</span>
          )}
        </div>
        <p className="text-[9px] text-gray-500">Trigger: {DEPUTY_TRIGGER[deputy.key]}</p>
        <ResentmentBar value={deputy.resentment} revealed={deputy.revealed} />
      </div>
    </div>
  )
}
