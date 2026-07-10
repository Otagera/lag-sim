import { describe, it, expect } from 'vitest'
import { STARTING_STATE } from '../../data/startingState'
import { phase4Events } from '../../data/events/phase4'
import { ALL_EVENTS, resolveEvent } from '../eventEngine'
import type { GameState } from '../../state/types'

function clone(s: GameState): GameState {
  return JSON.parse(JSON.stringify(s))
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function findEvent(id: string) {
  const e = phase4Events.find((ev) => ev.id === id)
  if (!e) throw new Error(`Phase4 event not found: ${id}`)
  return e
}

function stateWith(overrides: Partial<GameState>): GameState {
  return { ...clone(STARTING_STATE), ...overrides }
}

// ─── ALL_EVENTS registration ──────────────────────────────────────────────────

describe('phase4Events: registration in ALL_EVENTS', () => {
  it('all phase4 event ids exist in ALL_EVENTS', () => {
    const allIds = new Set(ALL_EVENTS.map((e) => e.id))
    for (const e of phase4Events) {
      expect(allIds.has(e.id), `Missing in ALL_EVENTS: ${e.id}`).toBe(true)
    }
  })

  it('phase4 events appear before other events in ALL_EVENTS (for trigger priority)', () => {
    const firstPhase4Index = ALL_EVENTS.findIndex((e) =>
      phase4Events.some((p4) => p4.id === e.id),
    )
    const firstNonPhase4Index = ALL_EVENTS.findIndex(
      (e) => !phase4Events.some((p4) => p4.id === e.id),
    )
    expect(firstPhase4Index).toBeLessThan(firstNonPhase4Index)
  })
})

// ─── Cat 4: Ghost Worker Purge ────────────────────────────────────────────────

describe('ghost-worker-crisis-alert: trigger conditions', () => {
  const event = findEvent('ghost-worker-crisis-alert')

  it('fires when ghostWorkerRate > 0.14', () => {
    const state = stateWith({ stats: { ...STARTING_STATE.stats, ghostWorkerRate: 0.15 } })
    expect(event.triggerCondition!(state)).toBe(true)
  })

  it('does not fire when ghostWorkerRate <= 0.14', () => {
    const state = stateWith({ stats: { ...STARTING_STATE.stats, ghostWorkerRate: 0.14 } })
    expect(event.triggerCondition!(state)).toBe(false)
  })

  it('does not fire if civil-service-reform-result already resolved', () => {
    const state = stateWith({
      stats: { ...STARTING_STATE.stats, ghostWorkerRate: 0.18 },
      resolvedEvents: ['civil-service-reform-result'],
    })
    expect(event.triggerCondition!(state)).toBe(false)
  })

  it('does not fire if ghost-purge-resolved flag is set', () => {
    const state = stateWith({
      stats: { ...STARTING_STATE.stats, ghostWorkerRate: 0.18 },
      stateFlags: { 'ghost-purge-resolved': true },
    })
    expect(event.triggerCondition!(state)).toBe(false)
  })

  it('has requiresInitiativeSlot: true', () => {
    expect(event.requiresInitiativeSlot).toBe(true)
  })
})

describe('ghost-worker-crisis-alert: biometric choice', () => {
  const event = findEvent('ghost-worker-crisis-alert')

  it('biometric choice launches 12-week initiative pointing to biometric-success', () => {
    const choice = event.choices.find((c) => c.id === 'launch-biometric-audit-phase2')!
    expect(choice.launchInitiative).toBeDefined()
    expect(choice.launchInitiative!.id).toBe('ghost-worker-biometric')
    expect(choice.launchInitiative!.weeksRemaining).toBe(12)
    expect(choice.launchInitiative!.completionEventId).toBe('ghost-worker-biometric-success')
  })

  it('biometric choice costs ₦8bn and reduces corruptionPressure', () => {
    const choice = event.choices.find((c) => c.id === 'launch-biometric-audit-phase2')!
    expect(choice.immediate.cashReserve).toBe(-8)
    expect(choice.immediate.corruptionPressure).toBe(-3)
  })

  it('biometric choice does not set a delayed consequence (no stall)', () => {
    const choice = event.choices.find((c) => c.id === 'launch-biometric-audit-phase2')!
    expect(choice.delayed).toBeUndefined()
  })
})

describe('ghost-worker-crisis-alert: committee choice', () => {
  const event = findEvent('ghost-worker-crisis-alert')
  const choice = event.choices.find((c) => c.id === 'launch-committee-audit-phase2')!

  it('committee choice launches 8-week initiative pointing to committee-success', () => {
    expect(choice.launchInitiative).toBeDefined()
    expect(choice.launchInitiative!.id).toBe('ghost-worker-committee')
    expect(choice.launchInitiative!.weeksRemaining).toBe(8)
    expect(choice.launchInitiative!.completionEventId).toBe('ghost-worker-committee-success')
  })

  it('committee choice sets a delayed consequence at week 4', () => {
    expect(choice.delayed).toBeDefined()
    expect(choice.delayed!.weekOffset).toBe(4)
  })

  it('committee delayed consequence chains to ghost-worker-committee-stall', () => {
    expect(choice.delayed!.followUpEventId).toBe('ghost-worker-committee-stall')
  })

  it('committee choice costs no cash upfront (only 5 PC)', () => {
    expect(choice.immediate.cashReserve).toBeUndefined()
    expect(choice.immediate.politicalCapital).toBe(-5)
  })
})

describe('ghost-worker-committee-stall: choices', () => {
  const event = findEvent('ghost-worker-committee-stall')
  const baseState = stateWith({ stats: { ...STARTING_STATE.stats, ghostWorkerRate: 0.16 } })

  it('pay-allowances choice costs cashReserve -0.5 and increases corruption', () => {
    const after = resolveEvent(baseState, event, 'pay-committee-allowances')
    expect(after.stats.cashReserve).toBeCloseTo(STARTING_STATE.stats.cashReserve - 0.5, 5)
    expect(after.stats.corruptionPressure).toBeGreaterThan(STARTING_STATE.stats.corruptionPressure)
  })

  it('refuse-allowances choice increases ghostWorkerRate by 0.02', () => {
    const after = resolveEvent(baseState, event, 'refuse-committee-allowances')
    expect(after.stats.ghostWorkerRate).toBeCloseTo(0.18, 5)
  })

  it('refuse-allowances choice reduces corruptionPressure and boosts civil society', () => {
    const after = resolveEvent(baseState, event, 'refuse-committee-allowances')
    expect(after.stats.corruptionPressure).toBeLessThan(STARTING_STATE.stats.corruptionPressure)
    expect(after.factions.civilSocietyMedia).toBeGreaterThan(STARTING_STATE.factions.civilSocietyMedia)
  })
})

describe('ghost-worker-biometric-success: completion outcome', () => {
  const event = findEvent('ghost-worker-biometric-success')
  const baseState = stateWith({ stats: { ...STARTING_STATE.stats, ghostWorkerRate: 0.16 } })

  it('reduces ghostWorkerRate by 0.06 (clamped to min 0.05)', () => {
    const after = resolveEvent(baseState, event, 'implement-biometric-outcome')
    expect(after.stats.ghostWorkerRate).toBeCloseTo(0.10, 5)
  })

  it('increases civilServiceReformScore by 25', () => {
    const after = resolveEvent(baseState, event, 'implement-biometric-outcome')
    expect(after.stats.civilServiceReformScore).toBe(25)
  })

  it('sets ghost-purge-resolved flag', () => {
    const after = resolveEvent(baseState, event, 'implement-biometric-outcome')
    expect(after.stateFlags['ghost-purge-resolved']).toBe(true)
  })

  it('biometric result is stronger than committee result (lower ghostWorkerRate)', () => {
    const afterBiometric = resolveEvent(baseState, event, 'implement-biometric-outcome')
    const committeeEvent = findEvent('ghost-worker-committee-success')
    const afterCommittee = resolveEvent(baseState, committeeEvent, 'accept-committee-report')
    expect(afterBiometric.stats.ghostWorkerRate).toBeLessThan(afterCommittee.stats.ghostWorkerRate)
  })
})

describe('ghost-worker-committee-success: completion outcome', () => {
  const event = findEvent('ghost-worker-committee-success')
  const baseState = stateWith({ stats: { ...STARTING_STATE.stats, ghostWorkerRate: 0.16 } })

  it('reduces ghostWorkerRate by 0.03', () => {
    const after = resolveEvent(baseState, event, 'accept-committee-report')
    expect(after.stats.ghostWorkerRate).toBeCloseTo(0.13, 5)
  })

  it('increases civilServiceReformScore by 10', () => {
    const after = resolveEvent(baseState, event, 'accept-committee-report')
    expect(after.stats.civilServiceReformScore).toBe(10)
  })

  it('sets ghost-purge-resolved flag', () => {
    const after = resolveEvent(baseState, event, 'accept-committee-report')
    expect(after.stateFlags['ghost-purge-resolved']).toBe(true)
  })
})

// ─── Cat 4: Stomach Infrastructure ───────────────────────────────────────────

describe('stomach-infrastructure-pressure: trigger conditions', () => {
  const event = findEvent('stomach-infrastructure-pressure')

  it('fires from week 155', () => {
    const state = stateWith({ week: 155 })
    expect(event.triggerCondition!(state)).toBe(true)
  })

  it('fires in campaign mode regardless of week', () => {
    const state = stateWith({ week: 50, inCampaignMode: true })
    expect(event.triggerCondition!(state)).toBe(true)
  })

  it('does not fire before week 155 outside campaign mode', () => {
    const state = stateWith({ week: 154 })
    expect(event.triggerCondition!(state)).toBe(false)
  })

  it('is recurring with 10-week cooldown', () => {
    expect(event.isRecurring).toBe(true)
    expect(event.cooldownWeeks).toBe(10)
  })
})

describe('stomach-infrastructure-pressure: choices', () => {
  const event = findEvent('stomach-infrastructure-pressure')
  const baseState = stateWith({ week: 160, inCampaignMode: true })

  it('distribute-food-cash: drains cash, raises corruption, boosts Alimosho', () => {
    const after = resolveEvent(baseState, event, 'distribute-food-cash')
    expect(after.stats.cashReserve).toBeLessThan(STARTING_STATE.stats.cashReserve)
    expect(after.stats.corruptionPressure).toBeGreaterThan(STARTING_STATE.stats.corruptionPressure)
    expect(after.constituencyApproval.alimosho).toBeGreaterThan(
      STARTING_STATE.constituencyApproval.alimosho,
    )
  })

  it('resist-and-build: improves infrastructure, drains PC, hurts Alimosho', () => {
    const after = resolveEvent(baseState, event, 'resist-and-build')
    expect(after.stats.infrastructureScore).toBeGreaterThan(STARTING_STATE.stats.infrastructureScore)
    expect(after.stats.politicalCapital).toBeLessThan(STARTING_STATE.stats.politicalCapital)
    expect(after.constituencyApproval.alimosho).toBeLessThan(
      STARTING_STATE.constituencyApproval.alimosho,
    )
  })

  it('empowerment-kits: minimal cash cost, hurts civil society', () => {
    const after = resolveEvent(baseState, event, 'empowerment-kits')
    expect(after.stats.cashReserve).toBeCloseTo(STARTING_STATE.stats.cashReserve - 1, 5)
    expect(after.factions.civilSocietyMedia).toBeLessThan(STARTING_STATE.factions.civilSocietyMedia)
  })
})

describe('rally-funding-demand: trigger and choices', () => {
  const event = findEvent('rally-funding-demand')

  it('fires from week 165 with cash > 5', () => {
    const state = stateWith({
      week: 165,
      stats: { ...STARTING_STATE.stats, cashReserve: 20 },
    })
    expect(event.triggerCondition!(state)).toBe(true)
  })

  it('does not fire when cash <= 5', () => {
    const state = stateWith({
      week: 165,
      stats: { ...STARTING_STATE.stats, cashReserve: 4 },
    })
    expect(event.triggerCondition!(state)).toBe(false)
  })

  it('fund-rallies-from-infra: drains cash and infrastructure', () => {
    const baseState = stateWith({ week: 165, inCampaignMode: true })
    const after = resolveEvent(baseState, event, 'fund-rallies-from-infra')
    expect(after.stats.cashReserve).toBeCloseTo(STARTING_STATE.stats.cashReserve - 1.5, 5)
    expect(after.stats.infrastructureScore).toBeLessThan(STARTING_STATE.stats.infrastructureScore)
  })

  it('digital-campaign-only: hurts LG chairmen, boosts civil society', () => {
    const baseState = stateWith({ week: 165, inCampaignMode: true })
    const after = resolveEvent(baseState, event, 'digital-campaign-only')
    expect(after.factions.lgChairmen).toBeLessThan(STARTING_STATE.factions.lgChairmen)
    expect(after.factions.civilSocietyMedia).toBeGreaterThan(STARTING_STATE.factions.civilSocietyMedia)
  })
})

// ─── Cat 3: G-18 Quorum Maneuver ─────────────────────────────────────────────

describe('assembly-quorum-maneuver: trigger conditions', () => {
  const event = findEvent('assembly-quorum-maneuver')

  it('fires when partyGodfathers < 22 AND hostile insider is active', () => {
    const state = stateWith({
      week: 60,
      factions: { ...STARTING_STATE.factions, partyGodfathers: 20 },
      activeNPCs: {
        ...STARTING_STATE.activeNPCs,
        npc1: {
          isActive: true,
          relationship: 20,
          pressure: 0,
          archetypeKey: 'insider',
          name: 'Emeka',
        },
      },
    })
    expect(event.triggerCondition!(state)).toBe(true)
  })

  it('fires when partyGodfathers < 15 regardless of insider', () => {
    const state = stateWith({
      week: 60,
      factions: { ...STARTING_STATE.factions, partyGodfathers: 12 },
    })
    expect(event.triggerCondition!(state)).toBe(true)
  })

  it('does not fire before week 52', () => {
    const state = stateWith({
      week: 40,
      factions: { ...STARTING_STATE.factions, partyGodfathers: 10 },
    })
    expect(event.triggerCondition!(state)).toBe(false)
  })

  it('does not fire when partyGodfathers >= 22 and no insider is hostile', () => {
    const state = stateWith({
      week: 80,
      factions: { ...STARTING_STATE.factions, partyGodfathers: 22 },
    })
    expect(event.triggerCondition!(state)).toBe(false)
  })

  it('is recurring with 18-week cooldown', () => {
    expect(event.isRecurring).toBe(true)
    expect(event.cooldownWeeks).toBe(18)
  })
})

describe('assembly-quorum-maneuver: invoke-populist-shield choice', () => {
  const event = findEvent('assembly-quorum-maneuver')

  it('sets populist-shield-invoked flag to true', () => {
    const baseState = stateWith({ week: 60, factions: { ...STARTING_STATE.factions, partyGodfathers: 15 } })
    const after = resolveEvent(baseState, event, 'invoke-populist-shield')
    expect(after.stateFlags['populist-shield-invoked']).toBe(true)
  })

  it('costs 15 PC', () => {
    const baseState = stateWith({ week: 60, factions: { ...STARTING_STATE.factions, partyGodfathers: 15 } })
    const after = resolveEvent(baseState, event, 'invoke-populist-shield')
    expect(after.stats.politicalCapital).toBeCloseTo(
      STARTING_STATE.stats.politicalCapital - 15,
      5,
    )
  })
})

// ─── Cat 3: Populist Shield Outcomes ─────────────────────────────────────────

describe('populist-shield-success: trigger and outcome', () => {
  const event = findEvent('populist-shield-success')

  it('fires when flag is set AND infra > 60 AND trust > 55', () => {
    const state = stateWith({
      stateFlags: { 'populist-shield-invoked': true },
      stats: {
        ...STARTING_STATE.stats,
        infrastructureScore: 65,
        publicTrust: 60,
      },
    })
    expect(event.triggerCondition!(state)).toBe(true)
  })

  it('does not fire when flag is false', () => {
    const state = stateWith({
      stateFlags: { 'populist-shield-invoked': false },
      stats: { ...STARTING_STATE.stats, infrastructureScore: 70, publicTrust: 70 },
    })
    expect(event.triggerCondition!(state)).toBe(false)
  })

  it('does not fire when infra <= 60', () => {
    const state = stateWith({
      stateFlags: { 'populist-shield-invoked': true },
      stats: { ...STARTING_STATE.stats, infrastructureScore: 60, publicTrust: 70 },
    })
    expect(event.triggerCondition!(state)).toBe(false)
  })

  it('does not fire when trust <= 55', () => {
    const state = stateWith({
      stateFlags: { 'populist-shield-invoked': true },
      stats: { ...STARTING_STATE.stats, infrastructureScore: 65, publicTrust: 55 },
    })
    expect(event.triggerCondition!(state)).toBe(false)
  })

  it('victory: partyGodfathers +10, publicTrust +8, PC +20', () => {
    const baseState = stateWith({
      stateFlags: { 'populist-shield-invoked': true },
      stats: { ...STARTING_STATE.stats, infrastructureScore: 65, publicTrust: 60 },
    })
    const after = resolveEvent(baseState, event, 'accept-shield-victory')
    expect(after.factions.partyGodfathers).toBe(STARTING_STATE.factions.partyGodfathers + 10)
    expect(after.stats.publicTrust).toBeGreaterThan(STARTING_STATE.stats.publicTrust)
    expect(after.stats.politicalCapital).toBeGreaterThan(STARTING_STATE.stats.politicalCapital)
  })

  it('victory: clears populist-shield-invoked flag', () => {
    const baseState = stateWith({
      stateFlags: { 'populist-shield-invoked': true },
      stats: { ...STARTING_STATE.stats, infrastructureScore: 65, publicTrust: 60 },
    })
    const after = resolveEvent(baseState, event, 'accept-shield-victory')
    expect(after.stateFlags['populist-shield-invoked']).toBe(false)
  })
})

describe('populist-shield-fail: trigger and outcome', () => {
  const event = findEvent('populist-shield-fail')

  it('fires when flag is set AND conditions NOT met', () => {
    const state = stateWith({
      stateFlags: { 'populist-shield-invoked': true },
      stats: { ...STARTING_STATE.stats, infrastructureScore: 50, publicTrust: 50 },
    })
    expect(event.triggerCondition!(state)).toBe(true)
  })

  it('fires when flag set AND only infra condition fails', () => {
    const state = stateWith({
      stateFlags: { 'populist-shield-invoked': true },
      stats: { ...STARTING_STATE.stats, infrastructureScore: 55, publicTrust: 70 },
    })
    expect(event.triggerCondition!(state)).toBe(true)
  })

  it('does not fire when success conditions are met', () => {
    const state = stateWith({
      stateFlags: { 'populist-shield-invoked': true },
      stats: { ...STARTING_STATE.stats, infrastructureScore: 65, publicTrust: 60 },
    })
    expect(event.triggerCondition!(state)).toBe(false)
  })

  it('exactly one of success/fail fires for any given flag+stats combination', () => {
    const successEvent = findEvent('populist-shield-success')
    const failEvent = findEvent('populist-shield-fail')

    // High infra/trust: only success fires
    const stateHigh = stateWith({
      stateFlags: { 'populist-shield-invoked': true },
      stats: { ...STARTING_STATE.stats, infrastructureScore: 70, publicTrust: 65 },
    })
    expect(successEvent.triggerCondition!(stateHigh)).toBe(true)
    expect(failEvent.triggerCondition!(stateHigh)).toBe(false)

    // Low infra/trust: only fail fires
    const stateLow = stateWith({
      stateFlags: { 'populist-shield-invoked': true },
      stats: { ...STARTING_STATE.stats, infrastructureScore: 45, publicTrust: 40 },
    })
    expect(successEvent.triggerCondition!(stateLow)).toBe(false)
    expect(failEvent.triggerCondition!(stateLow)).toBe(true)
  })

  it('failure: partyGodfathers -12, publicTrust -8, chains to removal-resolution-reading', () => {
    const baseState = stateWith({
      stateFlags: { 'populist-shield-invoked': true },
      stats: { ...STARTING_STATE.stats, infrastructureScore: 40, publicTrust: 40 },
    })
    const after = resolveEvent(baseState, event, 'regroup-after-failure')
    expect(after.factions.partyGodfathers).toBe(STARTING_STATE.factions.partyGodfathers - 12)
    expect(after.stats.publicTrust).toBeLessThan(STARTING_STATE.stats.publicTrust)
    expect(after.stateFlags['populist-shield-invoked']).toBe(false)
    expect(after.eventQueue.some((e) => e.id === 'removal-resolution-reading')).toBe(true)
  })
})

// ─── Cat 3: Neighboring Sanctuary ────────────────────────────────────────────

describe('neighboring-sanctuary-offer: trigger conditions', () => {
  const event = findEvent('neighboring-sanctuary-offer')

  it('fires when impeachmentStage >= 1 AND partyGodfathers < 18', () => {
    const state = stateWith({
      impeachmentStage: 1,
      factions: { ...STARTING_STATE.factions, partyGodfathers: 15 },
    })
    expect(event.triggerCondition!(state)).toBe(true)
  })

  it('does not fire when sanctuary-offer-resolved is set', () => {
    const state = stateWith({
      impeachmentStage: 1,
      factions: { ...STARTING_STATE.factions, partyGodfathers: 15 },
      stateFlags: { 'sanctuary-offer-resolved': true },
    })
    expect(event.triggerCondition!(state)).toBe(false)
  })

  it('does not fire when partyGodfathers >= 18', () => {
    const state = stateWith({
      impeachmentStage: 1,
      factions: { ...STARTING_STATE.factions, partyGodfathers: 20 },
    })
    expect(event.triggerCondition!(state)).toBe(false)
  })

  it('does not fire when impeachmentStage is 0', () => {
    const state = stateWith({
      impeachmentStage: 0,
      factions: { ...STARTING_STATE.factions, partyGodfathers: 10 },
    })
    expect(event.triggerCondition!(state)).toBe(false)
  })
})

describe('neighboring-sanctuary-offer: choices', () => {
  const event = findEvent('neighboring-sanctuary-offer')
  const baseState = stateWith({
    impeachmentStage: 1,
    factions: { ...STARTING_STATE.factions, partyGodfathers: 15 },
  })

  it('accept-sanctuary: PC +80, trust -5, partyGodfathers -15, sets flags', () => {
    const after = resolveEvent(baseState, event, 'accept-sanctuary')
    expect(after.stats.politicalCapital).toBeCloseTo(
      STARTING_STATE.stats.politicalCapital + 80,
      5,
    )
    expect(after.stats.publicTrust).toBeLessThan(STARTING_STATE.stats.publicTrust)
    expect(after.factions.partyGodfathers).toBe(15 - 15) // base was overridden to 15
    expect(after.stateFlags['sanctuary-accepted']).toBe(true)
    expect(after.stateFlags['sanctuary-offer-resolved']).toBe(true)
  })

  it('refuse-sanctuary: trust +5, does NOT set sanctuary-accepted', () => {
    const after = resolveEvent(baseState, event, 'refuse-sanctuary')
    expect(after.stats.publicTrust).toBeGreaterThan(STARTING_STATE.stats.publicTrust)
    expect(after.stateFlags['sanctuary-accepted']).toBeFalsy()
    expect(after.stateFlags['sanctuary-offer-resolved']).toBe(true)
  })
})
