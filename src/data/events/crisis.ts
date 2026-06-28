import type { EventCard } from '../../state/types'

export const crisisEvents: EventCard[] = [
  {
    id: 'powerOutage',
    title: 'EKEDC Billing Dispute Triggers Wholesale Disconnection',
    body: `EKEDC has disconnected the Isolo and Mushin distribution feeders over an unpaid government electricity bill — ₦3.1bn accumulated across state secondary schools, health centres, and LGA offices. 48 hours without power. LASUTH's surgical ward is running on generator fuel that ran out this morning. NERC says the disconnection is lawful. The Medical Director of LASUTH says it is criminal. Both are right.`,
    severity: 'high',
    category: 'crisis',
    week: 3,
    triggerCondition: (state) => state.stats.infrastructureScore < 40,
    choices: [
      {
        id: 'investInGrid',
        label: 'Clear the Debt, Restore Power',
        description:
          'Pay ₦3.1bn arrears immediately from contingency reserves. Reconnection within 6 hours. Infrastructure +10, Business Community +3.',
        immediate: { cashReserve: -3.1, infrastructureScore: +10 },
        factionImpact: { federalGovt: +5, businessCommunity: +3 },
        politicalCapitalCost: 20,
      },
      {
        id: 'doNothing',
        label: 'Dispute the Bill, Stall',
        description:
          'Instruct the AG to challenge the EKEDC assessment. Hospitals stay dark while lawyers file. Trust -10, Security -5.',
        immediate: { publicTrust: -10, securityIndex: -5 },
        factionImpact: { civilSocietyMedia: -5, lgChairmen: -3 },
      },
    ],
  },
  {
    id: 'makoko-demolition-order',
    title: 'Makoko Demolition Order',
    body: `A federal court has upheld an old demolition order for Makoko waterfront settlement. An estimated 85,000 residents. International NGOs are already preparing statements. Your party wants the land for a real estate play.`,
    severity: 'critical',
    category: 'crisis',
    choices: [
      {
        id: 'execute-order',
        label: 'Execute the Order',
        description:
          'Godfather +12, Business +8. Informal Economy -20, Civil Society -25, Trust -15. International backlash.',
        immediate: { publicTrust: -15 },
        factionImpact: {
          partyGodfathers: 12,
          businessCommunity: 8,
          informalEconomy: -20,
          civilSocietyMedia: -25,
        },
        constituencyImpact: { lagosMainland: -30 },
        setFlags: { 'makoko-demolished': true },
      },
      {
        id: 'suspend-resettlement',
        label: 'Suspend & Resettle',
        description:
          'Buys 12 weeks. Costs Political Capital. Godfather -10. Civil Society +12, Trust +8. Resettlement will cost ₦12bn.',
        immediate: { publicTrust: 8 },
        factionImpact: { partyGodfathers: -10, civilSocietyMedia: 12 },
        politicalCapitalCost: 30,
        delayed: {
          weekOffset: 12,
          delta: { cashReserve: -12 },
          eventText: `Chief Fashemu's building contractor was seen measuring plots in Makoko yesterday. The demolition order you gave is now a bill of sale — and the water on the lagoon hasn't even receded yet.`,
          followUpEventId: 'makoko-resettlement-choice',
        },
      },
      {
        id: 'defy-court',
        label: 'Defy in Court',
        description:
          'Trust +15, Civil Society +18. Godfather -18, Federal -10, Party -15. High risk, high reward.',
        immediate: { publicTrust: 15 },
        factionImpact: { civilSocietyMedia: 18, partyGodfathers: -18, federalGovt: -10 },
      },
    ],
  },
  {
    id: 'building-collapse-lekki',
    title: 'Building Collapse — Lekki',
    body: `A 7-storey building under construction in Lekki has collapsed. 23 confirmed dead, 40 missing. The building had a Lagos State Building Control Agency (LASBCA) approval stamp. Someone was paid to approve it.`,
    severity: 'critical',
    category: 'crisis',
    choices: [
      {
        id: 'lasbca-audit',
        label: 'Immediate LASBCA Audit',
        description:
          'Suspend approvals. Trust +10, Civil Society +12. Business -15 (projects stalled). Audit reveals 40+ compromised buildings — bigger crisis ahead.',
        immediate: { publicTrust: 10 },
        factionImpact: { businessCommunity: -15, civilSocietyMedia: 12 },
        delayed: {
          weekOffset: 6,
          delta: { publicTrust: -8, infrastructureScore: -5 },
          factionImpact: { civilSocietyMedia: -5 },
          eventText: `The LASBCA audit landed on your desk at midnight. Forty-three buildings — including two on the same Lekki corridor as the collapse. Each one is a political grenade you now have to defuse one by one.`,
        },
      },
      {
        id: 'scapegoat-official',
        label: 'Scapegoat One Official',
        description:
          'Trust +3 short-term. Civil Society -8, Corruption Pressure +5. Investigation shows it goes higher (wk 8).',
        immediate: { publicTrust: 3, corruptionPressure: 5 },
        factionImpact: { civilSocietyMedia: -8 },
        delayed: {
          weekOffset: 8,
          delta: { publicTrust: -10, corruptionPressure: 5 },
          factionImpact: { civilSocietyMedia: -10 },
          eventText: `The scapegoat held for exactly one press cycle. Then he started naming names. The Permanent Secretary's WhatsApp backup is now in a lawyer's safe. You don't know what else is in there.`,
        },
      },
      {
        id: 'public-inquiry',
        label: 'Full Public Inquiry',
        description:
          'Trust +8, Civil Society +15. Costs Political Capital. Godfather -10 (one of his is exposed). Takes 8 weeks.',
        immediate: { publicTrust: 8 },
        factionImpact: { civilSocietyMedia: 15, partyGodfathers: -10 },
        politicalCapitalCost: 20,
      },
    ],
  },
  {
    id: 'tanker-explosion-berger',
    title: 'Tanker Explosion — Lagos-Ibadan Expressway',
    body: `A fuel tanker has exploded at the Berger interchange. 14 dead, 30 vehicles destroyed. The road is closed. Federal expressway — technically FERMA's jurisdiction — but it is in your city and your people are dying.`,
    severity: 'critical',
    category: 'crisis',
    choices: [
      {
        id: 'deploy-state-emergency',
        label: 'Deploy State Emergency Response',
        description:
          'Act now. Trust +12, Civil Society +10. Federal -4 (jurisdictional overstep). Costs ₦800m emergency spend.',
        immediate: { publicTrust: 12, cashReserve: -0.8 },
        factionImpact: { civilSocietyMedia: 10, federalGovt: -4 },
      },
      {
        id: 'defer-to-ferma',
        label: 'Defer to FERMA',
        description:
          'Correct jurisdictional answer. Trust -8 (looks like passing the buck). Federal +4.',
        immediate: { publicTrust: -8 },
        factionImpact: { federalGovt: 4 },
      },
      {
        id: 'joint-press-conference',
        label: 'Joint Press Conference',
        description:
          'Share credit and blame with federal minister. Costs Political Capital. Trust +5, Federal +6, Civil Society +4.',
        immediate: { publicTrust: 5 },
        factionImpact: { federalGovt: 6, civilSocietyMedia: 4 },
        politicalCapitalCost: 20,
      },
    ],
  },
  {
    id: 'makoko-resettlement-choice',
    title: 'Makoko Resettlement — Implementation',
    body: `The ₦12bn resettlement plan for Makoko waterfront is due. 85,000 people need new homes. The land earmarked for resettlement is in the periphery — 30km from the city centre, with no road or power infrastructure. Party godfathers want the prime Makoko land for luxury development. The international community is watching.`,
    severity: 'critical',
    triggerCondition: (state) => state.resolvedEvents.includes('makoko-demolition-order'),
    category: 'crisis',
    choices: [
      {
        id: 'build-new-estate',
        label: 'Build New Housing Estate',
        description:
          'Construct a proper estate with roads, power, and water. InfrastructureScore +8, CashReserve -8, Trust +10, PublicTrust +5. Godfathers furious (they wanted the land).',
        immediate: { cashReserve: -8, infrastructureScore: 8, publicTrust: 5 },
        factionImpact: { partyGodfathers: -12, civilSocietyMedia: 15 },
        constituencyImpact: { lagosMainland: 20, ikorodu: 10 },
        delayed: {
          weekOffset: 16,
          delta: { igr: 0.4 },
          eventText: `The new estate on the mainland edge is finished. The families from Makoko call it 'exile' — but the market that has sprung up at its gate generates ₦400m a week in IGR. Everyone makes peace with the name.`,
        },
      },
      {
        id: 'cash-compensation',
        label: 'Cash Compensation',
        description:
          'Pay each family ₦1.5m cash. CashReserve -12, Trust +4. BusinessCommunity +8 (prime waterfront freed). Civil Society angry at inadequate compensation.',
        immediate: { cashReserve: -12, publicTrust: 4 },
        factionImpact: { businessCommunity: 8, partyGodfathers: 10, civilSocietyMedia: -12 },
        constituencyImpact: { lagosMainland: -5 },
      },
      {
        id: 'mixed-approach',
        label: 'Mixed Approach',
        description:
          'Build basic housing, provide partial cash. CashReserve -4, InfrastructureScore +4, PoliticalCapital -15. Everyone moderately unhappy.',
        immediate: { cashReserve: -4, infrastructureScore: 4, politicalCapital: -15 },
        factionImpact: {},
        constituencyImpact: { lagosMainland: 8, ikorodu: 5 },
        delayed: {
          weekOffset: 12,
          delta: { publicTrust: 4 },
          eventText: `The phased resettlement is messy, slow, and still displacing people one street at a time. No one is burning tyres yet. In Lagos, that counts as 'on track.'`,
        },
      },
    ],
  },
]
