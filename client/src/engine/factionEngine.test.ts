import { describe, it, expect } from 'vitest'
import { STARTING_STATE } from '../data/startingState'
import { applyFactionDelta, applyFactionDeltaState, drift } from './factionEngine'

describe('applyFactionDelta', () => {
  it('adds positive delta to a faction', () => {
    const result = applyFactionDelta(STARTING_STATE.factions, { businessCommunity: 10 })
    expect(result.businessCommunity).toBe(65)
  })

  it('subtracts negative delta from a faction', () => {
    const result = applyFactionDelta(STARTING_STATE.factions, { partyGodfathers: -20 })
    expect(result.partyGodfathers).toBe(45)
  })

  it('clamps factions to 0–100', () => {
    const result = applyFactionDelta(STARTING_STATE.factions, { businessCommunity: 200 })
    expect(result.businessCommunity).toBe(100)
    const result2 = applyFactionDelta(STARTING_STATE.factions, { businessCommunity: -200 })
    expect(result2.businessCommunity).toBe(0)
  })

  it('applies multiple faction changes at once', () => {
    const result = applyFactionDelta(STARTING_STATE.factions, {
      businessCommunity: -10,
      civilSocietyMedia: 15,
      lgChairmen: -5,
    })
    expect(result.businessCommunity).toBe(45)
    expect(result.civilSocietyMedia).toBe(59)
    expect(result.lgChairmen).toBe(53)
  })

  it('skips undefined values in delta', () => {
    const result = applyFactionDelta(STARTING_STATE.factions, {
      businessCommunity: 10,
      federalGovt: undefined,
    })
    expect(result.businessCommunity).toBe(65)
    expect(result.federalGovt).toBe(STARTING_STATE.factions.federalGovt)
  })

  it('does not mutate input factions', () => {
    const original = { ...STARTING_STATE.factions }
    applyFactionDelta(STARTING_STATE.factions, { businessCommunity: 50 })
    expect(STARTING_STATE.factions).toEqual(original)
  })
})

describe('applyFactionDeltaState', () => {
  it('returns full GameState with updated factions', () => {
    const result = applyFactionDeltaState(STARTING_STATE, { businessCommunity: -10 })
    expect(result.factions.businessCommunity).toBe(45)
    expect(result.week).toBe(STARTING_STATE.week)
  })
})

describe('drift', () => {
  it('returns -2 for factions above 50', () => {
    const factions = { ...STARTING_STATE.factions, businessCommunity: 70, informalEconomy: 80 }
    const result = drift(factions)
    expect(result.businessCommunity).toBe(-2)
    expect(result.informalEconomy).toBe(-2)
  })

  it('returns +2 for factions below 50', () => {
    const factions = { ...STARTING_STATE.factions, federalGovt: 30, lgChairmen: 20 }
    const result = drift(factions)
    expect(result.federalGovt).toBe(2)
    expect(result.lgChairmen).toBe(2)
  })

  it('does not drift partyGodfathers', () => {
    const factions = { ...STARTING_STATE.factions, partyGodfathers: 80 }
    const result = drift(factions)
    expect(result.partyGodfathers).toBeUndefined()
  })

  it('returns no delta for factions at exactly 50', () => {
    const factions = { ...STARTING_STATE.factions, businessCommunity: 50, federalGovt: 50 }
    const result = drift(factions)
    expect(result.businessCommunity).toBeUndefined()
    expect(result.federalGovt).toBeUndefined()
  })

  it('does not mutate the input factions object', () => {
    const original = { ...STARTING_STATE.factions }
    drift(STARTING_STATE.factions)
    expect(STARTING_STATE.factions).toEqual(original)
  })
})
