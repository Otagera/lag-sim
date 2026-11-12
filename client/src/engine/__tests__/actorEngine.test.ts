import { describe, expect, it } from 'vitest'
import { ACTOR_MOVES, ACTOR_PERSONALITY } from '../../data/actors'
import { NPC_DECK_EVENTS } from '../../data/events/npcDecks'
import { NPC_ARCHETYPE_KEYS } from '../../data/npcs'
import { STARTING_STATE } from '../../data/startingState'
import type { GameState, NPCArchetypeKey, NPCState } from '../../state/types'
import { actThreshold, actorIntroMessage, runActorMoves, scoreMoves } from '../actorEngine'
import { makeEntry, npcRelationshipFrom } from '../opinionEngine'

const CARDS = new Map(NPC_DECK_EVENTS.map((c) => [c.id, c]))

function clone(s: GameState): GameState {
  return JSON.parse(JSON.stringify(s))
}

function actor(archetypeKey: NPCArchetypeKey, opinion: number, pressure: number, name = 'Test Actor'): NPCState {
  const ledger = [makeEntry(opinion < 0 ? 'sent-the-police' : 'paid-what-was-owed', opinion, 10, 'Some Card')]
  return {
    isActive: true,
    archetypeKey,
    name,
    ledger,
    relationship: npcRelationshipFrom(ledger),
    pressure,
    activeWeek: 5,
  }
}

function stateWith(npc1: NPCState, tweak: (s: GameState) => void = () => {}): GameState {
  const s = clone(STARTING_STATE)
  s.week = 40
  s.runSeed = 1234
  s.activeNPCs.npc1 = npc1
  tweak(s)
  return s
}

describe('actor move selection', () => {
  it('a hostile actor waits when the moment is wrong…', () => {
    const s = stateWith(actor('journalist', -50, 10), (st) => {
      st.stats.corruptionPressure = 30
      st.stats.publicTrust = 60
    })
    const r = runActorMoves(s, NPC_DECK_EVENTS)
    expect(r.eventQueue).toHaveLength(0)
  })

  it('…and strikes when the governor is exposed (opportunism)', () => {
    const s = stateWith(actor('journalist', -50, 10), (st) => {
      st.stats.corruptionPressure = 65
      st.stats.publicTrust = 30
    })
    const r = runActorMoves(s, NPC_DECK_EVENTS)
    expect(r.eventQueue.map((e) => e.id)).toContain('npc-journalist-procurement-expose')
    const last = r.activeNPCs.npc1.lastMove
    expect(last?.because).toEqual(
      expect.arrayContaining(['corruption stories are everywhere', 'your public trust is low']),
    )
    expect(last?.score).toBeGreaterThanOrEqual(last?.threshold ?? 99)
  })

  it('patient actors need a bigger opening than impatient ones', () => {
    expect(actThreshold(ACTOR_PERSONALITY.insider.patience)).toBeGreaterThan(
      actThreshold(ACTOR_PERSONALITY['youth-organiser'].patience),
    )
  })

  it('allied actors do not make hostile moves', () => {
    const scored = scoreMoves(stateWith(actor('union-leader', 60, 90)), actor('union-leader', 60, 90), 'npc1', CARDS)
    expect(scored.map((m) => m.move.id)).not.toContain('union-leader:strike')
  })

  it('only one actor card reaches the player per week', () => {
    const s = stateWith(actor('journalist', -60, 100), (st) => {
      st.stats.corruptionPressure = 70
      st.stats.publicTrust = 25
      st.stats.cashReserve = 5
      st.activeNPCs.npc2 = actor('union-leader', -60, 100, 'Union')
    })
    const r = runActorMoves(s, NPC_DECK_EVENTS)
    expect(r.eventQueue.filter((e) => e.npcArchetype)).toHaveLength(1)
  })

  it('repeated tactics lose appeal', () => {
    const fresh = actor('journalist', -50, 60)
    const tired = { ...fresh, moveUses: { 'journalist:expose': 4 } }
    const s = stateWith(fresh, (st) => {
      st.stats.corruptionPressure = 65
    })
    const a = scoreMoves(s, fresh, 'npc1', CARDS).find((m) => m.move.id === 'journalist:expose')
    const b = scoreMoves(s, tired, 'npc1', CARDS).find((m) => m.move.id === 'journalist:expose')
    expect(b?.score ?? 0).toBeLessThan((a?.score ?? 0) - 0.5)
  })

  it('is deterministic for a given runSeed and week', () => {
    const s = stateWith(actor('journalist', -50, 70), (st) => {
      st.stats.corruptionPressure = 55
    })
    expect(runActorMoves(s, NPC_DECK_EVENTS)).toEqual(runActorMoves(s, NPC_DECK_EVENTS))
  })
})

describe('move output quotes the actor’s reasons', () => {
  it('cards carry the strongest grievance as a sentence', () => {
    const s = stateWith(actor('journalist', -50, 10, 'Barr. Quote'), (st) => {
      st.stats.corruptionPressure = 65
      st.stats.publicTrust = 30
    })
    const card = runActorMoves(s, NPC_DECK_EVENTS).eventQueue[0]
    expect(card.title).toContain('Barr. Quote')
    expect(card.body).toContain('has not forgotten the police')
    expect(card.body).not.toContain('{REASON}')
  })

  it('letters speak in the first person', () => {
    const s = stateWith(actor('union-leader', -50, 40, 'Comrade Letter'))
    const r = runActorMoves(s, NPC_DECK_EVENTS)
    const letter = r.inbox.find((m) => m.fromLabel === 'Comrade Letter')
    expect(letter?.body).toContain('You sent the police.')
    expect(letter?.tone).toBe('cold')
  })

  it('every archetype has an intro in its own voice', () => {
    for (const key of NPC_ARCHETYPE_KEYS) {
      const msg = actorIntroMessage(clone(STARTING_STATE), actor(key, 0, 0, 'X'))
      expect(msg.body.length).toBeGreaterThan(40)
    }
  })
})

describe('move library integrity', () => {
  it('every card move points at a deck card for the same actor', () => {
    for (const m of ACTOR_MOVES) {
      if (m.channel !== 'card') continue
      expect(CARDS.get(m.eventId)?.npcArchetype, m.id).toBe(m.actor)
    }
  })

  it('every archetype has at least one card move and both letters', () => {
    for (const key of NPC_ARCHETYPE_KEYS) {
      const moves = ACTOR_MOVES.filter((m) => m.actor === key)
      expect(moves.some((m) => m.channel === 'card'), key).toBe(true)
      expect(moves.map((m) => m.id)).toEqual(expect.arrayContaining([`${key}:warn`, `${key}:goodwill`]))
    }
  })
})
