import type { LucideIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { FACTION_ICONS, SEVERITY_GLYPH, STAT_ICONS } from '../data/icons'
import { useGameStore } from '../state/gameStore'
import type {
  CharacterId,
  Choice,
  ConsequenceBeat,
  EventCard as EventCardData,
  NPCArchetypeKey,
} from '../state/types'
import { electionYear } from '../utils/calendar'
import { Pill } from './components'
import { BustPortrait } from './portraits/BustPortrait'

const STAT_WHITELIST = new Set<string>([
  'cashReserve',
  'publicTrust',
  'politicalCapital',
  'corruptionPressure',
  'youthTension',
  'infrastructureScore',
  'securityIndex',
  'federalRelationship',
  'igr',
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

type ImpactPill = { text: string; isGood: boolean; icon?: LucideIcon }

function dirArrow(isGood: boolean): string {
  return isGood ? '▲' : '▼'
}

function buildImpactPills(choice: Choice): ImpactPill[] {
  const pills: ImpactPill[] = []

  // Merge politicalCapitalCost into the immediate delta so PC renders as ONE
  // net pill instead of two separate/contradictory entries.
  const mergedImmediate = { ...choice.immediate }
  if (choice.politicalCapitalCost && choice.politicalCapitalCost > 0) {
    mergedImmediate.politicalCapital =
      (mergedImmediate.politicalCapital || 0) - choice.politicalCapitalCost
  }

  for (const [key, value] of Object.entries(mergedImmediate)) {
    if (!value || !STAT_WHITELIST.has(key)) continue
    const isGood = INVERT_STATS.has(key) ? value < 0 : value > 0
    const absVal = Math.abs(value)
    const sign = value > 0 ? '+' : '-'
    const label = STAT_LABELS[key] ?? key
    const formatted =
      key === 'cashReserve' || key === 'igr'
        ? `${dirArrow(isGood)} ${sign}₦${absVal.toFixed(1)}bn ${label}`
        : `${dirArrow(isGood)} ${sign}${absVal < 1 ? absVal.toFixed(1) : absVal.toFixed(0)} ${label}`
    pills.push({ text: formatted, isGood, icon: STAT_ICONS[key]?.icon })
  }

  for (const [key, value] of Object.entries(choice.factionImpact)) {
    if (!value) continue
    const isGood = (value as number) > 0
    const sign = value > 0 ? '+' : ''
    const label = FACTION_LABELS[key] ?? key
    const ficon = FACTION_ICONS[key as keyof typeof FACTION_ICONS]
    pills.push({
      text: `${dirArrow(isGood)} ${sign}${(value as number).toFixed(0)} ${label}`,
      isGood,
      icon: ficon?.icon,
    })
  }

  return pills
}

function buildPillsFromBeat(beat: ConsequenceBeat): ImpactPill[] {
  const pills: ImpactPill[] = []

  // Same merge as buildImpactPills — net PC from beat, not double-rendered.
  const mergedImmediate = { ...beat.immediate }
  if (beat.politicalCapitalCost && beat.politicalCapitalCost > 0) {
    mergedImmediate.politicalCapital =
      (mergedImmediate.politicalCapital || 0) - beat.politicalCapitalCost
  }

  for (const [key, value] of Object.entries(mergedImmediate)) {
    if (!value || !STAT_WHITELIST.has(key)) continue
    const isGood = INVERT_STATS.has(key) ? value < 0 : value > 0
    const absVal = Math.abs(value)
    const sign = value > 0 ? '+' : '-'
    const label = STAT_LABELS[key] ?? key
    const formatted =
      key === 'cashReserve' || key === 'igr'
        ? `${dirArrow(isGood)} ${sign}₦${absVal.toFixed(1)}bn ${label}`
        : `${dirArrow(isGood)} ${sign}${absVal < 1 ? absVal.toFixed(1) : absVal.toFixed(0)} ${label}`
    pills.push({ text: formatted, isGood, icon: STAT_ICONS[key]?.icon })
  }

  for (const [key, value] of Object.entries(beat.factionImpact)) {
    if (!value) continue
    const isGood = (value as number) > 0
    const sign = value > 0 ? '+' : ''
    const label = FACTION_LABELS[key] ?? key
    const ficon = FACTION_ICONS[key as keyof typeof FACTION_ICONS]
    pills.push({
      text: `${dirArrow(isGood)} ${sign}${(value as number).toFixed(0)} ${label}`,
      isGood,
      icon: ficon?.icon,
    })
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
    <button
      type="button"
      className="p-4"
      onClick={onDismiss}
      style={{
        borderTop: '2px solid var(--accent-solid)',
        backgroundColor: 'transparent',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.4s ease',
        cursor: 'pointer',
        appearance: 'none',
        width: '100%',
        textAlign: 'left',
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
        <div
          className="flex flex-wrap gap-x-2 gap-y-0.5 mt-3 pt-3"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          {pills.map((p) => (
            <Pill key={p.text} text={p.text} isGood={p.isGood} icon={p.icon} />
          ))}
        </div>
      )}

      <div className="mt-3 text-[9px] text-center" style={{ color: 'var(--text-secondary)' }}>
        Click anywhere or wait to dismiss
      </div>
    </button>
  )
}

function EmptyEventState() {
  return (
    <div
      className="p-4 text-center"
      style={{
        backgroundColor: 'transparent',
        color: 'var(--text-secondary)',
      }}
    >
      No active event. Click "Advance Week" to advance.
    </div>
  )
}

function FinaleBadge({
  event,
  electionYearLabel,
}: {
  event: EventCardData
  electionYearLabel: number
}) {
  if (!event.id.startsWith('finale-')) return null

  const isElectionDay = event.id === 'finale-election-eve'
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '5px 8px',
        marginBottom: '12px',
        fontSize: '10px',
        fontFamily: "'Archivo Narrow', sans-serif",
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        background: 'var(--accent-solid)',
        color: 'var(--accent-on-solid)',
        borderRadius: '2px',
        animation: 'pulse-glow 1.5s ease-in-out infinite alternate',
      }}
    >
      {isElectionDay
        ? 'LIVE ELECTION COVERAGE'
        : `ELECTION ${isElectionDay ? 'DAY' : 'SEASON'} ${electionYearLabel}`}
    </div>
  )
}

function CampaignBadge({ electionYearLabel }: { electionYearLabel: number }) {
  return (
    <span
      style={{
        fontSize: '9px',
        fontWeight: 700,
        fontFamily: "'Archivo Narrow', sans-serif",
        letterSpacing: '0.06em',
        padding: '1px 5px',
        borderRadius: '2px',
        background: 'var(--accent-solid)',
        color: 'var(--accent-on-solid)',
        textTransform: 'uppercase',
      }}
    >
      ELECTION '{String(electionYearLabel).slice(2)}
    </span>
  )
}

// Only the archetypes with a matching, already-authored CAST_SPECS entry get
// a portrait here — the other NPCArchetypeKey values (union-leader,
// opposition-senator, diaspora-activist, oba-liaison, business-mogul) have no
// real spec yet, so they render without one rather than guessing a likeness.
const NPC_ARCHETYPE_TO_CHAR_ID: Partial<Record<NPCArchetypeKey, CharacterId>> = {
  journalist: 'neo',
  'youth-organiser': 'dayo',
  insider: 'smj',
}

function EventMeta({
  event,
  inCampaignMode,
  electionYearLabel,
}: {
  event: EventCardData
  inCampaignMode: boolean
  electionYearLabel: number
}) {
  const sevLabel = SEVERITY_GLYPH[event.severity] ?? { glyph: '•', color: 'var(--text-secondary)' }
  const isGodfather = event.category === 'godfather'
  const charId = isGodfather
    ? 'fashemu'
    : event.npcArchetype
      ? NPC_ARCHETYPE_TO_CHAR_ID[event.npcArchetype]
      : undefined

  return (
    <div className="flex items-center gap-2 mb-2">
      {charId && <BustPortrait charId={charId} size={28} />}
      {isGodfather ? (
        <span className="label-caps" style={{ color: '#8b0000' }}>
          Chief Fashemu
        </span>
      ) : (
        <span className="label-caps" style={{ color: sevLabel.color }}>
          {sevLabel.glyph} {sevLabel.label}
        </span>
      )}
      <span className="label-caps" style={{ color: 'var(--text-secondary)' }}>
        {event.category}
      </span>
      {inCampaignMode && <CampaignBadge electionYearLabel={electionYearLabel} />}
    </div>
  )
}

function ChoiceButton({ choice, onResolve }: { choice: Choice; onResolve: (id: string) => void }) {
  const pills = buildImpactPills(choice)
  return (
    <button
      type="button"
      onClick={() => onResolve(choice.id)}
      className="w-full text-left p-3 border transition-colors"
      style={{
        borderColor: 'var(--border)',
        backgroundColor: 'var(--background)',
        color: 'var(--text)',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-hover)')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--background)')}
    >
      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
        {choice.label}
      </span>
      {choice.description && (
        <p
          style={{
            fontSize: '11px',
            marginTop: '4px',
            lineHeight: 1.3,
            color: 'var(--text-secondary)',
          }}
        >
          {choice.description}
        </p>
      )}
      {pills.length > 0 && (
        <div
          className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1.5 pt-1.5"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          {pills.map((p) => (
            <Pill key={p.text} text={p.text} isGood={p.isGood} icon={p.icon} />
          ))}
        </div>
      )}
    </button>
  )
}

function EventChoices({
  event,
  onResolve,
}: {
  event: EventCardData
  onResolve: (id: string) => void
}) {
  return (
    <div className="space-y-2">
      {event.choices.map((choice) => (
        <ChoiceButton key={choice.id} choice={choice} onResolve={onResolve} />
      ))}
    </div>
  )
}

export function EventCard() {
  const activeEvent = useGameStore((s) => s.activeEvent)
  const inCampaignMode = useGameStore((s) => s.inCampaignMode)
  const consequenceBeats = useGameStore((s) => s.consequenceBeats)
  const resolveEvent = useGameStore((s) => s.resolveEvent)
  const dismissConsequenceBeat = useGameStore((s) => s.dismissConsequenceBeat)
  const currentTerm = useGameStore((s) => s.currentTerm)

  // Aftermath view — show first beat in queue
  if (!activeEvent && consequenceBeats.length > 0) {
    const beat = consequenceBeats[0]
    return <AftermathPanel beat={beat} onDismiss={dismissConsequenceBeat} />
  }

  // Empty state
  if (!activeEvent) {
    return <EmptyEventState />
  }

  // Active event view
  const isGodfather = activeEvent.category === 'godfather'
  const godfatherColor = '#8b0000'
  const accentColor = isGodfather ? godfatherColor : 'var(--accent-solid)'
  const eYear = electionYear(currentTerm)

  return (
    <div
      style={{
        borderTop: `2px solid ${accentColor}`,
        backgroundColor: 'transparent',
        ...(isGodfather ? { boxShadow: 'inset 0 0 0 1px rgba(139,0,0,0.15)' } : {}),
      }}
    >
      <div style={{ padding: '20px 24px' }}>
        <FinaleBadge event={activeEvent} electionYearLabel={eYear} />
        <EventMeta event={activeEvent} inCampaignMode={inCampaignMode} electionYearLabel={eYear} />

        <div
          style={{
            height: '1px',
            background: `linear-gradient(to right, transparent, ${accentColor}, transparent)`,
            margin: '6px 0 10px',
          }}
        />

        <h2
          className="font-display font-semibold"
          style={{ fontSize: '26px', color: 'var(--text)', lineHeight: 1.25 }}
        >
          {activeEvent.title}
        </h2>

        <p
          style={{ fontSize: '13px', lineHeight: 1.75, color: 'var(--text)', marginBottom: '16px' }}
        >
          {activeEvent.body}
        </p>

        <EventChoices event={activeEvent} onResolve={resolveEvent} />
      </div>
    </div>
  )
}
