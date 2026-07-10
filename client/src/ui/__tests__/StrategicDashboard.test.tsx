import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StrategicDashboard } from '../StrategicDashboard'
import { useGameStore } from '../../state/gameStore'
import { STARTING_STATE } from '../../data/startingState'
import type { CapitalProject } from '../../state/types'

beforeEach(() => {
  useGameStore.setState(STARTING_STATE)
})

const testProject: CapitalProject = {
  id: 'project-a',
  name: 'BRT Lane Expansion',
  location: 'lagosIsland',
  contractorId: 'contractor-a',
  weeklyDraw: 1.2,
  totalCost: 12,
  totalSpent: 3,
  effectiveProgress: 25,
  weeksRemaining: 8,
  status: 'active',
}

describe('StrategicDashboard', () => {
  it('renders cash position', () => {
    render(<StrategicDashboard />)
    expect(screen.getByText('Cash Position')).toBeInTheDocument()
    expect(screen.getByText('₦45.0bn')).toBeInTheDocument()
  })

  it('shows goal tracker when no goal is selected', () => {
    render(<StrategicDashboard />)
    expect(screen.getByText(/No goal selected/)).toBeInTheDocument()
  })

  it('renders active capital projects in initiative tracker', () => {
    useGameStore.setState({ capitalProjects: [testProject] })
    render(<StrategicDashboard />)
    expect(screen.getByText('In Flight')).toBeInTheDocument()
    expect(screen.getByText('BRT Lane Expansion')).toBeInTheDocument()
  })

  it('renders quarter forecast when running a deficit', () => {
    useGameStore.setState({
      stats: { ...STARTING_STATE.stats, cashReserve: 45 },
      lastWeekRevenue: { total: 10, paye: 0, mda: 0, luc: 0, other: 0, faac: 0, grants: 0, tourism: 0 },
      lastWeekExpenditure: { total: 15, personnel: 5, debtInterest: 0, debtRepayment: 0, overheads: 5, subventions: 0, contractorPayment: 5 },
    })
    render(<StrategicDashboard />)
    expect(screen.getByText('Quarter Forecast')).toBeInTheDocument()
  })
})
