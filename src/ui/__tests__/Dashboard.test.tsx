import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Dashboard } from '../Dashboard'
import { useGameStore } from '../../state/gameStore'
import { STARTING_STATE } from '../../data/startingState'

beforeEach(() => {
  useGameStore.setState(STARTING_STATE)
})

describe('Dashboard', () => {
  beforeEach(() => {
    useGameStore.setState({ mode: 'simple' })
  })

  it('renders week in week/year format', () => {
    render(<Dashboard />)
    expect(screen.getByText('Wk 1, Yr 1')).toBeInTheDocument()
  })

  it('renders cash reserve', () => {
    render(<Dashboard />)
    expect(screen.getByText('₦45.0bn')).toBeInTheDocument()
  })

  it('renders public trust as percentage', () => {
    render(<Dashboard />)
    expect(screen.getByText('54%')).toBeInTheDocument()
  })

  it('renders political capital', () => {
    render(<Dashboard />)
    expect(screen.getByText('100/200')).toBeInTheDocument()
  })

  it('shows year 2 for week 53', () => {
    useGameStore.setState({ week: 53 })
    render(<Dashboard />)
    expect(screen.getByText('Wk 1, Yr 2')).toBeInTheDocument()
  })

  it('shows additional stats in detailed mode', () => {
    useGameStore.setState({ mode: 'detailed' })
    render(<Dashboard />)
    expect(screen.getByText('IGR')).toBeInTheDocument()
    expect(screen.getByText('Infrastructure')).toBeInTheDocument()
    expect(screen.getByText('Corruption')).toBeInTheDocument()
    expect(screen.getByText('Youth Tension')).toBeInTheDocument()
  })
})
