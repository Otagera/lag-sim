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

  it('renders date in calendar format', () => {
    render(<Dashboard />)
    expect(screen.getByText('May 29, 2027')).toBeInTheDocument()
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

  it('shows correct date for week 53', () => {
    useGameStore.setState({ week: 53 })
    render(<Dashboard />)
    // Week 53 = May 29 2027 + 52*7 = 364 days = May 27, 2028
    expect(screen.getByText('May 27, 2028')).toBeInTheDocument()
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
