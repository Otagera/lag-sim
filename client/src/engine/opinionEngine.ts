import { ACTIVATION_REASON, REASONS, type ReasonDefinition } from '../data/reasons'
import type {
  ActorImpact,
  GameState,
  NPCKey,
  NPCState,
  OpinionDecay,
  OpinionEntry,
} from '../state/types'

/**
 * Opinion ledger — every actor's feelings are a list of remembered reasons.
 * Relationship numbers are derived from the ledger, never set directly.
 * See docs/political-actors.md §3.
 */

// Weekly multipliers: fast loses ~25% every 8 weeks, slow ~25% every 26 weeks.
export const DECAY_PER_WEEK: Record<OpinionDecay, number> = {
  fast: 0.75 ** (1 / 8),
  slow: 0.75 ** (1 / 26),
  permanent: 1,
}

/** Entries smaller than this are forgotten. */
const FORGET_BELOW = 0.5

// ── Tiers ──────────────────────────────────────────────────────────────────

export type OpinionTier = 'hostile' | 'wary' | 'cordial' | 'allied'

export const TIER_THRESHOLDS = { hostileBelow: -30, cordialFrom: 10, alliedFrom: 40 } as const

export function tierOf(relationship: number): OpinionTier {
  if (relationship < TIER_THRESHOLDS.hostileBelow) return 'hostile'
  if (relationship < TIER_THRESHOLDS.cordialFrom) return 'wary'
  if (relationship < TIER_THRESHOLDS.alliedFrom) return 'cordial'
  return 'allied'
}

/** The coarse tier used by the NPC escalation decks. */
export function deckTierOf(relationship: number): 'hostile' | 'neutral' | 'ally' {
  const t = tierOf(relationship)
  return t === 'hostile' ? 'hostile' : t === 'allied' ? 'ally' : 'neutral'
}

export const TIER_LABEL: Record<OpinionTier, string> = {
  hostile: 'Hostile',
  wary: 'Wary',
  cordial: 'Cordial',
  allied: 'Allied',
}

// ── Ledger primitives ──────────────────────────────────────────────────────

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

export function ledgerSum(ledger: OpinionEntry[]): number {
  return ledger.reduce((sum, e) => sum + e.value, 0)
}

export function npcRelationshipFrom(ledger: OpinionEntry[]): number {
  return clamp(ledgerSum(ledger), -100, 100)
}

/** Fashemu keeps his historical 0..100 scale, starting neutral at 50. */
export function fashemuRelationshipFrom(ledger: OpinionEntry[]): number {
  return clamp(50 + ledgerSum(ledger), 0, 100)
}

export function decayOf(reason: string): OpinionDecay {
  return (REASONS as Record<string, ReasonDefinition>)[reason]?.decay ?? 'slow'
}

export function makeEntry(
  reason: string,
  value: number,
  week: number,
  source?: string,
): OpinionEntry {
  return { reason, value, week, decay: decayOf(reason), ...(source ? { source } : {}) }
}

export function decayLedger(ledger: OpinionEntry[]): OpinionEntry[] {
  let changed = false
  const next: OpinionEntry[] = []
  for (const e of ledger) {
    if (e.decay === 'permanent') {
      next.push(e)
      continue
    }
    changed = true
    const value = e.value * DECAY_PER_WEEK[e.decay]
    if (Math.abs(value) >= FORGET_BELOW) next.push({ ...e, value })
  }
  return changed ? next : ledger
}

/** Strongest reasons first (by current absolute value). */
export function topReasons(ledger: OpinionEntry[], n = ledger.length): OpinionEntry[] {
  return [...ledger].sort((a, b) => Math.abs(b.value) - Math.abs(a.value)).slice(0, n)
}

// ── State-level operations ─────────────────────────────────────────────────

const NPC_SLOTS: NPCKey[] = ['npc1', 'npc2', 'npc3']

function withLedger(npc: NPCState, ledger: OpinionEntry[]): NPCState {
  return { ...npc, ledger, relationship: npcRelationshipFrom(ledger) }
}

/** Apply a choice's actor impacts to whichever slot holds each archetype. */
export function applyActorImpact(
  state: GameState,
  impacts: ActorImpact[] | undefined,
  source?: string,
): GameState {
  if (!impacts || impacts.length === 0) return state
  const npcs = { ...state.activeNPCs }
  let changed = false
  for (const impact of impacts) {
    for (const slot of NPC_SLOTS) {
      if (npcs[slot].archetypeKey !== impact.actor) continue
      const entry = makeEntry(impact.reason, impact.value, state.week, source)
      npcs[slot] = withLedger(npcs[slot], [...npcs[slot].ledger, entry])
      changed = true
    }
  }
  return changed ? { ...state, activeNPCs: npcs } : state
}

/** Seed a newly activated NPC's ledger with the reason they turned up. */
export function seedActivation(npc: NPCState, week: number): NPCState {
  const seed = ACTIVATION_REASON[npc.archetypeKey]
  if (!seed || npc.ledger.length > 0) return npc
  return withLedger(npc, [makeEntry(seed.reason, seed.value, week)])
}

export function addFashemuOpinion(
  state: GameState,
  reason: string,
  value: number,
  source?: string,
): GameState {
  const fashemuLedger = [...state.fashemuLedger, makeEntry(reason, value, state.week, source)]
  return {
    ...state,
    fashemuLedger,
    fashemuRelationship: fashemuRelationshipFrom(fashemuLedger),
  }
}

/** Weekly decay for every active actor's ledger (tick step 10). */
export function decayActorLedgers(state: GameState): GameState {
  let npcs = state.activeNPCs
  for (const slot of NPC_SLOTS) {
    const npc = npcs[slot]
    if (!npc.isActive || npc.ledger.length === 0) continue
    const ledger = decayLedger(npc.ledger)
    if (ledger !== npc.ledger) npcs = { ...npcs, [slot]: withLedger(npc, ledger) }
  }
  const fashemuLedger = decayLedger(state.fashemuLedger)
  if (npcs === state.activeNPCs && fashemuLedger === state.fashemuLedger) return state
  return {
    ...state,
    activeNPCs: npcs,
    fashemuLedger,
    fashemuRelationship: fashemuRelationshipFrom(fashemuLedger),
  }
}
