import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FactionPanel } from '../FactionPanel'
import { useGameStore } from '../../state/gameStore'
import { STARTING_STATE } from '../../data/startingState'

beforeEach(() => {
  useGameStore.setState(STARTING_STATE)
})

describe('FactionPanel', () => {
  it('renders faction labels', () => {
    render(<FactionPanel />)
    expect(screen.getByText('Business')).toBeInTheDocument()
    expect(screen.getByText('Godfathers')).toBeInTheDocument()
    expect(screen.getByText('LG Chairmen')).toBeInTheDocument()
    expect(screen.getByText('Civil Soc.')).toBeInTheDocument()
  })

  it('renders starting faction values without + prefix', () => {
    render(<FactionPanel />)
    expect(screen.getByText('55')).toBeInTheDocument()
    expect(screen.getByText('65')).toBeInTheDocument()
    expect(screen.getByText('58')).toBeInTheDocument()
  })

  it('updates when store changes', () => {
    useGameStore.setState({ factions: { ...STARTING_STATE.factions, businessCommunity: 20 } })
    render(<FactionPanel />)
    expect(screen.getByText('20')).toBeInTheDocument()
  })
})
