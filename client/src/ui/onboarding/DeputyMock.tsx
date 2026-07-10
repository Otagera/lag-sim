import { useState } from 'react'
import { DEPUTY_PROFILES } from '../../data/deputies'
import type { DeputyKey } from '../../state/types'
import { Kicker } from '../components/Typography'
import { BustPortrait } from '../portraits/BustPortrait'

// Offered on a fresh run — mirrors the real DeputySelectionScreen's fallback
// three when no `offeredDeputies` are in the store yet (Style Lab has no
// live game state to read).
const OFFERED: DeputyKey[] = ['technocrat', 'politician', 'security-chief']

// Portrait-forward, unlike Archetype's stat-forward cards — differentiates
// the two "pick one of several options" screens from each other, and gives
// BustPortrait (built for Inbox/EventCard/LegacyScreen) a second real
// consumer to prototype against.
export function DeputyCard({
  deputyKey,
  selected,
  onSelect,
}: {
  deputyKey: DeputyKey
  selected: boolean
  onSelect: () => void
}) {
  const d = DEPUTY_PROFILES[deputyKey]

  return (
    <div
      style={{
        border: `1px solid ${selected ? 'var(--accent-solid)' : 'var(--border)'}`,
        background: 'var(--surface)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: '8px',
        boxShadow: selected ? 'var(--shadow-md)' : 'var(--shadow-sm)',
      }}
    >
      <BustPortrait charId="deputy" variantKey={deputyKey} size={80} />
      <div>
        <h3
          className="font-display font-semibold"
          style={{ fontSize: '15px', color: 'var(--text)', margin: 0 }}
        >
          {d.name}
        </h3>
        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
          {d.title}
        </p>
      </div>

      <p style={{ fontSize: '11px', lineHeight: 1.5, color: 'var(--text)', margin: 0 }}>
        {d.description}
      </p>

      <div style={{ fontSize: '10px', lineHeight: 1.5, textAlign: 'left', width: '100%' }}>
        <p style={{ margin: 0, color: 'var(--success-11)' }}>
          <strong>Strength:</strong> {d.strength}
        </p>
        <p style={{ margin: '4px 0 0', color: 'var(--error-11)' }}>
          <strong>Risk:</strong> {d.risk}
        </p>
      </div>

      <button
        type="button"
        onClick={onSelect}
        style={{
          marginTop: '6px',
          width: '100%',
          padding: '9px',
          border: 'none',
          background: 'var(--accent-solid)',
          color: 'var(--accent-on-solid)',
          fontFamily: "'Archivo Narrow', sans-serif",
          fontSize: '12px',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        {selected ? `Selected ✓` : `Select ${d.shortName}`}
      </button>
    </div>
  )
}

export function DeputyMock() {
  const [selected, setSelected] = useState<DeputyKey | null>(null)

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <Kicker accent>Choose Your Deputy</Kicker>
        <h1
          className="font-display font-semibold"
          style={{ fontSize: '30px', color: 'var(--text)', margin: '4px 0 0' }}
        >
          Who Stands Beside You?
        </h1>
        <p className="prose" style={{ marginTop: '6px', color: 'var(--text-secondary)' }}>
          Your deputy visits sectors on your behalf every week and shapes faction relationships you
          can't be everywhere for.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {OFFERED.map((key) => (
          <DeputyCard
            key={key}
            deputyKey={key}
            selected={selected === key}
            onSelect={() => setSelected(key)}
          />
        ))}
      </div>
    </div>
  )
}
