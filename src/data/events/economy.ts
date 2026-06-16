import type { EventCard } from '../../state/types'

export const economyEvents: EventCard[] = [
  {
    id: 'taxEvasionScandal',
    title: 'Tax Evasion Scandal',
    body: `A major tax evasion scandal has come to light, involving several high-profile businesses in the city. The public is outraged and demanding accountability.`,
    severity: 'medium',
    category: 'economy',
    week: 4,
    triggerCondition: (state) => state.factions.businessCommunity > 60,
    choices: [
      {
        id: 'investigateThoroughly',
        label: 'Investigate Thoroughly',
        description:
          'Launch a comprehensive investigation into the scandal, demonstrating a commitment to justice.',
        immediate: { publicTrust: +10, politicalCapital: -15 },
        factionImpact: { businessCommunity: -10, civilSocietyMedia: +5 },
        politicalCapitalCost: 15,
      },
      {
        id: 'downplayIssue',
        label: 'Downplay the Issue',
        description:
          "Minimize the scandal's impact in public statements, but risk losing credibility.",
        immediate: { publicTrust: -5, politicalCapital: +10 },
        factionImpact: { businessCommunity: +5, civilSocietyMedia: -5 },
        politicalCapitalCost: 10,
      },
    ],
  },
  {
    id: 'inflationSpike',
    title: 'Inflation Spike',
    body: `The city is experiencing a sudden spike in inflation, leading to increased prices for goods and services. Citizens are struggling to cope with the rising cost of living.`,
    severity: 'high',
    category: 'economy',
    week: 5,
    triggerCondition: (state) => state.stats.igr < 10,
    choices: [
      {
        id: 'implementPriceControls',
        label: 'Implement Price Controls',
        description:
          'Introduce temporary price controls on essential goods to protect citizens from inflation.',
        immediate: { expenditure: -5, publicTrust: +10 },
        factionImpact: { civilSocietyMedia: +5, businessCommunity: -5 },
        politicalCapitalCost: 20,
      },
      {
        id: 'promoteEconomicGrowth',
        label: 'Promote Economic Growth',
        description:
          'Focus on long-term economic growth strategies to stabilize the economy, but it may take time to see results.',
        immediate: { expenditure: -10, igr: +5 },
        factionImpact: { businessCommunity: +5, civilSocietyMedia: -5 },
        politicalCapitalCost: 25,
      },
    ],
  },
  {
    id: 'agbero-ultimatum',
    title: 'Agbero Ultimatum',
    body: `NURTW-affiliated agberos have given the state government 72 hours to reverse the new transport levy or they will ground buses across Oshodi, Ojota, and Mile 2. The informal economy moves Lagos. This is not an empty threat.`,
    severity: 'high',
    category: 'economy',
    choices: [
      {
        id: 'pay-levy-relief',
        label: 'Pay Levy Relief',
        description:
          'Transport keeps moving. IGR -0.3bn, Corruption +3, Informal Economy +8, Business Community -4 (you rewarded extortion).',
        immediate: { igr: -0.3, corruptionPressure: 3 },
        factionImpact: { informalEconomy: 8, businessCommunity: -4 },
      },
      {
        id: 'arrest-leadership',
        label: 'Arrest Faction Leadership',
        description:
          'Security +5 now. Informal Economy -15, LG Chairmen -8. Wildcat strike wk 6: IGR -1.2bn for one week.',
        immediate: { securityIndex: 5 },
        factionImpact: { informalEconomy: -15, lgChairmen: -8 },
        delayed: {
          weekOffset: 6,
          delta: { igr: -1.2 },
          eventText: `The agberos have made good on their threat — a wildcat strike has shut down transport across the city. Lagos has lost ₦1.2bn in productivity this week.`,
        },
      },
      {
        id: 'negotiate-lg-chairmen',
        label: 'Negotiate via LG Chairmen',
        description:
          'Spend Political Capital. Informal Economy +4, LG Chairmen +6. Delays problem 8 weeks, does not resolve it.',
        immediate: {},
        factionImpact: { informalEconomy: 4, lgChairmen: 6 },
        politicalCapitalCost: 20,
      },
    ],
  },
  {
    id: 'faac-shortfall',
    title: 'FAAC Shortfall',
    body: `Abuja has announced a 35% reduction in this month's FAAC allocation due to oil production shortfalls. This is ₦4.2bn less than projected. Civil servant salaries are due in 11 days.`,
    severity: 'high',
    category: 'economy',
    choices: [
      {
        id: 'emergency-borrowing',
        label: 'Emergency Borrowing',
        description: 'Salaries paid. Debt servicing +0.4bn/mth for 6 months. Civil servants +5.',
        immediate: { igr: -0.4 },
        factionImpact: {},
      },
      {
        id: 'defer-contractor-payments',
        label: 'Defer Contractor Payments',
        description:
          'Salaries paid. Contractors angry. Infrastructure stalls. Contractors down tools wk 6.',
        immediate: {},
        factionImpact: { businessCommunity: -5 },
        delayed: {
          weekOffset: 6,
          delta: { infrastructureScore: -5 },
          eventText: `Contractors have downed tools on three major infrastructure projects. Deferred payments have caught up with you.`,
        },
      },
      {
        id: 'unlock-contingency',
        label: 'Unlock Contingency Reserve',
        description:
          'One-time draw. Cash Reserve -4.2bn, no new debt. Reserve is now thin for the next crisis.',
        immediate: { cashReserve: -4.2 },
        factionImpact: {},
      },
    ],
  },
]
