import { useState } from 'react'
import { ARCHETYPE_KEY_ORDER, ARCHETYPES, type ArchetypeKey } from '../../data/archetypes'
import { Kicker } from '../components/Typography'

const BORDER_COLOR: Record<ArchetypeKey, string> = {
  technocrat: 'var(--info-9)',
  loyalist: 'var(--warning-9)',
  outsider: 'var(--success-9)',
}

// Fixes the real ArchetypeSelectionScreen's affordance bug: there, the whole
// card is a <button> but a decorative, non-interactive <span> at the bottom
// is styled to *look* like the actual button, so hover/focus land on the
// wrong element visually. Here only the CTA at the bottom is interactive —
// the rest of the card is context you read, not a mystery hit-target.
export function ArchetypeCard({
  archetypeKey,
  selected,
  onSelect,
}: {
  archetypeKey: ArchetypeKey
  selected: boolean
  onSelect: () => void
}) {
  const a = ARCHETYPES[archetypeKey]
  const border = BORDER_COLOR[archetypeKey]

  return (
    <div
      style={{
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: selected ? border : 'var(--border)',
        borderTopWidth: '3px',
        borderTopColor: border,
        background: 'var(--surface)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        boxShadow: selected ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        transition: 'box-shadow var(--dur-fast) ease',
      }}
    >
      <div>
        <Kicker>{a.shortName}</Kicker>
        <h3
          className="font-display font-semibold"
          style={{ fontSize: '18px', color: 'var(--text)', margin: '2px 0 0' }}
        >
          {a.name}
        </h3>
        <p
          className="prose"
          style={{
            fontStyle: 'italic',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            margin: '4px 0 0',
          }}
        >
          {a.tagline}
        </p>
      </div>

      <p style={{ fontSize: '12px', lineHeight: 1.6, color: 'var(--text)', margin: 0 }}>
        {a.description}
      </p>

      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
        {a.statPreview.map((s) => (
          <div
            key={s.label}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '11px',
              padding: '2px 0',
            }}
          >
            <span style={{ color: 'var(--text-secondary)' }}>{s.label}</span>
            <span
              style={{
                fontWeight: 600,
                color: s.positive ? 'var(--success-11)' : 'var(--error-11)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {s.value}
            </span>
          </div>
        ))}
      </div>

      <div style={{ fontSize: '11px', lineHeight: 1.5 }}>
        <p style={{ margin: 0, color: 'var(--success-11)' }}>
          <strong>Strength:</strong> {a.strength}
        </p>
        <p style={{ margin: '4px 0 0', color: 'var(--error-11)' }}>
          <strong>Risk:</strong> {a.risk}
        </p>
      </div>

      <button
        type="button"
        onClick={onSelect}
        style={{
          marginTop: '4px',
          padding: '10px',
          border: 'none',
          background: selected ? border : 'var(--accent-solid)',
          color: 'var(--accent-on-solid)',
          fontFamily: "'Archivo Narrow', sans-serif",
          fontSize: '13px',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        {selected ? `Playing as ${a.shortName} ✓` : `Play as ${a.shortName}`}
      </button>
    </div>
  )
}

export function ArchetypeMock() {
  const [selected, setSelected] = useState<ArchetypeKey | null>(null)

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <Kicker accent>Choose Your Path</Kicker>
        <h1
          className="font-display font-semibold"
          style={{ fontSize: '30px', color: 'var(--text)', margin: '4px 0 0' }}
        >
          Who Are You?
        </h1>
        <p className="prose" style={{ marginTop: '6px', color: 'var(--text-secondary)' }}>
          Your background shapes how you enter government. Choose wisely — this cannot be undone.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px',
        }}
      >
        {ARCHETYPE_KEY_ORDER.map((key) => (
          <ArchetypeCard
            key={key}
            archetypeKey={key}
            selected={selected === key}
            onSelect={() => setSelected(key)}
          />
        ))}
      </div>
    </div>
  )
}
