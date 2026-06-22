import { useEffect } from 'react'
import { useGameStore } from '../state/gameStore'
import { CONSTITUENCIES } from '../data/constituencies'
import { formatGameDate } from '../utils/calendar'
import type { ConstituencyKey } from '../state/types'

function deltaStr(v: number): string {
  return v >= 0 ? `+${v.toFixed(0)}` : `${v.toFixed(0)}`
}

function arrow(v: number): string {
  return v > 0.5 ? '\u25B2' : v < -0.5 ? '\u25BC' : '\u2014'
}

function moodColour(v: number): string {
  return v > 0.5 ? 'var(--success-11)' : v < -0.5 ? 'var(--error-11)' : 'var(--text-secondary)'
}

type Props = {
  onClose: () => void
}

export function LagosHerald({ onClose }: Props) {
  const week = useGameStore((s) => s.week)
  const timeline = useGameStore((s) => s.timeline)
  const lastWeekRevenue = useGameStore((s) => s.lastWeekRevenue)
  const lastWeekSpend = useGameStore((s) => s.lastWeekExpenditure)
  const snapshot = useGameStore((s) => s.lastWeekStatSnapshot)
  const trust = useGameStore((s) => s.stats.publicTrust)
  const polCap = useGameStore((s) => s.stats.politicalCapital)
  const approvalHistory = useGameStore((s) => s.approvalHistory)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const prevWeek = week - 1

  const leadEntry =
    timeline.findLast((e) => e.type === 'event' && e.week === prevWeek) ??
    timeline.findLast((e) => e.type === 'delayed-consequence' && e.week === week) ??
    null

  const netFlow = lastWeekRevenue && lastWeekSpend
    ? lastWeekRevenue.total - lastWeekSpend.total
    : null

  const deltas = (Object.keys(approvalHistory) as ConstituencyKey[])
    .map((key) => {
      const hist = approvalHistory[key]
      if (hist.length < 2) return null
      return { key, delta: (hist.at(-1) ?? 0) - (hist.at(-2) ?? 0) }
    })
    .filter(Boolean) as { key: ConstituencyKey; delta: number }[]

  const topGain = deltas.length > 0
    ? deltas.reduce((a, b) => (b.delta > a.delta ? b : a), deltas[0])
    : null
  const topLoss = deltas.length > 0
    ? deltas.reduce((a, b) => (b.delta < a.delta ? b : a), deltas[0])
    : null

  const trustDelta = snapshot ? trust - snapshot.publicTrust : 0
  const pcDelta = snapshot ? polCap - snapshot.politicalCapital : 0

  const lgaLabel = (key: ConstituencyKey): string =>
    CONSTITUENCIES.find((c) => c.key === key)?.label ?? key

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8 overflow-y-auto" style={{ backgroundColor: 'rgba(43,47,44,0.85)' }}>
      <div className="w-full max-w-2xl border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)' }}>
        {/* Masthead */}
        <div className="px-6 py-4" style={{ borderBottom: '2px solid var(--accent-solid)' }}>
          <p className="label-caps" style={{ color: 'var(--text-secondary)' }}>
            ISSUE {week - 1 === 0 ? 1 : week - 1}
          </p>
          <h1 className="font-display text-xl font-bold mt-0.5" style={{ color: 'var(--text)' }}>
            THE LAGOS HERALD
          </h1>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {formatGameDate(week)}
          </p>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Lead Story */}
          {leadEntry ? (
            <section>
              <h2 className="font-display text-base font-semibold leading-snug" style={{ color: 'var(--text)' }}>
                {leadEntry.title}
              </h2>
              <p className="text-[11px] mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {leadEntry.description}
              </p>
            </section>
          ) : (
            <section>
              <h2 className="font-display text-base font-semibold" style={{ color: 'var(--text)' }}>
                Quiet week in Government House
              </h2>
              <p className="text-[11px] mt-1" style={{ color: 'var(--text-secondary)' }}>
                No major developments were reported this week.
              </p>
            </section>
          )}

          {/* Two-column: Fiscal Digest + District Pulse */}
          <div className="grid grid-cols-2 gap-4">
            {/* Fiscal Digest */}
            <section>
              <h3 className="label-caps mb-2" style={{ color: 'var(--text-secondary)' }}>
                FISCAL WEEK
              </h3>
              <div className="p-3 space-y-1.5 text-[11px] border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>Revenue</span>
                  <span className="font-medium" style={{ color: 'var(--success-11)' }}>
                    ₦{lastWeekRevenue ? lastWeekRevenue.total.toFixed(1) : '–'}bn
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>Expenditure</span>
                  <span className="font-medium" style={{ color: 'var(--error-11)' }}>
                    ₦{lastWeekSpend ? lastWeekSpend.total.toFixed(1) : '–'}bn
                  </span>
                </div>
                <div className="flex justify-between font-semibold pt-1" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text)' }}>Net</span>
                  <span style={{ color: netFlow !== null ? (netFlow >= 0 ? 'var(--success-11)' : 'var(--error-11)') : 'var(--text-secondary)' }}>
                    {netFlow !== null ? `${netFlow >= 0 ? '+' : ''}${netFlow.toFixed(1)}bn` : '–'}
                    {' '}{netFlow !== null ? arrow(netFlow) : ''}
                  </span>
                </div>
              </div>
            </section>

            {/* District Pulse */}
            <section>
              <h3 className="label-caps mb-2" style={{ color: 'var(--text-secondary)' }}>
                DISTRICTS
              </h3>
              <div className="p-3 space-y-1.5 text-[11px] border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
                {topGain ? (
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-secondary)' }}>{lgaLabel(topGain.key)}</span>
                    <span className="font-medium" style={{ color: 'var(--success-11)' }}>
                      {deltaStr(topGain.delta)}pts {arrow(topGain.delta)}
                    </span>
                  </div>
                ) : (
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-secondary)' }}>Building data</span>
                    <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>–</span>
                  </div>
                )}
                <div className="flex justify-between pt-1" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  {topLoss && topLoss.key !== topGain?.key ? (
                    <>
                      <span style={{ color: 'var(--text-secondary)' }}>{lgaLabel(topLoss.key)}</span>
                      <span className="font-medium" style={{ color: 'var(--error-11)' }}>
                        {deltaStr(topLoss.delta)}pts {arrow(topLoss.delta)}
                      </span>
                    </>
                  ) : deltas.length > 1 ? (
                    <>
                      <span style={{ color: 'var(--text-secondary)' }}>{lgaLabel(topGain!.key)}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>–</span>
                    </>
                  ) : (
                    <>
                      <span style={{ color: 'var(--text-secondary)' }}>Building data</span>
                      <span style={{ color: 'var(--text-secondary)' }}>–</span>
                    </>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* Mood line */}
          <section>
            <h3 className="label-caps mb-2" style={{ color: 'var(--text-secondary)' }}>
              MOOD
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex justify-between items-center px-3 py-2 border text-[11px]" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Public Trust</span>
                <span>
                  <span className="font-medium" style={{ color: 'var(--text)' }}>{trust.toFixed(0)}%</span>
                  <span className="ml-1.5" style={{ color: moodColour(trustDelta) }}>
                    {deltaStr(trustDelta)}
                  </span>
                </span>
              </div>
              <div className="flex justify-between items-center px-3 py-2 border text-[11px]" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Pol. Capital</span>
                <span>
                  <span className="font-medium" style={{ color: 'var(--text)' }}>{polCap.toFixed(0)}</span>
                  <span className="ml-1.5" style={{ color: moodColour(pcDelta) }}>
                    {deltaStr(pcDelta)}
                  </span>
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* Footer CTA */}
        <div className="px-6 py-4 flex justify-end" style={{ borderTop: '1px solid var(--border)' }}>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 text-sm font-semibold transition-colors"
            style={{ backgroundColor: 'var(--accent-solid)', color: 'var(--accent-on-solid)' }}
          >
            Continue Governing &rarr;
          </button>
        </div>
      </div>
    </div>
  )
}
