import { describe, it, expect } from 'vitest'
import { getArchetypeState, ARCHETYPES, ARCHETYPE_KEY_ORDER } from '../archetypes'
import { STARTING_STATE } from '../startingState'

describe('getArchetypeState — technocrat', () => {
  const s = getArchetypeState('technocrat')

  it('has higher cashReserve than default', () => {
    expect(s.stats.cashReserve).toBeGreaterThan(STARTING_STATE.stats.cashReserve)
    expect(s.stats.cashReserve).toBe(65)
  })

  it('has higher infrastructureScore than default', () => {
    expect(s.stats.infrastructureScore).toBeGreaterThan(STARTING_STATE.stats.infrastructureScore)
  })

  it('starts with zero politicalCapital', () => {
    expect(s.stats.politicalCapital).toBe(0)
  })

  it('starts with low partyGodfathers', () => {
    expect(s.factions.partyGodfathers).toBe(30)
    expect(s.factions.partyGodfathers).toBeLessThan(STARTING_STATE.factions.partyGodfathers)
  })
})

describe('getArchetypeState — loyalist', () => {
  const s = getArchetypeState('loyalist')

  it('starts with maximum politicalCapital', () => {
    expect(s.stats.politicalCapital).toBe(180)
  })

  it('starts with very high partyGodfathers', () => {
    expect(s.factions.partyGodfathers).toBe(90)
  })

  it('starts with low publicTrust', () => {
    expect(s.stats.publicTrust).toBe(35)
    expect(s.stats.publicTrust).toBeLessThan(STARTING_STATE.stats.publicTrust)
  })

  it('starts with high corruptionPressure', () => {
    expect(s.stats.corruptionPressure).toBe(50)
    expect(s.stats.corruptionPressure).toBeGreaterThan(STARTING_STATE.stats.corruptionPressure)
  })
})

describe('getArchetypeState — outsider', () => {
  const s = getArchetypeState('outsider')

  it('starts with high publicTrust', () => {
    expect(s.stats.publicTrust).toBe(75)
    expect(s.stats.publicTrust).toBeGreaterThan(STARTING_STATE.stats.publicTrust)
  })

  it('starts with dominant civilSocietyMedia', () => {
    expect(s.factions.civilSocietyMedia).toBe(80)
  })

  it('starts with thin cash reserves', () => {
    expect(s.stats.cashReserve).toBe(25)
    expect(s.stats.cashReserve).toBeLessThan(STARTING_STATE.stats.cashReserve)
  })

  it('starts with very low partyGodfathers', () => {
    expect(s.factions.partyGodfathers).toBe(20)
  })
})

describe('getArchetypeState — base state integrity', () => {
  it('all archetypes start at week 1', () => {
    for (const key of ARCHETYPE_KEY_ORDER) {
      expect(getArchetypeState(key).week).toBe(1)
    }
  })

  it('all archetypes have empty stateFlags', () => {
    for (const key of ARCHETYPE_KEY_ORDER) {
      expect(getArchetypeState(key).stateFlags).toEqual({})
    }
  })

  it('all archetypes are not game over', () => {
    for (const key of ARCHETYPE_KEY_ORDER) {
      expect(getArchetypeState(key).isGameOver).toBe(false)
    }
  })

  it('getArchetypeState does not mutate STARTING_STATE', () => {
    const before = JSON.stringify(STARTING_STATE)
    getArchetypeState('technocrat')
    getArchetypeState('loyalist')
    getArchetypeState('outsider')
    expect(JSON.stringify(STARTING_STATE)).toBe(before)
  })
})

describe('ARCHETYPES metadata', () => {
  it('all three archetypes have required fields', () => {
    for (const key of ARCHETYPE_KEY_ORDER) {
      const arch = ARCHETYPES[key]
      expect(arch.name).toBeTruthy()
      expect(arch.shortName).toBeTruthy()
      expect(arch.tagline).toBeTruthy()
      expect(arch.description).toBeTruthy()
      expect(arch.strength).toBeTruthy()
      expect(arch.risk).toBeTruthy()
      expect(arch.statPreview.length).toBeGreaterThan(0)
    }
  })
})
