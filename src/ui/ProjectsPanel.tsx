import { useState, useMemo } from 'react'
import { X, Wrench, Lock, Clock, CheckCircle, CircleDollarSign } from 'lucide-react'
import { useGameStore } from '../state/gameStore'
import { PROJECTS } from '../data/projects'
import { getProjectDef, getProjectStatus } from '../engine/projectsEngine'
import type { GameState } from '../state/types'

const CATEGORY_ORDER = ['transport', 'power', 'water', 'health', 'education', 'security', 'housing', 'environment'] as const

const CATEGORY_COLORS: Record<string, { solid: string; bg: string; text: string }> = {
  transport:    { solid: '#5899D2', bg: '#1a2a3a', text: '#a0c4e8' },
  power:        { solid: '#D4A820', bg: '#2a2410', text: '#e8d488' },
  water:        { solid: '#3DA8C0', bg: '#0a2a30', text: '#88d0e0' },
  health:       { solid: '#3Aa85A', bg: '#0a2a18', text: '#80d8a0' },
  education:    { solid: '#8A6AE8', bg: '#1a1040', text: '#c0a8f0' },
  security:     { solid: '#D85040', bg: '#2a1010', text: '#e8a098' },
  housing:      { solid: '#D08030', bg: '#2a1a08', text: '#e8c088' },
  environment:  { solid: '#40A880', bg: '#082818', text: '#88d8b8' },
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

  if (state.stats.cashReserve < def.cost || state.stats.politicalCapital < def.pcCost) return 'unaffordable'

  return 'available'
}

function cardBorderColor(state: CardState, category: string): string {
  const c = CATEGORY_COLORS[category]
  switch (state) {
    case 'available':    return c?.solid ?? '#666'
    case 'unaffordable': return c?.solid ?? '#555'
    case 'commissioned': return '#a855f7'
    case 'completed':    return '#16a34a'
    case 'locked':       return '#444'
    default:             return '#444'
  }
}

function cardBackground(state: CardState, category: string): string {
  const c = CATEGORY_COLORS[category]
  switch (state) {
    case 'available':    return c?.bg ?? '#1a1a2a'
    case 'unaffordable': return '#181818'
    case 'commissioned': return '#1a0a30'
    case 'completed':    return '#0a2010'
    case 'locked':       return '#111'
    default:             return '#111'
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

  const cardStates = useMemo(() => {
    const map = new Map<string, CardState>()
    for (const project of PROJECTS) {
      map.set(project.id, computeCardState(project.id, state))
    }
    return map
  }, [state])

  const selectedProject = selectedProjectId ? getProjectDef(selectedProjectId) : null
  const selectedState = selectedProjectId ? cardStates.get(selectedProjectId) : null

  function handleClick(projectId: string) {
    const st = cardStates.get(projectId)
    if (st === 'available' || st === 'unaffordable' || st === 'locked') {
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
                  style={{ color: dc?.solid ?? '#aaa' }}
                >
                  {category}
                </h3>
                <div className="space-y-2">
                  {projects.map((project) => {
                    const cs = cardStates.get(project.id) ?? 'locked'
                    const bc = cardBorderColor(cs, category)
                    const bg = cardBackground(cs, category)
                    const clickable = cs === 'available' || cs === 'unaffordable' || cs === 'locked'
                    const iconColor = cs === 'locked' ? '#555' : '#888'
                    const titleColor = cs === 'available' ? '#f0f0f0' : cs === 'unaffordable' ? '#ccc' : '#999'
                    const descColor = cs === 'available' ? '#ccc' : '#999'
                    const metaColor = cs === 'available' ? (dc?.text ?? '#aaa') : '#888'

                    return (
                      <button
                        key={project.id}
                        type="button"
                        onClick={() => handleClick(project.id)}
                        className="w-full text-left p-3 border text-[11px]"
                        style={{
                          borderColor: bc,
                          backgroundColor: bg,
                          cursor: clickable ? 'pointer' : 'default',
                          borderRadius: '6px',
                        }}
                        disabled={!clickable}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              {cs === 'locked' && <Lock width={10} height={10} stroke={iconColor} />}
                              {cs === 'unaffordable' && <CircleDollarSign width={10} height={10} stroke="#d97706" />}
                              {cs === 'commissioned' && <Clock width={10} height={10} stroke="#a855f7" />}
                              {cs === 'completed' && <CheckCircle width={10} height={10} stroke="#16a34a" />}
                              <span className="font-semibold" style={{ color: titleColor }}>
                                {project.title}
                              </span>
                            </div>
                            <p className="text-[10px] mt-0.5 leading-relaxed" style={{ color: descColor }}>
                              {project.pitch}
                            </p>
                            {(cs === 'available' || cs === 'unaffordable') && (
                              <p className="text-[9px] mt-1" style={{ color: metaColor }}>
                                ₦{project.cost.toFixed(1)}bn · PC:{project.pcCost} · {project.weeksToComplete}w
                                {project.goalRelevance && project.goalRelevance.length > 0 && (
                                  <span className="ml-2 opacity-70">· advances {project.goalRelevance.join(', ')}</span>
                                )}
                              </p>
                            )}
                            {cs === 'locked' && (
                              <p className="text-[9px] mt-1" style={{ color: '#888' }}>
                                Needs: {project.prerequisites && project.prerequisites.length > 0
                                  ? project.prerequisites.map((p) => p.label).join(', ')
                                  : 'Research or project dependency'}
                              </p>
                            )}
                            {cs === 'commissioned' && (
                              <span className="text-[9px]" style={{ color: '#a855f7' }}>In progress...</span>
                            )}
                            {cs === 'completed' && (
                              <span className="text-[9px]" style={{ color: '#16a34a' }}>Completed</span>
                            )}
                          </div>
                          <span
                            className="text-[8px] font-semibold uppercase shrink-0 px-1.5 py-0.5"
                            style={{
                              color: cs === 'available' ? bc : cs === 'unaffordable' ? '#d97706' : cs === 'commissioned' ? '#a855f7' : cs === 'completed' ? '#16a34a' : '#555',
                              border: `1px solid ${cs === 'available' ? bc : cs === 'unaffordable' ? '#d97706' : cs === 'commissioned' ? '#a855f7' : cs === 'completed' ? '#16a34a' : '#444'}`,
                              borderRadius: '2px',
                            }}
                          >
                            {cs}
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
      {selectedProject && (selectedState === 'available' || selectedState === 'unaffordable' || selectedState === 'locked') && (
        <div
          className="absolute inset-0 flex items-center justify-center z-10 p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
          onClick={() => { setSelectedProjectId(null); setConfirming(false) }}
        >
          <div
            className="w-full max-w-md border rounded-lg p-4 space-y-3"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: selectedState === 'available' ? 'var(--accent-solid)' : 'var(--border)',
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
              {selectedState === 'available' && !confirming && (
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
              {selectedState === 'unaffordable' && (
                <button
                  type="button"
                  disabled
                  className="flex-1 py-2 text-[11px] font-semibold"
                  style={{ backgroundColor: '#222', color: '#d97706', cursor: 'not-allowed', border: '1px solid #d97706' }}
                >
                  {stats.cashReserve < selectedProject.cost
                    ? `Need ₦${(selectedProject.cost - stats.cashReserve).toFixed(1)}bn more cash`
                    : `Need ${selectedProject.pcCost - stats.politicalCapital} more PC`}
                </button>
              )}
              {selectedState === 'locked' && (
                <button
                  type="button"
                  disabled
                  className="flex-1 py-2 text-[11px] font-semibold"
                  style={{ backgroundColor: '#222', color: '#888', cursor: 'not-allowed', border: '1px solid #555' }}
                >
                  Requires: {selectedProject.prerequisites?.map((p) => p.label).join(', ') ?? 'prerequisites'}
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
