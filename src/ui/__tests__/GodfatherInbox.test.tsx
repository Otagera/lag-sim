import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { GodfatherInbox } from '../GodfatherInbox'
import { useGameStore } from '../../state/gameStore'
import { STARTING_STATE } from '../../data/startingState'
import type { GodfatherMessage } from '../../state/types'

beforeEach(() => {
  useGameStore.setState(STARTING_STATE)
})

describe('GodfatherInbox', () => {
  it('shows no messages placeholder when empty', () => {
    render(<GodfatherInbox />)
    expect(screen.getByText('No messages yet.')).toBeInTheDocument()
  })

  it('shows active message with accept/refuse buttons', () => {
    const message: GodfatherMessage = {
      id: 'test-msg',
      week: 5,
      text: 'Do this favour for me.',
      ask: {
        type: 'contract',
        description: 'A small favour',
        onAccept: { corruptionPressure: 2, factionImpact: { partyGodfathers: 3 } },
        onRefuse: { factionImpact: { partyGodfathers: -3 } },
      },
    }
    useGameStore.setState({ activeGodfatherMessage: message })

    render(<GodfatherInbox />)

    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('Do this favour for me.')).toBeInTheDocument()
    expect(screen.getByText('A small favour')).toBeInTheDocument()
    expect(screen.getByText('Accept')).toBeInTheDocument()
    expect(screen.getByText('Refuse')).toBeInTheDocument()
  })

  it('calls acceptGodfather when Accept is clicked', () => {
    const message: GodfatherMessage = {
      id: 'test-msg-2',
      week: 5,
      text: 'Accept this.',
      ask: {
        type: 'money',
        description: 'A request',
        onAccept: { cashReserve: -0.5, factionImpact: { partyGodfathers: 5 } },
        onRefuse: { factionImpact: { partyGodfathers: -5 } },
      },
    }
    useGameStore.setState({ activeGodfatherMessage: message })
    vi.spyOn(useGameStore.getState(), 'acceptGodfather')

    render(<GodfatherInbox />)
    fireEvent.click(screen.getByText('Accept'))

    // The action was called (spy verifies)
    // State should have been updated
    const state = useGameStore.getState()
    expect(state.godfatherMessages).toHaveLength(1)
    expect(state.activeGodfatherMessage).toBeNull()
  })

  it('calls refuseGodfather when Refuse is clicked', () => {
    const message: GodfatherMessage = {
      id: 'test-msg-3',
      week: 5,
      text: 'Refuse this.',
      ask: {
        type: 'contract',
        description: 'Another request',
        onAccept: { factionImpact: { partyGodfathers: 3 } },
        onRefuse: { factionImpact: { partyGodfathers: -3 } },
      },
    }
    useGameStore.setState({ activeGodfatherMessage: message })

    render(<GodfatherInbox />)
    fireEvent.click(screen.getByText('Refuse'))

    const state = useGameStore.getState()
    expect(state.godfatherRefusalCount).toBe(1)
    expect(state.activeGodfatherMessage).toBeNull()
  })

  it('shows escalation warning at refusal count 2', () => {
    useGameStore.setState({ godfatherRefusalCount: 2 })

    const message: GodfatherMessage = {
      id: 'test-warn',
      week: 5,
      text: 'Warning test.',
      ask: {
        type: 'appointment',
        description: 'Warning',
        onAccept: { factionImpact: { partyGodfathers: 3 } },
        onRefuse: { factionImpact: { partyGodfathers: -3 } },
      },
    }
    useGameStore.setState({ activeGodfatherMessage: message })

    render(<GodfatherInbox />)
    expect(screen.getByText('He is becoming impatient.')).toBeInTheDocument()
  })

  it('shows escalation warning at refusal count 3', () => {
    useGameStore.setState({ godfatherRefusalCount: 3 })

    const message: GodfatherMessage = {
      id: 'test-warn-3',
      week: 5,
      text: 'Final warning.',
      ask: {
        type: 'suppress',
        description: 'Final',
        onAccept: { factionImpact: { partyGodfathers: 3 } },
        onRefuse: { factionImpact: { partyGodfathers: -3 } },
      },
    }
    useGameStore.setState({ activeGodfatherMessage: message })

    render(<GodfatherInbox />)
    expect(screen.getByText('He will not ask a fourth time.')).toBeInTheDocument()
  })

  it('shows history when there are past messages and no active message', () => {
    const pastMessage: GodfatherMessage = {
      id: 'past-msg',
      week: 3,
      text: 'Past message.',
      ask: {
        type: 'money',
        description: 'Past',
        onAccept: { factionImpact: {} },
        onRefuse: { factionImpact: {} },
      },
    }
    useGameStore.setState({
      godfatherMessages: [pastMessage],
      activeGodfatherMessage: null,
    })

    render(<GodfatherInbox />)
    expect(screen.getByText('Past message.')).toBeInTheDocument()
    expect(screen.getByText(/Week 3/)).toBeInTheDocument()
    expect(screen.queryByText('No messages yet.')).not.toBeInTheDocument()
  })
})
