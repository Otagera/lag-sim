import type { PartySymbol } from '../ui/seals/mockElectionBrandingState'

/**
 * Fictional political parties. Wholly invented — no name, initials, colour or
 * symbol matches a real Nigerian party (APC's broom, PDP's umbrella, Labour
 * Party's torch) or any INEC-registered acronym (A, AA, AAC, ADC, ADP, APC,
 * APGA, APM, APP, BP, LP, NNPP, NRM, PDP, PRP, SDP, YPP, ZLP).
 *
 * Event text should name parties through this table so the cast stays
 * consistent and can be swapped per scenario.
 */
export interface Party {
  id: string
  name: string
  shortName: string
  initials: string
  color: string
  symbol?: PartySymbol
  /** One line on who they are, for writers and tooltips */
  profile: string
}

export const PARTIES = {
  /** The governor's own party: the dominant machine in the state */
  ruling: {
    id: 'pda',
    name: 'Progressive Dawn Alliance',
    shortName: 'Dawn',
    initials: 'PDA',
    color: '#3AA048',
    symbol: 'sunrise',
    profile:
      'The governing machine. Godfather-funded, ward-deep, and convinced it is owed the state.',
  },
  /** The old national opposition: big tent, federal ambitions */
  nationalOpposition: {
    id: 'fcp',
    name: 'Federal Compass Party',
    shortName: 'Compass',
    initials: 'FCP',
    color: '#1F3A8A',
    symbol: 'compass',
    profile:
      'The old national opposition. Former ministers, retired generals, deep pockets in Abuja.',
  },
  /** The youth insurgency: online, urban, impatient */
  youthMovement: {
    id: 'ntm',
    name: 'New Tide Movement',
    shortName: 'New Tide',
    initials: 'NTM',
    color: '#F5C518',
    symbol: 'wave',
    profile: 'A youth insurgency born online. Thin structures, enormous energy, allergic to deals.',
  },
  /** The populist outsider: cheap rallies, loud promises */
  populist: {
    id: 'cgp',
    name: 'Common Ground Party',
    shortName: 'Common Ground',
    initials: 'CGP',
    color: '#B4532A',
    profile:
      'A populist vehicle for whoever can fill a stadium. Strong in markets and motor parks.',
  },
} satisfies Record<string, Party>
