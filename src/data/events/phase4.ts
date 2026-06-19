import type { EventCard } from '../../state/types'

export const phase4Events: EventCard[] = [
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
          'Trust +8 in target constituencies. Cash -3. Corruption +3. Infrastructure -0.5.',
        immediate: { cashReserve: -3, corruptionPressure: 3, infrastructureScore: -0.5 },
        factionImpact: { informalEconomy: 8, lgChairmen: 6 },
        constituencyImpact: {
          alimosho: 8,
          oshodi: 7,
          surulere: 5,
          periphery: 6,
          makoko: 6,
        },
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
]
