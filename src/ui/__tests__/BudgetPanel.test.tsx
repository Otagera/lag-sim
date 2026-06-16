import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BudgetPanel } from '../BudgetPanel'
import { useGameStore } from '../../state/gameStore'
import { STARTING_STATE } from '../../data/startingState'

beforeEach(() => {
  useGameStore.setState(STARTING_STATE)
})

describe('BudgetPanel', () => {
  it('renders IGR and expenditure', () => {
    render(<BudgetPanel />)
    expect(screen.getByText('₦12.80bn')).toBeInTheDocument()
    expect(screen.getByText('₦11.20bn')).toBeInTheDocument()
  })

  it('renders corruption drag', () => {
    render(<BudgetPanel />)
    // 11.2 * (28/100) * 0.3 = 0.9408
    expect(screen.getByText(/₦0\.94bn/)).toBeInTheDocument()
  })

  it('renders net (igr - expenditure - drag)', () => {
    render(<BudgetPanel />)
    // 12.8 - 11.2 - 0.9408 = 0.6592
    expect(screen.getByText(/₦0\.66bn/)).toBeInTheDocument()
  })

  it('shows negative net in red', () => {
    useGameStore.setState({
      stats: { ...STARTING_STATE.stats, igr: 5, expenditure: 10, corruptionPressure: 50 },
    })
    render(<BudgetPanel />)
    // 5 - 10 - (10 * 0.5 * 0.3) = 5 - 10 - 1.5 = -6.5
    const net = screen.getByText(/₦-6\.50bn/)
    expect(net).toBeInTheDocument()
    expect(net.className).toContain('text-red-400')
  })
})
