import type { EventCard, GameState } from '../state/types'
import { drawNextEvent, resolveEvent } from './eventEngine'
import { resolveGodfather } from './godfatherEngine'
import { tick } from './gameLoop'

export type SimulateStrategy = 'first' | 'random' | 'weighted'

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

function pickChoiceId(event: EventCard, strategy: SimulateStrategy, rng: () => number): string {
  const { choices } = event
  if (!choices.length) return ''
  if (strategy === 'first') return choices[0].id
  if (strategy === 'random') return choices[Math.floor(rng() * choices.length)].id

  // weighted: proportional draw biased toward choices that help survival
  const scores = choices.map((c) => Math.max(0.1, scoreChoice(c) + 20))
  const total = scores.reduce((s, w) => s + w, 0)
  let roll = rng() * total
  for (let i = 0; i < choices.length; i++) {
    roll -= scores[i]
    if (roll <= 0) return choices[i].id
  }
  return choices[choices.length - 1].id
}

function autoResolveWeek(state: GameState, strategy: SimulateStrategy, rng: () => number): GameState {
  let s = state

  // Dismiss godfather message with a random accept/refuse
  if (s.activeGodfatherMessage) {
    const accept = rng() > 0.5
    s = resolveGodfather(s, s.activeGodfatherMessage, accept)
  }

  // Resolve up to 2 events per week
  let safety = 0
  while (s.activeEvent && s.eventsResolvedThisWeek < 2 && safety < 10) {
    const event = s.activeEvent
    const choiceId = pickChoiceId(event, strategy, rng)
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
