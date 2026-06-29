import { useGameStore } from '../state/gameStore'
import { formatGameDate } from '../utils/calendar'
import { calculateVoteShare } from '../engine/electionEngine'

function StatCard({
  label,
  value,
  format,
  delta,
}: {
  label: string
  value: number
  format?: (v: number) => string
  delta?: number
}) {
  const fmt = format ?? ((v) => v.toFixed(1))
  return (
    <div className="p-2 border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
      <p className="label-caps">{label}</p>
      <div className="flex items-baseline gap-1.5 mt-0.5">
        <p className="text-[15px] font-semibold" style={{ color: 'var(--text)' }}>{fmt(value)}</p>
        {delta !== undefined && Math.abs(delta) >= 0.1 && (
          <span
            className="text-[9px] font-semibold"
            style={{ color: delta > 0 ? 'var(--success-11)' : 'var(--error-11)' }}
          >
            {delta > 0 ? '↑' : '↓'}{Math.abs(delta) < 1 ? Math.abs(delta).toFixed(1) : Math.abs(delta).toFixed(0)}
          </span>
        )}
      </div>
    </div>
  )
}

const naira = (v: number) => `₦${v.toFixed(1)}bn`

export const YEARS = ['Year 1', 'Year 2', 'Year 3', 'Year 4'] as const

export function Dashboard() {
  const week = useGameStore((s) => s.week)
  const cashReserve = useGameStore((s) => s.stats.cashReserve)
  const publicTrust = useGameStore((s) => s.stats.publicTrust)
  const politicalCapital = useGameStore((s) => s.stats.politicalCapital)
  const stats = useGameStore((s) => s.stats)
  const mode = useGameStore((s) => s.mode)
  const snap = useGameStore((s) => s.lastWeekStatSnapshot)
  const inCampaignMode = useGameStore((s) => s.inCampaignMode)

  const cashDelta = snap ? cashReserve - snap.cashReserve : undefined
  const trustDelta = snap ? publicTrust - snap.publicTrust : undefined
  const polCapDelta = snap ? politicalCapital - snap.politicalCapital : undefined

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      <StatCard label="Date" value={week} format={(_v) => formatGameDate(week)} />
      <StatCard label="Cash" value={cashReserve} format={naira} delta={cashDelta} />
      <StatCard label="Trust" value={publicTrust} format={(v) => `${v.toFixed(0)}%`} delta={trustDelta} />
      <StatCard label="Pol. Cap" value={politicalCapital} format={(v) => `${v}/200`} delta={polCapDelta} />
      {inCampaignMode && (
        <StatCard label="Vote Share" value={calculateVoteShare(useGameStore.getState())} format={(v) => `${v.toFixed(0)}%`} />
      )}
      {mode === 'detailed' && (
        <>
          <StatCard label="IGR" value={stats.igr} format={(v) => `₦${v.toFixed(1)}bn`} />
          <StatCard
            label="Expenditure"
            value={stats.expenditure}
            format={(v) => `₦${v.toFixed(1)}bn`}
          />
          <StatCard
            label="Infrastructure"
            value={stats.infrastructureScore}
            format={(v) => `${v.toFixed(1)}/100`}
          />
          <StatCard
            label="Security"
            value={stats.securityIndex}
            format={(v) => `${v.toFixed(1)}/100`}
          />
          <StatCard
            label="Youth Tension"
            value={stats.youthTension}
            format={(v) => `${v.toFixed(1)}/100`}
          />
          <StatCard
            label="Federal Rel."
            value={stats.federalRelationship}
            format={(v) => v.toFixed(1)}
          />
          <StatCard
            label="Corruption"
            value={stats.corruptionPressure}
            format={(v) => `${v.toFixed(1)}%`}
          />
        </>
      )}
    </div>
  )
}
