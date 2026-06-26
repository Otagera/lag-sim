import type { GameState, InboxMessage, ProjectDef, ResearchNodeStatus } from '../state/types'
import { PROJECTS } from '../data/projects'
import { getGoal, getGoalProgress } from '../data/goals'
import { applyDelta } from './statEngine'
import { applyFactionDeltaState } from './factionEngine'

let _msgSeq = 0

function projectInboxMessage(state: GameState, project: ProjectDef, text: string): InboxMessage {
  _msgSeq++
  return {
    id: `project-${project.id}-${state.week}-${_msgSeq}`,
    from: 'chief-of-staff',
    fromLabel: 'Chief of Staff',
    week: state.week,
    subject: `${project.title} — Complete`,
    body: text,
    tone: 'warm',
    read: false,
  }
}

export function getProjectDef(id: string): ProjectDef | undefined {
  return PROJECTS.find((p) => p.id === id)
}

export function canCommissionProject(def: ProjectDef, state: GameState): boolean {
  const stored = state.projectStatuses[def.id]
  if (stored === 'commissioned' || stored === 'completed') return false
  if (state.stats.cashReserve < def.cost) return false
  if (state.stats.politicalCapital < def.pcCost) return false

  for (const prereq of def.prerequisites ?? []) {
    if (prereq.type === 'node' && prereq.nodeId) {
      const prereqStatus = state.projectStatuses[prereq.nodeId]
      if (prereqStatus !== 'completed') {
        const prereqNodeStatus = state.researchNodeStatuses[prereq.nodeId]
        if (prereqNodeStatus !== 'completed') return false
      }
    }
    if (prereq.type === 'state' && prereq.predicate) {
      if (!prereq.predicate(state)) return false
    }
  }

  return true
}

export function commissionProject(projectId: string, state: GameState): GameState {
  const def = getProjectDef(projectId)
  if (!def) return state
  if (state.stats.cashReserve < def.cost) return state
  if (state.stats.politicalCapital < def.pcCost) return state

  const stored = state.projectStatuses[def.id]
  if (stored === 'commissioned' || stored === 'completed') return state

  const completionWeek = state.week + def.weeksToComplete

  return {
    ...state,
    stats: {
      ...state.stats,
      cashReserve: state.stats.cashReserve - def.cost,
      politicalCapital: state.stats.politicalCapital - def.pcCost,
    },
    projectStatuses: {
      ...state.projectStatuses,
      [def.id]: 'commissioned',
    },
    commissionedProjects: [
      ...state.commissionedProjects,
      { id: projectId, completionWeek },
    ],
    timeline: [
      ...state.timeline,
      {
        week: state.week,
        type: 'milestone' as const,
        title: `Launched: ${def.title}`,
        description: `${def.category} · ₦${def.cost.toFixed(1)}bn · ${def.weeksToComplete} weeks`,
      },
    ],
  }
}

export function tickProjects(state: GameState): GameState {
  const due = state.commissionedProjects.filter(
    (cp) => state.week >= cp.completionWeek,
  )
  if (due.length === 0) return state

  const remaining = state.commissionedProjects.filter(
    (cp) => !due.some((d) => d.id === cp.id),
  )

  let next = { ...state, commissionedProjects: remaining }
  const statuses = { ...next.projectStatuses }
  let inbox = [...next.inbox]
  const timeline = [...next.timeline]
  let consequenceBeats = [...next.consequenceBeats]

  for (const cp of due) {
    const def = getProjectDef(cp.id)
    if (!def) continue

    statuses[cp.id] = 'completed'

    next = applyDelta(next, def.effect)
    if (def.factionImpact && Object.keys(def.factionImpact).length > 0) {
      next = applyFactionDeltaState(next, def.factionImpact)
    }

    timeline.push({
      week: next.week,
      type: 'milestone' as const,
      title: `Completed: ${def.title}`,
      description: `${def.category} project delivered.`,
    })

    inbox.push(projectInboxMessage(next, def, `${def.title} is complete. The investment is delivering as planned.`))

    if (def.goalRelevance && def.goalRelevance.length > 0 && next.selectedGoalId) {
      const goalId = next.selectedGoalId
      if (def.goalRelevance.includes(goalId)) {
        const goal = getGoal(goalId)
        const progress = goal ? getGoalProgress(goal, next) : 0
        consequenceBeats.push({
          text: `${def.title} delivered. Goal progress: ${progress.toFixed(0)}%.`,
          tone: 'hopeful',
          choiceLabel: def.title,
          choiceDescription: 'Project completed',
          immediate: def.effect,
          factionImpact: def.factionImpact ?? {},
        })
      }
    }
  }

  next = { ...next, projectStatuses: statuses, inbox, timeline, consequenceBeats }
  return next
}

export function getProjectStatus(projectId: string, state: GameState): ResearchNodeStatus {
  const stored = state.projectStatuses[projectId]
  if (stored && stored !== 'locked' && stored !== 'available') return stored

  const def = getProjectDef(projectId)
  if (!def) return 'locked'

  if (canCommissionProject(def, state)) return 'available'
  return 'locked'
}
