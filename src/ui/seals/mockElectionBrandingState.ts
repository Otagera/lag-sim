export type Situation = 'calm' | 'crisis' | 'storm'

export type PartySymbol = 'sunrise' | 'compass' | 'wave'

export interface MockParty {
  id: string
  name: string
  initials: string
  color: string
  symbol: PartySymbol
}

// Wholly invented — no name, initials, color, or symbol overlaps with any
// real Nigerian party (APC's broom, PDP's umbrella, Labour Party's torch).
export const MOCK_PARTIES: MockParty[] = [
  {
    id: 'pda',
    name: 'Progressive Dawn Alliance',
    initials: 'PDA',
    color: '#3AA048',
    symbol: 'sunrise',
  },
  { id: 'ucf', name: 'United Coastal Front', initials: 'UCF', color: '#F5C518', symbol: 'wave' },
]
