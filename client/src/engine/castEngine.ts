import { NPC_ARCHETYPES } from '../data/npcs'
import { ACTIVATION_REASON, REASONS, type ReasonDefinition } from '../data/reasons'
import type {
  ActorExit,
  CoalitionState,
  GameState,
  InboxMessage,
  NPCKey,
  NPCState,
  OpinionEntry,
} from '../state/types'
import { hashSeed, mulberry32 } from '../utils/prng'
import { actorIntroMessage } from './actorEngine'
import { makeEntry, npcRelationshipFrom, tierOf } from './opinionEngine'

/**
 * The cast changes: coalitions form and split, actors leave and are replaced.
 * See docs/political-actors.md §7 and §11 (decision 4). Pure functions.
 */

const NPC_SLOTS: NPCKey[] = ['npc1', 'npc2', 'npc3']

// ── Coalitions ─────────────────────────────────────────────────────────────

const COALITION_MAX_WEEKS = 52

const isActivation = (e: OpinionEntry) => e.reason.startsWith('act-')

/** Hostile or wary: anyone who might be recruited against you. */
function coldActors(state: GameState): NPCState[] {
  return NPC_SLOTS.map((k) => state.activeNPCs[k]).filter((n) => {
    const t = tierOf(n.relationship)
    return n.isActive && (t === 'hostile' || t === 'wary')
  })
}

const isHostile = (n: NPCState) => tierOf(n.relationship) === 'hostile'

function hostileActors(state: GameState): NPCState[] {
  return NPC_SLOTS.map((k) => state.activeNPCs[k]).filter(
    (n) => n.isActive && tierOf(n.relationship) === 'hostile',
  )
}

/** The most common grievance (something the governor did) shared by ≥2 actors. */
function sharedGrievance(actors: NPCState[]): { reason: string; members: NPCState[] } | null {
  const holders = new Map<string, NPCState[]>()
  for (const a of actors) {
    const reasons = new Set(
      a.ledger.filter((e) => e.value < 0 && !isActivation(e)).map((e) => e.reason),
    )
    for (const r of reasons) holders.set(r, [...(holders.get(r) ?? []), a])
  }
  let best: { reason: string; members: NPCState[] } | null = null
  for (const [reason, members] of holders)
    if (members.length >= 2 && (!best || members.length > best.members.length))
      best = { reason, members }
  return best
}

function chiefOfStaffNote(
  state: GameState,
  id: string,
  subject: string,
  body: string,
): InboxMessage {
  return {
    id: `${id}-${state.week}`,
    from: 'chief-of-staff',
    fromLabel: 'Chief of Staff',
    week: state.week,
    subject,
    body,
    tone: 'urgent',
    read: false,
  }
}

function names(members: NPCState[]): string {
  const n = members.map((m) => m.name)
  return n.length <= 2 ? n.join(' and ') : `${n.slice(0, -1).join(', ')} and ${n[n.length - 1]}`
}

/**
 * Weekly: form a coalition when ≥2 cold actors (at least one hostile) share a
 * grievance; split it when fewer than 2 members are still cold, none is
 * hostile any more, or after a year.
 */
export function updateCoalition(state: GameState): GameState {
  const current = state.coalition
  if (current) {
    const stillCold = coldActors(state).filter((a) => current.members.includes(a.archetypeKey))
    const holds =
      stillCold.length >= 2 &&
      stillCold.some(isHostile) &&
      state.week - current.formedWeek < COALITION_MAX_WEEKS
    if (holds) return state
    return {
      ...state,
      coalition: null,
      inbox: [
        ...state.inbox,
        chiefOfStaffNote(
          state,
          'coalition-split',
          'The alliance against you has split',
          'Our sources say the people who were coordinating against this government have stopped talking to each other. Enjoy it while it lasts.',
        ),
      ],
    }
  }

  // Needs at least one hostile actor; wary actors with the same grievance can be recruited
  if (hostileActors(state).length === 0) return state
  const shared = sharedGrievance(coldActors(state))
  if (!shared?.members.some(isHostile)) return state
  const coalition: CoalitionState = {
    members: shared.members.map((m) => m.archetypeKey),
    formedWeek: state.week,
    grievance: shared.reason,
  }
  const label =
    (REASONS as Record<string, ReasonDefinition>)[shared.reason]?.label.toLowerCase() ?? ''
  let next: GameState = {
    ...state,
    coalition,
    inbox: [
      ...state.inbox,
      chiefOfStaffNote(
        state,
        'coalition-formed',
        'They are working together',
        `${names(shared.members)} have been seen together. They share one complaint about this government: ${label}. Expect them to move together.`,
      ),
    ],
  }
  // Each member records that they are no longer alone
  const npcs = { ...next.activeNPCs }
  for (const slot of NPC_SLOTS) {
    const n = npcs[slot]
    if (!coalition.members.includes(n.archetypeKey)) continue
    const ledger = [...n.ledger, makeEntry('joined-a-coalition', -5, state.week)]
    npcs[slot] = { ...n, ledger, relationship: npcRelationshipFrom(ledger) }
  }
  next = { ...next, activeNPCs: npcs }
  return next
}

// ── Succession ─────────────────────────────────────────────────────────────

/** Weekly chance that an active actor leaves the scene (~17% over a 4-year term). */
export const EXIT_CHANCE_PER_WEEK = 0.001
/** Actors need some time on the scene before they can leave. */
const MIN_TENURE_WEEKS = 26
/** Successors remember slights better than favours. */
const INHERIT_GRUDGE = 0.5
const INHERIT_GOODWILL = 0.25

const EXIT_TEXT: Record<ActorExit, (name: string) => string> = {
  died: (n) =>
    `${n} has died after a short illness. Condolence messages are pouring in from across the state.`,
  retired: (n) => `${n} has announced their retirement from public life, effective immediately.`,
  jailed: (n) =>
    `${n} has been arrested by the EFCC on corruption charges and remanded in custody.`,
  appointed: (n) => `${n} has accepted a federal appointment in Abuja and is leaving the state.`,
}

function pickExit(npc: NPCState, rng: () => number): ActorExit {
  const tier = tierOf(npc.relationship)
  const r = rng()
  if (tier === 'allied' || tier === 'cordial') return r < 0.5 ? 'appointed' : 'retired'
  if (tier === 'hostile') return r < 0.35 ? 'jailed' : r < 0.7 ? 'died' : 'retired'
  return r < 0.5 ? 'retired' : 'died'
}

function successorName(npc: NPCState, rng: () => number): string {
  const pool = NPC_ARCHETYPES[npc.archetypeKey].namePools.filter((n) => n !== npc.name)
  return pool[Math.floor(rng() * pool.length)] ?? `${npc.name} (successor)`
}

const EXIT_REASON: Partial<Record<ActorExit, { reason: string; value: number }>> = {
  jailed: { reason: 'predecessor-jailed', value: -15 },
  appointed: { reason: 'predecessor-appointed', value: 8 },
  died: { reason: 'predecessor-died', value: -4 },
}

/** Build the successor: a share of the old ledger, the standing reason, and how the predecessor left. */
export function successorOf(npc: NPCState, exit: ActorExit, week: number, name: string): NPCState {
  const done = npc.ledger.filter((e) => !isActivation(e))
  const grudge = done.filter((e) => e.value < 0).reduce((s, e) => s + e.value, 0) * INHERIT_GRUDGE
  const goodwill =
    done.filter((e) => e.value > 0).reduce((s, e) => s + e.value, 0) * INHERIT_GOODWILL
  const ledger: OpinionEntry[] = []
  const seed = ACTIVATION_REASON[npc.archetypeKey]
  if (seed) ledger.push(makeEntry(seed.reason, Math.round(seed.value / 2), week))
  if (Math.abs(grudge) >= 1) ledger.push(makeEntry('inherited-grudge', Math.round(grudge), week))
  if (goodwill >= 1) ledger.push(makeEntry('inherited-goodwill', Math.round(goodwill), week))
  const exitReason = EXIT_REASON[exit]
  if (exitReason) ledger.push(makeEntry(exitReason.reason, exitReason.value, week, npc.name))
  return {
    isActive: true,
    archetypeKey: npc.archetypeKey,
    name,
    ledger,
    relationship: npcRelationshipFrom(ledger),
    pressure: 0,
    activeWeek: week,
    predecessor: { name: npc.name, exit, week },
  }
}

/** Weekly: an actor may leave; a successor takes the office (and its open promises). */
export function rollSuccession(state: GameState): GameState {
  let next = state
  for (const slot of NPC_SLOTS) {
    const npc = next.activeNPCs[slot]
    if (!npc.isActive || next.week - (npc.activeWeek ?? next.week) < MIN_TENURE_WEEKS) continue
    const rng = mulberry32(hashSeed(next.runSeed ?? 0, `exit-${next.week}-${slot}`))
    if (rng() >= EXIT_CHANCE_PER_WEEK) continue

    const exit = pickExit(npc, rng)
    const heir = successorOf(npc, exit, next.week, successorName(npc, rng))
    next = {
      ...next,
      activeNPCs: { ...next.activeNPCs, [slot]: heir },
      // Promises were made to the office, not the person
      promises: next.promises.map((p) =>
        p.status === 'open' && p.actor === npc.archetypeKey ? { ...p, actorName: heir.name } : p,
      ),
      inbox: [
        ...next.inbox,
        chiefOfStaffNote(
          next,
          `exit-${slot}`,
          `${npc.name}: ${exit === 'jailed' ? 'arrested' : exit === 'appointed' ? 'leaving for Abuja' : exit}`,
          `${EXIT_TEXT[exit](npc.name)} ${heir.name} takes over. Our people say they inherited the files — and the grudges.`,
        ),
        actorIntroMessage(next, heir),
      ],
    }
  }
  return next
}
