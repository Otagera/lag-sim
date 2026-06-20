import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { EventCard } from '../EventCard'
import { useGameStore } from '../../state/gameStore'
import { STARTING_STATE } from '../../data/startingState'
import type { EventCard as EventCardType } from '../../state/types'

beforeEach(() => {
  useGameStore.setState(STARTING_STATE)
})

const testEvent: EventCardType = {
  id: 'test-event-card',
  title: 'Test Event Title',
  body: 'Test event body text.',
  severity: 'medium',
  category: 'political',
  choices: [
    {
      id: 'choice-a',
      label: 'Choice A',
      description: 'Description of A',
      immediate: { cashReserve: 5 },
      factionImpact: { businessCommunity: 3 },
    },
    {
      id: 'choice-b',
      label: 'Choice B',
      description: 'Description of B',
      immediate: { cashReserve: -3 },
      factionImpact: { businessCommunity: -2 },
    },
  ],
}

describe('EventCard', () => {
  it('shows placeholder text when no active event', () => {
    render(<EventCard />)
    expect(screen.getByText(/No active event/)).toBeInTheDocument()
  })

  it('renders event title, body, and choices', () => {
    useGameStore.setState({ activeEvent: testEvent })

    render(<EventCard />)

    expect(screen.getByText('Test Event Title')).toBeInTheDocument()
    expect(screen.getByText('Test event body text.')).toBeInTheDocument()
    expect(screen.getByText('Choice A')).toBeInTheDocument()
    expect(screen.getByText('Choice B')).toBeInTheDocument()
  })

  it('calls resolveEvent with choice id on click', () => {
    useGameStore.setState({ activeEvent: testEvent })

    render(<EventCard />)
    fireEvent.click(screen.getByText('Choice A'))

    const state = useGameStore.getState()
    expect(state.activeEvent).toBeNull()
    expect(state.eventsResolvedThisWeek).toBe(1)
  })

  it('applies stat and faction effects from choice', () => {
    useGameStore.setState({ activeEvent: testEvent })

    render(<EventCard />)
    fireEvent.click(screen.getByText('Choice A'))

    const state = useGameStore.getState()
    expect(state.stats.cashReserve).toBe(50) // 45 + 5
    expect(state.factions.businessCommunity).toBe(58) // 55 + 3
  })

  it('shows different choices and applies their effects', () => {
    useGameStore.setState({ activeEvent: testEvent })

    render(<EventCard />)
    fireEvent.click(screen.getByText('Choice B'))

    const state = useGameStore.getState()
    expect(state.stats.cashReserve).toBe(42) // 45 - 3
    expect(state.factions.businessCommunity).toBe(53) // 55 - 2
  })

  it('shows severity label for critical event', () => {
    const criticalEvent = { ...testEvent, severity: 'critical' as const }
    useGameStore.setState({ activeEvent: criticalEvent })

    render(<EventCard />)
    expect(screen.getByText('Critical')).toBeInTheDocument()
  })
})
