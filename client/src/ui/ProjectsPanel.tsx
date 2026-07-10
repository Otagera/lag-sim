import { CheckCircle, CircleDollarSign, Clock, Lock, Wrench, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { PROJECTS } from '../data/projects'
import { getProjectDef, getProjectStatus } from '../engine/projectsEngine'
import { useGameStore } from '../state/gameStore'
import type { GameState } from '../state/types'

const CATEGORY_ORDER = [
  'transport',
  'power',
  'water',
  'health',
  'education',
  'security',
  'housing',
  'environment',
] as const

const CATEGORY_COLORS: Record<string, { solid: string; bg: string; text: string }> = {
  transport: { solid: '#5899D2', bg: '#1a2a3a', text: '#a0c4e8' },
  power: { solid: '#D4A820', bg: '#2a2410', text: '#e8d488' },
  water: { solid: '#3DA8C0', bg: '#0a2a30', text: '#88d0e0' },
  health: { solid: '#3Aa85A', bg: '#0a2a18', text: '#80d8a0' },
  education: { solid: '#8A6AE8', bg: '#1a1040', text: '#c0a8f0' },
  security: { solid: '#D85040', bg: '#2a1010', text: '#e8a098' },
  housing: { solid: '#D08030', bg: '#2a1a08', text: '#e8c088' },
  environment: { solid: '#40A880', bg: '#082818', text: '#88d8b8' },
}

type CardState = 'available' | 'unaffordable' | 'locked' | 'commissioned' | 'completed'

function computeCardState(projectId: string, state: GameState): CardState {
  const base = getProjectStatus(projectId, state)
  if (base !== 'available' && base !== 'locked') return base

  const def = getProjectDef(projectId)
  if (!def) return 'locked'

  for (const prereq of def.prerequisites ?? []) {
    if (prereq.type === 'node' && prereq.nodeId) {
      const p = state.projectStatuses[prereq.nodeId]
      if (p === 'commissioned' || p === 'completed') continue
      const r = state.researchNodeStatuses[prereq.nodeId]
      if (r !== 'completed') return 'locked'
    }
    if (prereq.type === 'state' && prereq.predicate) {
      if (!prereq.predicate(state)) return 'locked'
    }
  }

  if (state.stats.cashReserve < def.cost || state.stats.politicalCapital < def.pcCost)
    return 'unaffordable'

  return 'available'
}

function cardBorderColor(state: CardState, category: string): string {
  const c = CATEGORY_COLORS[category]
  switch (state) {
    case 'available':
      return c?.solid ?? '#666'
    case 'unaffordable':
      return c?.solid ?? '#555'
    case 'commissioned':
      return '#a855f7'
    case 'completed':
      return '#16a34a'
    case 'locked':
      return '#444'
    default:
      return '#444'
  }
}

function cardBackground(state: CardState, category: string): string {
  const c = CATEGORY_COLORS[category]
  switch (state) {
    case 'available':
      return c?.bg ?? '#1a1a2a'
    case 'unaffordable':
      return '#181818'
    case 'commissioned':
      return '#1a0a30'
    case 'completed':
      return '#0a2010'
    case 'locked':
      return '#111'
    default:
      return '#111'
  }
}

const naira = (v: number) => `₦${v.toFixed(1)}bn`

function CategoryBadge({ category }: { category: string }) {
  const c = CATEGORY_COLORS[category]
  return (
    <span
      className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5"
      style={{ color: c?.text ?? '#999', backgroundColor: c?.bg ?? '#333' }}
    >
      {category}
    </span>
  )
}

type Project = (typeof PROJECTS)[number]
type ProjectGroup = { category: string; projects: Project[] }
type ProjectPrerequisite = NonNullable<Project['prerequisites']>[number]
type ActionableCardState = Extract<CardState, 'available' | 'unaffordable' | 'locked'>

function isActionableCardState(state: CardState | null | undefined): state is ActionableCardState {
  return state === 'available' || state === 'unaffordable' || state === 'locked'
}

function buildCardStates(state: GameState) {
  const map = new Map<string, CardState>()
  for (const project of PROJECTS) {
    map.set(project.id, computeCardState(project.id, state))
  }
  return map
}

function groupProjects(): ProjectGroup[] {
  const groups: ProjectGroup[] = []
  for (const category of CATEGORY_ORDER) {
    const projects = PROJECTS.filter((project) => project.category === category)
    if (projects.length > 0) groups.push({ category, projects })
  }
  return groups
}

function computeWeeksOfCash(cashReserve: number, netFlow: number) {
  return netFlow >= 0 ? Infinity : Math.abs(cashReserve / Math.max(0.1, Math.abs(netFlow)))
}

function ProjectsHeader({
  cashReserve,
  stats,
  weeksOfCash,
  onClose,
}: {
  cashReserve: number
  stats: GameState['stats']
  weeksOfCash: number
  onClose: () => void
}) {
  return (
    <div
      className="shrink-0 flex items-center justify-between px-4 py-3"
      style={{ backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
    >
      <div className="flex items-center gap-2">
        <Wrench className="w-4 h-4" style={{ color: 'var(--text)' }} />
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
          Build / Govern
        </h2>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="text-[10px] font-medium"
          style={{ color: cashReserve < 0 ? 'var(--error-11)' : 'var(--text-secondary)' }}
        >
          Cash: {naira(cashReserve)}
        </span>
        <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
          PC: {stats.politicalCapital.toFixed(0)}
        </span>
        <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
          {weeksOfCash === Infinity ? 'Surplus' : `~${Math.floor(weeksOfCash)}w remain`}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="p-1 hover:opacity-70"
          style={{ color: 'var(--text-secondary)' }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

function cardTitleColor(cardState: CardState) {
  if (cardState === 'available') return '#f0f0f0'
  if (cardState === 'unaffordable') return '#ccc'
  return '#999'
}

function statusAccentColor(cardState: CardState, availableColor: string) {
  switch (cardState) {
    case 'available':
      return availableColor
    case 'unaffordable':
      return '#d97706'
    case 'commissioned':
      return '#a855f7'
    case 'completed':
      return '#16a34a'
    case 'locked':
      return '#555'
    default:
      return '#555'
  }
}

function statusBorderColor(cardState: CardState, availableColor: string) {
  return cardState === 'locked' ? '#444' : statusAccentColor(cardState, availableColor)
}

function ProjectCardIcon({ cardState }: { cardState: CardState }) {
  switch (cardState) {
    case 'locked':
      return <Lock width={10} height={10} stroke="#555" />
    case 'unaffordable':
      return <CircleDollarSign width={10} height={10} stroke="#d97706" />
    case 'commissioned':
      return <Clock width={10} height={10} stroke="#a855f7" />
    case 'completed':
      return <CheckCircle width={10} height={10} stroke="#16a34a" />
    default:
      return null
  }
}

function ProjectAvailableMeta({ project, color }: { project: Project; color: string }) {
  return (
    <p className="text-[9px] mt-1" style={{ color }}>
      ₦{project.cost.toFixed(1)}bn · PC:{project.pcCost} · {project.weeksToComplete}w
      {project.goalRelevance && project.goalRelevance.length > 0 && (
        <span className="ml-2 opacity-70">· advances {project.goalRelevance.join(', ')}</span>
      )}
    </p>
  )
}

function ProjectCardStateNote({
  project,
  cardState,
  metaColor,
}: {
  project: Project
  cardState: CardState
  metaColor: string
}) {
  if (cardState === 'available' || cardState === 'unaffordable') {
    return <ProjectAvailableMeta project={project} color={metaColor} />
  }
  if (cardState === 'locked') {
    return (
      <p className="text-[9px] mt-1" style={{ color: '#888' }}>
        Needs:{' '}
        {project.prerequisites && project.prerequisites.length > 0
          ? project.prerequisites.map((prereq) => prereq.label).join(', ')
          : 'Research or project dependency'}
      </p>
    )
  }
  if (cardState === 'commissioned') {
    return (
      <span className="text-[9px]" style={{ color: '#a855f7' }}>
        In progress...
      </span>
    )
  }
  return (
    <span className="text-[9px]" style={{ color: '#16a34a' }}>
      Completed
    </span>
  )
}

function ProjectStatusBadge({
  cardState,
  availableColor,
}: {
  cardState: CardState
  availableColor: string
}) {
  return (
    <span
      className="text-[8px] font-semibold uppercase shrink-0 px-1.5 py-0.5"
      style={{
        color: statusAccentColor(cardState, availableColor),
        border: `1px solid ${statusBorderColor(cardState, availableColor)}`,
        borderRadius: '2px',
      }}
    >
      {cardState}
    </span>
  )
}

function ProjectCard({
  project,
  category,
  cardState,
  onClick,
}: {
  project: Project
  category: string
  cardState: CardState
  onClick: (projectId: string) => void
}) {
  const categoryColor = CATEGORY_COLORS[category]
  const borderColor = cardBorderColor(cardState, category)
  const backgroundColor = cardBackground(cardState, category)
  const clickable = isActionableCardState(cardState)
  const metaColor = cardState === 'available' ? (categoryColor?.text ?? '#aaa') : '#888'

  return (
    <button
      type="button"
      onClick={() => onClick(project.id)}
      className="w-full text-left p-3 border text-[11px]"
      style={{
        borderColor,
        backgroundColor,
        cursor: clickable ? 'pointer' : 'default',
        borderRadius: '6px',
      }}
      disabled={!clickable}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <ProjectCardIcon cardState={cardState} />
            <span className="font-semibold" style={{ color: cardTitleColor(cardState) }}>
              {project.title}
            </span>
          </div>
          <p
            className="text-[10px] mt-0.5 leading-relaxed"
            style={{ color: cardState === 'available' ? '#ccc' : '#999' }}
          >
            {project.pitch}
          </p>
          <ProjectCardStateNote project={project} cardState={cardState} metaColor={metaColor} />
        </div>
        <ProjectStatusBadge cardState={cardState} availableColor={borderColor} />
      </div>
    </button>
  )
}

function ProjectEffectLine({ effect }: { effect: Project['effect'] }) {
  if (Object.keys(effect).length === 0) return null
  return (
    <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
      <span className="font-semibold" style={{ color: 'var(--accent-text)' }}>
        Effect:{' '}
      </span>
      {Object.entries(effect)
        .map(([key, value]) => `${key} ${value > 0 ? '+' : ''}${value}`)
        .join(', ')}
    </div>
  )
}

function ProjectGoalLine({ goalRelevance }: { goalRelevance?: string[] }) {
  if (!goalRelevance || goalRelevance.length === 0) return null
  return (
    <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
      <span className="font-semibold" style={{ color: 'var(--accent-text)' }}>
        Advances:{' '}
      </span>
      {goalRelevance.join(', ')}
    </div>
  )
}

function isPrerequisiteMet(prereq: ProjectPrerequisite, state: GameState) {
  if (prereq.type === 'node') {
    const nodeId = prereq.nodeId ?? ''
    return (
      state.researchNodeStatuses[nodeId] === 'completed' ||
      state.projectStatuses[nodeId] === 'completed'
    )
  }
  return prereq.predicate?.(state) ?? false
}

function ProjectPrerequisiteChecklist({ project, state }: { project: Project; state: GameState }) {
  if (!project.prerequisites || project.prerequisites.length === 0) return null
  return (
    <div className="space-y-0.5">
      <span
        className="text-[9px] font-semibold uppercase"
        style={{ color: 'var(--text-secondary)' }}
      >
        Requirements
      </span>
      {project.prerequisites.map((prereq) => {
        const met = isPrerequisiteMet(prereq, state)
        return <ProjectPrerequisiteRow key={prereqKey(prereq)} prereq={prereq} met={met} />
      })}
    </div>
  )
}

function prereqKey(prereq: ProjectPrerequisite) {
  return `${prereq.type}-${prereq.nodeId ?? prereq.predicate?.name ?? prereq.label}`
}

function ProjectPrerequisiteRow({ prereq, met }: { prereq: ProjectPrerequisite; met: boolean }) {
  return (
    <div className="flex items-center gap-1.5 text-[10px]">
      <span style={{ color: met ? '#16a34a' : 'var(--error-9)' }}>{met ? '✓' : '✗'}</span>
      <span style={{ color: met ? '#16a34a' : 'var(--text-secondary)' }}>{prereq.label}</span>
    </div>
  )
}

function ProjectDetailsSummary({ project, state }: { project: Project; state: GameState }) {
  return (
    <>
      <CategoryBadge category={project.category} />
      <h3 className="text-base font-bold" style={{ color: 'var(--text)' }}>
        {project.title}
      </h3>
      <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        {project.pitch}
      </p>
      <div className="flex gap-3 text-[10px]">
        <span style={{ color: 'var(--text)' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Cost:</span> {naira(project.cost)}
        </span>
        <span style={{ color: 'var(--text)' }}>
          <span style={{ color: 'var(--text-secondary)' }}>PC:</span> {project.pcCost}
        </span>
        <span style={{ color: 'var(--text)' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Duration:</span>{' '}
          {project.weeksToComplete} weeks
        </span>
      </div>
      <ProjectEffectLine effect={project.effect} />
      <ProjectGoalLine goalRelevance={project.goalRelevance} />
      <ProjectPrerequisiteChecklist project={project} state={state} />
    </>
  )
}

function LaunchButton({
  project,
  setConfirming,
}: {
  project: Project
  setConfirming: (confirming: boolean) => void
}) {
  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="flex-1 py-2 text-[11px] font-semibold transition-colors"
      style={{ backgroundColor: 'var(--accent-solid)', color: 'var(--accent-on-solid)' }}
    >
      Launch — {naira(project.cost)} · PC:{project.pcCost}
    </button>
  )
}

function ConfirmationButtons({
  project,
  onCommission,
  setConfirming,
}: {
  project: Project
  onCommission: () => void
  setConfirming: (confirming: boolean) => void
}) {
  return (
    <>
      <button
        type="button"
        onClick={onCommission}
        className="flex-1 py-2 text-[11px] font-semibold"
        style={{ backgroundColor: '#16a34a', color: 'white' }}
      >
        Confirm — {naira(project.cost)} · PC:{project.pcCost}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="flex-1 py-2 text-[11px] font-semibold border"
        style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
      >
        Cancel
      </button>
    </>
  )
}

function UnaffordableButton({ project, stats }: { project: Project; stats: GameState['stats'] }) {
  const message =
    stats.cashReserve < project.cost
      ? `Need ₦${(project.cost - stats.cashReserve).toFixed(1)}bn more cash`
      : `Need ${project.pcCost - stats.politicalCapital} more PC`
  return (
    <button
      type="button"
      disabled
      className="flex-1 py-2 text-[11px] font-semibold"
      style={{
        backgroundColor: '#222',
        color: '#d97706',
        cursor: 'not-allowed',
        border: '1px solid #d97706',
      }}
    >
      {message}
    </button>
  )
}

function LockedButton({ project }: { project: Project }) {
  return (
    <button
      type="button"
      disabled
      className="flex-1 py-2 text-[11px] font-semibold"
      style={{
        backgroundColor: '#222',
        color: '#888',
        cursor: 'not-allowed',
        border: '1px solid #555',
      }}
    >
      Requires: {project.prerequisites?.map((prereq) => prereq.label).join(', ') ?? 'prerequisites'}
    </button>
  )
}

function ProjectDetailActions({
  project,
  selectedState,
  state,
  confirming,
  setConfirming,
  setSelectedProjectId,
  onCommission,
}: {
  project: Project
  selectedState: ActionableCardState
  state: GameState
  confirming: boolean
  setConfirming: (confirming: boolean) => void
  setSelectedProjectId: (projectId: string | null) => void
  onCommission: () => void
}) {
  function handleBack() {
    setSelectedProjectId(null)
    setConfirming(false)
  }

  return (
    <div className="flex gap-2 pt-1">
      {selectedState === 'available' && !confirming && (
        <LaunchButton project={project} setConfirming={setConfirming} />
      )}
      {confirming && (
        <ConfirmationButtons
          project={project}
          onCommission={onCommission}
          setConfirming={setConfirming}
        />
      )}
      {selectedState === 'unaffordable' && (
        <UnaffordableButton project={project} stats={state.stats} />
      )}
      {selectedState === 'locked' && <LockedButton project={project} />}
      <button
        type="button"
        onClick={handleBack}
        className="px-3 py-2 text-[11px] border"
        style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
      >
        Back
      </button>
    </div>
  )
}

function ProjectDetailsPanel({
  selectedProject,
  selectedState,
  state,
  confirming,
  setConfirming,
  setSelectedProjectId,
  onCommission,
  onClose,
}: {
  selectedProject: Project | null | undefined
  selectedState: CardState | null | undefined
  state: GameState
  confirming: boolean
  setConfirming: (confirming: boolean) => void
  setSelectedProjectId: (projectId: string | null) => void
  onCommission: () => void
  onClose: () => void
}) {
  if (!selectedProject || !isActionableCardState(selectedState)) return null

  return (
    <div
      className="absolute inset-0 flex items-center justify-center z-10 p-4"
      style={{ backgroundColor: 'transparent' }}
    >
      <button
        type="button"
        aria-label="Close project details"
        className="absolute inset-0"
        style={{
          backgroundColor: 'rgba(0,0,0,0.4)',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
        }}
        onClick={onClose}
      />
      <div
        className="relative z-10 w-full max-w-md border rounded-lg p-4 space-y-3"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: selectedState === 'available' ? 'var(--accent-solid)' : 'var(--border)',
        }}
      >
        <ProjectDetailsSummary project={selectedProject} state={state} />
        <ProjectDetailActions
          project={selectedProject}
          selectedState={selectedState}
          state={state}
          confirming={confirming}
          setConfirming={setConfirming}
          setSelectedProjectId={setSelectedProjectId}
          onCommission={onCommission}
        />
      </div>
    </div>
  )
}

function ProjectCategoryGroup({
  category,
  projects,
  cardStates,
  onProjectClick,
}: {
  category: string
  projects: Project[]
  cardStates: Map<string, CardState>
  onProjectClick: (projectId: string) => void
}) {
  const categoryColor = CATEGORY_COLORS[category]
  return (
    <div>
      <h3
        className="text-[11px] font-semibold uppercase tracking-wider mb-2"
        style={{ color: categoryColor?.solid ?? '#aaa' }}
      >
        {category}
      </h3>
      <div className="space-y-2">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            category={category}
            cardState={cardStates.get(project.id) ?? 'locked'}
            onClick={onProjectClick}
          />
        ))}
      </div>
    </div>
  )
}

function ProjectsList({
  grouped,
  cardStates,
  onProjectClick,
}: {
  grouped: ProjectGroup[]
  cardStates: Map<string, CardState>
  onProjectClick: (projectId: string) => void
}) {
  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {grouped.map(({ category, projects }) => (
          <ProjectCategoryGroup
            key={category}
            category={category}
            projects={projects}
            cardStates={cardStates}
            onProjectClick={onProjectClick}
          />
        ))}
      </div>
    </div>
  )
}

export function ProjectsPanel({ onClose }: { onClose: () => void }) {
  const cashReserve = useGameStore((s) => s.stats.cashReserve)
  const stats = useGameStore((s) => s.stats)
  const state = useGameStore((s) => s)
  const commissionProjectAction = useGameStore((s) => s.commissionProject)

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)

  const cardStates = useMemo(() => buildCardStates(state), [state])
  const grouped = useMemo(groupProjects, [])

  const selectedProject = selectedProjectId ? getProjectDef(selectedProjectId) : null
  const selectedState = selectedProjectId ? cardStates.get(selectedProjectId) : null
  const netFlow = stats.igr - stats.expenditure
  const weeksOfCash = computeWeeksOfCash(cashReserve, netFlow)

  function handleClick(projectId: string) {
    const cardState = cardStates.get(projectId)
    if (isActionableCardState(cardState)) {
      setSelectedProjectId(projectId)
      setConfirming(false)
    }
  }

  function handleCommission() {
    if (!selectedProjectId) return
    commissionProjectAction(selectedProjectId)
    setConfirming(false)
    setSelectedProjectId(null)
    onClose()
  }

  function handleDetailsClose() {
    setSelectedProjectId(null)
    setConfirming(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
    >
      <ProjectsHeader
        cashReserve={cashReserve}
        stats={stats}
        weeksOfCash={weeksOfCash}
        onClose={onClose}
      />
      <ProjectsList grouped={grouped} cardStates={cardStates} onProjectClick={handleClick} />
      {selectedProject && (
        <ProjectDetailsPanel
          selectedProject={selectedProject}
          selectedState={selectedState}
          state={state}
          confirming={confirming}
          setConfirming={setConfirming}
          setSelectedProjectId={setSelectedProjectId}
          onCommission={handleCommission}
          onClose={handleDetailsClose}
        />
      )}
    </div>
  )
}
