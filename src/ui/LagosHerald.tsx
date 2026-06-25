import { useEffect } from 'react'
import { useGameStore } from '../state/gameStore'
import { CONSTITUENCIES } from '../data/constituencies'
import { formatGameDate } from '../utils/calendar'
import { getPublication } from '../data/publications'
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

const CATEGORY_LABEL: Record<string, string> = {
  fiscal: 'FISCAL',
  political: 'ANALYSIS',
  crisis: 'CRISIS',
  milestone: 'MILESTONE',
  background: 'BRIEFING',
}

const CATEGORY_COLOR: Record<string, string> = {
  fiscal: 'var(--info-11)',
  political: 'var(--warning-11)',
  crisis: 'var(--error-11)',
  milestone: 'var(--accent-text)',
  background: 'var(--text-secondary)',
}

export function LagosHerald() {
  const week = useGameStore((s) => s.week)
  const newspaperHeadline = useGameStore((s) => s.newspaperHeadline)
  const lastWeekRevenue = useGameStore((s) => s.lastWeekRevenue)
  const lastWeekSpend = useGameStore((s) => s.lastWeekExpenditure)
  const snapshot = useGameStore((s) => s.lastWeekStatSnapshot)
  const trust = useGameStore((s) => s.stats.publicTrust)
  const polCap = useGameStore((s) => s.stats.politicalCapital)
  const approvalHistory = useGameStore((s) => s.approvalHistory)
  const clearNewspaperHeadline = useGameStore((s) => s.clearNewspaperHeadline)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        clearNewspaperHeadline()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  if (!newspaperHeadline) return null

  const publication = newspaperHeadline.publicationId ? getPublication(newspaperHeadline.publicationId) : undefined

  const prevWeek = week - 1

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
        <div className="px-6 py-4" style={{ borderBottom: `2px solid ${publication?.color ?? 'var(--accent-solid)'}` }}>
          <div className="flex items-center justify-between">
            <p className="label-caps" style={{ color: 'var(--text-secondary)' }}>
              ISSUE {prevWeek === 0 ? 1 : prevWeek}
            </p>
            {publication && (
              <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: publication.color }}>
                {publication.description}
              </span>
            )}
          </div>
          <h1 className="font-display text-xl font-bold mt-0.5" style={{ color: publication?.color ?? 'var(--text)' }}>
            {publication?.masthead ?? 'THE LAGOS HERALD'}
          </h1>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {formatGameDate(week)}
          </p>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Lead Story */}
          <section>
            <span className="label-caps" style={{ color: CATEGORY_COLOR[newspaperHeadline.category] ?? 'var(--text-secondary)' }}>
              {CATEGORY_LABEL[newspaperHeadline.category] ?? 'NEWS'}
            </span>
            {newspaperHeadline.framingCaption && (
              <div
                className="mt-2 mb-1.5 px-2 py-0.5 inline-block text-[9px] font-bold uppercase tracking-widest"
                style={{
                  color: publication?.color ?? 'var(--accent-text)',
                  backgroundColor: publication ? `${publication.color}20` : 'var(--accent-bg-subtle)',
                  borderLeft: `2px solid ${publication?.color ?? 'var(--accent-solid)'}`,
                }}
              >
                {newspaperHeadline.framingCaption}
              </div>
            )}
            <h2 className="font-display text-base font-semibold leading-snug mt-1" style={{ color: 'var(--text)' }}>
              {newspaperHeadline.headline}
            </h2>
            {newspaperHeadline.llmGenerated ? (
              <p className="text-[12px] mt-1 leading-relaxed italic" style={{ color: 'var(--text)' }}>
                &ldquo;{newspaperHeadline.deck}&rdquo;
              </p>
            ) : (
              <p className="text-[11px] mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {newspaperHeadline.deck}
                {newspaperHeadline.llmPending && (
                  <span className="ml-1.5 text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                    polishing&hellip;
                  </span>
                )}
              </p>
            )}
            {newspaperHeadline.framingEditorialNote && (
              <p className="text-[10px] mt-2 leading-relaxed italic" style={{ color: 'var(--text-secondary)', borderTop: '1px solid var(--border-subtle)', paddingTop: '6px' }}>
                &mdash; {newspaperHeadline.framingEditorialNote}
              </p>
            )}
          </section>

          {/* Inside the Numbers */}
          {newspaperHeadline.dataPoints.length > 0 && (
            <section>
              <h3 className="label-caps mb-2" style={{ color: 'var(--text-secondary)' }}>INSIDE THE NUMBERS</h3>
              <div className="p-3 space-y-1.5 text-[11px] border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
                {newspaperHeadline.dataPoints.map((dp) => (
                  <div key={dp.label} className="flex justify-between items-center">
                    <span style={{ color: 'var(--text-secondary)' }}>{dp.label}</span>
                    <span>
                      <span className="font-medium" style={{ color: dp.positive === true ? 'var(--success-11)' : dp.positive === false ? 'var(--error-11)' : 'var(--text)' }}>
                        {dp.value}
                      </span>
                      {dp.delta && (
                        <span className="ml-1.5" style={{ color: dp.positive === true ? 'var(--success-11)' : dp.positive === false ? 'var(--error-11)' : 'var(--text-secondary)' }}>
                          {dp.delta}
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
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
            onClick={clearNewspaperHeadline}
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
