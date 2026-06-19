import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BudgetPanel } from '../BudgetPanel'
import { useGameStore } from '../../state/gameStore'
import { STARTING_STATE } from '../../data/startingState'

beforeEach(() => {
  useGameStore.setState(STARTING_STATE)
})

describe('BudgetPanel', () => {
  beforeEach(() => {
    useGameStore.setState({ mode: 'simple' })
  })

  it('renders IGR and expenditure', () => {
    render(<BudgetPanel />)
    expect(screen.getByText('₦12.8bn')).toBeInTheDocument()
    expect(screen.getByText('₦11.2bn')).toBeInTheDocument()
  })

  it('renders corruption leakage as informational note in detailed mode', () => {
    useGameStore.setState({ mode: 'detailed' })
    render(<BudgetPanel />)
    expect(screen.getByText(/Corruption leakage ~28%/)).toBeInTheDocument()
  })

  it('renders positive net with + prefix', () => {
    render(<BudgetPanel />)
    // 12.8 - 11.2 = 1.6
    expect(screen.getByText(/\+₦1\.6bn/)).toBeInTheDocument()
  })

  it('shows negative net with − prefix in red', () => {
    useGameStore.setState({
      stats: { ...STARTING_STATE.stats, igr: 5, expenditure: 10, corruptionPressure: 50 },
    })
    render(<BudgetPanel />)
    // net = 5 - 10 = -5, displayed as −₦5.0bn
    const net = screen.getByText(/−₦5\.0bn/)
    expect(net).toBeInTheDocument()
    expect(net.className).toContain('text-red-400')
  })

  it('shows detailed income/expenditure items in detailed mode', () => {
    useGameStore.setState({ mode: 'detailed' })
    render(<BudgetPanel />)
    expect(screen.getByText('PAYE Tax Collection')).toBeInTheDocument()
    expect(screen.getByText('Civil Servant Salaries')).toBeInTheDocument()
    expect(screen.getByText('Income Breakdown')).toBeInTheDocument()
    expect(screen.getByText('Expenditure Breakdown')).toBeInTheDocument()
  })

  it('shows revenue gap warning when revenue is below floor', () => {
    useGameStore.setState({
      mode: 'detailed',
      stats: { ...STARTING_STATE.stats, igr: 15, expenditure: 35 },
    })
    render(<BudgetPanel />)
    expect(screen.getByText(/Revenue Gap/)).toBeInTheDocument()
  })
})
