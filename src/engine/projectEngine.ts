import type { CapitalProject, ConstituencyKey, GameState } from '../state/types'
import { applyConstituencyImpact } from './constituencyEngine'
import { applyDelta } from './statEngine'

let projectIdCounter = 0

export function createProject(
  name: string,
  location: ConstituencyKey,
  totalCost: number,
  weeklyDraw: number,
  weeksRemaining: number,
  contractorId: string,
): CapitalProject {
  projectIdCounter++
  return {
    id: `project-${projectIdCounter}`,
    name,
    location,
    totalCost,
    weeklyDraw,
    totalSpent: 0,
    effectiveProgress: 0,
    contractorId,
    weeksRemaining,
    status: 'active',
  }
}

export function processProjects(state: GameState): GameState {
  let next = { ...state }

  const updatedProjects = next.capitalProjects.map((project) => {
    if (project.status !== 'active') return project

    const canAfford = next.stats.cashReserve >= project.weeklyDraw
    if (!canAfford)
      return { ...project, status: 'stalled' as const, stalledReason: 'backlog' as const }

    const draw = Math.min(project.weeklyDraw, next.stats.cashReserve)
    next = applyDelta(next, { cashReserve: -draw })

    const worksCommissioner = next.commissioners?.works
    const godfatherLeakageBonus = worksCommissioner?.isGodfatherChoice ? 0.05 : 0
    const leakage = 0.15 + (next.stats.corruptionPressure / 100) * 0.25 + godfatherLeakageBonus
    const worksSpeedBonus =
      worksCommissioner && !worksCommissioner.isGodfatherChoice
        ? (worksCommissioner.competence / 100) * 0.1
        : 0
    const effectiveProgressGain =
      (draw / project.totalCost) * 100 * (1 - leakage) * (1 + worksSpeedBonus)
    const totalSpent = project.totalSpent + draw
    const effectiveProgress = Math.min(100, project.effectiveProgress + effectiveProgressGain)
    const weeksRemaining = project.weeksRemaining - 1
    const status =
      weeksRemaining <= 0 && effectiveProgress >= 90 ? ('completed' as const) : ('active' as const)

    return { ...project, totalSpent, effectiveProgress, weeksRemaining, status }
  })

  const completedProjects = updatedProjects.filter((p) => p.status === 'completed')
  for (const project of completedProjects) {
    const pcReward = project.totalCost > 20 ? 5 : project.totalCost > 10 ? 4 : 3
    next = applyDelta(next, { infrastructureScore: 5, igr: 0.3, politicalCapital: pcReward })
    next = applyConstituencyImpact(next, { [project.location]: 8 })
  }

  const stalledCount = updatedProjects.filter((p) => p.status === 'stalled').length
  if (stalledCount > 0) {
    next = applyDelta(next, { infrastructureScore: -stalledCount * 0.5 })
  }

  return { ...next, capitalProjects: updatedProjects }
}
