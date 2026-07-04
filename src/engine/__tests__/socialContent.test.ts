import { describe, it, expect } from 'vitest'
import { STARTING_STATE } from '../../data/startingState'
import type { GameState, NewsArticle } from '../../state/types'
import {
  buildPodcastExchange,
  buildTweetReplies,
  buildVideoComments,
  buildWhatsAppThread,
  deriveContext,
  deriveTone,
} from '../socialContent'

function state(overrides: Partial<GameState['stats']> = {}): GameState {
  return {
    ...(STARTING_STATE as GameState),
    stats: { ...(STARTING_STATE as GameState).stats, ...overrides },
  }
}

function article(overrides: Partial<NewsArticle> = {}): NewsArticle {
  return {
    headline: 'Lagos rolls out new transit corridor across the mainland',
    deck: 'The state government says the corridor will cut commute times for thousands.',
    category: 'milestone',
    dataPoints: [{ label: 'Infrastructure Score', value: '62', delta: '+4', positive: true }],
    ...overrides,
  }
}

// No unfilled slot tokens should survive.
function hasNoSlots(text: string): boolean {
  return !/\{(lga|stat|value|delta|dir|cat)\}/.test(text)
}

describe('deriveContext', () => {
  it('fills context from the primary data point', () => {
    const ctx = deriveContext(article())
    expect(ctx.stat).toBe('Infrastructure Score')
    expect(ctx.value).toBe('62')
    expect(ctx.delta).toBe('+4')
    expect(ctx.dir).toBe('rising')
    expect(ctx.lga.length).toBeGreaterThan(0)
  })

  it('falls back gracefully when there are no data points', () => {
    const ctx = deriveContext(article({ dataPoints: [] }))
    expect(ctx.stat).toBe('the situation')
    expect(ctx.value).toBe('these numbers')
    expect(ctx.dir).toBe('moving')
  })
})

describe('deriveTone', () => {
  it('treats background as rumor', () => {
    expect(deriveTone(article({ category: 'background' }), state())).toBe('rumor')
  })
  it('treats milestone / positive as positive', () => {
    expect(deriveTone(article({ category: 'milestone' }), state())).toBe('positive')
  })
  it('treats crisis / negative as negative', () => {
    expect(deriveTone(article({ category: 'crisis', dataPoints: [] }), state())).toBe('negative')
  })
  it('reflects poor governance stats as negative for neutral stories', () => {
    const neutral = article({
      category: 'political',
      dataPoints: [{ label: 'Turnout', value: '40%' }],
    })
    expect(deriveTone(neutral, state({ publicTrust: 20 }))).toBe('negative')
  })
})

describe('builders are deterministic and slot-free', () => {
  const a = article()
  const s = state()

  it('tweet replies are stable across calls', () => {
    const first = buildTweetReplies(a, s)
    const second = buildTweetReplies(a, s)
    expect(first).toEqual(second)
    expect(first.length).toBeGreaterThanOrEqual(3)
    for (const r of first) {
      expect(hasNoSlots(r.text)).toBe(true)
      expect(r.author.length).toBeGreaterThan(0)
    }
  })

  it('video comments are stable and slot-free', () => {
    const first = buildVideoComments(a, s)
    expect(first).toEqual(buildVideoComments(a, s))
    for (const c of first) expect(hasNoSlots(c.text)).toBe(true)
  })

  it('podcast exchange alternates host and co-host', () => {
    const first = buildPodcastExchange(a, s, 'Host Person')
    expect(first).toEqual(buildPodcastExchange(a, s, 'Host Person'))
    expect(first.coHostName.length).toBeGreaterThan(0)
    expect(first.coHostName).not.toBe('Host Person')
    expect(first.podcastExchange[0].speaker).toBe('Host Person')
    expect(first.podcastExchange[1].speaker).toBe(first.coHostName)
    for (const line of first.podcastExchange) expect(hasNoSlots(line.text)).toBe(true)
  })

  it('different headlines produce different content', () => {
    const other = buildTweetReplies(article({ headline: 'A completely different Lagos story' }), s)
    expect(other).not.toEqual(buildTweetReplies(a, s))
  })
})

describe('buildWhatsAppThread', () => {
  it('rumor tone routes to channel or forward mode', () => {
    const t = buildWhatsAppThread(article({ category: 'background' }), state())
    expect(['channel', 'forward']).toContain(t.whatsappMode)
    expect(t.isRumor).toBe(true)
  })

  it('group / forward modes carry seeded messages', () => {
    // Search headlines until we get a non-channel thread, then assert its shape.
    let found = false
    for (let i = 0; i < 20 && !found; i++) {
      const t = buildWhatsAppThread(article({ headline: `Lagos news item ${i}` }), state())
      if (t.whatsappMode !== 'channel') {
        found = true
        expect(t.whatsappMessages && t.whatsappMessages.length).toBeGreaterThanOrEqual(3)
        for (const m of t.whatsappMessages ?? []) {
          expect(hasNoSlots(m.text)).toBe(true)
          expect(m.time.length).toBeGreaterThan(0)
        }
      }
    }
    expect(found).toBe(true)
  })

  it('channel mode carries emoji tallies', () => {
    let found = false
    for (let i = 0; i < 30 && !found; i++) {
      const t = buildWhatsAppThread(article({ category: 'background', headline: `Rumor ${i}` }), state())
      if (t.whatsappMode === 'channel') {
        found = true
        expect(t.emojiTallies && t.emojiTallies.length).toBeGreaterThan(0)
        expect(t.followerCount).toBeGreaterThan(0)
      }
    }
    expect(found).toBe(true)
  })

  it('is deterministic for the same headline', () => {
    const a = article({ category: 'background' })
    expect(buildWhatsAppThread(a, state())).toEqual(buildWhatsAppThread(a, state()))
  })
})
