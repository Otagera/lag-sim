import { describe, it, expect, vi, beforeEach } from 'vitest'
import { STARTING_STATE } from '../data/startingState'
import type { EventCard, GodfatherMessage } from './types'
import { useGameStore } from './gameStore'

describe('gameStore', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    useGameStore.setState(STARTING_STATE)
  })

  it('initializes with starting state', () => {
    const state = useGameStore.getState()
    expect(state.week).toBe(1)
    expect(state.stats.cashReserve).toBe(45)
    expect(state.activeEvent).toBeNull()
  })

  it('tick advances week by 1', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    useGameStore.getState().tick()
    const state = useGameStore.getState()
    expect(state.week).toBe(2)
  })

  it('tick applies budget and changes cash reserve', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const before = useGameStore.getState().stats.cashReserve
    useGameStore.getState().tick()
    const after = useGameStore.getState().stats.cashReserve
    expect(after).not.toBe(before)
  })

  it('resolveEvent does nothing when no activeEvent', () => {
    useGameStore.getState().resolveEvent('some-choice')
    const state = useGameStore.getState()
    expect(state.activeEvent).toBeNull()
  })

  it('resolveEvent clears activeEvent and applies stat changes', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)

    // Manually set an active event
    const event: EventCard = {
      id: 'store-test-event',
      title: 'Store Test',
      body: 'Testing store',
      severity: 'low',
      category: 'political',
      choices: [
        {
          id: 'c1',
          label: 'Choice 1',
          description: 'Description 1',
          immediate: { cashReserve: 10 },
          factionImpact: {},
        },
      ],
    }

    useGameStore.setState({ activeEvent: event })
    expect(useGameStore.getState().activeEvent).not.toBeNull()

    useGameStore.getState().resolveEvent('c1')
    const state = useGameStore.getState()
    expect(state.activeEvent).toBeNull()
    expect(state.stats.cashReserve).toBe(55) // 45 + 10
    expect(state.eventsResolvedThisWeek).toBe(1)
  })

  it('acceptGodfather does nothing when no activeGodfatherMessage', () => {
    useGameStore.getState().acceptGodfather()
    const state = useGameStore.getState()
    expect(state.godfatherMessages).toHaveLength(0)
  })

  it('acceptGodfather applies effects from active godfather message', () => {
    const message: GodfatherMessage = {
      id: 'store-test-godfather',
      week: 1,
      text: 'Test ask',
      ask: {
        type: 'contract',
        description: 'Test',
        onAccept: {
          corruptionPressure: 2,
          factionImpact: { partyGodfathers: 5 },
        },
        onRefuse: {
          factionImpact: { partyGodfathers: -5 },
        },
      },
    }

    useGameStore.setState({ activeGodfatherMessage: message })
    useGameStore.getState().acceptGodfather()

    const state = useGameStore.getState()
    expect(state.activeGodfatherMessage).toBeNull()
    expect(state.godfatherMessages).toHaveLength(1)
    expect(state.stats.corruptionPressure).toBe(30) // 28 + 2
    expect(state.factions.partyGodfathers).toBe(70) // 65 + 5
  })

  it('refuseGodfather increments refusal count', () => {
    const message: GodfatherMessage = {
      id: 'store-test-refuse',
      week: 1,
      text: 'Test ask',
      ask: {
        type: 'money',
        description: 'Test',
        onAccept: {
          factionImpact: { partyGodfathers: 3 },
        },
        onRefuse: {
          factionImpact: { partyGodfathers: -4 },
        },
      },
    }

    useGameStore.setState({ activeGodfatherMessage: message })
    useGameStore.getState().refuseGodfather()

    const state = useGameStore.getState()
    expect(state.godfatherRefusalCount).toBe(1)
    expect(state.factions.partyGodfathers).toBe(61) // 65 - 4
  })
})
