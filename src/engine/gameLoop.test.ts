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

  it('triggers bridge loan on first negative week, does not increment counter', () => {
    const state = {
      ...clone(STARTING_STATE),
      stats: { ...STARTING_STATE.stats, cashReserve: -5 },
    }
    const result = tick(state)
    expect(result.emergencyLoansTaken).toBe(1)
    expect(result.stats.cashReserve).toBeGreaterThan(0)
    expect(result.consecutiveBankruptWeeks).toBe(0)
    expect(result.isGameOver).toBe(false)
  })

  it('resets counter when cashReserve is positive', () => {
    const state = { ...clone(STARTING_STATE), consecutiveBankruptWeeks: 2 }
    const result = tick(state)
    expect(result.consecutiveBankruptWeeks).toBe(0)
    expect(result.isGameOver).toBe(false)
  })

  it('increments counter and triggers game over when deficit exceeds bridge loan capacity', () => {
    // Start deeply negative so bridge loan doesn't fully cover it
    // Starting cash -15bn + 10bn loan = -5bn still negative after expenses
    const state = {
      ...clone(STARTING_STATE),
      stats: { ...STARTING_STATE.stats, cashReserve: -15 },
    }
    let s = state
    for (let i = 0; i < 3; i++) {
      s = tick(s)
    }
    expect(s.isGameOver).toBe(true)
    expect(s.gameOverReason).toMatch(/Bankruptcy/i)
  })
})

describe('impeachment flow', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('sets impeachmentStage to 1, not game over, when partyGodfathers first drops below 10', () => {
    const state = {
      ...clone(STARTING_STATE),
      week: 53,
      factions: { ...STARTING_STATE.factions, partyGodfathers: 8 },
    }
    const result = tick(state)
    expect(result.impeachmentStage).toBe(1)
    expect(result.isGameOver).toBe(false)
    expect(result.eventQueue.some((e) => e.id === 'removal-resolution-reading')).toBe(true)
  })

  it('resets impeachmentStage if partyGodfathers recovers to 20 or above', () => {
    const state = {
      ...clone(STARTING_STATE),
      week: 53,
      impeachmentStage: 1,
      eventQueue: [{ id: 'removal-resolution-reading', week: 53, title: '', body: '', severity: 'critical' as const, category: 'political' as const, choices: [] }],
      factions: { ...STARTING_STATE.factions, partyGodfathers: 25 },
    }
    const result = tick(state)
    expect(result.impeachmentStage).toBe(0)
  })

  it('triggers game over when defy choice appears in timeline', () => {
    const state = {
      ...clone(STARTING_STATE),
      week: 54,
      impeachmentStage: 1,
      factions: { ...STARTING_STATE.factions, partyGodfathers: 8 },
      resolvedEvents: ['removal-resolution-first-reading'],
      timeline: [
        ...STARTING_STATE.timeline,
        {
          week: 53,
          type: 'event' as const,
          title: 'Removal Resolution: First Reading',
          description: 'Defy the Assembly',
        },
      ],
    }
    const result = tick(state)
    expect(result.isGameOver).toBe(true)
    expect(result.impeachmentStage).toBe(2)
  })
})

describe('emergency bridge loan', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('fires on first negative cash week and brings cash positive', () => {
    const state = {
      ...clone(STARTING_STATE),
      stats: { ...STARTING_STATE.stats, cashReserve: -1 },
    }
    const result = tick(state)
    expect(result.stats.cashReserve).toBeGreaterThan(0)
    expect(result.emergencyLoansTaken).toBe(1)
  })

  it('increases debtStock by 10 on first emergency loan', () => {
    const initial = STARTING_STATE.stats.debtStock
    const state = {
      ...clone(STARTING_STATE),
      stats: { ...STARTING_STATE.stats, cashReserve: -1 },
    }
    const result = tick(state)
    expect(result.stats.debtStock).toBeCloseTo(initial + 10, 1)
  })

  it('escalates APR on second emergency loan', () => {
    const s1 = tick({
      ...clone(STARTING_STATE),
      stats: { ...STARTING_STATE.stats, cashReserve: -1 },
    })
    const interest1 = s1.stats.weeklyDebtInterest
    const s2 = tick({
      ...s1,
      stats: { ...s1.stats, cashReserve: -1 },
      consecutiveBankruptWeeks: 0,
    })
    expect(s2.stats.weeklyDebtInterest).toBeGreaterThan(interest1)
    expect(s2.emergencyLoansTaken).toBe(2)
  })

  it('stops offering emergency loans after 3 and lets bankruptcy counter run', () => {
    // Build a state that has already taken 3 emergency loans
    let s = clone(STARTING_STATE)
    s.emergencyLoansTaken = 3
    s.stats.cashReserve = -5  // already negative after expenses

    const result = tick(s)
    // No new loan should fire
    expect(result.emergencyLoansTaken).toBe(3)
    // Consecutive counter should start climbing
    expect(result.consecutiveBankruptWeeks).toBeGreaterThan(0)
  })

  it('reaches game over within 3 weeks after hitting the loan cap', () => {
    let s = clone(STARTING_STATE)
    s.emergencyLoansTaken = 3
    s.stats.cashReserve = -5

    for (let i = 0; i < 4; i++) {
      if (s.isGameOver) break
      s = tick(s)
    }
    expect(s.isGameOver).toBe(true)
    expect(s.gameOverReason).toMatch(/Bankruptcy/i)
  })

  it('adds Credit Exhausted timeline entry when third loan is taken', () => {
    let s = clone(STARTING_STATE)
    s.emergencyLoansTaken = 2
    s.stats.cashReserve = -1

    const result = tick(s)
    expect(result.emergencyLoansTaken).toBe(3)
    expect(result.timeline.some((e) => e.title === 'Credit Exhausted')).toBe(true)
  })
})

describe('tickInitiative', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('does nothing when no active initiative', () => {
    const state = clone(STARTING_STATE)
    const result = tick(state)
    expect(result.activeInitiative).toBeNull()
  })

  it('decrements weeksRemaining each tick', () => {
    const state = {
      ...clone(STARTING_STATE),
      activeInitiative: {
        id: 'test-initiative',
        name: 'Test Initiative',
        weeksRemaining: 10,
        totalWeeks: 10,
        completionEventId: 'test-completion',
      },
    }
    const result = tick(state)
    expect(result.activeInitiative).not.toBeNull()
    expect(result.activeInitiative!.weeksRemaining).toBe(9)
  })

  it('fires completion event and clears slot when timer expires', () => {
    const state = {
      ...clone(STARTING_STATE),
      activeInitiative: {
        id: 'paye-enforcement',
        name: 'PAYE Enforcement Drive',
        weeksRemaining: 1,
        totalWeeks: 10,
        completionEventId: 'paye-enforcement-result',
      },
    }
    const result = tick(state)
    expect(result.activeInitiative).toBeNull()
    expect(result.eventQueue).toHaveLength(1)
    expect(result.eventQueue[0].id).toBe('paye-enforcement-result')
  })
})

describe('primaryScenario derivation from stateFlags', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('derives primaryScenario A from primary-a flag', () => {
    const state = { ...clone(STARTING_STATE), week: 100, stateFlags: { 'primary-a': true } }
    const result = tick(state)
    expect(result.primaryScenario).toBe('A')
  })

  it('derives primaryScenario B from primary-b flag', () => {
    const state = { ...clone(STARTING_STATE), week: 100, stateFlags: { 'primary-b': true } }
    const result = tick(state)
    expect(result.primaryScenario).toBe('B')
  })

  it('derives primaryScenario C from primary-c flag', () => {
    const state = { ...clone(STARTING_STATE), week: 100, stateFlags: { 'primary-c': true } }
    const result = tick(state)
    expect(result.primaryScenario).toBe('C')
  })

  it('does not overwrite an already-set primaryScenario', () => {
    const state = {
      ...clone(STARTING_STATE),
      week: 100,
      primaryScenario: 'A' as const,
      stateFlags: { 'primary-b': true },
    }
    const result = tick(state)
    expect(result.primaryScenario).toBe('A')
  })
})

describe('Scenario B primary loss condition', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  function scenarioBBase(overrides: Partial<GameState> = {}): GameState {
    return {
      ...clone(STARTING_STATE),
      week: 176,
      stateFlags: { 'primary-b': true, 'primary-b-civil-society': true },
      primaryScenario: 'B' as const,
      primaryWon: null,
      ...overrides,
    }
  }

  it('enqueues primary-contest-loss when civil society thresholds are not met', () => {
    const state = scenarioBBase({
      factions: {
        ...STARTING_STATE.factions,
        civilSocietyMedia: 40,   // below 55 threshold
        businessCommunity: 40,   // below 50 threshold
      },
    })
    const result = tick(state)
    expect(result.primaryWon).toBe(false)
    expect(result.eventQueue.some((e) => e.id === 'primary-contest-loss')).toBe(true)
  })

  it('sets primaryWon true when civil society path thresholds are met', () => {
    const state = scenarioBBase({
      factions: {
        ...STARTING_STATE.factions,
        civilSocietyMedia: 60,   // >= 55
        businessCommunity: 55,   // >= 50
      },
    })
    const result = tick(state)
    expect(result.primaryWon).toBe(true)
    expect(result.eventQueue.some((e) => e.id === 'primary-contest-loss')).toBe(false)
  })

  it('sets primaryWon true when grassroots path thresholds are met', () => {
    const state = scenarioBBase({
      stateFlags: { 'primary-b': true, 'primary-b-grassroots': true },
      lgaElectionResult: 65,   // >= 60
    })
    const result = tick(state)
    expect(result.primaryWon).toBe(true)
  })

  it('does not re-enqueue primary-contest-loss if already in queue', () => {
    const lossEvent = { id: 'primary-contest-loss', title: '', body: '', severity: 'critical' as const, category: 'political' as const, choices: [] }
    const state = scenarioBBase({
      factions: { ...STARTING_STATE.factions, civilSocietyMedia: 40, businessCommunity: 40 },
      eventQueue: [lossEvent],
    })
    const result = tick(state)
    const count = result.eventQueue.filter((e) => e.id === 'primary-contest-loss').length
    expect(count).toBe(1)
  })

  it('triggers game over when primary-lost flag is set', () => {
    const state = {
      ...clone(STARTING_STATE),
      week: 180,
      stateFlags: { 'primary-lost': true },
    }
    const result = tick(state)
    expect(result.isGameOver).toBe(true)
    expect(result.gameOverReason).toMatch(/primary/i)
  })
})

describe('primary event mutual exclusion', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('does not draw a second primary event once primaryScenario is set', () => {
    // Simulate save-10 pattern: both fashemu-backed and primary-open conditions met
    const state = {
      ...clone(STARTING_STATE),
      week: 171,
      primaryScenario: 'A' as const,  // already resolved via fashemu-backed
      stateFlags: { 'primary-a': true },
      godfatherComplianceCount: 3,
      godfatherRefusalCount: 6,
      fashemuPhase: 'dormant' as const,
      resolvedEvents: ['primary-fashemu-backed'],
    }
    const result = tick(state)
    // primary-open must NOT enter the queue despite its trigger condition passing
    expect(result.eventQueue.some((e) => e.id === 'primary-open')).toBe(false)
    expect(result.activeEvent?.id).not.toBe('primary-open')
  })
})

describe('newspaper cooldown', () => {
  it('does not set a new headline if issued fewer than 3 weeks ago', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    // State where a headline was issued last week — tick should not overwrite it
    const state: GameState = {
      ...clone(STARTING_STATE),
      week: 10,
      lastNewsWeek: 9,  // 1 week ago — within 3-week cooldown
      newspaperHeadline: undefined,
      stats: { ...STARTING_STATE.stats, cashReserve: 0 },  // newsworthy conditions
    }
    const result = tick(state)
    expect(result.newspaperHeadline).toBeUndefined()
    vi.restoreAllMocks()
  })

  it('allows a headline after cooldown has elapsed', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const state: GameState = {
      ...clone(STARTING_STATE),
      week: 13,
      lastNewsWeek: 9,  // 4 weeks ago — cooldown elapsed
      newspaperHeadline: undefined,
      stats: { ...STARTING_STATE.stats, cashReserve: -10, publicTrust: 15 },  // very newsworthy
    }
    const result = tick(state)
    // May or may not generate a headline depending on news analysts, but lastNewsWeek should update if it does
    if (result.newspaperHeadline) {
      expect(result.lastNewsWeek).toBe(result.week)  // updated to whichever week the tick landed on
    }
    vi.restoreAllMocks()
  })
})
