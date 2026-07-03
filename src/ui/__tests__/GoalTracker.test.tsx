import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GoalTracker } from '../GoalTracker'
import { useGameStore } from '../../state/gameStore'
import { STARTING_STATE } from '../../data/startingState'

beforeEach(() => {
  useGameStore.setState(STARTING_STATE)
})

describe('GoalTracker', () => {
  it('shows no-goal state when none is selected', () => {
    render(<GoalTracker />)
    expect(screen.getByText(/No goal selected/)).toBeInTheDocument()
  })

  it('renders selected goal title and progress percentage', () => {
    useGameStore.setState({ selectedGoalId: 'break-the-machine' })
    render(<GoalTracker />)
    expect(screen.getByText('Break the Machine')).toBeInTheDocument()
    expect(screen.getByText((content) => /\d+%/.test(content))).toBeInTheDocument()
  })

  it('renders goal as met when all targets are satisfied', () => {
    useGameStore.setState({
      selectedGoalId: 'break-the-machine',
      factions: {
        ...STARTING_STATE.factions,
        partyGodfathers: 15,
        civilSocietyMedia: 60,
      },
      stats: { ...STARTING_STATE.stats, corruptionPressure: 30 },
    })
    render(<GoalTracker />)
    expect(screen.getByText(/On track/)).toBeInTheDocument()
  })
})
