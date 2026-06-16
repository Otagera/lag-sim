import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PollPanel } from '../PollPanel'

describe('PollPanel', () => {
  it('renders placeholder text', () => {
    render(<PollPanel />)
    expect(screen.getByText('PollPanel')).toBeInTheDocument()
  })
})
