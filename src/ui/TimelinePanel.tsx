import { useState } from 'react'
import { useGameStore } from '../state/gameStore'
import type { FactionDelta, FactionKey, StatDelta, StatKey, TimelineEntry } from '../state/types'
import { formatGameDate } from '../utils/calendar'

const STAT_LABEL: Partial<Record<StatKey, string>> = {
  cashReserve: 'Cash',
  publicTrust: 'Trust',
  politicalCapital: 'PolCap',
  infrastructureScore: 'Infra',
  securityIndex: 'Security',
  corruptionPressure: 'Corruption',
  youthTension: 'Youth Tension',
  federalRelationship: 'Fed. Rel.',
  igr: 'IGR',
  expenditure: 'Spending',
}

const FACTION_LABEL: Record<FactionKey, string> = {
  businessCommunity: 'Business',
  informalEconomy: 'Informal',
  partyGodfathers: 'Godfather',
  federalGovt: 'Federal',
  civilSocietyMedia: 'CivSoc',
  lgChairmen: 'LG',
}

function DeltaTag({ label, value }: { label: string; value: number }) {
  const positive = value > 0
  return (
    <span
      className="inline-flex items-center px-1 py-px text-[9px] font-medium"
      style={{
        backgroundColor: positive ? 'var(--success-3)' : 'var(--error-3)',
        color: positive ? 'var(--success-11)' : 'var(--error-11)',
      }}
    >
      {positive ? '+' : ''}
      {value.toFixed(0)} {label}
    </span>
  )
}

function DeltaRow({
  statDelta,
  factionDelta,
}: {
  statDelta?: StatDelta
  factionDelta?: FactionDelta
}) {
  const statTags = statDelta
    ? (Object.entries(statDelta) as [StatKey, number][])
        .filter(([, v]) => v !== 0)
        .map(([k, v]) => ({ label: STAT_LABEL[k] ?? k, value: v }))
    : []

  const factionTags = factionDelta
    ? (Object.entries(factionDelta) as [FactionKey, number][])
        .filter(([, v]) => v !== undefined && v !== 0)
        .map(([k, v]) => ({ label: FACTION_LABEL[k] ?? k, value: v as number }))
    : []

  const all = [...statTags, ...factionTags]
  if (all.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {all.map(({ label, value }) => (
        <DeltaTag key={label} label={label} value={value} />
      ))}
    </div>
  )
}

const TYPE_DOT: Record<TimelineEntry['type'], string> = {
  event: 'var(--info-9)',
  'delayed-consequence': 'var(--warning-9)',
  godfather: 'var(--accent-solid)',
  milestone: 'var(--success-9)',
}

const TYPE_LABEL: Record<TimelineEntry['type'], string> = {
  event: 'Decision',
  'delayed-consequence': 'Consequence',
  godfather: 'Godfather',
  milestone: 'Milestone',
}

const PAGE_SIZE = 10

type TimelineEntryWithStableId = TimelineEntry & {
  id?: string
  kind?: string
}

function timelineEntryKey(entry: TimelineEntry): string {
  const keyedEntry: TimelineEntryWithStableId = entry
  return `${entry.week}-${entry.title}-${keyedEntry.id ?? keyedEntry.kind ?? entry.type}`
}

export function TimelinePanel() {
  const timeline = useGameStore((s) => s.timeline)
  const [page, setPage] = useState(0)

  if (timeline.length === 0) {
    return (
      <div
        className="p-4 border"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
      >
        <h3 className="label-caps mb-2">Decision Log</h3>
        <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
          No decisions yet. Click "Next Week" to begin.
        </p>
      </div>
    )
  }

  const reversed = [...timeline].reverse()
  const totalPages = Math.ceil(reversed.length / PAGE_SIZE)
  const visible = reversed.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  return (
    <div
      className="p-3 border"
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="label-caps">Decision Log ({timeline.length})</h3>
        {totalPages > 1 && (
          <div
            className="flex items-center gap-1 text-[10px]"
            style={{ color: 'var(--text-secondary)' }}
          >
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="px-1 disabled:opacity-30"
            >
              ‹
            </button>
            <span>
              {page + 1}/{totalPages}
            </span>
            <button
              type="button"
              disabled={page === totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="px-1 disabled:opacity-30"
            >
              ›
            </button>
          </div>
        )}
      </div>

      <div className="space-y-2.5">
        {visible.map((entry) => (
          <div key={timelineEntryKey(entry)} className="flex gap-2.5">
            <div className="flex flex-col items-center gap-1 pt-1 shrink-0">
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: TYPE_DOT[entry.type] }}
              />
              <div
                className="w-px flex-1 min-h-[12px]"
                style={{ backgroundColor: 'var(--border)' }}
              />
            </div>
            <div className="pb-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[9px]" style={{ color: 'var(--border-strong)' }}>
                  {formatGameDate(entry.week)}
                </span>
                <span
                  className="text-[9px] font-semibold uppercase tracking-wide"
                  style={{ color: TYPE_DOT[entry.type] }}
                >
                  {TYPE_LABEL[entry.type]}
                </span>
              </div>
              <p
                className="text-[12px] font-semibold leading-tight mt-0.5"
                style={{ color: 'var(--text)' }}
              >
                {entry.title}
              </p>
              <p
                className="text-[10px] mt-0.5 leading-snug"
                style={{ color: 'var(--text-secondary)' }}
              >
                {entry.description}
              </p>
              <DeltaRow statDelta={entry.statDelta} factionDelta={entry.factionDelta} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
