import type { ConstituencyApproval, GameState } from '../state/types'

export function applyConstituencyImpact(
  state: GameState,
  impact: Partial<ConstituencyApproval>,
): GameState {
  const updated = { ...state.constituencyApproval }
  for (const [key, change] of Object.entries(impact)) {
    if (change === undefined) continue
    const current = updated[key as keyof typeof updated]
    updated[key as keyof typeof updated] = Math.max(0, Math.min(100, current + change))
  }
  return { ...state, constituencyApproval: updated }
}
