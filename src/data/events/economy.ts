import type { EventCard } from '../../state/types'

export const economyEvents: EventCard[] = [
  {
    id: 'taxEvasionScandal',
    title: 'LIRS Audit Exposes ₦14bn Tax Evasion Ring',
    body: `A Lagos Internal Revenue Service audit has uncovered systematic PAYE evasion across 23 telecoms and FMCG companies operating in Ikeja and VI. Estimated unpaid liability: ₦14.3bn over three years. The FIRS says it's a state matter. The companies say the assessments are wrong. SERAP has filed a freedom-of-information request naming your office.`,
    severity: 'medium',
    category: 'economy',
    week: 4,
    triggerCondition: (state) => state.factions.businessCommunity > 60,
    choices: [
      {
        id: 'investigateThoroughly',
        label: 'Pursue Full Recovery',
        description:
          'Back the LIRS assessments. Instruct the AG to file civil recovery suits. Trust +10, Business Community -10, Civil Society +5.',
        immediate: { publicTrust: +10, politicalCapital: -15 },
        factionImpact: { businessCommunity: -10, civilSocietyMedia: +5 },
        politicalCapitalCost: 15,
      },
      {
        id: 'downplayIssue',
        label: 'Negotiate Quiet Settlement',
        description:
          'Allow the companies to settle at a reduced figure without public proceedings. Business Community +5 but it will leak.',
        immediate: { publicTrust: -5, politicalCapital: +10 },
        factionImpact: { businessCommunity: +5, civilSocietyMedia: -5 },
        politicalCapitalCost: 10,
      },
    ],
  },
  {
    id: 'inflationSpike',
    title: 'Staples Crisis: Mile 12 Prices up 60%',
    body: `Tomatoes are ₦4,000 per basket at Mile 12. Onions are ₦6,500. A 50kg bag of rice — basic household staples — has jumped 60% in three weeks following the naira slide and a northern supply chain breakdown. Market women in Ojota and Oyingbo are reporting empty stalls. The CBN says it's a supply-side problem. Your traders say it's your problem.`,
    severity: 'high',
    category: 'economy',
    week: 5,
    triggerCondition: (state) => state.stats.igr < 10,
    choices: [
      {
        id: 'implementPriceControls',
        label: 'Emergency Price Cap',
        description:
          'Gazette maximum prices for key staples through LASCOPA. Traders will resist; enforcement is difficult. Trust +10, Business Community -5.',
        immediate: { publicTrust: +10 },
        factionImpact: { civilSocietyMedia: +5, businessCommunity: -5 },
        politicalCapitalCost: 20,
      },
      {
        id: 'promoteEconomicGrowth',
        label: 'Fund Emergency Supply Routes',
        description:
          'Contract LASWA and LAMATA to open alternative supply lanes from Epe and Badagry farms directly to markets. Slower, but sustainable. IGR +5 medium-term.',
        immediate: { igr: +5 },
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
          eventText: `The strike hit on a Monday morning. Oshodi motor park is empty. Mile 12 market is closed. The agbero leadership you arrested has been replaced by younger, hungrier men who are not interested in negotiating.`,
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
          eventText: `The contractors' association sent a single photo to your office: an idle grader on the Ikorodu road, rusting in the rain. 'We wait,' the caption read. Three other projects have stopped. The political cost of restarting them will be higher than the cost of paying on time would have been.`,
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
        description:
          'Commit ₦2bn and 10 weeks to a full crackdown. Expect business community resistance.',
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
  {
    id: 'forex-bureau-crackdown',
    title: 'CBN Orders BDC Operators Off Allen Avenue',
    body: `A CBN circular effective from end-of-month requires all Bureau de Change operators to cease trading on Allen Avenue, Marina, and adjoining informal forex clusters and relocate to designated Authorised Dealer Financial Centres. Lagos hosts 38% of Nigeria's registered BDCs. The Allen Avenue cluster alone processes an estimated ₦2.2bn in daily transactions. The Abuja directive did not consult LASG. Your Finance Commissioner wants to respond. The BDC Association has requested a meeting with your office within 48 hours.`,
    severity: 'medium',
    category: 'economy',
    week: 25,
    choices: [
      {
        id: 'support-cbn-assist-transition',
        label: 'Support CBN, Offer LASG Transition Assistance',
        description:
          'Align with Abuja. Federal Relationship +8, Informal Economy -8, Business -5, Trust +3.',
        immediate: { publicTrust: 3 },
        factionImpact: { federalGovt: 8, informalEconomy: -8, businessCommunity: -5 },
      },
      {
        id: 'lobby-cbn-lagos-extension',
        label: 'Lobby CBN for Lagos-Specific Extension',
        description:
          'Formally request a 90-day transition extension for Lagos. Federal Relationship -3, Informal Economy +5, Business +4. Delayed resolution.',
        immediate: {},
        factionImpact: { federalGovt: -3, informalEconomy: 5, businessCommunity: 4 },
        delayed: {
          weekOffset: 6,
          delta: { publicTrust: 3 },
          eventText: `CBN granted a 60-day extension for Lagos BDC operators under a pilot compliance scheme. Allen Avenue is quieter but not empty.`,
        },
      },
      {
        id: 'publicly-oppose-directive',
        label: 'Publicly Oppose the Directive',
        description:
          'Challenge CBN in a press statement. Federal Relationship -10, Informal Economy +8, Civil Society -5.',
        immediate: { publicTrust: 4 },
        factionImpact: { federalGovt: -10, informalEconomy: 8, civilSocietyMedia: -5 },
      },
    ],
  },
  {
    id: 'digital-economy-tax-bill',
    title: 'NASS Bill Would Redirect ₦6bn Annual Fintech Tax from Lagos',
    body: `A bill before the National Assembly would require all fintech companies operating out of Lagos to pay 3% of gross turnover directly to the Federal Government — bypassing state revenue. Lagos hosts Paystack, Flutterwave, PiggyVest, Kuda, and over 400 registered fintechs. LIRS estimates the sector contributes ₦18bn annually in PAYE and business taxes from Lagos. If the bill passes, the state faces a projected ₦6bn annual shortfall. Fintech CEOs have privately approached your office. Business community is mobilising.`,
    severity: 'high',
    category: 'economy',
    week: 30,
    choices: [
      {
        id: 'lobby-nass-formal-brief',
        label: 'Lobby NASS with Formal Lagos State Legal Brief',
        description:
          'Commission AG to file a constitutional objection. Federal Relationship -5, Business +10. Political Capital -20. Delayed result.',
        immediate: {},
        factionImpact: { federalGovt: -5, businessCommunity: 10 },
        politicalCapitalCost: 20,
        delayed: {
          weekOffset: 10,
          delta: { publicTrust: 4, igr: 0.3 },
          eventText: `The Lagos State brief has resulted in a Senate Committee review. The 3% turnover clause has been moderated to a shared formula. Lagos retains most of the LIRS base.`,
        },
      },
      {
        id: 'host-fintech-public-coalition',
        label: 'Host Fintech Summit — Build Public Coalition',
        description:
          'Make this a public fight with Lagos and fintech sector against the bill. Trust +6, Business +8, Civil Society +5, Federal Relationship -5.',
        immediate: { publicTrust: 6 },
        factionImpact: { businessCommunity: 8, civilSocietyMedia: 5, federalGovt: -5 },
      },
      {
        id: 'stay-out-federal-legislation',
        label: 'Stay Out — Federal Legislative Matter',
        description: 'Correct jurisdictional response. Business Community -8, Trust -4.',
        immediate: { publicTrust: -4 },
        factionImpact: { businessCommunity: -8 },
      },
    ],
  },
  {
    id: 'lagos-bond-rating-review',
    title: "Moody's Places Lagos State Bond on Negative Watch",
    body: `Moody's Investors Service has placed Lagos State's Ba3 bond rating on negative watch. The review document is explicit: contractor backlog must fall below ₦40bn within 12 months or the rating will be downgraded to B1. Lagos State currently has ₦22.4bn in domestic bonds outstanding — held by pension fund administrators, insurance companies, and domestic banks. A downgrade would raise future borrowing costs by an estimated 280 basis points and trigger covenant reviews on existing loans. Your Finance Commissioner says four institutional bondholders have called this week.`,
    severity: 'high',
    category: 'economy',
    triggerCondition: (state) => state.stats.contractorBacklog > 40,
    choices: [
      {
        id: 'emergency-contractor-payment',
        label: 'Emergency Contractor Payment from Reserve',
        description:
          'Release ₦1bn to highest-priority backlog contractors. Cash -1, Infrastructure +5, Business +8, Trust +4.',
        immediate: { cashReserve: -1, infrastructureScore: 5, publicTrust: 4 },
        factionImpact: { businessCommunity: 8 },
      },
      {
        id: 'negotiate-payment-plan',
        label: "Negotiate Payment Plan, Engage Moody's",
        description:
          'Structured creditor engagement. Political Capital -15, Business +5. Delayed 12 weeks.',
        immediate: {},
        factionImpact: { businessCommunity: 5 },
        politicalCapitalCost: 15,
        delayed: {
          weekOffset: 12,
          delta: { publicTrust: 3, igr: 0.2 },
          eventText: `Moody's has maintained the negative watch status but acknowledged the payment plan. No immediate downgrade. Bondholders are cautiously satisfied.`,
        },
      },
      {
        id: 'dispute-rating-publicly',
        label: 'Dispute the Rating Methodology Publicly',
        description:
          "Challenge Moody's in a press statement. Business -8, Federal Relationship -3, Trust -5.",
        immediate: { publicTrust: -5 },
        factionImpact: { businessCommunity: -8, federalGovt: -3 },
      },
    ],
  },
  {
    id: 'contractor-fee-cartel',
    title: 'AG Report Leaked: 6 Firms Capture 71% of Infrastructure Contracts',
    body: `An internal Auditor-General report, marked confidential, has been leaked to Premium Times. Six firms — operating through 14 subsidiary company names — captured 71% of all LASG infrastructure contracts over the past three years. Unit costs on asphalt road construction run 34% above the Lagos State public works benchmark. Four of the six parent firms share a registered address in Ikoyi and are connected to a procurement cluster that Chief Fashemu's network has historically sponsored. The AG wants to refer the matter to the ICPC. Your Works Commissioner says any action now will freeze all active contracts.`,
    severity: 'high',
    category: 'economy',
    week: 40,
    choices: [
      {
        id: 'refer-icpc-new-procurement',
        label: 'Refer to ICPC, Open Competitive Procurement',
        description:
          'Corruption Pressure -8, Civil Society +12, Business -12, Godfathers -10. Some contracts stall for 8 weeks.',
        immediate: { corruptionPressure: -8 },
        factionImpact: { civilSocietyMedia: 12, businessCommunity: -12, partyGodfathers: -10 },
        delayed: {
          weekOffset: 8,
          delta: { infrastructureScore: 4, publicTrust: 5 },
          eventText: `Three of the six cartel firms have suspended operations pending ICPC investigation. New competitive procurement is underway. Average contract unit costs are 18% lower in the first open tender round.`,
        },
      },
      {
        id: 'internal-review-renegotiate',
        label: 'Internal Review Only, Renegotiate Rates Quietly',
        description: 'Corruption Pressure +5, Business -3, Trust -4. Leak will resurface.',
        immediate: { corruptionPressure: 5, publicTrust: -4 },
        factionImpact: { businessCommunity: -3 },
      },
      {
        id: 'defend-procurement-publicly',
        label: 'Defend Procurement Process Publicly',
        description:
          'Deny the report findings. Corruption Pressure +8, Civil Society -12, Trust -10.',
        immediate: { corruptionPressure: 8, publicTrust: -10 },
        factionImpact: { civilSocietyMedia: -12 },
      },
    ],
  },
]
