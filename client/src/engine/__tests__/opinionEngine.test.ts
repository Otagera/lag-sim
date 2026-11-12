import { describe, expect, it, vi, afterEach } from 'vitest'
import { STARTING_STATE } from '../../data/startingState'
import type { GameState, NPCState } from '../../state/types'
import { resolveEvent, ALL_EVENTS } from '../eventEngine'
import { tick } from '../gameLoop'
import {
  addFashemuOpinion,
  applyActorImpact,
  decayLedger,
  deckTierOf,
  makeEntry,
  seedActivation,
  tierOf,
  topReasons,
} from '../opinionEngine'

function clone(s: GameState): GameState {
  return JSON.parse(JSON.stringify(s))
}

function withActiveJournalist(): GameState {
  const s = clone(STARTING_STATE)
  s.activeNPCs.npc1 = {
    isActive: true,
    relationship: 0,
    ledger: [],
    pressure: 0,
    archetypeKey: 'journalist',
    name: 'Barr. Test',
  }
  return s
}

describe('opinion tiers', () => {
  it('maps relationship to hostile / wary / cordial / allied', () => {
    expect(tierOf(-31)).toBe('hostile')
    expect(tierOf(-30)).toBe('wary')
    expect(tierOf(0)).toBe('wary')
    expect(tierOf(10)).toBe('cordial')
    expect(tierOf(40)).toBe('allied')
  })

  it('a fresh NPC at 0 is not hostile (old bug: everyone started hostile)', () => {
    expect(tierOf(0)).not.toBe('hostile')
    expect(deckTierOf(0)).toBe('neutral')
  })
})

describe('ledger decay', () => {
  it('fast entries fade ~25% over 8 weeks, slow ~25% over 26, permanent never', () => {
    let ledger = [
      makeEntry('ignored-them', -20, 1), // fast
      makeEntry('defied-them', -20, 1), // slow
      makeEntry('sent-the-police', -20, 1), // permanent
    ]
    for (let w = 0; w < 8; w++) ledger = decayLedger(ledger)
    expect(ledger[0].value).toBeCloseTo(-15, 1)
    expect(ledger[1].value).toBeGreaterThan(-20)
    expect(ledger[1].value).toBeLessThan(-18)
    expect(ledger[2].value).toBe(-20)
  })

  it('forgets entries once they fade below 0.5', () => {
    let ledger = [makeEntry('gave-them-a-hearing', 1, 1)]
    for (let w = 0; w < 40; w++) ledger = decayLedger(ledger)
    expect(ledger).toHaveLength(0)
  })

  it('returns the same array when nothing decays (no needless state churn)', () => {
    const ledger = [makeEntry('sent-the-police', -20, 1)]
    expect(decayLedger(ledger)).toBe(ledger)
  })
})

describe('applyActorImpact', () => {
  it('appends a reasoned entry and derives relationship from the ledger', () => {
    const s = applyActorImpact(
      withActiveJournalist(),
      [{ actor: 'journalist', reason: 'cooperated-openly', value: 15 }],
      'LAHA Inquiry',
    )
    const npc = s.activeNPCs.npc1
    expect(npc.ledger).toHaveLength(1)
    expect(npc.ledger[0]).toMatchObject({
      reason: 'cooperated-openly',
      value: 15,
      decay: 'slow',
      source: 'LAHA Inquiry',
    })
    expect(npc.relationship).toBe(15)
  })

  it('ignores impacts for archetypes not in any slot', () => {
    const s = withActiveJournalist()
    expect(applyActorImpact(s, [{ actor: 'business-mogul', reason: 'defied-them', value: -10 }])).toBe(
      s,
    )
  })

  it('clamps derived relationship to −100..100', () => {
    let s = withActiveJournalist()
    for (let i = 0; i < 6; i++)
      s = applyActorImpact(s, [{ actor: 'journalist', reason: 'sent-the-police', value: -30 }])
    expect(s.activeNPCs.npc1.relationship).toBe(-100)
  })
})

describe('activation and weekly tick', () => {
  afterEach(() => vi.restoreAllMocks())

  it('seeds a newly activated NPC with the reason they turned up', () => {
    const npc: NPCState = { ...withActiveJournalist().activeNPCs.npc1 }
    const seeded = seedActivation(npc, 12)
    expect(seeded.ledger[0].reason).toBe('act-smells-corruption')
    expect(tierOf(seeded.relationship)).toBe('hostile')
  })

  it('activation grievance fades to wary within about half a year if not reinforced', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    let s = withActiveJournalist()
    s.activeNPCs.npc1 = seedActivation(s.activeNPCs.npc1, 1)
    for (let w = 0; w < 26; w++) s = tick(s)
    expect(tierOf(s.activeNPCs.npc1.relationship)).toBe('wary')
  })
})

describe('Fashemu ledger', () => {
  it('keeps his 0..100 scale starting at 50', () => {
    const s = addFashemuOpinion(clone(STARTING_STATE), 'refused-him', -20, 'Contract ask')
    expect(s.fashemuRelationship).toBe(30)
    expect(s.fashemuLedger[0]).toMatchObject({ reason: 'refused-him', source: 'Contract ask' })
  })
})

describe('event resolution writes reasons with the card as source', () => {
  it('npc deck choice records its reason and source title', () => {
    const event = ALL_EVENTS.find((e) => e.id === 'npc-journalist-procurement-expose')
    expect(event).toBeDefined()
    if (!event) return
    const s = resolveEvent(withActiveJournalist(), event, 'full-disclosure')
    const entry = s.activeNPCs.npc1.ledger.at(-1)
    expect(entry?.reason).toBe('cooperated-openly')
    expect(entry?.source).toBe(event.title)
  })

  it('topReasons orders by current strength', () => {
    const ledger = [makeEntry('ignored-them', -3, 1), makeEntry('sent-the-police', -20, 1)]
    expect(topReasons(ledger, 1)[0].reason).toBe('sent-the-police')
  })
})
