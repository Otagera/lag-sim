import type { EventCard } from '../../state/types'

// Events for named NPCs: NEO (Barr. Ngozi Eze-Okoro), Dayo (Comrade Dayo Afolabi), SMJ (Hon. Seun Majekodunmi)

export const removalResolutionEvent: EventCard = {
  id: 'removal-resolution-first-reading',
  title: 'Removal Resolution: First Reading',
  body: `The Lagos State House of Assembly has introduced a resolution for your removal from office. The Speaker has ruled it admissible. You have 72 hours to mount a defence.`,
  severity: 'critical',
  category: 'political',
  choices: [
    {
      id: 'fight',
      label: 'Fight It',
      description: 'Rally allies and challenge the resolution head-on. Costly but clean.',
      immediate: { politicalCapital: -30 },
      factionImpact: { partyGodfathers: 5, civilSocietyMedia: 8 },
    },
    {
      id: 'negotiate',
      label: 'Negotiate',
      description: 'Promise concessions to enough members to kill it quietly.',
      immediate: { politicalCapital: -20 },
      factionImpact: { partyGodfathers: 8, lgChairmen: -5 },
      delayed: {
        weekOffset: 4,
        delta: { politicalCapital: -15 },
        factionImpact: { civilSocietyMedia: -10 },
        eventText: 'The concessions promised during the removal vote come due.',
      },
    },
    {
      id: 'defy',
      label: 'Defy the Assembly',
      description: 'Refuse to engage. The Assembly proceeds to a full vote.',
      immediate: {},
      factionImpact: { partyGodfathers: -15, civilSocietyMedia: -10 },
    },
  ],
}

export const characterEvents: EventCard[] = [
  // --- NEO: Barr. Ngozi Eze-Okoro ---
  {
    id: 'neo-laha-inquiry',
    title: 'NEO: LAHA Committee Summons',
    body: `Barr. Ngozi Eze-Okoro has convinced a faction within the Lagos State House of Assembly to summon the Commissioner for Finance over procurement irregularities. The House Committee on Public Accounts is leading the inquiry. It is targeted, well-prepared, and timed for maximum media impact. NEO is making her move.`,
    severity: 'high',
    category: 'political',
    triggerCondition: (state) =>
      state.activeNPCs.neo.isActive && state.stats.corruptionPressure > 40,
    choices: [
      {
        id: 'attend-fully',
        label: 'Attend and Cooperate',
        description:
          'Send Commissioner with full documentation. Transparency +8, Political Capital -12. NEO loses leverage.',
        immediate: { publicTrust: 8, politicalCapital: -12 },
        factionImpact: { civilSocietyMedia: 5, lgChairmen: -3 },
      },
      {
        id: 'send-lawyer',
        label: 'Send Legal Team Only',
        description:
          'Manage the optics. Buys time. Civil Society -5. NEO will use this in the next press cycle.',
        immediate: { politicalCapital: 3 },
        factionImpact: { civilSocietyMedia: -5, businessCommunity: -3 },
        delayed: {
          weekOffset: 3,
          delta: { publicTrust: -6, corruptionPressure: 3 },
          factionImpact: { civilSocietyMedia: -8 },
          eventText: `NEO's follow-up press conference, armed with your legal team's stonewalling, has driven the corruption narrative for three straight days.`,
        },
      },
      {
        id: 'ignore-committee',
        label: 'Ignore the Summons',
        description:
          'Risk a localized constitutional crisis. Trust -10. NEO gets exactly what she wants: a confrontation.',
        immediate: { publicTrust: -10, corruptionPressure: 5 },
        factionImpact: { partyGodfathers: -10, civilSocietyMedia: -15 },
      },
    ],
  },
  {
    id: 'neo-procurement-hearing',
    title: 'NEO: Irregular Contract Surfaces',
    body: `A leaked memo shows a road contract was awarded without competitive bidding. Barr. Ngozi Eze-Okoro is holding a press conference in two hours. She has the memo. Your team is divided: some want full disclosure, others want to expose NEO's own record.`,
    severity: 'medium',
    category: 'political',
    triggerCondition: (state) => state.activeNPCs.neo.isActive,
    choices: [
      {
        id: 'full-disclosure',
        label: 'Full Disclosure',
        description:
          'Acknowledge the irregular award, announce procurement reform. Trust +6, Political Capital -20.',
        immediate: { publicTrust: 6, politicalCapital: -20, corruptionPressure: -3 },
        factionImpact: { civilSocietyMedia: 12, partyGodfathers: -6 },
      },
      {
        id: 'manage-narrative',
        label: 'Manage the Narrative',
        description:
          'Claim administrative error, commission internal review. Buys 4 weeks. Corruption +5.',
        immediate: { corruptionPressure: 5 },
        factionImpact: { civilSocietyMedia: -6 },
        delayed: {
          weekOffset: 4,
          delta: { publicTrust: -8, corruptionPressure: 4 },
          eventText: `The internal review has concluded with a whitewash. NEO has obtained the original memo and re-filed it with the Senate. The story is back.`,
        },
      },
      {
        id: 'counter-neo-record',
        label: "Expose NEO's Record",
        description:
          "Release documents on NEO's own tenure irregularities. Stops the immediate story. Relationship with NEO: -30. Risky escalation.",
        immediate: { politicalCapital: 5, corruptionPressure: 2 },
        factionImpact: { civilSocietyMedia: -10, businessCommunity: 3 },
        delayed: {
          weekOffset: 6,
          delta: { publicTrust: -5 },
          factionImpact: { civilSocietyMedia: -8 },
          eventText: `The mud-slinging with NEO has exhausted public patience. Both sides are now seen as corrupt. A third-party independent audit is being demanded.`,
        },
      },
    ],
  },
  {
    id: 'neo-ally-approach',
    title: 'NEO: Truce Offer',
    body: `Barr. Ngozi Eze-Okoro sends a private message through an intermediary. She is willing to go quiet on the procurement investigations if you agree not to contest the federal senatorial seat she is eyeing for 2031. A tacit political truce.`,
    severity: 'low',
    category: 'political',
    triggerCondition: (state) => state.activeNPCs.neo.isActive && state.week >= 60,
    choices: [
      {
        id: 'accept-truce',
        label: 'Accept the Truce',
        description:
          'NEO goes quiet for the rest of your term. Civil Society -4 (they see it as capitulation). Political Capital +10.',
        immediate: { politicalCapital: 10 },
        factionImpact: { civilSocietyMedia: -4 },
      },
      {
        id: 'decline-truce',
        label: 'Decline',
        description:
          "Stay the course. NEO remains active. Civil Society +6 (they respect the refusal). The fight continues.",
        immediate: {},
        factionImpact: { civilSocietyMedia: 6, partyGodfathers: 3 },
      },
    ],
  },
  {
    id: 'neo-dayo-coalition',
    title: 'NEO + Dayo: Opposition Coalition',
    body: `Barr. Ngozi Eze-Okoro and Comrade Dayo Afolabi have appeared together at a joint press conference. They are building a coalition — legal firepower meets street mobilisation. The hashtag #ChangeThisGovt is trending in Lagos.`,
    severity: 'critical',
    category: 'political',
    triggerCondition: (state) =>
      state.activeNPCs.neo.isActive &&
      state.activeNPCs.dayo.isActive &&
      state.activeNPCs.neo.relationship < -30 &&
      state.activeNPCs.dayo.relationship < -30,
    choices: [
      {
        id: 'engage-both',
        label: 'Engage Both Separately',
        description:
          'Spend Political Capital to open back-channel talks with each. Expensive but effective. -30 PC, splits the coalition.',
        immediate: { politicalCapital: -30 },
        factionImpact: { civilSocietyMedia: 5 },
      },
      {
        id: 'discredit-coalition',
        label: 'Expose the Contradictions',
        description:
          "NEO is establishment, Dayo is street. Their alliance is tactical. Publicly highlight their differences. Trust -5, breaks coalition in 6 weeks.",
        immediate: { publicTrust: -5 },
        factionImpact: { civilSocietyMedia: -8 },
        delayed: {
          weekOffset: 6,
          delta: { publicTrust: 4 },
          factionImpact: { civilSocietyMedia: 4 },
          eventText: `A public dispute between NEO and Dayo over protest tactics has fractured their coalition. The alliance is effectively over.`,
        },
      },
      {
        id: 'address-underlying',
        label: 'Address the Underlying Issues',
        description:
          'Hold a major anti-corruption press conference. Trust +10, Political Capital -25. The strongest long-term move.',
        immediate: { publicTrust: 10, politicalCapital: -25, corruptionPressure: -5 },
        factionImpact: { civilSocietyMedia: 15, partyGodfathers: -8 },
      },
    ],
  },

  // --- Dayo: Comrade Dayo Afolabi ---
  {
    id: 'dayo-rally-notice',
    title: 'Dayo: Rally at Ojota',
    body: `Comrade Dayo Afolabi has announced a "State of Emergency" rally at the Ojota interchange for Saturday. Expected turnout: 5,000–20,000 depending on weather and police posture. His demands: budget transparency, youth employment fund, end to #EndSARS impunity.`,
    severity: 'medium',
    category: 'political',
    triggerCondition: (state) => state.activeNPCs.dayo.isActive,
    choices: [
      {
        id: 'ignore-rally',
        label: 'Ignore It',
        description:
          'He will march. Trust -4. Youth Tension +6. If turnout exceeds 10k, it becomes a bigger story.',
        immediate: { youthTension: 6, publicTrust: -4 },
        factionImpact: { civilSocietyMedia: -6 },
      },
      {
        id: 'engage-dayo',
        label: 'Send Liaison to Meet Dayo',
        description:
          'Offer a technical briefing on youth employment numbers. Dayo may or may not attend. Youth Tension -3. Relationship with Dayo +15.',
        immediate: { youthTension: -3 },
        factionImpact: { civilSocietyMedia: 4, informalEconomy: 3 },
      },
      {
        id: 'heavy-police',
        label: 'Request Heavy Police Presence',
        description:
          'Deter the rally. Trust -8. Youth Tension +10. Security Index +2 (short term). Civil Society will film everything.',
        immediate: { securityIndex: 2, publicTrust: -8, youthTension: 10 },
        factionImpact: { civilSocietyMedia: -15, informalEconomy: -5 },
      },
    ],
  },
  {
    id: 'dayo-budget-briefing',
    title: 'Dayo: Invite to Budget Briefing',
    body: `Your Chief of Staff suggests inviting Comrade Dayo Afolabi to a closed budget briefing. Show him the real numbers. The theory: if he understands the constraints, he moderates. The risk: he uses the information against you.`,
    severity: 'low',
    category: 'political',
    triggerCondition: (state) =>
      state.activeNPCs.dayo.isActive && !state.activeNPCs.dayo.hasBeenInvited,
    choices: [
      {
        id: 'invite-dayo',
        label: 'Extend the Invitation',
        description:
          'He comes. Sees the numbers. Goes quiet for 3 weeks. Then returns angrier — at the system, not just you.',
        immediate: {},
        factionImpact: { civilSocietyMedia: 3 },
        followUpEventId: 'dayo-returns-angrier',
      },
      {
        id: 'no-invitation',
        label: 'Do Not Invite',
        description:
          'He stays outside. Status quo. Dayo continues his campaigns with incomplete information.',
        immediate: {},
        factionImpact: {},
      },
    ],
  },
  {
    id: 'dayo-returns-angrier',
    title: 'Dayo Returns — More Resolved',
    body: `Three weeks after the budget briefing, Comrade Dayo Afolabi holds his biggest rally yet. But something has shifted. He is no longer attacking you personally — he is attacking the system. "Our Governor is not evil," he said, "but this machine is." It's more dangerous than personal attacks.`,
    severity: 'high',
    category: 'political',
    choices: [
      {
        id: 'acknowledge-system',
        label: 'Publicly Acknowledge Structural Problems',
        description:
          'Bold move. Trust +8, Political Capital -15, Civil Society +12. Godfathers will see this as a declaration of war.',
        immediate: { publicTrust: 8, politicalCapital: -15 },
        factionImpact: { civilSocietyMedia: 12, partyGodfathers: -10, informalEconomy: 5 },
      },
      {
        id: 'stay-quiet',
        label: 'Stay Quiet, Let It Pass',
        description:
          'The narrative shifts without your input. Youth Tension +5. Trust -3. Dayo builds momentum.',
        immediate: { youthTension: 5, publicTrust: -3 },
        factionImpact: { civilSocietyMedia: -5 },
      },
    ],
  },
  {
    id: 'dayo-electoral-momentum',
    title: 'Dayo: Real Electoral Traction',
    body: `A poll shows Comrade Dayo Afolabi at 22% in a hypothetical election — above the "nuisance threshold" and rising fast. He has registered a political party. Youth voters aged 18–35 are registering in record numbers in Alimosho, Mushin, and Agege. This is no longer a protest movement.`,
    severity: 'critical',
    category: 'political',
    triggerCondition: (state) =>
      state.stats.youthTension > 65 &&
      state.activeNPCs.dayo.isActive &&
      (state.activeNPCs.dayo.activeWeek ?? 0) > 0 &&
      state.week - (state.activeNPCs.dayo.activeWeek ?? 0) > 12,
    choices: [
      {
        id: 'address-youth-economy',
        label: 'Launch Youth Employment Initiative',
        description:
          'Announce a ₦10bn youth employment fund. Trust +6, Youth Tension -10, Cash -10. Dayo loses traction.',
        immediate: { publicTrust: 6, youthTension: -10, cashReserve: -10 },
        factionImpact: { informalEconomy: 8, civilSocietyMedia: 6 },
      },
      {
        id: 'dismiss-dayo',
        label: "Dismiss Dayo's Movement",
        description:
          'Call it "political opportunism." Backfires badly if youth turn-out is high. Trust -8, Youth Tension +8.',
        immediate: { publicTrust: -8, youthTension: 8 },
        factionImpact: { civilSocietyMedia: -12, informalEconomy: -8 },
      },
      {
        id: 'co-opt-agenda',
        label: 'Adopt Key Dayo Demands',
        description:
          'Steal the policy agenda. Political Capital -20, Trust +5. Dayo cries foul but loses narrative control.',
        immediate: { publicTrust: 5, politicalCapital: -20 },
        factionImpact: { civilSocietyMedia: 5, informalEconomy: 4, partyGodfathers: -5 },
      },
    ],
  },

  // --- SMJ: Hon. Seun Majekodunmi ---
  {
    id: 'smj-budget-delay',
    title: 'SMJ: Capital Project Stall',
    body: `The Surulere drainage project has mysteriously stalled. Contractor says there is a problem with the site survey approval — a single form that seems to be lost in LASBCA. Your investigator reports that Hon. Seun Majekodunmi's aide was seen at the LASBCA office the day before the form disappeared.`,
    severity: 'medium',
    category: 'political',
    triggerCondition: (state) => state.activeNPCs.smj.isActive,
    choices: [
      {
        id: 'investigate-smj',
        label: 'Open a Formal Investigation',
        description:
          'You will find it leads back to him. Political Capital -10. SMJ becomes open opposition.',
        immediate: { politicalCapital: -10 },
        factionImpact: { partyGodfathers: -5, businessCommunity: 3 },
        delayed: {
          weekOffset: 3,
          delta: { publicTrust: 5 },
          factionImpact: { civilSocietyMedia: 8 },
          eventText: `The investigation has traced the stalled approval to a Majekodunmi aide. The finding is now public. SMJ has called it a "witch hunt."`,
        },
      },
      {
        id: 'absorb-delay',
        label: 'Absorb the Delay, Say Nothing',
        description:
          "Get the form re-issued. Move on. SMJ remains in the shadows. Infrastructure -2 (delayed project).",
        immediate: { infrastructureScore: -2 },
        factionImpact: {},
      },
    ],
  },
  {
    id: 'smj-leaked-memo',
    title: 'SMJ: Internal Memo Leaked',
    body: `A memo from your Chief of Staff — describing a political strategy to marginalise the Godfathers' allies — has appeared on three opposition blogs simultaneously. The signature coordination points to Hon. Seun Majekodunmi. His mole is inside Government House.`,
    severity: 'high',
    category: 'political',
    triggerCondition: (state) => state.activeNPCs.smj.isActive && state.week >= 50,
    choices: [
      {
        id: 'deny-memo',
        label: 'Deny Authenticity',
        description:
          "Call it fabricated. Trust -6. If it's verified, Trust -18 and Political Capital -20.",
        immediate: { publicTrust: -6 },
        factionImpact: { civilSocietyMedia: -8 },
      },
      {
        id: 'dismiss-aide',
        label: 'Dismiss the Suspected Aide',
        description:
          'Swift action. Leak stops. Trust +2. SMJ claims you fired an innocent person. Security tightened.',
        immediate: { publicTrust: 2, securityIndex: 3 },
        factionImpact: { partyGodfathers: 3 },
      },
      {
        id: 'confront-smj-publicly',
        label: 'Publicly Confront SMJ',
        description:
          'Name him at a press conference. Bold. Trust +5. SMJ goes fully hostile. He will back your primary challenger.',
        immediate: { publicTrust: 5 },
        factionImpact: { partyGodfathers: -8, civilSocietyMedia: 8, businessCommunity: -3 },
      },
    ],
  },
  {
    id: 'smj-primary-declaration',
    title: 'SMJ: Primary Challenge Declared',
    body: `Hon. Seun Majekodunmi has registered to contest the governorship primary against you. He is running on a platform of "restoring party discipline." With Fashemu's backing fractured, he is the vehicle for disgruntled godfathers. This is the direct confrontation your team feared.`,
    severity: 'critical',
    category: 'political',
    triggerCondition: (state) =>
      state.activeNPCs.smj.isActive &&
      state.factions.partyGodfathers < 35 &&
      state.week >= 150,
    choices: [
      {
        id: 'grassroots-mobilisation',
        label: 'Mobilise Party Grassroots',
        description:
          'Spend Political Capital to activate ward delegates. -35 PC. Your base votes you through.',
        immediate: { politicalCapital: -35 },
        factionImpact: { informalEconomy: 5, lgChairmen: 8, partyGodfathers: 5 },
      },
      {
        id: 'federal-ally-intervention',
        label: 'Call in Federal Allies',
        description:
          'Ask Abuja to signal support. Federal Relationship -5 (a favour spent). SMJ is squeezed out.',
        immediate: {},
        factionImpact: { federalGovt: -5, partyGodfathers: 10 },
      },
      {
        id: 'smj-negotiation',
        label: 'Negotiate with SMJ',
        description:
          'Offer him a cabinet role to stand down. Political Capital +5 (no fight), but he becomes a liability inside government.',
        immediate: { politicalCapital: 5, corruptionPressure: 3 },
        factionImpact: { partyGodfathers: 6 },
      },
    ],
  },
  removalResolutionEvent,
]
