import { useGameStore } from '../state/gameStore'
import type { FactionKey } from '../state/types'

const FACTION_LABELS: Record<FactionKey, string> = {
  businessCommunity: 'Business',
  informalEconomy: 'Informal',
  partyGodfathers: 'Godfathers',
  federalGovt: 'Federal',
  civilSocietyMedia: 'Civil Soc.',
  lgChairmen: 'LG Chairmen',
}

function FactionBar({ factionKey, value }: { factionKey: FactionKey; value: number }) {
  const fillColor =
    value < 0
      ? 'bg-red-600'
      : value >= 50
        ? 'bg-green-600'
        : value >= 20
          ? 'bg-yellow-600'
          : 'bg-red-600'
  const fillWidth = `${(Math.abs(value) / 100) * 50}%`

  return (
    <div>
      <div className="flex justify-between text-[10px] mb-px">
        <span className="text-gray-300 truncate mr-1">{FACTION_LABELS[factionKey]}</span>
        <span className="text-gray-400 shrink-0">{value}</span>
      </div>
      <div className="relative h-1.5 w-full bg-gray-700 rounded-full overflow-hidden">
        {value >= 0 && (
          <div
            className={`absolute left-1/2 top-0 h-full rounded-r-full ${fillColor}`}
            style={{ width: fillWidth }}
          />
        )}
        {value < 0 && (
          <div
            className={`absolute right-1/2 top-0 h-full rounded-l-full ${fillColor}`}
            style={{ width: fillWidth }}
          />
        )}
        <div className="absolute left-1/2 top-0 -translate-x-px w-0.5 h-full bg-gray-500" />
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
    <div className="rounded-lg bg-gray-800 p-2">
      <h2 className="text-[11px] font-semibold text-gray-400 uppercase mb-1.5">Factions</h2>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
        {ALL_FACTIONS.map((key) => (
          <FactionBar key={key} factionKey={key} value={factions[key]} />
        ))}
      </div>
    </div>
  )
}
