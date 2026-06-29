import type { EventCard, GameState } from '../state/types'
import { drawNextEvent, resolveEvent } from './eventEngine'
import { tick } from './gameLoop'

export type SimulateStrategy = 'first' | 'random' | 'weighted' | 'winning'

export interface SimulateOptions {
  strategy?: SimulateStrategy
  seed?: number
}

export interface SimulateResult {
  state: GameState
  weeksSimulated: number
  stoppedEarly: boolean
  seed: number
}

/**
 * Winning strategy configuration.
 *
 * Tune these values when game balance changes (new events, stat bounds,
 * revenue/expenditure formulas). Run `npx tsx scripts/benchmark.ts` to
 * verify the win rate stays ≥ 80%.
 */
export const WINNING_STRATEGY = {
  overrideMinScore: 1.5,
  baselineScore: 0.1,

  continuous: {
    cashReserve: 1,
    igr: 2,              // IGR compounds; term2-only igrLoss guard handles permanent losses
    corruptionPressure: -1,
    politicalCapital: 0.3,
    infrastructureScore: 0.5,
    securityIndex: 0.5,
    youthTension: -0.3,
  },

  // Emergency floors for election-relevant factions — only activates when a faction
  // is within 10 points of its endorsement penalty threshold (≤35/≤30).
  factionFloors: {
    civilSocietyMedia: { threshold: 45, weight: 4 },
    businessCommunity: { threshold: 45, weight: 3 },
    lgChairmen:        { threshold: 45, weight: 3 },
    informalEconomy:   { threshold: 40, weight: 3 },
  },

  emergency: {
    fedRel:           { threshold: -10, statWeight: 20, factionWeight: 10 },
    cashReserve:      { threshold: 60, weight: 40 },
    cashCritical:     { threshold: 25, weight: 80 },
    corruption:       { threshold: 50, weight: 18 },
    godfathers:       { threshold: 15, weekGate: 40, weight: 12 },
    youthTension:     { threshold: 55, weight: 15 },
    publicTrust:      { threshold: 35, weight: 12 },
    expenditure:      { cashThreshold: 50, normalWeight: 2, crisisWeight: 8 },
    politicalCapital: { threshold: 25, weekGate: 209, weight: 15 },
    igrLoss:          { weekGate: 209, weight: 8 },
  },

  godfather: {
    corruptionRefuseThreshold: 50,
    emergencyGodfathers: 8,
    emergencyWeekGate: 40,
    safetyGodfathers: 15,
    comfortableGodfathers: 30,
    middleRefusalCount: 3,
  },
}

// mulberry32 seeded PRNG — gives identical sequences for the same seed
function mulberry32(seed: number): () => number {
  let s = seed
  return () => {
    s |= 0
    s = (s + 0x6D2B79F5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Scores a choice higher if it keeps the governor alive (cash, trust, low corruption)
function scoreChoice(choice: EventCard['choices'][number]): number {
  const d = choice.immediate
  return (
    (d.cashReserve ?? 0) * 3 +
    (d.publicTrust ?? 0) * 1.5 +
    (d.politicalCapital ?? 0) * 0.5 -
    (d.corruptionPressure ?? 0) * 2 +
    (d.infrastructureScore ?? 0) * 1 -
    (d.youthTension ?? 0) * 1.5 +
    (d.igr ?? 0) * 4 +
    (d.federalRelationship ?? 0) * 0.5
  )
}

function scoreWinningChoice(
  choice: EventCard['choices'][number],
  state: GameState,
  _eventId: string,
): number {
  const d = choice.immediate
  const f = choice.factionImpact ?? {}
  const cfg = WINNING_STRATEGY.emergency
  const cont = WINNING_STRATEGY.continuous
  let score = WINNING_STRATEGY.baselineScore

  score += (d.cashReserve ?? 0) * cont.cashReserve
  score += (d.igr ?? 0) * cont.igr
  score -= (d.corruptionPressure ?? 0) * cont.corruptionPressure
  score += (d.politicalCapital ?? 0) * cont.politicalCapital
  score += (d.infrastructureScore ?? 0) * cont.infrastructureScore
  score += (d.securityIndex ?? 0) * cont.securityIndex
  score += (d.youthTension ?? 0) * cont.youthTension

  // Penalize political capital cost — choices that burn PC are costly
  const pcCost = choice.politicalCapitalCost ?? 0
  score -= pcCost * 0.8
  if (state.stats.politicalCapital < 30) score -= pcCost * 1.5

  if (state.stats.federalRelationship < cfg.fedRel.threshold) {
    score += (d.federalRelationship ?? 0) * cfg.fedRel.statWeight
    score += (f.federalGovt ?? 0) * cfg.fedRel.factionWeight
  }

  if (state.stats.cashReserve < cfg.cashReserve.threshold) {
    score += (d.cashReserve ?? 0) * cfg.cashReserve.weight
  }

  if (state.stats.cashReserve < cfg.cashCritical.threshold) {
    score += (d.cashReserve ?? 0) * cfg.cashCritical.weight
  }

  if (state.stats.corruptionPressure > cfg.corruption.threshold) {
    score -= (d.corruptionPressure ?? 0) * cfg.corruption.weight
  }

  if (state.factions.partyGodfathers < cfg.godfathers.threshold && state.week > cfg.godfathers.weekGate) {
    score += (f.partyGodfathers ?? 0) * cfg.godfathers.weight
  }

  if (state.stats.youthTension > cfg.youthTension.threshold) {
    score -= (d.youthTension ?? 0) * cfg.youthTension.weight
  }

  if (state.stats.publicTrust < cfg.publicTrust.threshold) {
    score += (d.publicTrust ?? 0) * cfg.publicTrust.weight
  }

  if (d.expenditure && d.expenditure > 0) {
    const weight = state.stats.cashReserve < cfg.expenditure.cashThreshold
      ? cfg.expenditure.crisisWeight
      : cfg.expenditure.normalWeight
    score -= d.expenditure * weight
  }

  if (state.stats.politicalCapital < cfg.politicalCapital.threshold && state.week > cfg.politicalCapital.weekGate) {
    score += (d.politicalCapital ?? 0) * cfg.politicalCapital.weight
  }

  if ((d.igr ?? 0) < 0 && state.week > cfg.igrLoss.weekGate) {
    score += d.igr! * cfg.igrLoss.weight
  }

  const ff = WINNING_STRATEGY.factionFloors
  if (state.factions.civilSocietyMedia < ff.civilSocietyMedia.threshold)
    score += (f.civilSocietyMedia ?? 0) * ff.civilSocietyMedia.weight
  if (state.factions.businessCommunity < ff.businessCommunity.threshold)
    score += (f.businessCommunity ?? 0) * ff.businessCommunity.weight
  if (state.factions.lgChairmen < ff.lgChairmen.threshold)
    score += (f.lgChairmen ?? 0) * ff.lgChairmen.weight
  if (state.factions.informalEconomy < ff.informalEconomy.threshold)
    score += (f.informalEconomy ?? 0) * ff.informalEconomy.weight

  return score
}

function pickChoiceId(event: EventCard, strategy: SimulateStrategy, rng: () => number, state?: GameState): string {
  const { choices } = event
  if (!choices.length) return ''
  if (strategy === 'first') return choices[0].id
  if (strategy === 'random') return choices[Math.floor(rng() * choices.length)].id
  if (strategy === 'weighted') {
    const scores = choices.map((c) => Math.max(0.1, scoreChoice(c) + 20))
    const total = scores.reduce((s, w) => s + w, 0)
    let roll = rng() * total
    for (let i = 0; i < choices.length; i++) {
      roll -= scores[i]
      if (roll <= 0) return choices[i].id
    }
    return choices[choices.length - 1].id
  }
  if (strategy === 'winning' && state) {
    // Default to first choice (safe/effective), only override in emergencies
    const scores = choices.map((c) => scoreWinningChoice(c, state, event.id))
    const maxScore = Math.max(...scores)
    if (maxScore > WINNING_STRATEGY.overrideMinScore) {
      const bestIdx = scores.indexOf(maxScore)
      return choices[bestIdx].id
    }
    return choices[0].id
  }
  return choices[0].id
}

function shouldAcceptGodfather(state: GameState): boolean {
  const cfg = WINNING_STRATEGY.godfather
  if (state.stats.corruptionPressure > cfg.corruptionRefuseThreshold) return false
  if (state.factions.partyGodfathers < cfg.emergencyGodfathers && state.week > cfg.emergencyWeekGate) return true
  if (state.factions.partyGodfathers < cfg.safetyGodfathers) return true
  if (state.factions.partyGodfathers > cfg.comfortableGodfathers) return false
  if (state.godfatherRefusalCount >= cfg.middleRefusalCount) return true
  return false
}

function autoResolveWeek(state: GameState, strategy: SimulateStrategy, rng: () => number): GameState {
  let s = state

  // Resolve up to 2 events per week
  let safety = 0
  while (s.activeEvent && s.eventsResolvedThisWeek < 2 && safety < 10) {
    const event = s.activeEvent

    // Godfather events use dedicated strategy logic instead of generic choice scoring
    let choiceId: string
    if (event.category === 'godfather') {
      const accept = strategy === 'winning' ? shouldAcceptGodfather(s) : rng() > 0.5
      choiceId = accept ? event.choices[0].id : event.choices[1].id
    } else {
      choiceId = pickChoiceId(event, strategy, rng, strategy === 'winning' ? s : undefined)
    }

    s = resolveEvent({ ...s, activeEvent: null }, event, choiceId)
    if (!s.activeEvent && s.eventsResolvedThisWeek < 2) {
      const next = drawNextEvent(s)
      if (next) s = { ...s, activeEvent: next }
    }
    safety++
  }

  return { ...s, activeEvent: null }
}

export function simulateWeeks(state: GameState, n: number, options: SimulateOptions = {}): SimulateResult {
  const strategy = options.strategy ?? 'first'
  // Capture seed before replacing Math.random so the default case uses the real RNG
  const seed = options.seed ?? Math.floor(Math.random() * 2 ** 32)
  const rng = mulberry32(seed)

  // Replace Math.random so tick()'s internal randomness (FAAC variance, etc.) is
  // also seeded — this makes the full simulation deterministic for a given seed
  const originalRandom = Math.random
  Math.random = rng

  try {
    let s = state
    let i = 0
    for (; i < n; i++) {
      if (s.isGameOver) break
      s = tick(s)
      s = autoResolveWeek(s, strategy, rng)
    }
    return { state: s, weeksSimulated: i, stoppedEarly: i < n, seed }
  } finally {
    Math.random = originalRandom
  }
}
