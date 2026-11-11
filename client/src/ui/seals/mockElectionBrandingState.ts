import { PARTIES } from '../../data/parties'

export type Situation = 'calm' | 'crisis' | 'storm'

export type PartySymbol = 'sunrise' | 'compass' | 'wave'

export interface MockParty {
  id: string
  name: string
  initials: string
  color: string
  symbol: PartySymbol
}

// Wholly invented parties — canonical definitions live in data/parties.ts.
export const MOCK_PARTIES: MockParty[] = [
  PARTIES.ruling,
  PARTIES.nationalOpposition,
  PARTIES.youthMovement,
].map(({ id, name, initials, color, symbol }) => ({ id, name, initials, color, symbol }))
