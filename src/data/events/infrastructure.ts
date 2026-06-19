import type { EventCard } from '../../state/types'

export const infrastructureEvents: EventCard[] = [
  {
    id: 'bridgeCollapse',
    title: 'Bridge Collapse',
    body: `A critical bridge in the city has collapsed, causing significant disruption to transportation and raising concerns about infrastructure safety. The public is demanding swift action.`,
    severity: 'high',
    category: 'infrastructure',
    week: 2,
    triggerCondition: (state) => state.stats.infrastructureScore < 45,
    choices: [
      {
        id: 'rebuildBridge',
        label: 'Rebuild the Bridge',
        description:
          'Allocate funds to rebuild the bridge with improved safety standards, demonstrating a commitment to infrastructure.',
        immediate: { expenditure: -10, infrastructureScore: +15 },
        factionImpact: { federalGovt: +5, businessCommunity: +3 },
        politicalCapitalCost: 25,
      },
      {
        id: 'temporaryFix',
        label: 'Implement Temporary Fixes',
        description:
          'Focus on temporary repairs to restore functionality quickly, but it may not address long-term safety concerns.',
        immediate: { expenditure: -5, infrastructureScore: +5 },
        factionImpact: { federalGovt: +2, businessCommunity: +1 },
        politicalCapitalCost: 10,
      },
    ],
  },
  {
    id: 'lekki-flooding-developer',
    title: 'Lekki Flooding — Developer Liability',
    body: `Three Lekki Phase 2 estates are underwater after a developer illegally blocked a primary drainage channel during construction. Residents are furious. The developer contributed ₦80m to your campaign.`,
    severity: 'medium',
    category: 'infrastructure',
    choices: [
      {
        id: 'full-enforcement-fine',
        label: 'Full Enforcement',
        description:
          'Heavy fine, clear the drain. Trust +8, Infrastructure +4. Godfathers and Business Community angry. Fine revenue +₦0.2bn.',
        immediate: { publicTrust: 8, infrastructureScore: 4, igr: 0.2 },
        factionImpact: { partyGodfathers: -12, businessCommunity: -5 },
      },
      {
        id: 'quiet-mediation',
        label: 'Quiet Mediation',
        description:
          'Handle it quietly. Godfathers happy, but residents and Civil Society see through it.',
        immediate: { corruptionPressure: 2, publicTrust: -6 },
        factionImpact: { partyGodfathers: 8, civilSocietyMedia: -10 },
      },
      {
        id: 'blame-federal',
        label: 'Blame Federal Authority',
        description: 'Blame the federal drainage authority. Buys time but Media sees through it.',
        immediate: { publicTrust: -4 },
        factionImpact: { civilSocietyMedia: -8 },
      },
    ],
  },
  {
    id: 'eko-atlantic-erosion',
    title: 'Eko Atlantic Erosion Report',
    body: `An independent report shows that Eko Atlantic's sea wall is accelerating erosion on Bar Beach and threatening foundations 2km east. The developers are connected to major party donors. The science is clear.`,
    severity: 'medium',
    category: 'infrastructure',
    choices: [
      {
        id: 'commission-response',
        label: 'Demand Developer Contribution',
        description:
          'Commission state response, demand developer contribute. Civil Society +10, Trust +5. Business and Godfathers upset.',
        immediate: { infrastructureScore: -2, publicTrust: 5 },
        factionImpact: { businessCommunity: -8, partyGodfathers: -10, civilSocietyMedia: 10 },
      },
      {
        id: 'suppress-report',
        label: 'Suppress Report',
        description: 'Bury it. Corruption Pressure rises. If it leaks (wk 10), the crisis doubles.',
        immediate: { corruptionPressure: 8 },
        factionImpact: { civilSocietyMedia: -5 },
        delayed: {
          weekOffset: 10,
          delta: { publicTrust: -18, corruptionPressure: 10 },
          factionImpact: { civilSocietyMedia: -15 },
          eventText: `The Eko Atlantic erosion report you suppressed has leaked. The backlash is severe.`,
          followUpEventId: 'eko-atlantic-damage-control',
        },
      },
      {
        id: 'redirect-costs',
        label: 'Redirect Costs to Budget',
        description:
          'Absorb erosion management into state budget. Godfathers +6, Business +4. Costs ₦0.6bn/mth.',
        immediate: { igr: -0.6 },
        factionImpact: { partyGodfathers: 6, businessCommunity: 4 },
      },
    ],
  },
  {
    id: 'power-deal-generator',
    title: 'Power Deal — Independent Generator',
    body: `A private company is offering to build a 500MW gas-powered plant serving Lagos Island and VI exclusively. It will solve power for the economic heartland but widen the visible gap with mainland Lagos and Alimosho.`,
    severity: 'medium',
    category: 'infrastructure',
    choices: [
      {
        id: 'accept-deal',
        label: 'Accept Deal',
        description:
          'Business Community +15, VI/Island Trust +20, Alimosho Trust -15, Informal Economy -8, Youth Tension +5, IGR +1.2bn.',
        immediate: { igr: 1.2, youthTension: 5 },
        factionImpact: { businessCommunity: 15, informalEconomy: -8 },
        constituencyImpact: { victoriaIsland: 20, lagosIsland: 20, alimosho: -15 },
      },
      {
        id: 'renegotiate',
        label: 'Renegotiate for State-wide',
        description:
          'Slower, more expensive. Costs Political Capital and upfront IGR. More equitable payoff in 16 weeks.',
        immediate: { igr: -1 },
        factionImpact: {},
        politicalCapitalCost: 20,
        delayed: {
          weekOffset: 16,
          delta: { infrastructureScore: 10, igr: 2 },
          eventText: `The renegotiated power deal is finally online — coverage across all Lagos LGAs. The economic uplift is visible everywhere.`,
        },
      },
      {
        id: 'decline-national-grid',
        label: 'Decline, Push for Grid',
        description:
          'Advocate for national grid improvements. Federal Relationship +5, Business -10. Delays solution 12+ weeks.',
        immediate: {},
        factionImpact: { federalGovt: 5, businessCommunity: -10 },
      },
    ],
  },
  {
    id: 'olusosun-landfill-crisis',
    title: 'Olusosun Landfill Crisis',
    body: `Olusosun landfill in Ojota is at 140% capacity. A methane fire has been burning for 9 days. Residents of Ojota, Maryland, and Ketu are reporting respiratory issues. LAWMA is overwhelmed. This is the largest landfill in West Africa and there is no plan B.`,
    severity: 'high',
    category: 'infrastructure',
    choices: [
      {
        id: 'emergency-closure',
        label: 'Emergency Closure',
        description:
          'Activate satellite dump sites. Infrastructure +5, Trust +6 locally. Disrupts collection for 3 weeks, costs ₦0.5bn.',
        immediate: { infrastructureScore: 5, publicTrust: 6, igr: -0.5 },
        factionImpact: {},
      },
      {
        id: 'private-contract',
        label: 'Engage Private Company',
        description:
          '₦2bn contract, faster fix. Godfather +8 (his company), Civil Society -6. Delays 4 weeks.',
        immediate: { igr: -2 },
        factionImpact: { partyGodfathers: 8, civilSocietyMedia: -6 },
      },
      {
        id: 'temporary-containment',
        label: 'Temporary Containment',
        description: `Slow, clean, right answer. Costs time and Political Capital. Won't fix the fire today.`,
        immediate: {},
        factionImpact: {},
        politicalCapitalCost: 20,
      },
    ],
  },
  {
    id: 'eko-atlantic-damage-control',
    title: 'Eko Atlantic Erosion — Cover-Up Exposed',
    body: `The leaked report showing that Eko Atlantic's sea wall is accelerating erosion is the lead story everywhere. Civil society has called for your head. The British High Commission has quietly inquired about investor protection — the developers are connected to London. Your administration is on the defensive.`,
    severity: 'high',
    category: 'infrastructure',
    choices: [
      {
        id: 'full-admission-reverse',
        label: 'Full Admission & Reversal',
        description:
          'Admit the suppression was wrong, reverse course, demand developer contribution. PublicTrust +10, PoliticalCapital -20, CivilSociety +12, BusinessCommunity -8.',
        immediate: { publicTrust: 10, politicalCapital: -20 },
        factionImpact: { civilSocietyMedia: 12, businessCommunity: -8, partyGodfathers: -5 },
        delayed: {
          weekOffset: 8,
          delta: { infrastructureScore: 8 },
          eventText: `The Eko Atlantic course reversal is working. Independent engineers confirm the new coastal protection measures are holding.`,
        },
      },
      {
        id: 'blame-rogue-staff',
        label: 'Blame Rogue Staff',
        description:
          'Blame a mid-level official for the suppression. PoliticalCapital -5, CorruptionPressure +5, CivilSociety -10. Partially contains the damage.',
        immediate: { politicalCapital: -5, corruptionPressure: 5 },
        factionImpact: { civilSocietyMedia: -10 },
      },
      {
        id: 'ride-it-out',
        label: 'Ride It Out',
        description:
          'Say nothing, let the cycle pass. PublicTrust -4 continues to decay. Spend nothing, save Political Capital.',
        immediate: { publicTrust: -4 },
        factionImpact: {},
      },
    ],
  },
]
