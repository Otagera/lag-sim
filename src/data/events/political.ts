import type { EventCard } from '../../state/types'

export const politicalEvents: EventCard[] = [
  {
    id: 'corruptionScandal',
    title: 'Corruption Scandal',
    body: `A corruption scandal has emerged within the city government, involving several high-ranking officials. The public is demanding transparency and accountability.`,
    severity: 'high',
    category: 'political',
    week: 3,
    triggerCondition: (state) => state.factions.civilSocietyMedia > 60,
    choices: [
      {
        id: 'launchInvestigation',
        label: 'Launch Investigation',
        description:
          'Initiate a thorough investigation into the allegations, demonstrating a commitment to integrity.',
        immediate: { publicTrust: +10, politicalCapital: -15 },
        factionImpact: { civilSocietyMedia: +5, businessCommunity: -5 },
        politicalCapitalCost: 15,
      },
      {
        id: 'ignoreAllegations',
        label: 'Ignore Allegations',
        description:
          'Downplay the scandal and avoid taking any action, risking further damage to credibility.',
        immediate: { publicTrust: -5, politicalCapital: +10 },
        factionImpact: { civilSocietyMedia: -5, businessCommunity: +5 },
        politicalCapitalCost: 10,
      },
    ],
  },
  {
    id: 'electionCampaign',
    title: 'Election Campaign',
    body: `The city is entering an election season, and political campaigns are heating up. Citizens are paying close attention to candidates' promises and actions.`,
    severity: 'medium',
    category: 'political',
    week: 5,
    triggerCondition: (state) => state.stats.publicTrust < 50,
    choices: [
      {
        id: 'focusOnPromises',
        label: 'Focus on Promises',
        description:
          'Highlight your campaign promises and plans for the city, aiming to gain public support.',
        immediate: { publicTrust: +10, politicalCapital: -10 },
        factionImpact: { civilSocietyMedia: +5, businessCommunity: +3 },
        politicalCapitalCost: 15,
      },
      {
        id: 'criticizeOpponents',
        label: 'Criticize Opponents',
        description:
          'Launch a campaign against your opponents, but risk alienating some voters and factions.',
        immediate: { publicTrust: -5, politicalCapital: +10 },
        factionImpact: { civilSocietyMedia: -3, businessCommunity: -2 },
        politicalCapitalCost: 10,
      },
    ],
  },
  {
    id: 'lasg-ghost-workers',
    title: 'LASG Ghost Workers — Payroll Audit',
    body: `An internal audit has found 3,200 ghost workers on the civil service payroll. Monthly drain: approximately ₦640m. The auditors are loyal to you, so this is not yet public. But it won't stay that way.`,
    severity: 'high',
    category: 'political',
    choices: [
      {
        id: 'immediate-purge',
        label: 'Immediate Purge',
        description:
          'Clean house now. Saves ₦640m/mth. Unions and LG Chairmen furious. Trust +5 when it leaks. Union threatens strike in 4 weeks.',
        immediate: { cashReserve: 0.64, publicTrust: 5 },
        factionImpact: { lgChairmen: -6 },
        delayed: {
          weekOffset: 4,
          delta: {},
          factionImpact: { lgChairmen: -6 },
          eventText: `The civil service union has voted to go on strike over your mass purge of ghost workers. LG Chairmen are backing them.`,
        },
      },
      {
        id: 'quiet-phased-removal',
        label: 'Quiet Phased Removal',
        description:
          'Slower savings, less disruption. Costs Political Capital. Civil Society approves if announced as reform.',
        immediate: {},
        factionImpact: { civilSocietyMedia: 3 },
        politicalCapitalCost: 20,
      },
      {
        id: 'sit-on-it',
        label: 'Sit on It',
        description:
          'Nothing changes. Corruption Pressure +5. When it leaks (wk 10-14), Trust -18, Civil Society -20.',
        immediate: { corruptionPressure: 5 },
        factionImpact: {},
        delayed: {
          weekOffset: 12,
          delta: { publicTrust: -18 },
          factionImpact: { civilSocietyMedia: -20 },
          eventText: `The ghost worker audit you buried has leaked to the press. The public is furious.`,
        },
      },
    ],
  },
  {
    id: 'federal-character-appointment',
    title: 'Federal Character Appointment',
    body: `The Presidency has called. Abuja wants to place their preferred candidate as Commissioner for Works — a position that controls all state road contracts. The candidate is qualified but is not your person.`,
    severity: 'medium',
    category: 'political',
    choices: [
      {
        id: 'accept-candidate',
        label: 'Accept',
        description:
          'Federal Relationship +10. You look weak locally. Godfather -8 (his candidate loses the slot).',
        immediate: {},
        factionImpact: { federalGovt: 10, partyGodfathers: -8 },
        politicalCapitalCost: 10,
      },
      {
        id: 'decline-firmly',
        label: 'Decline Firmly',
        description:
          'Federal Relationship -12. Political Capital +8 locally. Next FAAC allocation may be delayed.',
        immediate: { politicalCapital: 8 },
        factionImpact: { federalGovt: -12 },
      },
      {
        id: 'counter-offer',
        label: 'Counter-Offer',
        description:
          'Spend Political Capital to negotiate a different position. Federal -3, Godfather neutral. You keep Works.',
        immediate: {},
        factionImpact: { federalGovt: -3 },
        politicalCapitalCost: 25,
      },
    ],
  },
]
