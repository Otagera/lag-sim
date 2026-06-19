import type { GameState } from '../state/types'

const CONSTITUENCY_WEIGHTS: Partial<Record<string, number>> = {
  alimosho: 40 / 3,
  periphery: 40 / 3,
  makoko: 40 / 3,
  lagosIsland: 10,
  victoriaIsland: 10,
  lekki: 10,
  surulere: 15,
  oshodi: 15,
}

function weightedConstituencyApproval(state: GameState): number {
  return (
    Object.entries(state.constituencyApproval).reduce(
      (sum, [key, val]) => sum + (CONSTITUENCY_WEIGHTS[key] ?? 0) * val,
      0,
    ) / 100
  )
}

function primaryBonus(state: GameState): number {
  const { primaryScenario } = state
  if (primaryScenario === 'A') return 8
  if (primaryScenario === 'B') return -5
  if (primaryScenario === 'C') return 2
  return 0
}

function campaignModifier(state: GameState): number {
  // Sum of choices made during campaign events — simplified: count decisions
  const decisions = state.campaignDecisions
  let modifier = 0
  if (decisions.includes('rally-alimosho')) modifier += 4
  if (decisions.includes('rally-lagos-island')) modifier += 2
  if (decisions.includes('rally-surulere')) modifier += 3
  if (decisions.includes('promise-education')) modifier += 5
  if (decisions.includes('promise-infrastructure')) modifier += 3
  if (decisions.includes('promise-youth-jobs')) modifier += 4
  if (decisions.includes('go-positive')) modifier += 4
  if (decisions.includes('attack-opponent')) modifier -= 1
  if (decisions.includes('defend-reform')) modifier += 3
  return modifier
}

function fashemuGroundModifier(state: GameState): number {
  switch (state.fashemuPhase) {
    case 'active':
    case 'reconciled':
      return 7
    case 'break':
      return -10
    case 'dead':
      return 0
    default:
      return 2
  }
}

function npcPenalty(state: GameState): number {
  let penalty = 0
  const npcs = Object.values(state.activeNPCs)
  for (const npc of npcs) {
    if (npc.isActive && npc.relationship < -30) penalty -= 3
  }
  return penalty
}

export function calculateVoteShare(state: GameState): number {
  const base = weightedConstituencyApproval(state)
  const primary = primaryBonus(state)
  const campaign = campaignModifier(state)
  const fashemu = fashemuGroundModifier(state)
  const npc = npcPenalty(state)

  const raw = base + primary + campaign + fashemu + npc
  return Math.max(20, Math.min(80, raw))
}
