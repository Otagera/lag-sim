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
        constituencyImpact: { alimosho: 5, oshodiIsolo: 5, ikorodu: 4, surulere: 3 },
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
        constituencyImpact: { ikorodu: -8, alimosho: -5, lagosMainland: -6 },
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
        constituencyImpact: { alimosho: 10, ikorodu: 8, oshodiIsolo: 5 },
      },
      {
        id: 'emergency-cash-deployment',
        label: 'Match Their Money — Authorise Ward-Level Disbursements',
        description: 'Deploy ₦4bn through LGA chairmen to swing wards. Alimosho +12, Periphery +10. Cash -4. Corruption +8. This is stomach infrastructure at scale — Civil Society sees it.',
        immediate: { cashReserve: -4, corruptionPressure: 8 },
        factionImpact: { lgChairmen: 10, informalEconomy: 10, civilSocietyMedia: -12 },
        constituencyImpact: { alimosho: 12, ikorodu: 10, oshodiIsolo: 6 },
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
        constituencyImpact: { alimosho: 4, oshodiIsolo: 4, ikorodu: 4, surulere: 3 },
      },
      {
        id: 'negotiate-partial',
        label: 'Negotiate — Pay ₦2bn, Promise the Rest Post-Election',
        description: 'Pay half now, structured remainder after results. Cash -2. Informal Economy +5. Adesanya accepts reluctantly. 60% of the fleet guaranteed. Periphery and deep Alimosho may see gaps.',
        immediate: { cashReserve: -2, politicalCapital: -10 },
        factionImpact: { informalEconomy: 5, lgChairmen: 3 },
        constituencyImpact: { alimosho: 2, oshodiIsolo: 2 },
      },
      {
        id: 'alternative-transport',
        label: 'Activate Alternative Transport Network — Bypass the Union',
        description: 'Contract private companies and okada networks. Cash -1.5. Political Capital -15. Adesanya is furious — Informal Economy -15. But the transport is secured. Civil Society praises the anti-monopoly move.',
        immediate: { cashReserve: -1.5, politicalCapital: -15 },
        factionImpact: { informalEconomy: -15, civilSocietyMedia: 8, lgChairmen: -5 },
        constituencyImpact: { alimosho: 3, ikorodu: 5, oshodiIsolo: 3 },
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
        constituencyImpact: { alimosho: -4, ikorodu: -3 },
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
        constituencyImpact: { alimosho: 10, ikorodu: 6, oshodiIsolo: 5, ibejuLekki: -3, etiOsa: -3 },
      },
      {
        id: 'release-alimosho-spending-data',
        label: 'Publish Alimosho Infrastructure Spend: 4-Year Record',
        description: 'Release itemised capital spend in Alimosho by ward. Civil Society +6. Alimosho +6. Trust +3. Slower — takes 4 days to penetrate social media.',
        immediate: { publicTrust: 3 },
        factionImpact: { civilSocietyMedia: 6 },
        constituencyImpact: { alimosho: 6, ikorodu: 4 },
      },
      {
        id: 'ignore-mainland-rallies',
        label: 'Hold Course — Don\'t Dignify It With a Response',
        description: 'Silence cedes the mainland narrative. Alimosho -5. No upside. A bet that your base turns out anyway.',
        immediate: {},
        factionImpact: {},
        constituencyImpact: { alimosho: -5, ikorodu: -4 },
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
        constituencyImpact: { alimosho: 6, oshodiIsolo: 5, lagosMainland: 5, ikorodu: 5 },
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
        constituencyImpact: { alimosho: -4, lagosMainland: -4, oshodiIsolo: -3 },
      },
    ],
  },

  // ── New Campaign Cards (category: election, gated by inCampaignMode) ─────

  {
    id: 'campaign-town-hall',
    title: 'Town Hall: Which Lagos Shows Up?',
    body: `Your campaign scheduler has booked three town halls this week — Alimosho (swing, high turnout), the Island business district (your base, but disengaged), and a joint session in Surulere co-hosted by three LGA chairmen. Each venue is wired for social media livestream. The audience composition will determine the narrative for the following three days.

Your advance team can only prepare one fully. The other two get the standard script.`,
    severity: 'medium',
    category: 'election',
    isRecurring: true,
    cooldownWeeks: 8,
    choices: [
      {
        id: 'townhall-alimosho',
        label: 'Invest in Alimosho — Full Production',
        description: 'Dedicated set, live translation, market outreach. Trust +5, PC -15. Alimosho +6, Oshodi +4. Business reads it as mainland focus.',
        immediate: { publicTrust: 5, politicalCapital: -15 },
        factionImpact: { lgChairmen: 6, informalEconomy: 5 },
        constituencyImpact: { alimosho: 6, oshodiIsolo: 4 },
      },
      {
        id: 'townhall-island',
        label: 'Go Heavy on Lagos Island — Energise the Base',
        description: 'Premium venue, business leaders front row. Business +8, PC -10. Trust +3. Eti Osa +6, Lagos Island +5. Mainland reads it as abandonment.',
        immediate: { publicTrust: 3, politicalCapital: -10 },
        factionImpact: { businessCommunity: 8, civilSocietyMedia: 3 },
        constituencyImpact: { etiOsa: 6, lagosIsland: 5, alimosho: -3, lagosMainland: -3 },
      },
      {
        id: 'townhall-surulere',
        label: 'Meet the Chairmen Halfway — Surulere Compromise',
        description: 'Split the difference. Three LGA chairmen co-host. Trust +4, PC -8. Surulere +5, Oshodi +5, Agege +4. No strong signal to anyone, no one abandoned.',
        immediate: { publicTrust: 4, politicalCapital: -8 },
        factionImpact: { lgChairmen: 4, civilSocietyMedia: 2 },
        constituencyImpact: { surulere: 5, oshodiIsolo: 5, agege: 4 },
      },
    ],
  },

  {
    id: 'campaign-media-blitz',
    title: 'Multi-Platform Blitz: Radio, Podcast, TikTok',
    body: `Your scheduler has booked you on three platforms in one day:

The Morning Agenda — mainstream radio, 40+ demo, 2.1m listeners.
Area Father Podcast — digital-native, 18–35, 800k subscribers.
Live TikTok townhall — algorithm-boosted, reaches 16–25 demo, real-time comments.

Each reaches a different Lagos. You have time for two of the three. The platform you skip will run a critical segment on your record the following week.`,
    severity: 'medium',
    category: 'election',
    choices: [
      {
        id: 'media-radio-podcast',
        label: 'Radio + Podcast — Broadest Reach',
        description: 'Demographic span: 18 to 60+. Trust +5. Youth Tension -4. Informal Economy +6. The skipped TikTok demo runs critical commentary next week.',
        immediate: { publicTrust: 5, youthTension: -4 },
        factionImpact: { informalEconomy: 6, civilSocietyMedia: 4 },
        delayed: {
          weekOffset: 1,
          delta: { youthTension: 3 },
          factionImpact: { civilSocietyMedia: -2 },
          eventText: 'TikTok influencers ran a "Where Is the Governor?" segment that trended for 48 hours. Youth engagement softened among 16–24 voters.',
        },
      },
      {
        id: 'media-podcast-tiktok',
        label: 'Podcast + TikTok — Youth Max',
        description: 'Youth Tension -8. Alimosho +6, Oshodi +5. Civil Society -4 (seen as unserious). The skipped radio audience is your 50+ base.',
        immediate: { youthTension: -8, publicTrust: -2 },
        factionImpact: { informalEconomy: 5, civilSocietyMedia: -4 },
        constituencyImpact: { alimosho: 6, oshodiIsolo: 5, lagosMainland: 4 },
        delayed: {
          weekOffset: 1,
          delta: { publicTrust: -4 },
          factionImpact: { businessCommunity: -3 },
          eventText: 'The Morning Agenda ran a critical segment: "The Governor Skips Traditional Media — What Is He Hiding?" Older demo approval dipped.',
        },
      },
      {
        id: 'media-radio-tiktok',
        label: 'Radio + TikTok — Safe Mix',
        description: 'Trust +4. Business +4. Lekki/VI +4. Misses the podcast demo entirely — 25–35 educated voters in Surulere and Mainland feel ignored.',
        immediate: { publicTrust: 4 },
        factionImpact: { businessCommunity: 4, civilSocietyMedia: 2 },
        constituencyImpact: { etiOsa: 4, lagosIsland: 4, ibejuLekki: 3 },
        delayed: {
          weekOffset: 1,
          delta: {},
          constituencyImpact: { surulere: -3, lagosMainland: -3 },
          eventText: 'Area Father Podcast host dedicated a segment to "Candidates Who Won\'t Sit Down With Us." Surulere and mainland educated voters noticed.',
        },
      },
    ],
  },

  {
    id: 'campaign-market-women',
    title: 'Market Women Association: The Endorsement Bid',
    body: `The Lagos State Market Women Association — Iyaloja General and 27 market chairs representing over 400,000 traders across Mile 12, Tejuosho, Mushin, Oyingbo, and Ketu — has signalled willingness to issue a pre-election endorsement. Their conditions are informal but clear: attendance at their quarterly assembly, a public commitment to market infrastructure, and "consultation fees" traditionally routed through LGA chairmen.

Your campaign manager says this is a 40,000-vote swing if secured. Your ethics advisor says the consultation fees are stomach infrastructure by another name.`,
    severity: 'high',
    category: 'election',
    choices: [
      {
        id: 'attend-personally',
        label: 'Attend in Person — Address the Assembly',
        description: 'PC -20. Cash -2 (market fund commitment). Alimosho +8, Mushin +7, Oshodi +6, Surulere +5. Informal Economy +12. Civil Society -6 (fee optics). Trust +4.',
        immediate: { politicalCapital: -20, cashReserve: -2, publicTrust: 4 },
        factionImpact: { informalEconomy: 12, civilSocietyMedia: -6, lgChairmen: 5 },
        constituencyImpact: { alimosho: 8, mushin: 7, oshodiIsolo: 6, surulere: 5 },
      },
      {
        id: 'send-deputy-market',
        label: 'Send Your Deputy With Signed Commitments',
        description: 'PC -10. Cash -1. Alimosho +5, Mushin +4. Informal Economy +6. Deputy resentment +5 (she misses her own campaign events). Trust +2.',
        immediate: { politicalCapital: -10, cashReserve: -1, publicTrust: 2 },
        factionImpact: { informalEconomy: 6, lgChairmen: 3 },
        constituencyImpact: { alimosho: 5, mushin: 4 },
        resentmentDelta: 5,
      },
      {
        id: 'decline-market-endorsement',
        label: 'Decline the Transaction — Run on Record',
        description: 'No cash cost. Civil Society +6. Business +4. Informal Economy -8 (felt as disrespect). The market vote stays home. Alimosho -4, Mushin -4.',
        immediate: {},
        factionImpact: { civilSocietyMedia: 6, businessCommunity: 4, informalEconomy: -8 },
        constituencyImpact: { alimosho: -4, mushin: -4, surulere: -3 },
      },
    ],
  },

  {
    id: 'campaign-religious-endorsement',
    title: 'CAN and Muslim Council: Dueling Endorsement Offers',
    body: `The Christian Association of Nigeria (CAN) Lagos chapter has publicly invited you to a "Governance and Faith" breakfast. Hours later, the Muslim Advisory Council — representing the Chief Imam of Lagos and 15 major mosque councils — issued a press statement praising your administration's "even-handed approach to faith communities."

Both are endorsement feelers. Both expect a visible response. Accepting one without the other carries electoral risk in faith communities. Accepting both stretches your schedule and PC thin.`,
    severity: 'high',
    category: 'election',
    choices: [
      {
        id: 'balanced-interfaith',
        label: 'Joint Interfaith Event — Balance Both',
        description: 'Trust +6. Civil Society +8. PC -20. All LGAs show modest gains (+2–3). Highest cost, safest return. Everyone sees you as the unity candidate.',
        immediate: { publicTrust: 6, politicalCapital: -20 },
        factionImpact: { civilSocietyMedia: 8, businessCommunity: 4 },
        constituencyImpact: { alimosho: 3, surulere: 3, lagosIsland: 3, etiOsa: 2, lagosMainland: 2 },
      },
      {
        id: 'lean-muslim-council',
        label: 'Lean Muslim — Mainland and Periphery Focus',
        description: 'Alimosho +6, Epe +5, Badagry +4, Ikorodu +4. Informal Economy +8. CAN reads it as a slight — Christian-majority LGAs -4. Trust -3.',
        immediate: { publicTrust: -3 },
        factionImpact: { informalEconomy: 8, civilSocietyMedia: -5, lgChairmen: 4 },
        constituencyImpact: { alimosho: 6, epe: 5, badagry: 4, ikorodu: 4, lagosIsland: -4, etiOsa: -3 },
      },
      {
        id: 'decline-faith-endorsements',
        label: 'Decline Both — Politics Is Not Pulpit',
        description: 'Civil Society +5 (secular stance). Business +3. Trust +2. PC +5. Faith communities cold but not hostile. No constituency gain, no faith-based backlash.',
        immediate: { publicTrust: 2, politicalCapital: 5 },
        factionImpact: { civilSocietyMedia: 5, businessCommunity: 3 },
      },
    ],
  },

  {
    id: 'campaign-transparency-pledge',
    title: 'BudgIT and TI: The Transparency Pact',
    body: `BudgIT and Transparency International Lagos have proposed a "Governance Transparency Pact" — a public, legally-notarised commitment to publish quarterly procurement data, asset declarations for all political appointees, and an independent audit of the Lagos State Infrastructure Fund within six months of taking office.

Signing it is a powerful signal. It also locks you in. Your godfathers are watching.`,
    severity: 'high',
    category: 'election',
    triggerCondition: (state) => state.stats.corruptionPressure < 50 && state.inCampaignMode,
    choices: [
      {
        id: 'sign-full-pact',
        label: 'Sign in Full — Full Transparency Pledge',
        description: 'Corruption Pressure -10. Civil Society +14. Business +6. Trust +8. PC -15. Godfathers -8 (they see it as tying your hands). The cleanest signal you can send.',
        immediate: { corruptionPressure: -10, publicTrust: 8, politicalCapital: -15 },
        factionImpact: { civilSocietyMedia: 14, businessCommunity: 6, partyGodfathers: -8 },
      },
      {
        id: 'sign-modified-pact',
        label: 'Sign Modified — Asset Declarations Only',
        description: 'Corruption Pressure -4. Civil Society +6. Trust +4. PC -5. Godfathers -3. A partial pledge — BudgIT calls it "better than nothing" but notes the gaps.',
        immediate: { corruptionPressure: -4, publicTrust: 4, politicalCapital: -5 },
        factionImpact: { civilSocietyMedia: 6, businessCommunity: 3, partyGodfathers: -3 },
        delayed: {
          weekOffset: 3,
          delta: { publicTrust: -2 },
          factionImpact: { civilSocietyMedia: -4 },
          eventText: 'BudgIT released a statement noting the administration signed only partial transparency commitments. The omission of procurement data was highlighted. Trust softened among informed voters.',
        },
      },
      {
        id: 'decline-pact',
        label: 'Decline — "Our Record Speaks"',
        description: 'PC +8. Godfathers +6. Civil Society -10. Business -3. Trust -3. Framed as resistance to accountability. The opposition runs ads with your refusal quote.',
        immediate: { politicalCapital: 8, publicTrust: -3 },
        factionImpact: { partyGodfathers: 6, civilSocietyMedia: -10, businessCommunity: -3 },
        constituencyImpact: { lagosIsland: -3, etiOsa: -2 },
      },
    ],
  },

  {
    id: 'campaign-opposition-dossier',
    title: 'The Adebayo File: Opposition Research Lands',
    body: `Your intelligence unit has assembled a comprehensive dossier on Senator Adebayo's campaign financing. Three findings are actionable: a ₦1.2bn loan from a bank where his brother-in-law is a director (undisclosed), a campaign venue contract awarded to his cousin's firm at 3x market rate, and WhatsApp leaks showing coordination with a notorious vote-buying network in Ikorodu.

Your campaign lawyer reviews the dossier and gives you three options. Each carries legal and political risk.`,
    severity: 'high',
    category: 'election',
    choices: [
      {
        id: 'leak-strategically',
        label: 'Leak Selected Documents to the Press',
        description: 'PC +12. Godfathers +8. Trust -5 (dirty politics optics). Civil Society -8. Adebayo is forced to spend 48 hours defending. The loan story dominates the news cycle.',
        immediate: { politicalCapital: 12, publicTrust: -5 },
        factionImpact: { partyGodfathers: 8, civilSocietyMedia: -8, businessCommunity: -3 },
        diminishingReturns: true,
        delayed: {
          weekOffset: 2,
          delta: { publicTrust: -3 },
          factionImpact: { civilSocietyMedia: -4 },
          eventText: 'The leak has been traced to a freelance journalist in your orbit. Adebayo\'s legal team has petitioned the court for a gag order. Ethics questions linger.',
        },
      },
      {
        id: 'hold-dossier',
        label: 'Hold It — Keep the Clean Campaign',
        description: 'Trust +5. Civil Society +10. Business +4. Adebayo never knows you have it. The insurance stays in your pocket. PC -5 (missed tactical opportunity).',
        immediate: { publicTrust: 5, politicalCapital: -5 },
        factionImpact: { civilSocietyMedia: 10, businessCommunity: 4, partyGodfathers: -5 },
      },
      {
        id: 'brief-journalists',
        label: 'Brief Select Journalists Off the Record',
        description: 'PC +8. Trust -3. Civil Society -5. Godfathers +5. The stories appear but can\'t be traced directly to you. Slower burn. Delayed backlash if traced.',
        immediate: { politicalCapital: 8, publicTrust: -3 },
        factionImpact: { partyGodfathers: 5, civilSocietyMedia: -5 },
        diminishingReturns: true,
        delayed: {
          weekOffset: 3,
          delta: { corruptionPressure: 3, publicTrust: -2 },
          factionImpact: { civilSocietyMedia: -3 },
          eventText: 'A journalist close to your campaign was placed under surveillance by the police. Your involvement has not been confirmed, but the security agencies are asking questions.',
        },
      },
    ],
  },

  {
    id: 'campaign-ground-game',
    title: 'Ground Game: Ward-Level Deployment',
    body: `Your campaign director lays out the field operation map. Twenty wards across six swing LGAs need paid coordinators, transport logistics, and food for polling-day agents. The machine needs fuel.

You have three ways to deploy resources. Each sends a different signal to the party, the civil society, and the voters in those wards.`,
    severity: 'medium',
    category: 'election',
    isRecurring: true,
    cooldownWeeks: 10,
    choices: [
      {
        id: 'ground-cash-heavy',
        label: 'Cash-Heavy — Deploy to Swing Wards Directly',
        description: 'Cash -3. Alimosho +8, Ikorodu +7. Corruption +4. Informal Economy +8. The old way — effective and dirty. Civil Society sees the money moving.',
        immediate: { cashReserve: -3, corruptionPressure: 4 },
        factionImpact: { informalEconomy: 8, lgChairmen: 6, civilSocietyMedia: -5 },
        constituencyImpact: { alimosho: 8, ikorodu: 7, oshodiIsolo: 4 },
      },
      {
        id: 'ground-pc-heavy',
        label: 'Party Machinery — Organise Through LGA Chairmen',
        description: 'PC -25. Alimosho +5, Oshodi +5, Agege +4. Godfathers +6. Clean books, party loyalty. Slower — the chairmen take their cut of time before movement happens.',
        immediate: { politicalCapital: -25 },
        factionImpact: { partyGodfathers: 6, lgChairmen: 6, informalEconomy: 4 },
        constituencyImpact: { alimosho: 5, oshodiIsolo: 5, agege: 4 },
      },
      {
        id: 'ground-commissioners',
        label: 'Deploy Commissioners — Stump for You',
        description: 'PC -10. Trust +3. Selective gains — Works commissioner in Alimosho +4, Transport in Oshodi +4. Lower ceiling but shows governance depth. Deputy resentment +3 (bypassed).',
        immediate: { politicalCapital: -10, publicTrust: 3 },
        factionImpact: { civilSocietyMedia: 4, businessCommunity: 3 },
        constituencyImpact: { alimosho: 4, oshodiIsolo: 4, surulere: 3 },
        resentmentDelta: 3,
      },
    ],
  },

  {
    id: 'campaign-early-voting-push',
    title: 'Early Vote: Diaspora, Absentee, and Digital Push',
    body: `The Lagos State Independent Electoral Commission has confirmed that early voting will open for diaspora residents, security personnel, and medically exempt voters. Your campaign estimates 120,000–180,000 early ballots — concentrated in Lagos Island, Eti Osa, and Ibeju Lekki (diaspora families), plus military and police stationed in Lagos.

Adebayo has already launched a digital registration drive targeting younger early voters. His early vote numbers in Alimosho are 12% ahead of projections.`,
    severity: 'medium',
    category: 'election',
    triggerCondition: (state) => state.week >= 190 && state.inCampaignMode,
    choices: [
      {
        id: 'early-diaspora-fund',
        label: 'Fund Diaspora Voter Registration',
        description: 'Cash -1.5. Lagos Island +6, Eti Osa +5, Ibeju Lekki +4. Trust +4 from expatriate families. Informal Economy -3 (diaspora outreach bypasses local networks).',
        immediate: { cashReserve: -1.5, publicTrust: 4 },
        factionImpact: { businessCommunity: 5, informalEconomy: -3 },
        constituencyImpact: { lagosIsland: 6, etiOsa: 5, ibejuLekki: 4 },
      },
      {
        id: 'early-digital-campaign',
        label: 'Digital GOTV — Text and Social Media Blitz',
        description: 'Cash -0.8. Youth Tension -4. Alimosho +4, Surulere +5. Civil Society +3 (innovative outreach). Lower cost, narrower reach. Older voters miss the message.',
        immediate: { cashReserve: -0.8, youthTension: -4 },
        factionImpact: { civilSocietyMedia: 3, informalEconomy: 4 },
        constituencyImpact: { alimosho: 4, surulere: 5, lagosMainland: 3 },
      },
      {
        id: 'early-ignore',
        label: 'Skip Early Vote — Focus All Resources on Election Day',
        description: 'PC +5. Cash saved. No early constituency gain. A bet that your Election Day machine outperforms any early-vote deficit. High risk in close islands and diaspora-heavy wards.',
        immediate: { politicalCapital: 5 },
        factionImpact: { lgChairmen: 4, partyGodfathers: 3, civilSocietyMedia: -3 },
        delayed: {
          weekOffset: 1,
          delta: { publicTrust: -2 },
          constituencyImpact: { lagosIsland: -4, etiOsa: -3 },
          eventText: 'Diaspora voter turnout reports show early-vote numbers below the winning threshold in Lagos Island and Eti Osa. Your absence in the early-vote push is being felt.',
        },
      },
    ],
  },
]
