import { useState } from 'react'
import { ALL_GOALS, type Goal } from '../../data/goals'
import { Kicker } from '../components/Typography'
import { buildJourneySegment, computeAnchors, segmentPath } from '../goals/journeyLayout'

// A static preview of the goal's shape as a journey — reusing the Goal
// Journey's road/waypoint geometry (src/ui/goals/journeyLayout.ts), the
// strongest opportunity in this redesign to reuse an already-built prototype
// rather than invent new visual language, since this screen is literally
// "pick which journey you're about to walk." Deliberately un-animated and
// without a traveler marker — that belongs to the real in-progress tracker
// once a goal is chosen, not to a before-the-fact preview of all of them.
function JourneyPreview({ goal }: { goal: Goal }) {
  const anchors = computeAnchors(goal.targets.length)
  const segments = anchors.slice(1).map((a, i) => buildJourneySegment(anchors[i], a))

  return (
    <svg
      viewBox="0 0 900 220"
      width="100%"
      height="64"
      role="img"
      aria-label={`${goal.title} route`}
    >
      {segments.map((seg) => (
        <path
          key={`seg-${seg.p0.x}-${seg.p0.y}`}
          d={segmentPath(seg)}
          fill="none"
          stroke="var(--border-strong, var(--border))"
          strokeWidth={10}
          strokeLinecap="round"
        />
      ))}
      <circle cx={anchors[0].x} cy={anchors[0].y} r={9} fill="var(--text-secondary)" />
      {anchors.slice(1).map((a) => (
        <circle key={a.targetIndex} cx={a.x} cy={a.y} r={11} fill="var(--accent-solid)" />
      ))}
    </svg>
  )
}

function GoalCard({
  goal,
  selected,
  onSelect,
}: {
  goal: Goal
  selected: boolean
  onSelect: () => void
}) {
  return (
    <div
      style={{
        border: `1px solid ${selected ? 'var(--accent-solid)' : 'var(--border)'}`,
        background: 'var(--surface)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        boxShadow: selected ? 'var(--shadow-md)' : 'var(--shadow-sm)',
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

      <JourneyPreview goal={goal} />

      <ul style={{ margin: 0, padding: '0 0 0 16px', fontSize: '11px', color: 'var(--text)' }}>
        {goal.targets.map((t) => (
          <li key={t.label} style={{ marginBottom: '2px' }}>
            {t.label}
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onSelect}
        style={{
          marginTop: 'auto',
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
        {selected ? 'This is my goal ✓' : 'Make it my goal'}
      </button>
    </div>
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
