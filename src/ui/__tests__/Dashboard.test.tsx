import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Dashboard } from '../Dashboard'
import { useGameStore } from '../../state/gameStore'
import { STARTING_STATE } from '../../data/startingState'

beforeEach(() => {
  useGameStore.setState(STARTING_STATE)
})

describe('Dashboard', () => {
  it('renders week number', () => {
    render(<Dashboard />)
    expect(screen.getByText('1')).toBeInTheDocument()
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

  it('updates when store changes', () => {
    useGameStore.setState({ week: 15 })
    render(<Dashboard />)
    expect(screen.getByText('15')).toBeInTheDocument()
  })
})
