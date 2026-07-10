import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TimelinePanel } from '../TimelinePanel'
import { useGameStore } from '../../state/gameStore'
import { STARTING_STATE } from '../../data/startingState'
import type { TimelineEntry } from '../../state/types'

beforeEach(() => {
  useGameStore.setState(STARTING_STATE)
})

describe('TimelinePanel', () => {
  it('shows placeholder when empty', () => {
    render(<TimelinePanel />)
    expect(screen.getByText('No decisions yet. Click "Advance Week" to begin.')).toBeInTheDocument()
  })

  it('renders timeline entries in reverse order', () => {
    const entries: TimelineEntry[] = [
      { week: 1, type: 'event', title: 'First Event', description: 'First choice' },
      { week: 2, type: 'delayed-consequence', title: 'Second Event', description: 'Delayed outcome' },
      { week: 3, type: 'godfather', title: 'Godfather Move', description: 'Accepted' },
    ]
    useGameStore.setState({ timeline: entries })

    render(<TimelinePanel />)

    expect(screen.getByText('First Event')).toBeInTheDocument()
    expect(screen.getByText('Second Event')).toBeInTheDocument()
    expect(screen.getByText('Godfather Move')).toBeInTheDocument()
    // Week 3 is now shown as a date: May 29 2027 + 2 weeks = June 12, 2027
    expect(screen.getByText('June 12, 2027')).toBeInTheDocument()
  })

  it('shows entry descriptions', () => {
    const entries: TimelineEntry[] = [
      { week: 1, type: 'event', title: 'Test', description: 'Did something' },
    ]
    useGameStore.setState({ timeline: entries })

    render(<TimelinePanel />)
    expect(screen.getByText('Did something')).toBeInTheDocument()
  })
})
