import { useCallback, useEffect, useState } from 'react'
import { SERVER_BASE_URL } from '../../config'

interface LabelCount {
  label: string
  count: number
}

interface AnalyticsAggregates {
  total_sessions: number
  average_week: number
  death_cause_distribution: LabelCount[]
  archetype_distribution: LabelCount[]
  goal_distribution: LabelCount[]
}

interface LeaderboardEntry {
  session_id: string
  week: number
  archetype?: string
  game_over_type?: string
  reached_second_term: boolean
}

type AsyncState<T> =
  | { status: 'idle' | 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: T }

function DistributionBar({ label, count, max }: { label: string; count: number; max: number }) {
  const pct = max > 0 ? (count / max) * 100 : 0
  return (
    <div className="flex items-center gap-2 text-[11px]" style={{ height: 20 }}>
      <span style={{ color: 'var(--text)', minWidth: 120, textAlign: 'right' as const }}>
        {label}
      </span>
      <div
        className="flex-1"
        style={{ backgroundColor: 'var(--neutral-4)', height: 12, borderRadius: 2, overflow: 'hidden' }}
      >
        <div
          style={{
            width: `${Math.max(pct, 2)}%`,
            height: '100%',
            backgroundColor: 'var(--accent-9)',
            borderRadius: 2,
            transition: 'width 0.3s',
          }}
        />
      </div>
      <span style={{ color: 'var(--text-secondary)', minWidth: 24, textAlign: 'right' as const }}>
        {count}
      </span>
    </div>
  )
}

function DistributionSection({ title, data }: { title: string; data: LabelCount[] }) {
  if (data.length === 0) return null
  const max = Math.max(...data.map((d) => d.count))
  return (
    <div className="mb-4">
      <p className="text-[10px] font-bold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
        {title}
      </p>
      {data.map((d) => (
        <DistributionBar key={d.label} label={d.label} count={d.count} max={max} />
      ))}
    </div>
  )
}

function LeaderboardTable({ entries }: { entries: LeaderboardEntry[] }) {
  if (entries.length === 0) return <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>No leaderboard data</p>
  return (
    <div>
      <p className="text-[10px] font-bold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
        Leaderboard
      </p>
      <div style={{ maxHeight: 400, overflowY: 'auto' }}>
        <table className="w-full text-[10px]">
          <thead>
            <tr style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>
              <th className="text-left py-1 pr-2">Week</th>
              <th className="text-left py-1 pr-2">Archetype</th>
              <th className="text-left py-1 pr-2">Outcome</th>
              <th className="text-left py-1">2nd Term</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e, i) => (
              <tr key={e.session_id ?? i} style={{ borderBottom: '1px solid var(--border)' }}>
                <td className="py-1 pr-2" style={{ color: 'var(--text)' }}>{e.week}</td>
                <td className="py-1 pr-2" style={{ color: 'var(--text)' }}>{e.archetype ?? '—'}</td>
                <td className="py-1 pr-2" style={{ color: 'var(--text)' }}>{e.game_over_type ?? '—'}</td>
                <td className="py-1" style={{ color: e.reached_second_term ? 'var(--success-11)' : 'var(--text-secondary)' }}>
                  {e.reached_second_term ? 'Yes' : 'No'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function AnalyticsTab() {
  const [aggregates, setAggregates] = useState<AsyncState<AnalyticsAggregates>>({ status: 'loading' })
  const [leaderboard, setLeaderboard] = useState<AsyncState<LeaderboardEntry[]>>({ status: 'loading' })

  const fetchAll = useCallback(() => {
    setAggregates({ status: 'loading' })
    setLeaderboard({ status: 'loading' })

    fetch(`${SERVER_BASE_URL}/api/v1/analytics/aggregates`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json() as Promise<AnalyticsAggregates>
      })
      .then((data) => setAggregates({ status: 'success', data }))
      .catch((e: Error) => setAggregates({ status: 'error', message: e.message }))

    fetch(`${SERVER_BASE_URL}/api/v1/analytics/leaderboard?limit=50`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json() as Promise<LeaderboardEntry[]>
      })
      .then((data) => setLeaderboard({ status: 'success', data }))
      .catch((e: Error) => setLeaderboard({ status: 'error', message: e.message }))
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>Analytics from server</p>
        <button
          type="button"
          onClick={fetchAll}
          className="px-2 py-1 text-[10px] font-medium border"
          style={{ borderColor: 'var(--border)', color: 'var(--text)', backgroundColor: 'var(--surface)' }}
        >
          Refresh
        </button>
      </div>

      {aggregates.status === 'loading' && <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>Loading aggregates...</p>}
      {aggregates.status === 'error' && <p className="text-[11px]" style={{ color: 'var(--error-11)' }}>Error: {aggregates.message}</p>}
      {aggregates.status === 'success' && (
        <>
          <div className="flex gap-3 mb-4">
            <div className="flex-1 p-2 border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
              <p className="text-[18px] font-bold" style={{ color: 'var(--text)' }}>{aggregates.data.total_sessions}</p>
              <p className="text-[9px]" style={{ color: 'var(--text-secondary)' }}>Sessions</p>
            </div>
            <div className="flex-1 p-2 border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
              <p className="text-[18px] font-bold" style={{ color: 'var(--text)' }}>{aggregates.data.average_week.toFixed(1)}</p>
              <p className="text-[9px]" style={{ color: 'var(--text-secondary)' }}>Avg Week</p>
            </div>
          </div>

          <DistributionSection title="Death Cause" data={aggregates.data.death_cause_distribution} />
          <DistributionSection title="Archetype" data={aggregates.data.archetype_distribution} />
          <DistributionSection title="Goal" data={aggregates.data.goal_distribution} />
        </>
      )}

      {leaderboard.status === 'loading' && <p className="text-[11px] mt-2" style={{ color: 'var(--text-secondary)' }}>Loading leaderboard...</p>}
      {leaderboard.status === 'error' && <p className="text-[11px] mt-2" style={{ color: 'var(--error-11)' }}>Error: {leaderboard.message}</p>}
      {leaderboard.status === 'success' && <LeaderboardTable entries={leaderboard.data} />}
    </div>
  )
}
