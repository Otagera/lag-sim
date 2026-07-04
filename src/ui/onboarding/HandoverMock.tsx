import { useState } from 'react'
import { Kicker } from '../components/Typography'
import { useReducedMotion } from '../design/useReducedMotion'

type HandoverTabId = 'briefing' | 'fiscal' | 'factions' | 'priorities'

const TABS: { id: HandoverTabId; label: string }[] = [
  { id: 'briefing', label: 'Briefing' },
  { id: 'fiscal', label: 'Fiscal Position' },
  { id: 'factions', label: 'Political Landscape' },
  { id: 'priorities', label: 'What You Could Fight For' },
]

const FACTIONS = [
  { label: 'Business Community', value: 55 },
  { label: 'Informal Economy', value: 50 },
  { label: 'Party Godfathers', value: 30 },
  { label: 'Federal Government', value: 48 },
  { label: 'Civil Society & Media', value: 50 },
  { label: 'LG Chairmen', value: 58 },
]

const PRIORITIES = [
  'Revenue shortfall — ₦17.3bn/week below fixed commitments.',
  'Godfather relations at 30 — removal arc triggers below 10.',
  'Youth tension simmering in Alimosho and Mushin since the last flood season.',
]

function BriefingTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <blockquote
        style={{
          margin: 0,
          padding: '12px 16px',
          borderLeft: '3px solid var(--accent-solid)',
          background: 'var(--surface-2)',
          fontStyle: 'italic',
          fontSize: '13px',
          lineHeight: 1.7,
          color: 'var(--text)',
        }}
      >
        "Your reputation is built on delivery, sir. But the godfathers will test you in the first
        eight weeks. Every project award is a signal. Choose contractors carefully — or they will
        choose for you."
      </blockquote>
      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
        — Chief of Staff, Government House Alausa
      </p>
    </div>
  )
}

function FiscalTab() {
  const cards = [
    { label: 'Cash Reserve', value: '₦65.0bn' },
    { label: 'Weekly Revenue', value: '₦12.8bn', tone: 'good' },
    { label: 'Weekly Outgoings', value: '₦11.2bn' },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
        {cards.map((c) => (
          <div
            key={c.label}
            style={{
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              padding: '10px',
            }}
          >
            <p className="label-caps" style={{ fontSize: '9px', margin: 0 }}>
              {c.label}
            </p>
            <p
              style={{
                fontSize: '16px',
                fontWeight: 600,
                margin: '4px 0 0',
                color: c.tone === 'good' ? 'var(--success-11)' : 'var(--text)',
              }}
            >
              {c.value}
            </p>
          </div>
        ))}
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '10px 14px',
          background: 'var(--accent-bg-subtle)',
          fontSize: '12px',
          fontWeight: 600,
        }}
      >
        <span style={{ color: 'var(--text)' }}>Net weekly position</span>
        <span style={{ color: 'var(--success-11)' }}>+₦1.6bn</span>
      </div>
    </div>
  )
}

function FactionBar({ label, value }: { label: string; value: number }) {
  const color =
    value >= 55 ? 'var(--success-9)' : value >= 35 ? 'var(--warning-9)' : 'var(--error-9)'
  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '11px',
          marginBottom: '3px',
        }}
      >
        <span style={{ color: 'var(--text)' }}>{label}</span>
        <span style={{ color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
          {value}
        </span>
      </div>
      <div style={{ height: '5px', background: 'var(--neutral-4)' }}>
        <div style={{ height: '100%', width: `${value}%`, background: color }} />
      </div>
    </div>
  )
}

function FactionsTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {FACTIONS.map((f) => (
        <FactionBar key={f.label} label={f.label} value={f.value} />
      ))}
    </div>
  )
}

function PrioritiesTab() {
  return (
    <ul
      style={{
        margin: 0,
        padding: 0,
        listStyle: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      {PRIORITIES.map((p) => (
        <li
          key={p}
          style={{
            display: 'flex',
            gap: '8px',
            fontSize: '12px',
            lineHeight: 1.6,
            color: 'var(--text)',
            padding: '8px 10px',
            background: 'var(--error-2, var(--surface-2))',
            borderLeft: '2px solid var(--error-9)',
          }}
        >
          {p}
        </li>
      ))}
    </ul>
  )
}

const TAB_CONTENT: Record<HandoverTabId, () => React.JSX.Element> = {
  briefing: BriefingTab,
  fiscal: FiscalTab,
  factions: FactionsTab,
  priorities: PrioritiesTab,
}

// Restructures the real HandoverNotesModal (546 lines, by far the densest of
// the five onboarding screens) into progressive-disclosure tabs instead of
// one long scroll — the core fix this mock exists to prototype, not a
// restyle of the existing density.
export function HandoverMock() {
  const [tab, setTab] = useState<HandoverTabId>('briefing')
  const reduced = useReducedMotion()
  const Content = TAB_CONTENT[tab]

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <Kicker accent>Government of Lagos State · Restricted</Kicker>
        <h1
          className="font-display font-semibold"
          style={{ fontSize: '26px', color: 'var(--text)', margin: '4px 0 0' }}
        >
          Handover Notes
        </h1>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
          Prepared for The Technocrat · Chief of Staff, Government House Alausa
        </p>
      </div>

      <div
        style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '16px' }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            style={{
              flex: 1,
              padding: '8px 6px',
              background: 'none',
              border: 'none',
              borderBottom: `2px solid ${tab === t.id ? 'var(--accent-solid)' : 'transparent'}`,
              color: tab === t.id ? 'var(--accent-text)' : 'var(--text-secondary)',
              fontFamily: "'Archivo Narrow', sans-serif",
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={reduced ? undefined : { animation: 'onboarding-step-enter 240ms ease-out' }}>
        <Content />
      </div>

      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button
          type="button"
          style={{
            padding: '10px 24px',
            border: 'none',
            background: 'var(--accent-solid)',
            color: 'var(--accent-on-solid)',
            fontFamily: "'Archivo Narrow', sans-serif",
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Choose Your Mission →
        </button>
      </div>
    </div>
  )
}
