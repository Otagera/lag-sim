import type { CSSProperties } from 'react'

import { useGameStore } from '../state/gameStore'
import { Seal } from './components/Seal'

type SituationTone = 'neutral' | 'success' | 'warning' | 'danger' | 'accent'

type SituationChip = {
  label: string
  value: string
  tone: SituationTone
  title: string
  priority: number
  tourId?: string
}

export type SituationBarProps = {
  termLabel: string
  monthLabel: string
  seasonLabel: string
  week: number
  currentTerm: number
  inCampaignMode: boolean
  onTick: () => void
  canTick: boolean
  onResearch: () => void
  onProjects: () => void
  onOpenReference: () => void
}

const toneStyles: Record<SituationTone, CSSProperties> = {
  neutral: {
    background: 'var(--surface)',
    borderColor: 'var(--border)',
    color: 'var(--text)',
  },
  success: {
    background: 'var(--success-3)',
    borderColor: 'var(--success-7)',
    color: 'var(--success-11)',
  },
  warning: {
    background: 'var(--warning-3)',
    borderColor: 'var(--warning-7)',
    color: 'var(--warning-11)',
  },
  danger: {
    background: 'var(--error-3)',
    borderColor: 'var(--error-7)',
    color: 'var(--error-11)',
  },
  accent: {
    background: 'var(--accent-3)',
    borderColor: 'var(--accent-solid)',
    color: 'var(--accent-text)',
  },
}

function formatCash(value: number) {
  const sign = value < 0 ? '-' : ''
  return `${sign}₦${Math.abs(value).toFixed(1)}bn`
}

function formatScore(value: number) {
  return `${Math.round(value)}`
}

function scoreTone(value: number, warning: number, danger: number): SituationTone {
  if (value <= danger) return 'danger'
  if (value <= warning) return 'warning'
  return 'neutral'
}

function pressureTone(value: number, warning: number, danger: number): SituationTone {
  if (value >= danger) return 'danger'
  if (value >= warning) return 'warning'
  return 'neutral'
}

function tonePriority(tone: SituationTone) {
  if (tone === 'danger') return 3
  if (tone === 'warning') return 2
  if (tone === 'accent') return 1
  return 0
}

function buildCoreChips(
  stats: ReturnType<typeof useGameStore.getState>['stats'],
  consecutiveDeficitWeeks: number,
) {
  const cashTone: SituationTone =
    stats.cashReserve < 0 || consecutiveDeficitWeeks >= 2
      ? 'danger'
      : stats.cashReserve < 15 || consecutiveDeficitWeeks > 0
        ? 'warning'
        : 'neutral'

  return [
    {
      label: 'Cash',
      value: formatCash(stats.cashReserve),
      tone: cashTone,
      title: 'Cash reserve and bankruptcy runway.',
      priority: 10 + tonePriority(cashTone),
      tourId: 'cash-chip',
    },
    {
      label: 'Trust',
      value: `${Math.round(stats.publicTrust)}%`,
      tone: scoreTone(stats.publicTrust, 40, 25),
      title: 'Public approval. Very low trust can fuel mass uprising risk.',
      priority: 9 + tonePriority(scoreTone(stats.publicTrust, 40, 25)),
      tourId: 'trust-chip',
    },
    {
      label: 'PC',
      value: formatScore(stats.politicalCapital),
      tone: scoreTone(stats.politicalCapital, 25, 10),
      title: 'Political capital available for hard choices.',
      priority: 8 + tonePriority(scoreTone(stats.politicalCapital, 25, 10)),
      tourId: 'pc-chip',
    },
  ]
}

function buildChipAlerts(
  stats: ReturnType<typeof useGameStore.getState>['stats'],
  emergencySuspensionWeeks: number,
  litigationActive: boolean,
  litigationTimer: number,
  inCampaignMode: boolean,
): SituationChip[] {
  const alerts: SituationChip[] = []

  if (emergencySuspensionWeeks > 0)
    alerts.push({
      label: 'Suspended',
      value: `${emergencySuspensionWeeks}w`,
      tone: 'danger' as const,
      title: 'Emergency suspension is active.',
      priority: 30,
    })
  if (litigationActive)
    alerts.push({
      label: 'Court clock',
      value: `${litigationTimer}w`,
      tone: 'warning' as const,
      title: 'Judicial litigation arc is active.',
      priority: 24,
    })
  if (inCampaignMode)
    alerts.push({
      label: "Election '27",
      value: 'Live',
      tone: 'accent' as const,
      title: 'Campaign mode is active.',
      priority: 22,
    })

  {
    const t = scoreTone(stats.securityIndex, 50, 35)
    if (t !== 'neutral')
      alerts.push({
        label: 'Security',
        value: formatScore(stats.securityIndex),
        tone: t,
        title: 'Security risk is elevated.',
        priority: 20 + tonePriority(t),
      })
  }

  {
    const t = scoreTone(stats.federalRelationship + 50, 30, 15)
    if (t !== 'neutral')
      alerts.push({
        label: 'Federal',
        value: formatScore(stats.federalRelationship),
        tone: t,
        title: 'Relationship with Abuja is under strain.',
        priority: 19 + tonePriority(t),
      })
  }

  {
    const t = pressureTone(stats.corruptionPressure, 60, 70)
    if (t !== 'neutral')
      alerts.push({
        label: 'Corruption',
        value: formatScore(stats.corruptionPressure),
        tone: t,
        title: 'Corruption pressure is high.',
        priority: 18 + tonePriority(t),
      })
  }

  {
    const t = pressureTone(stats.youthTension, 65, 80)
    if (t !== 'neutral')
      alerts.push({
        label: 'Youth',
        value: formatScore(stats.youthTension),
        tone: t,
        title: 'Youth tension is high.',
        priority: 17 + tonePriority(t),
      })
  }

  alerts.sort((a, b) => b.priority - a.priority)
  return alerts
}

function buildSituationChips({
  inCampaignMode,
  stats,
  consecutiveDeficitWeeks,
  emergencySuspensionWeeks,
  litigationActive,
  litigationTimer,
}: {
  inCampaignMode: boolean
  stats: ReturnType<typeof useGameStore.getState>['stats']
  consecutiveDeficitWeeks: number
  emergencySuspensionWeeks: number
  litigationActive: boolean
  litigationTimer: number
}) {
  const core = buildCoreChips(stats, consecutiveDeficitWeeks)
  const alerts = buildChipAlerts(
    stats,
    emergencySuspensionWeeks,
    litigationActive,
    litigationTimer,
    inCampaignMode,
  )
  return [...core, ...alerts.slice(0, 2)]
}

function SituationChipView({ chip }: { chip: SituationChip }) {
  return (
    <div
      title={chip.title}
      data-tour={chip.tourId}
      style={{
        ...toneStyles[chip.tone],
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: 6,
        // Longhands, not the `border` shorthand — the shorthand would reset
        // border-color back to currentColor and clobber the tone's borderColor.
        borderWidth: '1px',
        borderStyle: 'solid',
        borderRadius: 999,
        padding: '5px 9px',
        minWidth: 0,
        whiteSpace: 'nowrap',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      <span className="label-caps" style={{ color: 'var(--text-secondary)' }}>
        {chip.label}
      </span>
      <span style={{ fontFamily: "'Archivo Narrow', sans-serif", fontSize: 14, fontWeight: 700 }}>
        {chip.value}
      </span>
    </div>
  )
}

function ToolButton({
  label,
  title,
  onClick,
}: {
  label: string
  title: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        background: 'transparent',
        border: '1px solid var(--border)',
        borderRadius: 999,
        color: 'var(--text-secondary)',
        cursor: 'pointer',
        fontFamily: "'Archivo Narrow', sans-serif",
        fontSize: 11,
        padding: '6px 10px',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  )
}

export function SituationBar({
  termLabel,
  monthLabel,
  seasonLabel,
  week,
  currentTerm,
  inCampaignMode,
  onTick,
  canTick,
  onResearch,
  onProjects,
  onOpenReference,
}: SituationBarProps) {
  const stats = useGameStore((s) => s.stats)
  const consecutiveDeficitWeeks = useGameStore((s) => s.consecutiveDeficitWeeks)
  const emergencySuspensionWeeks = useGameStore((s) => s.emergencySuspensionWeeks)
  const litigationActive = useGameStore((s) => s.litigationActive)
  const litigationTimer = useGameStore((s) => s.litigationTimer)

  const chips = buildSituationChips({
    inCampaignMode,
    stats,
    consecutiveDeficitWeeks,
    emergencySuspensionWeeks,
    litigationActive,
    litigationTimer,
  })

  // The pill shows one concise tag; seasonLabel can be a long `·`-joined
  // compound (e.g. "Rainy Season · Federal Election Year · Sallah"), so take
  // the leading tag for the pill and keep the full string in the tooltip.
  const fullPhase =
    emergencySuspensionWeeks > 0 ? 'EMERGENCY ADMIN' : inCampaignMode ? 'CAMPAIGN' : seasonLabel
  const phaseLabel =
    emergencySuspensionWeeks > 0
      ? 'EMERGENCY ADMIN'
      : inCampaignMode
        ? 'CAMPAIGN'
        : seasonLabel.split(' · ')[0]

  return (
    <header className="themed situation-bar">
      <div className="situation-brand">
        <Seal size={30} />
        <div style={{ minWidth: 0 }}>
          <div className="font-display situation-title">Lagos Governor Sim</div>
          <div className="situation-meta" title={`Week ${week}`}>
            <strong>Week {week}</strong>
            <span> · {monthLabel}</span>
            <span className="situation-brand-meta-extra"> · {termLabel}</span>
          </div>
        </div>
      </div>

      <div className="situation-phase" title={`Term ${currentTerm}: ${fullPhase}`}>
        {phaseLabel}
      </div>

      <div className="situation-chip-row">
        {chips.map((chip) => (
          <SituationChipView key={chip.label} chip={chip} />
        ))}
      </div>

      <div className="situation-actions">
        <button
          type="button"
          onClick={onOpenReference}
          title="Quick Reference"
          aria-label="Quick Reference"
          style={{
            background: 'var(--accent-3)',
            border: '1px solid var(--accent-solid)',
            borderRadius: 999,
            color: 'var(--accent-text)',
            cursor: 'pointer',
            fontFamily: "'Archivo Narrow', sans-serif",
            fontSize: 13,
            fontWeight: 700,
            padding: '6px 10px',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            lineHeight: 1,
          }}
        >
          ?
        </button>
        <div className="situation-secondary-actions">
          <ToolButton label="Research" title="Commission the Future" onClick={onResearch} />
          <ToolButton label="Projects" title="Build / Govern" onClick={onProjects} />
        </div>
        <button
          type="button"
          onClick={onTick}
          disabled={!canTick}
          data-tour="next-week"
          className="situation-primary-action"
          title={canTick ? 'Advance the simulation by one week' : 'The game has ended'}
        >
          {canTick ? 'Advance Week' : 'Game Over'}
        </button>
      </div>
    </header>
  )
}
