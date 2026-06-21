import type { EventCard } from '../../state/types'

// Campaign-era events — active from week 150 onward (maxWeek not set; they run until resolved)
// These replace routine governance cards in the late-game pool.

export const campaignEraEvents: EventCard[] = [
  {
    id: 'campaign-blackout-operation',
    title: 'Coordinated Blackout: Opposition Digital Strike',
    body: `At 6am, a coordinated social media operation flooded 12 million Lagos accounts with fabricated screenshots: your signature on inflated contracts, a bank statement you've never seen, a WhatsApp forward purporting to show your Chief of Staff taking a bribe. By midday it has been reshared 400,000 times. Two newspapers have picked it up as a story. Your digital team traces the operation to a known opposition-linked PR firm in Ikeja.

This is a precision hit timed to dominate the news cycle for 72 hours.`,
    severity: 'high',
    category: 'political',
    week: 150,
    choices: [
      {
        id: 'legal-injunction',
        label: 'File Emergency Defamation Injunction',
        description: 'Force platforms to take down the content. Civil Society +6 (they respect the transparency impulse), Trust +4. Political Capital -15. Slow — 72 hours minimum. The story runs in the gap.',
        immediate: { publicTrust: 4, politicalCapital: -15 },
        factionImpact: { civilSocietyMedia: 6, businessCommunity: 3 },
      },
      {
        id: 'counter-narrative',
        label: 'Flood the Zone — Release Verified Records',
        description: 'Publish a full accounting within 6 hours. Audited contracts, bank records, commissioner sign-offs. Corruption Pressure -6. Civil Society +10. Trust +6 from people who read the documents. Cash -₦0.5bn (communications spend).',
        immediate: { publicTrust: 6, cashReserve: -0.5, corruptionPressure: -6 },
        factionImpact: { civilSocietyMedia: 10, partyGodfathers: -3 },
      },
      {
        id: 'attack-the-source',
        label: 'Name the PR Firm — Go on Offence',
        description: 'Call a press conference naming the Ikeja firm and its known opposition ties. Political Capital +10. Trust -5 (seen as deflection). Godfathers enjoy the aggression. Civil Society -8.',
        immediate: { publicTrust: -5, politicalCapital: 10 },
        factionImpact: { partyGodfathers: 8, civilSocietyMedia: -8, federalGovt: -3 },
      },
    ],
  },

  {
    id: 'oba-endorsement-standoff',
    title: 'The Obas Withhold Their Blessing',
    body: `The Lagos Council of Obas convened an emergency session this morning and issued a joint communiqué. Four of the six most influential traditional rulers — the Eletus of Eko, the Oniru of Iru Kingdom, the Oloto of Otto, and the Oba of Badagry — have declined to issue endorsements ahead of the election, citing "governance concerns they wish to discuss in private audience before offering confidence."

This is unprecedented. The last governor who went to elections without a unified traditional ruler endorsement lost Alimosho by eleven points.`,
    severity: 'high',
    category: 'political',
    week: 158,
    choices: [
      {
        id: 'private-audience',
        label: 'Request Immediate Private Audience',
        description: 'Fly to each palace this week. Political Capital -20. If your Corruption Pressure is below 60%, you walk out with three of four endorsements. lgChairmen +10, Constituency +5 (mainland).',
        immediate: { politicalCapital: -20 },
        factionImpact: { lgChairmen: 10, partyGodfathers: 5 },
        constituencyImpact: { alimosho: 5, oshodi: 5, periphery: 4, surulere: 3 },
      },
      {
        id: 'public-statement',
        label: 'Issue a Public Governance Commitments Letter',
        description: 'Respond via press with a signed letter of commitments on specific Oba concerns (land use, community fund audit). Civil Society +8. Partial — two Obas issue tepid endorsements. Trust +3.',
        immediate: { publicTrust: 3, corruptionPressure: -3 },
        factionImpact: { civilSocietyMedia: 8, lgChairmen: 4 },
      },
      {
        id: 'party-machine-override',
        label: 'Route Around Them — Double Down on Party Machine',
        description: 'Your LGA chairmen control more logistics than any Oba. lgChairmen +8. Informal Economy +5. But disrespecting the traditional institution costs you: periphery constituencies -8. Civil Society -10.',
        immediate: { politicalCapital: 8 },
        factionImpact: { lgChairmen: 8, informalEconomy: 5, civilSocietyMedia: -10 },
        constituencyImpact: { periphery: -8, alimosho: -5, makoko: -6 },
      },
    ],
  },

  {
    id: 'swing-ward-intelligence',
    title: 'Internal Polling: Alimosho and Periphery Collapsing',
    body: `Your campaign's internal polling team has delivered a briefing that clears the room. Three swing wards in Alimosho and two in Periphery have swung 9 points toward the opposition in four weeks. The cause is clear: cash distribution at the ward level, running at ₦10,000–₦15,000 per household. Your ward agents estimate the operation has ₦2.4bn behind it — likely offshore-routed.

At current trajectory, you win Lagos Island but lose the mainland. That math does not produce a win.`,
    severity: 'high',
    category: 'political',
    triggerCondition: (state) => state.week >= 165 && state.currentTerm === 1,
    choices: [
      {
        id: 'emergency-constituency-blitz',
        label: 'Personal Constituency Blitz — 72-Hour Offensive',
        description: 'Cancel everything. Five constituencies in three days: town halls, market visits, community pledges. Political Capital -25. Trust +8 (authenticity premium). Alimosho +10, Periphery +8.',
        immediate: { publicTrust: 8, politicalCapital: -25 },
        factionImpact: { lgChairmen: 6, informalEconomy: 5 },
        constituencyImpact: { alimosho: 10, periphery: 8, oshodi: 5 },
      },
      {
        id: 'emergency-cash-deployment',
        label: 'Match Their Money — Authorise Ward-Level Disbursements',
        description: 'Deploy ₦4bn through LGA chairmen to swing wards. Alimosho +12, Periphery +10. Cash -4. Corruption +8. This is stomach infrastructure at scale — Civil Society sees it.',
        immediate: { cashReserve: -4, corruptionPressure: 8 },
        factionImpact: { lgChairmen: 10, informalEconomy: 10, civilSocietyMedia: -12 },
        constituencyImpact: { alimosho: 12, periphery: 10, oshodi: 6 },
      },
      {
        id: 'trust-the-record',
        label: 'Hold Position — Run on Four Years of Governance',
        description: 'Your infrastructure numbers are real. Don\'t play their game. Civil Society +8. Political Capital -5. No short-term constituency gain. This is a bet that quality turnout wins over bought votes.',
        immediate: { politicalCapital: -5 },
        factionImpact: { civilSocietyMedia: 8, businessCommunity: 5 },
      },
    ],
  },

  {
    id: 'nurtw-transport-hostage',
    title: 'Bus Unions Threaten to Ground Election-Day Transport',
    body: `The National Union of Road Transport Workers (NURTW) Lagos chapter controls the bus fleets that move voters to polling stations across the mainland. Their chairman, Alhaji Taofik Adesanya, has delivered an ultimatum through your Chief of Staff: ₦3.8bn in unpaid state subventions must be cleared before Week 195, or the union will not mobilise vehicles on Election Day.

Without the NURTW fleet, mainland turnout — your base — drops an estimated 22%. You cannot win this election on Lagos Island votes alone.`,
    severity: 'high',
    category: 'economy',
    triggerCondition: (state) => state.week >= 172 && state.currentTerm === 1,
    choices: [
      {
        id: 'pay-full-subvention',
        label: 'Pay the ₦3.8bn — Secure the Fleet',
        description: 'Clear the backlog in full. Cash -3.8. Informal Economy +10. lgChairmen +6. Transport infrastructure is guaranteed for Election Day. Adesanya owes you now.',
        immediate: { cashReserve: -3.8 },
        factionImpact: { informalEconomy: 10, lgChairmen: 6 },
        constituencyImpact: { alimosho: 4, oshodi: 4, periphery: 4, surulere: 3 },
      },
      {
        id: 'negotiate-partial',
        label: 'Negotiate — Pay ₦2bn, Promise the Rest Post-Election',
        description: 'Pay half now, structured remainder after results. Cash -2. Informal Economy +5. Adesanya accepts reluctantly. 60% of the fleet guaranteed. Periphery and deep Alimosho may see gaps.',
        immediate: { cashReserve: -2, politicalCapital: -10 },
        factionImpact: { informalEconomy: 5, lgChairmen: 3 },
        constituencyImpact: { alimosho: 2, oshodi: 2 },
      },
      {
        id: 'alternative-transport',
        label: 'Activate Alternative Transport Network — Bypass the Union',
        description: 'Contract private companies and okada networks. Cash -1.5. Political Capital -15. Adesanya is furious — Informal Economy -15. But the transport is secured. Civil Society praises the anti-monopoly move.',
        immediate: { cashReserve: -1.5, politicalCapital: -15 },
        factionImpact: { informalEconomy: -15, civilSocietyMedia: 8, lgChairmen: -5 },
        constituencyImpact: { alimosho: 3, periphery: 5, oshodi: 3 },
      },
    ],
  },

  // ── Opponent Cards — dynamic targeting based on player's actual weaknesses ──
  // All three use category: 'election' so they're gated by inCampaignMode.

  {
    id: 'opponent-corruption-attack',
    title: 'Adebayo: Clean Governance Campaign',
    body: `Senator Kunle Adebayo has released a 48-page dossier. It names three specific procurement decisions from your administration, includes itemised contract values, and cross-references your Corruption Pressure indicators using leaked budget documents. The dossier is already trending. "Four years of opaque governance," he says at a Lagos Island press conference. "Lagosians deserve better."

Your communications team has 24 hours before the narrative sets.`,
    severity: 'high',
    category: 'election',
    triggerCondition: (state) => state.stats.corruptionPressure > 55 && state.inCampaignMode,
    choices: [
      {
        id: 'release-full-audit',
        label: 'Release Independent Audit — Preempt the Narrative',
        description: 'Commission a 72-hour audit and publish everything. Corruption Pressure -8. Civil Society +10. Trust +5. Cash -₦0.5bn. Adebayo loses the line of attack.',
        immediate: { corruptionPressure: -8, publicTrust: 5, cashReserve: -0.5 },
        factionImpact: { civilSocietyMedia: 10, businessCommunity: 4 },
      },
      {
        id: 'attack-adebayo-record',
        label: 'Counter: Expose His Senate Record',
        description: 'Name three Adebayo senate failures. Trust -3 (negative campaign), Political Capital +10. Adebayo pivots. Civil Society -6.',
        immediate: { publicTrust: -3, politicalCapital: 10 },
        factionImpact: { partyGodfathers: 5, civilSocietyMedia: -6 },
      },
      {
        id: 'stay-silent-corruption',
        label: 'No Comment — "Governance Speaks for Itself"',
        description: 'Silence reads as guilt. Corruption Pressure +3. Trust -5. Alimosho -4 (they believed the dossier).',
        immediate: { corruptionPressure: 3, publicTrust: -5 },
        factionImpact: { civilSocietyMedia: -8 },
        constituencyImpact: { alimosho: -4, periphery: -3 },
      },
    ],
  },

  {
    id: 'opponent-mainland-abandonment',
    title: 'Adebayo: Three Rallies in Alimosho This Week',
    body: `Senator Adebayo held rallies in Alimosho, Agege, and Ikorodu on consecutive days. The message was precise: "This governor built flyovers in Lekki while Alimosho roads crumbled. He flew over your community, not through it." Attendance was strong. The ward-level reports from your agents are worse than projected.

Alimosho is the mainland's largest voting bloc. If it moves 8 points, the math changes.`,
    severity: 'high',
    category: 'election',
    triggerCondition: (state) => state.constituencyApproval.alimosho < 50 && state.inCampaignMode,
    choices: [
      {
        id: 'counter-rally-mainland',
        label: 'Launch Counter-Rally — Three Days in Alimosho',
        description: 'Personal presence. Cancel Lagos Island events. Alimosho +10. Trust +4. Political Capital -20. Lekki and VI read it as panic — constituency -3 each.',
        immediate: { publicTrust: 4, politicalCapital: -20 },
        factionImpact: { lgChairmen: 6, informalEconomy: 5 },
        constituencyImpact: { alimosho: 10, periphery: 6, oshodi: 5, lekki: -3, victoriaIsland: -3 },
      },
      {
        id: 'release-alimosho-spending-data',
        label: 'Publish Alimosho Infrastructure Spend: 4-Year Record',
        description: 'Release itemised capital spend in Alimosho by ward. Civil Society +6. Alimosho +6. Trust +3. Slower — takes 4 days to penetrate social media.',
        immediate: { publicTrust: 3 },
        factionImpact: { civilSocietyMedia: 6 },
        constituencyImpact: { alimosho: 6, periphery: 4 },
      },
      {
        id: 'ignore-mainland-rallies',
        label: 'Hold Course — Don\'t Dignify It With a Response',
        description: 'Silence cedes the mainland narrative. Alimosho -5. No upside. A bet that your base turns out anyway.',
        immediate: {},
        factionImpact: {},
        constituencyImpact: { alimosho: -5, periphery: -4 },
      },
    ],
  },

  {
    id: 'opponent-youth-platform',
    title: 'Adebayo: ₦100k Youth Stipend Pledge',
    body: `In a stadium event covered by eleven television stations, Senator Adebayo announced a ₦100,000 monthly stipend for all Lagos residents under 30 who register with the new state digital ID system. He walked onstage with the president of NANS Lagos chapter. The crowd was 30,000. Your youth engagement numbers are already dipping.

The promise is economically impossible. It is also working.`,
    severity: 'high',
    category: 'election',
    triggerCondition: (state) => state.stats.youthTension > 35 && state.inCampaignMode,
    choices: [
      {
        id: 'match-youth-promise',
        label: 'Match It — Announce a Competing Youth Dividend',
        description: '₦50,000 skills grant + placement programme. Cash -₦2bn. Youth Tension -10. Civil Society -4 (they call it populism). Trust +5.',
        immediate: { cashReserve: -2, publicTrust: 5, youthTension: -10 },
        factionImpact: { informalEconomy: 8, civilSocietyMedia: -4 },
        constituencyImpact: { alimosho: 6, oshodi: 5, makoko: 5, periphery: 5 },
      },
      {
        id: 'pivot-to-employment-record',
        label: 'Pivot — Lead With Your Actual Youth Employment Numbers',
        description: 'Release verified data: jobs created, vocational centres opened, okada licensing reform impact. Youth Tension -5. Civil Society +8. Trust +3. Slower effect but credible.',
        immediate: { publicTrust: 3, youthTension: -5 },
        factionImpact: { civilSocietyMedia: 8, businessCommunity: 4 },
      },
      {
        id: 'ignore-youth-pledge',
        label: 'Ignore It — The Numbers Don\'t Add Up',
        description: 'Publicly dismiss the pledge as fantasy economics. Political Capital +5. Youth Tension +8 (they don\'t care about the maths). Loses the youth vote in swing wards.',
        immediate: { politicalCapital: 5, youthTension: 8 },
        factionImpact: { civilSocietyMedia: 3, informalEconomy: -5 },
        constituencyImpact: { alimosho: -4, makoko: -4, oshodi: -3 },
      },
    ],
  },
]
