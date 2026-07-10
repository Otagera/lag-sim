import { type CSSProperties, useState } from 'react'
import { ALL_GOALS } from '../../data/goals'
import { STARTING_STATE } from '../../data/startingState'
import { GoalJourneyPrototype } from './GoalJourneyPrototype'
import type { GoalProgressOverrides } from './mockGoalState'

const buttonStyle = (active: boolean): CSSProperties => ({
  padding: '6px 12px',
  border: `1px solid ${active ? '#1A9B8E' : '#444'}`,
  background: active ? '#1A9B8E' : '#222',
  color: active ? '#fff' : '#e0e0e0',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '11px',
  fontWeight: 600,
})

const labelStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  cursor: 'pointer',
  color: '#aaa',
  fontSize: '11px',
}

export function GoalJourneyTab() {
  const [selectedGoalId, setSelectedGoalId] = useState(ALL_GOALS[0].id)
  const [overrides, setOverrides] = useState<GoalProgressOverrides>({})
  const [forceReducedMotion, setForceReducedMotion] = useState(false)

  const goal = ALL_GOALS.find((g) => g.id === selectedGoalId) ?? ALL_GOALS[0]

  function selectGoal(id: string) {
    setSelectedGoalId(id)
    setOverrides({})
  }

  function setTargetOverride(index: number, value: number) {
    setOverrides((prev) => ({ ...prev, [index]: value / 100 }))
  }

  return (
    <div
      className="sl-tab-section"
      style={{ padding: '20px 24px', maxWidth: '1000px', margin: '0 auto', width: '100%' }}
    >
      <div
        style={{
          display: 'flex',
          gap: '6px',
          flexWrap: 'wrap',
          marginBottom: '16px',
          fontFamily: "'Archivo Narrow', sans-serif",
          fontSize: '11px',
        }}
      >
        {ALL_GOALS.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => selectGoal(g.id)}
            style={buttonStyle(g.id === selectedGoalId)}
          >
            {g.title}
          </button>
        ))}
      </div>

      <div
        style={{
          display: 'flex',
          gap: '20px',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          marginBottom: '16px',
          fontFamily: "'Archivo Narrow', sans-serif",
          fontSize: '12px',
        }}
      >
        {goal.targets.map((target, i) => (
          <div
            key={target.label}
            style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '180px' }}
          >
            <label style={{ fontSize: '10px', color: '#999' }} htmlFor={`target-slider-${i}`}>
              {target.label}
            </label>
            <input
              id={`target-slider-${i}`}
              type="range"
              min={0}
              max={100}
              step={5}
              value={Math.round((overrides[i] ?? target.progress(STARTING_STATE)) * 100)}
              onChange={(e) => setTargetOverride(i, Number(e.target.value))}
            />
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
        <label style={labelStyle}>
          <input
            type="checkbox"
            checked={forceReducedMotion}
            onChange={() => setForceReducedMotion((v) => !v)}
          />
          Force reduced motion
        </label>
        <button type="button" onClick={() => setOverrides({})} style={buttonStyle(false)}>
          Reset
        </button>
      </div>

      <GoalJourneyPrototype
        goal={goal}
        overrides={overrides}
        baseState={STARTING_STATE}
        forceReducedMotion={forceReducedMotion}
      />
    </div>
  )
}
