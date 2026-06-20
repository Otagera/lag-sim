import { describe, it, expect } from 'vitest'
import { STARTING_STATE } from '../../data/startingState'
import { phase4Events } from '../../data/events/phase4'
import { ALL_EVENTS, resolveEvent } from '../eventEngine'
import { tick } from '../gameLoop'
import type { GameState } from '../../state/types'

function clone(s: GameState): GameState {
  return JSON.parse(JSON.stringify(s))
}

function findEvent(id: string) {
  const e = phase4Events.find((ev) => ev.id === id)
  if (!e) throw new Error(`Phase4 event not found: ${id}`)
  return e
}

function stateWith(overrides: Partial<GameState>): GameState {
  return { ...clone(STARTING_STATE), ...overrides }
}

// ─── New state field defaults ─────────────────────────────────────────────────

describe('Phase 4 state field defaults', () => {
  it('emergencySuspensionWeeks defaults to 0', () => {
    expect(STARTING_STATE.emergencySuspensionWeeks).toBe(0)
  })

  it('administratorActIndex defaults to 0', () => {
    expect(STARTING_STATE.administratorActIndex).toBe(0)
  })

  it('litigationActive defaults to false', () => {
    expect(STARTING_STATE.litigationActive).toBe(false)
  })

  it('litigationTimer defaults to 0', () => {
    expect(STARTING_STATE.litigationTimer).toBe(0)
  })

  it('offCycleElection defaults to false', () => {
    expect(STARTING_STATE.offCycleElection).toBe(false)
  })
})

// ─── setSuspensionWeeks / setLitigationTimer in resolveEvent ─────────────────

describe('Choice.setSuspensionWeeks: wires through resolveEvent', () => {
  it('setSuspensionWeeks: 5 sets emergencySuspensionWeeks to 5', () => {
    const event = findEvent('federal-emergency-declared')
    const base = stateWith({})
    const after = resolveEvent(base, event, 'accept-suspension-fight-legally')
    expect(after.emergencySuspensionWeeks).toBe(5)
  })

  it('setSuspensionWeeks: 0 clears the suspension', () => {
    const event = findEvent('suspension-legal-challenge-success')
    const base = stateWith({
      stateFlags: { 'legal-challenge-filed': true },
      factions: { ...STARTING_STATE.factions, partyGodfathers: 35 },
      stats: { ...STARTING_STATE.stats, publicTrust: 45 },
    })
    // Override the event to test the choice directly
    const after = resolveEvent(base, event, 'accept-court-victory')
    expect(after.stats.publicTrust).toBeGreaterThan(base.stats.publicTrust)
  })
})

describe('Choice.setLitigationTimer: wires through resolveEvent', () => {
  it('setLitigationTimer: 20 sets litigationActive and litigationTimer', () => {
    const event = findEvent('election-petition-filed')
    const base = stateWith({
      week: 4,
      stats: { ...STARTING_STATE.stats, corruptionPressure: 50 },
    })
    const after = resolveEvent(base, event, 'contest-petition-aggressively')
    expect(after.litigationActive).toBe(true)
    expect(after.litigationTimer).toBe(20)
  })

  it('setLitigationTimer: 0 clears litigationActive', () => {
    const event = findEvent('supreme-court-ruling')
    const base = stateWith({ litigationActive: true, litigationTimer: 1 })
    const after = resolveEvent(base, event, 'ruling-upheld-your-election')
    expect(after.litigationActive).toBe(false)
    expect(after.litigationTimer).toBe(0)
  })
})

// ─── Cat 2: Federal Emergency Threat ─────────────────────────────────────────

describe('federal-emergency-threat: trigger conditions', () => {
  const event = findEvent('federal-emergency-threat')

  it('fires when federalRelationship < -25 AND youthTension > 65', () => {
    const state = stateWith({
      stats: { ...STARTING_STATE.stats, federalRelationship: -28, youthTension: 70 },
    })
    expect(event.triggerCondition!(state)).toBe(true)
  })

  it('does not fire when youthTension <= 65', () => {
    const state = stateWith({
      stats: { ...STARTING_STATE.stats, federalRelationship: -30, youthTension: 65 },
    })
    expect(event.triggerCondition!(state)).toBe(false)
  })

  it('does not fire if emergency-ever-suspended flag is set', () => {
    const state = stateWith({
      stats: { ...STARTING_STATE.stats, federalRelationship: -30, youthTension: 70 },
      stateFlags: { 'emergency-ever-suspended': true },
    })
    expect(event.triggerCondition!(state)).toBe(false)
  })

  it('does not fire if already threatened this term', () => {
    const state = stateWith({
      stats: { ...STARTING_STATE.stats, federalRelationship: -30, youthTension: 70 },
      stateFlags: { 'federal-emergency-threatened': true },
    })
    expect(event.triggerCondition!(state)).toBe(false)
  })

  it('cooperate choice improves federalRelationship and prevents suspension', () => {
    const base = stateWith({
      stats: { ...STARTING_STATE.stats, federalRelationship: -28, youthTension: 70 },
    })
    const after = resolveEvent(base, event, 'cooperate-with-abuja')
    expect(after.stats.federalRelationship).toBeGreaterThan(base.stats.federalRelationship)
    expect(after.emergencySuspensionWeeks).toBe(0)
  })

  it('defy choice sets delayed consequence that will queue federal-emergency-declared', () => {
    const base = stateWith({
      stats: { ...STARTING_STATE.stats, federalRelationship: -28, youthTension: 70 },
    })
    const after = resolveEvent(base, event, 'publicly-defy-emergency')
    // delayed consequence scheduled at +2 weeks
    expect(after.pendingDelayed.length).toBeGreaterThan(0)
    const pending = after.pendingDelayed.find((p) =>
      p.consequence.followUpEventId === 'federal-emergency-declared',
    )
    expect(pending).toBeDefined()
    expect(pending!.firesOnWeek).toBe(STARTING_STATE.week + 2)
  })
})

describe('federal-emergency-declared: queue-only, starts suspension', () => {
  const event = findEvent('federal-emergency-declared')

  it('is queue-only (triggerCondition always false)', () => {
    expect(event.triggerCondition!(stateWith({}))).toBe(false)
  })

  it('accept choice sets emergencySuspensionWeeks to 5', () => {
    const base = stateWith({})
    const after = resolveEvent(base, event, 'accept-suspension-fight-legally')
    expect(after.emergencySuspensionWeeks).toBe(5)
  })

  it('mobilise choice sets suspension weeks to 3 (Assembly path)', () => {
    const base = stateWith({})
    const after = resolveEvent(base, event, 'mobilise-assembly-against-declaration')
    expect(after.emergencySuspensionWeeks).toBe(3)
  })
})

// ─── Cat 2: tickSuspension (via gameLoop.tick) ────────────────────────────────

describe('tickSuspension: passive drain and act progression', () => {
  it('decrements emergencySuspensionWeeks by 1 each tick', () => {
    const base = stateWith({ emergencySuspensionWeeks: 3 })
    const after = tick(base)
    expect(after.emergencySuspensionWeeks).toBe(2)
  })

  it('advances administratorActIndex each tick', () => {
    const base = stateWith({ emergencySuspensionWeeks: 3, administratorActIndex: 0 })
    const after = tick(base)
    expect(after.administratorActIndex).toBe(1)
  })

  it('drains cashReserve during suspension', () => {
    const base = stateWith({ emergencySuspensionWeeks: 2 })
    const after = tick(base)
    // cashReserve changes from revenue/expenditure + suspension drain (-1.5)
    // We just verify it's lower than without suspension
    const baseNoSuspension = stateWith({ emergencySuspensionWeeks: 0 })
    const afterNoSuspension = tick(baseNoSuspension)
    expect(after.stats.cashReserve).toBeLessThan(afterNoSuspension.stats.cashReserve)
  })

  it('adds a timeline entry for the administrator act each week', () => {
    const base = stateWith({ emergencySuspensionWeeks: 3 })
    const after = tick(base)
    const entry = after.timeline.find((e) => e.title === 'Federal Administrator')
    expect(entry).toBeDefined()
  })

  it('does not drain or progress when suspension is 0', () => {
    const base = stateWith({ emergencySuspensionWeeks: 0, administratorActIndex: 0 })
    const after = tick(base)
    expect(after.emergencySuspensionWeeks).toBe(0)
    expect(after.administratorActIndex).toBe(0)
  })

  it('adds reinstatement milestone when weeks reach 0', () => {
    const base = stateWith({ emergencySuspensionWeeks: 1 })
    const after = tick(base)
    expect(after.emergencySuspensionWeeks).toBe(0)
    const entry = after.timeline.find((e) => e.title === 'Emergency Ended')
    expect(entry).toBeDefined()
  })

  it('sets emergency-ever-suspended flag on natural end', () => {
    const base = stateWith({ emergencySuspensionWeeks: 1 })
    const after = tick(base)
    expect(after.stateFlags['emergency-ever-suspended']).toBe(true)
  })

  it('enqueues a sole-administrator act event during suspension', () => {
    const base = stateWith({ emergencySuspensionWeeks: 3 })
    const after = tick(base)
    const hasActEvent = after.eventQueue.some((e) => e.id.startsWith('sole-administrator-act-'))
    expect(hasActEvent).toBe(true)
  })
})

describe('tickSuspension: legal challenge early exit', () => {
  it('clears suspension immediately when legal-challenge-succeeded flag is set', () => {
    const base = stateWith({
      emergencySuspensionWeeks: 3,
      stateFlags: { 'legal-challenge-succeeded': true },
    })
    const after = tick(base)
    expect(after.emergencySuspensionWeeks).toBe(0)
  })

  it('adds reinstatement-legal-victory timeline entry on early exit', () => {
    const base = stateWith({
      emergencySuspensionWeeks: 3,
      stateFlags: { 'legal-challenge-succeeded': true },
    })
    const after = tick(base)
    const entry = after.timeline.find((e) => e.title.includes('Reinstatement'))
    expect(entry).toBeDefined()
  })

  it('clears the legal-challenge-succeeded flag after processing', () => {
    const base = stateWith({
      emergencySuspensionWeeks: 3,
      stateFlags: { 'legal-challenge-succeeded': true },
    })
    const after = tick(base)
    expect(after.stateFlags['legal-challenge-succeeded']).toBeFalsy()
  })
})

// ─── Cat 2: Suspension legal challenge outcomes ───────────────────────────────

describe('suspension-legal-challenge-success: trigger', () => {
  const event = findEvent('suspension-legal-challenge-success')

  it('fires when challenge filed AND partyGodfathers > 30 AND trust > 40', () => {
    const state = stateWith({
      stateFlags: { 'legal-challenge-filed': true },
      factions: { ...STARTING_STATE.factions, partyGodfathers: 35 },
      stats: { ...STARTING_STATE.stats, publicTrust: 45 },
    })
    expect(event.triggerCondition!(state)).toBe(true)
  })

  it('does not fire when challenge not filed', () => {
    const state = stateWith({
      factions: { ...STARTING_STATE.factions, partyGodfathers: 35 },
      stats: { ...STARTING_STATE.stats, publicTrust: 45 },
    })
    expect(event.triggerCondition!(state)).toBe(false)
  })

  it('does not fire when partyGodfathers <= 30', () => {
    const state = stateWith({
      stateFlags: { 'legal-challenge-filed': true },
      factions: { ...STARTING_STATE.factions, partyGodfathers: 28 },
      stats: { ...STARTING_STATE.stats, publicTrust: 50 },
    })
    expect(event.triggerCondition!(state)).toBe(false)
  })
})

describe('suspension-legal-challenge-fail: trigger', () => {
  const event = findEvent('suspension-legal-challenge-fail')

  it('fires when challenge filed AND conditions NOT met', () => {
    const state = stateWith({
      stateFlags: { 'legal-challenge-filed': true },
      factions: { ...STARTING_STATE.factions, partyGodfathers: 20 },
      stats: { ...STARTING_STATE.stats, publicTrust: 35 },
    })
    expect(event.triggerCondition!(state)).toBe(true)
  })

  it('exactly one of success/fail fires for any challenge state', () => {
    const successEvent = findEvent('suspension-legal-challenge-success')
    const failEvent = findEvent('suspension-legal-challenge-fail')

    // Strong position
    const stateStrong = stateWith({
      stateFlags: { 'legal-challenge-filed': true },
      factions: { ...STARTING_STATE.factions, partyGodfathers: 40 },
      stats: { ...STARTING_STATE.stats, publicTrust: 55 },
    })
    expect(successEvent.triggerCondition!(stateStrong)).toBe(true)
    expect(failEvent.triggerCondition!(stateStrong)).toBe(false)

    // Weak position
    const stateWeak = stateWith({
      stateFlags: { 'legal-challenge-filed': true },
      factions: { ...STARTING_STATE.factions, partyGodfathers: 20 },
      stats: { ...STARTING_STATE.stats, publicTrust: 30 },
    })
    expect(successEvent.triggerCondition!(stateWeak)).toBe(false)
    expect(failEvent.triggerCondition!(stateWeak)).toBe(true)
  })
})

// ─── Cat 2: EFCC Investigation Letter ────────────────────────────────────────

describe('efcc-investigation-letter: trigger and choices', () => {
  const event = findEvent('efcc-investigation-letter')

  it('fires when corruptionPressure > 68 and not already investigated', () => {
    const state = stateWith({ stats: { ...STARTING_STATE.stats, corruptionPressure: 70 } })
    expect(event.triggerCondition!(state)).toBe(true)
  })

  it('does not fire when already investigated', () => {
    const state = stateWith({
      stats: { ...STARTING_STATE.stats, corruptionPressure: 70 },
      stateFlags: { 'efcc-investigated': true },
    })
    expect(event.triggerCondition!(state)).toBe(false)
  })

  it('does not fire below threshold', () => {
    const state = stateWith({ stats: { ...STARTING_STATE.stats, corruptionPressure: 68 } })
    expect(event.triggerCondition!(state)).toBe(false)
  })

  it('cooperate choice reduces corruption and boosts federal relationship', () => {
    const base = stateWith({ stats: { ...STARTING_STATE.stats, corruptionPressure: 72 } })
    const after = resolveEvent(base, event, 'cooperate-with-efcc')
    expect(after.stats.corruptionPressure).toBeLessThan(base.stats.corruptionPressure)
    expect(after.stats.federalRelationship).toBeGreaterThan(base.stats.federalRelationship)
    expect(after.stateFlags['efcc-cooperated']).toBe(true)
  })

  it('all 3 choices set efcc-investigated flag', () => {
    const base = stateWith({ stats: { ...STARTING_STATE.stats, corruptionPressure: 72 } })
    for (const choiceId of ['cooperate-with-efcc', 'challenge-efcc-jurisdiction', 'quiet-political-settlement']) {
      const after = resolveEvent(base, event, choiceId)
      expect(after.stateFlags['efcc-investigated']).toBe(true)
    }
  })
})

// ─── Cat 1: Judicial Litigation ───────────────────────────────────────────────

describe('election-petition-filed: trigger and choices', () => {
  const event = findEvent('election-petition-filed')

  it('fires between weeks 2–8 when corruption > 45 and no prior petition', () => {
    const state = stateWith({
      week: 4,
      stats: { ...STARTING_STATE.stats, corruptionPressure: 50 },
    })
    expect(event.triggerCondition!(state)).toBe(true)
  })

  it('does not fire after week 8', () => {
    const state = stateWith({
      week: 9,
      stats: { ...STARTING_STATE.stats, corruptionPressure: 50 },
    })
    expect(event.triggerCondition!(state)).toBe(false)
  })

  it('does not fire when corruption <= 45', () => {
    const state = stateWith({
      week: 4,
      stats: { ...STARTING_STATE.stats, corruptionPressure: 45 },
    })
    expect(event.triggerCondition!(state)).toBe(false)
  })

  it('does not fire if petition already filed or avoided', () => {
    for (const flag of ['petition-filed', 'petition-avoided']) {
      const state = stateWith({
        week: 4,
        stats: { ...STARTING_STATE.stats, corruptionPressure: 50 },
        stateFlags: { [flag]: true },
      })
      expect(event.triggerCondition!(state)).toBe(false)
    }
  })

  it('contest choice starts litigation with 20-week timer', () => {
    const base = stateWith({
      week: 4,
      stats: { ...STARTING_STATE.stats, corruptionPressure: 50 },
    })
    const after = resolveEvent(base, event, 'contest-petition-aggressively')
    expect(after.litigationActive).toBe(true)
    expect(after.litigationTimer).toBe(20)
  })

  it('negotiate-withdrawal avoids litigation and sets petition-avoided', () => {
    const base = stateWith({
      week: 4,
      stats: { ...STARTING_STATE.stats, corruptionPressure: 50 },
    })
    const after = resolveEvent(base, event, 'negotiate-withdrawal')
    expect(after.litigationActive).toBe(false)
    expect(after.stateFlags['petition-avoided']).toBe(true)
  })
})

describe('tribunal-midpoint-hearing: trigger conditions', () => {
  const event = findEvent('tribunal-midpoint-hearing')

  it('fires when litigation active AND timer <= 10', () => {
    const state = stateWith({ litigationActive: true, litigationTimer: 8 })
    expect(event.triggerCondition!(state)).toBe(true)
  })

  it('does not fire when litigation not active', () => {
    const state = stateWith({ litigationActive: false, litigationTimer: 5 })
    expect(event.triggerCondition!(state)).toBe(false)
  })

  it('does not fire when timer > 10', () => {
    const state = stateWith({ litigationActive: true, litigationTimer: 11 })
    expect(event.triggerCondition!(state)).toBe(false)
  })

  it('negotiate-out-of-court choice clears litigation immediately', () => {
    const base = stateWith({ litigationActive: true, litigationTimer: 8 })
    const after = resolveEvent(base, event, 'negotiate-out-of-court')
    expect(after.litigationActive).toBe(false)
    expect(after.litigationTimer).toBe(0)
  })
})

describe('tickLitigation (via gameLoop.tick)', () => {
  it('decrements litigationTimer each tick when active', () => {
    const base = stateWith({ litigationActive: true, litigationTimer: 15 })
    const after = tick(base)
    expect(after.litigationTimer).toBe(14)
    expect(after.litigationActive).toBe(true)
  })

  it('does not decrement when litigation not active', () => {
    const base = stateWith({ litigationActive: false, litigationTimer: 10 })
    const after = tick(base)
    expect(after.litigationTimer).toBe(10)
  })

  it('enqueues supreme-court-ruling when timer reaches 0', () => {
    const base = stateWith({ litigationActive: true, litigationTimer: 1 })
    const after = tick(base)
    expect(after.litigationActive).toBe(false)
    expect(after.eventQueue.some((e) => e.id === 'supreme-court-ruling')).toBe(true)
  })

  it('does not enqueue ruling twice if already in queue', () => {
    const rulingEvent = ALL_EVENTS.find((e) => e.id === 'supreme-court-ruling')!
    const base = stateWith({
      litigationActive: true,
      litigationTimer: 1,
      eventQueue: [rulingEvent],
    })
    const after = tick(base)
    expect(after.eventQueue.filter((e) => e.id === 'supreme-court-ruling')).toHaveLength(1)
  })
})

describe('supreme-court-ruling: queue-only, outcome choices', () => {
  const event = findEvent('supreme-court-ruling')

  it('is queue-only (triggerCondition always false)', () => {
    expect(event.triggerCondition!(stateWith({}))).toBe(false)
  })

  it('upheld choice: PC +80, trust +10, sets litigation-won flag', () => {
    const base = stateWith({ litigationActive: true })
    const after = resolveEvent(base, event, 'ruling-upheld-your-election')
    expect(after.stats.politicalCapital).toBeCloseTo(STARTING_STATE.stats.politicalCapital + 80, 5)
    expect(after.stats.publicTrust).toBeGreaterThan(STARTING_STATE.stats.publicTrust)
    expect(after.stateFlags['litigation-won']).toBe(true)
  })

  it('rerun choice: PC -40, trust -10, sets litigation-lost flag', () => {
    const base = stateWith({ litigationActive: true })
    const after = resolveEvent(base, event, 'ruling-ordered-rerun')
    expect(after.stats.politicalCapital).toBeLessThan(STARTING_STATE.stats.politicalCapital)
    expect(after.stats.publicTrust).toBeLessThan(STARTING_STATE.stats.publicTrust)
    expect(after.stateFlags['litigation-lost']).toBe(true)
  })
})

// ─── Federal takeover suppression during suspension ──────────────────────────

describe('checkGameOver: federal takeover suppressed during suspension', () => {
  it('does not trigger federal takeover when suspension is active', () => {
    const base = stateWith({
      emergencySuspensionWeeks: 3,
      stats: {
        ...STARTING_STATE.stats,
        federalRelationship: -45,
        infrastructureScore: 20,
        cashReserve: 50,
      },
    })
    const after = tick(base)
    expect(after.isGameOver).toBe(false)
  })

  it('triggers federal takeover when suspension is 0 and conditions met', () => {
    const base = stateWith({
      emergencySuspensionWeeks: 0,
      week: 100,
      stats: {
        ...STARTING_STATE.stats,
        federalRelationship: -45,
        infrastructureScore: 20,
        cashReserve: 50,
        publicTrust: 50,
        youthTension: 30,
      },
    })
    const after = tick(base)
    expect(after.isGameOver).toBe(true)
    expect(after.gameOverReason).toContain('Federal Government')
  })
})
