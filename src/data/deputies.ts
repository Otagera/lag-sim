import type { DeputyKey, FactionDelta, StatDelta } from '../state/types'

export type DeputyProfile = {
  key: DeputyKey
  name: string
  shortName: string
  title: string
  description: string
  strength: string
  risk: string
  factionBonuses: FactionDelta
  statBonuses: StatDelta
  visitStatDelta: StatDelta
  visitFactionDelta?: FactionDelta
}

export const DEPUTY_PROFILES: Record<DeputyKey, DeputyProfile> = {
  technocrat: {
    key: 'technocrat',
    name: 'Engr. Tunde Balogun-Coker',
    shortName: 'Balogun-Coker',
    title: 'Former World Bank Infrastructure Advisor',
    description:
      'Methodical and data-driven. Knows every contract clause and project milestone. His presence reassures investors and multilateral lenders.',
    strength: 'Infrastructure projects complete 10% faster. Business Community +5 at start.',
    risk: 'No political antenna. Will alienate LG Chairmen without realising it.',
    factionBonuses: { businessCommunity: 5 },
    statBonuses: {},
    visitStatDelta: { infrastructureScore: 1 },
    visitFactionDelta: undefined,
  },
  politician: {
    key: 'politician',
    name: 'Hon. Amaka Obiora',
    shortName: 'Obiora',
    title: 'Four-Term Federal Legislator',
    description:
      'Knows every LGA Chairman, their price, and their ambitions. Opens federal doors that stay closed for technocrats. Dangerously ambitious.',
    strength: 'LG Chairmen +8 and Federal Relations +5 at game start.',
    risk: 'If resentment reaches 60, she begins positioning for a primary challenge against you.',
    factionBonuses: { lgChairmen: 8, federalGovt: 5 },
    statBonuses: {},
    visitStatDelta: {},
    visitFactionDelta: { lgChairmen: 4 },
  },
  loyalist: {
    key: 'loyalist',
    name: 'Dr. Korede Adeyemi-Shaw',
    shortName: 'Adeyemi-Shaw',
    title: 'Former Campaign Manager',
    description:
      'He ran your campaign and would take a bullet for you. The public loves him. He carries a secret that will surface in Year 3.',
    strength: 'Political Capital +15 at game start. Constituency visits boost public trust.',
    risk: 'A past financial irregularity surfaces at week 130. You decide how to handle it.',
    factionBonuses: {},
    statBonuses: { politicalCapital: 15 },
    visitStatDelta: { publicTrust: 2 },
    visitFactionDelta: undefined,
  },
}
