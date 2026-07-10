import { RESEARCH_TREE } from '../../data/researchTree'
import { getNodeDef } from '../../engine/researchEngine'
import type { ResearchNode } from '../../state/types'

export interface TreeLayoutNode {
  nodeId: string
  x: number
  y: number
}

const DOMAIN_ORDER = ['security', 'agriculture', 'innovation', 'administration', 'climate']

// The real computeNodeLayout() (researchEngine.ts) gives every node in a
// domain the same x — one column per domain, stacked by depth. A node with
// two children then has both stacked in that same column, so edges to them
// end up overlapping or cutting through unrelated cards. This builds an
// actual tree layout instead: when a node has multiple children, they're
// spread out side by side (like a real flowchart fork), and single-child
// chains stay in a straight vertical line under their parent.
export function computeTreeLayout(
  nodeWidth: number,
  nodeHeight: number,
  colGap: number,
  rowGap: number,
  laneGap: number,
  pad: number,
): TreeLayoutNode[] {
  const nodesByDomain = buildNodesByDomain()
  const { depth, primaryParent } = computeDepthsAndParents(nodesByDomain)
  const childrenOf = buildChildrenMap(nodesByDomain, primaryParent)
  const positions = layoutPositions(
    nodesByDomain,
    depth,
    primaryParent,
    childrenOf,
    nodeWidth,
    nodeHeight,
    colGap,
    rowGap,
    laneGap,
    pad,
  )
  return Array.from(positions.values())
}

function buildNodesByDomain(): Map<string, ResearchNode[]> {
  const map = new Map<string, ResearchNode[]>()
  for (const node of RESEARCH_TREE) {
    const list = map.get(node.domain) ?? []
    list.push(node)
    map.set(node.domain, list)
  }
  return map
}

function sameDomainPrereqIds(node: ResearchNode): string[] {
  return node.prerequisites
    .filter((p) => p.type === 'node' && p.nodeId)
    .map((p) => p.nodeId as string)
    .filter((id) => getNodeDef(id)?.domain === node.domain)
}

function computeDepthsAndParents(nodesByDomain: Map<string, ResearchNode[]>): {
  depth: Map<string, number>
  primaryParent: Map<string, string | null>
} {
  const depth = new Map<string, number>()
  const primaryParent = new Map<string, string | null>()

  function computeDepth(id: string): number {
    const cached = depth.get(id)
    if (cached !== undefined) return cached
    const node = getNodeDef(id)
    if (!node) return 0
    const parents = sameDomainPrereqIds(node)
    if (parents.length === 0) {
      depth.set(id, 0)
      primaryParent.set(id, null)
      return 0
    }
    let bestParent = parents[0]
    let bestDepth = computeDepth(bestParent)
    for (const p of parents.slice(1)) {
      const d = computeDepth(p)
      if (d > bestDepth) {
        bestDepth = d
        bestParent = p
      }
    }
    depth.set(id, bestDepth + 1)
    primaryParent.set(id, bestParent)
    return bestDepth + 1
  }

  for (const list of nodesByDomain.values()) {
    for (const node of list) computeDepth(node.id)
  }
  return { depth, primaryParent }
}

function buildChildrenMap(
  nodesByDomain: Map<string, ResearchNode[]>,
  primaryParent: Map<string, string | null>,
): Map<string, string[]> {
  const childrenOf = new Map<string, string[]>()
  for (const list of nodesByDomain.values()) {
    for (const node of list) {
      const parent = primaryParent.get(node.id)
      if (parent) {
        const arr = childrenOf.get(parent) ?? []
        arr.push(node.id)
        childrenOf.set(parent, arr)
      }
    }
  }
  for (const arr of childrenOf.values()) arr.sort()
  return childrenOf
}

function layoutPositions(
  nodesByDomain: Map<string, ResearchNode[]>,
  depth: Map<string, number>,
  primaryParent: Map<string, string | null>,
  childrenOf: Map<string, string[]>,
  nodeWidth: number,
  nodeHeight: number,
  colGap: number,
  rowGap: number,
  laneGap: number,
  pad: number,
): Map<string, TreeLayoutNode> {
  const slotWidth = nodeWidth + colGap
  const positions = new Map<string, TreeLayoutNode>()

  function layoutDomain(domain: string, laneStartX: number): number {
    const nodes = nodesByDomain.get(domain) ?? []
    const roots = nodes
      .filter((n) => primaryParent.get(n.id) == null)
      .sort((a, b) => a.id.localeCompare(b.id))

    let cursor = 0
    function place(id: string) {
      const kids = childrenOf.get(id) ?? []
      const y = pad + (depth.get(id) ?? 0) * (nodeHeight + rowGap)
      if (kids.length === 0) {
        const slot = cursor
        cursor += 1
        positions.set(id, { nodeId: id, x: laneStartX + slot * slotWidth, y })
        return
      }
      const startSlot = cursor
      for (const kid of kids) place(kid)
      const endSlot = cursor
      const centerSlot = (startSlot + endSlot - 1) / 2
      positions.set(id, { nodeId: id, x: laneStartX + centerSlot * slotWidth, y })
    }

    for (const root of roots) place(root.id)
    return cursor
  }

  let laneX = pad
  for (const domain of DOMAIN_ORDER) {
    const usedSlots = layoutDomain(domain, laneX)
    laneX += Math.max(1, usedSlots) * slotWidth + laneGap
  }

  return positions
}
