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
  reformer: {
    key: 'reformer',
    name: 'Dr. Kanyinsola Fashola-Eze',
    shortName: 'Fashola-Eze',
    title: 'Anti-Corruption Campaigner',
    description:
      'Former Transparency International Lagos lead. Her endorsement was your biggest asset on the campaign trail. She will not cover for you.',
    strength: 'Corruption Pressure -8 at start. Civil Society +6 at start.',
    risk: 'Refuses to attend any event with a godfather. If you comply with 3+ godfather asks, she resigns.',
    factionBonuses: { civilSocietyMedia: 6 },
    statBonuses: { corruptionPressure: -8 },
    visitStatDelta: { publicTrust: 3, corruptionPressure: -1 },
    visitFactionDelta: { civilSocietyMedia: 3 },
  },
  traditionalist: {
    key: 'traditionalist',
    name: 'High Chief Adewole Fasanya',
    shortName: 'Fasanya',
    title: 'Oluwole of Badagry, LGA Liaison',
    description:
      'Commands respect that no election can manufacture. His network spans every ward in Greater Lagos. But he is of the old order.',
    strength: 'LG Chairmen +12 at start. Informal Economy +5 at start.',
    risk: 'Every godfather ask becomes harder to refuse. He interprets reform as disrespect.',
    factionBonuses: { lgChairmen: 12, informalEconomy: 5 },
    statBonuses: {},
    visitStatDelta: {},
    visitFactionDelta: { lgChairmen: 6, informalEconomy: 3 },
  },
  economist: {
    key: 'economist',
    name: 'Dr. Chioma Nwosu-Adegbite',
    shortName: 'Nwosu-Adegbite',
    title: 'Former DMO Director-General',
    description:
      'She restructured three state debt portfolios before becoming your Deputy. Understands bond markets better than Abuja does.',
    strength: 'Cash Reserve +₦8bn at start. Debt interest rates reduced by 15%.',
    risk: 'Zero political instinct. Will antagonise godfathers with public austerity rhetoric.',
    factionBonuses: {},
    statBonuses: { cashReserve: 8 },
    visitStatDelta: { cashReserve: 1 },
    visitFactionDelta: { businessCommunity: 2 },
  },
  'security-chief': {
    key: 'security-chief',
    name: 'AIG (Rtd.) Kamoru Adesina',
    shortName: 'Adesina',
    title: 'Retired Assistant Inspector-General',
    description:
      'Ran Lagos Police Command for six years. Knows every criminal network and every loyal officer. The streets respect and fear him.',
    strength: 'Security Index +10 at start. Youth Tension grows 20% slower.',
    risk: 'Civil Society -6 at start. Any riot response defaults to force, costing more trust.',
    factionBonuses: { civilSocietyMedia: -6 },
    statBonuses: { securityIndex: 10 },
    visitStatDelta: { securityIndex: 2, youthTension: -2 },
    visitFactionDelta: undefined,
  },
}

export const ALL_DEPUTY_KEYS: DeputyKey[] = [
  'technocrat',
  'politician',
  'loyalist',
  'reformer',
  'traditionalist',
  'economist',
  'security-chief',
]

export function pickThreeDeputies(): [DeputyKey, DeputyKey, DeputyKey] {
  const shuffled = [...ALL_DEPUTY_KEYS].sort(() => Math.random() - 0.5)
  return [shuffled[0], shuffled[1], shuffled[2]]
}
