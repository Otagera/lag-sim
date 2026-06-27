import type { GameState } from '../state/types'

export type HintDef = {
  id: string
  text: string
  icon?: string
  trigger: (prev: GameState, next: GameState) => boolean
}

export const ALL_HINTS: HintDef[] = [
  {
    id: 'inbox-first',
    text: 'Messages from your team appear in the Inbox (bottom dock). Read them — some contain actionable decisions.',
    trigger: (prev, next) => next.inbox.length > 0 && prev.inbox.length === 0,
  },
  {
    id: 'godfather-first',
    text: 'Chief Fashemu has made a demand. You can Accept or Refuse from the Inbox — but every refusal strains the relationship.',
    trigger: (prev, next) => !!next.activeGodfatherMessage && !prev.activeGodfatherMessage,
  },
  {
    id: 'first-event',
    text: 'A decision is on the table. Each choice has immediate effects, and some have delayed consequences weeks later.',
    trigger: (prev, next) => !!next.activeEvent && !prev.activeEvent,
  },
  {
    id: 'deficit-warning',
    text: 'Treasury is in the red. Revenue falls short of commitments — raise revenue or cut costs before bankruptcy hits.',
    trigger: (prev, next) => next.stats.cashReserve < 0 && prev.stats.cashReserve >= 0,
  },
  {
    id: 'trust-warning',
    text: 'Public trust is eroding. Below 25% alongside high youth tension risks a mass uprising — deliver visible wins.',
    trigger: (prev, next) => next.stats.publicTrust < 30 && prev.stats.publicTrust >= 30,
  },
  {
    id: 'debt-warning',
    text: 'Debt is mounting. Interest payments drain the budget each week — consider restructuring before it compounds.',
    trigger: (prev, next) => next.stats.debtStock > 40 && prev.stats.debtStock <= 40,
  },
]
