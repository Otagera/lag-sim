import type { EventCard } from '../../state/types'

export const riotEvents: EventCard[] = [
  {
    id: 'riot-curfew-order',
    title: 'Crisis: Curfew Demands',
    body: `Youth protests have turned violent in Alimosho and Surulere.
Security chiefs are requesting emergency curfew powers.
Every hour without a decision emboldens more agitators.`,
    severity: 'critical',
    category: 'riot',
    isRecurring: true,
    cooldownWeeks: 4,
    choices: [
      {
        id: 'blanket-curfew',
        label: 'Blanket Curfew',
        description: 'State-wide 6pm curfew enforced immediately. Tension falls fast, trust takes a hit.',
        immediate: { youthTension: -18, publicTrust: -12, securityIndex: 6 },
        factionImpact: { civilSocietyMedia: -15, informalEconomy: -8 },
        constituencyImpact: { alimosho: -10, surulere: -8 },
      },
      {
        id: 'targeted-curfew',
        label: 'Targeted Curfew',
        description: 'Curfew in flashpoint LGAs only. More measured response.',
        immediate: { youthTension: -10, publicTrust: -5, securityIndex: 4 },
        factionImpact: { civilSocietyMedia: -6, informalEconomy: -4 },
        constituencyImpact: { alimosho: -5 },
      },
      {
        id: 'negotiate-first',
        label: 'Negotiate First',
        description: 'Delay enforcement, send emissaries. Trust recovers, tension slower to fall.',
        immediate: { youthTension: -5, publicTrust: 6, politicalCapital: -10 },
        factionImpact: { civilSocietyMedia: 12, informalEconomy: 5 },
      },
    ],
  },
  {
    id: 'riot-security-surge',
    title: 'Crisis: Security Surge',
    body: `The Inspector General of Police is requesting authority to deploy rapid-response squads across Lagos.
A federal offer to co-deploy Army units is also on the table.
Each hour of delay is broadcast live.`,
    severity: 'critical',
    category: 'riot',
    isRecurring: true,
    cooldownWeeks: 6,
    choices: [
      {
        id: 'deploy-task-force',
        label: 'Deploy Task Force',
        description: 'State-funded rapid response. Effective but burns cash reserves.',
        immediate: { youthTension: -12, securityIndex: 10, cashReserve: -0.6 },
        factionImpact: { federalGovt: 3, businessCommunity: 5 },
        constituencyImpact: { alimosho: -5, ikorodu: -5 },
      },
      {
        id: 'request-federal-backup',
        label: 'Request Federal Backup',
        description: 'Army units restore order faster, but federalises a state crisis. Aso Rock gains leverage.',
        immediate: { youthTension: -20, securityIndex: 14 },
        factionImpact: { federalGovt: -8, civilSocietyMedia: -10 },
        constituencyImpact: { alimosho: -12, lagosMainland: -8 },
      },
      {
        id: 'hold-back',
        label: 'Hold Police Back',
        description: 'Avoid escalation. Tension stays high but no abuse-of-force headlines.',
        immediate: { youthTension: 5, publicTrust: -8 },
        factionImpact: { partyGodfathers: -5, businessCommunity: -8 },
      },
    ],
  },
  {
    id: 'riot-youth-leader-parley',
    title: 'Crisis: Youth Leaders Demand Audience',
    body: `A coalition of youth leaders — some legitimate, some opportunist — has issued a 48-hour ultimatum:
meet publicly and announce reforms, or escalation continues.
Social media is watching.`,
    severity: 'high',
    category: 'riot',
    isRecurring: true,
    cooldownWeeks: 5,
    choices: [
      {
        id: 'meet-publicly',
        label: 'Meet Publicly',
        description: 'Live-streamed town hall with youth leaders. Trust up, tension drops significantly.',
        immediate: { youthTension: -22, publicTrust: 12 },
        factionImpact: { civilSocietyMedia: 18, partyGodfathers: -5 },
        politicalCapitalCost: 15,
      },
      {
        id: 'back-channel',
        label: 'Back-Channel Meeting',
        description: 'Quiet negotiation. Less optics, still effective.',
        immediate: { youthTension: -12, publicTrust: 4 },
        factionImpact: { civilSocietyMedia: 6 },
        politicalCapitalCost: 8,
      },
      {
        id: 'refuse-parley',
        label: 'Refuse',
        description: 'Signal firm authority. Tension surges. Civil society erupts.',
        immediate: { youthTension: 14, publicTrust: -18 },
        factionImpact: { civilSocietyMedia: -20, informalEconomy: -10 },
        constituencyImpact: { alimosho: -15, surulere: -12, ikorodu: -10 },
      },
    ],
  },
]
