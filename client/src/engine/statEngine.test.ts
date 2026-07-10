import { describe, it, expect } from 'vitest'
import { STARTING_STATE } from '../data/startingState'
import type { GameState, StatDelta, StatKey } from '../state/types'
import { applyDelta } from './statEngine'

function clone(s: GameState): GameState {
  return JSON.parse(JSON.stringify(s))
}

describe('applyDelta', () => {
  it('adds positive delta to a stat', () => {
    const result = applyDelta(STARTING_STATE, { cashReserve: 5 })
    expect(result.stats.cashReserve).toBe(50)
  })

  it('subtracts negative delta from a stat', () => {
    const result = applyDelta(STARTING_STATE, { cashReserve: -10 })
    expect(result.stats.cashReserve).toBe(35)
  })

  it('clamps publicTrust to 0–100', () => {
    const result = applyDelta(STARTING_STATE, { publicTrust: 200 })
    expect(result.stats.publicTrust).toBe(100)
    const result2 = applyDelta(STARTING_STATE, { publicTrust: -200 })
    expect(result2.stats.publicTrust).toBe(0)
  })

  it('clamps infrastructureScore to 0–100', () => {
    const result = applyDelta(STARTING_STATE, { infrastructureScore: 200 })
    expect(result.stats.infrastructureScore).toBe(100)
    const result2 = applyDelta(STARTING_STATE, { infrastructureScore: -200 })
    expect(result2.stats.infrastructureScore).toBe(0)
  })

  it('clamps securityIndex to 0–100', () => {
    const result = applyDelta(STARTING_STATE, { securityIndex: 200 })
    expect(result.stats.securityIndex).toBe(100)
    const result2 = applyDelta(STARTING_STATE, { securityIndex: -200 })
    expect(result2.stats.securityIndex).toBe(0)
  })

  it('clamps politicalCapital to 0–200', () => {
    const result = applyDelta(STARTING_STATE, { politicalCapital: 200 })
    expect(result.stats.politicalCapital).toBe(200)
    const result2 = applyDelta(STARTING_STATE, { politicalCapital: -200 })
    expect(result2.stats.politicalCapital).toBe(0)
  })

  it('clamps corruptionPressure to 15–80', () => {
    const result = applyDelta(STARTING_STATE, { corruptionPressure: -50 })
    expect(result.stats.corruptionPressure).toBe(15)
    const result2 = applyDelta(STARTING_STATE, { corruptionPressure: 100 })
    expect(result2.stats.corruptionPressure).toBe(80)
  })

  it('clamps federalRelationship to -50–+50', () => {
    const result = applyDelta(STARTING_STATE, { federalRelationship: 100 })
    expect(result.stats.federalRelationship).toBe(50)
    const result2 = applyDelta(STARTING_STATE, { federalRelationship: -100 })
    expect(result2.stats.federalRelationship).toBe(-50)
  })

  it('clamps youthTension to 0–100', () => {
    const result = applyDelta(STARTING_STATE, { youthTension: 200 })
    expect(result.stats.youthTension).toBe(100)
    const result2 = applyDelta(STARTING_STATE, { youthTension: -200 })
    expect(result2.stats.youthTension).toBe(0)
  })

  it('allows cashReserve to go negative', () => {
    const result = applyDelta(STARTING_STATE, { cashReserve: -100 })
    expect(result.stats.cashReserve).toBe(-55)
  })

  it('clamps igr to >= 0', () => {
    const result = applyDelta(STARTING_STATE, { igr: -100 })
    expect(result.stats.igr).toBe(0)
  })

  it('clamps expenditure to >= 0', () => {
    const result = applyDelta(STARTING_STATE, { expenditure: -100 })
    expect(result.stats.expenditure).toBe(0)
  })

  it('applies multiple stat changes at once', () => {
    const result = applyDelta(STARTING_STATE, {
      publicTrust: -10,
      cashReserve: 5,
      infrastructureScore: -5,
    })
    expect(result.stats.publicTrust).toBe(44)
    expect(result.stats.cashReserve).toBe(50)
    expect(result.stats.infrastructureScore).toBe(37)
  })

  it('is a pure function — does not mutate input', () => {
    const original = clone(STARTING_STATE)
    const delta: StatDelta = { cashReserve: 10, publicTrust: -5 }
    applyDelta(original, delta)
    expect(original).toEqual(STARTING_STATE)
  })

  it('skips undefined values in delta', () => {
    const result = applyDelta(STARTING_STATE, {
      cashReserve: 5,
      publicTrust: undefined,
    })
    expect(result.stats.cashReserve).toBe(50)
    expect(result.stats.publicTrust).toBe(STARTING_STATE.stats.publicTrust)
  })

  it('returns a new object — not the same reference', () => {
    const result = applyDelta(STARTING_STATE, { cashReserve: 0 })
    expect(result).not.toBe(STARTING_STATE)
    expect(result.stats).not.toBe(STARTING_STATE.stats)
  })

  it('bounds are checked for all stat keys', () => {
    const boundStats: { key: StatKey; min: number; max: number }[] = [
      { key: 'publicTrust', min: 0, max: 100 },
      { key: 'infrastructureScore', min: 0, max: 100 },
      { key: 'securityIndex', min: 0, max: 100 },
      { key: 'politicalCapital', min: 0, max: 200 },
      { key: 'corruptionPressure', min: 15, max: 80 },
      { key: 'federalRelationship', min: -50, max: 50 },
      { key: 'youthTension', min: 0, max: 100 },
      { key: 'igr', min: 0, max: Infinity },
      { key: 'expenditure', min: 0, max: Infinity },
    ]

    for (const { key, min, max } of boundStats) {
      const lower = applyDelta(STARTING_STATE, { [key]: -1e6 })
      expect(lower.stats[key], `${key} should be >= ${min}`).toBeGreaterThanOrEqual(min)

      const upper = max === Infinity
        ? applyDelta(STARTING_STATE, { [key]: 1e6 })
        : applyDelta(STARTING_STATE, { [key]: 1e6 })
      expect(upper.stats[key], `${key} should be <= ${max}`).toBeLessThanOrEqual(max)
    }
  })
})
