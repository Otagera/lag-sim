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
          followUpEventId: 'ghost-worker-strike-negotiation',
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
          followUpEventId: 'ghost-worker-damage-control',
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
  {
    id: 'ghost-worker-strike-negotiation',
    title: 'Ghost Worker Strike — Negotiation Time',
    body: `The civil service union has made good on its threat. 40,000 workers are on strike across the Alausa Secretariat, LASBCA, LASTMA, and LAWMA. LG Chairmen are backing them openly. The city is partially paralysed. The union's demand is simple: reinstate the sacked ghost workers or negotiate severance terms.`,
    severity: 'high',
    category: 'political',
    choices: [
      {
        id: 'hardline-replacement',
        label: 'Replace Strikers',
        description:
          'Hire replacements through private agencies. Breaks the strike permanently. Security +4, Trust -4, YouthTension +6. Saves ₦640m/mth long-term.',
        immediate: { securityIndex: 4, publicTrust: -4, youthTension: 6 },
        factionImpact: { lgChairmen: -10, civilSocietyMedia: -6 },
      },
      {
        id: 'negotiate-severance',
        label: 'Negotiate Severance',
        description:
          'Agree to 3 months back pay for the sacked ghost workers. Expenditure +0.8bn one-time, Trust +6, Union pacified.',
        immediate: { expenditure: 0.8, publicTrust: 6, politicalCapital: 5 },
        factionImpact: { lgChairmen: 8 },
      },
      {
        id: 'mediate-delay',
        label: 'Mediate, Buy Time',
        description:
          'Appoint a committee to investigate and report in 6 weeks. Political Capital -10. Strike continues 4 more weeks, Trust -3.',
        immediate: { publicTrust: -3, politicalCapital: -10 },
        factionImpact: {},
        delayed: {
          weekOffset: 4,
          delta: { publicTrust: -5 },
          eventText: `The mediation committee on the ghost worker strike has failed to reach agreement. Public patience is wearing thin.`,
          followUpEventId: 'ghost-worker-strike-negotiation',
        },
      },
    ],
  },
  {
    id: 'ghost-worker-damage-control',
    title: 'Ghost Worker Scandal — Fallout',
    body: `The leaked audit report is dominating every news cycle. Civil society groups are calling for an independent inquiry. The opposition is using it in every press conference. Your inner circle is divided on how to respond.`,
    severity: 'high',
    category: 'political',
    choices: [
      {
        id: 'full-transparency',
        label: 'Full Transparency',
        description:
          'Publish the full report, refer for prosecution. PublicTrust +8, PoliticalCapital -15, CivilSociety +10. Some of your own will be arrested.',
        immediate: { publicTrust: 8, politicalCapital: -15 },
        factionImpact: { civilSocietyMedia: 10, partyGodfathers: -8 },
      },
      {
        id: 'blame-underlings',
        label: 'Blame Underlings',
        description:
          'Sacrifice two directors, claim you knew nothing. PoliticalCapital +5, CorruptionPressure +3, CivilSociety -8. The story lives on.',
        immediate: { politicalCapital: 5, corruptionPressure: 3 },
        factionImpact: { civilSocietyMedia: -8 },
        delayed: {
          weekOffset: 6,
          delta: { publicTrust: -6 },
          factionImpact: { civilSocietyMedia: -5 },
          eventText: `Journalists have traced the ghost worker scheme to your campaign treasurer. The "I knew nothing" defence is crumbling.`,
        },
      },
      {
        id: 'reform-commission',
        label: 'Launch Reform Commission',
        description:
          'Announce a sweeping civil service reform commission. PoliticalCapital -20, PublicTrust +6, InfrastructureScore +2. Takes 12 weeks.',
        immediate: { publicTrust: 6, infrastructureScore: 2, politicalCapital: -20 },
        factionImpact: { civilSocietyMedia: 8, lgChairmen: -5 },
        delayed: {
          weekOffset: 12,
          delta: { expenditure: -0.3 },
          eventText: `The civil service reform commission has delivered its report. Implementation promises to save ₦300m per month in efficiency gains.`,
        },
      },
    ],
  },
]
