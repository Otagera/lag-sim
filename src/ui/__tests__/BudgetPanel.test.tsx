import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BudgetPanel } from '../BudgetPanel'

describe('BudgetPanel', () => {
  it('renders placeholder text', () => {
    render(<BudgetPanel />)
    expect(screen.getByText('BudgetPanel')).toBeInTheDocument()
  })
})
