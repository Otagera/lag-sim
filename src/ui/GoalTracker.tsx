import { useGameStore } from '../state/gameStore'
import { getGoal, getGoalProgress, getGoalIsMet, getGoalBlocking } from '../data/goals'

export function GoalTracker() {
  const selectedGoalId = useGameStore((s) => s.selectedGoalId)
  const state = useGameStore((s) => s)

  if (!selectedGoalId) return null

  const goal = getGoal(selectedGoalId)
  if (!goal) return null

  const progress = getGoalProgress(goal, state)
  const met = getGoalIsMet(goal, state)
  const blocking = getGoalBlocking(goal, state)

  return (
    <div className="p-2 border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
      <div className="flex items-center justify-between mb-1">
        <h3 className="label-caps">{goal.title}</h3>
        <span className="text-[15px] font-semibold" style={{ color: met ? 'var(--success-11)' : 'var(--text)' }}>
          {progress.toFixed(0)}%
        </span>
      </div>

      <div className="w-full h-1.5 mb-1.5 overflow-hidden" style={{ backgroundColor: 'var(--neutral-4)' }}>
        <div
          className="h-full transition-all"
          style={{
            width: `${Math.min(100, progress)}%`,
            backgroundColor: met ? 'var(--success-9)' : 'var(--accent-solid)',
          }}
        />
      </div>

      {met ? (
        <p className="text-[9px] font-semibold" style={{ color: 'var(--success-11)' }}>
          On track — hold this to term end
        </p>
      ) : blocking ? (
        <p className="text-[9px]" style={{ color: 'var(--warning-11)' }}>
          {blocking}
        </p>
      ) : null}
    </div>
  )
}
