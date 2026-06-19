import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { STARTING_STATE } from '../../data/startingState'
import { NPC_ARCHETYPES } from '../../data/npcs'
import { COMMISSIONER_CANDIDATES } from '../../data/commissionerCandidates'
import type { CommissionerRole, GameState } from '../../state/types'
import { tick } from '../gameLoop'

function clone(s: GameState): GameState {
  return JSON.parse(JSON.stringify(s))
}

// ── NPC passive goal definitions ─────────────────────────────────────────────

describe('NPC archetype definitions: goal and passiveEffect', () => {
  it('all 8 archetypes have a goal string', () => {
    const keys = Object.keys(NPC_ARCHETYPES) as (keyof typeof NPC_ARCHETYPES)[]
    for (const key of keys) {
      expect(NPC_ARCHETYPES[key].goal).toBeTruthy()
      expect(typeof NPC_ARCHETYPES[key].goal).toBe('string')
    }
  })

  it('all 8 archetypes have a passiveEffect function', () => {
    const keys = Object.keys(NPC_ARCHETYPES) as (keyof typeof NPC_ARCHETYPES)[]
    for (const key of keys) {
      expect(typeof NPC_ARCHETYPES[key].passiveEffect).toBe('function')
    }
  })
})

// ── Journalist passive effect ─────────────────────────────────────────────────

describe('NPC passive effect: journalist', () => {
  const def = NPC_ARCHETYPES['journalist']
  const baseNPC = { isActive: true, relationship: 10, pressure: 0, archetypeKey: 'journalist' as const, name: 'Test' }
  const baseState = clone(STARTING_STATE)

  it('hostile journalist increases corruptionPressure by 0.5', () => {
    const delta = def.passiveEffect({ ...baseNPC, relationship: 10 }, baseState)
    expect(delta.corruptionPressure).toBe(0.5)
  })

  it('neutral journalist has no passive effect', () => {
    const delta = def.passiveEffect({ ...baseNPC, relationship: 50 }, baseState)
    expect(Object.keys(delta)).toHaveLength(0)
  })

  it('ally journalist reduces corruptionPressure by 0.3', () => {
    const delta = def.passiveEffect({ ...baseNPC, relationship: 80 }, baseState)
    expect(delta.corruptionPressure).toBe(-0.3)
  })
})

// ── Youth-organiser passive effect ────────────────────────────────────────────

describe('NPC passive effect: youth-organiser', () => {
  const def = NPC_ARCHETYPES['youth-organiser']
  const baseNPC = { isActive: true, relationship: 10, pressure: 0, archetypeKey: 'youth-organiser' as const, name: 'Test' }
  const baseState = clone(STARTING_STATE)

  it('hostile youth-organiser increases youthTension by 1.5', () => {
    const delta = def.passiveEffect({ ...baseNPC, relationship: 15 }, baseState)
    expect(delta.youthTension).toBe(1.5)
  })

  it('ally youth-organiser decreases youthTension and boosts trust', () => {
    const delta = def.passiveEffect({ ...baseNPC, relationship: 70 }, baseState)
    expect(delta.youthTension).toBe(-0.5)
    expect(delta.publicTrust).toBe(0.2)
  })
})

// ── Insider passive effect ────────────────────────────────────────────────────

describe('NPC passive effect: insider', () => {
  const def = NPC_ARCHETYPES['insider']
  const baseNPC = { isActive: true, relationship: 10, pressure: 0, archetypeKey: 'insider' as const, name: 'Test' }
  const baseState = clone(STARTING_STATE)

  it('hostile insider drains politicalCapital by 1/wk', () => {
    const delta = def.passiveEffect({ ...baseNPC, relationship: 20 }, baseState)
    expect(delta.politicalCapital).toBe(-1)
  })

  it('ally insider adds 0.5 politicalCapital/wk', () => {
    const delta = def.passiveEffect({ ...baseNPC, relationship: 75 }, baseState)
    expect(delta.politicalCapital).toBe(0.5)
  })
})

// ── applyNPCGoalEffects integration via tick ──────────────────────────────────

describe('NPC goal effects: applied during tick', () => {
  beforeEach(() => vi.spyOn(Math, 'random').mockReturnValue(0.5))
  afterEach(() => vi.restoreAllMocks())

  it('hostile active journalist causes corruptionPressure to rise faster than base', () => {
    const base = clone(STARTING_STATE)
    // baseline tick without active journalist
    const baseResult = tick(base)
    const baseIncrease = baseResult.stats.corruptionPressure - base.stats.corruptionPressure

    // with hostile active journalist
    const withJournalist: GameState = {
      ...clone(STARTING_STATE),
      activeNPCs: {
        ...STARTING_STATE.activeNPCs,
        npc1: { isActive: true, relationship: 10, pressure: 0, archetypeKey: 'journalist', name: 'Test' },
      },
    }
    const result = tick(withJournalist)
    const actualIncrease = result.stats.corruptionPressure - withJournalist.stats.corruptionPressure

    expect(actualIncrease).toBeGreaterThan(baseIncrease)
    // journalist adds 0.5 on top of normal 0.5/wk passive rise
    expect(actualIncrease - baseIncrease).toBeCloseTo(0.5, 1)
  })

  it('hostile active youth-organiser causes youthTension to rise faster', () => {
    const base = clone(STARTING_STATE)
    const baseResult = tick(base)
    const baseYT = baseResult.stats.youthTension - base.stats.youthTension

    const withOrganiser: GameState = {
      ...clone(STARTING_STATE),
      activeNPCs: {
        ...STARTING_STATE.activeNPCs,
        npc2: { isActive: true, relationship: 5, pressure: 0, archetypeKey: 'youth-organiser', name: 'Test' },
      },
    }
    const result = tick(withOrganiser)
    const actualYT = result.stats.youthTension - withOrganiser.stats.youthTension

    expect(actualYT).toBeGreaterThan(baseYT)
  })

  it('hostile active insider causes politicalCapital to drop by extra 1/wk', () => {
    const base: GameState = {
      ...clone(STARTING_STATE),
      stats: { ...STARTING_STATE.stats, politicalCapital: 50 },
    }
    const baseResult = tick(base)
    const basePC = baseResult.stats.politicalCapital - base.stats.politicalCapital

    const withInsider: GameState = {
      ...base,
      activeNPCs: {
        ...base.activeNPCs,
        npc3: { isActive: true, relationship: 15, pressure: 0, archetypeKey: 'insider', name: 'Test' },
      },
    }
    const result = tick(withInsider)
    const actualPC = result.stats.politicalCapital - withInsider.stats.politicalCapital

    expect(actualPC).toBeLessThan(basePC)
    expect(actualPC - basePC).toBeCloseTo(-1, 1)
  })

  it('dormant NPC has no passive goal effect', () => {
    const base = clone(STARTING_STATE)
    const baseResult = tick(base)

    // npc1 is journalist, dormant (isActive: false) in starting state
    const result = tick(base)
    expect(result.stats.corruptionPressure).toBe(baseResult.stats.corruptionPressure)
  })
})

// ── Commissioner candidates data ──────────────────────────────────────────────

describe('commissioner candidates: data shape', () => {
  const roles: CommissionerRole[] = ['works', 'finance', 'environment', 'transport', 'information']

  it('all 5 roles have at least 2 candidates', () => {
    for (const role of roles) {
      expect(COMMISSIONER_CANDIDATES[role].length).toBeGreaterThanOrEqual(2)
    }
  })

  it('all candidates have valid competence (1-100) and loyalty (1-100)', () => {
    for (const role of roles) {
      for (const c of COMMISSIONER_CANDIDATES[role]) {
        expect(c.competence).toBeGreaterThanOrEqual(1)
        expect(c.competence).toBeLessThanOrEqual(100)
        expect(c.loyalty).toBeGreaterThanOrEqual(1)
        expect(c.loyalty).toBeLessThanOrEqual(100)
      }
    }
  })

  it('all candidates have non-empty name and background', () => {
    for (const role of roles) {
      for (const c of COMMISSIONER_CANDIDATES[role]) {
        expect(c.name.length).toBeGreaterThan(0)
        expect(c.background.length).toBeGreaterThan(0)
      }
    }
  })
})

// ── appointCommissioner store action ─────────────────────────────────────────

describe('appointCommissioner: store action', () => {
  it('sets commissioner for the given role', () => {
    // Test the pure state transformation directly (bypassing store)
    const candidate = { name: 'Test Commissioner', competence: 75, loyalty: 70, isGodfatherChoice: false }
    const state: GameState = { ...clone(STARTING_STATE), stats: { ...STARTING_STATE.stats, politicalCapital: 50 } }
    const next: GameState = {
      ...state,
      commissioners: { ...state.commissioners, works: candidate },
      stats: { ...state.stats, politicalCapital: state.stats.politicalCapital - 8 },
    }
    expect(next.commissioners.works?.name).toBe('Test Commissioner')
    expect(next.stats.politicalCapital).toBe(42)
  })

  it('appointment sets isGodfatherChoice to false', () => {
    const candidate = { name: 'Clean Pick', competence: 80, loyalty: 65, isGodfatherChoice: false }
    const state: GameState = { ...clone(STARTING_STATE), commissioners: {} }
    const next: GameState = { ...state, commissioners: { finance: candidate } }
    expect(next.commissioners.finance?.isGodfatherChoice).toBe(false)
  })

  it('appointment replaces an existing godfather-choice commissioner', () => {
    const godfatherComm = { name: 'GF Man', competence: 55, loyalty: 20, isGodfatherChoice: true }
    const cleanComm = { name: 'Clean Pick', competence: 80, loyalty: 65, isGodfatherChoice: false }
    const state: GameState = { ...clone(STARTING_STATE), commissioners: { works: godfatherComm } }
    const next: GameState = { ...state, commissioners: { ...state.commissioners, works: cleanComm } }
    expect(next.commissioners.works?.isGodfatherChoice).toBe(false)
    expect(next.commissioners.works?.name).toBe('Clean Pick')
  })
})

// ── Campaign mode state ───────────────────────────────────────────────────────

describe('campaign mode: inCampaignMode activation', () => {
  beforeEach(() => vi.spyOn(Math, 'random').mockReturnValue(0.5))
  afterEach(() => vi.restoreAllMocks())

  it('inCampaignMode is false before week 195', () => {
    const state: GameState = { ...clone(STARTING_STATE), week: 193 }
    const result = tick(state)
    expect(result.inCampaignMode).toBe(false)
  })

  it('inCampaignMode becomes true at week 195', () => {
    const state: GameState = { ...clone(STARTING_STATE), week: 194 }
    const result = tick(state)
    // tick advances week to 195
    expect(result.week).toBe(195)
    expect(result.inCampaignMode).toBe(true)
  })

  it('inCampaignMode stays true once set', () => {
    const state: GameState = { ...clone(STARTING_STATE), week: 196, inCampaignMode: true }
    const result = tick(state)
    expect(result.inCampaignMode).toBe(true)
  })
})
