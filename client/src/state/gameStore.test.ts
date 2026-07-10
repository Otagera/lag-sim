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

  it('launchPrestigeAction: instant action applies PC and sets cooldown', () => {
    useGameStore.getState().launchPrestigeAction('media-blitz')
    const state = useGameStore.getState()
    expect(state.stats.politicalCapital).toBe(105) // 100 + 5
    expect(state.stats.cashReserve).toBe(44) // 45 - 1
    expect(state.prestigeCooldowns['prestige-media-blitz']).toBe(5) // week 1 + 4wk cooldown
    expect(state.activeInitiative).toBeNull()
  })

  it('launchPrestigeAction: timed action starts initiative and deducts cash', () => {
    useGameStore.getState().launchPrestigeAction('diaspora-roadshow')
    const state = useGameStore.getState()
    expect(state.activeInitiative).not.toBeNull()
    expect(state.activeInitiative!.id).toBe('diaspora-roadshow')
    expect(state.activeInitiative!.pcReward).toBe(12)
    expect(state.activeInitiative!.completionEventId).toBe('')
    expect(state.activeInitiative!.weeksRemaining).toBe(4)
    expect(state.stats.cashReserve).toBe(40) // 45 - 5
    expect(state.stats.politicalCapital).toBe(100) // unchanged by launch
    expect(state.factions.partyGodfathers).toBe(68) // 65 + 3
  })

  it('launchPrestigeAction: does not start timed action when initiative slot busy', () => {
    useGameStore.setState({
      activeInitiative: {
        id: 'existing',
        name: 'Existing Initiative',
        weeksRemaining: 5,
        totalWeeks: 5,
        completionEventId: 'existing-completion',
      },
    })
    useGameStore.getState().launchPrestigeAction('chair-governors-forum')
    const state = useGameStore.getState()
    expect(state.activeInitiative!.id).toBe('existing') // unchanged
    expect(state.stats.politicalCapital).toBe(100) // unchanged
  })

  it('launchPrestigeAction: does nothing for unknown id', () => {
    useGameStore.getState().launchPrestigeAction('non-existent')
    const state = useGameStore.getState()
    expect(state.stats.politicalCapital).toBe(100)
    expect(state.stats.cashReserve).toBe(45)
  })

  it('launchPrestigeAction: does not launch if insufficient cash', () => {
    useGameStore.setState({ stats: { ...useGameStore.getState().stats, cashReserve: 1 } })
    useGameStore.getState().launchPrestigeAction('host-investment-summit')
    const state = useGameStore.getState()
    expect(state.stats.cashReserve).toBe(1) // unchanged
    expect(state.activeInitiative).toBeNull()
  })

  it('launchPrestigeAction: does not launch instant action on cooldown', () => {
    useGameStore.getState().launchPrestigeAction('media-blitz')
    // Try again immediately
    useGameStore.getState().launchPrestigeAction('media-blitz')
    const state = useGameStore.getState()
    // PC should only be +5 once
    expect(state.stats.politicalCapital).toBe(105)
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
