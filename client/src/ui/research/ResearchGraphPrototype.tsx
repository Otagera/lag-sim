import { useEffect, useMemo, useRef, useState } from 'react'
import { RESEARCH_TREE } from '../../data/researchTree'
import { getNodeDef, getPrereqLines } from '../../engine/researchEngine'
import type { GameState, ResearchNodeStatus } from '../../state/types'
import { useReducedMotion } from '../design/useReducedMotion'
import { RESEARCH_KEYFRAMES } from './keyframes'
import { computeProgress, type MockResearchOverride, resolveMockStatus } from './mockResearchState'
import { ResearchEdge } from './ResearchEdge'
import { ResearchNodeCard } from './ResearchNodeCard'
import { computeTreeLayout } from './treeLayout'

// Mirrors ResearchTree.tsx's NODE_WIDTH/NODE_HEIGHT/DOMAIN_COLORS — duplicated
// rather than imported since this is a parallel prototype that doesn't touch
// the real screen (see plan: wiring is a separate future task).
const NODE_WIDTH = 240
const NODE_HEIGHT = 88
const COL_GAP = 30
const ROW_GAP = 40
const LANE_GAP = 60
const PAD = 56

// Cross-domain prerequisites connect nodes in different domain lanes side by
// side, not top-to-bottom like the tree's own vertical chains — anchor them
// on the card's left/right edge (whichever faces the other node) and draw a
// smooth curve instead of a straight dashed diagonal.
export function buildCrossDomainPath(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
): string {
  const y1 = fromY + NODE_HEIGHT / 2
  const y2 = toY + NODE_HEIGHT / 2
  const goingRight = fromX < toX
  const x1 = goingRight ? fromX + NODE_WIDTH : fromX
  const x2 = goingRight ? toX : toX + NODE_WIDTH
  const pull = Math.max(40, Math.abs(x2 - x1) * 0.4)
  const c1x = goingRight ? x1 + pull : x1 - pull
  const c2x = goingRight ? x2 - pull : x2 + pull
  return `M ${x1} ${y1} C ${c1x} ${y1}, ${c2x} ${y2}, ${x2} ${y2}`
}

// Same-domain tree edges (straight trunk, or a fork into siblings) — a
// vertical S-curve instead of a hard-cornered straight line. When a parent
// and child share the same x (a straight trunk, no fork) this degenerates to
// a plain vertical line automatically; forks get a soft bow instead of a
// mechanical diagonal. Control points are offset partway toward the far end
// (not pinned to the same x as their own endpoint) so the tangent — and the
// arrowhead orientation, which follows it — actually leans into the curve
// instead of always snapping to straight-down.
export function buildTreePath(x1: number, y1: number, x2: number, y2: number): string {
  const midY = (y1 + y2) / 2
  const dx = x2 - x1
  const c1x = x1 + dx * 0.3
  const c2x = x2 - dx * 0.3
  return `M ${x1} ${y1} C ${c1x} ${midY}, ${c2x} ${midY}, ${x2} ${y2}`
}

const DOMAIN_COLORS: Record<string, { solid: string; bg: string; text: string; line: string }> = {
  security: { solid: '#2563eb', bg: '#1e3a5f', text: '#93c5fd', line: '#3b82f6' },
  agriculture: { solid: '#16a34a', bg: '#1a3a2a', text: '#86efac', line: '#22c55e' },
  innovation: { solid: '#d97706', bg: '#3a2a1a', text: '#fde68a', line: '#eab308' },
  administration: { solid: '#7c3aed', bg: '#2e1a5e', text: '#c4b5fd', line: '#8b5cf6' },
  climate: { solid: '#0891b2', bg: '#0a2e3a', text: '#67e8f9', line: '#06b6d4' },
}

export interface ResearchGraphPrototypeProps {
  overrides: Record<string, MockResearchOverride>
  currentWeek: number
  baseState: GameState
  forceReducedMotion?: boolean
  onNodeClick?: (nodeId: string) => void
}

type ResearchLayout = ReturnType<typeof computeTreeLayout>[number]
type PrereqLine = ReturnType<typeof getPrereqLines>[number]

function useResearchStatuses(
  overrides: Record<string, MockResearchOverride>,
  baseState: GameState,
) {
  const statuses = useMemo(() => {
    const map = new Map<string, ResearchNodeStatus>()
    for (const node of RESEARCH_TREE)
      map.set(node.id, resolveMockStatus(node.id, overrides, baseState))
    return map
  }, [overrides, baseState])

  // Diff statuses each render to catch 'completed' transitions and trigger a one-shot flash.
  const prevStatuses = useRef<Map<string, ResearchNodeStatus>>(new Map())
  const [justCompleted, setJustCompleted] = useState<Set<string>>(new Set())

  useEffect(() => {
    const newlyCompleted: string[] = []
    for (const [nodeId, status] of statuses) {
      const prev = prevStatuses.current.get(nodeId)
      if (status === 'completed' && prev && prev !== 'completed') newlyCompleted.push(nodeId)
      prevStatuses.current.set(nodeId, status)
    }
    if (newlyCompleted.length > 0) {
      setJustCompleted((s) => new Set([...s, ...newlyCompleted]))
    }
  }, [statuses])

  function clearFlash(nodeId: string) {
    setJustCompleted((s) => {
      if (!s.has(nodeId)) return s
      const next = new Set(s)
      next.delete(nodeId)
      return next
    })
  }

  return { statuses, justCompleted, clearFlash }
}

function ResearchGraphDefs() {
  return (
    <defs>
      {Object.entries(DOMAIN_COLORS).map(([domain, c]) => (
        <marker
          key={domain}
          id={`research-arrow-${domain}`}
          viewBox="0 0 10 10"
          refX="8.5"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L10,5 L0,10 z" fill={c.line} />
        </marker>
      ))}
    </defs>
  )
}

interface ResearchGraphEdgesProps {
  lines: PrereqLine[]
  layouts: ResearchLayout[]
  statuses: Map<string, ResearchNodeStatus>
  overrides: Record<string, MockResearchOverride>
  currentWeek: number
  reduced: boolean
}

function ResearchGraphEdges({
  lines,
  layouts,
  statuses,
  overrides,
  currentWeek,
  reduced,
}: ResearchGraphEdgesProps) {
  return lines.map((line) => {
    const from = layouts.find((l) => l.nodeId === line.from)
    const to = layouts.find((l) => l.nodeId === line.to)
    const fromNode = getNodeDef(line.from)
    const toNode = getNodeDef(line.to)
    if (!from || !to || !fromNode || !toNode) return null

    const targetStatus = statuses.get(line.to) ?? 'locked'
    const toOverride = overrides[line.to]
    const progress =
      targetStatus === 'commissioned' && toOverride
        ? computeProgress(toOverride, currentWeek)
        : null
    const arrowMarkerId = `research-arrow-${fromNode.domain}`
    const d = line.crossDomain
      ? buildCrossDomainPath(from.x, from.y, to.x, to.y)
      : buildTreePath(from.x + NODE_WIDTH / 2, from.y + NODE_HEIGHT, to.x + NODE_WIDTH / 2, to.y)

    return (
      <ResearchEdge
        key={`${line.from}-${line.to}`}
        d={d}
        color={DOMAIN_COLORS[fromNode.domain]?.line ?? '#666'}
        targetStatus={targetStatus}
        progress={progress}
        reduced={reduced}
        arrowMarkerId={arrowMarkerId}
      />
    )
  })
}

interface ResearchGraphNodesProps {
  layouts: ResearchLayout[]
  statuses: Map<string, ResearchNodeStatus>
  overrides: Record<string, MockResearchOverride>
  currentWeek: number
  justCompleted: Set<string>
  clearFlash: (nodeId: string) => void
  reduced: boolean
  onNodeClick?: (nodeId: string) => void
}

function ResearchGraphNodes({
  layouts,
  statuses,
  overrides,
  currentWeek,
  justCompleted,
  clearFlash,
  reduced,
  onNodeClick,
}: ResearchGraphNodesProps) {
  return layouts.map((layout) => {
    const node = getNodeDef(layout.nodeId)
    if (!node) return null
    const status = statuses.get(layout.nodeId) ?? 'locked'
    const override = overrides[layout.nodeId]
    const progress =
      status === 'commissioned' && override ? computeProgress(override, currentWeek) : null
    const domainColor = DOMAIN_COLORS[node.domain] ?? { solid: '#666', bg: '#222', text: '#999' }
    const isClickable = status === 'available' || status === 'locked'

    return (
      <ResearchNodeCard
        key={layout.nodeId}
        x={layout.x}
        y={layout.y}
        width={NODE_WIDTH}
        height={NODE_HEIGHT}
        node={node}
        status={status}
        progress={progress}
        domainColor={domainColor}
        isClickable={isClickable}
        flash={justCompleted.has(layout.nodeId)}
        reduced={reduced}
        onClick={() => onNodeClick?.(layout.nodeId)}
        onFlashDone={() => clearFlash(layout.nodeId)}
      />
    )
  })
}

export function ResearchGraphPrototype({
  overrides,
  currentWeek,
  baseState,
  forceReducedMotion,
  onNodeClick,
}: ResearchGraphPrototypeProps) {
  const osReduced = useReducedMotion()
  const reduced = Boolean(forceReducedMotion) || osReduced

  const layouts = useMemo(
    () => computeTreeLayout(NODE_WIDTH, NODE_HEIGHT, COL_GAP, ROW_GAP, LANE_GAP, PAD),
    [],
  )
  const lines = useMemo(() => getPrereqLines(), [])
  const { statuses, justCompleted, clearFlash } = useResearchStatuses(overrides, baseState)

  const bounds = useMemo(() => {
    if (layouts.length === 0) return { minX: 0, minY: 0, maxX: 800, maxY: 300 }
    const xs = layouts.flatMap((l) => [l.x, l.x + NODE_WIDTH])
    const ys = layouts.flatMap((l) => [l.y, l.y + NODE_HEIGHT])
    return {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys),
    }
  }, [layouts])

  const vbX = bounds.minX - PAD
  const vbY = bounds.minY - PAD
  const vbW = bounds.maxX - bounds.minX + PAD * 2
  const vbH = bounds.maxY - bounds.minY + PAD * 2

  return (
    <div style={{ width: '100%', maxHeight: '75vh', overflow: 'auto' }}>
      <style>{RESEARCH_KEYFRAMES}</style>
      <svg
        width={vbW}
        height={vbH}
        viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
        role="img"
        aria-label="Research tree graph"
      >
        <ResearchGraphDefs />
        <ResearchGraphEdges
          lines={lines}
          layouts={layouts}
          statuses={statuses}
          overrides={overrides}
          currentWeek={currentWeek}
          reduced={reduced}
        />
        <ResearchGraphNodes
          layouts={layouts}
          statuses={statuses}
          overrides={overrides}
          currentWeek={currentWeek}
          justCompleted={justCompleted}
          clearFlash={clearFlash}
          reduced={reduced}
          onNodeClick={onNodeClick}
        />
      </svg>
    </div>
  )
}
