import { useGameStore } from '../state/gameStore'
import type { FactionKey } from '../state/types'

const FACTION_LABELS: Record<FactionKey, string> = {
  businessCommunity: 'Business Community',
  informalEconomy: 'Informal Economy',
  partyGodfathers: 'Party Godfathers',
  federalGovt: "Federal Gov't",
  civilSocietyMedia: 'Civil Society & Media',
  lgChairmen: 'LG Chairmen',
}

function FactionBar({ factionKey, value }: { factionKey: FactionKey; value: number }) {
  const pct = ((value + 100) / 200) * 100
  const color = value >= 50 ? 'bg-green-600' : value >= 20 ? 'bg-yellow-600' : 'bg-red-600'

  return (
    <div>
      <div className="flex justify-between text-xs mb-0.5">
        <span className="text-gray-300">{FACTION_LABELS[factionKey]}</span>
        <span className="text-gray-400">{value > 0 ? `+${value}` : value}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-700 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
        />
      </div>
    </div>
  )
}

const ALL_FACTIONS: FactionKey[] = [
  'businessCommunity',
  'informalEconomy',
  'partyGodfathers',
  'federalGovt',
  'civilSocietyMedia',
  'lgChairmen',
]

export function FactionPanel() {
  const factions = useGameStore((s) => s.factions)

  return (
    <div className="rounded-lg bg-gray-800 p-3 space-y-3">
      <h2 className="text-sm font-semibold text-gray-400 uppercase">Factions</h2>
      {ALL_FACTIONS.map((key) => (
        <FactionBar key={key} factionKey={key} value={factions[key]} />
      ))}
    </div>
  )
}
