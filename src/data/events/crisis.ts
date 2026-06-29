import type { EventCard } from '../../state/types'

export const crisisEvents: EventCard[] = [
  {
    id: 'powerOutage',
    title: 'EKEDC Billing Dispute Triggers Wholesale Disconnection',
    body: `EKEDC has disconnected the Isolo and Mushin distribution feeders over an unpaid government electricity bill — ₦3.1bn accumulated across state secondary schools, health centres, and LGA offices. 48 hours without power. LASUTH's surgical ward is running on generator fuel that ran out this morning. NERC says the disconnection is lawful. The Medical Director of LASUTH says it is criminal. Both are right.`,
    severity: 'high',
    category: 'crisis',
    week: 3,
    triggerCondition: (state) => state.stats.infrastructureScore < 40,
    choices: [
      {
        id: 'investInGrid',
        label: 'Clear the Debt, Restore Power',
        description:
          'Pay ₦3.1bn arrears immediately from contingency reserves. Reconnection within 6 hours. Infrastructure +10, Business Community +3.',
        immediate: { cashReserve: -3.1, infrastructureScore: +10 },
        factionImpact: { federalGovt: +5, businessCommunity: +3 },
        politicalCapitalCost: 20,
      },
      {
        id: 'doNothing',
        label: 'Dispute the Bill, Stall',
        description:
          'Instruct the AG to challenge the EKEDC assessment. Hospitals stay dark while lawyers file. Trust -10, Security -5.',
        immediate: { publicTrust: -10, securityIndex: -5 },
        factionImpact: { civilSocietyMedia: -5, lgChairmen: -3 },
      },
    ],
  },
  {
    id: 'makoko-demolition-order',
    title: 'Makoko Demolition Order',
    body: `A federal court has upheld an old demolition order for Makoko waterfront settlement. An estimated 85,000 residents. International NGOs are already preparing statements. Your party wants the land for a real estate play.`,
    severity: 'critical',
    category: 'crisis',
    choices: [
      {
        id: 'execute-order',
        label: 'Execute the Order',
        description:
          'Godfather +12, Business +8. Informal Economy -20, Civil Society -25, Trust -15. International backlash.',
        immediate: { publicTrust: -15 },
        factionImpact: {
          partyGodfathers: 12,
          businessCommunity: 8,
          informalEconomy: -20,
          civilSocietyMedia: -25,
        },
        constituencyImpact: { lagosMainland: -30 },
        setFlags: { 'makoko-demolished': true },
      },
      {
        id: 'suspend-resettlement',
        label: 'Suspend & Resettle',
        description:
          'Buys 12 weeks. Costs Political Capital. Godfather -10. Civil Society +12, Trust +8. Resettlement will cost ₦12bn.',
        immediate: { publicTrust: 8 },
        factionImpact: { partyGodfathers: -10, civilSocietyMedia: 12 },
        politicalCapitalCost: 30,
        delayed: {
          weekOffset: 12,
          delta: { cashReserve: -12 },
          eventText: `Chief Fashemu's building contractor was seen measuring plots in Makoko yesterday. The demolition order you gave is now a bill of sale — and the water on the lagoon hasn't even receded yet.`,
          followUpEventId: 'makoko-resettlement-choice',
        },
      },
      {
        id: 'defy-court',
        label: 'Defy in Court',
        description:
          'Trust +15, Civil Society +18. Godfather -18, Federal -10, Party -15. High risk, high reward.',
        immediate: { publicTrust: 15 },
        factionImpact: { civilSocietyMedia: 18, partyGodfathers: -18, federalGovt: -10 },
      },
    ],
  },
  {
    id: 'building-collapse-lekki',
    title: 'Building Collapse — Lekki',
    body: `A 7-storey building under construction in Lekki has collapsed. 23 confirmed dead, 40 missing. The building had a Lagos State Building Control Agency (LASBCA) approval stamp. Someone was paid to approve it.`,
    severity: 'critical',
    category: 'crisis',
    choices: [
      {
        id: 'lasbca-audit',
        label: 'Immediate LASBCA Audit',
        description:
          'Suspend approvals. Trust +10, Civil Society +12. Business -15 (projects stalled). Audit reveals 40+ compromised buildings — bigger crisis ahead.',
        immediate: { publicTrust: 10 },
        factionImpact: { businessCommunity: -15, civilSocietyMedia: 12 },
        delayed: {
          weekOffset: 6,
          delta: { publicTrust: -8, infrastructureScore: -5 },
          factionImpact: { civilSocietyMedia: -5 },
          eventText: `The LASBCA audit landed on your desk at midnight. Forty-three buildings — including two on the same Lekki corridor as the collapse. Each one is a political grenade you now have to defuse one by one.`,
        },
      },
      {
        id: 'scapegoat-official',
        label: 'Scapegoat One Official',
        description:
          'Trust +3 short-term. Civil Society -8, Corruption Pressure +5. Investigation shows it goes higher (wk 8).',
        immediate: { publicTrust: 3, corruptionPressure: 5 },
        factionImpact: { civilSocietyMedia: -8 },
        delayed: {
          weekOffset: 8,
          delta: { publicTrust: -10, corruptionPressure: 5 },
          factionImpact: { civilSocietyMedia: -10 },
          eventText: `The scapegoat held for exactly one press cycle. Then he started naming names. The Permanent Secretary's WhatsApp backup is now in a lawyer's safe. You don't know what else is in there.`,
        },
      },
      {
        id: 'public-inquiry',
        label: 'Full Public Inquiry',
        description:
          'Trust +8, Civil Society +15. Costs Political Capital. Godfather -10 (one of his is exposed). Takes 8 weeks.',
        immediate: { publicTrust: 8 },
        factionImpact: { civilSocietyMedia: 15, partyGodfathers: -10 },
        politicalCapitalCost: 20,
      },
    ],
  },
  {
    id: 'tanker-explosion-berger',
    title: 'Tanker Explosion — Lagos-Ibadan Expressway',
    body: `A fuel tanker has exploded at the Berger interchange. 14 dead, 30 vehicles destroyed. The road is closed. Federal expressway — technically FERMA's jurisdiction — but it is in your city and your people are dying.`,
    severity: 'critical',
    category: 'crisis',
    choices: [
      {
        id: 'deploy-state-emergency',
        label: 'Deploy State Emergency Response',
        description:
          'Act now. Trust +12, Civil Society +10. Federal -4 (jurisdictional overstep). Costs ₦800m emergency spend.',
        immediate: { publicTrust: 12, cashReserve: -0.8 },
        factionImpact: { civilSocietyMedia: 10, federalGovt: -4 },
      },
      {
        id: 'defer-to-ferma',
        label: 'Defer to FERMA',
        description:
          'Correct jurisdictional answer. Trust -8 (looks like passing the buck). Federal +4.',
        immediate: { publicTrust: -8 },
        factionImpact: { federalGovt: 4 },
      },
      {
        id: 'joint-press-conference',
        label: 'Joint Press Conference',
        description:
          'Share credit and blame with federal minister. Costs Political Capital. Trust +5, Federal +6, Civil Society +4.',
        immediate: { publicTrust: 5 },
        factionImpact: { federalGovt: 6, civilSocietyMedia: 4 },
        politicalCapitalCost: 20,
      },
    ],
  },
  {
    id: 'makoko-resettlement-choice',
    title: 'Makoko Resettlement — Implementation',
    body: `The ₦12bn resettlement plan for Makoko waterfront is due. 85,000 people need new homes. The land earmarked for resettlement is in the periphery — 30km from the city centre, with no road or power infrastructure. Party godfathers want the prime Makoko land for luxury development. The international community is watching.`,
    severity: 'critical',
    triggerCondition: (state) => state.resolvedEvents.includes('makoko-demolition-order'),
    category: 'crisis',
    choices: [
      {
        id: 'build-new-estate',
        label: 'Build New Housing Estate',
        description:
          'Construct a proper estate with roads, power, and water. InfrastructureScore +8, CashReserve -8, Trust +10, PublicTrust +5. Godfathers furious (they wanted the land).',
        immediate: { cashReserve: -8, infrastructureScore: 8, publicTrust: 5 },
        factionImpact: { partyGodfathers: -12, civilSocietyMedia: 15 },
        constituencyImpact: { lagosMainland: 20, ikorodu: 10 },
        delayed: {
          weekOffset: 16,
          delta: { igr: 0.4 },
          eventText: `The new estate on the mainland edge is finished. The families from Makoko call it 'exile' — but the market that has sprung up at its gate generates ₦400m a week in IGR. Everyone makes peace with the name.`,
        },
      },
      {
        id: 'cash-compensation',
        label: 'Cash Compensation',
        description:
          'Pay each family ₦1.5m cash. CashReserve -12, Trust +4. BusinessCommunity +8 (prime waterfront freed). Civil Society angry at inadequate compensation.',
        immediate: { cashReserve: -12, publicTrust: 4 },
        factionImpact: { businessCommunity: 8, partyGodfathers: 10, civilSocietyMedia: -12 },
        constituencyImpact: { lagosMainland: -5 },
      },
      {
        id: 'mixed-approach',
        label: 'Mixed Approach',
        description:
          'Build basic housing, provide partial cash. CashReserve -4, InfrastructureScore +4, PoliticalCapital -15. Everyone moderately unhappy.',
        immediate: { cashReserve: -4, infrastructureScore: 4, politicalCapital: -15 },
        factionImpact: {},
        constituencyImpact: { lagosMainland: 8, ikorodu: 5 },
        delayed: {
          weekOffset: 12,
          delta: { publicTrust: 4 },
          eventText: `The phased resettlement is messy, slow, and still displacing people one street at a time. No one is burning tyres yet. In Lagos, that counts as 'on track.'`,
        },
      },
    ],
  },
  {
    id: 'cholera-outbreak-ajegunle',
    title: 'Cholera Outbreak — Ajegunle and Badia East: 12 Dead',
    body: `Three hundred and forty confirmed cholera cases in ten days. Twelve deaths. Epicentre: Ajegunle Ward B and Badia East — both supplied from the Ijora water pumping station. LSWC has confirmed contamination at source. NCDC has declared a Public Health Emergency of National Concern. Three primary schools in Ajegunle are functioning as overflow treatment centres. NEMA has offered a joint response. International media have picked up the story. Ajegunle residents are blaming the new estate development that redirected a drainage channel last year.`,
    severity: 'critical',
    category: 'crisis',
    week: 25,
    choices: [
      {
        id: 'emergency-pumping-station-overhaul',
        label: 'Emergency Overhaul of Ijora Pumping Station',
        description: 'Dispatch LSWC engineers for immediate water source remediation. Trust +8. Fixed in 2 weeks.',
        immediate: { publicTrust: 8 },
        factionImpact: { civilSocietyMedia: 10, informalEconomy: 5 },
        constituencyImpact: { ajeromiIfelodun: 15 },
        delayed: {
          weekOffset: 2,
          delta: { infrastructureScore: 5, youthTension: -5 },
          eventText: `Ijora pumping station water quality has been certified safe by NAFDAC field tests. Cholera cases dropped to zero in the following 10 days. NCDC lifted the PHEIC designation.`,
        },
      },
      {
        id: 'joint-nema-federal',
        label: 'Accept NEMA / Federal Joint Response',
        description: 'Federal Relationship +8, Trust +4, Corruption Pressure -3. Response coordinated. Delayed.',
        immediate: { publicTrust: 4 },
        factionImpact: { federalGovt: 8, civilSocietyMedia: 6 },
        delayed: {
          weekOffset: 4,
          delta: { infrastructureScore: 4, youthTension: -4 },
          eventText: `The NEMA-LASG joint response team has closed the cholera hotspots in Ajegunle and Badia. Response time criticism remains — cases peaked before the federal team arrived.`,
        },
      },
      {
        id: 'lasg-containment-no-fed',
        label: 'LASG Containment — No Federal Involvement',
        description: 'Handle within state resources. Trust -5, Cash -1.5. Slower, no political debt to Abuja.',
        immediate: { cashReserve: -1.5, publicTrust: -5 },
        factionImpact: { civilSocietyMedia: -4 },
        delayed: {
          weekOffset: 6,
          delta: { infrastructureScore: 3 },
          eventText: `The Ajegunle outbreak was contained through state intervention alone. Delayed but contained. NCDC note: response timeline "inadequate for an outbreak of this severity."`,
        },
      },
    ],
  },
  {
    id: 'pipeline-explosion-isale-eko',
    title: 'NNPC Pipeline Fire — Ijora-Badia: 8 Dead, 200 Displaced',
    week: 25,
    body: `An NNPC-operated pipeline running beneath Ijora-Badia caught fire at 3:14am. The fire burned for six hours. Eight people are confirmed dead. Two hundred have been displaced from the Ijora 1 and Wilmer Street settlements. NNPC's own fire suppression team arrived from Warri — five hours after the Lagos Fire Brigade had already been on scene. Federal jurisdiction controls the pipeline; LASG controls the land above it. NNPC has offered ₦500,000 per household in ex-gratia. The affected residents' association is demanding ₦5m per family and state co-advocacy.`,
    severity: 'critical',
    category: 'crisis',
    choices: [
      {
        id: 'press-conference-demand-compensation',
        label: 'Hold Press Conference — Demand Federal Compensation',
        description: 'Publicly demand ₦5m per family and pipeline safety audit. Trust +10, Civil Society +12, Federal Relationship -8.',
        immediate: { publicTrust: 10 },
        factionImpact: { civilSocietyMedia: 12, federalGovt: -8, informalEconomy: 5 },
        constituencyImpact: { lagosIsland: 8, apapa: 5 },
      },
      {
        id: 'quiet-nnpc-coordination',
        label: 'Quietly Coordinate With NNPC — No Confrontation',
        description: 'Back-channel resolution. Federal Relationship +5, Trust -6, Civil Society -8.',
        immediate: { publicTrust: -6 },
        factionImpact: { federalGovt: 5, civilSocietyMedia: -8 },
      },
      {
        id: 'state-emergency-housing',
        label: 'Declare State Emergency Housing Fund for Displaced Families',
        description: 'LASG absorbs the displacement cost. Cash -1, Trust +8, Infrastructure +3.',
        immediate: { cashReserve: -1, publicTrust: 8, infrastructureScore: 3 },
        factionImpact: { civilSocietyMedia: 8, informalEconomy: 6 },
      },
    ],
  },
  {
    id: 'balogun-market-fire',
    title: 'Balogun Market Fire — 400 Shops, ₦8bn Trader Losses',
    body: `Fire broke out in Balogun Market at 11:40pm on Friday. By morning: 400 shops destroyed, estimated trader losses of ₦8.2bn. Lagos Fire Brigade reports that three of its trucks could not reach the blaze — access roads blocked by unauthorised structures that LASBCA permitted in 2022. LAWMA waste storage in the blocked alley contributed to the spread. The Balogun Market Traders Association is demanding ₦3bn in state compensation within 30 days. The Manufacturers Association says Balogun is Nigeria's largest textile market. The Governor's press team is fielding calls from Reuters.`,
    severity: 'high',
    category: 'crisis',
    week: 25,
    choices: [
      {
        id: 'emergency-trader-relief',
        label: 'Emergency Trader Relief — LASG Solidarity Fund',
        description: 'Immediate partial relief. Trust +6, Informal Economy +8, Civil Society +5.',
        immediate: { publicTrust: 6 },
        factionImpact: { informalEconomy: 8, civilSocietyMedia: 5 },
      },
      {
        id: 'enforce-market-access-roads',
        label: 'Commission LASBCA Market Access Road Enforcement',
        description: 'Clear all unauthorised structures from market access routes city-wide. Delayed, Infrastructure +5, Informal Economy -6.',
        immediate: {},
        factionImpact: { civilSocietyMedia: 6 },
        delayed: {
          weekOffset: 12,
          delta: { infrastructureScore: 5, publicTrust: 3 },
          eventText: `LASBCA has completed the market access road clearance exercise. 23 of Lagos's largest markets now have unobstructed LFB access routes for the first time in a decade.`,
        },
      },
      {
        id: 'reject-compensation-demand',
        label: 'Reject Compensation, Refer to Insurance',
        description: 'Legally defensible. Trust -8, Informal Economy -12, Civil Society -8.',
        immediate: { publicTrust: -8 },
        factionImpact: { informalEconomy: -12, civilSocietyMedia: -8 },
        constituencyImpact: { lagosIsland: -10 },
      },
    ],
  },
  {
    id: 'ikeja-kidnapping-ring',
    title: 'Ikeja–Lekki Kidnapping Wave — 9 Abductions in 3 Weeks',
    body: `Nine confirmed kidnappings in 21 days across the Ikeja GRA–Oregun–Lekki Phase 1 corridor. Three ransom payments made. Intelligence has identified a network operating out of Ikorodu Waterfront, using speedboats and a network of receiving houses on the Lagos–Ibadan Expressway. RRS says the network operates across state lines — IG must co-ordinate. The kidnapping of a school bus in Oregun has parents threatening to pull children from school. Three Ikeja GRA companies have sent internal memos flagging possible relocation of staff.`,
    severity: 'high',
    category: 'crisis',
    week: 40,
    choices: [
      {
        id: 'joint-security-operation',
        label: 'Joint State–Federal Security Operation',
        description: 'Coordinate RRS, Police, and DSS strike on Ikorodu network. Federal Relationship +8, Security +10, Trust +6.',
        immediate: { securityIndex: 10, publicTrust: 6 },
        factionImpact: { federalGovt: 8, businessCommunity: 8 },
      },
      {
        id: 'lasg-covert-intelligence',
        label: 'LASG Covert Intelligence Operation',
        description: 'State-only operation. Security +6, Cash -0.5, Trust +3. Slower to results.',
        immediate: { securityIndex: 6, publicTrust: 3, cashReserve: -0.5 },
        factionImpact: { businessCommunity: 5 },
        delayed: {
          weekOffset: 4,
          delta: { securityIndex: 4, publicTrust: 3 },
          eventText: `LASG intelligence services have disrupted the Ikorodu kidnapping network. Five suspects arrested, three safe houses closed. Kidnapping reports have dropped to zero in the corridor for 3 consecutive weeks.`,
        },
      },
      {
        id: 'public-appeal-reward',
        label: 'Public Appeal and ₦5m Reward',
        description: 'Community-led approach. Trust +4, Security +3, Civil Society +5, Business +6.',
        immediate: { publicTrust: 4, securityIndex: 3, cashReserve: -0.005 },
        factionImpact: { civilSocietyMedia: 5, businessCommunity: 6 },
      },
    ],
  },
  {
    id: 'island-tenement-fire',
    title: 'Idumota Tenement Fire — 6 Dead, 180 Displaced',
    week: 25,
    body: `A fire that started in a kerosene store swept through a four-storey tenement building at Oke-Balogun, Idumota, Lagos Island, at 4am. Six dead. 180 displaced. The building had no fire escape. LASBCA records listed it as residential with 14 occupants — actual count was 62. This is the third tenement fire in Lagos Island in 18 months. LASBCA tells your office: 70% of pre-1990 multi-family structures in Lagos Island and Mushin have never been formally inspected.`,
    severity: 'critical',
    category: 'crisis',
    choices: [
      {
        id: 'compulsory-inspection-all-pre90',
        label: 'Compulsory Inspection of All Pre-1990 Multi-Family Buildings',
        description: 'City-wide programme. Infrastructure +8, Trust +7, Civil Society +10. 12-week rollout.',
        immediate: { publicTrust: 7 },
        factionImpact: { civilSocietyMedia: 10, businessCommunity: -3 },
        delayed: {
          weekOffset: 12,
          delta: { infrastructureScore: 8, publicTrust: 4 },
          eventText: `The pre-1990 structural inspection programme has completed its first phase. 412 buildings assessed. 94 condemned. 220 issued mandatory remediation notices. LASBCA is now the most feared acronym in Lagos Island.`,
        },
      },
      {
        id: 'targeted-idumota-inspection',
        label: 'Targeted Inspection of Idumota LGA',
        description: 'Narrower scope. Infrastructure +4, Trust +4, Cash -0.3. Other LGAs uninspected.',
        immediate: { publicTrust: 4, cashReserve: -0.3, infrastructureScore: 4 },
        factionImpact: { civilSocietyMedia: 5 },
        constituencyImpact: { lagosIsland: 8 },
      },
      {
        id: 'statement-leave-to-lasbca',
        label: 'Statement of Condolence Only',
        description: "Leave enforcement to LASBCA's existing schedule. Trust -8, Civil Society -10.",
        immediate: { publicTrust: -8 },
        factionImpact: { civilSocietyMedia: -10 },
      },
    ],
  },
]
