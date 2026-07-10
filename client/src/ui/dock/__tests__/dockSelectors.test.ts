import { describe, expect, it } from 'vitest'

import { STARTING_STATE } from '../../../data/startingState'
import type { EventCard, GameState, InboxMessage, NewsArticle, PendingEvent } from '../../../state/types'
import {
  getBriefingBadge,
  getDockBadges,
  getLegacyBadge,
  getPowerBadge,
  getTreasuryBadge,
} from '../dockSelectors'

const testEvent: EventCard = {
  id: 'dock-test-event',
  title: 'Emergency meeting',
  body: 'Something needs the governor immediately.',
  choices: [],
  severity: 'high',
  category: 'political',
}

const testPending: PendingEvent = {
  id: 'pending-1',
  firesOnWeek: 3,
  sourceEventTitle: 'Bridge audit',
  consequence: {
    weekOffset: 1,
    delta: { publicTrust: -2 },
    eventText: 'Citizens are unhappy.',
  },
}

const testMessage: InboxMessage = {
  id: 'inbox-1',
  from: 'fashemu',
  fromLabel: 'Chief Fashemu',
  week: 2,
  subject: 'You need to answer this',
  body: 'The chairman is waiting.',
  tone: 'urgent',
  read: false,
}

const testHeadline: NewsArticle = {
  headline: 'Flood relief stalls in Badagry',
  deck: 'Pressure rises as work slows across the district.',
  category: 'crisis',
  dataPoints: [],
}

describe('dockSelectors', () => {
  it('counts briefing alerts across inbox, queue, consequences, and news', () => {
    const state: GameState = {
      ...STARTING_STATE,
      week: 2,
      activeEvent: testEvent,
      eventQueue: [testEvent],
      pendingDelayed: [testPending],
      inbox: [testMessage],
      newspaperHeadline: testHeadline,
    }

    expect(getBriefingBadge(state)).toMatchObject({ value: 5, tone: 'danger' })
  })

  it('shows treasury countdown when forecast goes negative soon', () => {
    const state: GameState = {
      ...STARTING_STATE,
      stats: { ...STARTING_STATE.stats, cashReserve: 4 },
      lastWeekRevenue: {
        total: 10,
        paye: 0,
        mda: 0,
        luc: 0,
        other: 0,
        faac: 10,
        grants: 0,
        tourism: 0,
      },
      lastWeekExpenditure: {
        total: 15,
        personnel: 5,
        debtInterest: 0,
        debtRepayment: 0,
        overheads: 5,
        subventions: 0,
        contractorPayment: 5,
      },
    }

    expect(getTreasuryBadge(state)).toMatchObject({ value: '1w', tone: 'danger' })
  })

  it('aggregates power blockers from factions, NPCs, deputy risk, and vacancies', () => {
    const state: GameState = {
      ...STARTING_STATE,
      factions: { ...STARTING_STATE.factions, businessCommunity: 20 },
      activeNPCs: {
        ...STARTING_STATE.activeNPCs,
        npc1: {
          ...STARTING_STATE.activeNPCs.npc1,
          isActive: true,
          relationship: 10,
          pressure: 82,
          name: 'A hostile fixer',
        },
      },
      deputy: { key: 'technocrat', resentment: 55, revealed: false },
      commissioners: {
        works: { name: 'A', competence: 70, loyalty: 60, isGodfatherChoice: false },
        finance: { name: 'B', competence: 72, loyalty: 58, isGodfatherChoice: false },
        environment: { name: 'C', competence: 65, loyalty: 62, isGodfatherChoice: false },
      },
    }

    expect(getPowerBadge(state)).toMatchObject({ value: 5, tone: 'danger' })
  })

  it('marks legacy tab live during campaign mode', () => {
    const state: GameState = {
      ...STARTING_STATE,
      inCampaignMode: true,
    }

    expect(getLegacyBadge(state)).toMatchObject({ value: 'LIVE', tone: 'accent' })
  })

  it('returns badge entries for all six dock tabs', () => {
    const badges = getDockBadges(STARTING_STATE)

    expect(Object.keys(badges)).toEqual([
      'briefing',
      'treasury',
      'power',
      'lagos',
      'delivery',
      'legacy',
    ])
  })
})