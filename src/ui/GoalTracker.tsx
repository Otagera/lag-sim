import {
  getGoal,
  getGoalBlocking,
  getGoalIsMet,
  getGoalProgress,
  getGoalRelevance,
} from '../data/goals'
import { PROJECTS } from '../data/projects'
import { RESEARCH_TREE } from '../data/researchTree'
import { useGameStore } from '../state/gameStore'

const CATEGORY_LABELS: Record<string, string> = {
  transport: 'Transport',
  power: 'Power',
  water: 'Water',
  health: 'Health',
  education: 'Education',
  security: 'Security',
  housing: 'Housing',
  environment: 'Environment',
}

export function GoalTracker() {
  const selectedGoalId = useGameStore((s) => s.selectedGoalId)
  const state = useGameStore((s) => s)
  const projectStatuses = useGameStore((s) => s.projectStatuses)
  const researchStatuses = useGameStore((s) => s.researchNodeStatuses)

  if (!selectedGoalId) {
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

  const goal = getGoal(selectedGoalId)
  if (!goal) return null

  const progress = getGoalProgress(goal, state)
  const met = getGoalIsMet(goal, state)
  const blocking = getGoalBlocking(goal, state)
  const relevance = getGoalRelevance(selectedGoalId)

  const relevantResearch = relevance
    ? RESEARCH_TREE.filter(
        (n) =>
          relevance.researchDomains.includes(n.domain) && researchStatuses[n.id] !== 'completed',
      )
    : []

  const relevantProjects = relevance
    ? PROJECTS.filter(
        (p) =>
          relevance.projectCategories.includes(p.category) && projectStatuses[p.id] !== 'completed',
      )
    : []

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

      <div
        className="w-full h-1.5 mb-1.5 overflow-hidden"
        style={{ backgroundColor: 'var(--neutral-4)' }}
      >
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

      {!met && (relevantResearch.length > 0 || relevantProjects.length > 0) && (
        <div className="mt-2 pt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <p className="text-[9px] font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
            What advances you
          </p>
          {relevantProjects.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1">
              {[...new Set(relevantProjects.map((p) => p.category))].map((cat) => (
                <span
                  key={cat}
                  className="text-[8px] px-1.5 py-0.5"
                  style={{
                    backgroundColor: 'var(--accent-bg-subtle)',
                    color: 'var(--accent-text)',
                    borderRadius: '2px',
                    border: '1px solid var(--accent-solid)',
                    fontFamily: "'Archivo Narrow', sans-serif",
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  {CATEGORY_LABELS[cat] ?? cat}
                </span>
              ))}
            </div>
          )}
          {relevantResearch.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {[...new Set(relevantResearch.map((n) => n.domain))].map((domain) => (
                <span
                  key={domain}
                  className="text-[8px] px-1.5 py-0.5"
                  style={{
                    backgroundColor: 'var(--surface-2)',
                    color: 'var(--text-secondary)',
                    borderRadius: '2px',
                    border: '1px solid var(--border)',
                    fontFamily: "'Archivo Narrow', sans-serif",
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  {domain}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
