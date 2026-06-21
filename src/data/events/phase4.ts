import type { EventCard } from '../../state/types'

export const phase4Events: EventCard[] = [
  // ─── Cat 2: Federal Overreach (trigger-condition outcomes first for priority) ─

  {
    id: 'suspension-legal-challenge-success',
    title: 'Legal Challenge: Court Rules in Your Favour',
    body: `The Federal High Court has issued an emergency ruling: the emergency declaration lacked the statutory basis required under Section 305 of the Constitution. It was never submitted to the National Assembly within the prescribed period. The Sole Administrator must vacate Government House within 48 hours.`,
    severity: 'critical',
    category: 'political',
    maxTotalFirings: 2,
    triggerCondition: (state) =>
      state.stateFlags['legal-challenge-filed'] === true &&
      state.factions.partyGodfathers > 30 &&
      state.stats.publicTrust > 40,
    choices: [
      {
        id: 'accept-court-victory',
        label: 'Return to Government House',
        description:
          'A constitutional victory. Trust +10. PC +30. Partygodfathers +8. Suspension ends immediately.',
        immediate: { publicTrust: 10, politicalCapital: 30 },
        factionImpact: { partyGodfathers: 8, civilSocietyMedia: 12, federalGovt: -5 },
        setFlags: {
          'legal-challenge-filed': false,
          'legal-challenge-succeeded': true,
        },
      },
    ],
  },

  {
    id: 'suspension-legal-challenge-fail',
    title: 'Legal Challenge: Application Struck Out',
    body: `The Federal High Court has struck out your emergency challenge as "premature" — a procedural ruling the government's lawyers clearly choreographed. The court suggests you pursue normal appeal channels, which will take six to eight weeks. The Sole Administrator issued a statement saying he "respects the judiciary."`,
    severity: 'critical',
    category: 'political',
    maxTotalFirings: 2,
    triggerCondition: (state) =>
      state.stateFlags['legal-challenge-filed'] === true &&
      !(state.factions.partyGodfathers > 30 && state.stats.publicTrust > 40),
    choices: [
      {
        id: 'regroup-legal-fail',
        label: 'Regroup — take it to the appeal court',
        description:
          'PC -20. The suspension continues. Partygodfathers -5 (looked weak). File again when conditions improve.',
        immediate: { politicalCapital: -20 },
        factionImpact: { partyGodfathers: -5, civilSocietyMedia: -3 },
        setFlags: { 'legal-challenge-filed': false },
      },
    ],
  },

  // ─── Cat 1: Judicial Arc (trigger-condition outcome must be high priority) ──

  {
    id: 'tribunal-midpoint-hearing',
    title: 'Electoral Tribunal: Midpoint Hearing',
    body: `The electoral tribunal has resumed after a five-week recess. Your legal team has filed 140 exhibits. The petitioner's counsel is expected to present the cross-examination of your returning officers today. The atmosphere in the court is electric — the judiciary is being watched by everyone. How you manage this hearing will shape the final ruling.`,
    severity: 'high',
    category: 'political',
    triggerCondition: (state) => state.litigationActive && state.litigationTimer <= 10,
    choices: [
      {
        id: 'press-witnesses',
        label: 'Mount an Aggressive Cross-Examination',
        description:
          'PC -20. Partygodfathers -5 (you\'re spending their capital). But strengthens your case — increases final ruling odds.',
        immediate: { politicalCapital: -20 },
        factionImpact: { partyGodfathers: -5, civilSocietyMedia: 8 },
        setFlags: { 'tribunal-contested-aggressively': true },
      },
      {
        id: 'concede-minor-points',
        label: 'Concede Minor Points, Defend Core Claims',
        description:
          'Looks judicial and measured. No stat cost. Partygodfathers +3. Slightly lower final ruling odds.',
        immediate: {},
        factionImpact: { partyGodfathers: 3, civilSocietyMedia: 3 },
      },
      {
        id: 'negotiate-out-of-court',
        label: 'Approach Petitioner for Out-of-Court Settlement',
        description:
          'PC -25. Ends litigation immediately if successful. Corruption +5. Civil society -8 (seen as dodging justice).',
        immediate: { politicalCapital: -25, corruptionPressure: 5 },
        factionImpact: { civilSocietyMedia: -8, partyGodfathers: 5 },
        setFlags: { 'litigation-settled': true },
        setLitigationTimer: 0,
      },
    ],
  },

  // ─── Cat 3: Godfather Warfare ─────────────────────────────────────────────
  // These appear first so triggered outcomes (populist shield) take priority
  // in ALL_EVENTS over other simultaneously-triggered events.

  {
    id: 'populist-shield-success',
    title: 'Populist Shield: The Chamber Holds',
    body: `Market women, bus drivers, agberos who switched sides, and thousands of Lagos residents have locked the Assembly House from outside. By noon, eleven of the eighteen rebel lawmakers have quietly withdrawn. The quorum collapsed before it could be formalised. The Speaker has issued a statement calling it a "scheduling misunderstanding." Your governance record just saved your office.`,
    severity: 'critical',
    category: 'political',
    maxTotalFirings: 3,
    triggerCondition: (state) =>
      state.stateFlags['populist-shield-invoked'] === true &&
      state.stats.infrastructureScore > 60 &&
      state.stats.publicTrust > 55,
    choices: [
      {
        id: 'accept-shield-victory',
        label: 'Address the crowd and thank Lagos',
        description:
          'Trust +8. PC +20. Partygodfathers +10 (rebellion broken). Civil Society +8.',
        immediate: { publicTrust: 8, politicalCapital: 20 },
        factionImpact: { civilSocietyMedia: 8, partyGodfathers: 10, informalEconomy: 8 },
        setFlags: { 'populist-shield-invoked': false, 'populist-shield-succeeded': true },
      },
    ],
  },

  {
    id: 'populist-shield-fail',
    title: 'Populist Shield: The Crowd Melts Away',
    body: `The turnout is thin. Without a credible infrastructure record, the mobilisation reads as desperation. Photos circulate: a small group of flag-wavers outside an empty Assembly House. The rebel lawmakers walk calmly past them. The assembly rebellion has gained momentum and is now a formal session.`,
    severity: 'critical',
    category: 'political',
    maxTotalFirings: 3,
    triggerCondition: (state) =>
      state.stateFlags['populist-shield-invoked'] === true &&
      !(state.stats.infrastructureScore > 60 && state.stats.publicTrust > 55),
    choices: [
      {
        id: 'regroup-after-failure',
        label: 'Regroup — the assembly now has momentum',
        description:
          'Trust -8. PC -15. Partygodfathers -12. The removal process begins.',
        immediate: { publicTrust: -8, politicalCapital: -15 },
        factionImpact: { partyGodfathers: -12, civilSocietyMedia: -5 },
        setFlags: { 'populist-shield-invoked': false },
        followUpEventId: 'removal-resolution-reading',
      },
    ],
  },

  {
    id: 'assembly-quorum-maneuver',
    title: 'Assembly G-18 Quorum Maneuver',
    body: `Eighteen assembly members have convened in a private hotel suite off Lagos Island. Your party coordinator intercepts a message: the Speaker — acting on instructions from the party's inner caucus — is claiming quorum for an emergency motion to suspend your administration. You have twenty minutes before the session opens. A lorry outside has begun unloading what appears to be bags of rice.`,
    severity: 'critical',
    category: 'political',
    isRecurring: true,
    cooldownWeeks: 18,
    triggerCondition: (state) => {
      const hasHostileInsider = (['npc1', 'npc2', 'npc3'] as const).some((slot) => {
        const npc = state.activeNPCs[slot]
        return npc.isActive && npc.archetypeKey === 'insider' && npc.relationship < 30
      })
      return (
        state.factions.partyGodfathers < 22 &&
        state.week > 52 &&
        (hasHostileInsider || state.factions.partyGodfathers < 15)
      )
    },
    choices: [
      {
        id: 'invoke-populist-shield',
        label: 'Invoke Populist Shield — Mobilise the Streets',
        description:
          'Market associations, transport unions, and community leaders converge on the Assembly House. Works if infrastructure > 60 AND public trust > 55. Costs 15 PC.',
        immediate: { politicalCapital: -15 },
        factionImpact: {},
        setFlags: { 'populist-shield-invoked': true },
      },
      {
        id: 'buy-off-rebels',
        label: 'Buy Off Three Rebel Assembly Members',
        description:
          'Temporary fix. Cash -1.5, PC -20, Corruption +5. The threat returns in 12 weeks.',
        immediate: { cashReserve: -1.5, corruptionPressure: 5 },
        factionImpact: { partyGodfathers: -3, civilSocietyMedia: -5 },
        politicalCapitalCost: 20,
        delayed: {
          weekOffset: 12,
          delta: {},
          eventText:
            'The assembly members you bought off have been re-approached by the opposition with a better offer. The threat of a quorum maneuver has resurfaced.',
        },
      },
      {
        id: 'concede-to-assembly',
        label: 'Accept Dialogue with Assembly Leadership',
        description:
          "Concede to a joint investigation committee. Partygodfathers +5 but you've shown weakness. The process begins.",
        immediate: { publicTrust: -5 },
        factionImpact: { partyGodfathers: 5, civilSocietyMedia: -8 },
        followUpEventId: 'removal-resolution-reading',
      },
    ],
  },

  {
    id: 'neighboring-sanctuary-offer',
    title: 'A Lifeline From Outside',
    body: `A trusted intermediary arrives at your private residence. Senator Adeniyi Olaitan — one of the most powerful political operators in the Southwest — is extending a private offer: legal protection, a press operations base in Abuja, and informal political capital to contest your removal through the courts. "The war can be won from the outside," he says. "You cannot hold Government House if the Assembly votes."`,
    severity: 'critical',
    category: 'political',
    triggerCondition: (state) =>
      state.impeachmentStage >= 1 &&
      !state.stateFlags['sanctuary-offer-resolved'] &&
      state.factions.partyGodfathers < 18,
    choices: [
      {
        id: 'accept-sanctuary',
        label: 'Accept — Fight From the Outside',
        description:
          'You temporarily relocate. PC +80 (external network activates). Trust -5 (seen as abandoning post). Partygodfathers -15 (conceding the terrain).',
        immediate: { politicalCapital: 80, publicTrust: -5 },
        factionImpact: { partyGodfathers: -15, civilSocietyMedia: -5, federalGovt: 5 },
        setFlags: { 'sanctuary-accepted': true, 'sanctuary-offer-resolved': true },
      },
      {
        id: 'refuse-sanctuary',
        label: 'Refuse — Stand Your Ground',
        description:
          'You stay. The assembly vote proceeds but your moral authority is intact. Trust +5. PC -10.',
        immediate: { publicTrust: 5, politicalCapital: -10 },
        factionImpact: { civilSocietyMedia: 8, partyGodfathers: -3 },
        setFlags: { 'sanctuary-offer-resolved': true },
      },
    ],
  },

  // ─── Cat 4: Fiscal Pathologies ────────────────────────────────────────────

  {
    id: 'ghost-worker-crisis-alert',
    title: 'Payroll Crisis: Ghost Worker Surge',
    body: `The IPPIS has flagged a growing anomaly. An estimated 15–20% of the state payroll — approximately ₦3.2bn per month — cannot be matched to biometric data. The Accountant-General has presented two investigation routes. Every week of inaction costs roughly ₦800m in ghost salaries.`,
    severity: 'critical',
    category: 'economy',
    requiresInitiativeSlot: true,
    triggerCondition: (state) =>
      state.stats.ghostWorkerRate > 0.14 &&
      !state.resolvedEvents.includes('civil-service-reform-result') &&
      !state.stateFlags['ghost-purge-resolved'],
    choices: [
      {
        id: 'launch-biometric-audit-phase2',
        label: 'Biometric Audit — Full Deployment',
        description:
          'Costs ₦8bn upfront. 12 weeks. Permanent ~40% reduction in ghost worker rate. No political negotiation required.',
        immediate: { cashReserve: -8, corruptionPressure: -3 },
        factionImpact: { civilSocietyMedia: 5, lgChairmen: -6 },
        launchInitiative: {
          id: 'ghost-worker-biometric',
          name: 'Ghost Worker Biometric Audit',
          weeksRemaining: 12,
          totalWeeks: 12,
          completionEventId: 'ghost-worker-biometric-success',
        },
      },
      {
        id: 'launch-committee-audit-phase2',
        label: 'Legislative Committee Audit',
        description:
          'Free. 8 weeks. Committee demands will surface at week 4. Outcome depends on your response.',
        immediate: { politicalCapital: -5 },
        factionImpact: { partyGodfathers: 5, lgChairmen: 3 },
        delayed: {
          weekOffset: 4,
          delta: {},
          eventText:
            'The Ghost Worker Audit Committee has suspended proceedings. Members are demanding ₦500M in "operational allowances" before the final verification phase can begin.',
          followUpEventId: 'ghost-worker-committee-stall',
        },
        launchInitiative: {
          id: 'ghost-worker-committee',
          name: 'Ghost Worker Committee Audit',
          weeksRemaining: 8,
          totalWeeks: 8,
          completionEventId: 'ghost-worker-committee-success',
        },
      },
      {
        id: 'defer-ghost-purge',
        label: 'Defer — Too Politically Sensitive Now',
        description:
          'The problem compounds. Corruption pressure rises as the drain continues.',
        immediate: { corruptionPressure: 5 },
        factionImpact: { lgChairmen: 4 },
      },
    ],
  },

  {
    id: 'ghost-worker-committee-stall',
    title: 'Ghost Worker Committee: Allowance Standoff',
    body: `The committee chairman has called your office directly. They need ₦500M in "operational logistics support" — per diem for committee staff, access fees for IPPS terminals, and "facilitation" for MDA cooperation. The investigation is frozen until you respond.`,
    severity: 'high',
    category: 'economy',
    // Queue-only: fired via delayed consequence from committee audit choice
    triggerCondition: () => false,
    choices: [
      {
        id: 'pay-committee-allowances',
        label: 'Pay the ₦500M Allowances',
        description:
          'Investigation resumes. Cash -0.5. Corruption +3 (you rewarded the shakedown). Committee delivers full verification on completion.',
        immediate: { cashReserve: -0.5, corruptionPressure: 3 },
        factionImpact: { partyGodfathers: 3, lgChairmen: 3 },
      },
      {
        id: 'refuse-committee-allowances',
        label: 'Refuse — Escalate to Anti-Corruption',
        description:
          'Investigation loses MDA access. Ghost workers shift to new slots (+2% rate now). Civil Society gains respect. Completion delivers a weaker result.',
        immediate: { ghostWorkerRate: 0.02, corruptionPressure: -4 },
        factionImpact: { civilSocietyMedia: 8, lgChairmen: -8, partyGodfathers: -4 },
      },
    ],
  },

  {
    id: 'ghost-worker-biometric-success',
    title: 'Biometric Audit Complete: Major Breakthrough',
    body: `The 12-week biometric deployment is complete. 6,200 ghost workers have been permanently removed from the payroll — a ₦2.4bn monthly saving. The civil service union filed a protest but lacks legal grounds. International donors have noted the result positively. This is a landmark fiscal reform.`,
    severity: 'high',
    category: 'economy',
    // Queue-only: fired by tickInitiative when biometric initiative completes
    triggerCondition: () => false,
    choices: [
      {
        id: 'implement-biometric-outcome',
        label: 'Implement the verified payroll',
        description:
          'Ghost worker rate -40%. Civil service reform score +25. Base overheads -2.',
        immediate: { ghostWorkerRate: -0.06, civilServiceReformScore: 25, baseOverheads: -2 },
        factionImpact: { civilSocietyMedia: 5, businessCommunity: 5 },
        setFlags: { 'ghost-purge-resolved': true },
      },
    ],
  },

  {
    id: 'ghost-worker-committee-success',
    title: 'Committee Audit Filed: Partial Result',
    body: `The assembly committee has submitted its final report. The result is mixed. Verification gaps remain — the committee's limited MDA access left significant payroll sections unaudited. Political constraints produced a political outcome. Some ghost workers excised, many still in the system.`,
    severity: 'medium',
    category: 'economy',
    // Queue-only: fired by tickInitiative when committee initiative completes
    triggerCondition: () => false,
    choices: [
      {
        id: 'accept-committee-report',
        label: 'Accept and implement the partial result',
        description:
          'Ghost worker rate -20%. Civil service reform score +10.',
        immediate: { ghostWorkerRate: -0.03, civilServiceReformScore: 10 },
        factionImpact: { partyGodfathers: 3 },
        setFlags: { 'ghost-purge-resolved': true },
      },
    ],
  },

  {
    id: 'stomach-infrastructure-pressure',
    title: 'Stomach Infrastructure Season',
    body: `Election season has turned the Lagos political economy on its head. A ward chairman from Alimosho is blunt: "Oga, the people don't want road — they want rice." Community leaders in Oshodi report the opposition is distributing ₦10,000 cash envelopes per household. Your party coordinator warns: without matching it, turnout projections in six swing wards fall below 40%.`,
    severity: 'medium',
    category: 'economy',
    isRecurring: true,
    cooldownWeeks: 10,
    triggerCondition: (state) => state.week >= 155 || state.inCampaignMode,
    choices: [
      {
        id: 'distribute-food-cash',
        label: 'Distribute Rice, Cash, and Essential Goods',
        description:
          'Trust +8 in target constituencies. Cash -3. Corruption +3. Infrastructure -0.5. Repeat use degrades yield and spikes corruption.',
        immediate: { cashReserve: -3, corruptionPressure: 3, infrastructureScore: -0.5 },
        factionImpact: { informalEconomy: 8, lgChairmen: 6 },
        constituencyImpact: {
          alimosho: 8,
          oshodi: 7,
          surulere: 5,
          periphery: 6,
          makoko: 6,
        },
        diminishingReturns: true,
      },
      {
        id: 'resist-and-build',
        label: 'Resist — Keep Building, Trust the Record',
        description:
          'Infrastructure +3. PC -8. Short-term trust loss in swing constituencies.',
        immediate: { infrastructureScore: 3, politicalCapital: -8 },
        factionImpact: { civilSocietyMedia: 6, lgChairmen: -6, informalEconomy: -8 },
        constituencyImpact: {
          alimosho: -5,
          oshodi: -5,
          periphery: -4,
          makoko: -4,
        },
      },
      {
        id: 'empowerment-kits',
        label: 'Issue Branded Empowerment Kits',
        description:
          'Face caps, wrappers, bags. Trust +4 in target areas. Cash -1. Civil society ridicules.',
        immediate: { cashReserve: -1 },
        factionImpact: { civilSocietyMedia: -5, informalEconomy: 3, lgChairmen: 4 },
        constituencyImpact: {
          alimosho: 4,
          oshodi: 4,
          periphery: 3,
          makoko: 3,
        },
      },
    ],
  },

  {
    id: 'rally-funding-demand',
    title: 'Campaign Machinery: Rally Funding',
    body: `Your campaign coordinator presents the mobilisation bill: ₦1.5bn to fund rallies in Alimosho, Oshodi, and Agege. Without organised transport and feeding, ward-level attendance projects 40% below target. The infrastructure commission chairman quietly suggests the Ojota overpass contingency. "Finish it after the election," he says.`,
    severity: 'medium',
    category: 'economy',
    isRecurring: true,
    cooldownWeeks: 12,
    triggerCondition: (state) =>
      (state.week >= 165 || state.inCampaignMode) && state.stats.cashReserve > 5,
    choices: [
      {
        id: 'fund-rallies-from-infra',
        label: 'Divert Infrastructure Funds',
        description:
          'Cash -1.5. Infrastructure -3. LG Chairmen +8. Corruption +2. The contractor notices.',
        immediate: { cashReserve: -1.5, infrastructureScore: -3, corruptionPressure: 2 },
        factionImpact: { lgChairmen: 8, civilSocietyMedia: -4, businessCommunity: -3 },
      },
      {
        id: 'fund-rallies-politically',
        label: 'Use Party Discretionary Account',
        description: 'PC -30. Cash unchanged. Strains reserves but books stay clean.',
        immediate: { politicalCapital: -30 },
        factionImpact: { partyGodfathers: 5, lgChairmen: 3 },
      },
      {
        id: 'digital-campaign-only',
        label: 'Digital Campaign — Skip the Rallies',
        description:
          'Cash saved. Civil Society +5. LG Chairmen -10 (bypassed). Risky in Alimosho.',
        immediate: {},
        factionImpact: { civilSocietyMedia: 5, lgChairmen: -10 },
        constituencyImpact: { alimosho: -6, oshodi: -4 },
      },
    ],
  },

  // ─── Cat 2: Federal Overreach ─────────────────────────────────────────────

  {
    id: 'federal-emergency-threat',
    title: 'Federal Warning: Emergency Instruments Prepared',
    body: `A confidential briefing from your Abuja contact lands at 6 a.m.: the Presidency has completed the paperwork for a Section 305 emergency declaration over Lagos State. The trigger is "breakdown of public order and fiscal mismanagement." The decision has not been signed. A delegation from the National Economic Council arrives this afternoon. This is a five-day window.`,
    severity: 'critical',
    category: 'political',
    triggerCondition: (state) =>
      state.stats.federalRelationship < -25 &&
      state.stats.youthTension > 65 &&
      !state.stateFlags['emergency-ever-suspended'] &&
      !state.stateFlags['federal-emergency-threatened'],
    choices: [
      {
        id: 'cooperate-with-abuja',
        label: 'Cooperate with the Federal Delegation',
        description:
          'Accept their oversight conditions. Federal relationship +10. PC -20. Trust -3 (looks like capitulation). Averts suspension.',
        immediate: { federalRelationship: 10, publicTrust: -3, politicalCapital: -20 },
        factionImpact: { federalGovt: 10, partyGodfathers: -5, civilSocietyMedia: -5 },
        setFlags: { 'federal-emergency-threatened': true },
      },
      {
        id: 'publicly-defy-emergency',
        label: 'Publicly Defy — Call a Press Conference',
        description:
          'Trust +8 (you fought). Federal relationship -8. Suspension declaration fires in 2 weeks unless you reach a settlement.',
        immediate: { publicTrust: 8, federalRelationship: -8 },
        factionImpact: { civilSocietyMedia: 10, partyGodfathers: -3, federalGovt: -10 },
        setFlags: { 'federal-emergency-threatened': true },
        delayed: {
          weekOffset: 2,
          delta: {},
          eventText:
            'The Presidency has signed the Section 305 emergency declaration. A Sole Administrator has been sworn in at Alausa Government House.',
          followUpEventId: 'federal-emergency-declared',
        },
      },
    ],
  },

  {
    id: 'federal-emergency-declared',
    title: 'State of Emergency: Sole Administrator Installed',
    body: `The Section 305 declaration has been signed and gazetted. Brigadier-General Olurin (Rtd.) has been sworn in as Sole Administrator of Lagos State. He holds all executive powers. Your commissioners have been asked to vacate their offices. Government House has been secured by mobile police. You are constitutionally stripped of executive authority for the duration of the emergency — up to six months.`,
    severity: 'critical',
    category: 'political',
    // Queue-only: fires via delayed consequence from publicly-defy choice
    triggerCondition: () => false,
    choices: [
      {
        id: 'accept-suspension-fight-legally',
        label: 'Accept the Suspension — Fight Through the Courts',
        description:
          'The suspension begins (5 weeks game-time). Every week, the Administrator acts. You can file a legal challenge each week.',
        immediate: { publicTrust: -5 },
        factionImpact: { partyGodfathers: -8, civilSocietyMedia: 5 },
        setSuspensionWeeks: 5,
      },
      {
        id: 'mobilise-assembly-against-declaration',
        label: 'Mobilise the Assembly to Reject the Declaration',
        description:
          'Section 305 requires Assembly ratification within 48 hours. If partyGodfathers > 40: challenge succeeds, suspension averted. If not: fails, suspension begins anyway.',
        immediate: { politicalCapital: -30 },
        factionImpact: { partyGodfathers: -5 },
        // If godfathers too low, suspension still starts via the gameLoop trigger
        setSuspensionWeeks: 3,
      },
    ],
  },

  // 5 administrator act events (queue-only, fired by tickSuspension each week)
  {
    id: 'sole-administrator-act-1',
    title: 'Administrator Week 1: Federal Contracts',
    body: `Alhaji Olurin has awarded a ₦5bn emergency road rehabilitation contract to a federal construction firm — bypassing Lagos procurement rules. Your Works Commissioner has been removed and replaced by a federal appointee. The state accounts show a new operational transfer to "security deployment costs."`,
    severity: 'high',
    category: 'crisis',
    triggerCondition: () => false,
    choices: [
      {
        id: 'file-legal-challenge-1',
        label: 'File a Legal Challenge',
        description:
          'PC -30. If partyGodfathers > 30 AND trust > 40: court rules in your favour and suspension ends early.',
        immediate: { politicalCapital: -30 },
        factionImpact: { civilSocietyMedia: 5 },
        setFlags: { 'legal-challenge-filed': true },
      },
      {
        id: 'maintain-silence-1',
        label: 'Maintain Dignified Silence',
        description:
          'Your supporters in Alimosho are holding prayer vigils. A timeline entry shows their solidarity.',
        immediate: { publicTrust: 2 },
        factionImpact: { informalEconomy: 3 },
      },
    ],
  },

  {
    id: 'sole-administrator-act-2',
    title: 'Administrator Week 2: Military Dispersal',
    body: `Federal troops have dispersed a peaceful protest at Lagos Island demanding your return. Three market women were hospitalised. The Administrator issued a statement calling the protest "a threat to public order." Civil society organisations have issued a joint statement denouncing the crackdown — but without executive power, you cannot respond officially.`,
    severity: 'high',
    category: 'crisis',
    triggerCondition: () => false,
    choices: [
      {
        id: 'file-legal-challenge-2',
        label: 'File a Legal Challenge',
        description:
          'PC -30. If partyGodfathers > 30 AND trust > 40: court rules in your favour and suspension ends early.',
        immediate: { politicalCapital: -30 },
        factionImpact: { civilSocietyMedia: 5 },
        setFlags: { 'legal-challenge-filed': true },
      },
      {
        id: 'issue-private-statement-2',
        label: 'Issue a Private Statement of Support',
        description:
          'Reaches supporters through unofficial channels. Trust +3. LG Chairmen +2.',
        immediate: { publicTrust: 3 },
        factionImpact: { lgChairmen: 2, informalEconomy: 4 },
      },
    ],
  },

  {
    id: 'sole-administrator-act-3',
    title: 'Administrator Week 3: Council Dissolution',
    body: `The Administrator has dissolved three local government councils in Alimosho, Oshodi, and Surulere — the areas with the highest loyalty to your administration. Federal-appointed caretaker committees have been installed. Your party ward coordinators report that the new administrators are blocking access to the councillors' offices.`,
    severity: 'high',
    category: 'crisis',
    triggerCondition: () => false,
    choices: [
      {
        id: 'file-legal-challenge-3',
        label: 'File a Legal Challenge',
        description:
          'PC -30. If partyGodfathers > 30 AND trust > 40: court rules in your favour and suspension ends early.',
        immediate: { politicalCapital: -30 },
        factionImpact: { civilSocietyMedia: 5 },
        setFlags: { 'legal-challenge-filed': true },
      },
      {
        id: 'coordinate-through-party-3',
        label: 'Coordinate Through Party Structures',
        description:
          'PC -10. Party channels keep loyalists organised despite the dissolution.',
        immediate: { politicalCapital: -10 },
        factionImpact: { partyGodfathers: 5, lgChairmen: 4 },
      },
    ],
  },

  {
    id: 'sole-administrator-act-4',
    title: 'Administrator Week 4: Supporter Message',
    body: `Chief Adesanya writes from his hotel suite in Accra: "Sir, the people are not quiet. Oshodi market is on a one-day strike for you — unprompted. The agberos in Mile 2 refused to process any buses yesterday. We await your word. Do not let them see you broken." The message is unsigned but the handwriting is unmistakable.`,
    severity: 'medium',
    category: 'crisis',
    triggerCondition: () => false,
    choices: [
      {
        id: 'file-legal-challenge-4',
        label: 'File a Legal Challenge — The People Are Ready',
        description:
          'PC -30. If partyGodfathers > 30 AND trust > 40: court rules in your favour and suspension ends early.',
        immediate: { politicalCapital: -30 },
        factionImpact: { civilSocietyMedia: 5 },
        setFlags: { 'legal-challenge-filed': true },
      },
      {
        id: 'send-word-back-4',
        label: 'Send Word Back — Hold the Line',
        description:
          'Your message reaches the streets through trusted channels. Trust +5. Informal Economy +5.',
        immediate: { publicTrust: 5 },
        factionImpact: { informalEconomy: 5, partyGodfathers: 3 },
      },
    ],
  },

  {
    id: 'sole-administrator-act-5',
    title: 'Administrator Week 5: State Property Attacked',
    body: `State government property was vandalised overnight at three locations. The Administrator blamed "remnants of the former administration." Local intelligence suggests the vandalism was organised by federal loyalists to justify extending the suspension period. The press is printing the Administrator's version unchallenged.`,
    severity: 'high',
    category: 'crisis',
    triggerCondition: () => false,
    choices: [
      {
        id: 'file-legal-challenge-5',
        label: 'File a Final Legal Challenge',
        description:
          'PC -30. If partyGodfathers > 30 AND trust > 40: court rules in your favour and suspension ends early.',
        immediate: { politicalCapital: -30 },
        factionImpact: { civilSocietyMedia: 5 },
        setFlags: { 'legal-challenge-filed': true },
      },
      {
        id: 'wait-out-final-week-5',
        label: 'Endure the Final Week',
        description:
          'The suspension ends next week. Every week you survived this made you harder to break. Trust +5.',
        immediate: { publicTrust: 5, politicalCapital: 10 },
        factionImpact: { civilSocietyMedia: 5 },
      },
    ],
  },

  {
    id: 'efcc-investigation-letter',
    title: 'EFCC Letter: Accounts Under Investigation',
    body: `A hand-delivered letter from the Economic and Financial Crimes Commission requests your cooperation in an investigation into "certain transactions conducted through the Lagos State Infrastructure Fund between weeks 15 and 80 of your administration." The letter is technically a request, not a charge. Your legal team has one week to respond.`,
    severity: 'high',
    category: 'political',
    triggerCondition: (state) =>
      state.stats.corruptionPressure > 68 &&
      !state.stateFlags['efcc-investigated'],
    choices: [
      {
        id: 'cooperate-with-efcc',
        label: 'Cooperate Fully — Open the Books',
        description:
          'Corruption -8. Federal relationship +5. If you have nothing to hide, this ends the matter.',
        immediate: { corruptionPressure: -8, federalRelationship: 5 },
        factionImpact: { civilSocietyMedia: 10, businessCommunity: 5, partyGodfathers: -8 },
        setFlags: { 'efcc-investigated': true, 'efcc-cooperated': true },
      },
      {
        id: 'challenge-efcc-jurisdiction',
        label: 'Challenge EFCC Jurisdiction in Court',
        description:
          'PC -20. Buys 8 weeks. Civil society -8. Corruption +3 (looks guilty).',
        immediate: { politicalCapital: -20, corruptionPressure: 3 },
        factionImpact: { civilSocietyMedia: -8, partyGodfathers: 5 },
        setFlags: { 'efcc-investigated': true },
      },
      {
        id: 'quiet-political-settlement',
        label: 'Quiet Political Settlement Through Abuja Channel',
        description:
          'PC -35. Cash -2. Corruption -3 but the precedent is set — they can ask again.',
        immediate: { politicalCapital: -35, cashReserve: -2, corruptionPressure: -3 },
        factionImpact: { partyGodfathers: 8, civilSocietyMedia: -5 },
        corruptionTrigger: true,
        setFlags: { 'efcc-investigated': true },
      },
    ],
  },

  // ─── Cat 1: Judicial Litigation ───────────────────────────────────────────

  {
    id: 'election-petition-filed',
    title: 'Electoral Tribunal: Petition Filed',
    body: `The returning officer for Eti-Osa has been served with a petition challenging your election results. The petitioner — your closest rival — is claiming irregularities in the collation of results from fourteen ward collation centres. The electoral tribunal has accepted the petition. The clock starts now. You have twenty weeks before the Supreme Court has final say.`,
    severity: 'high',
    category: 'political',
    triggerCondition: (state) =>
      state.week >= 2 &&
      state.week <= 8 &&
      state.stats.corruptionPressure > 45 &&
      !state.stateFlags['petition-filed'] &&
      !state.stateFlags['petition-avoided'],
    choices: [
      {
        id: 'contest-petition-aggressively',
        label: 'Contest — Retain Senior Counsel Immediately',
        description:
          'PC -20. Cash -1. Litigation begins (20-week countdown). Aggressive posture improves your odds at the tribunal midpoint.',
        immediate: { politicalCapital: -20, cashReserve: -1 },
        factionImpact: { civilSocietyMedia: 3, partyGodfathers: -3 },
        setFlags: { 'petition-filed': true },
        setLitigationTimer: 20,
      },
      {
        id: 'negotiate-withdrawal',
        label: 'Negotiate a Quiet Withdrawal',
        description:
          'PC -30. Cash -3. Corruption +5. The petition disappears before it becomes public. Avoids litigation entirely.',
        immediate: { politicalCapital: -30, cashReserve: -3, corruptionPressure: 5 },
        factionImpact: { civilSocietyMedia: -5, partyGodfathers: 5 },
        corruptionTrigger: true,
        setFlags: { 'petition-avoided': true },
      },
    ],
  },

  {
    id: 'supreme-court-ruling',
    title: 'Supreme Court Ruling: Final Judgement',
    body: `The Supreme Court has delivered its judgement on the consolidated electoral petition. The ruling is binding. The five-justice panel has voted 3–2. The lead justice reads the conclusion: "Having considered all exhibits, oral testimony, and the provisions of the Electoral Act 2022..."`,
    severity: 'critical',
    category: 'political',
    // Queue-only: fired by tickLitigation when litigationTimer hits 0
    triggerCondition: () => false,
    choices: [
      {
        id: 'ruling-upheld-your-election',
        label: 'Ruling: Your election is upheld — petition dismissed',
        description:
          'The court dismisses the petition for lack of evidence. Trust +10. PC +80. Off-cycle election avoided. A constitutional victory.',
        immediate: { publicTrust: 10, politicalCapital: 80 },
        factionImpact: { civilSocietyMedia: 12, partyGodfathers: 8, federalGovt: 5 },
        setFlags: { 'litigation-won': true, 'petition-filed': false },
        setLitigationTimer: 0,
      },
      {
        id: 'ruling-ordered-rerun',
        label: 'Ruling: Election voided — bye-election ordered',
        description:
          'The court orders a supplementary election in the contested LGAs. Trust -10. PC -40. Off-cycle election arc begins.',
        immediate: { publicTrust: -10, politicalCapital: -40 },
        factionImpact: { civilSocietyMedia: -8, partyGodfathers: -10 },
        setFlags: { 'litigation-lost': true, 'petition-filed': false },
        setLitigationTimer: 0,
      },
    ],
  },
]
