import { useEffect } from 'react'
import { CONSTITUENCIES } from '../data/constituencies'
import { getPublication } from '../data/publications'
import { useGameStore } from '../state/gameStore'
import type { ConstituencyKey, GameState } from '../state/types'
import { formatGameDate } from '../utils/calendar'

type NewspaperHeadline = NonNullable<GameState['newspaperHeadline']>
type Publication = NonNullable<ReturnType<typeof getPublication>>
type Movement = { key: ConstituencyKey; delta: number }

type HeraldPalette = {
  paper: string
  ink: string
  inkLight: string
  inkFaint: string
  ruleColor: string
  pubColor: string
  categoryRule: string
}

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

const buildApprovalMovements = (approvalHistory: GameState['approvalHistory']): Movement[] =>
  (Object.keys(approvalHistory) as ConstituencyKey[])
    .map((key) => {
      const hist = approvalHistory[key]
      if (hist.length < 2) return null
      return { key, delta: (hist.at(-1) ?? 0) - (hist.at(-2) ?? 0) }
    })
    .filter(Boolean) as Movement[]

const topMovement = (movements: Movement[], direction: 'gain' | 'loss'): Movement | null => {
  if (movements.length === 0) return null
  return movements.reduce((a, b) => {
    const isBetter = direction === 'gain' ? b.delta > a.delta : b.delta < a.delta
    return isBetter ? b : a
  }, movements[0])
}

const lgaLabel = (key: ConstituencyKey): string =>
  CONSTITUENCIES.find((c) => c.key === key)?.label ?? key

const dataPointColor = (
  positive: boolean | undefined,
  fallback: string,
  neutral: string,
): string => {
  if (positive === true) return '#2e7d32'
  if (positive === false) return '#c62828'
  return fallback || neutral
}

function HeraldMasthead({
  week,
  prevWeek,
  masthead,
  publication,
  palette,
}: {
  week: number
  prevWeek: number
  masthead: string
  publication?: Publication
  palette: HeraldPalette
}) {
  return (
    <div
      style={{
        borderBottom: `3px double ${palette.ink}`,
        borderTop: `6px solid ${palette.pubColor}`,
        padding: '12px 24px 10px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          fontSize: 10,
          color: palette.inkFaint,
          letterSpacing: '0.06em',
          marginBottom: 4,
        }}
      >
        <span>ESTABLISHED 2026 · LAGOS, NIGERIA</span>
        <span>ISSUE {prevWeek === 0 ? 1 : prevWeek} · PRICE: FREE</span>
        <span>{formatGameDate(week)}</span>
      </div>

      <h1
        style={{
          textAlign: 'center',
          fontSize: 36,
          fontWeight: 900,
          letterSpacing: '-0.02em',
          lineHeight: 1,
          margin: 0,
          color: palette.pubColor,
          fontFamily: 'Georgia, "Times New Roman", serif',
        }}
      >
        {masthead}
      </h1>

      {publication?.description && (
        <p
          style={{
            textAlign: 'center',
            fontSize: 10,
            fontStyle: 'italic',
            color: palette.inkFaint,
            margin: '4px 0 0',
            letterSpacing: '0.04em',
          }}
        >
          {publication.description}
        </p>
      )}
    </div>
  )
}

function SectionRule({
  categoryLabel,
  prevWeek,
  palette,
}: {
  categoryLabel: string
  prevWeek: number
  palette: HeraldPalette
}) {
  return (
    <div
      style={{
        background: palette.categoryRule,
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
  )
}

function DataPoints({
  headline,
  palette,
}: {
  headline: NewspaperHeadline
  palette: HeraldPalette
}) {
  if (headline.dataPoints.length === 0) {
    return (
      <div
        style={{
          fontSize: 12,
          color: palette.inkFaint,
          fontStyle: 'italic',
          lineHeight: 1.6,
          textAlign: 'justify',
        }}
      >
        No financial data disclosed at time of publication. Further reporting pending.
      </div>
    )
  }

  return (
    <>
      <div
        style={{
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.1em',
          color: palette.inkFaint,
          fontFamily: 'system-ui, sans-serif',
          marginBottom: 8,
          borderBottom: `1px solid ${palette.ruleColor}`,
          paddingBottom: 4,
        }}
      >
        BY THE NUMBERS
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {headline.dataPoints.map((dp) => (
          <div
            key={dp.label}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              fontSize: 12,
              borderBottom: `1px dotted ${palette.ruleColor}`,
              paddingBottom: 4,
            }}
          >
            <span style={{ color: palette.inkFaint }}>{dp.label}</span>
            <span>
              <span
                style={{
                  fontWeight: 700,
                  color: dataPointColor(dp.positive, palette.ink, palette.ink),
                }}
              >
                {dp.value}
              </span>
              {dp.delta && (
                <span
                  style={{
                    marginLeft: 5,
                    fontSize: 11,
                    color: dataPointColor(dp.positive, palette.inkFaint, palette.inkFaint),
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
  )
}

function HeraldLeadStory({
  headline,
  palette,
}: {
  headline: NewspaperHeadline
  palette: HeraldPalette
}) {
  return (
    <div style={{ padding: '20px 24px 0' }}>
      {headline.framingCaption && (
        <div
          style={{
            display: 'inline-block',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.1em',
            color: palette.pubColor,
            fontFamily: 'system-ui, sans-serif',
            borderBottom: `1.5px solid ${palette.pubColor}`,
            marginBottom: 8,
            paddingBottom: 1,
          }}
        >
          {headline.framingCaption}
        </div>
      )}

      <h2
        style={{
          fontSize: 28,
          fontWeight: 900,
          lineHeight: 1.15,
          margin: '0 0 10px',
          color: palette.ink,
          fontFamily: 'Georgia, "Times New Roman", serif',
          letterSpacing: '-0.01em',
        }}
      >
        {headline.headline}
      </h2>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ flex: 1, height: 2, background: palette.ink }} />
        <div style={{ width: 6, height: 6, background: palette.ink, borderRadius: '50%' }} />
        <div style={{ flex: 1, height: 2, background: palette.ink }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
        <div style={{ paddingRight: 14, borderRight: `1px solid ${palette.ruleColor}` }}>
          <p
            style={{
              fontSize: 13,
              lineHeight: 1.65,
              margin: 0,
              color: palette.inkLight,
              textAlign: 'justify',
            }}
          >
            {headline.deck}
          </p>
          {headline.framingEditorialNote && (
            <p
              style={{
                marginTop: 10,
                paddingTop: 8,
                borderTop: `1px solid ${palette.ruleColor}`,
                fontSize: 11,
                lineHeight: 1.5,
                fontStyle: 'italic',
                color: palette.inkFaint,
              }}
            >
              — {headline.framingEditorialNote}
            </p>
          )}
        </div>
        <div style={{ paddingLeft: 14 }}>
          <DataPoints headline={headline} palette={palette} />
        </div>
      </div>
    </div>
  )
}

function FiscalDigest({
  lastWeekRevenue,
  lastWeekSpend,
  netFlow,
  palette,
}: {
  lastWeekRevenue: GameState['lastWeekRevenue']
  lastWeekSpend: GameState['lastWeekExpenditure']
  netFlow: number | null
  palette: HeraldPalette
}) {
  return (
    <div style={{ paddingRight: 14, borderRight: `1px solid ${palette.ruleColor}` }}>
      <FooterSectionHeading palette={palette}>FISCAL DIGEST</FooterSectionHeading>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: palette.inkFaint }}>Revenue</span>
          <span style={{ fontWeight: 700, color: '#2e7d32' }}>
            ₦{lastWeekRevenue ? lastWeekRevenue.total.toFixed(1) : '–'}bn
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: palette.inkFaint }}>Expenditure</span>
          <span style={{ fontWeight: 700, color: '#c62828' }}>
            ₦{lastWeekSpend ? lastWeekSpend.total.toFixed(1) : '–'}bn
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            paddingTop: 5,
            borderTop: `1px solid ${palette.ruleColor}`,
            fontWeight: 700,
          }}
        >
          <span style={{ color: palette.ink }}>Net</span>
          <span
            style={{
              color: netFlow !== null ? (netFlow >= 0 ? '#2e7d32' : '#c62828') : palette.inkFaint,
            }}
          >
            {netFlow !== null
              ? `${netFlow >= 0 ? '+' : ''}${netFlow.toFixed(1)}bn ${arrow(netFlow)}`
              : '–'}
          </span>
        </div>
      </div>
    </div>
  )
}

function FooterSectionHeading({ palette, children }: { palette: HeraldPalette; children: string }) {
  return (
    <div
      style={{
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '0.1em',
        color: palette.inkFaint,
        fontFamily: 'system-ui, sans-serif',
        borderBottom: `1px solid ${palette.ruleColor}`,
        paddingBottom: 4,
        marginBottom: 8,
      }}
    >
      {children}
    </div>
  )
}

function DistrictPulse({
  topGain,
  topLoss,
  trust,
  trustDelta,
  polCap,
  pcDelta,
  palette,
}: {
  topGain: Movement | null
  topLoss: Movement | null
  trust: number
  trustDelta: number
  polCap: number
  pcDelta: number
  palette: HeraldPalette
}) {
  return (
    <div style={{ paddingLeft: 14 }}>
      <FooterSectionHeading palette={palette}>DISTRICT PULSE</FooterSectionHeading>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12 }}>
        {topGain ? (
          <MovementRow movement={topGain} palette={palette} tone="gain" />
        ) : (
          <div style={{ color: palette.inkFaint }}>Building data…</div>
        )}
        {topLoss && topLoss.key !== topGain?.key ? (
          <MovementRow movement={topLoss} palette={palette} tone="loss" />
        ) : null}
        <MetricRow
          label="Public Trust"
          value={`${trust.toFixed(0)}%`}
          delta={trustDelta}
          palette={palette}
          withRule
        />
        <MetricRow
          label="Pol. Capital"
          value={polCap.toFixed(0)}
          delta={pcDelta}
          palette={palette}
        />
      </div>
    </div>
  )
}

function MovementRow({
  movement,
  palette,
  tone,
}: {
  movement: Movement
  palette: HeraldPalette
  tone: 'gain' | 'loss'
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ color: palette.inkFaint }}>{lgaLabel(movement.key)}</span>
      <span style={{ fontWeight: 700, color: tone === 'gain' ? '#2e7d32' : '#c62828' }}>
        {deltaStr(movement.delta)}pts {arrow(movement.delta)}
      </span>
    </div>
  )
}

function MetricRow({
  label,
  value,
  delta,
  palette,
  withRule = false,
}: {
  label: string
  value: string
  delta: number
  palette: HeraldPalette
  withRule?: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        paddingTop: withRule ? 5 : undefined,
        borderTop: withRule ? `1px solid ${palette.ruleColor}` : undefined,
        fontSize: 12,
      }}
    >
      <span style={{ color: palette.inkFaint }}>{label}</span>
      <span>
        <span style={{ fontWeight: 700 }}>{value}</span>
        <span style={{ marginLeft: 4, color: moodColour(delta) }}>{deltaStr(delta)}</span>
      </span>
    </div>
  )
}

function HeraldFooter({
  clearNewspaperHeadline,
  palette,
}: {
  clearNewspaperHeadline: () => void
  palette: HeraldPalette
}) {
  return (
    <div
      style={{
        borderTop: `3px double ${palette.ink}`,
        padding: '10px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <span
        style={{
          fontSize: 10,
          color: palette.inkFaint,
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
          background: palette.ink,
          color: palette.paper,
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
  )
}

function HeraldDigestGrid({
  lastWeekRevenue,
  lastWeekSpend,
  netFlow,
  topGain,
  topLoss,
  trust,
  trustDelta,
  polCap,
  pcDelta,
  palette,
}: {
  lastWeekRevenue: GameState['lastWeekRevenue']
  lastWeekSpend: GameState['lastWeekExpenditure']
  netFlow: number | null
  topGain: Movement | null
  topLoss: Movement | null
  trust: number
  trustDelta: number
  polCap: number
  pcDelta: number
  palette: HeraldPalette
}) {
  return (
    <div
      style={{ padding: '0 24px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}
    >
      <FiscalDigest
        lastWeekRevenue={lastWeekRevenue}
        lastWeekSpend={lastWeekSpend}
        netFlow={netFlow}
        palette={palette}
      />
      <DistrictPulse
        topGain={topGain}
        topLoss={topLoss}
        trust={trust}
        trustDelta={trustDelta}
        polCap={polCap}
        pcDelta={pcDelta}
        palette={palette}
      />
    </div>
  )
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
  }, [clearNewspaperHeadline])

  if (!newspaperHeadline) return null

  const publication = newspaperHeadline.publicationId
    ? getPublication(newspaperHeadline.publicationId)
    : undefined
  const prevWeek = week - 1
  const netFlow =
    lastWeekRevenue && lastWeekSpend ? lastWeekRevenue.total - lastWeekSpend.total : null
  const movements = buildApprovalMovements(approvalHistory)
  const topGain = topMovement(movements, 'gain')
  const topLoss = topMovement(movements, 'loss')
  const trustDelta = snapshot ? trust - snapshot.publicTrust : 0
  const pcDelta = snapshot ? polCap - snapshot.politicalCapital : 0
  const masthead = publication?.masthead ?? 'THE LAGOS HERALD'
  const categoryLabel = CATEGORY_LABEL[newspaperHeadline.category] ?? 'NEWS'
  const palette: HeraldPalette = {
    paper: '#f7f3ec',
    ink: '#1a1a1a',
    inkLight: '#444',
    inkFaint: '#888',
    ruleColor: '#c8b89a',
    pubColor: publication?.color ?? '#1a1a1a',
    categoryRule: CATEGORY_RULE[newspaperHeadline.category] ?? '#1a1a1a',
  }

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
          background: palette.paper,
          boxShadow: '0 8px 48px rgba(0,0,0,0.55), 0 1px 0 rgba(255,255,255,0.08)',
          fontFamily: 'Georgia, "Times New Roman", serif',
          color: palette.ink,
        }}
      >
        <HeraldMasthead
          week={week}
          prevWeek={prevWeek}
          masthead={masthead}
          publication={publication}
          palette={palette}
        />
        <SectionRule categoryLabel={categoryLabel} prevWeek={prevWeek} palette={palette} />
        <HeraldLeadStory headline={newspaperHeadline} palette={palette} />
        <div style={{ margin: '16px 24px', borderTop: `1px solid ${palette.ruleColor}` }} />
        <HeraldDigestGrid
          lastWeekRevenue={lastWeekRevenue}
          lastWeekSpend={lastWeekSpend}
          netFlow={netFlow}
          topGain={topGain}
          topLoss={topLoss}
          trust={trust}
          trustDelta={trustDelta}
          polCap={polCap}
          pcDelta={pcDelta}
          palette={palette}
        />
        <HeraldFooter clearNewspaperHeadline={clearNewspaperHeadline} palette={palette} />
      </div>
    </div>
  )
}
