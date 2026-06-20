import { useGameStore } from '../state/gameStore'
import { formatGameDate } from '../utils/calendar'

function StatCard({
  label,
  value,
  format,
}: {
  label: string
  value: number
  format?: (v: number) => string
}) {
  const fmt = format ?? ((v) => v.toFixed(1))
  return (
    <div className="p-2 border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
      <p className="label-caps">{label}</p>
      <p className="text-[15px] font-semibold mt-0.5" style={{ color: 'var(--text)' }}>{fmt(value)}</p>
    </div>
  )
}

const naira = (v: number) => `₦${v.toFixed(1)}bn`

export const TERMS = ['First Term', 'Second Term', 'Third Term', 'Fourth Term'] as const

export function Dashboard() {
  const week = useGameStore((s) => s.week)
  const cashReserve = useGameStore((s) => s.stats.cashReserve)
  const publicTrust = useGameStore((s) => s.stats.publicTrust)
  const politicalCapital = useGameStore((s) => s.stats.politicalCapital)
  const stats = useGameStore((s) => s.stats)
  const mode = useGameStore((s) => s.mode)

  // const year = Math.ceil(week / 52)
  // const weekOfYear = ((week - 1) % 52) + 1
  // const termLabel = TERMS[Math.min(year - 1, TERMS.length - 1)]
  void 0 // placeholder for term/year display

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      <StatCard label="Date" value={week} format={(_v) => formatGameDate(week)} />
      <StatCard label="Cash" value={cashReserve} format={naira} />
      <StatCard label="Trust" value={publicTrust} format={(v) => `${v.toFixed(0)}%`} />
      <StatCard label="Pol. Cap" value={politicalCapital} format={(v) => `${v}/200`} />
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
