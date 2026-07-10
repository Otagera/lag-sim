import { describe, expect, it } from 'vitest'
import { STARTING_STATE } from '../data/startingState'
import type { CapitalProject, GameState } from '../state/types'
import { detectMoment } from './momentDetector'

const base = (over: Partial<GameState> = {}): GameState => ({ ...STARTING_STATE, ...over })

const project = (over: Partial<CapitalProject>): CapitalProject => ({
  id: 'p1',
  name: 'New Bridge',
  location: 'ikeja',
  totalCost: 100,
  weeklyDraw: 5,
  totalSpent: 100,
  effectiveProgress: 100,
  contractorId: 'c1',
  weeksRemaining: 0,
  status: 'active',
  ...over,
})

describe('detectMoment', () => {
  it('fires crisis-survived when a riot is contained', () => {
    const m = detectMoment(base({ riotModeActive: true }), base({ riotModeActive: false, week: 10 }))
    expect(m?.type).toBe('crisis-survived')
    expect(m?.label).toBe('Riot Contained')
  })

  it('fires when solvency is restored after 2+ bankrupt weeks', () => {
    const m = detectMoment(
      base({ consecutiveBankruptWeeks: 2 }),
      base({ consecutiveBankruptWeeks: 0, week: 12 }),
    )
    expect(m?.label).toBe('Solvency Restored')
  })

  it('fires impeachment-defeated when the stage clears', () => {
    const m = detectMoment(base({ impeachmentStage: 1 }), base({ impeachmentStage: 0, week: 20 }))
    expect(m?.label).toBe('Impeachment Defeated')
  })

  it('fires landmark for a newly completed capital project, carrying its name', () => {
    const prev = base({ capitalProjects: [project({ status: 'active' })] })
    const next = base({ capitalProjects: [project({ status: 'completed' })], week: 30 })
    const m = detectMoment(prev, next)
    expect(m?.type).toBe('landmark-delivered')
    expect(m?.label).toBe('New Bridge')
    expect(m?.key).toBe('landmark:p1')
  })

  it('fires landmark for a newly completed commissioned project', () => {
    const prev = base({ projectStatuses: { 'brt-corridor': 'commissioned' } })
    const next = base({ projectStatuses: { 'brt-corridor': 'completed' }, week: 40 })
    const m = detectMoment(prev, next)
    expect(m?.type).toBe('landmark-delivered')
    expect(m?.key).toBe('landmark:brt-corridor')
  })

  it('fires term-milestone at a year boundary', () => {
    const m = detectMoment(base({ week: 51 }), base({ week: 52 }))
    expect(m?.type).toBe('term-milestone')
    expect(m?.label).toBe('Year 1')
    expect(m?.key).toBe('term-milestone:52')
  })

  it('does not fire mid-year', () => {
    expect(detectMoment(base({ week: 29 }), base({ week: 30 }))).toBeNull()
  })

  it('does not fire once the game is over', () => {
    const m = detectMoment(base({ riotModeActive: true }), base({ riotModeActive: false, isGameOver: true }))
    expect(m).toBeNull()
  })

  it('returns null when nothing brag-worthy changed', () => {
    expect(detectMoment(base({ week: 4 }), base({ week: 5 }))).toBeNull()
  })
})
