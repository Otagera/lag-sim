import type { ReactNode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import GameApp from '../../../App'
import { STARTING_STATE } from '../../../data/startingState'
import { useGameStore } from '../../../state/gameStore'

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
}))

vi.mock('../../EventCard', () => ({
  EventCard: () => <div>Event card mock</div>,
}))

vi.mock('../../desk/DeskScene', () => ({
  DeskScene: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

vi.mock('../../GuidedTour', () => ({ GuidedTour: () => null }))
vi.mock('../../game/DiagnosisBanner', () => ({ DiagnosisBanner: () => null }))
vi.mock('../../MediaRouter', () => ({ MediaRouter: () => null }))
vi.mock('../../ContextualHint', () => ({ ContextualHint: () => null }))
vi.mock('../../HelpReference', () => ({ HelpReference: () => null }))
vi.mock('../../ElectionWatermark', () => ({ ElectionWatermark: () => <div>Election Watermark</div> }))
vi.mock('../../StrategicDashboard', () => ({ StrategicDashboard: () => <div>Strategic Dashboard Mock</div> }))
vi.mock('../../CampaignTracker', () => ({ CampaignTracker: () => <div>Campaign Tracker Mock</div> }))
vi.mock('../../game/StateOfTheState', () => ({ StateOfTheState: () => <div>State of the State Mock</div> }))
vi.mock('../panels/LagosPulsePanel', () => ({ LagosPulsePanel: () => <div>Lagos Pulse Mock</div> }))

describe('GameApp dock redesign', () => {
  beforeEach(() => {
    useGameStore.setState({
      ...STARTING_STATE,
      activeEvent: {
        id: 'app-test-event',
        title: 'Cabinet tension',
        body: 'A simple test event.',
        choices: [],
        severity: 'medium',
        category: 'political',
      },
    })
  })

  it('renders the six new dock tabs and drops the old taxonomy', () => {
    render(<GameApp />)

    expect(screen.getByLabelText('Open Briefing panel')).toBeInTheDocument()
    expect(screen.getByLabelText('Open Treasury panel')).toBeInTheDocument()
    expect(screen.getByLabelText('Open Power panel')).toBeInTheDocument()
    expect(screen.getByLabelText('Open Lagos panel')).toBeInTheDocument()
    expect(screen.getByLabelText('Open Delivery panel')).toBeInTheDocument()
    expect(screen.getByLabelText('Open Legacy panel')).toBeInTheDocument()

    expect(screen.queryByText('Election')).not.toBeInTheDocument()
    expect(screen.queryByText('Strategy')).not.toBeInTheDocument()
  })

  it('shows campaign content inside legacy instead of a separate election tab', async () => {
    useGameStore.setState({ ...useGameStore.getState(), inCampaignMode: true })

    render(<GameApp />)
    fireEvent.click(screen.getByLabelText('Open Legacy panel'))

    expect(await screen.findByText('Campaign Tracker Mock')).toBeInTheDocument()
    expect(screen.getAllByText('Are we on track to win / leave a legacy?').length).toBeGreaterThan(0)
    expect(screen.queryByLabelText('Open Election panel')).not.toBeInTheDocument()
  })

  it('closes the overlay by Escape and backdrop click', () => {
    render(<GameApp />)
    fireEvent.click(screen.getByLabelText('Open Briefing panel'))

    expect(screen.getByRole('dialog')).toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    fireEvent.click(screen.getByLabelText('Open Briefing panel'))
    fireEvent.click(screen.getByLabelText('Close panel backdrop'))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})