import { describe, it, expect } from 'vitest'
import { STARTING_STATE } from '../data/startingState'
import type { GameState } from '../state/types'
import { calculateVoteShare } from './electionEngine'

function base(overrides: Partial<GameState> = {}): GameState {
  return { ...JSON.parse(JSON.stringify(STARTING_STATE)), ...overrides }
}

describe('calculateVoteShare', () => {
  it('clamps output between 20 and 80', () => {
    const perfect = base({
      constituencyApproval: {
        lagosIsland: 100, etiOsa: 100, ibejuLekki: 100, surulere: 100, amuwoOdofin: 100,
        apapa: 100, oshodiIsolo: 100, mushin: 100, shomolu: 100, kosofe: 100,
        lagosMainland: 100, ikeja: 100, alimosho: 100, agege: 100, ifakoIjaye: 100,
        badagry: 100, epe: 100, ikorodu: 100, ojo: 100, ajeromiIfelodun: 100,
      },
    })
    expect(calculateVoteShare(perfect)).toBeLessThanOrEqual(80)

    const terrible = base({
      constituencyApproval: {
        lagosIsland: 0, etiOsa: 0, ibejuLekki: 0, surulere: 0, amuwoOdofin: 0,
        apapa: 0, oshodiIsolo: 0, mushin: 0, shomolu: 0, kosofe: 0,
        lagosMainland: 0, ikeja: 0, alimosho: 0, agege: 0, ifakoIjaye: 0,
        badagry: 0, epe: 0, ikorodu: 0, ojo: 0, ajeromiIfelodun: 0,
      },
    })
    expect(calculateVoteShare(terrible)).toBeGreaterThanOrEqual(20)
  })

  describe('primaryBonus', () => {
    it('adds +10 for Scenario A (godfather-backed)', () => {
      const stateA = base({ primaryScenario: 'A' })
      const stateNone = base({ primaryScenario: null })
      expect(calculateVoteShare(stateA)).toBeGreaterThan(calculateVoteShare(stateNone))
    })

    it('subtracts 8 for Scenario B (contested)', () => {
      const stateB = base({ primaryScenario: 'B' })
      const stateNone = base({ primaryScenario: null })
      expect(calculateVoteShare(stateB)).toBeLessThan(calculateVoteShare(stateNone))
    })

    it('adds +2 for Scenario C (open primary)', () => {
      const stateC = base({ primaryScenario: 'C' })
      const stateNone = base({ primaryScenario: null })
      expect(calculateVoteShare(stateC)).toBeGreaterThan(calculateVoteShare(stateNone))
    })
  })

  describe('lgaBonus', () => {
    it('returns 0 when lgaElectionResult is null', () => {
      const noLGA = base({ lgaElectionResult: null })
      const withLGA = base({ lgaElectionResult: 50 })
      // 50% → bonus 0; null → also 0; these should match
      expect(calculateVoteShare(noLGA)).toBeCloseTo(calculateVoteShare(withLGA), 0)
    })

    it('returns +3 at 100% LGA result', () => {
      const full = base({ lgaElectionResult: 100 })
      const half = base({ lgaElectionResult: 50 })
      // Difference should be ~3
      expect(calculateVoteShare(full) - calculateVoteShare(half)).toBeCloseTo(3, 0)
    })

    it('returns -3 at 0% LGA result', () => {
      const zero = base({ lgaElectionResult: 0 })
      const half = base({ lgaElectionResult: 50 })
      expect(calculateVoteShare(half) - calculateVoteShare(zero)).toBeCloseTo(3, 0)
    })
  })

  describe('factionEndorsementBonus', () => {
    it('adds up to +7 for strong factions', () => {
      const strong = base({
        lgaElectionResult: 50,
        factions: {
          ...STARTING_STATE.factions,
          businessCommunity: 65,
          civilSocietyMedia: 65,
          lgChairmen: 70,
          informalEconomy: 65,
        },
      })
      const neutral = base({ lgaElectionResult: 50 })
      expect(calculateVoteShare(strong)).toBeGreaterThan(calculateVoteShare(neutral))
    })

    it('subtracts up to -7 for weak factions', () => {
      const weak = base({
        lgaElectionResult: 50,
        factions: {
          ...STARTING_STATE.factions,
          businessCommunity: 30,
          civilSocietyMedia: 30,
          lgChairmen: 30,
          informalEconomy: 25,
        },
      })
      const neutral = base({ lgaElectionResult: 50 })
      expect(calculateVoteShare(weak)).toBeLessThan(calculateVoteShare(neutral))
    })
  })
})
