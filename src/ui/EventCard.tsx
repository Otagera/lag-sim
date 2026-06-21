import { useGameStore } from '../state/gameStore'
import type { Choice } from '../state/types'

const SEVERITY_TEXT: Record<string, { label: string; color: string }> = {
  low: { label: 'Low', color: 'var(--success-11)' },
  medium: { label: 'Medium', color: 'var(--warning-11)' },
  high: { label: 'High', color: 'var(--error-11)' },
  critical: { label: 'Critical', color: 'var(--error-9)' },
}

const STAT_WHITELIST = new Set<string>([
  'cashReserve', 'publicTrust', 'politicalCapital', 'corruptionPressure',
  'youthTension', 'infrastructureScore', 'securityIndex', 'federalRelationship', 'igr',
])

const INVERT_STATS = new Set<string>(['corruptionPressure', 'youthTension'])

const STAT_LABELS: Record<string, string> = {
  cashReserve: 'Cash',
  publicTrust: 'Trust',
  politicalCapital: 'Pol. Cap',
  corruptionPressure: 'Corruption',
  youthTension: 'Youth',
  infrastructureScore: 'Infra',
  securityIndex: 'Security',
  federalRelationship: 'Fed. Rel.',
  igr: 'IGR',
}

const FACTION_LABELS: Record<string, string> = {
  businessCommunity: 'Business',
  informalEconomy: 'Informal',
  partyGodfathers: 'Godfathers',
  federalGovt: 'Federal',
  civilSocietyMedia: 'Civil Soc',
  lgChairmen: 'LG',
}

type ImpactPill = { text: string; isGood: boolean }

function buildImpactPills(choice: Choice): ImpactPill[] {
  const pills: ImpactPill[] = []

  if (choice.politicalCapitalCost && choice.politicalCapitalCost > 0) {
    pills.push({ text: `-${choice.politicalCapitalCost} Pol. Cap`, isGood: false })
  }

  for (const [key, value] of Object.entries(choice.immediate)) {
    if (!value || !STAT_WHITELIST.has(key)) continue
    const isGood = INVERT_STATS.has(key) ? value < 0 : value > 0
    const absVal = Math.abs(value)
    const sign = value > 0 ? '+' : '-'
    const label = STAT_LABELS[key] ?? key
    const formatted = (key === 'cashReserve' || key === 'igr')
      ? `${sign}₦${absVal.toFixed(1)}bn ${label}`
      : `${sign}${absVal < 1 ? absVal.toFixed(1) : absVal.toFixed(0)} ${label}`
    pills.push({ text: formatted, isGood })
  }

  for (const [key, value] of Object.entries(choice.factionImpact)) {
    if (!value) continue
    const sign = value > 0 ? '+' : ''
    const label = FACTION_LABELS[key] ?? key
    pills.push({ text: `${sign}${(value as number).toFixed(0)} ${label}`, isGood: (value as number) > 0 })
  }

  return pills
}

export function EventCard() {
  const activeEvent = useGameStore((s) => s.activeEvent)
  const resolveEvent = useGameStore((s) => s.resolveEvent)

  if (!activeEvent) {
    return (
      <div
        className="p-4 text-center border"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text-secondary)' }}
      >
        No active event. Click "Next Week" to advance.
      </div>
    )
  }

  const sev = SEVERITY_TEXT[activeEvent.severity] ?? { label: activeEvent.severity, color: 'var(--text-secondary)' }

  return (
    /* Signature move: 2px solid accent-solid rule at top — nowhere else in the UI */
    <div
      className="border"
      style={{
        borderColor: 'var(--border)',
        borderTopWidth: '2px',
        borderTopColor: 'var(--accent-solid)',
        backgroundColor: 'var(--surface)',
      }}
    >
      <div className="p-4">
        <div className="flex justify-between items-start mb-2 gap-2">
          <h2
            className="font-display text-[20px] font-semibold leading-snug"
            style={{ color: 'var(--text)' }}
          >
            {activeEvent.title}
          </h2>
          <div className="shrink-0 text-right">
            <span className="label-caps block" style={{ color: sev.color }}>{sev.label}</span>
            <span className="label-caps block mt-px">{activeEvent.category}</span>
          </div>
        </div>
        <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text)' }}>
          {activeEvent.body}
        </p>
        <div className="space-y-2">
          {activeEvent.choices.map((choice) => {
            const pills = buildImpactPills(choice)
            return (
              <button
                type="button"
                key={choice.id}
                onClick={() => resolveEvent(choice.id)}
                className="w-full text-left p-3 border transition-colors"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)', color: 'var(--text)' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--background)')}
              >
                <span className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{choice.label}</span>
                {choice.description && (
                  <p className="text-[11px] mt-1 leading-snug" style={{ color: 'var(--text-secondary)' }}>
                    {choice.description}
                  </p>
                )}
                {pills.length > 0 && (
                  <div
                    className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1.5 pt-1.5"
                    style={{ borderTop: '1px solid var(--border-subtle)' }}
                  >
                    {pills.map((p, i) => (
                      <span
                        key={i}
                        className="text-[9px] font-semibold"
                        style={{ color: p.isGood ? 'var(--success-11)' : 'var(--error-11)' }}
                      >
                        {p.text}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
