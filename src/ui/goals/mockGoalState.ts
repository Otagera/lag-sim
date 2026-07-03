import type { Goal } from '../../data/goals'
import type { GameState } from '../../state/types'

// Overrides fake only the *progress number* per target, not the underlying
// GameState — blockingText() is still computed from the real base state.
// That's an acceptable, clearly-labeled prototype simplification: faking a
// full GameState per goal (to move the real stat-driven progress functions)
// isn't practical for a Style Lab demo.
export type GoalProgressOverrides = Record<number, number>

export function resolveTargetProgress(
  goal: Goal,
  targetIndex: number,
  overrides: GoalProgressOverrides,
  baseState: GameState,
): number {
  const override = overrides[targetIndex]
  if (override !== undefined) return override
  return goal.targets[targetIndex].progress(baseState)
}

export function resolveOverallProgress(
  goal: Goal,
  overrides: GoalProgressOverrides,
  baseState: GameState,
): number {
  if (goal.targets.length === 0) return 0
  const sum = goal.targets.reduce(
    (acc, _, i) => acc + resolveTargetProgress(goal, i, overrides, baseState),
    0,
  )
  return sum / goal.targets.length
}

// "Blocking" here means the first not-yet-met target in the journey's own
// left-to-right order — the same one the traveler marker is currently
// heading toward (see travelerPosition in journeyLayout.ts) — not the
// worst-progress target overall. Keeping these two in lockstep matters: if
// the flag pointed at a different waypoint than the one the traveler was
// visibly walking toward, the journey would tell two different stories.
export function resolveBlockingIndex(
  goal: Goal,
  overrides: GoalProgressOverrides,
  baseState: GameState,
): number | null {
  for (let i = 0; i < goal.targets.length; i++) {
    const p = resolveTargetProgress(goal, i, overrides, baseState)
    if (p < 1) return i
  }
  return null
}
