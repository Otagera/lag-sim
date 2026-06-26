import type {
  GameState,
  ResearchNode,
  ResearchNodeStatus,
  PathOutcome,
  InboxMessage,
} from '../state/types'
import { RESEARCH_TREE } from '../data/researchTree'
import { applyDelta } from './statEngine'
import { applyFactionDeltaState } from './factionEngine'

let _msgSeq = 0

function researchInboxMessage(state: GameState, node: ResearchNode, text: string, isPayoff: boolean): InboxMessage {
  _msgSeq++
  return {
    id: `research-${node.id}-${state.week}-${_msgSeq}`,
    from: 'chief-of-staff',
    fromLabel: 'Chief of Staff',
    week: state.week,
    subject: isPayoff ? `${node.title} — Resolved` : `${node.title} — Complete`,
    body: text,
    tone: isPayoff ? 'neutral' : 'warm',
    read: false,
  }
}

function toneForKind(kind: PathOutcome['kind']): 'grim' | 'tense' | 'hopeful' | 'hollow' | 'neutral' {
  switch (kind) {
    case 'success':    return 'hopeful'
    case 'partial':    return 'neutral'
    case 'stalled':    return 'hollow'
    case 'captured':   return 'grim'
    case 'complication': return 'tense'
  }
}

export function getNodeDef(nodeId: string): ResearchNode | undefined {
  return RESEARCH_TREE.find((n) => n.id === nodeId)
}

export function getNodeStatus(nodeId: string, state: GameState): ResearchNodeStatus {
  const stored = state.researchNodeStatuses[nodeId]
  if (stored && stored !== 'locked' && stored !== 'available') return stored

  const node = getNodeDef(nodeId)
  if (!node) return 'locked'

  if (canCommissionNode(node, state)) return 'available'
  return 'locked'
}

export function canCommissionNode(node: ResearchNode, state: GameState): boolean {
  const stored = state.researchNodeStatuses[node.id]
  if (stored === 'commissioned' || stored === 'completed') return false

  if (state.stats.cashReserve < node.cost) return false

  for (const prereq of node.prerequisites) {
    if (prereq.type === 'node' && prereq.nodeId) {
      const prereqStatus = state.researchNodeStatuses[prereq.nodeId]
      if (prereqStatus !== 'completed') return false
    }
    if (prereq.type === 'state' && prereq.predicate) {
      if (!prereq.predicate(state)) return false
    }
  }

  return true
}

export function commissionNode(nodeId: string, state: GameState): GameState {
  const node = getNodeDef(nodeId)
  if (!node) return state
  if (state.stats.cashReserve < node.cost) return state

  const stored = state.researchNodeStatuses[node.id]
  if (stored === 'commissioned' || stored === 'completed') return state

  const completionWeek = state.week + node.weeksToComplete

  return {
    ...state,
    stats: { ...state.stats, cashReserve: state.stats.cashReserve - node.cost },
    researchNodeStatuses: {
      ...state.researchNodeStatuses,
      [node.id]: 'commissioned',
    },
    commissionedResearchNodes: [
      ...state.commissionedResearchNodes,
      { nodeId, completionWeek },
    ],
    timeline: [
      ...state.timeline,
      {
        week: state.week,
        type: 'milestone' as const,
        title: `Commissioned: ${node.title}`,
        description: `₦${node.cost.toFixed(1)}bn · ${node.weeksToComplete} weeks · ${node.domain}`,
      },
    ],
  }
}

export function pickOutcome(node: ResearchNode, state: GameState): PathOutcome {
  const outcomes = node.outcomes
  if (!outcomes || outcomes.length === 0) {
    return {
      kind: 'success',
      weight: 1,
      payoff: {},
      resultText: `${node.title} reached a conclusion.`,
      scope: 'state',
    }
  }

  const adjusted = outcomes.map((o) => ({
    outcome: o,
    weight: o.weight * (o.weightModifier?.(state) ?? 1),
  }))

  const totalWeight = adjusted.reduce((sum, a) => sum + Math.max(0, a.weight), 0)
  if (totalWeight <= 0) return outcomes[0]

  const roll = Math.random() * totalWeight
  let cumulative = 0
  for (const a of adjusted) {
    cumulative += Math.max(0, a.weight)
    if (roll < cumulative) return a.outcome
  }

  return outcomes[outcomes.length - 1]
}

export function tickResearchNodes(state: GameState): GameState {
  const due = state.commissionedResearchNodes.filter(
    (crn) => state.week >= crn.completionWeek,
  )
  if (due.length === 0) return state

  const remaining = state.commissionedResearchNodes.filter(
    (crn) => !due.some((d) => d.nodeId === crn.nodeId),
  )

  let next = { ...state, commissionedResearchNodes: remaining }
  const statuses = { ...next.researchNodeStatuses }
  let inbox = [...next.inbox]
  const timeline = [...next.timeline]

  for (const crn of due) {
    const node = getNodeDef(crn.nodeId)
    if (!node) continue

    statuses[crn.nodeId] = 'completed'

    if (node.stepEffect && !node.outcomes) {
      next = applyDelta(next, node.stepEffect)
      timeline.push({
        week: next.week,
        type: 'milestone' as const,
        title: `Completed: ${node.title}`,
        description: `${node.domain} research step delivered.`,
      })
      inbox.push(researchInboxMessage(next, node, `${node.title} is operational. The investment is delivering as planned.`, false))
    }

    if (node.outcomes) {
      const outcome = pickOutcome(node, next)

      next = applyDelta(next, outcome.payoff)
      if (outcome.factionImpact && Object.keys(outcome.factionImpact).length > 0) {
        next = applyFactionDeltaState(next, outcome.factionImpact)
      }

      if (outcome.unlocks) {
        const unlockStatuses = { ...next.researchNodeStatuses }
        for (const unlockId of outcome.unlocks) {
          if (!unlockStatuses[unlockId]) {
            unlockStatuses[unlockId] = 'available'
          }
        }
        next = { ...next, researchNodeStatuses: unlockStatuses }
      }

      timeline.push({
        week: next.week,
        type: 'milestone' as const,
        title: `${node.title}: ${outcome.kind.charAt(0).toUpperCase() + outcome.kind.slice(1)}`,
        description: outcome.resultText.slice(0, 120),
      })

      inbox.push(researchInboxMessage(next, node, outcome.resultText, true))

      next = {
        ...next,
        consequenceBeats: [
          ...next.consequenceBeats,
          {
            text: outcome.resultText,
            tone: toneForKind(outcome.kind),
            choiceLabel: node.title,
            choiceDescription: outcome.kind.charAt(0).toUpperCase() + outcome.kind.slice(1),
            immediate: outcome.payoff,
            factionImpact: outcome.factionImpact ?? {},
          },
        ],
      }
    }
  }

  next = { ...next, researchNodeStatuses: statuses, inbox, timeline }
  return next
}

export function computePrereqChain(prereqNodeIds: string[]): string[] {
  const chain: string[] = []
  const visited = new Set<string>()
  function walk(id: string) {
    if (visited.has(id)) return
    visited.add(id)
    const node = getNodeDef(id)
    if (node) {
      for (const p of node.prerequisites) {
        if (p.type === 'node' && p.nodeId) walk(p.nodeId)
      }
    }
    chain.push(id)
  }
  for (const id of prereqNodeIds) walk(id)
  return chain
}

export interface NodeLayout {
  nodeId: string
  x: number
  y: number
}

export function computeNodeLayout(): NodeLayout[] {
  const nodes = RESEARCH_TREE
  const depths = new Map<string, number>()
  const domainOrder = ['security', 'agriculture', 'innovation', 'administration', 'climate']

  function computeDepth(nodeId: string): number {
    const cached = depths.get(nodeId)
    if (cached !== undefined) return cached
    const node = getNodeDef(nodeId)
    if (!node) return 0

    const sameDomainPrereqIds = node.prerequisites
      .filter((p) => p.type === 'node' && p.nodeId)
      .map((p) => p.nodeId!)
      .filter((id) => {
        const prereqNode = getNodeDef(id)
        return prereqNode && prereqNode.domain === node.domain
      })

    if (sameDomainPrereqIds.length === 0) {
      depths.set(nodeId, 0)
      return 0
    }

    const maxDepth = Math.max(...sameDomainPrereqIds.map(computeDepth))
    depths.set(nodeId, maxDepth + 1)
    return maxDepth + 1
  }

  for (const node of nodes) computeDepth(node.id)

  const domainNodes = new Map<string, { node: ResearchNode; depth: number }[]>()
  for (const node of nodes) {
    const d = node.domain
    if (!domainNodes.has(d)) domainNodes.set(d, [])
    domainNodes.get(d)!.push({ node, depth: depths.get(node.id) ?? 0 })
  }

  for (const [, group] of domainNodes) group.sort((a, b) => a.depth - b.depth || a.node.id.localeCompare(b.node.id))

  const COLUMN_WIDTH = 240
  const COLUMN_GAP = 50
  const ROW_HEIGHT = 140
  const PADDING_X = 30
  const PADDING_Y = 30

  const layouts: NodeLayout[] = []
  for (const [domain, group] of domainNodes) {
    const domainIndex = domainOrder.indexOf(domain)
    const idx = domainIndex >= 0 ? domainIndex : domainOrder.length
    const x = PADDING_X + idx * (COLUMN_WIDTH + COLUMN_GAP)

    const depthOffsets = new Map<string, number>()
    for (const { node, depth } of group) {
      const key = String(depth)
      const offset = depthOffsets.get(key) ?? 0
      depthOffsets.set(key, offset + 1)
      const y = PADDING_Y + depth * ROW_HEIGHT + offset * 32
      layouts.push({ nodeId: node.id, x, y })
    }
  }

  return layouts
}

export function getPrereqLines(): { from: string; to: string; crossDomain: boolean }[] {
  const lines: { from: string; to: string; crossDomain: boolean }[] = []
  const nodes = RESEARCH_TREE

  for (const node of nodes) {
    for (const prereq of node.prerequisites) {
      if (prereq.type === 'node' && prereq.nodeId) {
        const prereqNode = getNodeDef(prereq.nodeId)
        const crossDomain = prereqNode ? prereqNode.domain !== node.domain : false
        lines.push({ from: prereq.nodeId, to: node.id, crossDomain })
      }
    }
  }

  return lines
}
