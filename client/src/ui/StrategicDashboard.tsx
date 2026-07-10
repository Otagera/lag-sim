import { PROJECTS } from '../data/projects'
import { RESEARCH_TREE } from '../data/researchTree'
import { useGameStore } from '../state/gameStore'
import type { CapitalProject, CommissionedProject, CommissionedResearchNode } from '../state/types'
import { EconomyPanel } from './EconomyPanel'
import { GoalTracker } from './GoalTracker'
import { useStrategicSelectors } from './useStrategicSelectors'

const naira = (v: number) => `₦${v.toFixed(1)}bn`
const colorVar = {
  success: 'var(--success-11)',
  warning: 'var(--warning-11)',
  error: 'var(--error-11)',
}

type TrackedInitiative = NonNullable<ReturnType<typeof useStrategicSelectors>['initiative']>

function ProgressBar({ progress, color }: { progress: number; color: string }) {
  return (
    <div className="w-full h-1 mb-1" style={{ backgroundColor: 'var(--neutral-4)' }}>
      <div
        className="h-full"
        style={{
          width: `${(progress * 100).toFixed(0)}%`,
          backgroundColor: color,
          transition: 'width 0.3s ease',
        }}
      />
    </div>
  )
}

function InitiativeProgressCard({ initiative }: { initiative: TrackedInitiative }) {
  return (
    <div
      className="mb-2 p-1.5 border text-[10px]"
      style={{ borderColor: 'var(--accent-solid)', backgroundColor: 'var(--accent-bg-subtle)' }}
    >
      <div className="flex justify-between mb-1">
        <span className="font-semibold" style={{ color: 'var(--accent-text)' }}>
          {initiative.name}
        </span>
        <span style={{ color: 'var(--text-secondary)' }}>{initiative.weeksRemaining}w left</span>
      </div>
      <ProgressBar progress={initiative.progress} color="var(--accent-solid)" />
      {initiative.payoff && (
        <p className="text-[9px] font-medium" style={{ color: 'var(--accent-text)' }}>
          On completion: {initiative.payoff}
        </p>
      )}
    </div>
  )
}

function progressFromDeadline(total: number, weeksLeft: number): number {
  const elapsed = total - weeksLeft
  return total > 0 ? elapsed / total : 0
}

function ResearchProgressCard({
  nodeRef,
  week,
}: {
  nodeRef: CommissionedResearchNode
  week: number
}) {
  const node = RESEARCH_TREE.find((n) => n.id === nodeRef.nodeId)
  if (!node) return null

  const weeksLeft = Math.max(0, nodeRef.completionWeek - week)
  const progress = progressFromDeadline(node.weeksToComplete, weeksLeft)
  const hasOutcomes = !!node.outcomes

  return (
    <div
      className="p-1.5 border text-[10px]"
      style={{ borderColor: 'var(--accent-solid)', backgroundColor: 'var(--accent-bg-subtle)' }}
    >
      <div className="flex justify-between mb-1">
        <span className="font-semibold" style={{ color: 'var(--accent-text)' }}>
          {node.title}
        </span>
        <span style={{ color: 'var(--text-secondary)' }}>{weeksLeft}w left</span>
      </div>
      <ProgressBar
        progress={progress}
        color={hasOutcomes ? 'var(--warning-9)' : 'var(--accent-solid)'}
      />
      <p className="text-[9px] font-medium" style={{ color: 'var(--accent-text)' }}>
        {node.domain} · {hasOutcomes ? 'uncertain outcome' : 'reliable progress'}
      </p>
    </div>
  )
}

function CommissionedProjectCard({
  projectRef,
  week,
}: {
  projectRef: CommissionedProject
  week: number
}) {
  const def = PROJECTS.find((p) => p.id === projectRef.id)
  if (!def) return null

  const weeksLeft = Math.max(0, projectRef.completionWeek - week)
  const progress = progressFromDeadline(def.weeksToComplete, weeksLeft)

  return (
    <div
      className="p-1.5 border text-[10px]"
      style={{ borderColor: 'var(--success-9)', backgroundColor: 'var(--accent-bg-subtle)' }}
    >
      <div className="flex justify-between mb-1">
        <span className="font-semibold" style={{ color: 'var(--accent-text)' }}>
          {def.title}
        </span>
        <span style={{ color: 'var(--text-secondary)' }}>{weeksLeft}w left</span>
      </div>
      <ProgressBar progress={progress} color="var(--success-9)" />
      <p className="text-[9px] font-medium" style={{ color: 'var(--success-11)' }}>
        {def.category} · reliable progress
      </p>
    </div>
  )
}

function ActiveProjectCard({ project }: { project: CapitalProject }) {
  return (
    <div className="text-[10px]">
      <div className="flex justify-between mb-0.5">
        <span style={{ color: 'var(--text)' }}>{project.name}</span>
        <span style={{ color: 'var(--text-secondary)' }}>
          {project.weeksRemaining}w · {naira(project.weeklyDraw)}/wk
        </span>
      </div>
      <ProgressBar
        progress={Math.min(100, project.effectiveProgress) / 100}
        color="var(--success-9)"
      />
      <div className="flex justify-between text-[9px]" style={{ color: 'var(--text-secondary)' }}>
        <span>{project.effectiveProgress.toFixed(0)}% complete</span>
        <span>
          {naira(project.totalSpent)} / {naira(project.totalCost)}
        </span>
      </div>
    </div>
  )
}

function BankruptcyClock() {
  const { cashReserve, netFlow, isSurplus, isInsolvent, weeksOfCashLeft } = useStrategicSelectors()

  const clockColor =
    weeksOfCashLeft === Infinity
      ? colorVar.success
      : weeksOfCashLeft > 30
        ? colorVar.success
        : weeksOfCashLeft > 12
          ? colorVar.warning
          : colorVar.error

  return (
    <div
      className="p-2 border"
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
    >
      <div className="flex items-center justify-between mb-1">
        <p className="label-caps">Cash Position</p>
        <span className="text-[15px] font-semibold" style={{ color: 'var(--text)' }}>
          {naira(cashReserve)}
        </span>
      </div>
      {isInsolvent ? (
        <p className="text-[11px] font-semibold" style={{ color: colorVar.error }}>
          Overdrawn — no credit remaining
        </p>
      ) : isSurplus ? (
        <p className="text-[11px] font-semibold" style={{ color: colorVar.success }}>
          Surplus · building reserves
        </p>
      ) : (
        <>
          <p
            className="text-[22px] font-bold tracking-tight leading-none"
            style={{ color: clockColor }}
          >
            {weeksOfCashLeft < 100 ? `~${Math.floor(weeksOfCashLeft)}` : '99+'}
            <span
              className="text-[11px] font-medium ml-1"
              style={{ color: 'var(--text-secondary)' }}
            >
              weeks
            </span>
          </p>
          <p className="text-[9px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            of cash at current burn (₦{Math.abs(netFlow).toFixed(1)}bn/wk)
          </p>
        </>
      )}
    </div>
  )
}

function InitiativeTracker() {
  const { initiative, activeProjects } = useStrategicSelectors()
  const week = useGameStore((s) => s.week)
  const commissionedNodes = useGameStore((s) => s.commissionedResearchNodes)
  const commissionedProjects = useGameStore((s) => s.commissionedProjects)

  const hasAny =
    initiative ||
    activeProjects.length > 0 ||
    commissionedNodes.length > 0 ||
    commissionedProjects.length > 0
  if (!hasAny) return null

  return (
    <div
      className="p-2 border"
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
    >
      <h3 className="label-caps mb-1.5">In Flight</h3>

      {initiative && <InitiativeProgressCard initiative={initiative} />}

      {commissionedNodes.length > 0 && (
        <div className="space-y-1.5 mb-2">
          {commissionedNodes.map((nodeRef) => (
            <ResearchProgressCard key={nodeRef.nodeId} nodeRef={nodeRef} week={week} />
          ))}
        </div>
      )}

      {commissionedProjects.length > 0 && (
        <div className="space-y-1.5 mb-2">
          {commissionedProjects.map((projectRef) => (
            <CommissionedProjectCard key={projectRef.id} projectRef={projectRef} week={week} />
          ))}
        </div>
      )}

      {activeProjects.length > 0 && (
        <div className="space-y-1.5">
          {activeProjects.map((project) => (
            <ActiveProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  )
}

function QuarterForecast() {
  const { forecast, bankruptcyWeek, isSurplus, isInsolvent, netFlow } = useStrategicSelectors()

  if (isSurplus) return null

  const milestones = forecast.filter((f) => f.week === 4 || f.week === 8 || f.week === 12)
  const finalCash = forecast.length > 0 ? forecast[forecast.length - 1].cash : 0

  return (
    <div
      className="p-2 border"
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
    >
      <div className="flex items-center justify-between mb-1">
        <p className="label-caps">Quarter Forecast</p>
        <p className="text-[9px]" style={{ color: 'var(--text-secondary)' }}>
          projection · assumes no new decisions
        </p>
      </div>

      {forecast.length > 0 && (
        <>
          {/* Mini sparkline as a row of bars */}
          <div className="flex items-end gap-px h-8 mb-1.5">
            {forecast.map((f) => {
              const barPct = Math.min(100, (f.cash / forecast[0].cash) * 100)
              const negative = f.cash < 0
              return (
                <div
                  key={f.week}
                  className="flex-1 flex flex-col items-center justify-end"
                  title={`Wk+${f.week}: ${naira(f.cash)}`}
                >
                  <div
                    className="w-full"
                    style={{
                      height: `${negative ? 0 : Math.max(3, barPct)}%`,
                      backgroundColor: negative
                        ? 'var(--error-9)'
                        : f.cash < forecast[0].cash * 0.5
                          ? 'var(--warning-9)'
                          : 'var(--success-9)',
                      opacity: 0.8,
                    }}
                  />
                </div>
              )
            })}
          </div>

          <div className="flex justify-between text-[10px] mb-1">
            {milestones.map((m) => (
              <span
                key={m.week}
                style={{ color: m.cash < 0 ? colorVar.error : 'var(--text-secondary)' }}
              >
                Wk+{m.week}: {naira(m.cash)}
              </span>
            ))}
          </div>

          {isInsolvent ? (
            <p className="text-[9px] font-semibold" style={{ color: colorVar.error }}>
              Already insolvent — emergency loan or bankruptcy imminent
            </p>
          ) : (
            finalCash < 0 && (
              <p className="text-[9px] font-semibold" style={{ color: colorVar.error }}>
                Projected bankruptcy:
                {bankruptcyWeek ? ` week ${bankruptcyWeek}` : ' this quarter'}
              </p>
            )
          )}
          {netFlow < 0 && finalCash >= 0 && (
            <p className="text-[9px]" style={{ color: 'var(--text-secondary)' }}>
              Cash positive at 12 weeks · run rate {naira(Math.abs(netFlow))}/wk
            </p>
          )}
        </>
      )}
    </div>
  )
}

export function StrategicDashboard({ showGoalTracker = true }: { showGoalTracker?: boolean }) {
  return (
    <div className="space-y-2">
      <BankruptcyClock />
      <EconomyPanel />
      <InitiativeTracker />
      {showGoalTracker ? <GoalTracker /> : null}
      <QuarterForecast />
    </div>
  )
}
