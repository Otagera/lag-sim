import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { STARTING_STATE } from '../../data/startingState'
import { useGameStore } from '../../state/gameStore'
import { SituationBar } from '../SituationBar'

function renderBar(overrides: Partial<Parameters<typeof SituationBar>[0]> = {}) {
  const props = {
    termLabel: 'Term 1',
    monthLabel: 'Jan 2026',
    seasonLabel: 'Dry Season',
    week: 1,
    currentTerm: 1,
    inCampaignMode: false,
    onTick: vi.fn(),
    canTick: true,
    onResearch: vi.fn(),
    onProjects: vi.fn(),
    onOpenReference: vi.fn(),
    ...overrides,
  }

  render(<SituationBar {...props} />)
  return props
}

describe('SituationBar', () => {
  beforeEach(() => {
    useGameStore.setState(STARTING_STATE)
  })

  it('orients the player and keeps the main actions available', () => {
    const props = renderBar()

    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByText('Lagos Governor Sim')).toBeInTheDocument()
    expect(screen.getByText('Week 1')).toBeInTheDocument()
    expect(screen.getByText('Cash')).toBeInTheDocument()
    expect(screen.getByText('Trust')).toBeInTheDocument()
    expect(screen.getByText('PC')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Research' }))
    fireEvent.click(screen.getByRole('button', { name: 'Projects' }))
    fireEvent.click(screen.getByRole('button', { name: 'Quick Reference' }))
    fireEvent.click(screen.getByRole('button', { name: 'Advance Week' }))

    expect(props.onResearch).toHaveBeenCalledTimes(1)
    expect(props.onProjects).toHaveBeenCalledTimes(1)
    expect(props.onOpenReference).toHaveBeenCalledTimes(1)
    expect(props.onTick).toHaveBeenCalledTimes(1)
  })

  it('prioritizes high-risk alerts without turning the header into a full dashboard', () => {
    useGameStore.setState({
      ...STARTING_STATE,
      stats: {
        ...STARTING_STATE.stats,
        cashReserve: -2,
        publicTrust: 21,
        politicalCapital: 8,
        securityIndex: 30,
        federalRelationship: -42,
      },
      consecutiveDeficitWeeks: 2,
      emergencySuspensionWeeks: 3,
    })

    renderBar()

    expect(screen.getByText('-₦2.0bn')).toBeInTheDocument()
    expect(screen.getByText('21%')).toBeInTheDocument()
    expect(screen.getByText('Suspended')).toBeInTheDocument()
    expect(screen.getByText('Security')).toBeInTheDocument()
    expect(screen.queryByText('Federal')).not.toBeInTheDocument()
  })

  it('shows campaign phase and disables advancement after game over', () => {
    renderBar({ inCampaignMode: true, canTick: false })

    expect(screen.getByText('CAMPAIGN')).toBeInTheDocument()
    expect(screen.getByText("Election '27")).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Game Over' })).toBeDisabled()
  })
})