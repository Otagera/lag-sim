import type { GodfatherAsk } from '../state/types'

export type GodfatherAskTemplate = {
  id: string
  type: GodfatherAsk['type']
  text: string
  askDescription: string
  onAccept: GodfatherAsk['onAccept']
  onRefuse: GodfatherAsk['onRefuse']
}

// The 4 ordered asks from Chief B.O.A. Fashemu — fires in sequence
export const fashemuAsks: GodfatherAskTemplate[] = [
  {
    id: 'fashemu-ask-1-contract',
    type: 'contract',
    text: `"Governor. I know we are still settling in, so I will be brief. Fashemu Engineering Limited has done significant work in this state. My team should be on the shortlist for the Agege-Ogba road tender. I am sure you will find the quality unimpeachable."`,
    askDescription: 'Put Fashemu Engineering Ltd on the Agege-Ogba road tender shortlist',
    onAccept: {
      corruptionPressure: 4,
      expenditure: 0.2,
      factionImpact: { partyGodfathers: 8, civilSocietyMedia: -5 },
    },
    onRefuse: {
      factionImpact: { partyGodfathers: -8, businessCommunity: 4 },
    },
  },
  {
    id: 'fashemu-ask-2-appointment',
    type: 'appointment',
    text: `"Commissioner for Works. I have given this serious thought. Engr. Sola Adesoji — he managed the Ojota interchange — is the right man. He understands infrastructure at scale and he understands how Lagos works."`,
    askDescription: "Appoint Engr. Sola Adesoji (Fashemu's candidate) as Commissioner for Works",
    onAccept: {
      corruptionPressure: 5,
      factionImpact: { partyGodfathers: 10, civilSocietyMedia: -8 },
    },
    onRefuse: {
      politicalCapital: 8,
      factionImpact: { partyGodfathers: -10, businessCommunity: 5 },
    },
  },
  {
    id: 'fashemu-ask-3-suppress',
    type: 'suppress',
    text: `"There is a LASBCA investigation. Ibeju-Lekki. A friend's development — setback issues, drainage. The building is sound and the approval was processed correctly. This investigation is the work of people with other agendas. A word from you would resolve it cleanly."`,
    askDescription: 'Shut down the LASBCA investigation into the Ibeju-Lekki property development',
    onAccept: {
      corruptionPressure: 8,
      factionImpact: { partyGodfathers: 7, civilSocietyMedia: -12, businessCommunity: -4 },
    },
    onRefuse: {
      publicTrust: 6,
      factionImpact: { partyGodfathers: -12, civilSocietyMedia: 8 },
    },
  },
  {
    id: 'fashemu-ask-4-money',
    type: 'money',
    text: `"The LGA elections are coming. Ground-level work — delegates, transport, logistics — all of this has a cost. I need ₦500 million from the Governor's discretionary account. Think of it as an investment in the party's local government alignment."`,
    askDescription: "Release ₦500m from discretionary funds for LGA election 'logistics'",
    onAccept: {
      cashReserve: -0.5,
      corruptionPressure: 5,
      factionImpact: { partyGodfathers: 8, federalGovt: 3, civilSocietyMedia: -6 },
    },
    onRefuse: {
      politicalCapital: 10,
      factionImpact: { partyGodfathers: -14, federalGovt: -4, civilSocietyMedia: 5 },
    },
  },
]

// Secondary pool — minor asks between the main Fashemu arc
export const generalGodfatherPool: GodfatherAskTemplate[] = [
  // --- contract ---
  {
    id: 'road-tender-agege',
    type: 'contract',
    text: `"My construction company should be on the Agege-Ogba road tender shortlist. They have done work for the state before. You know the quality."`,
    askDescription: 'Include his company on the tender shortlist for Agege-Ogba road',
    onAccept: {
      corruptionPressure: 3,
      expenditure: 0.2,
      factionImpact: { partyGodfathers: 5, civilSocietyMedia: -4 },
    },
    onRefuse: {
      factionImpact: { partyGodfathers: -6, businessCommunity: 3 },
    },
  },
  {
    id: 'school-contract-epe',
    type: 'contract',
    text: `"My cousin's firm is bidding for the Epe school construction project. They are qualified. I want to make sure the evaluation committee knows their name."`,
    askDescription: "Ensure his cousin's firm is favoured for the Epe school contract",
    onAccept: {
      corruptionPressure: 4,
      expenditure: 0.15,
      publicTrust: -2,
      factionImpact: { partyGodfathers: 4, informalEconomy: 3 },
    },
    onRefuse: {
      factionImpact: { partyGodfathers: -5, civilSocietyMedia: 3 },
    },
  },
  {
    id: 'hospital-supplies',
    type: 'contract',
    text: `"The General Hospital supply contract is being renewed next month. My distributor has been servicing Lagos hospitals for fifteen years. I expect continuity."`,
    askDescription:
      'Renew the hospital supply contract with his distributor without competitive bidding',
    onAccept: {
      corruptionPressure: 3,
      expenditure: 0.25,
      factionImpact: { partyGodfathers: 4, businessCommunity: -3, civilSocietyMedia: -5 },
    },
    onRefuse: {
      publicTrust: 3,
      factionImpact: { partyGodfathers: -6, businessCommunity: 2 },
    },
  },
  // --- appointment ---
  {
    id: 'commissioner-environment',
    type: 'appointment',
    text: `"Commissioner for Environment — I have a candidate. She is capable. She understands how things work in this state."`,
    askDescription: 'Appoint his candidate as Commissioner for Environment',
    onAccept: {
      corruptionPressure: 2,
      factionImpact: { partyGodfathers: 6, civilSocietyMedia: -6 },
    },
    onRefuse: {
      politicalCapital: 5,
      factionImpact: { partyGodfathers: -7, civilSocietyMedia: 4 },
    },
  },
  {
    id: 'lasbca-board-seat',
    type: 'appointment',
    text: `"There is a vacancy on the LASBCA board. My ally, Chief Bamidele, is the right man. He will ensure building approvals are handled properly."`,
    askDescription: 'Appoint his ally to the LASBCA board',
    onAccept: {
      corruptionPressure: 5,
      factionImpact: { partyGodfathers: 5, businessCommunity: 2, civilSocietyMedia: -8 },
    },
    onRefuse: {
      factionImpact: { partyGodfathers: -6, civilSocietyMedia: 3 },
    },
  },
  {
    id: 'lga-caretaker-ikorodu',
    type: 'appointment',
    text: `"Ikorodu LGA needs a caretaker chairman. I have sent you a name. He is loyal. That is what we need right now."`,
    askDescription: 'Appoint his nominee as caretaker chairman for Ikorodu LGA',
    onAccept: {
      corruptionPressure: 2,
      factionImpact: { partyGodfathers: 5, lgChairmen: -3 },
    },
    onRefuse: {
      factionImpact: { partyGodfathers: -5, lgChairmen: 4 },
    },
  },
  // --- suppress ---
  {
    id: 'ibeju-lekki-property',
    type: 'suppress',
    text: `"There is an investigation into a friend's property development in Ibeju-Lekki. Something about drainage and setback violations. It should go quiet."`,
    askDescription: 'Shut down the investigation into the Ibeju-Lekki property development',
    onAccept: {
      corruptionPressure: 6,
      factionImpact: { partyGodfathers: 6, civilSocietyMedia: -10, businessCommunity: -3 },
    },
    onRefuse: {
      publicTrust: 5,
      factionImpact: { partyGodfathers: -8, civilSocietyMedia: 5 },
    },
  },
  {
    id: 'tax-audit-suppress',
    type: 'suppress',
    text: `"A business associate is being audited by the Lagos Internal Revenue Service. The audit is aggressive and unnecessary. A word from you would resolve it."`,
    askDescription: 'Intervene to halt the LIRS audit on his associate',
    onAccept: {
      corruptionPressure: 4,
      igr: -0.15,
      factionImpact: { partyGodfathers: 5, businessCommunity: 3, civilSocietyMedia: -5 },
    },
    onRefuse: {
      igr: 0.1,
      factionImpact: { partyGodfathers: -5, businessCommunity: -2 },
    },
  },
  {
    id: 'building-approval-bury',
    type: 'suppress',
    text: `"A LASBCA investigator is asking questions about a building approval in Lekki Phase 1. The building is standing. The approval was standard. This attention is unnecessary."`,
    askDescription: 'Bury the LASBCA inquiry into the Lekki building approval',
    onAccept: {
      corruptionPressure: 7,
      factionImpact: { partyGodfathers: 7, civilSocietyMedia: -12, businessCommunity: -2 },
    },
    onRefuse: {
      publicTrust: 4,
      factionImpact: { partyGodfathers: -7, civilSocietyMedia: 6 },
    },
  },
  // --- money ---
  {
    id: 'party-congress-funding',
    type: 'money',
    text: `"The party congress needs ₦500m. Logistics, venue, delegates — these things cost money. I expect the Governor's office to support the process."`,
    askDescription: 'Release ₦500m from state funds for party congress logistics',
    onAccept: {
      cashReserve: -0.5,
      corruptionPressure: 3,
      factionImpact: { partyGodfathers: 6, federalGovt: 2, civilSocietyMedia: -4 },
    },
    onRefuse: {
      politicalCapital: 5,
      factionImpact: { partyGodfathers: -6, federalGovt: -3, civilSocietyMedia: 3 },
    },
  },
  {
    id: 'campaign-war-chest',
    type: 'money',
    text: `"The election is eighteen months away but preparations must begin now. My faction needs ₦800m for early groundwork. You will benefit when the time comes."`,
    askDescription: 'Provide ₦800m from state funds for his campaign faction',
    onAccept: {
      cashReserve: -0.8,
      corruptionPressure: 4,
      factionImpact: { partyGodfathers: 7, informalEconomy: 2, civilSocietyMedia: -6 },
    },
    onRefuse: {
      factionImpact: { partyGodfathers: -8, informalEconomy: -2 },
      politicalCapital: 8,
    },
  },
  {
    id: 'eid-gifts',
    type: 'money',
    text: `"Eid is coming. Stakeholders expect the Governor to show appreciation. ₦200m should cover it — traditional gifts, community leaders, the usual."`,
    askDescription: 'Release ₦200m for traditional Eid gifts to stakeholders',
    onAccept: {
      cashReserve: -0.2,
      publicTrust: 3,
      factionImpact: { partyGodfathers: 4, informalEconomy: 5, civilSocietyMedia: -2 },
    },
    onRefuse: {
      publicTrust: -3,
      factionImpact: { partyGodfathers: -4, informalEconomy: -3 },
    },
  },
]
