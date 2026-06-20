import { DEPUTY_PROFILES } from '../data/deputies'
import { useGameStore } from '../state/gameStore'
import type { ArchetypeKey } from '../data/archetypes'
import type { DeputyKey } from '../state/types'

const FALLBACK_KEYS: DeputyKey[] = ['technocrat', 'politician', 'loyalist']

// Which archetypes benefit most from each deputy
const PAIRING: Partial<Record<string, ArchetypeKey[]>> = {
  technocrat: ['loyalist', 'outsider'],
  politician: ['technocrat', 'outsider'],
  loyalist: ['technocrat', 'outsider'],
  reformer: ['loyalist', 'outsider'],
  traditionalist: ['technocrat', 'loyalist'],
  economist: ['outsider', 'technocrat'],
  'security-chief': ['loyalist'],
}

const STAT_LABEL: Record<string, string> = {
  cashReserve: 'Cash',
  publicTrust: 'Trust',
  politicalCapital: 'Pol. Cap',
  corruptionPressure: 'Corruption',
  securityIndex: 'Security',
  youthTension: 'Youth',
  infrastructureScore: 'Infra',
  igr: 'IGR',
  businessCommunity: 'Business',
  informalEconomy: 'Informal',
  partyGodfathers: 'Godfathers',
  federalGovt: 'Federal',
  civilSocietyMedia: 'Civil Soc',
  lgChairmen: 'LG',
}

const CASH_STATS = new Set(['cashReserve', 'igr'])
const INVERT_STATS = new Set(['corruptionPressure', 'youthTension'])

function fmtEffect(key: string, value: number): string {
  const sign = value > 0 ? '+' : ''
  const label = STAT_LABEL[key] ?? key
  if (CASH_STATS.has(key)) return `${sign}₦${Math.abs(value)}bn ${label}`
  return `${sign}${value} ${label}`
}

function isGoodEffect(key: string, value: number): boolean {
  return INVERT_STATS.has(key) ? value < 0 : value > 0
}

function buildVisitLine(statDelta?: Record<string, number>, factionDelta?: Record<string, number>): string {
  const parts: string[] = []
  if (statDelta) {
    for (const [k, v] of Object.entries(statDelta)) {
      if (v !== 0 && v !== undefined) parts.push(fmtEffect(k, v))
    }
  }
  if (factionDelta) {
    for (const [k, v] of Object.entries(factionDelta)) {
      if (v !== 0 && v !== undefined) parts.push(fmtEffect(k, v))
    }
  }
  return parts.join(' · ')
}

type Props = {
  onSelect: () => void
  archetypeKey: ArchetypeKey
}

export function DeputySelectionScreen({ onSelect, archetypeKey }: Props) {
  const setDeputy = useGameStore((s) => s.setDeputy)
  const offeredDeputies = useGameStore((s) => s.offeredDeputies)
  const keys: DeputyKey[] = offeredDeputies?.length === 3 ? offeredDeputies : FALLBACK_KEYS

  function handleSelect(key: DeputyKey) {
    setDeputy(key)
    onSelect()
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-start justify-center py-8 px-4" style={{ backgroundColor: 'var(--background)' }}>
      <div className="w-full max-w-3xl">
        <div className="text-center mb-8">
          <p className="label-caps" style={{ color: 'var(--accent-text)' }}>Your running mate</p>
          <h1 className="font-display text-2xl font-semibold mt-1" style={{ color: 'var(--text)' }}>Choose Your Deputy Governor</h1>
          <p className="text-sm mt-2 max-w-xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Your Deputy shapes how the administration governs and who you can appoint to the cabinet.
            This decision cannot be undone.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {keys.map((key) => {
            const profile = DEPUTY_PROFILES[key]
            const recommended = PAIRING[key]?.includes(archetypeKey) ?? false
            const visitLine = buildVisitLine(
              profile.visitStatDelta as Record<string, number>,
              profile.visitFactionDelta as Record<string, number> | undefined,
            )

            const allBonuses: { k: string; v: number }[] = [
              ...Object.entries(profile.statBonuses ?? {}).map(([k, v]) => ({ k, v: v as number })),
              ...Object.entries(profile.factionBonuses ?? {}).map(([k, v]) => ({ k, v: v as number })),
            ].filter(({ v }) => v !== 0 && v !== undefined)

            return (
              <div
                key={key}
                className="border p-4 flex flex-col gap-3"
                style={{ borderColor: 'var(--border)', borderTopWidth: '2px', borderTopColor: 'var(--accent-solid)', backgroundColor: 'var(--surface)' }}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="label-caps" style={{ color: 'var(--accent-text)' }}>{profile.shortName}</div>
                    {recommended && (
                      <span
                        className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5"
                        style={{ backgroundColor: 'var(--accent-solid)', color: 'var(--accent-on-solid)' }}
                      >
                        Suits your path
                      </span>
                    )}
                  </div>
                  <h2 className="text-[13px] font-semibold mt-0.5" style={{ color: 'var(--text)' }}>{profile.name}</h2>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>{profile.title}</p>
                </div>

                <p className="text-[11px] leading-relaxed flex-1" style={{ color: 'var(--text)' }}>
                  {profile.description}
                </p>

                {allBonuses.length > 0 && (
                  <div>
                    <p className="label-caps mb-1">At game start</p>
                    <div className="flex flex-wrap gap-1">
                      {allBonuses.map(({ k, v }) => (
                        <span
                          key={k}
                          className="text-[10px] px-1.5 py-0.5"
                          style={{
                            backgroundColor: isGoodEffect(k, v) ? 'var(--success-3)' : 'var(--error-3)',
                            color: isGoodEffect(k, v) ? 'var(--success-11)' : 'var(--error-11)',
                          }}
                        >
                          {fmtEffect(k, v)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {visitLine && (
                  <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                    <span className="label-caps" style={{ display: 'inline', marginRight: '4px' }}>Per visit:</span>
                    {visitLine}
                  </p>
                )}

                <div className="space-y-1 text-[11px]" style={{ borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
                  <div>
                    <span className="font-semibold" style={{ color: 'var(--success-11)' }}>Strength: </span>
                    <span style={{ color: 'var(--text)' }}>{profile.strength}</span>
                  </div>
                  <div>
                    <span className="font-semibold" style={{ color: 'var(--error-11)' }}>Risk: </span>
                    <span style={{ color: 'var(--text)' }}>{profile.risk}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSelect(key)}
                  className="w-full py-2 text-[11px] font-semibold transition-colors"
                  style={{ backgroundColor: 'var(--accent-solid)', color: 'var(--accent-on-solid)' }}
                >
                  Select {profile.shortName}
                </button>
              </div>
            )
          })}
        </div>

        <p className="text-center text-[11px] mt-6" style={{ color: 'var(--border-strong)' }}>
          Your Deputy also influences which commissioners will agree to serve in your cabinet.
        </p>
      </div>
    </div>
  )
}
