import { PROMISES, type PromiseDefinition } from '../data/promises'
import type { GameState, InboxMessage, NPCKey, PromiseRecord } from '../state/types'
import { applyActorImpact } from './opinionEngine'

/**
 * Promises and reputation (docs/political-actors.md §6).
 * Pure functions: (state, …) => state.
 */

const NPC_SLOTS: NPCKey[] = ['npc1', 'npc2', 'npc3']

export const KEPT_GOODWILL = 12
export const BROKEN_GRIEVANCE = -25
export const GOSSIP_GRIEVANCE = -8

function def(defId: string): PromiseDefinition | undefined {
  return (PROMISES as Record<string, PromiseDefinition>)[defId]
}

function slotFor(state: GameState, actor: PromiseDefinition['actor']): NPCKey | undefined {
  return NPC_SLOTS.find(
    (k) => state.activeNPCs[k].isActive && state.activeNPCs[k].archetypeKey === actor,
  )
}

/** Give your word. No-op if the actor is not on the scene or a promise of this kind is already open. */
export function makePromise(state: GameState, defId: string): GameState {
  const d = def(defId)
  if (!d) return state
  const slot = slotFor(state, d.actor)
  if (!slot) return state
  if (state.promises.some((p) => p.defId === defId && p.status === 'open')) return state
  const record: PromiseRecord = {
    id: `${defId}-${state.week}`,
    defId,
    actor: d.actor,
    actorName: state.activeNPCs[slot].name,
    madeWeek: state.week,
    dueWeek: state.week + d.dueInWeeks,
    status: 'open',
  }
  return { ...state, promises: [...state.promises, record] }
}

let letterCounter = 0

function promiseLetter(state: GameState, p: PromiseRecord, kept: boolean): InboxMessage {
  const d = def(p.defId)
  letterCounter++
  return {
    id: `promise-${p.id}-${kept ? 'kept' : 'broken'}-${letterCounter}`,
    from: p.actor === 'youth-organiser' ? 'dayo' : p.actor === 'journalist' ? 'neo' : 'smj',
    fromLabel: p.actorName,
    week: state.week,
    subject: kept ? 'You kept your word' : 'You gave your word',
    body: kept
      ? `“${d?.terms}.” You said it, and you did it. That is rarer than you think, Governor. I will remember.`
      : `“${d?.terms}.” Those were your words. I will not make the mistake of trusting them again — and I will not be the only one.`,
    tone: kept ? 'warm' : 'threatening',
    read: false,
  }
}

function resolvePromise(state: GameState, promiseId: string, kept: boolean): GameState {
  const p = state.promises.find((x) => x.id === promiseId)
  if (p?.status !== 'open') return state
  const d = def(p.defId)
  const source = d?.terms
  let next: GameState = {
    ...state,
    promises: state.promises.map((x) =>
      x.id === promiseId ? { ...x, status: kept ? 'kept' : 'broken', resolvedWeek: state.week } : x,
    ),
  }
  next = applyActorImpact(
    next,
    [
      {
        actor: p.actor,
        reason: kept ? 'kept-your-word' : 'broke-your-word',
        value: kept ? KEPT_GOODWILL : BROKEN_GRIEVANCE,
      },
    ],
    source,
  )
  if (!kept) {
    // Everyone else on the scene hears about it
    const others = NPC_SLOTS.map((k) => next.activeNPCs[k]).filter(
      (n) => n.isActive && n.archetypeKey !== p.actor,
    )
    next = applyActorImpact(
      next,
      others.map((n) => ({
        actor: n.archetypeKey,
        reason: 'heard-you-broke-your-word',
        value: GOSSIP_GRIEVANCE,
      })),
      `${p.actorName}: ${source}`,
    )
  }
  // Only write if the actor is still around to write
  if (slotFor(next, p.actor))
    next = { ...next, inbox: [...next.inbox, promiseLetter(next, p, kept)] }
  return next
}

/** A choice that breaks any open promise of this kind. */
export function breakPromise(state: GameState, defId: string): GameState {
  const open = state.promises.find((p) => p.defId === defId && p.status === 'open')
  return open ? resolvePromise(state, open.id, false) : state
}

/** Weekly: judge promises that have fallen due (tick step 10). */
export function tickPromises(state: GameState): GameState {
  let next = state
  for (const p of state.promises) {
    if (p.status !== 'open' || p.dueWeek > state.week) continue
    const d = def(p.defId)
    next = resolvePromise(next, p.id, d ? d.kept(next) : true)
  }
  return next
}

// ── Reputation ─────────────────────────────────────────────────────────────

export type Reputation = {
  kept: number
  broken: number
  label: 'Unproven' | 'Reliable' | 'Doubted' | 'Unreliable'
  /** Added to the appeal of actors' deal offers: trusted governors get offered more */
  offerModifier: number
}

export function reputationOf(state: GameState): Reputation {
  const kept = state.promises.filter((p) => p.status === 'kept').length
  const broken = state.promises.filter((p) => p.status === 'broken').length
  const label: Reputation['label'] =
    broken >= 2 ? 'Unreliable' : broken === 1 ? 'Doubted' : kept >= 2 ? 'Reliable' : 'Unproven'
  const offerModifier = Math.max(-0.3, Math.min(0.2, 0.08 * kept - 0.15 * broken))
  return { kept, broken, label, offerModifier }
}
