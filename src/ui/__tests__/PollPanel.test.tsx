import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PollPanel } from '../PollPanel'
import { useGameStore } from '../../state/gameStore'
import { STARTING_STATE } from '../../data/startingState'

beforeEach(() => {
  useGameStore.setState(STARTING_STATE)
})

describe('PollPanel', () => {
  it('renders LGA labels', () => {
    render(<PollPanel />)
    expect(screen.getByText('Lagos Isl.')).toBeInTheDocument()
    expect(screen.getByText('Eti Osa')).toBeInTheDocument()
    expect(screen.getByText('Alimosho')).toBeInTheDocument()
    expect(screen.getByText('Ikorodu')).toBeInTheDocument()
  })

  it('renders starting approval values', () => {
    render(<PollPanel />)
    expect(screen.getByText('60%')).toBeInTheDocument()   // lagosIsland
    expect(screen.getByText('30%')).toBeInTheDocument()   // lagosMainland
    expect(screen.getByText('33%')).toBeInTheDocument()   // ajeromiIfelodun
    // multiple LGAs share 38% (alimosho + epe), so use getAllByText
    expect(screen.getAllByText('38%').length).toBeGreaterThanOrEqual(1)
  })

  it('updates when store changes', () => {
    useGameStore.setState({
      constituencyApproval: { ...STARTING_STATE.constituencyApproval, ikorodu: 55 },
    })
    render(<PollPanel />)
    const results = screen.getAllByText('55%')
    expect(results.length).toBeGreaterThanOrEqual(1)
  })
})
