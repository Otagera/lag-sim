import type { EventCard } from '../../state/types'

// Mid-game chapter events — narrative spine for weeks 52-150.
// All use triggerCondition so they fire as triggered events (bypass pool),
// creating year-anchored inflection points regardless of player luck.

export const midgameEvents: EventCard[] = [
  {
    id: 'midgame-year2-media-reckoning',
    title: 'Year One: The Press Verdict',
    body: `A consortium of Lagos newspapers has published their first-year governance scorecards simultaneously — The Punch, Vanguard, The Nation, and ThisDay. The consensus is "governance without direction." Three specific criticisms dominate the coverage: infrastructure spend without measurable outcome, youth unemployment worsening in three local government areas, and fiscal opacity on capital projects.

The reports have trended for two days. International wire services are picking up the "Lagos governance failure" narrative. Your Press Secretary is fielding seventeen interview requests.`,
    severity: 'high',
    category: 'political',
    triggerCondition: (state) => state.week >= 60 && state.currentTerm === 1,
    choices: [
      {
        id: 'host-press-conference',
        label: 'Hold a Full Press Conference — Open the Books',
        description: 'Call a nationally televised press conference. Publish raw budget execution data. Trust +5. Civil Society +8. Corruption Pressure -4. Political Capital -10.',
        immediate: { publicTrust: 5, corruptionPressure: -4, politicalCapital: -10 },
        factionImpact: { civilSocietyMedia: 8 },
        setFlags: { 'year2-media-reckoning-resolved': true },
      },
      {
        id: 'commission-performance-audit',
        label: 'Commission Independent Performance Audit',
        description: 'Hire a credible independent firm to audit your first-year performance. Civil Society +10. Corruption Pressure -6. Trust +4. Takes 6 weeks — no immediate news cycle win. Cash -₦0.3bn.',
        immediate: { corruptionPressure: -6, publicTrust: 4, cashReserve: -0.3 },
        factionImpact: { civilSocietyMedia: 10, businessCommunity: 4 },
      },
      {
        id: 'attack-media-bias',
        label: 'Attack the Press — Claim Opposition Funding',
        description: 'Allege the reports are funded by opposition interests. Godfathers +8 (they enjoy the spectacle). Civil Society -12. Trust -6. Political Capital +8.',
        immediate: { publicTrust: -6, politicalCapital: 8 },
        factionImpact: { civilSocietyMedia: -12, partyGodfathers: 8 },
      },
    ],
  },

  {
    id: 'midgame-assembly-budget-revolt',
    title: 'House of Assembly: Mid-Term Budget Blockade',
    body: `Twenty-two members of the Lagos State House of Assembly — a bare majority — have tabled a motion to cut your capital expenditure budget by 35% and redirect the funds to "constituency development allocations." The Speaker, nominally your ally, has allowed the motion to proceed to a second reading.

The vote is scheduled for 10 days from now. You have 22 members against you and 18 with you. Three lawmakers are undecided. Your Principal Secretary has confirmed what you already suspected: three of the undecideds want direct constituency spending in their wards.`,
    severity: 'high',
    category: 'political',
    triggerCondition: (state) => state.week >= 78 && state.currentTerm === 1,
    choices: [
      {
        id: 'buy-assembly-votes',
        label: 'Redirect ₦2.4bn to Swing Constituencies — Buy the Votes',
        description: 'Fund the three swing members\' ward projects directly. Budget survives. Corruption Pressure +8. Political Capital +15 (showed strength). LG Chairmen +5.',
        immediate: { cashReserve: -2.4, corruptionPressure: 8, politicalCapital: 15 },
        factionImpact: { lgChairmen: 5, partyGodfathers: 6 },
      },
      {
        id: 'negotiate-budget-compromise',
        label: 'Negotiate: Concede 15% Capital Reallocation',
        description: 'Give up ₦1.2bn in capital projects, redirected to constituency funds. Budget survives at 85%. Godfathers -5 (weakness). Trust -3. Political Capital -10.',
        immediate: { cashReserve: -1.2, publicTrust: -3, politicalCapital: -10 },
        factionImpact: { partyGodfathers: -5, civilSocietyMedia: -4 },
      },
      {
        id: 'public-campaign-vs-assembly',
        label: 'Take It to the Public — Expose the Raid',
        description: 'Call a press conference naming the motion for what it is: a personal enrichment scheme. Civil Society +12. Trust +6. Political Capital -20. Risk: Assembly members escalate and pass the motion anyway.',
        immediate: { publicTrust: 6, politicalCapital: -20 },
        factionImpact: { civilSocietyMedia: 12, partyGodfathers: -8, lgChairmen: -5 },
      },
    ],
  },

  {
    id: 'midgame-teachers-strike',
    title: 'Statewide Teachers\' Strike: 2.4 Million Children Out of School',
    body: `The Nigeria Union of Teachers, Lagos State chapter, declared a statewide indefinite strike at 6am. Every public school in Lagos is closed. 2.4 million students are out of class. The immediate cause: four months of salary arrears, totalling ₦6.2bn, accumulated through a combination of cash-flow timing gaps and ghost worker complications in the education ministry payroll.

NUT's public statement is damaging: "The Lagos State Government asks our children to learn in classrooms without roofs while its civil servants go unpaid. We will not return until every kobo is cleared."`,
    severity: 'critical',
    category: 'social',
    triggerCondition: (state) => state.week >= 104 && state.currentTerm === 1,
    choices: [
      {
        id: 'pay-full-arrears',
        label: 'Clear All Arrears — ₦6.2bn Emergency Payment',
        description: 'Pay immediately. Strike ends within 72 hours. Cash -6.2. Trust +8. Youth Tension -5. Infrastructure +2 (schools reopen fully functional). Civil Society +8.',
        immediate: { cashReserve: -6.2, publicTrust: 8, youthTension: -5, infrastructureScore: 2 },
        factionImpact: { civilSocietyMedia: 8, informalEconomy: 4 },
      },
      {
        id: 'partial-payment-negotiate',
        label: 'Pay ₦3bn Now — Negotiate the Rest Over 3 Months',
        description: 'Partial settlement with a structured payment plan. Cash -3. Trust +3. Strike continues for 3 more weeks — Youth Tension +5 as students stay home. Civil Society +3.',
        immediate: { cashReserve: -3, publicTrust: 3, youthTension: 5 },
        factionImpact: { civilSocietyMedia: 3 },
      },
      {
        id: 'blame-federal-austerity',
        label: 'Blame Federal Austerity — Demand FAAC Release',
        description: 'Issue a statement blaming Abuja\'s allocation cuts for the arrears. Buys 4 weeks before the strike escalates. Trust -5. Youth Tension +10. Civil Society -8. Federal Relationship -5.',
        immediate: { publicTrust: -5, youthTension: 10, federalRelationship: -5 },
        factionImpact: { civilSocietyMedia: -8, federalGovt: -6 },
      },
    ],
  },

  {
    id: 'midgame-year3-security-downturn',
    title: 'Year Three Security Audit: Hidden Deterioration',
    body: `Your Commissioner of Police has shared a classified internal audit with your inner cabinet. The headline Security Index figure has been masking structural deterioration: kidnapping for ransom up 44% year-on-year, three LGAs recording weekly armed robbery spikes, and the Okada gang territorial conflict that began in Mushin has spread into Surulere and is now within three kilometres of Lagos Island.

The Commissioner's assessment: "The state can manage this for another 3-4 months before it becomes publicly visible and unmanageable. We need a structural intervention now, not optics."

With campaign season approaching in twelve months, this is the last window for a credible security response.`,
    severity: 'high',
    category: 'crisis',
    triggerCondition: (state) => state.week >= 130 && state.currentTerm === 1,
    choices: [
      {
        id: 'emergency-security-surge',
        label: 'Emergency Security Surge — ₦3bn Operation',
        description: 'Full deployment: 4,000 police officers redeployed, rapid response units, intelligence investment. Cash -3. Security Index +12. Political Capital -15. Makes national news — a visible reckoning before campaign season.',
        immediate: { cashReserve: -3, securityIndex: 12, politicalCapital: -15 },
        factionImpact: { businessCommunity: 6, civilSocietyMedia: 4 },
        constituencyImpact: { alimosho: 5, oshodi: 5, periphery: 5, surulere: 4 },
      },
      {
        id: 'targeted-redeployment',
        label: 'Targeted Redeployment — Intelligence-Led Operation',
        description: 'Focus resources on the three crisis LGAs. Slower but more durable. Cash -1.5. Security Index +6. Political Capital -8. Periphery +6 (most affected area sees direct action).',
        immediate: { cashReserve: -1.5, securityIndex: 6, politicalCapital: -8 },
        factionImpact: { businessCommunity: 3 },
        constituencyImpact: { periphery: 6, alimosho: 4, makoko: 4 },
      },
      {
        id: 'manage-the-narrative',
        label: 'Manage the Numbers — Restate the Metrics',
        description: 'Revise measurement methodology to show a more favourable index. Security Index +3 (cosmetic). Corruption Pressure +4. Trust +2 short-term. Civil Society -8 if they find out.',
        immediate: { securityIndex: 3, corruptionPressure: 4, publicTrust: 2 },
        factionImpact: { civilSocietyMedia: -8, partyGodfathers: 3 },
      },
    ],
  },
]
