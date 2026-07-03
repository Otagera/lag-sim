import type { EventCard } from '../../state/types'

// Three mandatory campaign event cards — fire during campaign mode (weeks 195–208)

export const electionEvents: EventCard[] = [
  {
    id: 'campaign-rally-location',
    title: 'Campaign: Rally Location',
    body: `The campaign opens. Your first major rally can only be in one place — where do you anchor the narrative? Each location sends a signal about whose Lagos this term was for.`,
    severity: 'high',
    category: 'election',
    choices: [
      {
        id: 'rally-alimosho',
        label: 'Alimosho & Periphery',
        description:
          'Show up where your approval is lowest. Alimosho +8, Periphery +6. Lekki/VI see it as pandering. Trust +4.',
        immediate: { publicTrust: 4 },
        factionImpact: { informalEconomy: 8, civilSocietyMedia: 5 },
        constituencyImpact: { alimosho: 8, ikorodu: 6, lagosIsland: -3 },
      },
      {
        id: 'rally-lagos-island',
        label: 'Lagos Island & Business District',
        description:
          'Energise your base. Business Community +8. Periphery sees it as abandonment. Political Capital -10.',
        immediate: { politicalCapital: -10 },
        factionImpact: { businessCommunity: 8, lgChairmen: -4 },
        constituencyImpact: { lagosIsland: 10, etiOsa: 8, alimosho: -4, lagosMainland: -5 },
      },
      {
        id: 'rally-surulere',
        label: 'Surulere (Swing Territory)',
        description:
          'Target the undecideds. Balanced approach. Trust +3, Surulere +8. Lower ceiling, safer floor.',
        immediate: { publicTrust: 3 },
        factionImpact: { civilSocietyMedia: 4 },
        constituencyImpact: { surulere: 8, oshodiIsolo: 5 },
      },
    ],
  },
  {
    id: 'campaign-policy-promise',
    title: 'Campaign: Policy Promise',
    body: `Your manifesto needs a signature promise. This is the one initiative every voter will associate with your second term. Choose carefully — it will define the mandate and create a real obligation.`,
    severity: 'high',
    category: 'election',
    choices: [
      {
        id: 'promise-education',
        label: 'Free Secondary Education',
        description:
          'Trust +8, Alimosho/Periphery/Makoko +6 each. Business Community -3 (tax implications). Costs real money if you win.',
        immediate: { publicTrust: 8 },
        factionImpact: { civilSocietyMedia: 10, businessCommunity: -3 },
        constituencyImpact: { alimosho: 6, ikorodu: 6, lagosMainland: 6 },
      },
      {
        id: 'promise-infrastructure',
        label: 'Lagos Metro Rail Phase 2',
        description:
          'Infrastructure +3, Business Community +8. Lekki and Lagos Island +6. Looks aspirational. Peripheral communities unmoved.',
        immediate: { infrastructureScore: 3 },
        factionImpact: { businessCommunity: 8, federalGovt: 5 },
        constituencyImpact: { ibejuLekki: 6, lagosIsland: 6, etiOsa: 5 },
      },
      {
        id: 'promise-youth-jobs',
        label: '100,000 Youth Employment Fund',
        description:
          'Youth Tension -12. Dayo loses traction. Trust +5. Costs more than the budget can absorb. Informal Economy +8.',
        immediate: { publicTrust: 5, youthTension: -12 },
        factionImpact: { informalEconomy: 8, civilSocietyMedia: 6 },
        constituencyImpact: { alimosho: 5, oshodiIsolo: 5, lagosMainland: 5 },
      },
    ],
  },
  {
    id: 'campaign-media-strategy',
    title: 'Campaign: Media Strategy',
    body: `Your communications team is finalising the final three weeks' media plan. You have limited airtime, digital budget, and your opponent is pushing hard. One dominant strategy — what's the message?`,
    severity: 'medium',
    category: 'election',
    choices: [
      {
        id: 'go-positive',
        label: 'Run on Your Record',
        description:
          'Infrastructure delivered, trust maintained. Civil Society +8, Business +5. Works if your numbers are good.',
        immediate: { publicTrust: 5 },
        factionImpact: { civilSocietyMedia: 8, businessCommunity: 5 },
      },
      {
        id: 'attack-opponent',
        label: "Attack Opponent's Credibility",
        description:
          'Effective if they have vulnerabilities. Trust -4 (negative campaign), but Political Capital +8. Godfathers like the aggression.',
        immediate: { publicTrust: -4, politicalCapital: 8 },
        factionImpact: { partyGodfathers: 8, civilSocietyMedia: -6 },
      },
      {
        id: 'defend-reform',
        label: 'Lead With Accountability',
        description:
          'Tout transparency measures, debt management, corruption fight. Civil Society +12. Less effective in LG strongholds.',
        immediate: { corruptionPressure: -4, publicTrust: 6 },
        factionImpact: { civilSocietyMedia: 12, businessCommunity: 4, partyGodfathers: -5 },
      },
    ],
  },
]
