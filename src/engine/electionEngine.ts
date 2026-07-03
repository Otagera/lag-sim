import type { GameState } from '../state/types'

// Population-proportional weights across 20 LGAs; must sum to 100.
const CONSTITUENCY_WEIGHTS: Partial<Record<string, number>> = {
  alimosho: 13,
  oshodiIsolo: 6,
  mushin: 5,
  kosofe: 6,
  surulere: 5,
  amuwoOdofin: 4,
  apapa: 3,
  lagosMainland: 5,
  ikeja: 5,
  agege: 5,
  ifakoIjaye: 4,
  ikorodu: 7,
  badagry: 5,
  ojo: 5,
  epe: 3,
  ajeromiIfelodun: 4,
  shomolu: 4,
  lagosIsland: 4,
  etiOsa: 4,
  ibejuLekki: 3,
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
  if (primaryScenario === 'A') return 10 // godfather-backed: smooth coronation
  if (primaryScenario === 'B') return -8 // contested: party machinery against you
  if (primaryScenario === 'C') return 2 // open: freedom without infrastructure
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

function lgaBonus(state: GameState): number {
  if (state.lgaElectionResult === null) return 0
  // 0% LGA → -3, 50% → 0, 100% → +3
  return (state.lgaElectionResult / 100) * 6 - 3
}

function factionEndorsementBonus(state: GameState): number {
  const { businessCommunity, civilSocietyMedia, lgChairmen, informalEconomy } = state.factions
  let bonus = 0
  if (businessCommunity >= 60) bonus += 2
  else if (businessCommunity <= 35) bonus -= 2
  if (civilSocietyMedia >= 60) bonus += 2
  else if (civilSocietyMedia <= 35) bonus -= 2
  if (lgChairmen >= 65) bonus += 2
  else if (lgChairmen <= 35) bonus -= 2
  if (informalEconomy >= 60) bonus += 1
  else if (informalEconomy <= 30) bonus -= 1
  return bonus
}

export function calculateVoteShare(state: GameState): number {
  const base = weightedConstituencyApproval(state)
  const primary = primaryBonus(state)
  const campaign = campaignModifier(state)
  const fashemu = fashemuGroundModifier(state)
  const npc = npcPenalty(state)
  const lga = lgaBonus(state)
  const endorsement = factionEndorsementBonus(state)

  const raw = base + primary + campaign + fashemu + npc + lga + endorsement
  return Math.max(20, Math.min(80, raw))
}
