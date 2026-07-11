import { PROJECTS } from '../../../data/projects'
import { RESEARCH_TREE } from '../../../data/researchTree'
import { useGameStore } from '../../../state/gameStore'
import { GoalTracker } from '../../GoalTracker'
import { CommandPanel } from '../CommandPanel'
import { CommandSection } from '../CommandSection'

const CARD_GRID = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: '16px',
}
const PROJECTS_BY_ID = new Map(PROJECTS.map((project) => [project.id, project]))
const RESEARCH_BY_ID = new Map(RESEARCH_TREE.map((node) => [node.id, node]))

function Empty({ text }: { text: string }) {
  return <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>{text}</p>
}

function ProjectPipeline({
  activeCapital,
  projectsInFlight,
  onOpenProjects,
}: {
  activeCapital: {
    id: string
    name: string
    effectiveProgress: number
    weeksRemaining: number
    status: string
  }[]
  projectsInFlight: { id: string; title: string; completionWeek: number }[]
  onOpenProjects: () => void
}) {
  return (
    <CommandSection
      title="Project pipeline"
      description="Capital works already underway and the next commissioning surface."
      aside={
        <button type="button" onClick={onOpenProjects} style={actionButtonStyle()}>
          Open projects
        </button>
      }
    >
      <div style={{ display: 'grid', gap: '8px' }}>
        {activeCapital.length === 0 && projectsInFlight.length === 0 ? (
          <Empty text="No capital project is currently active or commissioned." />
        ) : null}
        {activeCapital.slice(0, 4).map((project) => (
          <ListCard
            key={project.id}
            title={project.name}
            subtitle={`${project.effectiveProgress.toFixed(0)}% complete · ${project.weeksRemaining} weeks remaining.`}
            meta={project.status}
          />
        ))}
        {projectsInFlight.slice(0, 3).map((project) => (
          <ListCard
            key={project.id}
            title={project.title}
            subtitle={`Commissioned for week ${project.completionWeek}.`}
            meta="Queued"
          />
        ))}
      </div>
    </CommandSection>
  )
}

function ResearchPipeline({
  researchInFlight,
  onOpenResearch,
}: {
  researchInFlight: { nodeId: string; title: string; completionWeek: number }[]
  onOpenResearch: () => void
}) {
  return (
    <CommandSection
      title="Research pipeline"
      description="Commissioned work that should unlock future policy or project options."
      aside={
        <button type="button" onClick={onOpenResearch} style={actionButtonStyle()}>
          Open research
        </button>
      }
    >
      <div style={{ display: 'grid', gap: '8px' }}>
        {researchInFlight.length === 0 ? (
          <Empty text="No research commission is currently running." />
        ) : null}
        {researchInFlight.slice(0, 5).map((node) => (
          <ListCard
            key={node.nodeId}
            title={node.title}
            subtitle={`Expected by week ${node.completionWeek}.`}
            meta="Commissioned"
          />
        ))}
      </div>
    </CommandSection>
  )
}

function actionButtonStyle() {
  return {
    border: '1px solid var(--accent-solid)',
    background: 'transparent',
    color: 'var(--accent-text)',
    padding: '6px 10px',
    fontSize: '11px',
    fontWeight: 600,
    cursor: 'pointer',
  } as const
}

function ListCard({ title, subtitle, meta }: { title: string; subtitle: string; meta: string }) {
  return (
    <div
      style={{
        border: '1px solid var(--border)',
        padding: '10px',
        background: 'var(--background)',
      }}
    >
      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)' }}>{title}</div>
      <div style={{ marginTop: '2px', fontSize: '11px', color: 'var(--text-secondary)' }}>
        {subtitle}
      </div>
      <div className="label-caps" style={{ marginTop: '6px', color: 'var(--accent-text)' }}>
        {meta}
      </div>
    </div>
  )
}

export function DeliveryPanel({
  onOpenProjects,
  onOpenResearch,
}: {
  onOpenProjects: () => void
  onOpenResearch: () => void
}) {
  const week = useGameStore((state) => state.week)
  const activeInitiative = useGameStore((state) => state.activeInitiative)
  const capitalProjects = useGameStore((state) => state.capitalProjects)
  const commissionedResearchNodes = useGameStore((state) => state.commissionedResearchNodes)
  const commissionedProjects = useGameStore((state) => state.commissionedProjects)
  const pendingDelayed = useGameStore((state) => state.pendingDelayed)

  const activeCapital = capitalProjects.filter((project) => project.status === 'active')
  const stalledCapital = capitalProjects.filter((project) => project.status === 'stalled')
  const researchInFlight = commissionedResearchNodes.map((node) => ({
    ...node,
    title: RESEARCH_BY_ID.get(node.nodeId)?.title ?? node.nodeId,
  }))
  const projectsInFlight = commissionedProjects.map((project) => ({
    ...project,
    title: PROJECTS_BY_ID.get(project.id)?.title ?? project.id,
  }))
  const pendingImpacts = pendingDelayed.filter((event) => event.firesOnWeek <= week + 3).length

  const statusItems = [
    {
      label: 'Capital works',
      value: activeCapital.length,
      tone: activeCapital.length > 0 ? 'info' as const : 'neutral' as const,
    },
    {
      label: 'Stalled',
      value: stalledCapital.length,
      tone: stalledCapital.length > 0 ? 'danger' as const : 'neutral' as const,
    },
    {
      label: 'Research in flight',
      value: researchInFlight.length,
      tone: researchInFlight.length > 0 ? 'info' as const : 'neutral' as const,
    },
  ]

  return (
    <CommandPanel
      question="What are we delivering?"
      summary="Track the term goal, work in flight, and the research or projects that need a decision next."
      statusItems={statusItems}
    >
      <div style={CARD_GRID}>
        <CommandSection
          title="Term goal"
          description="How current delivery ladders up to your legacy promise."
        >
          <GoalTracker />
        </CommandSection>

        <CommandSection
          title="Delivery risk"
          description="Bottlenecks that could blunt the next few weeks."
        >
          <div style={{ display: 'grid', gap: '8px' }}>
            <ListCard
              title={activeInitiative?.name ?? 'No active initiative'}
              subtitle={
                activeInitiative
                  ? `${activeInitiative.weeksRemaining} weeks remaining before payoff.`
                  : 'Launch an initiative to shift delivery capacity or revenue.'
              }
              meta={activeInitiative ? 'Initiative' : 'Slot open'}
            />
            <ListCard
              title={`${stalledCapital.length} stalled capital project${stalledCapital.length === 1 ? '' : 's'}`}
              subtitle="Stalled delivery hurts credibility faster than untouched ambition."
              meta="Projects"
            />
            <ListCard
              title={`${pendingImpacts} delayed consequence${pendingImpacts === 1 ? '' : 's'} incoming`}
              subtitle="Decisions already taken are still landing on the state machine."
              meta="Pending effects"
            />
          </div>
        </CommandSection>
      </div>

      <div style={CARD_GRID}>
        <ProjectPipeline
          activeCapital={activeCapital}
          projectsInFlight={projectsInFlight}
          onOpenProjects={onOpenProjects}
        />
        <ResearchPipeline researchInFlight={researchInFlight} onOpenResearch={onOpenResearch} />
      </div>
    </CommandPanel>
  )
}
