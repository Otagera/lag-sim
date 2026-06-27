import { useGameStore } from '../state/gameStore'
import { FACTION_ICONS } from '../data/icons'
import type { FactionKey } from '../state/types'

const FACTION_LABELS: Record<FactionKey, string> = {
  businessCommunity: 'Business',
  informalEconomy: 'Informal',
  partyGodfathers: 'Godfathers',
  federalGovt: 'Federal',
  civilSocietyMedia: 'Civil Soc.',
  lgChairmen: 'LG Chairmen',
}

function barColor(value: number): string {
  if (value < 0) return 'var(--error-9)'
  if (value >= 50) return 'var(--success-9)'
  if (value >= 20) return 'var(--warning-9)'
  return 'var(--error-9)'
}

function FactionBar({ factionKey, value }: { factionKey: FactionKey; value: number }) {
  const fillWidth = `${(Math.abs(value) / 100) * 50}%`

  return (
    <div>
      <div className="flex justify-between mb-px">
        <span className="label-caps truncate mr-1" style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
          {(() => { const Ic = FACTION_ICONS[factionKey]?.icon; return Ic ? <Ic size={10} style={{ flexShrink: 0 }} /> : null })()}
          {FACTION_LABELS[factionKey]}
        </span>
        <span className="label-caps shrink-0" style={{ color: 'var(--text)' }}>{value}</span>
      </div>
      <div className="relative h-1.5 w-full overflow-hidden" style={{ backgroundColor: 'var(--neutral-4)' }}>
        {value >= 0 && (
          <div
            className="absolute left-1/2 top-0 h-full"
            style={{ width: fillWidth, backgroundColor: barColor(value) }}
          />
        )}
        {value < 0 && (
          <div
            className="absolute right-1/2 top-0 h-full"
            style={{ width: fillWidth, backgroundColor: barColor(value) }}
          />
        )}
        <div className="absolute left-1/2 top-0 -translate-x-px w-px h-full" style={{ backgroundColor: 'var(--border)' }} />
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
    <div className="p-2 border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
      <h2 className="label-caps mb-2">Factions</h2>
      <div className="grid grid-cols-2 gap-x-3 gap-y-2">
        {ALL_FACTIONS.map((key) => (
          <FactionBar key={key} factionKey={key} value={factions[key]} />
        ))}
      </div>
    </div>
  )
}
