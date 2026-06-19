import { useState } from 'react'
import { useGameStore } from '../state/gameStore'
import type { FactionDelta, FactionKey, StatDelta, StatKey, TimelineEntry } from '../state/types'

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
      className={`inline-flex items-center rounded px-1 py-px text-[9px] font-medium ${
        positive ? 'bg-green-900/60 text-green-300' : 'bg-red-900/60 text-red-300'
      }`}
    >
      {positive ? '+' : ''}
      {value.toFixed(0)} {label}
    </span>
  )
}

function DeltaRow({ statDelta, factionDelta }: { statDelta?: StatDelta; factionDelta?: FactionDelta }) {
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

const TYPE_STYLE: Record<TimelineEntry['type'], { dot: string; label: string }> = {
  event: { dot: 'bg-blue-500', label: 'Decision' },
  'delayed-consequence': { dot: 'bg-yellow-500', label: 'Consequence' },
  godfather: { dot: 'bg-purple-500', label: 'Godfather' },
  milestone: { dot: 'bg-green-500', label: 'Milestone' },
}

const PAGE_SIZE = 10

export function TimelinePanel() {
  const timeline = useGameStore((s) => s.timeline)
  const [page, setPage] = useState(0)

  if (timeline.length === 0) {
    return (
      <div className="rounded-lg bg-gray-800 p-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">Decision Log</h3>
        <p className="text-gray-500 text-xs">No decisions yet. Click "Next Week" to begin.</p>
      </div>
    )
  }

  const reversed = [...timeline].reverse()
  const totalPages = Math.ceil(reversed.length / PAGE_SIZE)
  const visible = reversed.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  return (
    <div className="rounded-lg bg-gray-800 p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[11px] font-semibold text-gray-400 uppercase">
          Decision Log ({timeline.length})
        </h3>
        {totalPages > 1 && (
          <div className="flex items-center gap-1 text-[10px] text-gray-500">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="px-1 rounded hover:bg-gray-700 disabled:opacity-30"
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
              className="px-1 rounded hover:bg-gray-700 disabled:opacity-30"
            >
              ›
            </button>
          </div>
        )}
      </div>

      <div className="space-y-2.5">
        {visible.map((entry, i) => {
          const style = TYPE_STYLE[entry.type]
          return (
            <div
              key={`${entry.week}-${entry.title}-${i}`}
              className="flex gap-2.5"
            >
              <div className="flex flex-col items-center gap-1 pt-1 shrink-0">
                <div className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                <div className="w-px flex-1 bg-gray-700 min-h-[12px]" />
              </div>
              <div className="pb-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[9px] text-gray-600">Wk {entry.week}</span>
                  <span className={`text-[9px] font-semibold uppercase tracking-wide ${
                    entry.type === 'delayed-consequence' ? 'text-yellow-600' :
                    entry.type === 'godfather' ? 'text-purple-500' : 'text-blue-500'
                  }`}>
                    {style.label}
                  </span>
                </div>
                <p className="text-white text-xs font-medium leading-tight mt-0.5">{entry.title}</p>
                <p className="text-gray-400 text-[10px] mt-0.5 leading-snug">{entry.description}</p>
                <DeltaRow statDelta={entry.statDelta} factionDelta={entry.factionDelta} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
