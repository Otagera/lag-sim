import type { EventCard } from '../../state/types'

export const politicalEvents: EventCard[] = [
  // --- Fashemu Arc ---
  {
    id: 'fashemu-warning',
    title: 'A Message From the Boa',
    body: `An intermediary you have never met before visits Government House uninvited. He does not introduce himself. He delivers one sentence: "Chief Fashemu feels the lines of communication have broken down and would like to correct that impression." He hands you an envelope and leaves. Inside: a photograph of your campaign launch in 2026. Nothing else.`,
    severity: 'high',
    category: 'political',
    triggerCondition: (state) =>
      state.fashemuPhase === 'warning' || state.godfatherRefusalCount >= 3,
    choices: [
      {
        id: 'meet-fashemu',
        label: 'Arrange a Private Meeting',
        description:
          'Sit down with him. Show willingness to reset. Political Capital +5. Buys time, resolves nothing long-term.',
        immediate: { politicalCapital: 5 },
        factionImpact: { partyGodfathers: 6 },
      },
      {
        id: 'ignore-warning',
        label: 'Ignore It',
        description:
          'Send no reply. Trust +3 (no capitulation). The next escalation will be public. Fashemu Phase → Break.',
        immediate: { publicTrust: 3 },
        factionImpact: { partyGodfathers: -8, civilSocietyMedia: 4 },
      },
      {
        id: 'leak-to-press',
        label: 'Leak the Visit to the Press',
        description:
          'Go public with the intimidation attempt. Civil Society +12, Trust +6. Fashemu goes nuclear. This is the point of no return.',
        immediate: { publicTrust: 6, politicalCapital: -10 },
        factionImpact: { civilSocietyMedia: 12, partyGodfathers: -20, federalGovt: -5 },
      },
    ],
  },
  {
    id: 'fashemu-public-break',
    title: 'The Boa Strikes: Public Confrontation',
    body: `Three newspapers run the same story this morning — each citing different "senior government sources." The story: that you have been mismanaging state funds, sidelining party structures, and operating a "one-man government." The coordination is unmistakably Fashemu. This is the public break.`,
    severity: 'critical',
    category: 'political',
    triggerCondition: (state) => state.fashemuPhase === 'break',
    choices: [
      {
        id: 'negotiate-return',
        label: 'Open Back-Channel Talks',
        description:
          'Quietly signal willingness to re-engage. Trust -4 (looks weak), Godfather relationship stabilises. Fashemuphase → Warning.',
        immediate: { publicTrust: -4, politicalCapital: -10 },
        factionImpact: { partyGodfathers: 8 },
      },
      {
        id: 'fight-back-media',
        label: 'Fight Back Publicly',
        description:
          'Hold a press conference denying all allegations. Show evidence of policy achievements. Trust +8. The war escalates.',
        immediate: { publicTrust: 8, politicalCapital: -15 },
        factionImpact: { partyGodfathers: -15, civilSocietyMedia: 10 },
      },
      {
        id: 'cooperate-efcc',
        label: 'Contact the EFCC',
        description:
          'Quietly open a channel to the anti-corruption agency. Nuclear option. Trust +10. Fashemu phase → Reconciled or Dead. This ends the relationship permanently.',
        immediate: { publicTrust: 10, corruptionPressure: -8 },
        factionImpact: { civilSocietyMedia: 15, partyGodfathers: -25, federalGovt: -8 },
      },
    ],
  },
  {
    id: 'fashemu-efcc-contact',
    title: 'EFCC Contact: The Fashemu File',
    body: `A senior EFCC operative makes discreet contact with your Chief of Staff. They have been building a case on Chief Fashemu's network for three years. They need internal cooperation — not a public endorsement, just access to certain government records. In exchange, the file protects your administration from guilt-by-association.`,
    severity: 'high',
    category: 'political',
    triggerCondition: (state) =>
      state.week >= 78 &&
      state.week <= 156 &&
      (state.fashemuPhase === 'break' || state.godfatherRefusalCount >= 3),
    weight: 1,
    choices: [
      {
        id: 'cooperate-efcc-quietly',
        label: 'Cooperate Quietly',
        description:
          'Share records. Trust +5 long term. Corruption -6. Fashemu will eventually know. Ending Path C.',
        immediate: { publicTrust: 5, corruptionPressure: -6 },
        factionImpact: { civilSocietyMedia: 6, partyGodfathers: -8 },
      },
      {
        id: 'warn-fashemu',
        label: 'Warn Fashemu Instead',
        description:
          'Tell him the EFCC is watching. He owes you. Godfather relationship +15. Corruption Pressure +8. You are now complicit.',
        immediate: { corruptionPressure: 8 },
        factionImpact: { partyGodfathers: 15, civilSocietyMedia: -10 },
      },
      {
        id: 'stay-neutral-efcc',
        label: 'Stay Neutral',
        description:
          'Decline both cooperation and the warning. Trust +2. The EFCC proceeds without you. Fashemu stays cautious.',
        immediate: { publicTrust: 2 },
        factionImpact: {},
      },
    ],
  },
  {
    id: 'fashemu-death',
    title: 'Chief Fashemu is Dead',
    body: `Chief B.O.A. Fashemu died in the early hours at his Banana Island residence. The official cause: cardiac arrest. He was 74. His network — three lieutenants and a web of contractors, commissioners, and LG allies — is already fracturing. Three men are positioning to inherit what he built. Lagos politics will not be the same.`,
    severity: 'critical',
    category: 'political',
    triggerCondition: (state) =>
      state.week >= 130 &&
      state.fashemuPhase !== 'dead' &&
      Math.random() < 0.015,
    weight: 1,
    choices: [
      {
        id: 'issue-condolences',
        label: 'Issue State Condolences',
        description:
          'Dignified response. Trust +2. His network sees it as a signal that you will deal with them.',
        immediate: { publicTrust: 2 },
        factionImpact: { partyGodfathers: 5 },
      },
      {
        id: 'stay-silent',
        label: 'No Comment for 48 Hours',
        description:
          'His network is watching. Silence is read as relief. Godfathers -8. Civil Society +5.',
        immediate: {},
        factionImpact: { partyGodfathers: -8, civilSocietyMedia: 5 },
      },
      {
        id: 'move-on-network',
        label: 'Quickly Reassert Control of His Allies',
        description:
          'Reach out directly to all three lieutenants before they consolidate. Political Capital -20. You absorb his network.',
        immediate: { politicalCapital: -20 },
        factionImpact: { partyGodfathers: 15, businessCommunity: 5 },
      },
    ],
  },

  // --- Deputy Events ---
  {
    id: 'deputy-constituency-suggestion',
    title: 'Deputy Governor: Recommendation',
    body: `Your Deputy Governor has sent a memo recommending a specific response to this week's policy situation — a direction different from what your instincts suggest. The recommendation is reasonable. But so is yours.`,
    severity: 'low',
    category: 'political',
    isRecurring: true,
    cooldownWeeks: 16,
    triggerCondition: (state) => state.deputy !== null && state.week >= 10,
    choices: [
      {
        id: 'follow-deputy',
        label: "Follow Deputy's Recommendation",
        description:
          'Trust the process. Political Capital +3. Deputy resentment stays low.',
        immediate: { politicalCapital: 3 },
        factionImpact: {},
      },
      {
        id: 'override-deputy',
        label: "Override — Go Your Own Way",
        description:
          'Your call. Trust +2. Deputy resentment +10. Repeated overrides will trigger a crisis.',
        immediate: { publicTrust: 2 },
        factionImpact: {},
      },
    ],
  },
  {
    id: 'loyalist-secret-surfaces',
    title: 'Adeyemi-Shaw: The Secret',
    body: `A journalist has obtained records showing Dr. Korede Adeyemi-Shaw, your Deputy Governor, diverted ₦120m from your 2026 campaign fund to a personal account. He repaid it — but three months later, and only after the election. He is in your office now, pale and shaking. "I can explain," he says. You believe him. That is the problem.`,
    severity: 'critical',
    category: 'political',
    triggerCondition: (state) =>
      state.deputy?.key === 'loyalist' && state.week >= 130 && !state.deputy.revealed,
    choices: [
      {
        id: 'protect-deputy',
        label: 'Protect Him — Cover It',
        description:
          'Call the journalist, lean on the publisher. Corruption Pressure +10. The story stays buried for now.',
        immediate: { corruptionPressure: 10 },
        factionImpact: { civilSocietyMedia: -10, partyGodfathers: 5 },
      },
      {
        id: 'accept-resignation',
        label: 'Accept His Resignation',
        description:
          'He goes quietly. Trust +5. You lose your most loyal ally. Political Capital -15.',
        immediate: { publicTrust: 5, politicalCapital: -15 },
        factionImpact: { civilSocietyMedia: 8 },
      },
      {
        id: 'stand-by-deputy',
        label: 'Stand By Him Publicly',
        description:
          'Call it a "resolved personal matter." Trust -8. He stays. The story runs anyway. Corruption +8.',
        immediate: { publicTrust: -8, corruptionPressure: 8 },
        factionImpact: { civilSocietyMedia: -12, partyGodfathers: 4 },
      },
    ],
  },
  {
    id: 'politician-deputy-ambition',
    title: 'Obiora: Watching the Primary Calendar',
    body: `Three intelligence reports and one candid conversation with a mutual friend all say the same thing: Hon. Amaka Obiora, your Deputy Governor, is actively courting party delegates in her home states and building a campaign infrastructure. She has not declared. She does not need to yet. But everyone in Alausa knows.`,
    severity: 'high',
    category: 'political',
    triggerCondition: (state) =>
      state.deputy?.key === 'politician' &&
      (state.deputy?.resentment ?? 0) >= 60 &&
      state.week >= 100,
    choices: [
      {
        id: 'confront-obiora',
        label: 'Confront Her Directly',
        description:
          'Have the hard conversation. Either she backs down or the relationship ends. LG Chairmen -10 if she leaves.',
        immediate: { politicalCapital: 5 },
        factionImpact: { lgChairmen: -10, partyGodfathers: -5 },
      },
      {
        id: 'strategic-reassignment',
        label: 'Give Her a Demanding Portfolio',
        description:
          'Keep her busy. Keep her inside. Trust +3 from the public "team unity" optics. Buys 10–15 weeks.',
        immediate: { publicTrust: 3 },
        factionImpact: { lgChairmen: 5 },
      },
      {
        id: 'accept-ambition',
        label: 'Acknowledge Her Ambition, Negotiate',
        description:
          'Offer to support her in 2031 if she delivers for the rest of this term. Political Capital -15, relationship stabilises.',
        immediate: { politicalCapital: -15 },
        factionImpact: { lgChairmen: 8, partyGodfathers: 3 },
      },
    ],
  },

  // --- Commissioner System ---
  {
    id: 'commissioner-works-appointment',
    title: 'Commissioner for Works: Your First Decision',
    body: `Your first major cabinet appointment. Two candidates are on the table. Engr. Sola Adesoji has already been personally recommended by Chief Fashemu — his call came before you even took office. Dr. Ayo Badru is your preferred choice: brilliant, incorruptible, and politically naïve.`,
    severity: 'high',
    category: 'political',
    week: 2,
    choices: [
      {
        id: 'appoint-adesoji',
        label: 'Appoint Adesoji (Fashemu\'s Pick)',
        description:
          'Godfather satisfied early. Corruption Pressure +5. Procurement leakage increases. You start the term in his debt.',
        immediate: { corruptionPressure: 5 },
        factionImpact: { partyGodfathers: 10, civilSocietyMedia: -8, businessCommunity: -3 },
        setFlags: { 'commissioner-works-godfather': true },
      },
      {
        id: 'appoint-badru',
        label: 'Appoint Badru (Your Pick)',
        description:
          'Clean, capable, yours. Godfather -8 from the start. Infrastructure projects run cleaner. This is the line you draw.',
        immediate: { infrastructureScore: 2 },
        factionImpact: { partyGodfathers: -8, civilSocietyMedia: 8, businessCommunity: 5 },
      },
    ],
  },
  {
    id: 'commissioner-loyalty-test',
    title: 'Commissioner Being Courted',
    body: `Your Commissioner for Finance has been seen dining privately with a known opposition financier three times in two weeks. Either she is being recruited or she is conducting her own intelligence operation. She has not told you about the meetings.`,
    severity: 'medium',
    category: 'political',
    isRecurring: true,
    cooldownWeeks: 20,
    triggerCondition: (state) =>
      state.commissioners.finance !== undefined &&
      (state.commissioners.finance?.loyalty ?? 100) < 50,
    choices: [
      {
        id: 'confront-commissioner',
        label: 'Confront Her',
        description:
          'Ask directly. If she is loyal, she will explain. If not, you will know. Political Capital +3.',
        immediate: { politicalCapital: 3 },
        factionImpact: {},
      },
      {
        id: 'reassign-commissioner',
        label: 'Reassign Her Portfolio',
        description:
          'Move her to a less sensitive role. Civil Society -3. Disrupts the Finance agenda short-term. Safer.',
        immediate: { igr: -0.1 },
        factionImpact: { civilSocietyMedia: -3, businessCommunity: -2 },
      },
    ],
  },

  // --- LGA Elections ---
  {
    id: 'lga-election-buildup',
    title: 'LGA Elections: Campaign Begins',
    body: `The Lagos State Independent Electoral Commission has announced LGA elections in six weeks. Twenty local governments go to the polls. These results will determine your ground machine for Years 3 and 4. How you play it defines the rest of the term.`,
    severity: 'high',
    category: 'political',
    week: 72,
    choices: [
      {
        id: 'lga-party-spend',
        label: 'Mobilise Party Machine',
        description:
          'Heavy spend through the party apparatus. LG Chairmen +10. Political Capital -30. Fashemu involvement implied.',
        immediate: { politicalCapital: -30 },
        factionImpact: { partyGodfathers: 5, lgChairmen: 10 },
      },
      {
        id: 'lga-independent-mobilise',
        label: 'Independent Mobilisation',
        description:
          'Mobilise civic groups and trade associations independent of the godfather network. Civil Society +10, LG Chairmen +5. Political Capital -20.',
        immediate: { politicalCapital: -20 },
        factionImpact: { civilSocietyMedia: 10, lgChairmen: 5, partyGodfathers: -5 },
      },
      {
        id: 'lga-let-party-handle',
        label: 'Let the Party Handle It',
        description:
          "Minimal intervention. Fashemu's network runs the show. You owe them after. LG Chairmen +4. Political Capital -10.",
        immediate: { politicalCapital: -10 },
        factionImpact: { partyGodfathers: 8, lgChairmen: 4 },
      },
    ],
  },
  {
    id: 'lga-election-day',
    title: 'LGA Election Results',
    body: `The votes have been counted. Lagos State Independent Electoral Commission is announcing results across all 20 local government areas. Your party's performance reflects the four years of political relationship-building — and the damage you may have done along the way.`,
    severity: 'high',
    category: 'political',
    week: 86,
    choices: [
      {
        id: 'acknowledge-results',
        label: 'Accept the Results',
        description:
          'Win or lose, you accept the outcome publicly. Trust +3. The numbers determine your ground game going forward.',
        immediate: { publicTrust: 3 },
        factionImpact: { civilSocietyMedia: 4 },
      },
    ],
  },

  // --- Party Primary ---
  {
    id: 'primary-fashemu-backed',
    title: 'Party Primary: Smooth Sailing',
    body: `Chief Fashemu — or what remains of his network — has signalled support for your re-nomination. Ward delegates are falling in line. The primary is essentially a formality. But there is a choice in how you win it.`,
    severity: 'medium',
    category: 'political',
    week: 170,
    triggerCondition: (state) =>
      state.week >= 170 &&
      state.godfatherComplianceCount >= 2 &&
      (state.fashemuPhase === 'active' || state.fashemuPhase === 'reconciled' || state.fashemuPhase === 'dormant'),
    choices: [
      {
        id: 'accept-backing',
        label: 'Accept the Backing Quietly',
        description:
          'Win smoothly. Civil Society -6 (they see it as a Godfather coronation). Political Capital +20. Ending path: A.',
        immediate: { politicalCapital: 20 },
        factionImpact: { partyGodfathers: 12, civilSocietyMedia: -6 },
        setFlags: { 'primary-a': true },
      },
      {
        id: 'primary-reform-running-mate',
        label: 'Push a Reform Running Mate (Risk Fashemu)',
        description:
          'Back a reform-minded Deputy for Term 2 against his preference. Trust +8. Fashemu goes to break phase. SMJ activates. Win requires Civil Society ≥ 55 and Business Community ≥ 50.',
        immediate: { publicTrust: 8, politicalCapital: -20 },
        factionImpact: { partyGodfathers: -20, civilSocietyMedia: 12 },
        setFlags: { 'primary-b': true, 'primary-b-civil-society': true },
      },
    ],
  },
  {
    id: 'primary-contested',
    title: 'Party Primary: Contested Race',
    body: `Hon. Seun Majekodunmi or another faction candidate has entered the primary. This will be a real contest. You need the civil society endorsement, business community confidence, and LGA turnout to pull through. Political Capital is everything now.`,
    severity: 'critical',
    category: 'political',
    week: 172,
    triggerCondition: (state) =>
      state.week >= 172 &&
      state.godfatherRefusalCount >= 2 &&
      (state.fashemuPhase === 'warning' || state.fashemuPhase === 'break'),
    choices: [
      {
        id: 'primary-grassroots',
        label: 'Grassroots Delegate Campaign',
        description:
          'Political Capital -60. Win through ward-by-ward delegate mobilisation. Requires LGA election result ≥ 60% (12/20 loyal LGAs).',
        immediate: { politicalCapital: -60 },
        factionImpact: { lgChairmen: 10, informalEconomy: 5 },
        setFlags: { 'primary-b': true, 'primary-b-grassroots': true },
      },
      {
        id: 'primary-civil-society',
        label: 'Civil Society Endorsements',
        description:
          'Let Civil Society carry your candidacy. Trust +8. Requires civilSocietyMedia ≥ 55 AND businessCommunity ≥ 50.',
        immediate: { publicTrust: 8 },
        factionImpact: { civilSocietyMedia: 10, businessCommunity: 5 },
        setFlags: { 'primary-b': true, 'primary-b-civil-society': true },
      },
    ],
  },
  {
    id: 'primary-open',
    title: 'Party Primary: Open Contest',
    body: `With Fashemu gone or neutralised, this primary is genuinely open for the first time in Lagos gubernatorial history. Three candidates. No godfather. The delegates will follow whoever makes the strongest case. This is your moment to win on merit.`,
    severity: 'high',
    category: 'political',
    week: 170,
    triggerCondition: (state) =>
      state.week >= 170 &&
      (state.fashemuPhase === 'dead' || state.godfatherRefusalCount >= 5),
    choices: [
      {
        id: 'primary-policy-platform',
        label: 'Lead With Policy',
        description:
          'Present a detailed Term 2 manifesto. Trust +10, Civil Society +10. Clean win.',
        immediate: { publicTrust: 10, politicalCapital: -20 },
        factionImpact: { civilSocietyMedia: 10, businessCommunity: 5 },
        setFlags: { 'primary-c': true },
      },
      {
        id: 'primary-coalition',
        label: 'Build a Coalition',
        description:
          'Bring together business, civil society, and LG Chairmen independently. Political Capital -30. Broadest base.',
        immediate: { politicalCapital: -30 },
        factionImpact: { businessCommunity: 8, civilSocietyMedia: 8, lgChairmen: 6 },
        setFlags: { 'primary-c': true },
      },
    ],
  },
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
        setFlags: { 'ghost-purge-aggressive': true },
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
        setFlags: { 'ghost-purge-quiet': true },
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
  {
    id: 'federal-liaison-opening',
    title: 'Abuja Dialogue Window',
    body: `The Minister of Finance has signalled willingness to negotiate state-level FAAC enhancements for Lagos, citing the city's outsized contribution to national GDP. A sustained liaison programme — 12 weeks of bilateral meetings — could lock in improved allocation terms.`,
    severity: 'high',
    category: 'political',
    week: 16,
    requiresInitiativeSlot: true,
    triggerCondition: (state) => state.stats.federalRelationship >= -10,
    choices: [
      {
        id: 'launch-federal-liaison',
        label: 'Launch Federal Liaison Programme',
        description: 'Costs 20 political capital. Takes 12 weeks.',
        immediate: { politicalCapital: -20 },
        factionImpact: { federalGovt: 5, civilSocietyMedia: -3 },
        launchInitiative: {
          id: 'federal-liaison',
          name: 'Federal Liaison Programme',
          weeksRemaining: 12,
          totalWeeks: 12,
          completionEventId: 'federal-liaison-result',
        },
      },
      {
        id: 'send-junior-delegation',
        label: 'Send junior delegation',
        description: 'Modest relationship improvement, no initiative slot used.',
        immediate: { federalRelationship: 5 },
        factionImpact: {},
      },
      {
        id: 'challenge-allocation-formula',
        label: 'Publicly challenge allocation formula',
        description: 'Popular domestically. Damages federal relationship.',
        immediate: { publicTrust: 6, federalRelationship: -10 },
        factionImpact: { civilSocietyMedia: 6, federalGovt: -10 },
      },
    ],
  },
  {
    id: 'federal-liaison-result',
    title: 'Federal Liaison Programme Concluded',
    body: `Twelve weeks of sustained engagement with Abuja has produced a formal MOU on improved FAAC terms for Lagos. Federal allocation is now protected at full rate.`,
    severity: 'high',
    category: 'political',
    choices: [
      {
        id: 'confirm-mou',
        label: 'Confirm the MOU',
        description: 'Finalise the federal liaison agreement.',
        immediate: { federalRelationship: 20 },
        factionImpact: {},
      },
    ],
  },
  {
    id: 'party-summit-offer',
    title: 'Party Summit Olive Branch',
    body: 'The APC Lagos Chapter has called a closed-door summit. Your handlers say the godfathers are willing to reset the relationship — but they want concessions. Showing up is itself a signal of willingness to deal.',
    severity: 'high',
    category: 'political',
    isRecurring: true,
    cooldownWeeks: 20,
    triggerCondition: (state) =>
      state.factions.partyGodfathers < 25 && state.week > 52 && state.impeachmentStage === 0,
    choices: [
      {
        id: 'attend-make-concessions',
        label: 'Attend and Concede Ground',
        description: 'Godfathers +20, Political Capital -15.',
        immediate: { politicalCapital: -15 },
        factionImpact: { partyGodfathers: 20 },
      },
      {
        id: 'attend-hold-line',
        label: 'Attend but Hold Your Line',
        description: 'Godfathers +8. Less costly but less effective.',
        immediate: { politicalCapital: -5 },
        factionImpact: { partyGodfathers: 8, civilSocietyMedia: 4 },
      },
      {
        id: 'boycott-summit',
        label: 'Boycott the Summit',
        description: 'Godfathers -10. Civil Society +5.',
        immediate: {},
        factionImpact: { partyGodfathers: -10, civilSocietyMedia: 5 },
      },
    ],
  },

  // ── State of the State: annual internal memos ────────────────────────────

  {
    id: 'state-of-state-year1',
    title: 'Year One Review: Internal Memo',
    body: `LAGOS STATE GOVERNMENT — RESTRICTED
FROM: Office of the Chief of Staff
TO: H.E. The Governor

Twelve months in. The honeymoon period is formally over.

Revenue: IGR baseline has shifted since handover. FAAC dependency remains elevated — federal allocation still accounts for over 35% of total weekly receipts. LIRS digital roll-out is showing early results in Ikeja and Surulere.

Political: The party's National Working Committee has been watching how you managed the first godfather contacts. Their assessment is not yet written, but it will be. Three commissioner portfolios still carry informal relationships from the previous administration.

Public confidence tracks your infrastructure decisions from the first quarter more than any other variable. Youth tension is moving with the unemployment numbers — it always does.

This office recommends a frank expenditure review before Year 2 commitments are locked.`,
    severity: 'medium',
    category: 'political',
    triggerCondition: (state) => state.week >= 52 && state.week <= 57,
    choices: [
      {
        id: 'commission-fiscal-review',
        label: 'Commission Internal Fiscal Review',
        description: 'Signal discipline. Political Capital -8. Identify savings or expose problems. Cash Reserve +2.',
        immediate: { cashReserve: 2, politicalCapital: -8 },
        factionImpact: { civilSocietyMedia: 4, partyGodfathers: -3 },
      },
      {
        id: 'acknowledge-internally',
        label: 'Acknowledge Internally, Stay the Course',
        description: 'No disruption. Political Capital +2. You know where you stand.',
        immediate: { politicalCapital: 2 },
        factionImpact: {},
      },
      {
        id: 'publish-year-one-scorecard',
        label: 'Publish the Findings Publicly',
        description: 'Radical transparency. Civil Society +10, Godfathers -6. You will be held to what you admit.',
        immediate: { publicTrust: 5, politicalCapital: -5 },
        factionImpact: { civilSocietyMedia: 10, partyGodfathers: -6 },
      },
    ],
  },

  {
    id: 'state-of-state-year2',
    title: 'Mid-Term Review: Internal Memo',
    body: `LAGOS STATE GOVERNMENT — RESTRICTED
FROM: Office of the Chief of Staff
TO: H.E. The Governor

You are at the midpoint of your first term. This is when legacies begin to show.

Structural: The Year 1 investments are now producing second-order effects — or not. Revenue lines that were bets are either paying or draining. Faction loyalty has crystallised around the decisions you made under pressure, not under comfort.

The LGA election result defined your relationship with the House for the next two years. That calculus is now fixed.

Historical note: Every Lagos governor who lost re-election made their decisive mistake between Weeks 104 and 156. The next year is not where victories are won — it is where they are thrown away.

This office recommends protecting structural gains and being selective about new commitments before the campaign window.`,
    severity: 'high',
    category: 'political',
    triggerCondition: (state) => state.week >= 104 && state.week <= 109,
    choices: [
      {
        id: 'cabinet-reshuffle',
        label: 'Reshuffle the Cabinet',
        description: 'Reset relationships. Political Capital -10. New energy, new liabilities.',
        immediate: { politicalCapital: -10 },
        factionImpact: { partyGodfathers: -5, civilSocietyMedia: 5, lgChairmen: 3 },
      },
      {
        id: 'double-down-direction',
        label: 'Stay the Course',
        description: 'Political Capital +5. Stability signals confidence. Markets and civil servants respond to consistency.',
        immediate: { politicalCapital: 5, publicTrust: 3 },
        factionImpact: { businessCommunity: 5 },
      },
      {
        id: 'declare-midterm-reform',
        label: 'Declare a Mid-Term Reform Agenda',
        description: 'Trust +5, Civil Society +6, Political Capital -8. The party will want to know what changed.',
        immediate: { publicTrust: 5, politicalCapital: -8 },
        factionImpact: { civilSocietyMedia: 6, partyGodfathers: -4 },
      },
    ],
  },

  {
    id: 'state-of-state-year3',
    title: 'Year Three Review: Eyes Only',
    body: `LAGOS STATE GOVERNMENT — FOR YOUR EYES ONLY
FROM: Office of the Chief of Staff
TO: H.E. The Governor

One year to the election.

Electoral: Internal polling projections are in a sealed annex. This office will not summarise them in writing. A verbal briefing should be scheduled this week.

Financial: The state's fiscal position over the next 52 weeks is the single most visible indicator voters use. Not the long speeches. Not the press releases. The roads in their street, the teacher in their child's school, the checkpoint on their commute.

Legacy: What you have built since Week 1 is now visible to anyone who examines it. The question is no longer what you are going to do. It is what you have already done.

Campaign mode begins at Week 195. There are 39 weeks between now and then.`,
    severity: 'high',
    category: 'political',
    triggerCondition: (state) => state.week >= 156 && state.week <= 161,
    choices: [
      {
        id: 'pivot-quick-wins',
        label: 'Pivot to Visible Quick Wins',
        description: 'Trust +6, Political Capital -5, Infrastructure -2. Election-year instinct: visible impact over structural gain.',
        immediate: { publicTrust: 6, politicalCapital: -5, infrastructureScore: -2 },
        factionImpact: { lgChairmen: 5, businessCommunity: -3 },
      },
      {
        id: 'stay-governance-course',
        label: 'Stay the Course',
        description: 'Political Capital +5. Resist governing for headlines. Structural gains hold.',
        immediate: { politicalCapital: 5 },
        factionImpact: { businessCommunity: 4, civilSocietyMedia: 3 },
      },
      {
        id: 'early-campaign-positioning',
        label: 'Begin Early Campaign Positioning',
        description: 'Trust +3, Godfathers +5, Civil Society -4. Start warming up the party machine now.',
        immediate: { publicTrust: 3, politicalCapital: -3 },
        factionImpact: { partyGodfathers: 5, civilSocietyMedia: -4 },
      },
    ],
  },
]
