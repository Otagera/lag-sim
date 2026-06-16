import { describe, it, expect } from 'vitest'
import { STARTING_STATE } from '../data/startingState'
import { applyConstituencyImpact } from './constituencyEngine'

describe('applyConstituencyImpact', () => {
  it('adds positive delta to approval', () => {
    const result = applyConstituencyImpact(STARTING_STATE, { makoko: 10 })
    expect(result.constituencyApproval.makoko).toBe(40)
  })

  it('subtracts negative delta from approval', () => {
    const result = applyConstituencyImpact(STARTING_STATE, { lagosIsland: -15 })
    expect(result.constituencyApproval.lagosIsland).toBe(45)
  })

  it('clamps approval to 0–100', () => {
    const result = applyConstituencyImpact(STARTING_STATE, { makoko: 200 })
    expect(result.constituencyApproval.makoko).toBe(100)
    const result2 = applyConstituencyImpact(STARTING_STATE, { makoko: -200 })
    expect(result2.constituencyApproval.makoko).toBe(0)
  })

  it('applies multiple constituency changes at once', () => {
    const result = applyConstituencyImpact(STARTING_STATE, {
      lekki: -5,
      alimosho: 10,
      periphery: -3,
    })
    expect(result.constituencyApproval.lekki).toBe(50)
    expect(result.constituencyApproval.alimosho).toBe(48)
    expect(result.constituencyApproval.periphery).toBe(32)
  })

  it('skips undefined values in impact', () => {
    const result = applyConstituencyImpact(STARTING_STATE, {
      makoko: 5,
      surulere: undefined,
    })
    expect(result.constituencyApproval.makoko).toBe(35)
    expect(result.constituencyApproval.surulere).toBe(STARTING_STATE.constituencyApproval.surulere)
  })

  it('does not mutate input state', () => {
    const original = { ...STARTING_STATE.constituencyApproval }
    applyConstituencyImpact(STARTING_STATE, { makoko: 50 })
    expect(STARTING_STATE.constituencyApproval).toEqual(original)
  })

  it('returns full GameState with only constituencyApproval changed', () => {
    const result = applyConstituencyImpact(STARTING_STATE, { makoko: 10 })
    expect(result.week).toBe(STARTING_STATE.week)
    expect(result.stats).toBe(STARTING_STATE.stats)
    expect(result.constituencyApproval.makoko).not.toBe(STARTING_STATE.constituencyApproval.makoko)
  })
})
