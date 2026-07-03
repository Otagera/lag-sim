import { getNodeDef, getNodeStatus } from '../../engine/researchEngine'
import type { GameState, ResearchNodeStatus } from '../../state/types'

export interface MockResearchOverride {
  status: ResearchNodeStatus
  startWeek: number
  completionWeek: number
}

export function computeProgress(override: MockResearchOverride, currentWeek: number): number {
  const span = override.completionWeek - override.startWeek
  if (span <= 0) return 1
  const raw = (currentWeek - override.startWeek) / span
  return Math.max(0, Math.min(1, raw))
}

export function resolveMockStatus(
  nodeId: string,
  overrides: Record<string, MockResearchOverride>,
  baseState: GameState,
): ResearchNodeStatus {
  const override = overrides[nodeId]
  if (override) return override.status
  return getNodeStatus(nodeId, baseState)
}

export function commissionMockNode(
  nodeId: string,
  currentWeek: number,
): MockResearchOverride | null {
  const node = getNodeDef(nodeId)
  if (!node) return null
  return {
    status: 'commissioned',
    startWeek: currentWeek,
    completionWeek: currentWeek + node.weeksToComplete,
  }
}
