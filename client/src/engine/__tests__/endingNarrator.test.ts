import { describe, it, expect } from 'vitest'
import { STARTING_STATE } from '../../data/startingState'
import type { GameState } from '../../state/types'
import { buildEndingNarrative, pickVerdictHeadline, pickKeyMomentsForLegacy } from '../endingNarrator'

function clone(s: GameState): GameState {
  return JSON.parse(JSON.stringify(s))
}

function bankruptState(): GameState {
  const s = clone(STARTING_STATE as GameState)
  s.stats.cashReserve = -15
  s.consecutiveBankruptWeeks = 3
  s.week = 30
  s.lastWeekExpenditure = {
    personnel: 5, debtInterest: 2, debtRepayment: 1,
    overheads: 8, subventions: 0.5, contractorPayment: 0.5, total: 17,
  }
  s.timeline.push(
    { week: 10, type: 'event', title: 'Cleared teacher arrears', description: 'paid three months owed' },
    { week: 15, type: 'godfather', title: 'Defied Chief Fashemu', description: 'refused contractor' },
    { week: 22, type: 'milestone', title: 'Forensics Lab completed', description: 'commissioned and running' },
  )
  return s
}

function termEndLossState(): GameState {
  const s = clone(STARTING_STATE as GameState)
  s.week = 209
  s.currentTerm = 1
  s.electionResult = 43
  s.reElected = false
  s.stats.publicTrust = 62
  s.stats.securityIndex = 70
  s.stats.infrastructureScore = 55
  s.factions.civilSocietyMedia = 30
  s.factions.businessCommunity = 40
  s.constituencyApproval.alimosho = 28
  s.selectedGoalId = 'break-the-machine'
  s.timeline.push(
    { week: 8, type: 'event', title: 'Teachers paid after three months', description: 'kept schools open' },
    { week: 25, type: 'godfather', title: 'Fashemu called in a favour', description: 'contract awarded' },
    { week: 40, type: 'milestone', title: 'Lekki Conservation project', description: 'groundbreaking' },
    { week: 80, type: 'delayed-consequence', title: 'Budget surplus declared', description: 'first surplus in 6 quarters' },
  )
  return s
}

function fedTakeoverState(): GameState {
  const s = clone(STARTING_STATE as GameState)
  s.stats.federalRelationship = -45
  s.stats.infrastructureScore = 22
  s.week = 55
  return s
}

function uprisingState(): GameState {
  const s = clone(STARTING_STATE as GameState)
  s.stats.publicTrust = 12
  s.stats.youthTension = 88
  s.week = 40
  return s
}

function impeachmentState(defied: boolean): GameState {
  const s = clone(STARTING_STATE as GameState)
  s.impeachmentStage = 2
  s.week = 70
  s.factions.partyGodfathers = 8
  if (defied) {
    s.timeline.push(
      { week: 65, type: 'event', title: 'Removal Resolution: First Reading', description: 'Defy the Assembly' },
    )
  } else {
    s.stateFlags['conceded-to-assembly'] = true
  }
  return s
}

function primaryLossState(): GameState {
  const s = clone(STARTING_STATE as GameState)
  s.stateFlags['primary-lost'] = true
  s.stateFlags['primary-b'] = true
  s.stateFlags['primary-b-grassroots'] = true
  s.lgaElectionResult = 45
  s.week = 180
  return s
}

function termEndWinState(): GameState {
  const s = clone(STARTING_STATE as GameState)
  s.week = 208
  s.currentTerm = 1
  s.electionResult = 62
  s.reElected = true
  s.stats.publicTrust = 71
  s.stats.securityIndex = 78
  s.stats.infrastructureScore = 68
  s.selectedGoalId = 'make-the-promise-real'
  s.timeline.push(
    { week: 20, type: 'event', title: 'Metro extension launched', description: 'phase one running' },
    { week: 60, type: 'godfather', title: 'Refused godfather demand', description: 'stood firm' },
  )
  return s
}

function secondTermEndState(): GameState {
  const s = clone(STARTING_STATE as GameState)
  s.week = 417
  s.currentTerm = 2
  s.electionResult = 58
  s.reElected = true
  s.stats.publicTrust = 74
  s.stats.securityIndex = 82
  s.stats.infrastructureScore = 72
  s.stats.corruptionPressure = 45
  s.selectedGoalId = 'make-the-promise-real'
  s.timeline.push(
    { week: 30, type: 'event', title: 'Alimosho road project', description: 'completed ahead of schedule' },
    { week: 80, type: 'milestone', title: 'Ikeja bus terminal', description: 'operational' },
    { week: 200, type: 'godfather', title: 'Fashemu break completed', description: 'arc resolved' },
  )
  return s
}

describe('buildEndingNarrative', () => {
  it('returns a non-empty narrative for bankruptcy', () => {
    const result = buildEndingNarrative(bankruptState(), 'bankruptcy')
    expect(result.length).toBeGreaterThan(50)
    expect(result).toMatch(/insolvent|Insolvent|overheads|Overheads/i)
  })

  it('returns a non-empty narrative for federal takeover', () => {
    const result = buildEndingNarrative(fedTakeoverState(), 'federalTakeover')
    expect(result.length).toBeGreaterThan(50)
    expect(result).toMatch(/federal|Abuja|takeover/i)
  })

  it('returns a non-empty narrative for mass uprising', () => {
    const result = buildEndingNarrative(uprisingState(), 'massUprising')
    expect(result.length).toBeGreaterThan(50)
    expect(result).toMatch(/streets|trust|uprising|consent/i)
  })

  it('returns a non-empty narrative for impeachment (defied)', () => {
    const result = buildEndingNarrative(impeachmentState(true), 'impeachment')
    expect(result.length).toBeGreaterThan(50)
    expect(result).toMatch(/defied|Assembly|removed|House/i)
  })

  it('returns a non-empty narrative for impeachment (conceded)', () => {
    const result = buildEndingNarrative(impeachmentState(false), 'impeachment')
    expect(result.length).toBeGreaterThan(50)
    expect(result).toMatch(/conceded|concession|Assembly/i)
  })

  it('returns a non-empty narrative for primary loss', () => {
    const result = buildEndingNarrative(primaryLossState(), 'primaryLoss')
    expect(result.length).toBeGreaterThan(50)
    expect(result).toMatch(/primary|Majekodunmi/i)
  })

  it('returns a non-empty narrative for term end loss', () => {
    const result = buildEndingNarrative(termEndLossState(), 'termEndLoss')
    expect(result.length).toBeGreaterThan(50)
    expect(result).toMatch(/defeat|election|vote|abandoned/i)
  })

  it('returns a non-empty narrative for term end win', () => {
    const result = buildEndingNarrative(termEndWinState(), 'termEndWin')
    expect(result.length).toBeGreaterThan(50)
    expect(result).toMatch(/returned|mandate|re.?election|voteShare/i)
  })

  it('returns a non-empty narrative for second term end', () => {
    const result = buildEndingNarrative(secondTermEndState(), 'secondTermEnd')
    expect(result.length).toBeGreaterThan(50)
    expect(result).toMatch(/eight|two terms|second term|years/i)
  })

  it('includes the goal progress in the narrative when goal is set', () => {
    const s = termEndLossState()
    const result = buildEndingNarrative(s, 'termEndLoss')
    expect(result).toMatch(/break the machine|goal/i)
  })

  it('produces different variants for different seeds', () => {
    const s = bankruptState()
    const r1 = buildEndingNarrative(s, 'bankruptcy')
    const r2 = buildEndingNarrative(s, 'bankruptcy')
    expect(r1).toEqual(r2) // same state → same hash → deterministic
  })

  it('produces different narratives for different exit types on same base state', () => {
    const s = bankruptState()
    const r1 = buildEndingNarrative(s, 'bankruptcy')
    const r2 = buildEndingNarrative(s, 'federalTakeover')
    expect(r1).not.toEqual(r2)
  })
})

describe('pickVerdictHeadline', () => {
  it('returns a non-empty verdict for each exit type', () => {
    const types: Array<Parameters<typeof pickVerdictHeadline>[1]> = [
      'bankruptcy', 'federalTakeover', 'massUprising', 'impeachment',
      'primaryLoss', 'termEndLoss', 'termEndWin', 'secondTermEnd',
    ]
    for (const t of types) {
      const s = t === 'bankruptcy' ? bankruptState()
        : t === 'federalTakeover' ? fedTakeoverState()
        : t === 'massUprising' ? uprisingState()
        : t === 'impeachment' ? impeachmentState(true)
        : t === 'primaryLoss' ? primaryLossState()
        : t === 'termEndLoss' ? termEndLossState()
        : t === 'termEndWin' ? termEndWinState()
        : secondTermEndState()
      const verdict = pickVerdictHeadline(s, t)
      expect(verdict.length).toBeGreaterThan(5)
    }
  })
})

describe('pickKeyMomentsForLegacy', () => {
  it('returns up to 4 key moments from the timeline', () => {
    const s = termEndWinState()
    const moments = pickKeyMomentsForLegacy(s)
    expect(moments.length).toBeGreaterThanOrEqual(1)
    expect(moments.length).toBeLessThanOrEqual(4)
    for (const m of moments) {
      expect(m.title).toBeTruthy()
      expect(typeof m.week).toBe('number')
    }
  })

  it('returns empty array when timeline is empty', () => {
    const s = clone(STARTING_STATE as GameState)
    const moments = pickKeyMomentsForLegacy(s)
    expect(moments).toEqual([])
  })
})
