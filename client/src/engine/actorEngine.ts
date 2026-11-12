import { ACTOR_INTRO, ACTOR_PERSONALITY, type ActorMove, MOVES_BY_ACTOR } from '../data/actors'
import { REASONS, type ReasonDefinition, renderReasonLine } from '../data/reasons'
import type {
  ActorMoveRecord,
  EventCard,
  GameState,
  InboxMessage,
  NPCArchetypeKey,
  NPCKey,
  NPCState,
  OpinionEntry,
} from '../state/types'
import { hashSeed, mulberry32 } from '../utils/prng'
import { type OpinionTier, tierOf } from './opinionEngine'
import { reputationOf } from './promiseEngine'

/**
 * Actor move selection — replaces "pressure ≥ 40 → draw a deck card".
 * Each week every active actor scores its in-character moves:
 *
 *   utility = base
 *           + FACTOR_WEIGHT × (situational factors that hold right now)
 *           + PRESSURE_WEIGHT × pressure/100        (frustration builds)
 *           − risk × (1 − boldness)
 *           − REPEAT_PENALTY × times already used (lighter for letters)
 *           ± small seeded noise
 *
 * and acts only if the best move clears 0.55 + 0.35 × patience. Patient actors
 * wait for an opening; impatient ones act early. At most one actor card per
 * week reaches the player; others fall back to an inbox move or wait.
 * See docs/political-actors.md §4.
 */

export const FACTOR_WEIGHT = 0.22
/** Each previous use of a move makes it less attractive — actors vary their tactics */
export const REPEAT_PENALTY = 0.15
export const PRESSURE_WEIGHT = 0.5
const NOISE = 0.1
const MIN_WEEKS_BETWEEN_MOVES = 3

const NPC_SLOTS: NPCKey[] = ['npc1', 'npc2', 'npc3']

export function actThreshold(patience: number): number {
  return 0.55 + 0.35 * patience
}

/** Letters are cheap: they clear a lower bar than cards. */
export const LETTER_DISCOUNT = 0.2

// ── Coalitions (formed/split in castEngine) ──

/** Added to coalition members' hostile moves — they move together. */
export const COALITION_BONUS = 0.2
/** When one member strikes, the others' pressure jumps by this much. */
export const COALITION_PRESSURE_ECHO = 15
const COALITION_FACTOR = 'they have allies now'

export function inCoalition(state: GameState, actor: NPCArchetypeKey): boolean {
  return !!state.coalition?.members.includes(actor)
}

/** When a coalition member plays a card, the other members get ready to follow. */
export function echoCoalitionMove(state: GameState, mover: NPCArchetypeKey): GameState {
  if (!inCoalition(state, mover)) return state
  const npcs = { ...state.activeNPCs }
  for (const slot of NPC_SLOTS) {
    const n = npcs[slot]
    if (n.archetypeKey === mover || !inCoalition(state, n.archetypeKey)) continue
    npcs[slot] = { ...n, pressure: Math.min(100, n.pressure + COALITION_PRESSURE_ECHO) }
  }
  return { ...state, activeNPCs: npcs }
}

/** Friendly card moves (deals, offers, endorsements) */
export function isOffer(move: ActorMove): boolean {
  return move.channel === 'card' && move.tiers.includes('cordial')
}

export type ScoredMove = { move: ActorMove; score: number; because: string[] }

function cardAvailable(state: GameState, eventId: string, cards: Map<string, EventCard>): boolean {
  const card = cards.get(eventId)
  if (!card) return false
  if (!card.isRecurring && state.resolvedEvents.includes(eventId)) return false
  if (eventId in state.eventCooldowns && state.week < state.eventCooldowns[eventId]) return false
  if (state.eventQueue.some((q) => q.id === eventId)) return false
  return true
}

type ScoringContext = {
  state: GameState
  npc: NPCState
  tier: OpinionTier
  cards: Map<string, EventCard>
  offerBonus: number
  allied: boolean
}

function isEligible(ctx: ScoringContext, move: ActorMove): boolean {
  if (!move.tiers.includes(ctx.tier)) return false
  if ((ctx.npc.moveCooldowns?.[move.id] ?? 0) > ctx.state.week) return false
  if (move.channel === 'card' && !cardAvailable(ctx.state, move.eventId, ctx.cards)) return false
  return true
}

function scoreOne(ctx: ScoringContext, move: ActorMove, noise: number): ScoredMove {
  const { state, npc, tier } = ctx
  const personality = ACTOR_PERSONALITY[npc.archetypeKey]
  const because = move.factors.filter((f) => f.test(state)).map((f) => f.label)
  const factorCount = because.length
  const coalitionMove = ctx.allied && move.channel === 'card' && move.tiers.includes('hostile')
  if (coalitionMove) because.push(COALITION_FACTOR)
  // Proud actors press harder when they feel wronged
  const grudge = tier === 'hostile' ? 0.2 * personality.pride : tier === 'wary' ? -0.1 : 0
  const repeat =
    REPEAT_PENALTY * (move.channel === 'inbox' ? 0.3 : 1) * (npc.moveUses?.[move.id] ?? 0)
  const score =
    move.base +
    FACTOR_WEIGHT * factorCount +
    PRESSURE_WEIGHT * (npc.pressure / 100) +
    grudge -
    move.risk * (1 - personality.boldness) -
    repeat +
    (isOffer(move) ? ctx.offerBonus : 0) +
    (coalitionMove ? COALITION_BONUS : 0) +
    noise
  return { move, score, because }
}

/** Score every in-character move for one actor, best first. Pure. */
export function scoreMoves(
  state: GameState,
  npc: NPCState,
  slot: NPCKey,
  cards: Map<string, EventCard>,
): ScoredMove[] {
  const ctx: ScoringContext = {
    state,
    npc,
    tier: tierOf(npc.relationship),
    cards,
    // Deal offers depend on whether the governor's word is worth anything
    offerBonus: reputationOf(state).offerModifier,
    allied: inCoalition(state, npc.archetypeKey),
  }
  const rng = mulberry32(hashSeed(state.runSeed ?? 0, `actor-${state.week}-${slot}`))
  const scored: ScoredMove[] = []
  for (const move of MOVES_BY_ACTOR[npc.archetypeKey] ?? []) {
    const noise = (rng() - 0.5) * NOISE // drawn for every move so results stay stable
    if (isEligible(ctx, move)) scored.push(scoreOne(ctx, move, noise))
  }
  return scored.sort((a, b) => b.score - a.score)
}

// ── Reason text for move output ────────────────────────────────────────────

const isActivation = (e: OpinionEntry) => e.reason.startsWith('act-')

/** Strongest reason matching the move's mood (grievance for cold moves, goodwill for warm). */
function reasonFor(npc: NPCState, move: ActorMove): OpinionEntry | undefined {
  const warm = move.tiers.includes('allied') || move.tiers.includes('cordial')
  const cold = move.tiers.includes('hostile')
  const pool = npc.ledger.filter((e) =>
    cold && !warm ? e.value < 0 : warm && !cold ? e.value > 0 : true,
  )
  const sorted = [...pool].sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
  // Prefer something the governor did over the standing reason they turned up
  return sorted.find((e) => !isActivation(e)) ?? sorted[0]
}

/** Reason label turned into the actor's own first-person complaint/thanks. */
function firstPersonReason(entry: OpinionEntry | undefined): string {
  if (!entry) return ''
  const label = (REASONS as Record<string, ReasonDefinition>)[entry.reason]?.label
  if (!label) return ''
  const swapped = label
    .replace(/\bthem\b/g, 'us')
    .replace(/\btheir\b/g, 'our')
    .replace(/\bThey are\b/g, 'We are')
    .replace(/\bThey\b/g, 'We')
    .replace(/\bTheir\b/g, 'Our')
  return `${swapped}.`
}

function fill(text: string, npc: NPCState, reason: string): string {
  return text
    .replace(/\{NPC\}|\{NAME\}/g, npc.name)
    .replace(/\{REASON\}/g, reason)
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function personaliseCard(card: EventCard, npc: NPCState, move: ActorMove): EventCard {
  const entry = reasonFor(npc, move)
  const reasonLine = entry ? renderReasonLine(entry.reason, npc.name, entry.source) : ''
  return {
    ...card,
    title: fill(card.title, npc, ''),
    body: fill(card.body, npc, reasonLine),
    choices: card.choices.map((c) => ({
      ...c,
      label: fill(c.label, npc, ''),
      description: fill(c.description, npc, ''),
      delayed: c.delayed
        ? { ...c.delayed, eventText: fill(c.delayed.eventText, npc, '') }
        : undefined,
    })),
  }
}

let inboxCounter = 0

function senderId(npc: NPCState): InboxMessage['from'] {
  if (npc.archetypeKey === 'youth-organiser') return 'dayo'
  if (npc.archetypeKey === 'journalist') return 'neo'
  return 'smj'
}

/** The first letter an actor sends when they turn up. */
export function actorIntroMessage(state: GameState, npc: NPCState): InboxMessage {
  const intro = ACTOR_INTRO[npc.archetypeKey]
  inboxCounter++
  return {
    id: `actor-intro-${state.week}-${npc.archetypeKey}-${inboxCounter}`,
    from: senderId(npc),
    fromLabel: npc.name,
    week: state.week,
    subject: intro.subject,
    body: intro.body,
    tone: intro.tone,
    read: false,
  }
}

function inboxFrom(
  state: GameState,
  npc: NPCState,
  move: ActorMove & { channel: 'inbox' },
): InboxMessage {
  const reason = firstPersonReason(reasonFor(npc, move))
  const body = move.bodies[state.week % move.bodies.length]
  inboxCounter++
  return {
    id: `actor-${state.week}-${move.id}-${inboxCounter}`,
    from: senderId(npc),
    fromLabel: npc.name,
    week: state.week,
    subject: move.subject,
    body: fill(body, npc, reason),
    tone: move.tone,
    read: false,
  }
}

function cardTitle(cards: Map<string, EventCard>, move: ActorMove, npc: NPCState): string {
  if (move.channel === 'inbox') return move.subject
  return fill(cards.get(move.eventId)?.title ?? move.id, npc, '')
}

// ── Intelligence: advance warning (docs/political-actors.md §4.4, hybrid) ──

export const INTEL_UNIT_NODE = 'state-intelligence-unit'
/** Security needed for any whisper without the intelligence unit */
export const WHISPER_SECURITY = 50
/** How close to its bar an actor must be before a hint fires */
const HINT_WINDOW = { whisper: 0.15, unit: 0.3 }
const HINT_COOLDOWN_WEEKS = 10

type HintCandidate = {
  slot: NPCKey
  npc: NPCState
  move: ActorMove & { channel: 'card' }
  gap: number
}

function hasIntelUnit(state: GameState): boolean {
  return state.researchNodeStatuses?.[INTEL_UNIT_NODE] === 'completed'
}

function hintMessage(state: GameState, c: HintCandidate, named: boolean): InboxMessage {
  inboxCounter++
  const whisper =
    c.move.whisper ??
    'Our sources report unusual movement among people who are not friends of this government.'
  const body = named
    ? `${whisper} The Intelligence Unit is confident ${c.npc.name} is behind it. Expect a move within weeks.`
    : `${whisper} Our sources cannot yet say who is behind it.`
  return {
    id: `intel-${state.week}-${c.move.id}-${inboxCounter}`,
    from: 'chief-of-staff',
    fromLabel: named ? 'State Intelligence Unit' : 'Chief of Staff',
    week: state.week,
    subject: named ? 'Intelligence briefing' : 'Security whisper',
    body,
    tone: 'urgent',
    read: false,
  }
}

/** Send at most one hint a week, about whichever actor is closest to striking. */
function sendHint(state: GameState, candidates: HintCandidate[]): GameState {
  const unit = hasIntelUnit(state)
  if (!unit && state.stats.securityIndex < WHISPER_SECURITY) return state
  const window = unit ? HINT_WINDOW.unit : HINT_WINDOW.whisper
  const eligible = candidates
    .filter((c) => c.gap <= window)
    .filter(
      (c) => (c.npc.hintedMoves?.[c.move.id] ?? -Infinity) + HINT_COOLDOWN_WEEKS <= state.week,
    )
    .sort((a, b) => a.gap - b.gap)
  const pick = eligible[0]
  if (!pick) return state
  const npc = state.activeNPCs[pick.slot]
  return {
    ...state,
    inbox: [...state.inbox, hintMessage(state, pick, unit)],
    activeNPCs: {
      ...state.activeNPCs,
      [pick.slot]: {
        ...npc,
        hintedMoves: { ...(npc.hintedMoves ?? {}), [pick.move.id]: state.week },
      },
    },
  }
}

// ── Weekly step ────────────────────────────────────────────────────────────

/**
 * Let every active actor consider a move this week (tick step 10, replacing
 * the old pressure ≥ 40 escalation). Deterministic for a given runSeed + week.
 */
export function runActorMoves(state: GameState, deck: EventCard[]): GameState {
  const cards = new Map(deck.map((c) => [c.id, c]))
  let next = state
  let cardPlayed = next.eventQueue.some((q) => q.npcArchetype)
  const hintCandidates: HintCandidate[] = []

  for (const slot of NPC_SLOTS) {
    const npc = next.activeNPCs[slot]
    if (!npc.isActive) continue
    if (npc.lastMove && next.week - npc.lastMove.week < MIN_WEEKS_BETWEEN_MOVES) continue

    const threshold = actThreshold(ACTOR_PERSONALITY[npc.archetypeKey].patience)
    const scored = scoreMoves(next, npc, slot, cards)
    // Only one actor card per week; a second actor falls back to its best inbox move
    const bar = (m: ActorMove) => (m.channel === 'inbox' ? threshold - LETTER_DISCOUNT : threshold)
    const best = scored.find(
      (s) => !(cardPlayed && s.move.channel === 'card') && s.score >= bar(s.move),
    )
    // Closest card move still below its bar — a candidate for an advance warning
    const nearCard = scored.find((s) => s.move.channel === 'card' && s.score < threshold)
    if (nearCard && nearCard.move.channel === 'card' && best?.move.channel !== 'card')
      hintCandidates.push({ slot, npc, move: nearCard.move, gap: threshold - nearCard.score })
    if (!best) continue

    const { move } = best
    const record: ActorMoveRecord = {
      moveId: move.id,
      title: cardTitle(cards, move, npc),
      week: next.week,
      because: best.because,
      score: Math.round(best.score * 100) / 100,
      threshold: Math.round(bar(best.move) * 100) / 100,
    }
    const updatedNpc: NPCState = {
      ...npc,
      // A card releases all pent-up pressure; a letter only some of it
      pressure: move.channel === 'card' ? 0 : Math.max(0, npc.pressure - 15),
      lastMove: record,
      moveCooldowns: { ...(npc.moveCooldowns ?? {}), [move.id]: next.week + move.cooldownWeeks },
      moveUses: { ...(npc.moveUses ?? {}), [move.id]: (npc.moveUses?.[move.id] ?? 0) + 1 },
    }
    next = { ...next, activeNPCs: { ...next.activeNPCs, [slot]: updatedNpc } }

    if (move.channel === 'card') {
      const card = cards.get(move.eventId)
      if (!card) continue
      next = { ...next, eventQueue: [...next.eventQueue, personaliseCard(card, updatedNpc, move)] }
      cardPlayed = true
      next = echoCoalitionMove(next, npc.archetypeKey)
    } else {
      next = { ...next, inbox: [...next.inbox, inboxFrom(next, updatedNpc, move)] }
    }
  }
  return sendHint(next, hintCandidates)
}
