import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PollPanel } from '../PollPanel'
import { useGameStore } from '../../state/gameStore'
import { STARTING_STATE } from '../../data/startingState'

beforeEach(() => {
  useGameStore.setState(STARTING_STATE)
})

describe('PollPanel', () => {
  it('renders constituency labels', () => {
    render(<PollPanel />)
    expect(screen.getByText('Lagos Isl.')).toBeInTheDocument()
    expect(screen.getByText('VI')).toBeInTheDocument()
    expect(screen.getByText('Alimosho')).toBeInTheDocument()
    expect(screen.getByText('Makoko')).toBeInTheDocument()
  })

  it('renders starting approval values', () => {
    render(<PollPanel />)
    expect(screen.getByText('60%')).toBeInTheDocument()
    expect(screen.getByText('38%')).toBeInTheDocument()
    expect(screen.getByText('30%')).toBeInTheDocument()
    expect(screen.getByText('35%')).toBeInTheDocument()
  })

  it('updates when store changes', () => {
    useGameStore.setState({
      constituencyApproval: { ...STARTING_STATE.constituencyApproval, makoko: 55 },
    })
    render(<PollPanel />)
    const results = screen.getAllByText('55%')
    expect(results.length).toBeGreaterThanOrEqual(1)
  })
})
