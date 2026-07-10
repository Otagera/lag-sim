import { getGoal, getGoalIsMet, getGoalProgress } from '../data/goals'
import { useGameStore } from '../state/gameStore'
import { GoalJourneyPrototype } from './goals/GoalJourneyPrototype'

function EmptyGoalState() {
  return (
    <div
      className="p-2 border"
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
    >
      <p className="text-[9px]" style={{ color: 'var(--text-secondary)' }}>
        No goal selected. Choose one from the Legacy screen.
      </p>
    </div>
  )
}

export function GoalTracker() {
  const selectedGoalId = useGameStore((s) => s.selectedGoalId)
  const state = useGameStore((s) => s)

  if (!selectedGoalId) {
    return <EmptyGoalState />
  }

  const goal = getGoal(selectedGoalId)
  if (!goal) return null

  const progress = getGoalProgress(goal, state)
  const met = getGoalIsMet(goal, state)

  return (
    <div
      className="p-2 border"
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
    >
      <div className="flex items-center justify-between mb-1">
        <h3 className="label-caps">{goal.title}</h3>
        <span
          className="text-[15px] font-semibold"
          style={{ color: met ? 'var(--success-11)' : 'var(--text)' }}
        >
          {progress.toFixed(0)}%
        </span>
      </div>

      <GoalJourneyPrototype goal={goal} overrides={{}} baseState={state} />
    </div>
  )
}
