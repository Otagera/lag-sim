import { describe, it, expect, vi, beforeEach } from 'vitest'
import { STARTING_STATE } from '../data/startingState'
import type { GameState, GodfatherMessage } from '../state/types'
import { shouldDrawGodfather, drawGodfatherAsk, resolveGodfather } from './godfatherEngine'
import { generalGodfatherPool, fashemuAsks } from '../data/godfatherAsks'

function clone(s: GameState): GameState {
  return JSON.parse(JSON.stringify(s))
}

let state: GameState

beforeEach(() => {
  vi.restoreAllMocks()
  state = clone(STARTING_STATE)
})

describe('shouldDrawGodfather', () => {
  it('returns false when activeGodfatherMessage exists', () => {
    state.activeGodfatherMessage = { id: 'test' } as GodfatherMessage
    expect(shouldDrawGodfather(state)).toBe(false)
  })

  it('returns false when all asks have been used', () => {
    // Exhaust both Fashemu arc and general pool
    state.fashemuAskIndex = fashemuAsks.length
    state.usedGodfatherAskIds = generalGodfatherPool.map((a) => a.id)
    expect(shouldDrawGodfather(state)).toBe(false)
  })

  it('returns false when week < 3', () => {
    state.week = 2
    expect(shouldDrawGodfather(state)).toBe(false)
  })

  it('returns true when 8+ weeks since last godfather', () => {
    state.week = 10
    state.lastGodfatherWeek = 2
    expect(shouldDrawGodfather(state)).toBe(true)
  })

  it('returns false when fewer than 3 weeks since last godfather', () => {
    state.week = 5
    state.lastGodfatherWeek = 3
    expect(shouldDrawGodfather(state)).toBe(false)
  })

  it('escalates probability from week 3 to week 8 (mock random high then low)', () => {
    // First godfather: week 3, random < 0.25 → false with 0.5
    state.week = 3
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    expect(shouldDrawGodfather(state)).toBe(false)

    // Edge: just enough to trigger
    vi.spyOn(Math, 'random').mockReturnValue(0.1)
    expect(shouldDrawGodfather(state)).toBe(true)
  })

  it('returns false if weeksSinceLast < 3 for subsequent draws', () => {
    state.lastGodfatherWeek = 5
    vi.spyOn(Math, 'random').mockReturnValue(0.1)
    // week 6 = 1 week since, week 7 = 2 weeks since
    state.week = 6
    expect(shouldDrawGodfather(state)).toBe(false)
    state.week = 7
    expect(shouldDrawGodfather(state)).toBe(false)
  })

  it('uses escalating chance for weeks 3-7 after first draw', () => {
    // Exhaust Fashemu arc so general pool probabilistic logic kicks in
    // weeksSinceLast = 3 → chance = (3-2)*0.12 = 0.12
    state.lastGodfatherWeek = 5
    state.week = 8
    state.fashemuAskIndex = fashemuAsks.length // arc exhausted
    // weeksSinceLast = 3
    vi.spyOn(Math, 'random').mockReturnValue(0.10)
    expect(shouldDrawGodfather(state)).toBe(true)
    vi.spyOn(Math, 'random').mockReturnValue(0.14)
    expect(shouldDrawGodfather(state)).toBe(false)
  })
})

describe('drawGodfatherAsk', () => {
  it('returns a godfather message with an unused ask', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const result = drawGodfatherAsk(state)
    expect(result).not.toBeNull()
    if (result) {
      expect(result.week).toBe(state.week)
      expect(result.ask.description).toBeDefined()
      expect(result.ask.onAccept).toBeDefined()
      expect(result.ask.onRefuse).toBeDefined()
    }
  })

  it('returns null when all asks have been used', () => {
    state.fashemuAskIndex = fashemuAsks.length
    state.usedGodfatherAskIds = generalGodfatherPool.map((a) => a.id)
    expect(drawGodfatherAsk(state)).toBeNull()
  })

  it('picks different ask each call (ids differ)', () => {
    vi.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(0.5)
    const first = drawGodfatherAsk({ ...state })
    // Now mark first ask as used
    if (first) {
      const nextState = { ...state, usedGodfatherAskIds: [first.id] }
      const second = drawGodfatherAsk(nextState)
      if (second) {
        expect(second.id).not.toBe(first.id)
      }
    }
  })
})

describe('resolveGodfather', () => {
  const mockMessage: GodfatherMessage = {
    id: 'test-ask',
    week: 5,
    text: 'Do this favour',
    ask: {
      type: 'contract',
      description: 'A favour',
      onAccept: {
        corruptionPressure: 3,
        factionImpact: { partyGodfathers: 5, civilSocietyMedia: -4 },
      },
      onRefuse: {
        factionImpact: { partyGodfathers: -6 },
      },
    },
  }

  it('applies onAccept effects when accepted', () => {
    const result = resolveGodfather(state, mockMessage, true)
    expect(result.stats.corruptionPressure).toBe(31) // 28 + 3
    expect(result.factions.partyGodfathers).toBe(70) // 65 + 5
    expect(result.factions.civilSocietyMedia).toBe(40) // 44 - 4
  })

  it('applies onRefuse effects when refused', () => {
    const result = resolveGodfather(state, mockMessage, false)
    expect(result.factions.partyGodfathers).toBe(59) // 65 - 6
  })

  it('records the message in godfatherMessages', () => {
    const result = resolveGodfather(state, mockMessage, true)
    expect(result.godfatherMessages).toHaveLength(1)
    expect(result.godfatherMessages[0].id).toBe('test-ask')
  })

  it('marks ask id as used', () => {
    const result = resolveGodfather(state, mockMessage, true)
    expect(result.usedGodfatherAskIds).toContain('test-ask')
  })

  it('updates lastGodfatherWeek', () => {
    const result = resolveGodfather(state, mockMessage, true)
    expect(result.lastGodfatherWeek).toBe(1) // state.week is 1
  })

  it('clears activeGodfatherMessage', () => {
    state.activeGodfatherMessage = mockMessage
    const result = resolveGodfather(state, mockMessage, true)
    expect(result.activeGodfatherMessage).toBeNull()
  })

  it('increments godfatherRefusalCount on refusal', () => {
    const result = resolveGodfather(state, mockMessage, false)
    expect(result.godfatherRefusalCount).toBe(1)
  })

  it('does not increment godfatherRefusalCount on accept', () => {
    const result = resolveGodfather(state, mockMessage, true)
    expect(result.godfatherRefusalCount).toBe(0)
  })

  it('applies escalation at refusal count 2 (lgChairmen -8)', () => {
    state.godfatherRefusalCount = 1
    const result = resolveGodfather(state, mockMessage, false)
    expect(result.godfatherRefusalCount).toBe(2)
    expect(result.factions.lgChairmen).toBe(50) // 58 - 8
  })

  it('applies escalation at refusal count 3 (politicalCapital -15, partyGodfathers -10)', () => {
    state.godfatherRefusalCount = 2
    const result = resolveGodfather(state, mockMessage, false)
    expect(result.godfatherRefusalCount).toBe(3)
    expect(result.stats.politicalCapital).toBe(85) // 100 - 15
    // onRefuse applies partyGodfathers: -6, then escalation applies -10
    expect(result.factions.partyGodfathers).toBe(49) // 65 - 6 - 10
  })

  it('applies escalation at refusal count 4+ (federalRelationship -2, corruptionPressure +1, factions)', () => {
    state.godfatherRefusalCount = 3
    const result = resolveGodfather(state, mockMessage, false)
    expect(result.godfatherRefusalCount).toBe(4)
    expect(result.stats.federalRelationship).toBe(3) // 5 - 2
    expect(result.stats.corruptionPressure).toBe(29) // 28 + 1
    expect(result.factions.federalGovt).toBe(46) // 48 - 2
    // onRefuse applies partyGodfathers: -6, then escalation applies -5
    expect(result.factions.partyGodfathers).toBe(54) // 65 - 6 - 5
  })
})
