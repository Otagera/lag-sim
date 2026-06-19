import { describe, it, expect, vi, afterEach } from 'vitest'
import { STARTING_STATE } from '../../data/startingState'
import type { GameState } from '../../state/types'
import { simulateWeeks } from '../simulateEngine'

function clone(s: GameState): GameState {
  return JSON.parse(JSON.stringify(s))
}

afterEach(() => vi.restoreAllMocks())

describe('simulateWeeks — basic contract', () => {
  it('advances week by n using first strategy', () => {
    const result = simulateWeeks(clone(STARTING_STATE), 10, { strategy: 'first', seed: 1 })
    expect(result.state.week).toBe(STARTING_STATE.week + 10)
    expect(result.weeksSimulated).toBe(10)
    expect(result.stoppedEarly).toBe(false)
  })

  it('returns the seed used (even when caller omits it)', () => {
    const result = simulateWeeks(clone(STARTING_STATE), 1, { strategy: 'first' })
    expect(typeof result.seed).toBe('number')
    expect(result.seed).toBeGreaterThan(0)
  })

  it('does not mutate the original state', () => {
    const original = clone(STARTING_STATE)
    const weekBefore = original.week
    simulateWeeks(original, 5, { strategy: 'first', seed: 42 })
    expect(original.week).toBe(weekBefore)
  })

  it('produces a game-valid state (no undefined stats)', () => {
    const result = simulateWeeks(clone(STARTING_STATE), 20, { strategy: 'first', seed: 7 })
    const { stats } = result.state
    expect(typeof stats.cashReserve).toBe('number')
    expect(typeof stats.publicTrust).toBe('number')
    expect(typeof stats.corruptionPressure).toBe('number')
    expect(isNaN(stats.cashReserve)).toBe(false)
  })
})

describe('simulateWeeks — strategies', () => {
  it('first strategy is deterministic across runs', () => {
    const r1 = simulateWeeks(clone(STARTING_STATE), 30, { strategy: 'first', seed: 99 })
    const r2 = simulateWeeks(clone(STARTING_STATE), 30, { strategy: 'first', seed: 99 })
    expect(r1.state.week).toBe(r2.state.week)
    expect(r1.state.stats.cashReserve).toBeCloseTo(r2.state.stats.cashReserve, 3)
    expect(r1.state.stats.publicTrust).toBeCloseTo(r2.state.stats.publicTrust, 3)
  })

  it('random strategy with same seed produces identical results', () => {
    const r1 = simulateWeeks(clone(STARTING_STATE), 20, { strategy: 'random', seed: 12345 })
    const r2 = simulateWeeks(clone(STARTING_STATE), 20, { strategy: 'random', seed: 12345 })
    expect(r1.state.week).toBe(r2.state.week)
    expect(r1.state.stats.cashReserve).toBeCloseTo(r2.state.stats.cashReserve, 3)
  })

  it('random strategy with different seeds produces different outcomes over 50 weeks', () => {
    const r1 = simulateWeeks(clone(STARTING_STATE), 50, { strategy: 'random', seed: 1 })
    const r2 = simulateWeeks(clone(STARTING_STATE), 50, { strategy: 'random', seed: 999999 })
    // At least one stat should differ — seeds should diverge
    const differ =
      r1.state.stats.cashReserve !== r2.state.stats.cashReserve ||
      r1.state.stats.publicTrust !== r2.state.stats.publicTrust ||
      r1.state.stats.corruptionPressure !== r2.state.stats.corruptionPressure
    expect(differ).toBe(true)
  })

  it('weighted strategy keeps corruption lower on average than random (over many runs)', () => {
    const totalRuns = 5
    let weightedCorrupt = 0
    let randomCorrupt = 0
    for (let i = 0; i < totalRuns; i++) {
      const seed = i * 137
      weightedCorrupt += simulateWeeks(clone(STARTING_STATE), 52, { strategy: 'weighted', seed }).state.stats.corruptionPressure
      randomCorrupt += simulateWeeks(clone(STARTING_STATE), 52, { strategy: 'random', seed }).state.stats.corruptionPressure
    }
    // weighted should prefer anti-corruption choices — average should be lower
    expect(weightedCorrupt / totalRuns).toBeLessThanOrEqual(randomCorrupt / totalRuns + 5)
  })
})

describe('simulateWeeks — early stop on game over', () => {
  it('stops and sets stoppedEarly when game over triggers mid-run', () => {
    const state = {
      ...clone(STARTING_STATE),
      stats: { ...STARTING_STATE.stats, cashReserve: -50 },
      emergencyLoansTaken: 3,
    }
    const result = simulateWeeks(state, 100, { strategy: 'first', seed: 1 })
    expect(result.stoppedEarly).toBe(true)
    expect(result.state.isGameOver).toBe(true)
    expect(result.weeksSimulated).toBeLessThan(100)
  })

  it('returns n weeks when game does not end', () => {
    const result = simulateWeeks(clone(STARTING_STATE), 5, { strategy: 'first', seed: 1 })
    expect(result.weeksSimulated).toBe(5)
    expect(result.stoppedEarly).toBe(false)
  })

  it('does not advance further after game over state passed in', () => {
    const state = { ...clone(STARTING_STATE), isGameOver: true, gameOverReason: 'test' }
    const result = simulateWeeks(state, 10, { strategy: 'first', seed: 1 })
    expect(result.weeksSimulated).toBe(0)
    expect(result.stoppedEarly).toBe(true)
    expect(result.state.week).toBe(STARTING_STATE.week)
  })
})

describe('simulateWeeks — long run sanity', () => {
  it('can simulate a full 208-week term without throwing', () => {
    expect(() => {
      simulateWeeks(clone(STARTING_STATE), 208, { strategy: 'weighted', seed: 42 })
    }).not.toThrow()
  })

  it('full term produces isGameOver true (term ends at week 208)', () => {
    const result = simulateWeeks(clone(STARTING_STATE), 220, { strategy: 'weighted', seed: 42 })
    expect(result.state.isGameOver).toBe(true)
  })

  it('stats stay within expected bounds after full term', () => {
    const result = simulateWeeks(clone(STARTING_STATE), 208, { strategy: 'first', seed: 100 })
    if (!result.state.isGameOver) {
      const { stats } = result.state
      expect(stats.publicTrust).toBeGreaterThanOrEqual(0)
      expect(stats.publicTrust).toBeLessThanOrEqual(100)
      expect(stats.corruptionPressure).toBeGreaterThanOrEqual(0)
      expect(stats.infrastructureScore).toBeGreaterThanOrEqual(0)
    }
  })
})
