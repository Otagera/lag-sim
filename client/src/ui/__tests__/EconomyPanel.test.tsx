import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { EconomyPanel } from '../EconomyPanel'
import { useGameStore } from '../../state/gameStore'
import { STARTING_STATE } from '../../data/startingState'
import { INITIATIVE_DEFS } from '../../data/initiatives'

beforeEach(() => {
  useGameStore.setState(STARTING_STATE)
})

const firstInitiative = Object.values(INITIATIVE_DEFS)[0]

describe('EconomyPanel', () => {
  it('renders revenue and expenditure sections', () => {
    render(<EconomyPanel />)
    expect(screen.getByText('Revenue Levers')).toBeInTheDocument()
    expect(screen.getByText('Spending Cuts')).toBeInTheDocument()
  })

  it('renders Raise Your Profile section with prestige actions', () => {
    render(<EconomyPanel />)
    expect(screen.getByText('Raise Your Profile')).toBeInTheDocument()
    expect(screen.getByText('Media Blitz')).toBeInTheDocument()
    expect(screen.getByText('Chair Governors\' Forum')).toBeInTheDocument()
  })

  it('renders financing section', () => {
    render(<EconomyPanel />)
    expect(screen.getByText('Financing')).toBeInTheDocument()
  })

  it('renders available initiatives', () => {
    render(<EconomyPanel />)
    if (firstInitiative) expect(screen.getByText(firstInitiative.name)).toBeInTheDocument()
  })

  it('opens initiative confirmation on click', () => {
    render(<EconomyPanel />)
    if (!firstInitiative) return

    fireEvent.click(screen.getByText(firstInitiative.name))
    expect(screen.getByText(`${firstInitiative.name} \u2014 confirm?`)).toBeInTheDocument()
    expect(screen.getByText('Confirm')).toBeInTheDocument()
  })
})
