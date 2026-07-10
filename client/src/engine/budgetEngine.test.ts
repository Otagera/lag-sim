import { describe, it, expect } from 'vitest'
import { STARTING_STATE } from '../data/startingState'
import type { GameState } from '../state/types'
import { weeklyTick } from './budgetEngine'

function withStats(overrides: Partial<typeof STARTING_STATE.stats>): GameState {
  return {
    ...STARTING_STATE,
    stats: { ...STARTING_STATE.stats, ...overrides },
  }
}

describe('weeklyTick', () => {
  it('returns a StatDelta with cashReserve delta', () => {
    const result = weeklyTick(STARTING_STATE)
    expect(result).toHaveProperty('cashReserve')
    expect(typeof result.cashReserve).toBe('number')
  })

  it('calculates net = igr - expenditure - corruptionDrag', () => {
    // Starting: igr=12.8, expenditure=11.2, corruptionPressure=28
    // corruptionDrag = 11.2 * (28/100) * 0.3 = 11.2 * 0.28 * 0.3 = 0.9408
    // net = 12.8 - 11.2 - 0.9408 = 0.6592
    const result = weeklyTick(STARTING_STATE)
    expect(result.cashReserve).toBeCloseTo(0.6592, 4)
  })

  it('increases corruption drag when corruptionPressure is higher', () => {
    const highCorruption = withStats({ corruptionPressure: 60 })
    const lowCorruption = withStats({ corruptionPressure: 15 })

    const high = weeklyTick(highCorruption)
    const low = weeklyTick(lowCorruption)

    // corruptionDrag = expenditure * (corruptionPressure/100) * 0.3
    // Higher corruption = higher drag = lower net
    expect(high.cashReserve).toBeLessThan(low.cashReserve!)
  })

  it('corruption drag is zero when corruptionPressure is 0 (floor 15 is enforced in applyDelta, but engine reads raw state)', () => {
    // budgetEngine reads raw corruptionPressure from state.stats
    // The 15 floor is only enforced in applyDelta, not in weeklyTick
    const zeroCorruption = withStats({ corruptionPressure: 0 })
    const result = weeklyTick(zeroCorruption)
    // corruptionDrag = 11.2 * (0/100) * 0.3 = 0
    // net = 12.8 - 11.2 - 0 = 1.6
    expect(result.cashReserve).toBeCloseTo(1.6, 4)
  })

  it('is a pure function — does not mutate input', () => {
    const original = { ...STARTING_STATE.stats }
    weeklyTick(STARTING_STATE)
    expect(STARTING_STATE.stats).toEqual(original)
  })

  it('produces a negative net when corruption is extremely high', () => {
    const veryHigh = withStats({ corruptionPressure: 80, igr: 5, expenditure: 10 })
    const result = weeklyTick(veryHigh)
    // corruptionDrag = 10 * (80/100) * 0.3 = 2.4
    // net = 5 - 10 - 2.4 = -7.4
    expect(result.cashReserve).toBeCloseTo(-7.4, 4)
    expect(result.cashReserve!).toBeLessThan(0)
  })

  it('returns surplus when igr > expenditure + drag', () => {
    const surplus = withStats({ igr: 20, expenditure: 5, corruptionPressure: 15 })
    const result = weeklyTick(surplus)
    // corruptionDrag = 5 * 0.15 * 0.3 = 0.225
    // net = 20 - 5 - 0.225 = 14.775
    expect(result.cashReserve).toBeCloseTo(14.775, 4)
  })

  it('only modifies cashReserve — does not affect other stats', () => {
    const result = weeklyTick(STARTING_STATE)
    const keys = Object.keys(result)
    expect(keys).toHaveLength(1)
    expect(keys[0]).toBe('cashReserve')
  })
})
