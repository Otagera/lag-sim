import { RESEARCH_TREE } from '../data/researchTree'
import type {
  GameState,
  InboxMessage,
  PathOutcome,
  ResearchNode,
  ResearchNodeStatus,
} from '../state/types'
import { hashSeed, mulberry32 } from '../utils/prng'
import { applyFactionDeltaState } from './factionEngine'
import { applyDelta } from './statEngine'

let _msgSeq = 0

type CommissionedResearchNode = GameState['commissionedResearchNodes'][number]

function researchInboxMessage(
  state: GameState,
  node: ResearchNode,
  text: string,
  isPayoff: boolean,
): InboxMessage {
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

function toneForKind(
  kind: PathOutcome['kind'],
): 'grim' | 'tense' | 'hopeful' | 'hollow' | 'neutral' {
  switch (kind) {
    case 'success':
      return 'hopeful'
    case 'partial':
      return 'neutral'
    case 'stalled':
      return 'hollow'
    case 'captured':
      return 'grim'
    case 'complication':
      return 'tense'
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
    commissionedResearchNodes: [...state.commissionedResearchNodes, { nodeId, completionWeek }],
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

export function pickOutcome(node: ResearchNode, state: GameState, seed: number): PathOutcome {
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

  const rng = mulberry32(seed)
  const roll = rng() * totalWeight
  let cumulative = 0
  for (const a of adjusted) {
    cumulative += Math.max(0, a.weight)
    if (roll < cumulative) return a.outcome
  }

  return outcomes[outcomes.length - 1]
}

function completeStepResearchNode(
  next: GameState,
  node: ResearchNode,
  inbox: InboxMessage[],
  timeline: GameState['timeline'],
): GameState {
  const updated = applyDelta(next, node.stepEffect ?? {})
  timeline.push({
    week: updated.week,
    type: 'milestone' as const,
    title: `Completed: ${node.title}`,
    description: `${node.domain} research step delivered.`,
  })
  inbox.push(
    researchInboxMessage(
      updated,
      node,
      `${node.title} is operational. The investment is delivering as planned.`,
      false,
    ),
  )
  return updated
}

function unlockOutcomeNodes(next: GameState, outcome: PathOutcome): GameState {
  if (!outcome.unlocks) return next

  const unlockStatuses = { ...next.researchNodeStatuses }
  for (const unlockId of outcome.unlocks) {
    if (!unlockStatuses[unlockId]) {
      unlockStatuses[unlockId] = 'available'
    }
  }
  return { ...next, researchNodeStatuses: unlockStatuses }
}

function completeOutcomeResearchNode(
  state: GameState,
  next: GameState,
  crn: CommissionedResearchNode,
  node: ResearchNode,
  inbox: InboxMessage[],
  timeline: GameState['timeline'],
): GameState {
  const subSeed = hashSeed(state.runSeed, `research:${node.id}:${crn.completionWeek}`)
  const outcome = pickOutcome(node, next, subSeed)

  let updated = applyDelta(next, outcome.payoff)
  if (outcome.factionImpact && Object.keys(outcome.factionImpact).length > 0) {
    updated = applyFactionDeltaState(updated, outcome.factionImpact)
  }
  updated = unlockOutcomeNodes(updated, outcome)

  timeline.push({
    week: updated.week,
    type: 'milestone' as const,
    title: `${node.title}: ${outcome.kind.charAt(0).toUpperCase() + outcome.kind.slice(1)}`,
    description: outcome.resultText.slice(0, 120),
  })

  inbox.push(researchInboxMessage(updated, node, outcome.resultText, true))

  return {
    ...updated,
    consequenceBeats: [
      ...updated.consequenceBeats,
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

export function tickResearchNodes(state: GameState): GameState {
  const due = state.commissionedResearchNodes.filter((crn) => state.week >= crn.completionWeek)
  if (due.length === 0) return state

  const remaining = state.commissionedResearchNodes.filter(
    (crn) => !due.some((d) => d.nodeId === crn.nodeId),
  )

  let next = { ...state, commissionedResearchNodes: remaining }
  const statuses = { ...next.researchNodeStatuses }
  const inbox = [...next.inbox]
  const timeline = [...next.timeline]

  for (const crn of due) {
    const node = getNodeDef(crn.nodeId)
    if (!node) continue

    statuses[crn.nodeId] = 'completed'

    if (node.stepEffect && !node.outcomes) {
      next = completeStepResearchNode(next, node, inbox, timeline)
    }

    if (node.outcomes) {
      next = completeOutcomeResearchNode(state, next, crn, node, inbox, timeline)
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

// Card height shared with the renderer (src/ui/ResearchTree.tsx) and the
// tree-layout algorithm (src/ui/research/treeLayout.ts) so the layout math
// and the card size can't silently drift apart.
//
// The column-stacking layout that used to live here (computeNodeLayout)
// spaced same-depth siblings 32px apart regardless of card height, which
// guaranteed overlap whenever a domain/depth level had 2+ siblings — it's
// been replaced by computeTreeLayout() in src/ui/research/treeLayout.ts,
// a real tree layout that spreads siblings into side-by-side slots instead
// of stacking them in one column.
export const NODE_HEIGHT = 72

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
