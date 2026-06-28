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
  return v > 0.5 ? '▲' : v < -0.5 ? '▼' : '—'
}

function moodColour(v: number): string {
  return v > 0.5 ? '#2e7d32' : v < -0.5 ? '#c62828' : '#666'
}

const CATEGORY_LABEL: Record<string, string> = {
  fiscal: 'FISCAL',
  political: 'ANALYSIS',
  crisis: 'BREAKING',
  milestone: 'MILESTONE',
  background: 'BRIEFING',
}

// Ink-weight accent by category — used for the section rule only
const CATEGORY_RULE: Record<string, string> = {
  fiscal: '#1a3a6b',
  political: '#5c1a00',
  crisis: '#8b0000',
  milestone: '#1a4d1a',
  background: '#2a2a2a',
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
      if (e.key === 'Escape') clearNewspaperHeadline()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  if (!newspaperHeadline) return null

  const publication = newspaperHeadline.publicationId
    ? getPublication(newspaperHeadline.publicationId)
    : undefined

  const prevWeek = week - 1
  const netFlow =
    lastWeekRevenue && lastWeekSpend ? lastWeekRevenue.total - lastWeekSpend.total : null

  const deltas = (Object.keys(approvalHistory) as ConstituencyKey[])
    .map((key) => {
      const hist = approvalHistory[key]
      if (hist.length < 2) return null
      return { key, delta: (hist.at(-1) ?? 0) - (hist.at(-2) ?? 0) }
    })
    .filter(Boolean) as { key: ConstituencyKey; delta: number }[]

  const topGain =
    deltas.length > 0 ? deltas.reduce((a, b) => (b.delta > a.delta ? b : a), deltas[0]) : null
  const topLoss =
    deltas.length > 0 ? deltas.reduce((a, b) => (b.delta < a.delta ? b : a), deltas[0]) : null

  const trustDelta = snapshot ? trust - snapshot.publicTrust : 0
  const pcDelta = snapshot ? polCap - snapshot.politicalCapital : 0

  const lgaLabel = (key: ConstituencyKey): string =>
    CONSTITUENCIES.find((c) => c.key === key)?.label ?? key

  const pubColor = publication?.color ?? '#1a1a1a'
  const masthead = publication?.masthead ?? 'THE LAGOS HERALD'
  const categoryRule = CATEGORY_RULE[newspaperHeadline.category] ?? '#1a1a1a'
  const categoryLabel = CATEGORY_LABEL[newspaperHeadline.category] ?? 'NEWS'

  // Newsprint palette: warm off-white paper
  const paper = '#f7f3ec'
  const ink = '#1a1a1a'
  const inkLight = '#444'
  const inkFaint = '#888'
  const ruleColor = '#c8b89a'

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: 'rgba(20,15,8,0.82)',
        overflowY: 'auto',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '28px 16px',
        backdropFilter: 'blur(3px)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 680,
          background: paper,
          boxShadow: '0 8px 48px rgba(0,0,0,0.55), 0 1px 0 rgba(255,255,255,0.08)',
          fontFamily: 'Georgia, "Times New Roman", serif',
          color: ink,
        }}
      >
        {/* ── Masthead ──────────────────────────────────────── */}
        <div
          style={{
            borderBottom: `3px double ${ink}`,
            borderTop: `6px solid ${pubColor}`,
            padding: '12px 24px 10px',
          }}
        >
          {/* Meta row */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              fontSize: 10,
              color: inkFaint,
              letterSpacing: '0.06em',
              marginBottom: 4,
            }}
          >
            <span>ESTABLISHED 2026 · LAGOS, NIGERIA</span>
            <span>ISSUE {prevWeek === 0 ? 1 : prevWeek} · PRICE: FREE</span>
            <span>{formatGameDate(week)}</span>
          </div>

          {/* Publication name */}
          <h1
            style={{
              textAlign: 'center',
              fontSize: 36,
              fontWeight: 900,
              letterSpacing: '-0.02em',
              lineHeight: 1,
              margin: 0,
              color: pubColor,
              fontFamily: 'Georgia, "Times New Roman", serif',
            }}
          >
            {masthead}
          </h1>

          {/* Tagline */}
          {publication?.description && (
            <p
              style={{
                textAlign: 'center',
                fontSize: 10,
                fontStyle: 'italic',
                color: inkFaint,
                margin: '4px 0 0',
                letterSpacing: '0.04em',
              }}
            >
              {publication.description}
            </p>
          )}
        </div>

        {/* ── Section rule ──────────────────────────────────── */}
        <div
          style={{
            background: categoryRule,
            padding: '3px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.12em',
              color: '#fff',
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            {categoryLabel}
          </span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.3)' }} />
          <span
            style={{
              fontSize: 10,
              color: 'rgba(255,255,255,0.7)',
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            WEEK {prevWeek === 0 ? 1 : prevWeek}
          </span>
        </div>

        {/* ── Lead story ────────────────────────────────────── */}
        <div style={{ padding: '20px 24px 0' }}>
          {/* Framing caption */}
          {newspaperHeadline.framingCaption && (
            <div
              style={{
                display: 'inline-block',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.1em',
                color: pubColor,
                fontFamily: 'system-ui, sans-serif',
                borderBottom: `1.5px solid ${pubColor}`,
                marginBottom: 8,
                paddingBottom: 1,
              }}
            >
              {newspaperHeadline.framingCaption}
            </div>
          )}

          {/* Headline */}
          <h2
            style={{
              fontSize: 28,
              fontWeight: 900,
              lineHeight: 1.15,
              margin: '0 0 10px',
              color: ink,
              fontFamily: 'Georgia, "Times New Roman", serif',
              letterSpacing: '-0.01em',
            }}
          >
            {newspaperHeadline.headline}
          </h2>

          {/* Horizontal rule under headline */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ flex: 1, height: 2, background: ink }} />
            <div style={{ width: 6, height: 6, background: ink, borderRadius: '50%' }} />
            <div style={{ flex: 1, height: 2, background: ink }} />
          </div>

          {/* Two-column body */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
            {/* Column 1: Deck + editorial note */}
            <div style={{ paddingRight: 14, borderRight: `1px solid ${ruleColor}` }}>
              {newspaperHeadline.llmGenerated ? (
                <p
                  style={{
                    fontSize: 14,
                    lineHeight: 1.65,
                    margin: 0,
                    fontStyle: 'italic',
                    color: ink,
                  }}
                >
                  &ldquo;{newspaperHeadline.deck}&rdquo;
                </p>
              ) : (
                <p
                  style={{
                    fontSize: 13,
                    lineHeight: 1.65,
                    margin: 0,
                    color: inkLight,
                    textAlign: 'justify',
                  }}
                >
                  {newspaperHeadline.deck}
                  {newspaperHeadline.llmPending && (
                    <span style={{ marginLeft: 6, fontSize: 11, color: inkFaint, fontStyle: 'italic' }}>
                      polishing&hellip;
                    </span>
                  )}
                </p>
              )}

              {newspaperHeadline.framingEditorialNote && (
                <p
                  style={{
                    marginTop: 10,
                    paddingTop: 8,
                    borderTop: `1px solid ${ruleColor}`,
                    fontSize: 11,
                    lineHeight: 1.5,
                    fontStyle: 'italic',
                    color: inkFaint,
                  }}
                >
                  — {newspaperHeadline.framingEditorialNote}
                </p>
              )}
            </div>

            {/* Column 2: Data points */}
            <div style={{ paddingLeft: 14 }}>
              {newspaperHeadline.dataPoints.length > 0 ? (
                <>
                  <div
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      color: inkFaint,
                      fontFamily: 'system-ui, sans-serif',
                      marginBottom: 8,
                      borderBottom: `1px solid ${ruleColor}`,
                      paddingBottom: 4,
                    }}
                  >
                    BY THE NUMBERS
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {newspaperHeadline.dataPoints.map((dp) => (
                      <div
                        key={dp.label}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'baseline',
                          fontSize: 12,
                          borderBottom: `1px dotted ${ruleColor}`,
                          paddingBottom: 4,
                        }}
                      >
                        <span style={{ color: inkFaint }}>{dp.label}</span>
                        <span>
                          <span
                            style={{
                              fontWeight: 700,
                              color:
                                dp.positive === true
                                  ? '#2e7d32'
                                  : dp.positive === false
                                    ? '#c62828'
                                    : ink,
                            }}
                          >
                            {dp.value}
                          </span>
                          {dp.delta && (
                            <span
                              style={{
                                marginLeft: 5,
                                fontSize: 11,
                                color:
                                  dp.positive === true
                                    ? '#2e7d32'
                                    : dp.positive === false
                                      ? '#c62828'
                                      : inkFaint,
                              }}
                            >
                              {dp.delta}
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div
                  style={{
                    fontSize: 12,
                    color: inkFaint,
                    fontStyle: 'italic',
                    lineHeight: 1.6,
                    textAlign: 'justify',
                  }}
                >
                  No financial data disclosed at time of publication. Further reporting pending.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Full-width rule ───────────────────────────────── */}
        <div style={{ margin: '16px 24px', borderTop: `1px solid ${ruleColor}` }} />

        {/* ── Two-column footer: Fiscal + Districts ─────────── */}
        <div
          style={{
            padding: '0 24px 16px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 0,
          }}
        >
          {/* Fiscal Digest */}
          <div style={{ paddingRight: 14, borderRight: `1px solid ${ruleColor}` }}>
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.1em',
                color: inkFaint,
                fontFamily: 'system-ui, sans-serif',
                borderBottom: `1px solid ${ruleColor}`,
                paddingBottom: 4,
                marginBottom: 8,
              }}
            >
              FISCAL DIGEST
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: inkFaint }}>Revenue</span>
                <span style={{ fontWeight: 700, color: '#2e7d32' }}>
                  ₦{lastWeekRevenue ? lastWeekRevenue.total.toFixed(1) : '–'}bn
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: inkFaint }}>Expenditure</span>
                <span style={{ fontWeight: 700, color: '#c62828' }}>
                  ₦{lastWeekSpend ? lastWeekSpend.total.toFixed(1) : '–'}bn
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: 5,
                  borderTop: `1px solid ${ruleColor}`,
                  fontWeight: 700,
                }}
              >
                <span style={{ color: ink }}>Net</span>
                <span
                  style={{
                    color:
                      netFlow !== null
                        ? netFlow >= 0
                          ? '#2e7d32'
                          : '#c62828'
                        : inkFaint,
                  }}
                >
                  {netFlow !== null
                    ? `${netFlow >= 0 ? '+' : ''}${netFlow.toFixed(1)}bn ${arrow(netFlow)}`
                    : '–'}
                </span>
              </div>
            </div>
          </div>

          {/* District Pulse */}
          <div style={{ paddingLeft: 14 }}>
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.1em',
                color: inkFaint,
                fontFamily: 'system-ui, sans-serif',
                borderBottom: `1px solid ${ruleColor}`,
                paddingBottom: 4,
                marginBottom: 8,
              }}
            >
              DISTRICT PULSE
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12 }}>
              {topGain ? (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: inkFaint }}>{lgaLabel(topGain.key)}</span>
                  <span style={{ fontWeight: 700, color: '#2e7d32' }}>
                    {deltaStr(topGain.delta)}pts {arrow(topGain.delta)}
                  </span>
                </div>
              ) : (
                <div style={{ color: inkFaint }}>Building data…</div>
              )}
              {topLoss && topLoss.key !== topGain?.key ? (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: inkFaint }}>{lgaLabel(topLoss.key)}</span>
                  <span style={{ fontWeight: 700, color: '#c62828' }}>
                    {deltaStr(topLoss.delta)}pts {arrow(topLoss.delta)}
                  </span>
                </div>
              ) : null}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: 5,
                  borderTop: `1px solid ${ruleColor}`,
                  fontSize: 12,
                }}
              >
                <span style={{ color: inkFaint }}>Public Trust</span>
                <span>
                  <span style={{ fontWeight: 700 }}>{trust.toFixed(0)}%</span>
                  <span style={{ marginLeft: 4, color: moodColour(trustDelta) }}>
                    {deltaStr(trustDelta)}
                  </span>
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: inkFaint }}>Pol. Capital</span>
                <span>
                  <span style={{ fontWeight: 700 }}>{polCap.toFixed(0)}</span>
                  <span style={{ marginLeft: 4, color: moodColour(pcDelta) }}>
                    {deltaStr(pcDelta)}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer rule + CTA ─────────────────────────────── */}
        <div
          style={{
            borderTop: `3px double ${ink}`,
            padding: '10px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span
            style={{
              fontSize: 10,
              color: inkFaint,
              fontFamily: 'system-ui, sans-serif',
              letterSpacing: '0.04em',
            }}
          >
            ALL RIGHTS RESERVED · LAGOS STATE, NIGERIA
          </span>
          <button
            type="button"
            onClick={clearNewspaperHeadline}
            style={{
              background: ink,
              color: paper,
              border: 'none',
              padding: '7px 20px',
              fontSize: 12,
              fontWeight: 700,
              fontFamily: 'system-ui, sans-serif',
              letterSpacing: '0.06em',
              cursor: 'pointer',
            }}
          >
            CONTINUE GOVERNING →
          </button>
        </div>
      </div>
    </div>
  )
}
