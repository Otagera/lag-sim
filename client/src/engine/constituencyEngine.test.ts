import { describe, it, expect } from 'vitest'
import { STARTING_STATE } from '../data/startingState'
import { applyConstituencyImpact } from './constituencyEngine'

describe('applyConstituencyImpact', () => {
  it('adds positive delta to approval', () => {
    const result = applyConstituencyImpact(STARTING_STATE, { lagosMainland: 10 })
    expect(result.constituencyApproval.lagosMainland).toBe(40)
  })

  it('subtracts negative delta from approval', () => {
    const result = applyConstituencyImpact(STARTING_STATE, { lagosIsland: -15 })
    expect(result.constituencyApproval.lagosIsland).toBe(45)
  })

  it('clamps approval to 0–100', () => {
    const result = applyConstituencyImpact(STARTING_STATE, { lagosMainland: 200 })
    expect(result.constituencyApproval.lagosMainland).toBe(100)
    const result2 = applyConstituencyImpact(STARTING_STATE, { lagosMainland: -200 })
    expect(result2.constituencyApproval.lagosMainland).toBe(0)
  })

  it('applies multiple constituency changes at once', () => {
    const result = applyConstituencyImpact(STARTING_STATE, {
      ibejuLekki: -5,
      alimosho: 10,
      ikorodu: -3,
    })
    expect(result.constituencyApproval.ibejuLekki).toBe(50)
    expect(result.constituencyApproval.alimosho).toBe(48)
    expect(result.constituencyApproval.ikorodu).toBe(37)
  })

  it('skips undefined values in impact', () => {
    const result = applyConstituencyImpact(STARTING_STATE, {
      lagosMainland: 5,
      surulere: undefined,
    })
    expect(result.constituencyApproval.lagosMainland).toBe(35)
    expect(result.constituencyApproval.surulere).toBe(STARTING_STATE.constituencyApproval.surulere)
  })

  it('does not mutate input state', () => {
    const original = { ...STARTING_STATE.constituencyApproval }
    applyConstituencyImpact(STARTING_STATE, { lagosMainland: 50 })
    expect(STARTING_STATE.constituencyApproval).toEqual(original)
  })

  it('returns full GameState with only constituencyApproval changed', () => {
    const result = applyConstituencyImpact(STARTING_STATE, { lagosMainland: 10 })
    expect(result.week).toBe(STARTING_STATE.week)
    expect(result.stats).toBe(STARTING_STATE.stats)
    expect(result.constituencyApproval.lagosMainland).not.toBe(STARTING_STATE.constituencyApproval.lagosMainland)
  })
})
