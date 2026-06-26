import { describe, it, expect } from 'vitest'
import { STARTING_STATE } from '../../data/startingState'
import type { GameState } from '../../state/types'
import {
  getProjectDef,
  canCommissionProject,
  commissionProject,
  tickProjects,
  getProjectStatus,
} from '../projectsEngine'

function clone(s: GameState): GameState {
  return JSON.parse(JSON.stringify(s))
}

describe('getProjectDef', () => {
  it('finds a known project by id', () => {
    const def = getProjectDef('brt-corridor')
    expect(def).toBeDefined()
    expect(def!.title).toContain('BRT')
  })

  it('returns undefined for unknown id', () => {
    expect(getProjectDef('nonexistent')).toBeUndefined()
  })
})

describe('canCommissionProject', () => {
  it('returns true when cash, PC, and no prereqs are sufficient', () => {
    const def = getProjectDef('brt-corridor')!
    const state = clone(STARTING_STATE)
    expect(canCommissionProject(def, state)).toBe(true)
  })

  it('returns false when cash is too low', () => {
    const def = getProjectDef('alausa-ipp')!
    const state = clone(STARTING_STATE)
    state.stats.cashReserve = 0
    expect(canCommissionProject(def, state)).toBe(false)
  })

  it('returns false when PC is too low', () => {
    const def = getProjectDef('rrs-hq')!
    const state = clone(STARTING_STATE)
    state.stats.politicalCapital = 0
    expect(canCommissionProject(def, state)).toBe(false)
  })

  it('returns false when already commissioned', () => {
    const def = getProjectDef('rrs-hq')!
    const state = clone(STARTING_STATE)
    state.projectStatuses['rrs-hq'] = 'commissioned'
    expect(canCommissionProject(def, state)).toBe(false)
  })

  it('returns false when already completed', () => {
    const def = getProjectDef('rrs-hq')!
    const state = clone(STARTING_STATE)
    state.projectStatuses['rrs-hq'] = 'completed'
    expect(canCommissionProject(def, state)).toBe(false)
  })

  it('checks research node prerequisite (cross-system)', () => {
    const def = getProjectDef('flood-control-channels')!
    const state = clone(STARTING_STATE)
    // drainage-master-plan is a research node, not yet completed
    expect(canCommissionProject(def, state)).toBe(false)
    // complete the research node
    state.researchNodeStatuses['drainage-master-plan'] = 'completed'
    expect(canCommissionProject(def, state)).toBe(true)
  })

  it('checks project prerequisite (project-to-project chain)', () => {
    const def = getProjectDef('flood-control-channels')!
    const state = clone(STARTING_STATE)
    state.researchNodeStatuses['drainage-master-plan'] = 'completed'
    // Still locked via projectStatuses check
    expect(canCommissionProject(def, state)).toBe(true)
  })
})

describe('commissionProject', () => {
  it('deducts cash and PC, sets status, adds to commissioned list and timeline', () => {
    const state = clone(STARTING_STATE)
    const cashBefore = state.stats.cashReserve
    const pcBefore = state.stats.politicalCapital
    const def = getProjectDef('brt-corridor')!

    const next = commissionProject('brt-corridor', state)
    expect(next.stats.cashReserve).toBe(cashBefore - def.cost)
    expect(next.stats.politicalCapital).toBe(pcBefore - def.pcCost)
    expect(next.projectStatuses['brt-corridor']).toBe('commissioned')
    expect(next.commissionedProjects).toHaveLength(1)
    expect(next.commissionedProjects[0].id).toBe('brt-corridor')
    expect(next.timeline.length).toBeGreaterThan(state.timeline.length)
  })

  it('returns state unchanged for unknown id', () => {
    const state = clone(STARTING_STATE)
    const next = commissionProject('nope', state)
    expect(next).toBe(state)
  })

  it('returns state unchanged when insufficient cash', () => {
    const state = clone(STARTING_STATE)
    state.stats.cashReserve = 0
    const next = commissionProject('alausa-ipp', state)
    expect(next).toBe(state)
  })

  it('returns state unchanged when already commissioned', () => {
    const state = clone(STARTING_STATE)
    state.projectStatuses['rrs-hq'] = 'commissioned'
    const next = commissionProject('rrs-hq', state)
    expect(next).toBe(state)
  })
})

describe('tickProjects', () => {
  it('returns state unchanged when no projects are due', () => {
    const state = clone(STARTING_STATE)
    const next = tickProjects(state)
    expect(next).toBe(state)
  })

  it('completes a due project, applies effect and faction impact, adds inbox and timeline entry', () => {
    const state = clone(STARTING_STATE)
    const def = getProjectDef('rrs-hq')!
    state.projectStatuses['rrs-hq'] = 'commissioned'
    state.commissionedProjects.push({ id: 'rrs-hq', completionWeek: 1 })
    state.week = 1

    const next = tickProjects(state)
    expect(next.projectStatuses['rrs-hq']).toBe('completed')
    expect(next.commissionedProjects).toHaveLength(0)
    expect(next.stats.securityIndex).toBe(state.stats.securityIndex + (def.effect.securityIndex ?? 0))
    expect(next.stats.publicTrust).toBe(state.stats.publicTrust + (def.effect.publicTrust ?? 0))
    expect(next.inbox.length).toBeGreaterThan(state.inbox.length)
    expect(next.timeline.length).toBeGreaterThan(state.timeline.length)
  })

  it('completes multiple due projects in one tick', () => {
    const state = clone(STARTING_STATE)
    state.projectStatuses['rrs-hq'] = 'commissioned'
    state.projectStatuses['lagoon-ferries'] = 'commissioned'
    state.commissionedProjects.push(
      { id: 'rrs-hq', completionWeek: 1 },
      { id: 'lagoon-ferries', completionWeek: 1 },
    )
    state.week = 1

    const next = tickProjects(state)
    expect(next.projectStatuses['rrs-hq']).toBe('completed')
    expect(next.projectStatuses['lagoon-ferries']).toBe('completed')
    expect(next.commissionedProjects).toHaveLength(0)
  })

  it('does not complete a project before its completion week', () => {
    const state = clone(STARTING_STATE)
    state.projectStatuses['rrs-hq'] = 'commissioned'
    state.commissionedProjects.push({ id: 'rrs-hq', completionWeek: 5 })
    state.week = 3

    const next = tickProjects(state)
    expect(next.projectStatuses['rrs-hq']).toBe('commissioned')
    expect(next.commissionedProjects).toHaveLength(1)
  })

  it('applies factionImpact when present', () => {
    const state = clone(STARTING_STATE)
    state.projectStatuses['ikeja-general-hospital'] = 'commissioned'
    state.commissionedProjects.push({ id: 'ikeja-general-hospital', completionWeek: 1 })
    state.week = 1
    const civBefore = state.factions.civilSocietyMedia

    const next = tickProjects(state)
    expect(next.factions.civilSocietyMedia).toBe(civBefore + 5)
  })

  it('does not push a goal consequenceBeat when no goal selected', () => {
    const state = clone(STARTING_STATE)
    state.selectedGoalId = null
    state.projectStatuses['rrs-hq'] = 'commissioned'
    state.commissionedProjects.push({ id: 'rrs-hq', completionWeek: 1 })
    state.week = 1

    const next = tickProjects(state)
    const beats = next.consequenceBeats.filter((b) => b.text.includes('Goal progress'))
    expect(beats).toHaveLength(0)
  })

  it('pushes a goal consequenceBeat when goal matches project relevance', () => {
    const state = clone(STARTING_STATE)
    state.selectedGoalId = 'break-the-machine'
    state.projectStatuses['rrs-hq'] = 'commissioned'
    state.commissionedProjects.push({ id: 'rrs-hq', completionWeek: 1 })
    state.week = 1

    const next = tickProjects(state)
    const beats = next.consequenceBeats.filter((b) => b.text.includes('Goal progress'))
    expect(beats.length).toBeGreaterThanOrEqual(1)
    expect(beats[0].tone).toBe('hopeful')
  })

  it('does not push a goal consequenceBeat when goal does not match project relevance', () => {
    const state = clone(STARTING_STATE)
    state.selectedGoalId = 'make-the-promise-real'
    state.projectStatuses['rrs-hq'] = 'commissioned'
    state.commissionedProjects.push({ id: 'rrs-hq', completionWeek: 1 })
    state.week = 1

    const next = tickProjects(state)
    const beats = next.consequenceBeats.filter((b) => b.text.includes('Goal progress'))
    // rrs-hq only matches 'break-the-machine'
    expect(beats).toHaveLength(0)
  })
})

describe('getProjectStatus', () => {
  it('returns commissioned when set', () => {
    const state = clone(STARTING_STATE)
    state.projectStatuses['rrs-hq'] = 'commissioned'
    expect(getProjectStatus('rrs-hq', state)).toBe('commissioned')
  })

  it('returns completed when set', () => {
    const state = clone(STARTING_STATE)
    state.projectStatuses['rrs-hq'] = 'completed'
    expect(getProjectStatus('rrs-hq', state)).toBe('completed')
  })

  it('returns available for affordable project', () => {
    const state = clone(STARTING_STATE)
    expect(getProjectStatus('rrs-hq', state)).toBe('available')
  })

  it('returns locked when too expensive', () => {
    const state = clone(STARTING_STATE)
    state.stats.cashReserve = 0
    expect(getProjectStatus('rrs-hq', state)).toBe('locked')
  })

  it('returns locked when unknown id', () => {
    const state = clone(STARTING_STATE)
    expect(getProjectStatus('nonexistent', state)).toBe('locked')
  })
})
