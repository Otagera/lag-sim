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

  it('clamps factions to -100–100', () => {
    const result = applyFactionDelta(STARTING_STATE.factions, { businessCommunity: 200 })
    expect(result.businessCommunity).toBe(100)
    const result2 = applyFactionDelta(STARTING_STATE.factions, { businessCommunity: -200 })
    expect(result2.businessCommunity).toBe(-100)
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
  it('returns empty delta for now', () => {
    const result = drift()
    expect(result).toEqual({})
  })
})
