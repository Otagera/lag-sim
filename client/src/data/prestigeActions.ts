import type { FactionDelta, StatDelta } from '../state/types'

export interface PrestigeActionDef {
  id: string
  name: string
  description: string
  type: 'timed' | 'instant'
  pcReward: number
  cashCost: number
  weeksToComplete?: number
  cooldownWeeks?: number
  statDelta?: StatDelta
  factionImpact?: FactionDelta
  payoff: string
}

export const PRESTIGE_ACTIONS: Record<string, PrestigeActionDef> = {
  'chair-governors-forum': {
    id: 'chair-governors-forum',
    name: 'Chair Governors\' Forum',
    description: 'Chair the monthly Governors\' Forum in Abuja. Raises national profile but signals alignment with federal priorities.',
    type: 'timed',
    pcReward: 15,
    cashCost: 0,
    weeksToComplete: 4,
    statDelta: { federalRelationship: -5 },
    payoff: '+15 PC · 4 weeks · FederalRelationship −5',
  },
  'host-investment-summit': {
    id: 'host-investment-summit',
    name: 'Host Investment Summit',
    description: 'Organise a Lagos investment summit targeting foreign and diaspora capital. High visibility, high cost.',
    type: 'timed',
    pcReward: 20,
    cashCost: 8,
    weeksToComplete: 6,
    payoff: '+20 PC · 6 weeks · ₦8bn cost',
  },
  'diaspora-roadshow': {
    id: 'diaspora-roadshow',
    name: 'Diaspora Roadshow',
    description: 'Tour diaspora communities in London, Houston, and Dubai to court investment and burnish your image abroad.',
    type: 'timed',
    pcReward: 12,
    cashCost: 5,
    weeksToComplete: 4,
    factionImpact: { partyGodfathers: 3 },
    payoff: '+12 PC · 4 weeks · ₦5bn · +3 Godfathers',
  },
  'constituency-tour': {
    id: 'constituency-tour',
    name: 'Constituency Tour',
    description: 'Visit development projects across the 20 LGAs. Direct engagement with local leaders and communities.',
    type: 'instant',
    pcReward: 8,
    cashCost: 3,
    cooldownWeeks: 8,
    payoff: '+8 PC · 8wk cooldown · ₦3bn',
  },
  'media-blitz': {
    id: 'media-blitz',
    name: 'Media Blitz',
    description: 'Coordinate press appearances, radio interviews, and op-eds across Lagos media houses.',
    type: 'instant',
    pcReward: 5,
    cashCost: 1,
    cooldownWeeks: 4,
    payoff: '+5 PC · 4wk cooldown · ₦1bn',
  },
}
