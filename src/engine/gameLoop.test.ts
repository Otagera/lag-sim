import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { STARTING_STATE } from '../data/startingState'
import type { GameState } from '../state/types'
import { tick } from './gameLoop'

function clone(s: GameState): GameState {
  return JSON.parse(JSON.stringify(s))
}

describe('bankruptcy tracking', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  function withCash(state: GameState, amount: number): GameState {
    return {
      ...state,
      stats: { ...state.stats, cashReserve: amount },
      consecutiveBankruptWeeks: 0,
    }
  }

  it('increments counter when cashReserve goes negative', () => {
    const state = withCash(clone(STARTING_STATE), -5)
    const result = tick(state)
    expect(result.consecutiveBankruptWeeks).toBe(1)
    expect(result.isGameOver).toBe(false)
  })

  it('resets counter when cashReserve is positive', () => {
    const state = { ...clone(STARTING_STATE), consecutiveBankruptWeeks: 2 }
    const result = tick(state)
    expect(result.consecutiveBankruptWeeks).toBe(0)
    expect(result.isGameOver).toBe(false)
  })

  it('triggers game over after 3 consecutive negative weeks', () => {
    const state = withCash(clone(STARTING_STATE), -5)
    state.consecutiveBankruptWeeks = 2
    const result = tick(state)
    expect(result.consecutiveBankruptWeeks).toBe(3)
    expect(result.isGameOver).toBe(true)
    expect(result.gameOverReason).toMatch(/Bankruptcy/i)
  })

  it('triggers game over after explicit 3-week run', () => {
    const state = withCash(clone(STARTING_STATE), -5)
    let s = state
    for (let i = 0; i < 3; i++) {
      s = tick(s)
      if (i < 2) {
        expect(s.isGameOver).toBe(false)
        expect(s.consecutiveBankruptWeeks).toBe(i + 1)
      }
    }
    expect(s.isGameOver).toBe(true)
    expect(s.gameOverReason).toMatch(/Bankruptcy/i)
  })

  it('does not trigger game over on first negative week', () => {
    const state = withCash(clone(STARTING_STATE), -5)
    const result = tick(state)
    expect(result.consecutiveBankruptWeeks).toBe(1)
    expect(result.isGameOver).toBe(false)
  })
})
