import { useState, useMemo } from 'react'
import { X, GitBranch, Lock, Clock, CheckCircle } from 'lucide-react'
import { useGameStore } from '../state/gameStore'
import { RESEARCH_TREE } from '../data/researchTree'
import { computeNodeLayout, getNodeStatus, getNodeDef, getPrereqLines } from '../engine/researchEngine'
import type { ResearchNodeStatus } from '../state/types'

const DOMAIN_COLORS: Record<string, { solid: string; bg: string; text: string; line: string }> = {
  security:    { solid: '#2563eb', bg: '#1e3a5f', text: '#93c5fd', line: '#3b82f6' },
  agriculture: { solid: '#16a34a', bg: '#1a3a2a', text: '#86efac', line: '#22c55e' },
  innovation:  { solid: '#d97706', bg: '#3a2a1a', text: '#fde68a', line: '#eab308' },
  administration: { solid: '#7c3aed', bg: '#2e1a5e', text: '#c4b5fd', line: '#8b5cf6' },
  climate:    { solid: '#0891b2', bg: '#0a2e3a', text: '#67e8f9', line: '#06b6d4' },
}

const NODE_WIDTH = 220
const NODE_HEIGHT = 72

function nodeStatusColor(status: ResearchNodeStatus, domain: string): string {
  const domainColor = DOMAIN_COLORS[domain]
  switch (status) {
    case 'available':    return domainColor?.solid ?? '#666'
    case 'commissioned': return '#a855f7'
    case 'completed':    return '#16a34a'
    case 'locked':       return '#555'
    default:             return '#555'
  }
}

function nodeBackgroundColor(status: ResearchNodeStatus, domain: string): string {
  const c = DOMAIN_COLORS[domain]
  switch (status) {
    case 'available':    return c?.bg ?? '#222'
    case 'commissioned': return '#3b1a6e'
    case 'completed':    return '#1a3a1a'
    case 'locked':       return '#1a1a1a'
    default:             return '#1a1a1a'
  }
}

const naira = (v: number) => `₦${v.toFixed(1)}bn`

function DomainBadge({ domain }: { domain: string }) {
  const c = DOMAIN_COLORS[domain]
  return (
    <span
      className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5"
      style={{ color: c?.text ?? '#999', backgroundColor: c?.bg ?? '#333' }}
    >
      {domain}
    </span>
  )
}

export function ResearchTree({ onClose }: { onClose: () => void }) {
  const cashReserve = useGameStore((s) => s.stats.cashReserve)
  const stats = useGameStore((s) => s.stats)
  const state = useGameStore((s) => s)
  const commissionResearchNodeAction = useGameStore((s) => s.commissionResearchNode)

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [showMobileList, setShowMobileList] = useState(false)

  const layouts = useMemo(() => computeNodeLayout(), [])

  const lines = useMemo(() => getPrereqLines(), [])

  const nodeStatuses = useMemo(() => {
    const map = new Map<string, ResearchNodeStatus>()
    for (const node of RESEARCH_TREE) {
      map.set(node.id, getNodeStatus(node.id, state))
    }
    return map
  }, [state])

  const selectedNode = selectedNodeId ? getNodeDef(selectedNodeId) : null
  const selectedStatus = selectedNodeId ? nodeStatuses.get(selectedNodeId) : null

  function handleNodeClick(nodeId: string) {
    const status = nodeStatuses.get(nodeId)
    if (status === 'available' || status === 'locked') {
      setSelectedNodeId(nodeId)
      setConfirming(false)
    }
  }

  function handleCommission() {
    if (!selectedNodeId) return
    commissionResearchNodeAction(selectedNodeId)
    setConfirming(false)
    setSelectedNodeId(null)
    onClose()
  }

  function svgWidth() {
    const xs = layouts.map((l) => l.x)
    const maxX = Math.max(...xs, 0)
    return Math.max(800, maxX + NODE_WIDTH + 50)
  }

  function svgHeight() {
    const ys = layouts.map((l) => l.y)
    const maxY = Math.max(...ys, 0)
    return Math.max(300, maxY + NODE_HEIGHT + 40)
  }

  const netFlow = (stats.igr - stats.expenditure)
  const weeksOfCash = netFlow >= 0 ? Infinity : Math.abs(cashReserve / Math.max(0.1, Math.abs(netFlow)))

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
          <GitBranch className="w-4 h-4" style={{ color: 'var(--text)' }} />
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Commission the Future</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-medium" style={{ color: cashReserve < 0 ? 'var(--error-11)' : 'var(--text-secondary)' }}>
            Cash: {naira(cashReserve)}
          </span>
          <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
            {weeksOfCash === Infinity ? 'Surplus' : `~${Math.floor(weeksOfCash)}w remain`}
          </span>
          <button
            type="button"
            className="lg:hidden px-2 py-1 text-[10px] border"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            onClick={() => setShowMobileList(!showMobileList)}
          >
            {showMobileList ? 'Graph' : 'List'}
          </button>
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
      <div className="flex-1 overflow-hidden flex">
        {/* Graph — desktop */}
        <div className={`flex-1 overflow-auto p-4 ${showMobileList ? 'hidden' : ''} lg:block`}>
          <svg
            width={svgWidth()}
            height={svgHeight()}
            viewBox={`0 0 ${svgWidth()} ${svgHeight()}`}
            style={{ minWidth: svgWidth(), minHeight: svgHeight() }}
          >
            {/* Prerequisite lines */}
            {lines.map((line) => {
              const from = layouts.find((l) => l.nodeId === line.from)
              const to = layouts.find((l) => l.nodeId === line.to)
              if (!from || !to) return null
              return (
                <line
                  key={`${line.from}-${line.to}`}
                  x1={from.x + NODE_WIDTH / 2}
                  y1={from.y + NODE_HEIGHT}
                  x2={to.x + NODE_WIDTH / 2}
                  y2={to.y}
                  stroke={line.crossDomain ? '#888' : (DOMAIN_COLORS[RESEARCH_TREE.find(n => n.id === line.from)?.domain ?? '']?.line ?? '#666')}
                  strokeWidth={line.crossDomain ? 1 : 2}
                  strokeDasharray={line.crossDomain ? '5,3' : 'none'}
                  opacity={0.4}
                />
              )
            })}

            {/* Nodes */}
            {layouts.map((layout) => {
              const node = getNodeDef(layout.nodeId)
              if (!node) return null
              const status = nodeStatuses.get(layout.nodeId) ?? 'locked'
              const borderColor = nodeStatusColor(status, node.domain)
              const bgColor = nodeBackgroundColor(status, node.domain)
              const isClickable = status === 'available' || status === 'locked'
              const domainColor = DOMAIN_COLORS[node.domain]

              return (
                <g
                  key={layout.nodeId}
                  onClick={() => handleNodeClick(layout.nodeId)}
                  style={{ cursor: isClickable ? 'pointer' : 'default' }}
                >
                  {/* Card background */}
                  <rect
                    x={layout.x}
                    y={layout.y}
                    width={NODE_WIDTH}
                    height={NODE_HEIGHT}
                    rx={6}
                    fill={bgColor}
                    stroke={borderColor}
                    strokeWidth={status === 'available' ? 2 : 1}
                    opacity={status === 'locked' ? 0.5 : 1}
                  />

                  {/* Progress bar for commissioned */}
                  {status === 'commissioned' && (
                    <rect
                      x={layout.x + 2}
                      y={layout.y + NODE_HEIGHT - 4}
                      width={NODE_WIDTH - 4}
                      height={3}
                      rx={1.5}
                      fill="#a855f7"
                    />
                  )}

                  {/* foreignObject for proper HTML rendering */}
                  <foreignObject
                    x={layout.x}
                    y={layout.y}
                    width={NODE_WIDTH}
                    height={NODE_HEIGHT}
                  >
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '8px 10px',
                        boxSizing: 'border-box',
                        fontFamily: "'Archivo Narrow', sans-serif",
                        overflow: 'hidden',
                      }}
                      title={node.title}
                    >
                      {/* Row 1: Domain + Status icon */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                        <span
                          style={{
                            fontSize: '8px',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            color: domainColor?.text ?? '#666',
                          }}
                        >
                          {node.domain.toUpperCase()}
                        </span>
                        {status === 'completed' && (
                          <CheckCircle width={12} height={12} stroke="#16a34a" />
                        )}
                        {status === 'commissioned' && (
                          <Clock width={12} height={12} stroke="#a855f7" />
                        )}
                        {status === 'locked' && (
                          <Lock width={12} height={12} stroke="#666" />
                        )}
                      </div>

                      {/* Row 2: Title */}
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: status === 'locked' ? '#666' : '#e0e0e0',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          lineHeight: 1.3,
                        }}
                      >
                        {node.title}
                      </span>

                      {/* Row 3: Meta */}
                      {status === 'available' && (
                        <span style={{ fontSize: '9px', color: '#888', marginTop: '2px' }}>
                          {naira(node.cost)} · {node.weeksToComplete}w
                          {node.outcomes ? ' · uncertain' : ' · reliable'}
                        </span>
                      )}
                      {status === 'commissioned' && (
                        <span style={{ fontSize: '9px', color: '#a855f7', marginTop: '2px' }}>
                          In progress...
                        </span>
                      )}
                      {status === 'completed' && (
                        <span style={{ fontSize: '9px', color: '#16a34a', marginTop: '2px' }}>
                          Complete
                        </span>
                      )}
                      {status === 'locked' && (
                        <span style={{ fontSize: '8px', color: '#666', marginTop: '2px' }}>
                          {node.prerequisites.length > 0
                            ? `Needs: ${node.prerequisites[0].label}`
                            : `${naira(node.cost)} needed`}
                        </span>
                      )}
                    </div>
                  </foreignObject>
                </g>
              )
            })}
          </svg>
        </div>

        {/* Mobile list view */}
        <div className={`${showMobileList ? 'flex' : 'hidden'} lg:hidden flex-1 overflow-y-auto p-3 flex-col gap-3`}
          style={{ backgroundColor: 'var(--background)' }}
        >
          {['security', 'agriculture', 'innovation', 'administration', 'climate'].map((domain) => {
            const domainNodes = RESEARCH_TREE.filter((n) => n.domain === domain)
            if (domainNodes.length === 0) return null
            const dc = DOMAIN_COLORS[domain]
            return (
              <div key={domain}>
                <h3
                  className="text-[11px] font-semibold uppercase tracking-wider mb-1.5 px-1"
                  style={{ color: dc?.solid ?? '#666' }}
                >
                  {domain}
                </h3>
                <div className="space-y-1">
                  {domainNodes.map((node) => {
                    const status = nodeStatuses.get(node.id) ?? 'locked'
                    const bc = nodeStatusColor(status, domain)
                    const bg = nodeBackgroundColor(status, domain)
                    return (
                      <button
                        key={node.id}
                        type="button"
                        onClick={() => handleNodeClick(node.id)}
                        className="w-full text-left p-2 border text-[11px]"
                        style={{
                          borderColor: bc,
                          backgroundColor: bg,
                          opacity: status === 'locked' ? 0.5 : 1,
                          cursor: status === 'commissioned' || status === 'completed' ? 'default' : 'pointer',
                        }}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-semibold" style={{ color: status === 'locked' ? '#666' : 'var(--text)' }}>
                            {node.title}
                          </span>
                          <span className="text-[9px] font-medium uppercase" style={{ color: bc }}>
                            {status}
                          </span>
                        </div>
                        {status === 'available' && (
                          <span className="text-[9px]" style={{ color: '#888' }}>
                            {naira(node.cost)} · {node.weeksToComplete}w
                            {node.outcomes ? ' · uncertain outcome' : ' · reliable'}
                          </span>
                        )}
                        {status === 'locked' && (
                          <span className="text-[9px]" style={{ color: '#666' }}>
                            {node.prerequisites.length > 0 ? `Needs: ${node.prerequisites.map(p => p.label).join(', ')}` : 'Insufficient funds'}
                          </span>
                        )}
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
      {selectedNode && (selectedStatus === 'available' || selectedStatus === 'locked') && (
        <div
          className="absolute inset-0 flex items-center justify-center z-10 p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
          onClick={() => { setSelectedNodeId(null); setConfirming(false) }}
        >
          <div
            className="w-full max-w-md border rounded-lg p-4 space-y-3"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: selectedStatus === 'available' ? 'var(--accent-solid)' : 'var(--border)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <DomainBadge domain={selectedNode.domain} />
              <span
                className="text-[9px] font-semibold uppercase px-1.5 py-0.5"
                style={{
                  color: selectedNode.framing === 'innovation' ? '#fde68a' : '#86efac',
                  backgroundColor: selectedNode.framing === 'innovation' ? '#3a2a1a' : '#1a3a2a',
                }}
              >
                {selectedNode.framing === 'innovation' ? 'Innovation' : 'Local Implementation'}
              </span>
            </div>

            <h3 className="text-base font-bold" style={{ color: 'var(--text)' }}>{selectedNode.title}</h3>
            <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {selectedNode.pitch}
            </p>

            <div className="flex gap-3 text-[10px]">
              <span style={{ color: 'var(--text)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Cost:</span> {naira(selectedNode.cost)}
              </span>
              <span style={{ color: 'var(--text)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Duration:</span> {selectedNode.weeksToComplete} weeks
              </span>
            </div>

            {selectedNode.prerequisites.length > 0 && (
              <div className="space-y-0.5">
                <span className="text-[9px] font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>
                  Requirements
                </span>
                {selectedNode.prerequisites.map((prereq, i) => {
                  const met = prereq.type === 'node'
                    ? nodeStatuses.get(prereq.nodeId ?? '') === 'completed'
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

            {selectedNode.outcomes && (
              <div className="p-2 border text-[10px] leading-relaxed" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--accent-bg-subtle)' }}>
                <span className="font-semibold" style={{ color: 'var(--accent-text)' }}>
                  Prospects: uncertain
                </span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {' '}— Corruption, infrastructure, and cash reserves will shape the outcome. No guarantees.
                </span>
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
                  Commission — {naira(selectedNode.cost)}
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
                    Confirm — {naira(selectedNode.cost)}
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
                onClick={() => { setSelectedNodeId(null); setConfirming(false) }}
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
