import type { GameState } from '../state/types'

export type HintDef = {
  id: string
  text: string
  title?: string
  icon?: string
  element?: string | (() => Element | null)
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  trigger: (prev: GameState, next: GameState) => boolean
}

export const ALL_HINTS: HintDef[] = [
  {
    id: 'inbox-first',
    title: 'New Message',
    text: 'Messages from your team appear in the Inbox (bottom dock). Read them — some contain actionable decisions.',
    element: '[data-tour="dock-inbox"]',
    side: 'top',
    align: 'center',
    trigger: (prev, next) => next.inbox.length > 0 && prev.inbox.length === 0,
  },
  {
    id: 'godfather-first',
    title: 'Chief Fashemu',
    text: 'Chief Fashemu has made a demand. You can Accept or Refuse from the Inbox — but every refusal strains the relationship.',
    element: '[data-tour="dock-inbox"]',
    side: 'top',
    align: 'center',
    trigger: (prev, next) => !!next.activeGodfatherMessage && !prev.activeGodfatherMessage,
  },
  {
    id: 'first-event',
    title: 'Your First Decision',
    text: 'A decision is on the table. Each choice has immediate effects, and some have delayed consequences weeks later.',
    element: '.event-card-area',
    side: 'top',
    align: 'center',
    trigger: (prev, next) => !!next.activeEvent && !prev.activeEvent,
  },
  {
    id: 'deficit-warning',
    title: 'Treasury in the Red',
    text: 'Treasury is in the red. Revenue falls short of commitments — raise revenue or cut costs before bankruptcy hits.',
    element: '[title="Weekly revenue minus expenditure"]',
    side: 'bottom',
    align: 'center',
    trigger: (prev, next) => next.stats.cashReserve < 0 && prev.stats.cashReserve >= 0,
  },
  {
    id: 'trust-warning',
    title: 'Trust Eroding',
    text: 'Public trust is eroding. Below 25% alongside high youth tension risks a mass uprising — deliver visible wins.',
    element: '[title="Public approval rating"]',
    side: 'bottom',
    align: 'center',
    trigger: (prev, next) => next.stats.publicTrust < 30 && prev.stats.publicTrust >= 30,
  },
  {
    id: 'debt-warning',
    title: 'Debt Mounting',
    text: 'Debt is mounting. Interest payments drain the budget each week — consider restructuring before it compounds.',
    element: '[data-tour="dock-economy"]',
    side: 'top',
    align: 'center',
    trigger: (prev, next) => next.stats.debtStock > 40 && prev.stats.debtStock <= 40,
  },
]
