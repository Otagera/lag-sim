import { useEffect, useState } from 'react'
import { useGameStore } from '../state/gameStore'
import { Pill } from './components'
import type { Choice, ConsequenceBeat } from '../state/types'

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

function buildPillsFromBeat(beat: ConsequenceBeat): ImpactPill[] {
  const pills: ImpactPill[] = []

  if (beat.politicalCapitalCost && beat.politicalCapitalCost > 0) {
    pills.push({ text: `-${beat.politicalCapitalCost} Pol. Cap`, isGood: false })
  }

  for (const [key, value] of Object.entries(beat.immediate)) {
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

  for (const [key, value] of Object.entries(beat.factionImpact)) {
    if (!value) continue
    const sign = value > 0 ? '+' : ''
    const label = FACTION_LABELS[key] ?? key
    pills.push({ text: `${sign}${(value as number).toFixed(0)} ${label}`, isGood: (value as number) > 0 })
  }

  return pills
}

const TONE_STYLE: Record<string, { border: string; text: string }> = {
  grim: { border: 'var(--error-9)', text: 'var(--error-11)' },
  tense: { border: 'var(--warning-9)', text: 'var(--warning-11)' },
  hopeful: { border: 'var(--success-9)', text: 'var(--success-11)' },
  hollow: { border: 'var(--neutral-6)', text: 'var(--text-secondary)' },
  neutral: { border: 'var(--border)', text: 'var(--text)' },
}

function AftermathPanel({ beat, onDismiss }: { beat: ConsequenceBeat; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  useEffect(() => {
    const timer = setTimeout(onDismiss, 2500)
    return () => clearTimeout(timer)
  }, [onDismiss])

  const tone = TONE_STYLE[beat.tone] ?? TONE_STYLE.neutral
  const pills = buildPillsFromBeat(beat)

  return (
    <div
      className="border p-4"
      onClick={onDismiss}
      style={{
        borderColor: 'var(--border)',
        borderTopWidth: '2px',
        borderTopColor: 'var(--accent-solid)',
        backgroundColor: 'var(--surface)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.4s ease',
        cursor: 'pointer',
      }}
    >
      <div className="mb-1">
        <span className="label-caps" style={{ color: 'var(--text-secondary)' }}>
          Decision Made
        </span>
      </div>
      <p className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>
        {beat.choiceLabel}
      </p>
      {beat.choiceDescription && (
        <p className="text-[11px] mt-0.5 leading-snug" style={{ color: 'var(--text-secondary)' }}>
          {beat.choiceDescription}
        </p>
      )}

      <div
        className="mt-3 pl-3 italic text-[11px] leading-relaxed"
        style={{
          borderLeft: `2px solid ${tone.border}`,
          color: tone.text,
        }}
      >
        {beat.text}
      </div>

      {pills.length > 0 && (
        <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-3 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          {pills.map((p, i) => (
            <Pill key={i} text={p.text} isGood={p.isGood} />
          ))}
        </div>
      )}

      <div className="mt-3 text-[9px] text-center" style={{ color: 'var(--text-secondary)' }}>
        Click anywhere or wait to dismiss
      </div>
    </div>
  )
}

export function EventCard() {
  const activeEvent = useGameStore((s) => s.activeEvent)
  const consequenceBeats = useGameStore((s) => s.consequenceBeats)
  const resolveEvent = useGameStore((s) => s.resolveEvent)
  const dismissConsequenceBeat = useGameStore((s) => s.dismissConsequenceBeat)

  // Aftermath view — show first beat in queue
  if (!activeEvent && consequenceBeats.length > 0) {
    const beat = consequenceBeats[0]
    return (
      <AftermathPanel
        beat={beat}
        onDismiss={dismissConsequenceBeat}
      />
    )
  }

  // Empty state
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

  // Active event view
  const sev = SEVERITY_TEXT[activeEvent.severity] ?? { label: activeEvent.severity, color: 'var(--text-secondary)' }
  const isGodfather = activeEvent.category === 'godfather'
  const godfatherColor = '#8b0000'
  const accentColor = isGodfather ? godfatherColor : 'var(--accent-solid)'

  return (
    <div
      className="border"
      style={{
        borderColor: isGodfather ? godfatherColor : 'var(--border)',
        borderTopWidth: '2px',
        borderTopColor: accentColor,
        backgroundColor: 'var(--surface)',
        ...(isGodfather ? { boxShadow: 'inset 0 0 0 1px rgba(139,0,0,0.15)' } : {}),
      }}
    >
      <div style={{ padding: '20px 24px' }}>
        <div className="flex items-center gap-2 mb-2">
          {isGodfather ? (
            <span className="label-caps" style={{ color: godfatherColor }}>Chief Fashemu</span>
          ) : (
            <span className="label-caps" style={{ color: sev.color }}>{sev.label}</span>
          )}
          <span className="label-caps" style={{ color: 'var(--text-secondary)' }}>{activeEvent.category}</span>
        </div>

        <div style={{ height: '1px', background: `linear-gradient(to right, transparent, ${accentColor}, transparent)`, margin: '6px 0 10px' }} />

        <h2 className="font-display font-semibold" style={{ fontSize: '26px', color: 'var(--text)', lineHeight: 1.25 }}>
          {activeEvent.title}
        </h2>

        <p style={{ fontSize: '13px', lineHeight: 1.75, color: 'var(--text)', marginBottom: '16px' }}>
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
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{choice.label}</span>
                {choice.description && (
                  <p style={{ fontSize: '11px', marginTop: '4px', lineHeight: 1.3, color: 'var(--text-secondary)' }}>
                    {choice.description}
                  </p>
                )}
                {pills.length > 0 && (
                  <div
                    className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1.5 pt-1.5"
                    style={{ borderTop: '1px solid var(--border-subtle)' }}
                  >
                    {pills.map((p, i) => (
                      <Pill key={i} text={p.text} isGood={p.isGood} />
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
