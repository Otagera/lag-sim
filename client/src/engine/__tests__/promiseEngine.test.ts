import { describe, expect, it } from 'vitest'
import { PROMISES } from '../../data/promises'
import { ACTOR_MOVES } from '../../data/actors'
import { NPC_DECK_EVENTS } from '../../data/events/npcDecks'
import { RESEARCH_TREE } from '../../data/researchTree'
import { STARTING_STATE } from '../../data/startingState'
import type { GameState, NPCArchetypeKey, NPCState } from '../../state/types'
import { INTEL_UNIT_NODE, runActorMoves } from '../actorEngine'
import { ALL_EVENTS, resolveEvent } from '../eventEngine'
import { makeEntry, npcRelationshipFrom } from '../opinionEngine'
import { breakPromise, makePromise, reputationOf, tickPromises } from '../promiseEngine'

function clone(s: GameState): GameState {
  return JSON.parse(JSON.stringify(s))
}

function actor(archetypeKey: NPCArchetypeKey, opinion = 0, pressure = 0, name = 'Actor'): NPCState {
  const ledger = opinion ? [makeEntry(opinion < 0 ? 'defied-them' : 'struck-a-deal', opinion, 10)] : []
  return { isActive: true, archetypeKey, name, ledger, relationship: npcRelationshipFrom(ledger), pressure, activeWeek: 5 }
}

function base(): GameState {
  const s = clone(STARTING_STATE)
  s.week = 40
  s.runSeed = 99
  s.activeNPCs.npc1 = actor('union-leader', 0, 0, 'Comrade Union')
  s.activeNPCs.npc2 = actor('journalist', 0, 0, 'Barr. Press')
  return s
}

describe('promises', () => {
  it('makePromise opens a promise with a due week, once', () => {
    let s = makePromise(base(), 'union-wage-uplift')
    s = makePromise(s, 'union-wage-uplift')
    expect(s.promises).toHaveLength(1)
    expect(s.promises[0]).toMatchObject({ actor: 'union-leader', actorName: 'Comrade Union', status: 'open', dueWeek: 66 })
  })

  it('is a no-op if the actor is not on the scene', () => {
    expect(makePromise(base(), 'oba-consult-palace').promises).toHaveLength(0)
  })

  it('kept promise: lasting goodwill and a warm letter', () => {
    let s = makePromise(base(), 'union-wage-uplift')
    s = { ...s, week: 66, stats: { ...s.stats, cashReserve: 20 }, consecutiveDeficitWeeks: 0 }
    s = tickPromises(s)
    expect(s.promises[0].status).toBe('kept')
    expect(s.activeNPCs.npc1.ledger.at(-1)).toMatchObject({ reason: 'kept-your-word', value: 12, decay: 'slow' })
    expect(s.inbox.at(-1)?.tone).toBe('warm')
  })

  it('missed promise: permanent grievance, and everyone else hears about it', () => {
    let s = makePromise(base(), 'union-wage-uplift')
    s = { ...s, week: 66, stats: { ...s.stats, cashReserve: -5 } }
    s = tickPromises(s)
    expect(s.promises[0].status).toBe('broken')
    expect(s.activeNPCs.npc1.ledger.at(-1)).toMatchObject({ reason: 'broke-your-word', decay: 'permanent' })
    expect(s.activeNPCs.npc2.ledger.at(-1)).toMatchObject({ reason: 'heard-you-broke-your-word', value: -8 })
    expect(s.inbox.at(-1)?.tone).toBe('threatening')
  })

  it('a later choice can break a promise immediately', () => {
    let s = base()
    s.activeNPCs.npc1 = actor('oba-liaison', 0, 0, 'High Chief Palace')
    s = makePromise(s, 'oba-consult-palace')
    const land = ALL_EVENTS.find((e) => e.id === 'npc-oba-land-dispute')
    expect(land).toBeDefined()
    if (!land) return
    s = resolveEvent(s, land, 'proceed-anyway')
    expect(s.promises[0].status).toBe('broken')
    expect(breakPromise(s, 'oba-consult-palace')).toBe(s)
  })

  it('accepting a deal card gives your word', () => {
    const deal = ALL_EVENTS.find((e) => e.id === 'npc-union-ally-opportunity')
    expect(deal).toBeDefined()
    if (!deal) return
    const s = resolveEvent(base(), deal, 'accept-deal')
    expect(s.promises.map((p) => p.defId)).toContain('union-wage-uplift')
  })
})

describe('reputation', () => {
  it('labels and offer modifier follow kept vs broken', () => {
    const mk = (status: 'kept' | 'broken') => ({
      id: status + Math.random(),
      defId: 'union-wage-uplift',
      actor: 'union-leader' as const,
      actorName: 'X',
      madeWeek: 1,
      dueWeek: 2,
      status,
    })
    expect(reputationOf(base()).label).toBe('Unproven')
    expect(reputationOf({ ...base(), promises: [mk('kept'), mk('kept')] })).toMatchObject({ label: 'Reliable', offerModifier: 0.16 })
    expect(reputationOf({ ...base(), promises: [mk('broken')] }).label).toBe('Doubted')
    expect(reputationOf({ ...base(), promises: [mk('broken'), mk('broken')] }).label).toBe('Unreliable')
  })
})

describe('advance warnings (hybrid intel)', () => {
  // A hostile journalist building towards an exposé, just short of acting
  function brewing(security: number, unit: boolean): GameState {
    const s = base()
    s.activeNPCs.npc1 = actor('journalist', -50, 30, 'Barr. Brewing')
    s.activeNPCs.npc2 = { ...s.activeNPCs.npc2, isActive: false }
    s.stats.securityIndex = security
    s.stats.corruptionPressure = 30
    s.stats.publicTrust = 55
    if (unit) s.researchNodeStatuses = { ...s.researchNodeStatuses, [INTEL_UNIT_NODE]: 'completed' }
    return s
  }

  function briefings(s: GameState) {
    return runActorMoves(s, NPC_DECK_EVENTS).inbox.filter((m) => m.from === 'chief-of-staff')
  }

  it('low security, no unit: no warning', () => {
    expect(briefings(brewing(30, false))).toHaveLength(0)
  })

  it('good security, no unit: a vague whisper that names nobody', () => {
    const s = brewing(60, false)
    s.activeNPCs.npc1 = { ...s.activeNPCs.npc1, pressure: 40 }
    const w = briefings(s)
    expect(w).toHaveLength(1)
    expect(w[0].subject).toBe('Security whisper')
    expect(w[0].body).not.toContain('Barr. Brewing')
  })

  it('hints are not repeated every week for the same move', () => {
    const s = brewing(30, true)
    const once = runActorMoves(s, NPC_DECK_EVENTS)
    const twice = runActorMoves({ ...once, week: once.week + 1 }, NPC_DECK_EVENTS)
    expect(twice.inbox.filter((m) => m.from === 'chief-of-staff')).toHaveLength(1)
  })

  it('the unit names the actor and warns earlier', () => {
    const named = briefings(brewing(30, true))
    expect(named).toHaveLength(1)
    expect(named[0].body).toContain('Barr. Brewing')
    expect(named[0].subject).toBe('Intelligence briefing')
  })

  it('the intelligence unit node exists in the security domain', () => {
    expect(RESEARCH_TREE.find((n) => n.id === INTEL_UNIT_NODE)?.domain).toBe('security')
  })

  it('every card move has a whisper', () => {
    for (const m of ACTOR_MOVES) if (m.channel === 'card') expect(m.whisper, m.id).toBeTruthy()
  })
})

describe('promise content integrity', () => {
  it('every makePromise/breakPromise on a card points at a defined promise for that card’s actor', () => {
    for (const e of ALL_EVENTS)
      for (const c of e.choices)
        for (const id of [c.makePromise, c.breakPromise])
          if (id) {
            const d = (PROMISES as Record<string, { actor: string }>)[id]
            expect(d, `${e.id}/${c.id}`).toBeDefined()
            if (e.npcArchetype) expect(d.actor).toBe(e.npcArchetype)
          }
  })
})
