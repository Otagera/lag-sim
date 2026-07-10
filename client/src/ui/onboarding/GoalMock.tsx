import { useState } from 'react'
import { ALL_GOALS, type Goal } from '../../data/goals'
import { Kicker } from '../components/Typography'

// The goal's targets rendered as a numbered journey: a connecting line with a
// milestone dot per target and its label. Replaces the earlier abstract
// route-shape preview — same "journey" read, but it actually tells you what
// the mission demands instead of just how many stops it has.
function GoalMilestones({ goal, accent }: { goal: Goal; accent: string }) {
  const count = goal.targets.length
  return (
    <div>
      <div className="label-caps" style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>
        {count} milestone{count === 1 ? '' : 's'} to your legacy
      </div>
      <div style={{ position: 'relative', paddingLeft: '2px' }}>
        {count > 1 && (
          <div
            style={{
              position: 'absolute',
              left: '11px',
              top: '10px',
              bottom: '10px',
              width: '2px',
              background: accent,
              opacity: 0.25,
            }}
          />
        )}
        {goal.targets.map((t, i) => (
          <div
            key={t.label}
            style={{
              position: 'relative',
              display: 'flex',
              gap: '10px',
              alignItems: 'flex-start',
              marginBottom: i < count - 1 ? '8px' : 0,
            }}
          >
            <span
              style={{
                flexShrink: 0,
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: accent,
                color: '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: 700,
                fontFamily: "'Archivo Narrow', sans-serif",
              }}
            >
              {i + 1}
            </span>
            <span
              style={{ fontSize: '11px', lineHeight: 1.4, color: 'var(--text)', paddingTop: '2px' }}
            >
              {t.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function GoalCard({
  goal,
  selected,
  onSelect,
  accent = 'var(--accent-solid)',
}: {
  goal: Goal
  selected: boolean
  onSelect: () => void
  accent?: string
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      style={{
        appearance: 'none',
        textAlign: 'left',
        width: '100%',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: selected ? accent : 'var(--border)',
        borderTopWidth: '3px',
        borderTopColor: accent,
        background: 'var(--surface)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        cursor: 'pointer',
        boxShadow: selected ? `0 0 0 2px ${accent}, var(--shadow-md)` : 'var(--shadow-sm)',
        transition: 'box-shadow var(--dur-fast) ease',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '8px',
        }}
      >
        <div>
          <h3
            className="font-display font-semibold"
            style={{ fontSize: '17px', color: 'var(--text)', margin: 0 }}
          >
            {goal.title}
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
            {goal.pitch}
          </p>
        </div>
        {selected && (
          <span
            style={{
              flexShrink: 0,
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              background: accent,
              color: '#fff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px',
            }}
          >
            ✓
          </span>
        )}
      </div>

      <GoalMilestones goal={goal} accent={accent} />
    </button>
  )
}

export function GoalMock() {
  const [selected, setSelected] = useState<string | null>(null)
  // Preview a representative three — the real screen lists all of ALL_GOALS,
  // this mock only needs enough cards to prove the journey-preview idea reads
  // well at grid scale.
  const preview = ALL_GOALS.slice(0, 3)

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <Kicker accent>Choose Your Mission</Kicker>
        <h1
          className="font-display font-semibold"
          style={{ fontSize: '30px', color: 'var(--text)', margin: '4px 0 0' }}
        >
          What Will You Be Remembered For?
        </h1>
        <p className="prose" style={{ marginTop: '6px', color: 'var(--text-secondary)' }}>
          Pick the route your term will follow. Every target on the road is something real you'll
          need to move.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {preview.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            selected={selected === goal.id}
            onSelect={() => setSelected(goal.id)}
          />
        ))}
      </div>
    </div>
  )
}
