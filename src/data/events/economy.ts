import type { EventCard } from '../../state/types'

export const economyEvents: EventCard[] = [
  {
    id: 'taxEvasionScandal',
    title: 'Tax Evasion Scandal',
    body: `A major tax evasion scandal has come to light, involving several high-profile businesses in the city. The public is outraged and demanding accountability.`,
    severity: 'medium',
    category: 'economy',
    week: 4,
    triggerCondition: (state) => state.factions.businessCommunity > 60,
    choices: [
      {
        id: 'investigateThoroughly',
        label: 'Investigate Thoroughly',
        description:
          'Launch a comprehensive investigation into the scandal, demonstrating a commitment to justice.',
        immediate: { publicTrust: +10, politicalCapital: -15 },
        factionImpact: { businessCommunity: -10, civilSocietyMedia: +5 },
        politicalCapitalCost: 15,
      },
      {
        id: 'downplayIssue',
        label: 'Downplay the Issue',
        description:
          "Minimize the scandal's impact in public statements, but risk losing credibility.",
        immediate: { publicTrust: -5, politicalCapital: +10 },
        factionImpact: { businessCommunity: +5, civilSocietyMedia: -5 },
        politicalCapitalCost: 10,
      },
    ],
  },
  {
    id: 'inflationSpike',
    title: 'Inflation Spike',
    body: `The city is experiencing a sudden spike in inflation, leading to increased prices for goods and services. Citizens are struggling to cope with the rising cost of living.`,
    severity: 'high',
    category: 'economy',
    week: 5,
    triggerCondition: (state) => state.stats.igr < 10,
    choices: [
      {
        id: 'implementPriceControls',
        label: 'Implement Price Controls',
        description:
          'Introduce temporary price controls on essential goods to protect citizens from inflation.',
        immediate: { expenditure: -5, publicTrust: +10 },
        factionImpact: { civilSocietyMedia: +5, businessCommunity: -5 },
        politicalCapitalCost: 20,
      },
      {
        id: 'promoteEconomicGrowth',
        label: 'Promote Economic Growth',
        description:
          'Focus on long-term economic growth strategies to stabilize the economy, but it may take time to see results.',
        immediate: { expenditure: -10, igr: +5 },
        factionImpact: { businessCommunity: +5, civilSocietyMedia: -5 },
        politicalCapitalCost: 25,
      },
    ],
  },
  {
    id: 'agbero-ultimatum',
    title: 'Agbero Ultimatum',
    body: `NURTW-affiliated agberos have given the state government 72 hours to reverse the new transport levy or they will ground buses across Oshodi, Ojota, and Mile 2. The informal economy moves Lagos. This is not an empty threat.`,
    severity: 'high',
    category: 'economy',
    choices: [
      {
        id: 'pay-levy-relief',
        label: 'Pay Levy Relief',
        description:
          'Transport keeps moving. IGR -0.3bn, Corruption +3, Informal Economy +8, Business Community -4 (you rewarded extortion).',
        immediate: { igr: -0.3, corruptionPressure: 3 },
        factionImpact: { informalEconomy: 8, businessCommunity: -4 },
      },
      {
        id: 'arrest-leadership',
        label: 'Arrest Faction Leadership',
        description:
          'Security +5 now. Informal Economy -15, LG Chairmen -8. Wildcat strike wk 6: IGR -1.2bn for one week.',
        immediate: { securityIndex: 5 },
        factionImpact: { informalEconomy: -15, lgChairmen: -8 },
        delayed: {
          weekOffset: 6,
          delta: { igr: -1.2 },
          eventText: `The agberos have made good on their threat — a wildcat strike has shut down transport across the city. Lagos has lost ₦1.2bn in productivity this week.`,
        },
      },
      {
        id: 'negotiate-lg-chairmen',
        label: 'Negotiate via LG Chairmen',
        description:
          'Spend Political Capital. Informal Economy +4, LG Chairmen +6. Delays problem 8 weeks, does not resolve it.',
        immediate: {},
        factionImpact: { informalEconomy: 4, lgChairmen: 6 },
        politicalCapitalCost: 20,
      },
    ],
  },
  {
    id: 'faac-shortfall',
    title: 'FAAC Shortfall',
    body: `Abuja has announced a 35% reduction in this month's FAAC allocation due to oil production shortfalls. This is ₦4.2bn less than projected. Civil servant salaries are due in 11 days.`,
    severity: 'high',
    category: 'economy',
    choices: [
      {
        id: 'emergency-borrowing',
        label: 'Emergency Borrowing',
        description: 'Salaries paid. Debt servicing +0.4bn/mth for 6 months. Civil servants +5.',
        immediate: { igr: -0.4 },
        factionImpact: {},
      },
      {
        id: 'defer-contractor-payments',
        label: 'Defer Contractor Payments',
        description:
          'Salaries paid. Contractors angry. Infrastructure stalls. Contractors down tools wk 6.',
        immediate: {},
        factionImpact: { businessCommunity: -5 },
        delayed: {
          weekOffset: 6,
          delta: { infrastructureScore: -5 },
          eventText: `Contractors have downed tools on three major infrastructure projects. Deferred payments have caught up with you.`,
        },
      },
      {
        id: 'unlock-contingency',
        label: 'Unlock Contingency Reserve',
        description:
          'One-time draw. Cash Reserve -4.2bn, no new debt. Reserve is now thin for the next crisis.',
        immediate: { cashReserve: -4.2 },
        factionImpact: {},
      },
    ],
  },

  // --- Initiative proposal events ---

  {
    id: 'paye-enforcement-proposal',
    title: 'LIRS Enforcement Proposal',
    body: `The Lagos Internal Revenue Service has mapped 340,000 gig workers and informal employers not currently on the PAYE roll. A systematic crackdown could significantly expand the tax base — but businesses will push back.`,
    severity: 'high',
    category: 'economy',
    week: 4,
    requiresInitiativeSlot: true,
    choices: [
      {
        id: 'launch-paye-drive',
        label: 'Launch Enforcement Drive',
        description: 'Commit ₦2bn and 10 weeks to a full crackdown. Expect business community resistance.',
        immediate: { cashReserve: -2, politicalCapital: -5 },
        factionImpact: { businessCommunity: -8, civilSocietyMedia: 3 },
        launchInitiative: {
          id: 'paye-enforcement',
          name: 'PAYE Enforcement Drive',
          weeksRemaining: 10,
          totalWeeks: 10,
          completionEventId: 'paye-enforcement-result',
        },
      },
      {
        id: 'voluntary-compliance-pilot',
        label: 'Voluntary Compliance Pilot',
        description: 'A softer approach. Smaller gain, no political cost.',
        immediate: { igr: 0.8 },
        factionImpact: {},
      },
      {
        id: 'defer-paye-enforcement',
        label: 'Not now',
        description: 'Defer indefinitely.',
        immediate: {},
        factionImpact: {},
      },
    ],
  },
  {
    id: 'paye-enforcement-result',
    title: 'Enforcement Drive Complete',
    body: `The PAYE crackdown is complete. 280,000 previously unregistered workers are now on the tax roll. Revenue uplift is immediate and permanent. Some businesses have complained to the Manufacturers Association.`,
    severity: 'high',
    category: 'economy',
    choices: [
      {
        id: 'note-paye-outcome',
        label: 'Note the outcome',
        description: 'Acknowledge the enforcement results.',
        immediate: { infrastructureScore: 12, igr: 2 },
        factionImpact: {},
      },
    ],
  },
  {
    id: 'luc-audit-trigger',
    title: 'Property Register Discrepancy',
    body: `The Surveyor-General has flagged that 60% of commercial properties in Lekki and Victoria Island are either unregistered or grossly under-assessed for Land Use Charge. An audit commission could recover over ₦0.6bn per week in missed revenue — but developers will retaliate.`,
    severity: 'high',
    category: 'economy',
    week: 8,
    requiresInitiativeSlot: true,
    choices: [
      {
        id: 'commission-full-audit',
        label: 'Commission Full Audit',
        description: 'Costs ₦1.5bn. Takes 8 weeks. Expect real estate faction pushback.',
        immediate: { cashReserve: -1.5, politicalCapital: -8 },
        factionImpact: { businessCommunity: -6 },
        launchInitiative: {
          id: 'luc-audit',
          name: 'Land Use Charge Audit',
          weeksRemaining: 8,
          totalWeeks: 8,
          completionEventId: 'luc-audit-result',
        },
      },
      {
        id: 'spot-check-vi',
        label: 'Spot-check Victoria Island only',
        description: 'Smaller immediate gain, no initiative slot used.',
        immediate: { landUseChargeEnforcement: 0.3, politicalCapital: -3 },
        factionImpact: { businessCommunity: -2 },
      },
      {
        id: 'defer-luc-audit',
        label: 'Acknowledge, defer',
        description: 'No action.',
        immediate: {},
        factionImpact: {},
      },
    ],
  },
  {
    id: 'luc-audit-result',
    title: 'Land Use Charge Audit Complete',
    body: `The audit commission has concluded. 4,200 commercial properties have been re-assessed. Land Use Charge collections are now running at nearly twice the previous rate.`,
    severity: 'high',
    category: 'economy',
    choices: [
      {
        id: 'accept-luc-report',
        label: 'Accept the report',
        description: 'Implement the audit recommendations.',
        immediate: { landUseChargeEnforcement: 1 },
        factionImpact: {},
      },
    ],
  },
  {
    id: 'world-bank-grant',
    title: 'World Bank Fiscal Reform Window',
    body: `The World Bank's Lagos Urban Development Programme has a ₦8bn technical assistance grant available to states that can demonstrate credible fiscal reform. The application requires a dedicated secretariat and six weeks to process.`,
    severity: 'high',
    category: 'economy',
    isRecurring: true,
    cooldownWeeks: 4,
    requiresInitiativeSlot: true,
    triggerCondition: (state) =>
      state.stats.infrastructureScore >= 45 &&
      !state.stateFlags?.['world-bank-grant-submitted'] &&
      (state.stateFlags?.['world-bank-grant-deferred'] ? state.week >= 30 : state.week >= 12),
    choices: [
      {
        id: 'submit-world-bank-app',
        label: 'Submit Application',
        description: 'Costs ₦0.5bn. Takes 6 weeks.',
        immediate: { cashReserve: -0.5 },
        factionImpact: { civilSocietyMedia: 4 },
        setFlags: { 'world-bank-grant-submitted': true },
        launchInitiative: {
          id: 'grants-mobilisation',
          name: 'World Bank Grant Mobilisation',
          weeksRemaining: 6,
          totalWeeks: 6,
          completionEventId: 'world-bank-grant-result',
        },
      },
      {
        id: 'decline-world-bank',
        label: 'Decline this cycle',
        description: 'The window re-opens later.',
        immediate: {},
        factionImpact: {},
        setFlags: { 'world-bank-grant-deferred': true },
      },
    ],
  },
  {
    id: 'world-bank-grant-result',
    title: 'World Bank Grant Approved',
    body: `The ₦8bn Technical Assistance Grant has been disbursed. The approved fiscal reform roadmap also unlocks improved reporting compliance, increasing your eligibility for future grants.`,
    severity: 'high',
    category: 'economy',
    choices: [
      {
        id: 'accept-world-bank-disbursement',
        label: 'Accept disbursement',
        description: 'Confirm the grant disbursement.',
        immediate: { cashReserve: 8, grantsCompliance: 0.4 },
        factionImpact: {},
      },
    ],
  },
  {
    id: 'civil-service-reform-opening',
    title: 'Ghost Worker Audit Report',
    body: `The Accountant-General has quietly confirmed an estimated 8,400 ghost workers on the state payroll — costing approximately ₦3bn per month. Eliminating them requires a 14-week biometric verification programme. Civil service unions will resist.`,
    severity: 'critical',
    category: 'economy',
    week: 20,
    requiresInitiativeSlot: true,
    choices: [
      {
        id: 'launch-civil-service-reform',
        label: 'Launch Phase 1 Reform',
        description: 'Costs ₦3bn upfront. Takes 14 weeks. Union tension will rise.',
        immediate: { cashReserve: -3, youthTension: 8 },
        factionImpact: { lgChairmen: -4, civilSocietyMedia: 5 },
        launchInitiative: {
          id: 'civil-service-reform',
          name: 'Phase 1 Civil Service Reform',
          weeksRemaining: 14,
          totalWeeks: 14,
          completionEventId: 'civil-service-reform-result',
        },
      },
      {
        id: 'internal-audit-only',
        label: 'Internal audit only',
        description: 'Smaller gains, no union confrontation, no initiative slot used.',
        immediate: { ghostWorkerRate: -0.02 },
        factionImpact: {},
      },
      {
        id: 'leave-ghost-workers',
        label: 'Leave it',
        description: 'Corruption pressure increases as the status quo continues.',
        immediate: { corruptionPressure: 3 },
        factionImpact: {},
      },
    ],
  },
  {
    id: 'civil-service-reform-result',
    title: 'Biometric Verification Complete',
    body: `7,200 ghost workers have been removed from the state payroll. Civil service unions are threatening industrial action. The long-term savings are permanent and significant.`,
    severity: 'critical',
    category: 'economy',
    choices: [
      {
        id: 'implement-civil-service-outcome',
        label: 'Implement the outcome',
        description: 'Finalise the biometric verification results.',
        immediate: { ghostWorkerRate: -0.05, baseOverheads: -3, youthTension: 5 },
        factionImpact: {},
      },
    ],
  },
  {
    id: 'capital-flight-warning',
    title: 'Business Confidence Warning',
    body: 'The Lagos Chamber of Commerce has published a red-flag report. Three multinationals have quietly frozen expansion plans. The business climate survey shows Lagos slipping behind Abuja and Port Harcourt on investment attractiveness.',
    severity: 'high',
    category: 'economy',
    isRecurring: true,
    cooldownWeeks: 16,
    triggerCondition: (state) => state.stats.corruptionPressure >= 70,
    choices: [
      {
        id: 'anti-corruption-audit',
        label: 'Commission Anti-Corruption Audit',
        description: 'Corruption -8, Political Capital -10. Business Community +8, Godfathers -8.',
        immediate: { corruptionPressure: -8, politicalCapital: -10 },
        factionImpact: { businessCommunity: 8, partyGodfathers: -8 },
      },
      {
        id: 'dispute-report',
        label: 'Dispute the Report',
        description: 'IGR -0.8bn. Business Community -8, Civil Society -5.',
        immediate: { igr: -0.8 },
        factionImpact: { businessCommunity: -8, civilSocietyMedia: -5 },
      },
      {
        id: 'ignore-warning',
        label: 'Ignore It',
        description: 'IGR -1.5bn, Corruption +3. Business Community -12.',
        immediate: { igr: -1.5, corruptionPressure: 3 },
        factionImpact: { businessCommunity: -12 },
      },
    ],
  },
]
