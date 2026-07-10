import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Inbox } from '../Inbox'
import { useGameStore } from '../../state/gameStore'
import { STARTING_STATE } from '../../data/startingState'
import type { InboxMessage } from '../../state/types'

beforeEach(() => {
  useGameStore.setState(STARTING_STATE)
})

const testMessage: InboxMessage = {
  id: 'msg-1',
  from: 'fashemu',
  fromLabel: 'Chief Fashemu',
  subject: 'A word about the allocation',
  body: 'The boys are watching. Be careful.',
  week: 12,
  tone: 'threatening',
  read: false,
  isGodfatherAsk: false,
  actioned: false,
}

describe('Inbox', () => {
  it('shows empty state when inbox is empty', () => {
    render(<Inbox />)
    expect(screen.getByText('No messages yet.')).toBeInTheDocument()
  })

  it('renders a message row and opens detail on click', () => {
    useGameStore.setState({ inbox: [testMessage] })
    render(<Inbox />)

    expect(screen.getByText('A word about the allocation')).toBeInTheDocument()
    expect(screen.getByText('Chief Fashemu')).toBeInTheDocument()

    fireEvent.click(screen.getByText('A word about the allocation'))
    expect(screen.getByText(/Back to inbox/)).toBeInTheDocument()
    expect(screen.getByText(/The boys are watching/)).toBeInTheDocument()
  })

  it('marks a message read when selected', () => {
    useGameStore.setState({ inbox: [testMessage] })
    render(<Inbox />)
    fireEvent.click(screen.getByText('A word about the allocation'))

    const state = useGameStore.getState()
    expect(state.inbox[0].read).toBe(true)
  })

  it('filters unread messages', () => {
    useGameStore.setState({
      inbox: [testMessage, { ...testMessage, id: 'msg-2', read: true }],
    })
    render(<Inbox />)
    fireEvent.click(screen.getByText('Unread'))

    expect(screen.getByText('A word about the allocation')).toBeInTheDocument()
    expect(screen.queryByText('A word about the allocation')).toBeInTheDocument()
  })

  it('marks all messages read', () => {
    useGameStore.setState({ inbox: [testMessage, { ...testMessage, id: 'msg-2' }] })
    render(<Inbox />)
    fireEvent.click(screen.getByText('Mark all read'))

    const state = useGameStore.getState()
    expect(state.inbox.every((m) => m.read)).toBe(true)
  })
})
