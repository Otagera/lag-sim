import { CheckCircle, Clock, GitBranch, Lock, X } from 'lucide-react'
import { type KeyboardEvent, useMemo, useState } from 'react'
import { RESEARCH_TREE } from '../data/researchTree'
import {
  getNodeDef,
  getNodeStatus,
  getPrereqLines,
  type NodeLayout,
} from '../engine/researchEngine'
import { useGameStore } from '../state/gameStore'
import type { GameState, ResearchNode, ResearchNodeStatus } from '../state/types'
import { useReducedMotion } from './design/useReducedMotion'
import { RESEARCH_KEYFRAMES } from './research/keyframes'
import { ResearchEdge } from './research/ResearchEdge'
import { buildCrossDomainPath, buildTreePath } from './research/ResearchGraphPrototype'
import { computeTreeLayout } from './research/treeLayout'

const DOMAIN_COLORS: Record<string, { solid: string; bg: string; text: string; line: string }> = {
  security: { solid: '#2563eb', bg: '#1e3a5f', text: '#93c5fd', line: '#3b82f6' },
  agriculture: { solid: '#16a34a', bg: '#1a3a2a', text: '#86efac', line: '#22c55e' },
  innovation: { solid: '#d97706', bg: '#3a2a1a', text: '#fde68a', line: '#eab308' },
  administration: { solid: '#7c3aed', bg: '#2e1a5e', text: '#c4b5fd', line: '#8b5cf6' },
  climate: { solid: '#0891b2', bg: '#0a2e3a', text: '#67e8f9', line: '#06b6d4' },
}

const NODE_WIDTH = 220
const NODE_HEIGHT = 72
const RESEARCH_DOMAINS = ['security', 'agriculture', 'innovation', 'administration', 'climate']

type NodeStatusMap = Map<string, ResearchNodeStatus>
type NodesById = Map<string, ResearchNode>

function nodeStatusColor(status: ResearchNodeStatus, domain: string): string {
  const domainColor = DOMAIN_COLORS[domain]
  switch (status) {
    case 'available':
      return domainColor?.solid ?? '#666'
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

function nodeBackgroundColor(status: ResearchNodeStatus, domain: string): string {
  const c = DOMAIN_COLORS[domain]
  switch (status) {
    case 'available':
      return c?.bg ?? '#222'
    case 'commissioned':
      return '#3b1a6e'
    case 'completed':
      return '#1a3a1a'
    case 'locked':
      return '#1a1a1a'
    default:
      return '#1a1a1a'
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

function getWeeksOfCash(cashReserve: number, igr: number, expenditure: number): number {
  const netFlow = igr - expenditure
  return netFlow >= 0 ? Infinity : Math.abs(cashReserve / Math.max(0.1, Math.abs(netFlow)))
}

function getTreeDimensions(layouts: NodeLayout[]): { width: number; height: number } {
  const maxX = Math.max(...layouts.map((layout) => layout.x), 0)
  const maxY = Math.max(...layouts.map((layout) => layout.y), 0)
  return {
    width: Math.max(800, maxX + NODE_WIDTH + 50),
    height: Math.max(300, maxY + NODE_HEIGHT + 40),
  }
}

interface ResearchTreeHeaderProps {
  onClose: () => void
  cashReserve: number
  weeksOfCash: number
  showMobileList: boolean
  onToggleMobileList: () => void
}

function ResearchTreeHeader({
  onClose,
  cashReserve,
  weeksOfCash,
  showMobileList,
  onToggleMobileList,
}: ResearchTreeHeaderProps) {
  return (
    <div
      className="shrink-0 flex items-center justify-between px-4 py-3"
      style={{ backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
    >
      <div className="flex items-center gap-2">
        <GitBranch className="w-4 h-4" style={{ color: 'var(--text)' }} />
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
          Commission the Future
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
          {weeksOfCash === Infinity ? 'Surplus' : `~${Math.floor(weeksOfCash)}w remain`}
        </span>
        <button
          type="button"
          className="lg:hidden px-2 py-1 text-[10px] border"
          style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          onClick={onToggleMobileList}
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
  )
}

function researchNodeProgress(nodeId: string, state: GameState): number | null {
  const commissioned = state.commissionedResearchNodes.find((crn) => crn.nodeId === nodeId)
  if (!commissioned) return null
  const node = getNodeDef(nodeId)
  if (!node || node.weeksToComplete <= 0) return null
  const remaining = commissioned.completionWeek - state.week
  return Math.min(1, Math.max(0, 1 - remaining / node.weeksToComplete))
}

function TreeEdgeDefs() {
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

interface TreeEdgesProps {
  layouts: NodeLayout[]
  nodesById: NodesById
  nodeStatuses: NodeStatusMap
  state: GameState
  reduced: boolean
}

function TreeEdges({ layouts, nodesById, nodeStatuses, state, reduced }: TreeEdgesProps) {
  const layoutsById = new Map<string, NodeLayout>(
    layouts.map((layout): [string, NodeLayout] => [layout.nodeId, layout]),
  )
  return (
    <>
      <TreeEdgeDefs />
      {getPrereqLines().map((line) => {
        const from = layoutsById.get(line.from)
        const to = layoutsById.get(line.to)
        const fromNode = nodesById.get(line.from)
        if (!from || !to || !fromNode) return null

        const targetStatus = nodeStatuses.get(line.to) ?? 'locked'
        const progress =
          targetStatus === 'commissioned' ? researchNodeProgress(line.to, state) : null
        const d = line.crossDomain
          ? buildCrossDomainPath(from.x, from.y, to.x, to.y)
          : buildTreePath(
              from.x + NODE_WIDTH / 2,
              from.y + NODE_HEIGHT,
              to.x + NODE_WIDTH / 2,
              to.y,
            )

        return (
          <ResearchEdge
            key={`${line.from}-${line.to}`}
            d={d}
            color={DOMAIN_COLORS[fromNode.domain]?.line ?? '#666'}
            targetStatus={targetStatus}
            progress={progress}
            reduced={reduced}
            arrowMarkerId={`research-arrow-${fromNode.domain}`}
          />
        )
      })}
    </>
  )
}

function ResearchStatusIcon({ status }: { status: ResearchNodeStatus }) {
  if (status === 'completed') return <CheckCircle width={12} height={12} stroke="#16a34a" />
  if (status === 'commissioned') return <Clock width={12} height={12} stroke="#a855f7" />
  if (status === 'locked') return <Lock width={12} height={12} stroke="#666" />
  return null
}

function ResearchNodeMeta({
  node,
  nodeStatus,
}: {
  node: ResearchNode
  nodeStatus: ResearchNodeStatus
}) {
  if (nodeStatus === 'available') {
    return (
      <span style={{ fontSize: '9px', color: '#aaa', marginTop: '2px' }}>
        {naira(node.cost)} · {node.weeksToComplete}w{node.outcomes ? ' · uncertain' : ' · reliable'}
      </span>
    )
  }
  if (nodeStatus === 'commissioned') {
    return (
      <span style={{ fontSize: '9px', color: '#a855f7', marginTop: '2px' }}>In progress...</span>
    )
  }
  if (nodeStatus === 'completed') {
    return <span style={{ fontSize: '9px', color: '#16a34a', marginTop: '2px' }}>Complete</span>
  }
  return (
    <span style={{ fontSize: '8px', color: '#888', marginTop: '2px' }}>
      {node.prerequisites.length > 0
        ? `Needs: ${node.prerequisites[0].label}`
        : `${naira(node.cost)} needed`}
    </span>
  )
}

function ResearchNodeHtmlContent({
  node,
  nodeStatus,
}: {
  node: ResearchNode
  nodeStatus: ResearchNodeStatus
}) {
  const domainColor = DOMAIN_COLORS[node.domain]
  return (
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
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2px',
        }}
      >
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
        <ResearchStatusIcon status={nodeStatus} />
      </div>
      <span
        style={{
          fontSize: '11px',
          fontWeight: 700,
          color: nodeStatus === 'locked' ? '#888' : '#e0e0e0',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          lineHeight: 1.3,
        }}
      >
        {node.title}
      </span>
      <ResearchNodeMeta node={node} nodeStatus={nodeStatus} />
    </div>
  )
}

interface ResearchNodeCardProps {
  layout: NodeLayout
  node: ResearchNode
  nodeStatus: ResearchNodeStatus
  canAfford: boolean
  onClick: (nodeId: string) => void
}

function ResearchNodeCard({ layout, node, nodeStatus, onClick }: ResearchNodeCardProps) {
  const borderColor = nodeStatusColor(nodeStatus, node.domain)
  const bgColor = nodeBackgroundColor(nodeStatus, node.domain)
  const isClickable = nodeStatus === 'available' || nodeStatus === 'locked'

  function handleKeyDown(event: KeyboardEvent<SVGGElement>) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onClick(node.id)
    }
  }

  return (
    // biome-ignore lint/a11y/useSemanticElements: SVG <g> cannot be replaced by <button>
    <g
      key={layout.nodeId}
      aria-label={node.title}
      onClick={() => onClick(node.id)}
      onKeyDown={handleKeyDown}
      role="button"
      style={{ cursor: isClickable ? 'pointer' : 'default' }}
      tabIndex={0}
    >
      <rect
        x={layout.x}
        y={layout.y}
        width={NODE_WIDTH}
        height={NODE_HEIGHT}
        rx={6}
        fill={bgColor}
        stroke={borderColor}
        strokeWidth={nodeStatus === 'available' ? 2 : 1}
        opacity={nodeStatus === 'locked' ? 0.5 : 1}
      />
      {nodeStatus === 'commissioned' && (
        <rect
          x={layout.x + 2}
          y={layout.y + NODE_HEIGHT - 4}
          width={NODE_WIDTH - 4}
          height={3}
          rx={1.5}
          fill="#a855f7"
        />
      )}
      <foreignObject x={layout.x} y={layout.y} width={NODE_WIDTH} height={NODE_HEIGHT}>
        <ResearchNodeHtmlContent node={node} nodeStatus={nodeStatus} />
      </foreignObject>
    </g>
  )
}

interface ResearchMobileNodeButtonProps {
  node: ResearchNode
  nodeStatus: ResearchNodeStatus
  onNodeClick: (nodeId: string) => void
}

function ResearchMobileNodeButton({
  node,
  nodeStatus,
  onNodeClick,
}: ResearchMobileNodeButtonProps) {
  const borderColor = nodeStatusColor(nodeStatus, node.domain)
  const bgColor = nodeBackgroundColor(nodeStatus, node.domain)
  return (
    <button
      key={node.id}
      type="button"
      onClick={() => onNodeClick(node.id)}
      className="w-full text-left p-2 border text-[11px]"
      style={{
        borderColor,
        backgroundColor: bgColor,
        opacity: nodeStatus === 'locked' ? 0.5 : 1,
        cursor: nodeStatus === 'commissioned' || nodeStatus === 'completed' ? 'default' : 'pointer',
      }}
    >
      <div className="flex justify-between items-center">
        <span
          className="font-semibold"
          style={{ color: nodeStatus === 'locked' ? '#888' : '#e0e0e0' }}
        >
          {node.title}
        </span>
        <span className="text-[9px] font-medium uppercase" style={{ color: borderColor }}>
          {nodeStatus}
        </span>
      </div>
      {nodeStatus === 'available' && (
        <span className="text-[9px]" style={{ color: '#888' }}>
          {naira(node.cost)} · {node.weeksToComplete}w
          {node.outcomes ? ' · uncertain outcome' : ' · reliable'}
        </span>
      )}
      {nodeStatus === 'locked' && (
        <span className="text-[9px]" style={{ color: '#888' }}>
          {node.prerequisites.length > 0
            ? `Needs: ${node.prerequisites.map((p) => p.label).join(', ')}`
            : 'Insufficient funds'}
        </span>
      )}
    </button>
  )
}

function ResearchMobileDomainSection({
  domain,
  nodeStatuses,
  onNodeClick,
}: {
  domain: string
  nodeStatuses: NodeStatusMap
  onNodeClick: (nodeId: string) => void
}) {
  const domainNodes = RESEARCH_TREE.filter((node) => node.domain === domain)
  if (domainNodes.length === 0) return null

  const domainColor = DOMAIN_COLORS[domain]
  return (
    <div key={domain}>
      <h3
        className="text-[11px] font-semibold uppercase tracking-wider mb-1.5 px-1"
        style={{ color: domainColor?.solid ?? '#666' }}
      >
        {domain}
      </h3>
      <div className="space-y-1">
        {domainNodes.map((node) => (
          <ResearchMobileNodeButton
            key={node.id}
            node={node}
            nodeStatus={nodeStatuses.get(node.id) ?? 'locked'}
            onNodeClick={onNodeClick}
          />
        ))}
      </div>
    </div>
  )
}

function ResearchMobileList({
  showMobileList,
  nodeStatuses,
  onNodeClick,
}: {
  showMobileList: boolean
  nodeStatuses: NodeStatusMap
  onNodeClick: (nodeId: string) => void
}) {
  return (
    <div
      className={`${showMobileList ? 'flex' : 'hidden'} lg:hidden flex-1 overflow-y-auto p-3 flex-col gap-3`}
      style={{ backgroundColor: 'var(--background)' }}
    >
      {RESEARCH_DOMAINS.map((domain) => (
        <ResearchMobileDomainSection
          key={domain}
          domain={domain}
          nodeStatuses={nodeStatuses}
          onNodeClick={onNodeClick}
        />
      ))}
    </div>
  )
}

function ResearchRequirements({
  selectedNode,
  nodeStatuses,
  state,
}: {
  selectedNode: ResearchNode
  nodeStatuses: NodeStatusMap
  state: GameState
}) {
  if (selectedNode.prerequisites.length === 0) return null

  return (
    <div className="space-y-0.5">
      <span
        className="text-[9px] font-semibold uppercase"
        style={{ color: 'var(--text-secondary)' }}
      >
        Requirements
      </span>
      {selectedNode.prerequisites.map((prereq) => {
        const met =
          prereq.type === 'node'
            ? nodeStatuses.get(prereq.nodeId ?? '') === 'completed'
            : (prereq.predicate?.(state) ?? false)
        return (
          <div
            key={`${prereq.type}-${prereq.nodeId ?? prereq.predicate?.name ?? prereq.label}`}
            className="flex items-center gap-1.5 text-[10px]"
          >
            <span style={{ color: met ? '#16a34a' : 'var(--error-9)' }}>{met ? '✓' : '✗'}</span>
            <span style={{ color: met ? '#16a34a' : 'var(--text-secondary)' }}>{prereq.label}</span>
          </div>
        )
      })}
    </div>
  )
}

function ResearchOutcomeNotice({ selectedNode }: { selectedNode: ResearchNode }) {
  if (!selectedNode.outcomes) return null

  return (
    <div
      className="p-2 border text-[10px] leading-relaxed"
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--accent-bg-subtle)' }}
    >
      <span className="font-semibold" style={{ color: 'var(--accent-text)' }}>
        Prospects: uncertain
      </span>
      <span style={{ color: 'var(--text-secondary)' }}>
        {' '}
        — Corruption, infrastructure, and cash reserves will shape the outcome. No guarantees.
      </span>
    </div>
  )
}

interface ResearchDetailActionsProps {
  selectedNode: ResearchNode
  selectedStatus: ResearchNodeStatus
  confirming: boolean
  onConfirmingChange: (confirming: boolean) => void
  onCommission: () => void
  onCloseDetails: () => void
}

function ResearchDetailActions({
  selectedNode,
  selectedStatus,
  confirming,
  onConfirmingChange,
  onCommission,
  onCloseDetails,
}: ResearchDetailActionsProps) {
  return (
    <div className="flex gap-2 pt-1">
      {selectedStatus === 'available' && !confirming && (
        <button
          type="button"
          onClick={() => onConfirmingChange(true)}
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
            onClick={onCommission}
            className="flex-1 py-2 text-[11px] font-semibold"
            style={{ backgroundColor: '#16a34a', color: 'white' }}
          >
            Confirm — {naira(selectedNode.cost)}
          </button>
          <button
            type="button"
            onClick={() => onConfirmingChange(false)}
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
        onClick={onCloseDetails}
        className="px-3 py-2 text-[11px] border"
        style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
      >
        Back
      </button>
    </div>
  )
}

interface ResearchDetailsCardProps extends ResearchDetailActionsProps {
  nodeStatuses: NodeStatusMap
  state: GameState
}

function ResearchDetailsCard(props: ResearchDetailsCardProps) {
  const { selectedNode, selectedStatus, nodeStatuses, state } = props
  return (
    <div
      className="relative z-10 w-full max-w-md border rounded-lg p-4 space-y-3"
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: selectedStatus === 'available' ? 'var(--accent-solid)' : 'var(--border)',
      }}
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
      <h3 className="text-base font-bold" style={{ color: 'var(--text)' }}>
        {selectedNode.title}
      </h3>
      <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        {selectedNode.pitch}
      </p>
      <div className="flex gap-3 text-[10px]">
        <span style={{ color: 'var(--text)' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Cost:</span> {naira(selectedNode.cost)}
        </span>
        <span style={{ color: 'var(--text)' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Duration:</span>{' '}
          {selectedNode.weeksToComplete} weeks
        </span>
      </div>
      <ResearchRequirements selectedNode={selectedNode} nodeStatuses={nodeStatuses} state={state} />
      <ResearchOutcomeNotice selectedNode={selectedNode} />
      <ResearchDetailActions {...props} />
    </div>
  )
}

interface ResearchDetailsOverlayProps {
  selectedNode: ResearchNode | null
  selectedStatus: ResearchNodeStatus | null | undefined
  nodeStatuses: NodeStatusMap
  state: GameState
  confirming: boolean
  onConfirmingChange: (confirming: boolean) => void
  onCommission: () => void
  onCloseDetails: () => void
}

function ResearchDetailsOverlay({
  selectedNode,
  selectedStatus,
  onCloseDetails,
  ...props
}: ResearchDetailsOverlayProps) {
  if (!selectedNode || (selectedStatus !== 'available' && selectedStatus !== 'locked')) return null

  return (
    <div
      className="absolute inset-0 flex items-center justify-center z-10 p-4"
      style={{ backgroundColor: 'transparent' }}
    >
      <button
        type="button"
        aria-label="Close research details"
        className="absolute inset-0"
        style={{
          backgroundColor: 'rgba(0,0,0,0.4)',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
        }}
        onClick={onCloseDetails}
      />
      <ResearchDetailsCard
        selectedNode={selectedNode}
        selectedStatus={selectedStatus}
        onCloseDetails={onCloseDetails}
        {...props}
      />
    </div>
  )
}

interface ResearchGraphProps {
  layouts: NodeLayout[]
  nodesById: NodesById
  nodeStatuses: NodeStatusMap
  cashReserve: number
  showMobileList: boolean
  dimensions: { width: number; height: number }
  onNodeClick: (nodeId: string) => void
  state: GameState
  reduced: boolean
}

function ResearchGraph({
  layouts,
  nodesById,
  nodeStatuses,
  cashReserve,
  showMobileList,
  dimensions,
  onNodeClick,
  state,
  reduced,
}: ResearchGraphProps) {
  return (
    <div className={`flex-1 overflow-auto p-4 ${showMobileList ? 'hidden' : ''} lg:block`}>
      <svg
        width={dimensions.width}
        height={dimensions.height}
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        style={{ minWidth: dimensions.width, minHeight: dimensions.height }}
      >
        <title>Research tree</title>
        <style>{RESEARCH_KEYFRAMES}</style>
        <TreeEdges
          layouts={layouts}
          nodesById={nodesById}
          nodeStatuses={nodeStatuses}
          state={state}
          reduced={reduced}
        />
        {layouts.map((layout) => {
          const node = nodesById.get(layout.nodeId)
          if (!node) return null
          return (
            <ResearchNodeCard
              key={layout.nodeId}
              layout={layout}
              node={node}
              nodeStatus={nodeStatuses.get(layout.nodeId) ?? 'locked'}
              canAfford={cashReserve >= node.cost}
              onClick={onNodeClick}
            />
          )
        })}
      </svg>
    </div>
  )
}

function ResearchTreeBody(props: ResearchGraphProps) {
  return (
    <div className="flex-1 overflow-hidden flex">
      <ResearchGraph {...props} />
      <ResearchMobileList
        showMobileList={props.showMobileList}
        nodeStatuses={props.nodeStatuses}
        onNodeClick={props.onNodeClick}
      />
    </div>
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
  const reduced = useReducedMotion()
  const layouts = useMemo(() => computeTreeLayout(NODE_WIDTH, NODE_HEIGHT, 20, 68, 50, 30), [])
  const nodesById = useMemo(
    () =>
      new Map<string, ResearchNode>(
        RESEARCH_TREE.map((node): [string, ResearchNode] => [node.id, node]),
      ),
    [],
  )
  const nodeStatuses = useMemo(() => {
    const map = new Map<string, ResearchNodeStatus>()
    for (const node of RESEARCH_TREE) map.set(node.id, getNodeStatus(node.id, state))
    return map
  }, [state])
  const selectedNode = selectedNodeId ? (getNodeDef(selectedNodeId) ?? null) : null
  const selectedStatus = selectedNodeId ? nodeStatuses.get(selectedNodeId) : null
  function closeDetails() {
    setSelectedNodeId(null)
    setConfirming(false)
  }
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
  const dimensions = useMemo(() => getTreeDimensions(layouts), [layouts])
  const weeksOfCash = getWeeksOfCash(cashReserve, stats.igr, stats.expenditure)
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
    >
      <ResearchTreeHeader
        onClose={onClose}
        cashReserve={cashReserve}
        weeksOfCash={weeksOfCash}
        showMobileList={showMobileList}
        onToggleMobileList={() => setShowMobileList(!showMobileList)}
      />
      <ResearchTreeBody
        layouts={layouts}
        nodesById={nodesById}
        nodeStatuses={nodeStatuses}
        cashReserve={cashReserve}
        showMobileList={showMobileList}
        dimensions={dimensions}
        onNodeClick={handleNodeClick}
        state={state}
        reduced={reduced}
      />
      <ResearchDetailsOverlay
        selectedNode={selectedNode}
        selectedStatus={selectedStatus}
        nodeStatuses={nodeStatuses}
        state={state}
        confirming={confirming}
        onConfirmingChange={setConfirming}
        onCommission={handleCommission}
        onCloseDetails={closeDetails}
      />
    </div>
  )
}
