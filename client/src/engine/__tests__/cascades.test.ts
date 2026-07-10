import { describe, it, expect, vi, afterEach } from 'vitest'
import { STARTING_STATE } from '../../data/startingState'
import type { GameState } from '../../state/types'
import { tick } from '../gameLoop'
import { drawNextEvent, ALL_EVENTS } from '../eventEngine'

function clone(s: GameState): GameState {
  return JSON.parse(JSON.stringify(s))
}

describe('cascade: International Funding Freeze', () => {
  afterEach(() => vi.restoreAllMocks())

  it('highCorruptionWeeks increments when corruptionPressure > 75', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const state = clone({ ...STARTING_STATE, stats: { ...STARTING_STATE.stats, corruptionPressure: 76 } })
    const result = tick(state)
    expect(result.highCorruptionWeeks).toBe(1)
  })

  it('highCorruptionWeeks resets when corruptionPressure drops below 75', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const state = clone({
      ...STARTING_STATE,
      highCorruptionWeeks: 2,
      stats: { ...STARTING_STATE.stats, corruptionPressure: 40 },
    })
    const result = tick(state)
    expect(result.highCorruptionWeeks).toBe(0)
  })

  it('grantFreezeDuration set to 8 on third consecutive high-corruption week', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    // Already at streak 2; this tick pushes to 3
    const state = clone({
      ...STARTING_STATE,
      highCorruptionWeeks: 2,
      grantFreezeDuration: 0,
      stats: { ...STARTING_STATE.stats, corruptionPressure: 76 },
    })
    const result = tick(state)
    expect(result.highCorruptionWeeks).toBe(3)
    // Triggered and immediately decremented: 8 - 1 = 7
    expect(result.grantFreezeDuration).toBe(7)
  })

  it('freeze is not re-triggered while grantFreezeDuration > 0', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const state = clone({
      ...STARTING_STATE,
      highCorruptionWeeks: 2,
      grantFreezeDuration: 5,
      stats: { ...STARTING_STATE.stats, corruptionPressure: 76 },
    })
    const result = tick(state)
    // Would trigger again (streak = 3) but freeze already active — should just decrement
    expect(result.grantFreezeDuration).toBe(4)
  })

  it('grantFreezeDuration decrements each week', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const state = clone({
      ...STARTING_STATE,
      grantFreezeDuration: 4,
      stats: { ...STARTING_STATE.stats, corruptionPressure: 30 },
    })
    const result = tick(state)
    expect(result.grantFreezeDuration).toBe(3)
  })

  it('grants are zero in revenue when grantFreezeDuration > 0', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    // Normal week — grants should be non-zero
    const normalState = clone({ ...STARTING_STATE, grantFreezeDuration: 0 })
    const normalResult = tick(normalState)

    // Freeze active — grants should be zero (so less total revenue → lower cashReserve increase)
    const frozenState = clone({ ...STARTING_STATE, grantFreezeDuration: 3 })
    const frozenResult = tick(frozenState)

    // The cash difference reflects the missing grants
    expect(frozenResult.stats.cashReserve).toBeLessThan(normalResult.stats.cashReserve)
  })

  it('freeze adds a timeline entry when triggered', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const state = clone({
      ...STARTING_STATE,
      highCorruptionWeeks: 2,
      grantFreezeDuration: 0,
      stats: { ...STARTING_STATE.stats, corruptionPressure: 76 },
    })
    const result = tick(state)
    const entry = result.timeline.find((e) => e.title === 'International Funding Freeze')
    expect(entry).toBeDefined()
  })
})

describe('cascade: riot mode', () => {
  afterEach(() => vi.restoreAllMocks())

  it('riotModeActive becomes true when youthTension > 70', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const state = clone({
      ...STARTING_STATE,
      riotModeActive: false,
      stats: { ...STARTING_STATE.stats, youthTension: 71 },
    })
    const result = tick(state)
    expect(result.riotModeActive).toBe(true)
  })

  it('riotModeActive becomes false when youthTension drops to 70 or below', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const state = clone({
      ...STARTING_STATE,
      riotModeActive: true,
      stats: { ...STARTING_STATE.stats, youthTension: 65 },
    })
    const result = tick(state)
    expect(result.riotModeActive).toBe(false)
  })

  it('riot alert appears in timeline when riot mode activates', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const state = clone({
      ...STARTING_STATE,
      riotModeActive: false,
      stats: { ...STARTING_STATE.stats, youthTension: 75 },
    })
    const result = tick(state)
    expect(result.timeline.some((e) => e.title === 'Riot Alert')).toBe(true)
  })

  it('crisis resolved appears in timeline when riot mode deactivates', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const state = clone({
      ...STARTING_STATE,
      riotModeActive: true,
      stats: { ...STARTING_STATE.stats, youthTension: 50 },
    })
    const result = tick(state)
    expect(result.timeline.some((e) => e.title === 'Crisis Resolved')).toBe(true)
  })

  it('drawNextEvent returns only riot events when riotModeActive', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const state = clone({
      ...STARTING_STATE,
      riotModeActive: true,
      activeEvent: null,
      eventsResolvedThisWeek: 0,
    })
    // Draw many times; all should be riot category
    for (let i = 0; i < 20; i++) {
      const drawn = drawNextEvent(state)
      if (drawn) {
        expect(drawn.category).toBe('riot')
      }
    }
  })

  it('drawNextEvent never returns riot events in normal mode', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const state = clone({
      ...STARTING_STATE,
      riotModeActive: false,
      activeEvent: null,
      eventsResolvedThisWeek: 0,
    })
    for (let i = 0; i < 50; i++) {
      const drawn = drawNextEvent(state)
      if (drawn) {
        expect(drawn.category).not.toBe('riot')
      }
    }
  })

  it('all riot events are in ALL_EVENTS', () => {
    const riotPool = ALL_EVENTS.filter((e) => e.category === 'riot')
    expect(riotPool.length).toBe(7)
    const ids = riotPool.map((e) => e.id)
    expect(ids).toContain('riot-curfew-order')
    expect(ids).toContain('riot-security-surge')
    expect(ids).toContain('riot-youth-leader-parley')
    expect(ids).toContain('riot-luc-market-lockdown')
    expect(ids).toContain('riot-sars-successor-unit')
    expect(ids).toContain('riot-sanitation-death')
    expect(ids).toContain('riot-water-bill-boycott')
  })

  it('riot events have isRecurring true', () => {
    const riotPool = ALL_EVENTS.filter((e) => e.category === 'riot')
    for (const e of riotPool) {
      expect(e.isRecurring).toBe(true)
    }
  })
})
