import { useGameStore } from '../state/gameStore'

function StatCard({
  label,
  value,
  format,
  detail,
}: {
  label: string
  value: number
  format?: (v: number) => string
  detail?: string
}) {
  const fmt = format ?? ((v) => v.toFixed(1))
  return (
    <div className="rounded-lg bg-gray-800 p-3">
      <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-white">{fmt(value)}</p>
      {detail && <p className="text-[10px] text-gray-500 mt-0.5">{detail}</p>}
    </div>
  )
}

const naira = (v: number) => `₦${v.toFixed(1)}bn`

export function Dashboard() {
  const week = useGameStore((s) => s.week)
  const cashReserve = useGameStore((s) => s.stats.cashReserve)
  const publicTrust = useGameStore((s) => s.stats.publicTrust)
  const politicalCapital = useGameStore((s) => s.stats.politicalCapital)

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <StatCard label="Week" value={week} format={(v) => String(v)} detail="Term ends week 208" />
      <StatCard label="Cash Reserve" value={cashReserve} format={naira} />
      <StatCard label="Public Trust" value={publicTrust} format={(v) => `${v}%`} />
      <StatCard label="Political Capital" value={politicalCapital} format={(v) => `${v}/200`} />
    </div>
  )
}
