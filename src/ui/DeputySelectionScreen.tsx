import { DEPUTY_PROFILES } from '../data/deputies'
import { useGameStore } from '../state/gameStore'
import { Button, Surface } from './components'
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
          <h1 className="font-display font-semibold mt-1" style={{ fontSize: '30px', color: 'var(--text)' }}>Choose Your Deputy Governor</h1>
          <p className="mt-2 max-w-xl mx-auto" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
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
              <Surface
                key={key}
                elevation="raised"
                padding="16px"
                style={{ borderTop: '2px solid var(--accent-solid)', display: 'flex', flexDirection: 'column', gap: '12px' }}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="label-caps" style={{ color: 'var(--accent-text)' }}>{profile.shortName}</div>
                    {recommended && (
                      <span
                        style={{
                          fontSize: '9px',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          padding: '2px 6px',
                          backgroundColor: 'var(--accent-solid)',
                          color: 'var(--accent-on-solid)',
                        }}
                      >
                        Suits your path
                      </span>
                    )}
                  </div>
                  <h2 style={{ fontSize: '13px', fontWeight: 600, marginTop: '2px', color: 'var(--text)' }}>{profile.name}</h2>
                  <p style={{ fontSize: '11px', marginTop: '2px', color: 'var(--text-secondary)' }}>{profile.title}</p>
                </div>

                <p style={{ fontSize: '11px', lineHeight: 1.7, color: 'var(--text)', flex: 1 }}>
                  {profile.description}
                </p>

                {allBonuses.length > 0 && (
                  <div>
                    <p className="label-caps mb-1">At game start</p>
                    <div className="flex flex-wrap gap-1">
                      {allBonuses.map(({ k, v }) => (
                        <span
                          key={k}
                          style={{
                            fontSize: '10px',
                            padding: '2px 6px',
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
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    <span className="label-caps" style={{ display: 'inline', marginRight: '4px' }}>Per visit:</span>
                    {visitLine}
                  </p>
                )}

                <div style={{ fontSize: '11px', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
                  <div>
                    <span className="font-semibold" style={{ color: 'var(--success-11)' }}>Strength: </span>
                    <span style={{ color: 'var(--text)' }}>{profile.strength}</span>
                  </div>
                  <div>
                    <span className="font-semibold" style={{ color: 'var(--error-11)' }}>Risk: </span>
                    <span style={{ color: 'var(--text)' }}>{profile.risk}</span>
                  </div>
                </div>

                <Button variant="primary" fullWidth onClick={() => handleSelect(key)}>
                  Select {profile.shortName}
                </Button>
              </Surface>
            )
          })}
        </div>

        <p className="text-center mt-6" style={{ fontSize: '11px', color: 'var(--border-strong)' }}>
          Your Deputy also influences which commissioners will agree to serve in your cabinet.
        </p>
      </div>
    </div>
  )
}
