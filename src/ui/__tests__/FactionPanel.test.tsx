import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FactionPanel } from '../FactionPanel'

describe('FactionPanel', () => {
  it('renders placeholder text', () => {
    render(<FactionPanel />)
    expect(screen.getByText('FactionPanel')).toBeInTheDocument()
  })
})
