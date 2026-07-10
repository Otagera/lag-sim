import { describe, it, expect, vi, afterEach } from 'vitest'
import { STARTING_STATE } from '../../data/startingState'
import type { GameState } from '../../state/types'
import { resolveEvent, drawNextEvent, ALL_EVENTS } from '../eventEngine'
import { chainEvents } from '../../data/events/chains'

function clone(s: GameState): GameState {
  return JSON.parse(JSON.stringify(s))
}

// Helpers to get specific events
const ghostWorkerEvent = () => ALL_EVENTS.find((e) => e.id === 'lasg-ghost-workers')!
const commEvent = () => ALL_EVENTS.find((e) => e.id === 'commissioner-works-appointment')!
const makokoEvent = () => ALL_EVENTS.find((e) => e.id === 'makoko-demolition-order')!
const chainEvent = (id: string) => chainEvents.find((e) => e.id === id)!

describe('stateFlags — plumbing', () => {
  it('stateFlags starts as empty object', () => {
    expect(STARTING_STATE.stateFlags).toEqual({})
  })

  it('resolveEvent merges setFlags into state.stateFlags', () => {
    const state = clone(STARTING_STATE)
    const result = resolveEvent(state, ghostWorkerEvent(), 'immediate-purge')
    expect(result.stateFlags['ghost-purge-aggressive']).toBe(true)
    expect(result.stateFlags['ghost-purge-quiet']).toBeUndefined()
  })

  it('resolveEvent sets different flag for quiet phased path', () => {
    const state = clone(STARTING_STATE)
    const result = resolveEvent(state, ghostWorkerEvent(), 'quiet-phased-removal')
    expect(result.stateFlags['ghost-purge-quiet']).toBe(true)
    expect(result.stateFlags['ghost-purge-aggressive']).toBeUndefined()
  })

  it('setFlags accumulates across multiple resolved events', () => {
    let state = clone({ ...STARTING_STATE, week: 2 })
    state = resolveEvent(state, ghostWorkerEvent(), 'immediate-purge')
    state = resolveEvent(state, commEvent(), 'appoint-adesoji')
    expect(state.stateFlags['ghost-purge-aggressive']).toBe(true)
    expect(state.stateFlags['commissioner-works-godfather']).toBe(true)
  })

  it('choices without setFlags do not modify stateFlags', () => {
    const state = clone(STARTING_STATE)
    const result = resolveEvent(state, ghostWorkerEvent(), 'sit-on-it')
    expect(result.stateFlags).toEqual({})
  })

  it('setFlags does not overwrite pre-existing unrelated flags', () => {
    const state = clone({ ...STARTING_STATE, stateFlags: { 'pre-existing-flag': true } })
    const result = resolveEvent(state, makokoEvent(), 'execute-order')
    expect(result.stateFlags['pre-existing-flag']).toBe(true)
    expect(result.stateFlags['makoko-demolished']).toBe(true)
  })

  it('all four chain-triggering choices set their flags', () => {
    let state = clone({ ...STARTING_STATE, week: 2 })
    state = resolveEvent(state, ghostWorkerEvent(), 'immediate-purge')
    expect(state.stateFlags['ghost-purge-aggressive']).toBe(true)

    state = clone(STARTING_STATE)
    state = resolveEvent(state, ghostWorkerEvent(), 'quiet-phased-removal')
    expect(state.stateFlags['ghost-purge-quiet']).toBe(true)

    state = clone({ ...STARTING_STATE, week: 2 })
    state = resolveEvent(state, commEvent(), 'appoint-adesoji')
    expect(state.stateFlags['commissioner-works-godfather']).toBe(true)

    state = clone(STARTING_STATE)
    state = resolveEvent(state, makokoEvent(), 'execute-order')
    expect(state.stateFlags['makoko-demolished']).toBe(true)
  })
})

describe('stateFlags — triggerCondition evaluation', () => {
  // These directly test the gate logic on each chain event

  it('union-court-injunction: false without flag', () => {
    const state = clone({ ...STARTING_STATE, resolvedEvents: ['ghost-worker-strike-negotiation'] })
    expect(chainEvent('union-court-injunction').triggerCondition?.(state)).toBe(false)
  })

  it('union-court-injunction: false with flag but strike not resolved', () => {
    const state = clone({ ...STARTING_STATE, stateFlags: { 'ghost-purge-aggressive': true } })
    expect(chainEvent('union-court-injunction').triggerCondition?.(state)).toBe(false)
  })

  it('union-court-injunction: true with flag AND strike resolved', () => {
    const state = clone({
      ...STARTING_STATE,
      resolvedEvents: ['ghost-worker-strike-negotiation'],
      stateFlags: { 'ghost-purge-aggressive': true },
    })
    expect(chainEvent('union-court-injunction').triggerCondition?.(state)).toBe(true)
  })

  it('union-work-to-rule: false without flag even at week 20', () => {
    const state = clone({ ...STARTING_STATE, week: 20 })
    expect(chainEvent('union-work-to-rule').triggerCondition?.(state)).toBe(false)
  })

  it('union-work-to-rule: false with flag but before week 20', () => {
    const state = clone({
      ...STARTING_STATE,
      week: 15,
      stateFlags: { 'ghost-purge-quiet': true },
    })
    expect(chainEvent('union-work-to-rule').triggerCondition?.(state)).toBe(false)
  })

  it('union-work-to-rule: true with flag at week 20', () => {
    const state = clone({
      ...STARTING_STATE,
      week: 20,
      stateFlags: { 'ghost-purge-quiet': true },
    })
    expect(chainEvent('union-work-to-rule').triggerCondition?.(state)).toBe(true)
  })

  it('works-tender-scandal: false without flag even at week 30', () => {
    const state = clone({ ...STARTING_STATE, week: 30 })
    expect(chainEvent('works-tender-scandal').triggerCondition?.(state)).toBe(false)
  })

  it('works-tender-scandal: false with flag but before week 30', () => {
    const state = clone({
      ...STARTING_STATE,
      week: 20,
      stateFlags: { 'commissioner-works-godfather': true },
    })
    expect(chainEvent('works-tender-scandal').triggerCondition?.(state)).toBe(false)
  })

  it('works-tender-scandal: true with flag at week 30', () => {
    const state = clone({
      ...STARTING_STATE,
      week: 30,
      stateFlags: { 'commissioner-works-godfather': true },
    })
    expect(chainEvent('works-tender-scandal').triggerCondition?.(state)).toBe(true)
  })

  it('makoko-land-grab-exposed: false without flag', () => {
    const state = clone({
      ...STARTING_STATE,
      resolvedEvents: ['makoko-demolition-order'],
    })
    expect(chainEvent('makoko-land-grab-exposed').triggerCondition?.(state)).toBe(false)
  })

  it('makoko-land-grab-exposed: false with flag but event not in resolvedEvents', () => {
    const state = clone({
      ...STARTING_STATE,
      stateFlags: { 'makoko-demolished': true },
    })
    expect(chainEvent('makoko-land-grab-exposed').triggerCondition?.(state)).toBe(false)
  })

  it('makoko-land-grab-exposed: true with flag AND event resolved', () => {
    const state = clone({
      ...STARTING_STATE,
      resolvedEvents: ['makoko-demolition-order'],
      stateFlags: { 'makoko-demolished': true },
    })
    expect(chainEvent('makoko-land-grab-exposed').triggerCondition?.(state)).toBe(true)
  })

  it('ghost-purge flags are mutually exclusive — quiet flag does not trigger aggressive chain', () => {
    const state = clone({
      ...STARTING_STATE,
      resolvedEvents: ['ghost-worker-strike-negotiation'],
      stateFlags: { 'ghost-purge-quiet': true },
    })
    expect(chainEvent('union-court-injunction').triggerCondition?.(state)).toBe(false)
  })
})

describe('stateFlags — drawNextEvent integration', () => {
  afterEach(() => vi.restoreAllMocks())

  it('drawNextEvent picks union-court-injunction when it is the only triggered event', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    // Resolve all other events that could trigger, leaving only union-court-injunction eligible
    const allOtherIds = ALL_EVENTS
      .filter((e) => e.triggerCondition && e.id !== 'union-court-injunction')
      .map((e) => e.id)

    const state = clone({
      ...STARTING_STATE,
      week: 10,
      activeEvent: null,
      eventsResolvedThisWeek: 0,
      resolvedEvents: [...allOtherIds, 'ghost-worker-strike-negotiation'],
      stateFlags: { 'ghost-purge-aggressive': true },
    })
    const event = drawNextEvent(state)
    expect(event?.id).toBe('union-court-injunction')
  })

  it('drawNextEvent picks makoko-land-grab-exposed when it is the only triggered event', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const allOtherIds = ALL_EVENTS
      .filter((e) => e.triggerCondition && e.id !== 'makoko-land-grab-exposed')
      .map((e) => e.id)

    const state = clone({
      ...STARTING_STATE,
      week: 10,
      activeEvent: null,
      eventsResolvedThisWeek: 0,
      resolvedEvents: [...allOtherIds, 'makoko-demolition-order'],
      stateFlags: { 'makoko-demolished': true },
    })
    const event = drawNextEvent(state)
    expect(event?.id).toBe('makoko-land-grab-exposed')
  })
})
