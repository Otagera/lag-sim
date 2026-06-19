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
    expect(screen.getByText('₦12.80bn')).toBeInTheDocument()
    expect(screen.getByText('₦11.20bn')).toBeInTheDocument()
  })

  it('renders corruption leakage as informational note in detailed mode', () => {
    useGameStore.setState({ mode: 'detailed' })
    render(<BudgetPanel />)
    // Corruption leakage shown as percentage, not ₦ amount
    expect(screen.getByText(/Corruption leakage ~28%/)).toBeInTheDocument()
  })

  it('renders net (igr - expenditure)', () => {
    render(<BudgetPanel />)
    // 12.8 - 11.2 = 1.6
    expect(screen.getByText(/₦1\.60bn/)).toBeInTheDocument()
  })

  it('shows negative net in red', () => {
    useGameStore.setState({
      stats: { ...STARTING_STATE.stats, igr: 5, expenditure: 10, corruptionPressure: 50 },
    })
    render(<BudgetPanel />)
    // net = 5 - 10 = -5
    const net = screen.getByText(/₦-5\.00bn/)
    expect(net).toBeInTheDocument()
    expect(net.className).toContain('text-red-400')
  })

  it('shows detailed income/expenditure items in detailed mode', () => {
    useGameStore.setState({ mode: 'detailed' })
    render(<BudgetPanel />)
    expect(screen.getByText('PAYE Tax Collection')).toBeInTheDocument()
    expect(screen.getByText('Civil Servant Salaries')).toBeInTheDocument()
    expect(screen.getByText(/Total Income/)).toBeInTheDocument()
    expect(screen.getByText(/Total Expenditure/)).toBeInTheDocument()
  })
})
