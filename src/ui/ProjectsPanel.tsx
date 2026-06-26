import { useState, useMemo } from 'react'
import { X, Wrench, Lock, Clock, CheckCircle } from 'lucide-react'
import { useGameStore } from '../state/gameStore'
import { PROJECTS } from '../data/projects'
import { getProjectDef, getProjectStatus } from '../engine/projectsEngine'
import type { ResearchNodeStatus } from '../state/types'

const CATEGORY_ORDER = ['transport', 'power', 'water', 'health', 'education', 'security', 'housing', 'environment'] as const

const CATEGORY_COLORS: Record<string, { solid: string; bg: string; text: string }> = {
  transport:    { solid: '#2563eb', bg: '#1e3a5f', text: '#93c5fd' },
  power:        { solid: '#d97706', bg: '#3a2a1a', text: '#fde68a' },
  water:        { solid: '#0891b2', bg: '#0a2e3a', text: '#67e8f9' },
  health:       { solid: '#16a34a', bg: '#1a3a2a', text: '#86efac' },
  education:    { solid: '#7c3aed', bg: '#2e1a5e', text: '#c4b5fd' },
  security:     { solid: '#dc2626', bg: '#3a1a1a', text: '#fca5a5' },
  housing:      { solid: '#ea580c', bg: '#3a1f0a', text: '#fdba74' },
  environment:  { solid: '#059669', bg: '#0a2a1a', text: '#6ee7b7' },
}

function categoryStatusColor(status: ResearchNodeStatus, category: string): string {
  const c = CATEGORY_COLORS[category]
  switch (status) {
    case 'available':    return c?.solid ?? '#666'
    case 'commissioned': return '#a855f7'
    case 'completed':    return '#16a34a'
    case 'locked':       return '#555'
    default:             return '#555'
  }
}

function categoryBackgroundColor(status: ResearchNodeStatus, category: string): string {
  const c = CATEGORY_COLORS[category]
  switch (status) {
    case 'available':    return c?.bg ?? '#222'
    case 'commissioned': return '#3b1a6e'
    case 'completed':    return '#1a3a1a'
    case 'locked':       return '#1a1a1a'
    default:             return '#1a1a1a'
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

export function ProjectsPanel({ onClose }: { onClose: () => void }) {
  const cashReserve = useGameStore((s) => s.stats.cashReserve)
  const stats = useGameStore((s) => s.stats)
  const state = useGameStore((s) => s)
  const commissionProjectAction = useGameStore((s) => s.commissionProject)

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)

  const projectStatuses = useMemo(() => {
    const map = new Map<string, ResearchNodeStatus>()
    for (const project of PROJECTS) {
      map.set(project.id, getProjectStatus(project.id, state))
    }
    return map
  }, [state])

  const selectedProject = selectedProjectId ? getProjectDef(selectedProjectId) : null
  const selectedStatus = selectedProjectId ? projectStatuses.get(selectedProjectId) : null

  function handleClick(projectId: string) {
    const status = projectStatuses.get(projectId)
    if (status === 'available' || status === 'locked') {
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

  const netFlow = stats.igr - stats.expenditure
  const weeksOfCash = netFlow >= 0 ? Infinity : Math.abs(cashReserve / Math.max(0.1, Math.abs(netFlow)))

  const grouped = useMemo(() => {
    const groups: { category: string; projects: typeof PROJECTS }[] = []
    for (const cat of CATEGORY_ORDER) {
      const catProjects = PROJECTS.filter((p) => p.category === cat)
      if (catProjects.length > 0) {
        groups.push({ category: cat, projects: catProjects })
      }
    }
    return groups
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
    >
      {/* Header */}
      <div
        className="shrink-0 flex items-center justify-between px-4 py-3"
        style={{ backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4" style={{ color: 'var(--text)' }} />
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Build / Govern</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-medium" style={{ color: cashReserve < 0 ? 'var(--error-11)' : 'var(--text-secondary)' }}>
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

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {grouped.map(({ category, projects }) => {
            const dc = CATEGORY_COLORS[category]
            return (
              <div key={category}>
                <h3
                  className="text-[11px] font-semibold uppercase tracking-wider mb-2"
                  style={{ color: dc?.solid ?? '#666' }}
                >
                  {category}
                </h3>
                <div className="space-y-2">
                  {projects.map((project) => {
                    const status = projectStatuses.get(project.id) ?? 'locked'
                    const bc = categoryStatusColor(status, category)
                    const bg = categoryBackgroundColor(status, category)
                    const isClickable = status === 'available' || status === 'locked'

                    return (
                      <button
                        key={project.id}
                        type="button"
                        onClick={() => handleClick(project.id)}
                        className="w-full text-left p-3 border text-[11px]"
                        style={{
                          borderColor: bc,
                          backgroundColor: bg,
                          opacity: status === 'locked' ? 0.6 : 1,
                          cursor: isClickable ? 'pointer' : 'default',
                          borderRadius: '6px',
                        }}
                        disabled={!isClickable}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              {status === 'locked' && <Lock width={10} height={10} stroke="#666" />}
                              {status === 'commissioned' && <Clock width={10} height={10} stroke="#a855f7" />}
                              {status === 'completed' && <CheckCircle width={10} height={10} stroke="#16a34a" />}
                              <span className="font-semibold" style={{ color: status === 'locked' ? '#888' : 'var(--text)' }}>
                                {project.title}
                              </span>
                            </div>
                            <p className="text-[10px] mt-0.5 leading-relaxed" style={{ color: status === 'locked' ? '#666' : '#aaa' }}>
                              {project.pitch}
                            </p>
                            {status === 'available' && (
                              <p className="text-[9px] mt-1" style={{ color: dc?.text ?? '#888' }}>
                                ₦{project.cost.toFixed(1)}bn · PC:{project.pcCost} · {project.weeksToComplete}w
                                {project.goalRelevance && project.goalRelevance.length > 0 && (
                                  <span className="ml-2 opacity-70">· advances {project.goalRelevance.join(', ')}</span>
                                )}
                              </p>
                            )}
                            {status === 'locked' && (
                              <p className="text-[9px] mt-1" style={{ color: '#666' }}>
                                {project.prerequisites && project.prerequisites.length > 0
                                  ? `Needs: ${project.prerequisites.map((p) => p.label).join(', ')}`
                                  : `₦${project.cost.toFixed(1)}bn · PC:${project.pcCost} needed`}
                              </p>
                            )}
                            {status === 'commissioned' && (
                              <span className="text-[9px]" style={{ color: '#a855f7' }}>In progress...</span>
                            )}
                            {status === 'completed' && (
                              <span className="text-[9px]" style={{ color: '#16a34a' }}>Completed</span>
                            )}
                          </div>
                          <span
                            className="text-[8px] font-semibold uppercase shrink-0 px-1.5 py-0.5"
                            style={{
                              color: categoryStatusColor(status, category),
                              border: `1px solid ${categoryStatusColor(status, category)}`,
                              borderRadius: '2px',
                              opacity: status === 'locked' ? 0.4 : 1,
                            }}
                          >
                            {status}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Commission panel (overlay within the overlay) */}
      {selectedProject && (selectedStatus === 'available' || selectedStatus === 'locked') && (
        <div
          className="absolute inset-0 flex items-center justify-center z-10 p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
          onClick={() => { setSelectedProjectId(null); setConfirming(false) }}
        >
          <div
            className="w-full max-w-md border rounded-lg p-4 space-y-3"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: selectedStatus === 'available' ? 'var(--accent-solid)' : 'var(--border)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <CategoryBadge category={selectedProject.category} />
            <h3 className="text-base font-bold" style={{ color: 'var(--text)' }}>{selectedProject.title}</h3>
            <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {selectedProject.pitch}
            </p>

            <div className="flex gap-3 text-[10px]">
              <span style={{ color: 'var(--text)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Cost:</span> {naira(selectedProject.cost)}
              </span>
              <span style={{ color: 'var(--text)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>PC:</span> {selectedProject.pcCost}
              </span>
              <span style={{ color: 'var(--text)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Duration:</span> {selectedProject.weeksToComplete} weeks
              </span>
            </div>

            {selectedProject.effect && Object.keys(selectedProject.effect).length > 0 && (
              <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                <span className="font-semibold" style={{ color: 'var(--accent-text)' }}>Effect: </span>
                {Object.entries(selectedProject.effect)
                  .map(([k, v]) => `${k} ${v > 0 ? '+' : ''}${v}`)
                  .join(', ')}
              </div>
            )}

            {selectedProject.goalRelevance && selectedProject.goalRelevance.length > 0 && (
              <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                <span className="font-semibold" style={{ color: 'var(--accent-text)' }}>Advances: </span>
                {selectedProject.goalRelevance.join(', ')}
              </div>
            )}

            {selectedProject.prerequisites && selectedProject.prerequisites.length > 0 && (
              <div className="space-y-0.5">
                <span className="text-[9px] font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>
                  Requirements
                </span>
                {selectedProject.prerequisites.map((prereq, i) => {
                  const met = prereq.type === 'node'
                    ? state.researchNodeStatuses[prereq.nodeId ?? ''] === 'completed' ||
                      state.projectStatuses[prereq.nodeId ?? ''] === 'completed'
                    : prereq.predicate?.(state) ?? false
                  return (
                    <div key={i} className="flex items-center gap-1.5 text-[10px]">
                      <span style={{ color: met ? '#16a34a' : 'var(--error-9)' }}>
                        {met ? '✓' : '✗'}
                      </span>
                      <span style={{ color: met ? '#16a34a' : 'var(--text-secondary)' }}>
                        {prereq.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              {selectedStatus === 'available' && !confirming && (
                <button
                  type="button"
                  onClick={() => setConfirming(true)}
                  className="flex-1 py-2 text-[11px] font-semibold transition-colors"
                  style={{ backgroundColor: 'var(--accent-solid)', color: 'var(--accent-on-solid)' }}
                >
                  Launch — {naira(selectedProject.cost)} · PC:{selectedProject.pcCost}
                </button>
              )}
              {confirming && (
                <>
                  <button
                    type="button"
                    onClick={handleCommission}
                    className="flex-1 py-2 text-[11px] font-semibold"
                    style={{ backgroundColor: '#16a34a', color: 'white' }}
                  >
                    Confirm — {naira(selectedProject.cost)} · PC:{selectedProject.pcCost}
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
              )}
              {selectedStatus === 'locked' && (
                <button
                  type="button"
                  disabled
                  className="flex-1 py-2 text-[11px] font-semibold"
                  style={{ backgroundColor: '#333', color: '#666', cursor: 'not-allowed' }}
                >
                  Locked — prerequisites not met
                </button>
              )}
              <button
                type="button"
                onClick={() => { setSelectedProjectId(null); setConfirming(false) }}
                className="px-3 py-2 text-[11px] border"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
              >
                Back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
