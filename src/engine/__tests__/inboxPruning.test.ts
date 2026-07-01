import { describe, it, expect } from 'vitest'
import { pruneInbox, INBOX_CAP } from '../inboxEngine'
import type { InboxMessage } from '../../state/types'

function msg(week: number, over: Partial<InboxMessage> = {}): InboxMessage {
  return {
    id: `m-${week}-${over.id ?? ''}`,
    from: 'chief-of-staff',
    fromLabel: 'Chief of Staff',
    week,
    subject: `Week ${week}`,
    body: 'body',
    tone: 'neutral',
    read: true,
    ...over,
  }
}

describe('pruneInbox', () => {
  it('leaves a small inbox untouched', () => {
    const inbox = Array.from({ length: 10 }, (_, i) => msg(i + 1))
    expect(pruneInbox(inbox)).toBe(inbox)
  })

  it('caps to the most recent messages (append order = recency)', () => {
    const inbox = Array.from({ length: INBOX_CAP + 20 }, (_, i) => msg(i + 1))
    const pruned = pruneInbox(inbox)
    expect(pruned).toHaveLength(INBOX_CAP)
    // Oldest 20 dropped; newest kept, order preserved
    expect(pruned[0].week).toBe(21)
    expect(pruned[pruned.length - 1].week).toBe(INBOX_CAP + 20)
  })

  it('never prunes an un-actioned godfather ask, however old', () => {
    const oldAsk = msg(2, { id: 'ask', isGodfatherAsk: true, actioned: false, read: false })
    const filler = Array.from({ length: INBOX_CAP + 30 }, (_, i) => msg(i + 10))
    const pruned = pruneInbox([oldAsk, ...filler])
    expect(pruned.some((m) => m.id === oldAsk.id)).toBe(true)
    // Pending ask is kept in addition to the recent cap
    expect(pruned.length).toBe(INBOX_CAP + 1)
  })

  it('does prune an actioned godfather ask like any other old message', () => {
    const oldActionedAsk = msg(2, { id: 'ask', isGodfatherAsk: true, actioned: true })
    const filler = Array.from({ length: INBOX_CAP + 30 }, (_, i) => msg(i + 10))
    const pruned = pruneInbox([oldActionedAsk, ...filler])
    expect(pruned.some((m) => m.id === oldActionedAsk.id)).toBe(false)
    expect(pruned).toHaveLength(INBOX_CAP)
  })

  it('preserves original append order in the result', () => {
    const inbox = Array.from({ length: INBOX_CAP + 5 }, (_, i) => msg(i + 1))
    const pruned = pruneInbox(inbox)
    const weeks = pruned.map((m) => m.week)
    expect(weeks).toEqual([...weeks].sort((a, b) => a - b))
  })
})
