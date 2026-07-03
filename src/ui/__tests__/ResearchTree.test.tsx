import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ResearchTree } from '../ResearchTree'
import { useGameStore } from '../../state/gameStore'
import { STARTING_STATE } from '../../data/startingState'

beforeEach(() => {
  useGameStore.setState(STARTING_STATE)
})

describe('ResearchTree', () => {
  it('renders the research tree title', () => {
    render(<ResearchTree onClose={() => {}} />)
    expect(screen.getByText('Commission the Future')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    let closed = false
    render(<ResearchTree onClose={() => { closed = true }} />)
    const closeButton = document.querySelector('button[class*="hover\\:opacity-70"]') as HTMLButtonElement
    expect(closeButton).toBeInTheDocument()
    fireEvent.click(closeButton)
    expect(closed).toBe(true)
  })

  it('renders the research tree SVG', () => {
    render(<ResearchTree onClose={() => {}} />)
    expect(document.querySelector('svg')).toBeInTheDocument()
    expect(document.querySelector('svg title')).toHaveTextContent('Research tree')
  })
})
