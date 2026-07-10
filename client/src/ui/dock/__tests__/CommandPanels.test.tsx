import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { STARTING_STATE } from '../../../data/startingState'
import { useGameStore } from '../../../state/gameStore'
import { Tab } from '../../components/Tab'
import { BriefingPanel } from '../panels/BriefingPanel'
import { DeliveryPanel } from '../panels/DeliveryPanel'
import { LegacyPanel } from '../panels/LegacyPanel'
import { TreasuryPanel } from '../panels/TreasuryPanel'

vi.mock('../../StrategicDashboard', () => ({
  StrategicDashboard: ({ showGoalTracker = true }: { showGoalTracker?: boolean }) => (
    <div>{showGoalTracker ? 'Strategic Dashboard Goal On' : 'Strategic Dashboard Goal Off'}</div>
  ),
}))

vi.mock('../../CampaignTracker', () => ({
  CampaignTracker: () => <div>Campaign Tracker Mock</div>,
}))

vi.mock('../../game/StateOfTheState', () => ({
  StateOfTheState: () => <div>State of the State Mock</div>,
}))

describe('command panels', () => {
  beforeEach(() => {
    useGameStore.setState(STARTING_STATE)
  })

  it('renders tab badge objects and active state', () => {
    render(
      <Tab label="Legacy" active badge={{ value: 'LIVE', tone: 'accent', ariaLabel: 'Campaign live' }} />,
    )

    expect(screen.getByText('LIVE')).toBeInTheDocument()
    expect(screen.getByRole('button')).toHaveAttribute('aria-current', 'page')
  })

  it('renders the briefing command center question and headline summary', () => {
    useGameStore.setState({
      inbox: [
        {
          id: 'msg-1',
          from: 'fashemu',
          fromLabel: 'Chief Fashemu',
          week: 4,
          subject: 'An urgent call',
          body: 'Please come in.',
          tone: 'urgent',
          read: false,
        },
      ],
      newspaperHeadline: {
        headline: 'Lagos traders want action now',
        deck: 'Pressure is rising in the markets.',
        category: 'political',
        dataPoints: [],
      },
    })

    render(<BriefingPanel />)

    expect(screen.getByText('What needs my attention?')).toBeInTheDocument()
    expect(screen.getByText('Lagos traders want action now')).toBeInTheDocument()
    expect(screen.getByText('Action feed')).toBeInTheDocument()
  })

  it('opens research and projects from the delivery panel', () => {
    const onOpenProjects = vi.fn()
    const onOpenResearch = vi.fn()

    render(
      <DeliveryPanel onOpenProjects={onOpenProjects} onOpenResearch={onOpenResearch} />,
    )

    fireEvent.click(screen.getByText('Open projects'))
    fireEvent.click(screen.getByText('Open research'))

    expect(onOpenProjects).toHaveBeenCalledTimes(1)
    expect(onOpenResearch).toHaveBeenCalledTimes(1)
  })

  it('supports collapsing treasury sections', () => {
    render(<TreasuryPanel />)

    const financeLeversToggle = screen.getByRole('button', { name: /finance levers/i })
    const budgetSnapshotToggle = screen.getByRole('button', { name: /budget snapshot/i })

    expect(screen.getByText('Weekly Budget')).toBeInTheDocument()
    expect(financeLeversToggle).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(financeLeversToggle)
    expect(financeLeversToggle).toHaveAttribute('aria-expanded', 'true')

    fireEvent.click(budgetSnapshotToggle)
    expect(budgetSnapshotToggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('Weekly Budget')).not.toBeInTheDocument()
  })

  it('shows campaign content in legacy only when campaign mode is active', async () => {
    const { rerender } = render(<LegacyPanel />)

    expect(await screen.findByText('Strategic Dashboard Goal Off')).toBeInTheDocument()
    expect(screen.queryByText('Campaign Tracker Mock')).not.toBeInTheDocument()
    expect(screen.queryByText('State of the State Mock')).not.toBeInTheDocument()

    act(() => {
      useGameStore.setState({ ...useGameStore.getState(), inCampaignMode: true })
    })
    rerender(<LegacyPanel />)

    expect(await screen.findByText('Campaign Tracker Mock')).toBeInTheDocument()
  })
})