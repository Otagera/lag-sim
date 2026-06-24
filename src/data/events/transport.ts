import type { EventCard } from '../../state/types'

export const transportEvents: EventCard[] = [
  {
    id: 'trafficCongestion',
    title: 'Traffic Congestion Crisis',
    body: `The city is facing severe traffic congestion, leading to delays, increased pollution, and public frustration. Citizens are demanding solutions to improve transportation efficiency.`,
    severity: 'high',
    category: 'transport',
    week: 4,
    triggerCondition: (state) => state.stats.infrastructureScore < 50,
    choices: [
      {
        id: 'investInPublicTransport',
        label: 'Invest in Public Transport',
        description:
          'Allocate funds to improve public transportation infrastructure, encouraging citizens to use alternative modes of transport.',
        immediate: { expenditure: -10, infrastructureScore: +10 },
        factionImpact: { federalGovt: +5, businessCommunity: +3 },
        politicalCapitalCost: 20,
      },
      {
        id: 'expandRoadNetwork',
        label: 'Expand Road Network',
        description:
          'Focus on expanding the road network to accommodate more vehicles, but it may lead to increased traffic in the long run.',
        immediate: { expenditure: -15, infrastructureScore: +5 },
        factionImpact: { federalGovt: +3, businessCommunity: +5 },
        politicalCapitalCost: 25,
      },
    ],
  },
  {
    id: 'third-mainland-bridge-emergency',
    title: 'Third Mainland Bridge Emergency',
    body: `A structural engineering report has been leaked to Vanguard. Three of the bridge's expansion joints are rated critical. The bridge carries 100,000+ vehicles daily. The report is already trending on Lagos Twitter.`,
    severity: 'critical',
    category: 'transport',
    choices: [
      {
        id: 'full-closure',
        label: 'Full Closure',
        description:
          'Emergency repairs — Infrastructure +15 (delayed 8wks), Trust -12 now, Business Community angry, IGR -0.8bn/wk for 6 weeks',
        immediate: { publicTrust: -12, igr: -0.8 },
        factionImpact: { businessCommunity: -8 },
        delayed: {
          weekOffset: 8,
          delta: { infrastructureScore: 15 },
          eventText: `The bridge is open. The structural engineers have signed off — 'safe for another 20 years,' they say. But the 8-week closure cost Lagos an estimated ₦4.2bn in lost productivity. The taxi driver who takes you across tells you: 'Na only God save us. Nobody fit run from that bridge if e collapse.'`,
        },
      },
      {
        id: 'patch-and-monitor',
        label: 'Patch and Monitor',
        description:
          'Quick patch work, no disruption. Infrastructure +3, Corruption Pressure +4. Civil Society angry. If scandal breaks, much worse.',
        immediate: { infrastructureScore: 3, corruptionPressure: 4 },
        factionImpact: { civilSocietyMedia: -6 },
      },
      {
        id: 'independent-review',
        label: 'Commission Review',
        description:
          'Commission an independent review — buys 4 weeks. Costs Political Capital. Media approves. Problem does not go away.',
        immediate: {},
        factionImpact: { civilSocietyMedia: 5 },
        politicalCapitalCost: 15,
      },
    ],
  },
  {
    id: 'viral-pothole-video',
    title: 'Viral Pothole Video',
    body: `A video of a woman's car swallowed by a pothole on Mobolaji Bank Anthony Way has 2.4 million views. The comments section is a referendum on your administration. It is Monday morning.`,
    severity: 'low',
    category: 'transport',
    choices: [
      {
        id: 'fix-and-announce',
        label: 'Fix Publicly',
        description:
          'Fix it publicly, announce rapid response unit. Trust +6, Infrastructure +2, costs attention and ₦15m.',
        immediate: { publicTrust: 6, infrastructureScore: 2 },
        factionImpact: { civilSocietyMedia: 5 },
      },
      {
        id: 'fix-quietly',
        label: 'Fix Quietly',
        description:
          'Issue a statement, fix the road quietly. Modest trust gain, costs less attention.',
        immediate: { publicTrust: 2 },
        factionImpact: {},
      },
      {
        id: 'ignore-video',
        label: 'Ignore It',
        description:
          'Let the cycle pass. 40% chance it becomes a permanent meme that tanks your name.',
        immediate: {},
        factionImpact: {},
      },
    ],
  },
]
