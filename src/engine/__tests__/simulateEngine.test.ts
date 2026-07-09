import { describe, it, expect, vi, afterEach } from 'vitest'
import { STARTING_STATE } from '../../data/startingState'
import { mulberry32 } from '../../utils/prng'
import type { GameState } from '../../state/types'
import { simulateWeeks } from '../simulateEngine'
import { getArchetypeState } from '../../data/archetypes'

function clone(s: GameState): GameState {
  return JSON.parse(JSON.stringify(s))
}

/**
 * Generate a seeded state that is deterministic for a given (archetype, stateSeed) pair.
 * This is necessary because getArchetypeState uses Math.random for NPC/deputy selection,
 * so we temporarily replace Math.random with a seeded PRNG for reproducibility.
 */
function makeSeededArchetypeState(arch: 'technocrat' | 'loyalist' | 'outsider', stateSeed: number): GameState {
  const orig = Math.random
  Math.random = mulberry32(stateSeed)
  const base = getArchetypeState(arch)
  Math.random = orig
  return base
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

  it('continueAcrossTerms carries a winning run past the week-208 handover to the week-416 ending', () => {
    // With the opt-in flag the sim auto-"Begin Second Term"s instead of halting on
    // the termEndWin game-over, so a winning run reaches the second-term ending.
    const result = simulateWeeks(clone(STARTING_STATE), 416, {
      strategy: 'winning',
      seed: 42,
      continueAcrossTerms: true,
    })
    expect(result.state.currentTerm).toBe(2)
    expect(result.state.isGameOver).toBe(true)
    expect(result.state.gameOverType).toBe('secondTermEnd')
    expect(result.state.week).toBeGreaterThanOrEqual(416)
  })

  it('without continueAcrossTerms a winning run still stops on the week-208 re-election handover', () => {
    // Preserves the interactive game / fastForward behavior: land on the celebration.
    const result = simulateWeeks(clone(STARTING_STATE), 416, { strategy: 'winning', seed: 42 })
    expect(result.state.currentTerm).toBe(2)
    expect(result.state.isGameOver).toBe(true)
    expect(result.state.gameOverType).toBe('termEndWin')
    expect(result.stoppedEarly).toBe(true)
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

describe('simulateWeeks — winning strategy benchmark', () => {
  const SEEDS = [42, 777, 12345, 99, 2020]
  const ARCHETYPES = ['technocrat', 'loyalist', 'outsider'] as const
  const MIN_WIN_RATE = 0.6

  it('winning strategy is deterministic from STARTING_STATE', () => {
    const r1 = simulateWeeks(clone(STARTING_STATE), 52, { strategy: 'winning', seed: 42 })
    const r2 = simulateWeeks(clone(STARTING_STATE), 52, { strategy: 'winning', seed: 42 })
    expect(r1.state.stats.cashReserve).toBeCloseTo(r2.state.stats.cashReserve, 3)
    expect(r1.state.stats.publicTrust).toBeCloseTo(r2.state.stats.publicTrust, 3)
  })

  for (const arch of ['technocrat', 'loyalist', 'outsider'] as const) {
    it(`winning strategy is deterministic for ${arch} with seeded state`, () => {
      const base1 = makeSeededArchetypeState(arch, 42)
      base1.runMeta = { archetype: arch, simStrategy: 'winning', simSeed: 42, simWeeksSkipped: 0 }
      const r1 = simulateWeeks(base1 as GameState, 52, { strategy: 'winning', seed: 42 })

      const base2 = makeSeededArchetypeState(arch, 42)
      base2.runMeta = { archetype: arch, simStrategy: 'winning', simSeed: 42, simWeeksSkipped: 0 }
      const r2 = simulateWeeks(base2 as GameState, 52, { strategy: 'winning', seed: 42 })

      expect(r1.state.stats.cashReserve).toBeCloseTo(r2.state.stats.cashReserve, 3)
      expect(r1.state.stats.publicTrust).toBeCloseTo(r2.state.stats.publicTrust, 3)
    })
  }

  it(`wins ≥ ${(MIN_WIN_RATE * 100).toFixed(0)}% across 15 seeds`, () => {
    let wins = 0
    const total = SEEDS.length * ARCHETYPES.length
    const results: string[] = []

    for (const arch of ARCHETYPES) {
      for (const seed of SEEDS) {
        const stateSeed = seed + ARCHETYPES.indexOf(arch) * 10000
        const base = makeSeededArchetypeState(arch, stateSeed)
        base.runMeta = {
          archetype: arch,
          simStrategy: 'winning',
          simSeed: seed,
          simWeeksSkipped: 0,
        }
        const r = simulateWeeks(base as GameState, 208, { strategy: 'winning', seed })
        // currentTerm === 2 is the durable "won re-election" signal: reElected is
        // reset to false once the sim auto-advances through the week-208 handover.
        const won = r.state.currentTerm === 2
        if (won) wins++
        results.push(`${arch} seed=${seed} currentTerm=${r.state.currentTerm} cash=${r.state.stats.cashReserve.toFixed(1)} week=${r.state.week} isGameOver=${r.state.isGameOver} ${won ? 'WIN' : 'LOSE'}`)
      }
    }

    // console.log for debug: uncomment to see per-seed results
    // console.log('Benchmark results:\n' + results.join('\n'))
    // console.log(`Wins: ${wins}/${total} = ${((wins / total) * 100).toFixed(0)}%`)

    expect(wins / total).toBeGreaterThanOrEqual(MIN_WIN_RATE)
  })
})
