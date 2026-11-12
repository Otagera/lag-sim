import { describe, expect, it } from 'vitest'
import { NPC_DECK_EVENTS } from '../../data/events/npcDecks'
import { STARTING_STATE } from '../../data/startingState'
import type { GameState, NPCArchetypeKey, NPCState, OpinionEntry } from '../../state/types'
import { COALITION_BONUS, scoreMoves } from '../actorEngine'
import { rollSuccession, successorOf, updateCoalition } from '../castEngine'
import { resolveEvent } from '../eventEngine'
import { makeEntry, npcRelationshipFrom } from '../opinionEngine'
import { makePromise } from '../promiseEngine'

const CARDS = new Map(NPC_DECK_EVENTS.map((c) => [c.id, c]))

function clone(s: GameState): GameState {
  return JSON.parse(JSON.stringify(s))
}

function actor(archetypeKey: NPCArchetypeKey, ledger: OpinionEntry[], name: string, activeWeek = 5): NPCState {
  return { isActive: true, archetypeKey, name, ledger, relationship: npcRelationshipFrom(ledger), pressure: 0, activeWeek }
}

const police = (v = -45) => makeEntry('sent-the-police', v, 20, 'Rally at Ojota')

function twoAngry(): GameState {
  const s = clone(STARTING_STATE)
  s.week = 60
  s.runSeed = 7
  s.activeNPCs.npc1 = actor('journalist', [police()], 'Barr. Press')
  s.activeNPCs.npc2 = actor('youth-organiser', [police()], 'Comrade Youth')
  return s
}

describe('coalitions', () => {
  it('two hostile actors with the same grievance team up', () => {
    const s = updateCoalition(twoAngry())
    expect(s.coalition).toMatchObject({ members: ['journalist', 'youth-organiser'], grievance: 'sent-the-police', formedWeek: 60 })
    expect(s.inbox.at(-1)?.subject).toBe('They are working together')
    expect(s.inbox.at(-1)?.body).toContain('you sent the police')
  })

  it('a shared standing reason is not enough — it has to be something you did', () => {
    const s = twoAngry()
    s.activeNPCs.npc1 = actor('journalist', [makeEntry('act-smells-corruption', -45, 20)], 'A')
    s.activeNPCs.npc2 = actor('youth-organiser', [makeEntry('act-youth-anger', -45, 20)], 'B')
    expect(updateCoalition(s).coalition).toBeNull()
  })

  it('members get a bonus on hostile moves, labelled for the why-now line', () => {
    const s = updateCoalition(twoAngry())
    const alone = scoreMoves(twoAngry(), twoAngry().activeNPCs.npc1, 'npc1', CARDS).find((m) => m.move.id === 'journalist:expose')
    const together = scoreMoves(s, s.activeNPCs.npc1, 'npc1', CARDS).find((m) => m.move.id === 'journalist:expose')
    expect(together?.because).toContain('they have allies now')
    // −5 "no longer alone" entry nudges pressure-free score only via tier; bonus is the main difference
    expect((together?.score ?? 0) - (alone?.score ?? 0)).toBeCloseTo(COALITION_BONUS, 1)
  })

  it('a wary actor with the same grievance can be recruited by a hostile one', () => {
    const s = twoAngry()
    s.activeNPCs.npc2 = actor('youth-organiser', [police(-20)], 'Comrade Wary')
    expect(updateCoalition(s).coalition?.members).toEqual(['journalist', 'youth-organiser'])
  })

  it('splits when a member comes round to you', () => {
    let s = updateCoalition(twoAngry())
    s.activeNPCs.npc2 = actor('youth-organiser', [police(), makeEntry('took-up-their-cause', 60, 61)], 'Comrade Youth')
    s = updateCoalition(s)
    expect(s.coalition).toBeNull()
    expect(s.inbox.at(-1)?.subject).toBe('The alliance against you has split')
  })
})

describe('succession', () => {
  it('a successor inherits half the grudges, a quarter of the goodwill, and how the predecessor left', () => {
    const old = actor('union-leader', [
      makeEntry('act-unpaid-workers', -40, 10),
      makeEntry('defied-them', -20, 30),
      makeEntry('paid-what-was-owed', 20, 40),
    ], 'Comrade Old')
    const heir = successorOf(old, 'jailed', 90, 'Comrade New')
    const byReason = Object.fromEntries(heir.ledger.map((e) => [e.reason, e.value]))
    expect(byReason['act-unpaid-workers']).toBe(-20) // standing reason at half strength
    expect(byReason['inherited-grudge']).toBe(-10)
    expect(byReason['inherited-goodwill']).toBe(5)
    expect(byReason['predecessor-jailed']).toBe(-15)
    expect(heir.predecessor).toEqual({ name: 'Comrade Old', exit: 'jailed', week: 90 })
    expect(heir.pressure).toBe(0)
  })

  it('rare and seeded; announces the change and hands over open promises', () => {
    let exits = 0
    let sample: GameState | null = null
    for (let seed = 1; seed <= 2000; seed++) {
      const s = clone(STARTING_STATE)
      s.week = 100
      s.runSeed = seed
      s.activeNPCs.npc1 = actor('union-leader', [], 'Comrade Old', 10)
      const promised = makePromise(s, 'union-wage-uplift')
      const r = rollSuccession(promised)
      if (r.activeNPCs.npc1.name !== 'Comrade Old') {
        exits++
        sample ??= r
      }
    }
    // ~0.1% per week: a handful of exits in 2000 independent weeks
    expect(exits).toBeGreaterThan(0)
    expect(exits).toBeLessThan(10)
    if (!sample) return
    expect(sample.activeNPCs.npc1.predecessor?.name).toBe('Comrade Old')
    expect(sample.promises[0].actorName).toBe(sample.activeNPCs.npc1.name)
    expect(sample.inbox.some((m) => m.from === 'chief-of-staff')).toBe(true)
  })

  it('no exits before an actor has been on the scene for half a year', () => {
    for (let seed = 1; seed <= 3000; seed++) {
      const s = clone(STARTING_STATE)
      s.week = 20
      s.runSeed = seed
      s.activeNPCs.npc1 = actor('union-leader', [], 'Comrade New', 10)
      expect(rollSuccession(s).activeNPCs.npc1.name).toBe('Comrade New')
    }
  })
})

describe('Fashemu promise', () => {
  function askCard(id: string) {
    return {
      id,
      title: 'Chief Fashemu asks',
      body: 'x',
      severity: 'high' as const,
      category: 'godfather' as const,
      choices: [
        { id: `${id}:accept`, label: 'Yes', description: '', immediate: {}, factionImpact: {} },
        { id: `${id}:refuse`, label: 'No', description: '', immediate: {}, factionImpact: {} },
      ],
    }
  }

  it('complying with his ask gives your word; refusing a later ask breaks it', () => {
    let s = clone(STARTING_STATE)
    s.fashemuPhase = 'active'
    s = resolveEvent(s, askCard('fashemu-ask-1-contract'), 'fashemu-ask-1-contract:accept')
    expect(s.promises.find((p) => p.defId === 'fashemu-loyalty')).toMatchObject({
      actor: 'fashemu',
      actorName: 'Chief Fashemu',
      status: 'open',
    })
    s = resolveEvent({ ...s, week: s.week + 4 }, askCard('fashemu-ask-2-appointment'), 'fashemu-ask-2-appointment:refuse')
    expect(s.promises.find((p) => p.defId === 'fashemu-loyalty')?.status).toBe('broken')
    expect(s.fashemuLedger.map((e) => e.reason)).toEqual(
      expect.arrayContaining(['did-what-he-asked', 'refused-him', 'broke-your-word']),
    )
  })

  it('a broken promise to Fashemu stays inside the party (no gossip to other actors)', () => {
    let s = twoAngry()
    s.fashemuPhase = 'active'
    s = makePromise(s, 'fashemu-loyalty')
    const before = s.activeNPCs.npc1.ledger.length
    s = resolveEvent(s, askCard('fashemu-ask-2-appointment'), 'fashemu-ask-2-appointment:refuse')
    expect(s.activeNPCs.npc1.ledger).toHaveLength(before)
  })

  it('a dormant Fashemu cannot be promised anything', () => {
    expect(makePromise(clone(STARTING_STATE), 'fashemu-loyalty').promises).toHaveLength(0)
  })
})
