import { describe, it, expect } from 'vitest'
import { INITIATIVE_DEFS } from '../initiatives'
import { ALL_EVENTS } from '../../engine/eventEngine'

describe('initiative definitions', () => {
  it('every initiative name/description/totalWeeks is well-formed', () => {
    for (const def of Object.values(INITIATIVE_DEFS)) {
      expect(def.name).toBeTruthy()
      expect(def.description).toBeTruthy()
      expect(def.totalWeeks).toBeGreaterThan(0)
    }
  })

  it('every initiative launch choice in ALL_EVENTS references a valid completion event', () => {
    const eventIds = new Set(ALL_EVENTS.map((e) => e.id))
    for (const event of ALL_EVENTS) {
      for (const choice of event.choices) {
        if (choice.launchInitiative) {
          expect(
            eventIds.has(choice.launchInitiative.completionEventId),
            `Choice "${choice.id}" in event "${event.id}" references completion "${choice.launchInitiative.completionEventId}" which is not in ALL_EVENTS`,
          ).toBe(true)
        }
      }
    }
  })
})
