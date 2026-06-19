import type { EventCard, GameState } from '../../state/types'
import { findNPCSlot } from '../npcs'

function journalistSlot(state: GameState) {
  return findNPCSlot(state, 'journalist')
}
function youthSlot(state: GameState) {
  return findNPCSlot(state, 'youth-organiser')
}
function insiderSlot(state: GameState) {
  return findNPCSlot(state, 'insider')
}

// Stage 1 of the 3-stage impeachment arc — queued by checkGameOver when partyGodfathers < 10
export const removalResolutionEvent: EventCard = {
  id: 'removal-resolution-reading',
  title: 'Removal Resolution: First Reading',
  body: `The Lagos State House of Assembly has introduced a resolution for your removal from office. The Speaker has ruled it admissible. You have 72 hours to mount a defence.`,
  severity: 'critical',
  category: 'political',
  choices: [
    {
      id: 'fight',
      label: 'Fight It',
      description: 'Challenge the resolution head-on. Sends the matter to a House committee. Costly but survivable.',
      immediate: { politicalCapital: -20 },
      factionImpact: { partyGodfathers: 3, civilSocietyMedia: 5 },
      followUpEventId: 'removal-resolution-committee',
    },
    {
      id: 'negotiate',
      label: 'Negotiate',
      description: 'Promise concessions to enough members to kill it before committee. Political capital and cash — but no further escalation this arc.',
      immediate: { politicalCapital: -10, cashReserve: -5 },
      factionImpact: { partyGodfathers: 10, lgChairmen: -5 },
      delayed: {
        weekOffset: 4,
        delta: { politicalCapital: -10 },
        factionImpact: { civilSocietyMedia: -8 },
        eventText: 'The concessions promised during the removal vote have come due. Assembly members are collecting.',
      },
    },
    {
      id: 'defy',
      label: 'Defy the Assembly',
      description: 'Refuse to engage. The Assembly proceeds directly to a full floor vote. This path ends your administration.',
      immediate: {},
      factionImpact: { partyGodfathers: -15, civilSocietyMedia: -10 },
    },
  ],
}

// Stage 2 — queued via followUpEventId from the "Fight It" choice
export const removalResolutionCommitteeEvent: EventCard = {
  id: 'removal-resolution-committee',
  title: 'Removal Resolution: Committee Stage',
  body: `The House Impeachment Committee has convened in Ikeja. Three commissioners have been summoned. Financial records from the past two years are on the table. The committee chair is allied with a godfather faction. This is the real fight.`,
  severity: 'critical',
  category: 'political',
  choices: [
    {
      id: 'full-disclosure',
      label: 'Full Disclosure',
      description: 'Release all requested records publicly. Civil Society rallies to your defence. Corruption pressure falls. The committee motion dies in committee.',
      immediate: { corruptionPressure: -5, politicalCapital: -15 },
      factionImpact: { civilSocietyMedia: 10, partyGodfathers: -5 },
    },
    {
      id: 'stonewall',
      label: 'Stonewall',
      description: 'Delay, obfuscate, and drag it out. Buys time but sends the matter to the floor.',
      immediate: { politicalCapital: -5 },
      factionImpact: { civilSocietyMedia: -12 },
      followUpEventId: 'removal-resolution-floor-vote',
    },
    {
      id: 'bribe-chair',
      label: 'Neutralise the Committee Chair',
      description: 'A private arrangement. Expensive and dirty. The motion dies without ever reaching the floor.',
      immediate: { cashReserve: -8, corruptionPressure: 5 },
      factionImpact: { partyGodfathers: 5, civilSocietyMedia: -5 },
    },
  ],
}

// Stage 3 — queued via followUpEventId from the "Stonewall" choice
export const removalResolutionFloorVoteEvent: EventCard = {
  id: 'removal-resolution-floor-vote',
  title: 'Removal Resolution: Floor Vote',
  body: `The full House of Assembly convenes at midnight. Forty members are needed to remove you. The whipping operation has been running for days. Your fate in the next two hours will define Lagos political history.`,
  severity: 'critical',
  category: 'political',
  choices: [
    {
      id: 'mobilise-allies',
      label: 'Mobilise Every Ally',
      description: 'Spend everything — political capital, cash, favours. If your faction scores are strong enough, you survive.',
      immediate: { politicalCapital: -30 },
      factionImpact: { lgChairmen: 5, partyGodfathers: 5 },
    },
    {
      id: 'accept-outcome',
      label: 'Accept the Outcome',
      description: 'Concede with dignity. Your term ends here.',
      immediate: {},
      factionImpact: {},
      setFlags: { 'conceded-to-assembly': true },
    },
  ],
}

export const characterEvents: EventCard[] = [
  // Impeachment arc stage 2 and 3 — must be in ALL_EVENTS so followUpEventId lookup works
  removalResolutionCommitteeEvent,
  removalResolutionFloorVoteEvent,
  // --- Journalist archetype events ---
  {
    id: 'neo-laha-inquiry',
    title: 'Journalist: LAHA Committee Summons',
    body: `Your investigative journalist opponent has convinced a faction within the Lagos State House of Assembly to summon the Commissioner for Finance over procurement irregularities. The House Committee on Public Accounts is leading the inquiry. It is targeted, well-prepared, and timed for maximum media impact.`,
    severity: 'high',
    category: 'political',
    triggerCondition: (state) =>
      (journalistSlot(state)?.isActive ?? false) && state.stats.corruptionPressure > 40,
    choices: [
      {
        id: 'attend-fully',
        label: 'Attend and Cooperate',
        description:
          'Send Commissioner with full documentation. Transparency +8, Political Capital -12.',
        immediate: { publicTrust: 8, politicalCapital: -12 },
        factionImpact: { civilSocietyMedia: 5, lgChairmen: -3 },
        npcImpact: { journalist: 15 },
      },
      {
        id: 'send-lawyer',
        label: 'Send Legal Team Only',
        description: 'Manage the optics. Buys time. Civil Society -5.',
        immediate: { politicalCapital: 3 },
        factionImpact: { civilSocietyMedia: -5, businessCommunity: -3 },
        npcImpact: { journalist: -8 },
        delayed: {
          weekOffset: 3,
          delta: { publicTrust: -6, corruptionPressure: 3 },
          factionImpact: { civilSocietyMedia: -8 },
          eventText: `The journalist's follow-up press conference, armed with your legal team's stonewalling, has driven the corruption narrative for three straight days.`,
        },
      },
      {
        id: 'ignore-committee',
        label: 'Ignore the Summons',
        description: 'Risk a localized constitutional crisis. Trust -10.',
        immediate: { publicTrust: -10, corruptionPressure: 5 },
        factionImpact: { partyGodfathers: -10, civilSocietyMedia: -15 },
        npcImpact: { journalist: -20 },
      },
    ],
  },
  {
    id: 'neo-procurement-hearing',
    title: 'Journalist: Irregular Contract Surfaces',
    body: `A leaked memo shows a road contract was awarded without competitive bidding. Your investigative journalist opponent is holding a press conference in two hours. They have the memo. Your team is divided: some want full disclosure, others want to expose their record.`,
    severity: 'medium',
    category: 'political',
    triggerCondition: (state) => journalistSlot(state)?.isActive ?? false,
    choices: [
      {
        id: 'full-disclosure',
        label: 'Full Disclosure',
        description: 'Acknowledge the irregular award, announce procurement reform. Trust +6, PC -20.',
        immediate: { publicTrust: 6, politicalCapital: -20, corruptionPressure: -3 },
        factionImpact: { civilSocietyMedia: 12, partyGodfathers: -6 },
        npcImpact: { journalist: 12 },
      },
      {
        id: 'manage-narrative',
        label: 'Manage the Narrative',
        description: 'Claim administrative error, commission internal review. Buys 4 weeks. Corruption +5.',
        immediate: { corruptionPressure: 5 },
        factionImpact: { civilSocietyMedia: -6 },
        npcImpact: { journalist: -8 },
        delayed: {
          weekOffset: 4,
          delta: { publicTrust: -8, corruptionPressure: 4 },
          eventText: `The internal review concluded with a whitewash. The journalist has obtained the original memo and re-filed it with the Senate. The story is back.`,
        },
      },
      {
        id: 'counter-neo-record',
        label: 'Expose Their Record',
        description: 'Release documents on their own past irregularities. Stops the immediate story. Risky escalation.',
        immediate: { politicalCapital: 5, corruptionPressure: 2 },
        factionImpact: { civilSocietyMedia: -10, businessCommunity: 3 },
        npcImpact: { journalist: -25 },
        delayed: {
          weekOffset: 6,
          delta: { publicTrust: -5 },
          factionImpact: { civilSocietyMedia: -8 },
          eventText: `The mud-slinging has exhausted public patience. Both sides are now seen as corrupt. An independent audit is being demanded.`,
        },
      },
    ],
  },
  {
    id: 'neo-ally-approach',
    title: 'Journalist: Truce Offer',
    body: `Your investigative journalist opponent sends a private message through an intermediary. They are willing to go quiet on the procurement investigations if you agree not to contest the federal senatorial seat they are eyeing for 2031. A tacit political truce.`,
    severity: 'low',
    category: 'political',
    triggerCondition: (state) =>
      (journalistSlot(state)?.isActive ?? false) && state.week >= 60,
    choices: [
      {
        id: 'accept-truce',
        label: 'Accept the Truce',
        description: 'They go quiet for the rest of your term. Civil Society -4. Political Capital +10.',
        immediate: { politicalCapital: 10 },
        factionImpact: { civilSocietyMedia: -4 },
        npcImpact: { journalist: 20 },
      },
      {
        id: 'decline-truce',
        label: 'Decline',
        description: 'Stay the course. Civil Society +6 (they respect the refusal). The fight continues.',
        immediate: {},
        factionImpact: { civilSocietyMedia: 6, partyGodfathers: 3 },
        npcImpact: { journalist: -5 },
      },
    ],
  },
  {
    id: 'neo-dayo-coalition',
    title: 'Opposition Coalition: Legal + Street',
    body: `Your investigative journalist and youth movement opponents have appeared together at a joint press conference. They are building a coalition — legal firepower meets street mobilisation. The hashtag #ChangeThisGovt is trending in Lagos.`,
    severity: 'critical',
    category: 'political',
    triggerCondition: (state) => {
      const j = journalistSlot(state)
      const y = youthSlot(state)
      return (
        (j?.isActive ?? false) &&
        (y?.isActive ?? false) &&
        (j?.relationship ?? 0) < -30 &&
        (y?.relationship ?? 0) < -30
      )
    },
    choices: [
      {
        id: 'engage-both',
        label: 'Engage Both Separately',
        description: 'Spend Political Capital to open back-channel talks with each. -30 PC, splits the coalition.',
        immediate: { politicalCapital: -30 },
        factionImpact: { civilSocietyMedia: 5 },
        npcImpact: { journalist: 10, 'youth-organiser': 10 },
      },
      {
        id: 'discredit-coalition',
        label: 'Expose the Contradictions',
        description: 'Legal-establishment vs street. Publicly highlight their differences. Trust -5, breaks coalition in 6 weeks.',
        immediate: { publicTrust: -5 },
        factionImpact: { civilSocietyMedia: -8 },
        delayed: {
          weekOffset: 6,
          delta: { publicTrust: 4 },
          factionImpact: { civilSocietyMedia: 4 },
          eventText: `A public dispute over protest tactics has fractured the opposition coalition. The alliance is effectively over.`,
        },
      },
      {
        id: 'address-underlying',
        label: 'Address the Underlying Issues',
        description: 'Hold a major anti-corruption press conference. Trust +10, Political Capital -25.',
        immediate: { publicTrust: 10, politicalCapital: -25, corruptionPressure: -5 },
        factionImpact: { civilSocietyMedia: 15, partyGodfathers: -8 },
        npcImpact: { journalist: 15, 'youth-organiser': 15 },
      },
    ],
  },

  // --- Youth Organiser archetype events ---
  {
    id: 'dayo-rally-notice',
    title: 'Organiser: Rally at Ojota',
    body: `Your youth movement opponent has announced a "State of Emergency" rally at the Ojota interchange for Saturday. Expected turnout: 5,000–20,000. Their demands: budget transparency, youth employment fund, end to #EndSARS impunity.`,
    severity: 'medium',
    category: 'political',
    triggerCondition: (state) => youthSlot(state)?.isActive ?? false,
    choices: [
      {
        id: 'ignore-rally',
        label: 'Ignore It',
        description: 'They march. Trust -4. Youth Tension +6.',
        immediate: { youthTension: 6, publicTrust: -4 },
        factionImpact: { civilSocietyMedia: -6 },
        npcImpact: { 'youth-organiser': -8 },
      },
      {
        id: 'engage-dayo',
        label: 'Send Liaison to Meet Them',
        description: 'Offer a technical briefing on youth employment numbers. Youth Tension -3. Relationship +15.',
        immediate: { youthTension: -3 },
        factionImpact: { civilSocietyMedia: 4, informalEconomy: 3 },
        npcImpact: { 'youth-organiser': 15 },
      },
      {
        id: 'heavy-police',
        label: 'Request Heavy Police Presence',
        description: 'Deter the rally. Trust -8. Youth Tension +10. Civil Society will film everything.',
        immediate: { securityIndex: 2, publicTrust: -8, youthTension: 10 },
        factionImpact: { civilSocietyMedia: -15, informalEconomy: -5 },
        npcImpact: { 'youth-organiser': -18 },
      },
    ],
  },
  {
    id: 'dayo-budget-briefing',
    title: 'Organiser: Invite to Budget Briefing',
    body: `Your Chief of Staff suggests inviting the youth movement leader to a closed budget briefing. Show them the real numbers. The theory: if they understand the constraints, they moderate. The risk: they use the information against you.`,
    severity: 'low',
    category: 'political',
    triggerCondition: (state) =>
      (youthSlot(state)?.isActive ?? false) && !(youthSlot(state)?.hasBeenInvited ?? false),
    choices: [
      {
        id: 'invite-dayo',
        label: 'Extend the Invitation',
        description: 'They come. See the numbers. Go quiet for 3 weeks. Then return angrier — at the system, not just you.',
        immediate: {},
        factionImpact: { civilSocietyMedia: 3 },
        npcImpact: { 'youth-organiser': 10 },
        followUpEventId: 'dayo-returns-angrier',
      },
      {
        id: 'no-invitation',
        label: 'Do Not Invite',
        description: 'They stay outside. Status quo.',
        immediate: {},
        factionImpact: {},
      },
    ],
  },
  {
    id: 'dayo-returns-angrier',
    title: 'Organiser Returns — More Resolved',
    body: `Three weeks after the budget briefing, the youth movement leader holds their biggest rally yet. But something has shifted. They are no longer attacking you personally — they are attacking the system. "Our Governor is not evil," they said, "but this machine is." It's more dangerous than personal attacks.`,
    severity: 'high',
    category: 'political',
    choices: [
      {
        id: 'acknowledge-system',
        label: 'Publicly Acknowledge Structural Problems',
        description: 'Bold move. Trust +8, Political Capital -15, Civil Society +12. Godfathers will see this as a declaration of war.',
        immediate: { publicTrust: 8, politicalCapital: -15 },
        factionImpact: { civilSocietyMedia: 12, partyGodfathers: -10, informalEconomy: 5 },
        npcImpact: { 'youth-organiser': 12 },
      },
      {
        id: 'stay-quiet',
        label: 'Stay Quiet, Let It Pass',
        description: 'The narrative shifts without your input. Youth Tension +5. Trust -3.',
        immediate: { youthTension: 5, publicTrust: -3 },
        factionImpact: { civilSocietyMedia: -5 },
        npcImpact: { 'youth-organiser': -5 },
      },
    ],
  },
  {
    id: 'dayo-electoral-momentum',
    title: 'Organiser: Real Electoral Traction',
    body: `A poll shows the youth movement leader at 22% in a hypothetical election — above the "nuisance threshold" and rising fast. They have registered a political party. Youth voters aged 18–35 are registering in record numbers in Alimosho, Mushin, and Agege.`,
    severity: 'critical',
    category: 'political',
    triggerCondition: (state) => {
      const y = youthSlot(state)
      return (
        state.stats.youthTension > 65 &&
        (y?.isActive ?? false) &&
        (y?.activeWeek ?? 0) > 0 &&
        state.week - (y?.activeWeek ?? 0) > 12
      )
    },
    choices: [
      {
        id: 'address-youth-economy',
        label: 'Launch Youth Employment Initiative',
        description: 'Announce a ₦10bn youth employment fund. Trust +6, Youth Tension -10, Cash -10.',
        immediate: { publicTrust: 6, youthTension: -10, cashReserve: -10 },
        factionImpact: { informalEconomy: 8, civilSocietyMedia: 6 },
        npcImpact: { 'youth-organiser': 15 },
      },
      {
        id: 'dismiss-dayo',
        label: 'Dismiss the Movement',
        description: 'Call it "political opportunism." Trust -8, Youth Tension +8.',
        immediate: { publicTrust: -8, youthTension: 8 },
        factionImpact: { civilSocietyMedia: -12, informalEconomy: -8 },
        npcImpact: { 'youth-organiser': -15 },
      },
      {
        id: 'co-opt-agenda',
        label: 'Adopt Key Demands',
        description: 'Steal the policy agenda. Political Capital -20, Trust +5.',
        immediate: { publicTrust: 5, politicalCapital: -20 },
        factionImpact: { civilSocietyMedia: 5, informalEconomy: 4, partyGodfathers: -5 },
        npcImpact: { 'youth-organiser': 10 },
      },
    ],
  },

  // --- Insider archetype events ---
  {
    id: 'smj-budget-delay',
    title: 'Insider: Capital Project Stall',
    body: `The Surulere drainage project has mysteriously stalled. Contractor says there is a problem with the site survey approval — a single form lost in LASBCA. Your investigator reports that the party insider's aide was seen at the LASBCA office the day before the form disappeared.`,
    severity: 'medium',
    category: 'political',
    isRecurring: true,
    cooldownWeeks: 12,
    maxTotalFirings: 3,
    triggerCondition: (state) => insiderSlot(state)?.isActive ?? false,
    choices: [
      {
        id: 'investigate-smj',
        label: 'Open a Formal Investigation',
        description: 'You will find it leads back to them. Political Capital -10. Insider becomes open opposition.',
        immediate: { politicalCapital: -10 },
        factionImpact: { partyGodfathers: -5, businessCommunity: 3 },
        npcImpact: { insider: -15 },
        delayed: {
          weekOffset: 3,
          delta: { publicTrust: 5 },
          factionImpact: { civilSocietyMedia: 8 },
          eventText: `The investigation traced the stalled approval to the insider's aide. The finding is now public. They have called it a "witch hunt."`,
        },
      },
      {
        id: 'absorb-delay',
        label: 'Absorb the Delay, Say Nothing',
        description: "Get the form re-issued. Move on. Insider remains in the shadows. Infrastructure -2.",
        immediate: { infrastructureScore: -2 },
        factionImpact: {},
        npcImpact: { insider: 5 },
      },
    ],
  },
  {
    id: 'smj-leaked-memo',
    title: 'Insider: Internal Memo Leaked',
    body: `A memo from your Chief of Staff — describing a political strategy to marginalise the Godfathers' allies — has appeared on three opposition blogs simultaneously. The signature coordination points to the party insider. Their mole is inside Government House.`,
    severity: 'high',
    category: 'political',
    triggerCondition: (state) =>
      (insiderSlot(state)?.isActive ?? false) && state.week >= 50,
    choices: [
      {
        id: 'deny-memo',
        label: 'Deny Authenticity',
        description: "Call it fabricated. Trust -6. If it's verified, Trust -18 and Political Capital -20.",
        immediate: { publicTrust: -6 },
        factionImpact: { civilSocietyMedia: -8 },
        npcImpact: { insider: -5 },
      },
      {
        id: 'dismiss-aide',
        label: 'Dismiss the Suspected Aide',
        description: 'Swift action. Leak stops. Trust +2. Insider claims you fired an innocent person.',
        immediate: { publicTrust: 2, securityIndex: 3 },
        factionImpact: { partyGodfathers: 3 },
        npcImpact: { insider: -8 },
      },
      {
        id: 'confront-smj-publicly',
        label: 'Publicly Confront the Insider',
        description: 'Name them at a press conference. Bold. Trust +5. They go fully hostile.',
        immediate: { publicTrust: 5 },
        factionImpact: { partyGodfathers: -8, civilSocietyMedia: 8, businessCommunity: -3 },
        npcImpact: { insider: -20 },
      },
    ],
  },
  {
    id: 'smj-primary-declaration',
    title: 'Insider: Primary Challenge Declared',
    body: `The party insider has registered to contest the governorship primary against you. Running on "restoring party discipline." With fractured godfather support, they are the vehicle for disgruntled machine politicians. This is the direct confrontation your team feared.`,
    severity: 'critical',
    category: 'political',
    triggerCondition: (state) =>
      (insiderSlot(state)?.isActive ?? false) &&
      state.factions.partyGodfathers < 35 &&
      state.week >= 150,
    choices: [
      {
        id: 'grassroots-mobilisation',
        label: 'Mobilise Party Grassroots',
        description: 'Spend Political Capital to activate ward delegates. -35 PC. Your base votes you through.',
        immediate: { politicalCapital: -35 },
        factionImpact: { informalEconomy: 5, lgChairmen: 8, partyGodfathers: 5 },
        npcImpact: { insider: -10 },
      },
      {
        id: 'federal-ally-intervention',
        label: 'Call in Federal Allies',
        description: 'Ask Abuja to signal support. Federal Relationship -5. Insider is squeezed out.',
        immediate: {},
        factionImpact: { federalGovt: -5, partyGodfathers: 10 },
        npcImpact: { insider: -5 },
      },
      {
        id: 'smj-negotiation',
        label: 'Negotiate with the Insider',
        description: 'Offer them a cabinet role to stand down. Political Capital +5, but they become an internal liability.',
        immediate: { politicalCapital: 5, corruptionPressure: 3 },
        factionImpact: { partyGodfathers: 6 },
        npcImpact: { insider: 20 },
      },
    ],
  },
  removalResolutionEvent,

  // --- Deputy Consequence Events ---
  // Fires when politician deputy resentment reaches 60
  {
    id: 'deputy-consequence-politician',
    title: 'Deputy Obiora Makes Her Move',
    body: `Word from the Party Secretariat: Hon. Amaka Obiora has been meeting with LGA Chairmen without your knowledge. She is testing the waters for a primary challenge. Your Chief of Staff says this must be handled before it goes public — quietly or not.`,
    severity: 'high',
    category: 'political',
    triggerCondition: (state) =>
      state.deputy?.key === 'politician' && (state.deputy.resentment >= 60),
    choices: [
      {
        id: 'neutralise-obiora',
        label: 'Bring Her Back Inside',
        description: 'Give her a meaningful assignment and political concessions. Political Capital -25. She de-escalates.',
        immediate: { politicalCapital: -25 },
        factionImpact: { partyGodfathers: -5 },
        resentmentDelta: -40,
      },
      {
        id: 'confront-obiora',
        label: 'Confront Her Directly',
        description: 'A private confrontation. She backs down — for now. Trust -5.',
        immediate: { politicalCapital: -15, publicTrust: -5 },
        factionImpact: { lgChairmen: -5 },
        resentmentDelta: -30,
      },
      {
        id: 'ignore-obiora',
        label: 'Ignore It',
        description: 'Hope it blows over. Godfather network interprets her moves as your weakness.',
        immediate: {},
        factionImpact: { partyGodfathers: -10, lgChairmen: -8 },
      },
    ],
  },

  // Fires at week 130 when loyalist deputy is in office
  {
    id: 'deputy-consequence-loyalist',
    title: 'The Adeyemi-Shaw File',
    body: `A federal investigator has made quiet inquiries about Dr. Korede Adeyemi-Shaw's accounts from 2021–2023 — before he managed your campaign. The sums involved are significant. He insists the funds were "party logistics." He has asked to brief you privately before any official response.`,
    severity: 'high',
    category: 'political',
    triggerCondition: (state) => state.deputy?.key === 'loyalist' && state.week >= 130,
    choices: [
      {
        id: 'cover-adeyemi-shaw',
        label: 'Cover For Him',
        description: 'Use your office to quietly bury the inquiry. Corruption +12, Trust -8. He owes you everything.',
        immediate: { corruptionPressure: 12, publicTrust: -8 },
        factionImpact: { civilSocietyMedia: -10 },
        corruptionTrigger: true,
      },
      {
        id: 'sacrifice-adeyemi-shaw',
        label: 'Cut Him Loose',
        description: "Distance yourself publicly. Trust -15, Political Capital -20. You'll govern alone.",
        immediate: { publicTrust: -15, politicalCapital: -20 },
        factionImpact: { civilSocietyMedia: 5 },
      },
      {
        id: 'investigate-adeyemi-shaw',
        label: 'Order a Full Inquiry',
        description: 'Face it head-on. Corruption -5, Trust +5 — but it will dominate the news for 8 weeks.',
        immediate: { corruptionPressure: -5, publicTrust: 5, politicalCapital: -25 },
        factionImpact: { civilSocietyMedia: 12, partyGodfathers: -8 },
        delayed: {
          weekOffset: 8,
          delta: { publicTrust: 4 },
          factionImpact: { civilSocietyMedia: 5 },
          eventText: 'The Adeyemi-Shaw inquiry concluded with a caution. The cloud has lifted, but the story defined two months of your administration.',
        },
      },
    ],
  },

  // Fires when reformer deputy has seen 3+ godfather compliance events
  {
    id: 'deputy-consequence-reformer',
    title: "Deputy Fashola-Eze's Ultimatum",
    body: `Dr. Kanyinsola Fashola-Eze has called a press conference. She will announce in 72 hours whether she remains Deputy Governor. Her statement cites "incompatible governance values." Three godfather concessions in a term is her line. You cannot stop the press conference — only decide what comes next.`,
    severity: 'critical',
    category: 'political',
    triggerCondition: (state) =>
      state.deputy?.key === 'reformer' && state.godfatherComplianceCount >= 3,
    choices: [
      {
        id: 'accept-reformer-resignation',
        label: 'Accept Her Resignation',
        description: 'Civil Society -20, Trust -12. She leaves with her integrity — and her scrutiny — intact.',
        immediate: { publicTrust: -12, corruptionPressure: -5 },
        factionImpact: { civilSocietyMedia: -20, businessCommunity: 5, partyGodfathers: 8 },
      },
      {
        id: 'beg-reformer-to-stay',
        label: 'Beg Her to Stay',
        description: 'Political Capital -30. She stays — but only if you make a public anti-corruption commitment.',
        immediate: { politicalCapital: -30, corruptionPressure: -8 },
        factionImpact: { civilSocietyMedia: 10, partyGodfathers: -5 },
        resentmentDelta: -50,
      },
    ],
  },
]
