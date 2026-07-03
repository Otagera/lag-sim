import type { EventCard } from '../../state/types'

// Six transition-period event cards — weeks 200–208 after the vote result.
// 3 for the re-elected winner, 3 for the defeated incumbent.
// Placed in ALL_EVENTS after finaleEvents so they trigger during the lame-duck window.

export const transitionEvents: EventCard[] = [
  // ── Win path ─────────────────────────────────────────────────────
  {
    id: 'election-result-victory',
    title: 'Re-Election Victory',
    body: `The results are in. The Independent National Electoral Commission has declared you the winner with {voteShare}% of the vote. The margin is clear — the people have returned you for a second term.

Your chief of staff hands you the data: the strongest turnout was in the constituencies where your projects delivered visible change. The campaign worked. The mandate is real.

But the inauguration is not until week 208. You have eight weeks of transition — time to plan the second term, reshuffle your cabinet, and prepare an inauguration speech that sets the tone for the next four years. The first task: who stays, who goes, and what message you send.`,
    severity: 'high',
    category: 'political',
    triggerCondition: (state) =>
      state.week >= 200 && state.reElected === true && !state.resolvedEvents.includes('election-result-victory'),
    choices: [
      {
        id: 'transition-continuity',
        label: 'Signal Continuity — Keep the Core Team',
        description: 'Your commissioners stay. Trust +4, Business +6. The message: steady hands, unfinished business.',
        immediate: { publicTrust: 4 },
        factionImpact: { businessCommunity: 6, civilSocietyMedia: 3 },
      },
      {
        id: 'transition-reshuffle',
        label: 'Announce a Reshuffle — Fresh Faces, New Energy',
        description: 'Replace 3 underperforming commissioners. Trust +6, Political Capital -12. Civil Society +8.',
        immediate: { publicTrust: 6, politicalCapital: -12 },
        factionImpact: { civilSocietyMedia: 8, partyGodfathers: -4 },
      },
      {
        id: 'transition-unity',
        label: 'Reach Across — Appoint from Former Opponents',
        description: 'Offer a cabinet post to a neutral figure. Trust +8, Godfathers -6, Political Capital -18.',
        immediate: { publicTrust: 8, politicalCapital: -18 },
        factionImpact: { partyGodfathers: -6, civilSocietyMedia: 10 },
      },
    ],
  },
  {
    id: 'transition-cabinet-planning',
    title: 'Transition: Cabinet Planning',
    body: `Your transition team has prepared the dossier on every commissioner and agency head. Some have performed; others have coasted. A second term is a chance to correct the personnel mistakes of the first.

The godfathers are already lobbying for their people. The civil service is watching for signals. Every appointment is a statement about who you govern for.`,
    severity: 'high',
    category: 'political',
    triggerCondition: (state) =>
      state.week >= 202 &&
      state.reElected === true &&
      state.resolvedEvents.includes('election-result-victory') &&
      !state.resolvedEvents.includes('transition-cabinet-planning'),
    choices: [
      {
        id: 'cabinet-merit',
        label: 'Merit-Based Appointments Only',
        description: 'Technocrats and proven performers. Infrastructure +4, Civil Society +10. Godfathers -8.',
        immediate: { infrastructureScore: 4 },
        factionImpact: { civilSocietyMedia: 10, partyGodfathers: -8, businessCommunity: 6 },
      },
      {
        id: 'cabinet-political',
        label: 'Reward Loyalists — Keep the Machine Happy',
        description: 'Godfathers +10, Political Capital +8. Trust -4. The party expects to be remembered.',
        immediate: { publicTrust: -4, politicalCapital: 8 },
        factionImpact: { partyGodfathers: 10, lgChairmen: 6 },
      },
      {
        id: 'cabinet-balanced',
        label: 'A Balanced Ticket — Competence + Coalition',
        description: 'Mix of technocrats and political appointees. Moderate gains across the board.',
        immediate: { publicTrust: 2, politicalCapital: 4 },
        factionImpact: { civilSocietyMedia: 5, partyGodfathers: 4, businessCommunity: 4 },
      },
    ],
  },
  {
    id: 'transition-inauguration-speech',
    title: 'Transition: Inauguration Address',
    body: `Your speechwriter has drafted three possible openings for the inauguration address. The nation will be watching — Lagos is the flagship state, and your second-term agenda sets the tone for every other governor.

This speech will be replayed for the next four years. What is the defining message of your second term?`,
    severity: 'high',
    category: 'political',
    triggerCondition: (state) =>
      state.week >= 204 &&
      state.reElected === true &&
      state.resolvedEvents.includes('transition-cabinet-planning') &&
      !state.resolvedEvents.includes('transition-inauguration-speech'),
    choices: [
      {
        id: 'speech-infrastructure',
        label: '"Finish What We Started" — Infrastructure as Legacy',
        description: 'Metro rail, roads, drainage. Infrastructure +6, Business +10. Trust +3.',
        immediate: { infrastructureScore: 6, publicTrust: 3 },
        factionImpact: { businessCommunity: 10, federalGovt: 4 },
      },
      {
        id: 'speech-reform',
        label: '"Clean House" — Reform & Accountability',
        description: 'Civil service reform, anti-corruption. Corruption -6, Civil Society +12. Godfathers -10.',
        immediate: { corruptionPressure: -6 },
        factionImpact: { civilSocietyMedia: 12, partyGodfathers: -10, informalEconomy: 5 },
      },
      {
        id: 'speech-inclusion',
        label: '"One Lagos" — Unity & Social Investment',
        description: 'Youth, women, the peripheries. Youth Tension -8, Trust +8, Informal Economy +8.',
        immediate: { publicTrust: 8, youthTension: -8 },
        factionImpact: { informalEconomy: 8, civilSocietyMedia: 6, partyGodfathers: -5 },
      },
    ],
  },

  // ── Loss path ────────────────────────────────────────────────────
  {
    id: 'election-result-defeat',
    title: 'Defeated at the Polls',
    body: `The results are in. You received {voteShare}% of the vote — not enough. The Independent National Electoral Commission has declared Senator Kunle Adebayo the winner.

Your chief of staff enters the room quietly. The phones have stopped ringing. The transition team is already packing files.

You have until week 208 to hand over. Eight weeks to prepare a transition briefing, settle your legacy, and deliver a farewell address that rises above the defeat. How you leave matters almost as much as how you governed.`,
    severity: 'critical',
    category: 'political',
    triggerCondition: (state) =>
      state.week >= 200 && state.reElected === false && !state.resolvedEvents.includes('election-result-defeat'),
    choices: [
      {
        id: 'defeat-dignified',
        label: 'A Dignified Handover — Full Cooperation',
        description: 'Offer a clean transition. Civil Society +8, Federal +6. The newspapers will remember your grace.',
        immediate: { publicTrust: 4 },
        factionImpact: { civilSocietyMedia: 8, federalGovt: 6 },
      },
      {
        id: 'defeat-obstruct',
        label: 'Protect Your Legacy — Slow-Walk the Handover',
        description: 'Delay documents, bury records. Godfathers +6, Federal -8, Trust -4. Your allies stay protected.',
        immediate: { publicTrust: -4, politicalCapital: 6 },
        factionImpact: { partyGodfathers: 6, federalGovt: -8, civilSocietyMedia: -8 },
      },
      {
        id: 'defeat-pardon',
        label: 'Exercise Clemency — Last-Minute Pardons & Waivers',
        description: 'Use executive powers before you leave. Godfathers +10, Corruption +8, Civil Society -10.',
        immediate: { corruptionPressure: 8 },
        factionImpact: { partyGodfathers: 10, civilSocietyMedia: -10 },
      },
    ],
  },
  {
    id: 'transition-handover-briefing',
    title: 'Transition: Handover Briefing',
    body: `The incoming administration has submitted its formal request for transition documents. Budget records, project status, debt schedules, ongoing contracts. Your civil service has prepared the binders.

What you include — and what you leave out — will shape how history judges your administration. The Adebayo team will scrutinise every page.`,
    severity: 'high',
    category: 'political',
    triggerCondition: (state) =>
      state.week >= 202 &&
      state.reElected === false &&
      state.resolvedEvents.includes('election-result-defeat') &&
      !state.resolvedEvents.includes('transition-handover-briefing'),
    choices: [
      {
        id: 'handover-transparent',
        label: 'Full Transparency — Clean Books, Clear Records',
        description: 'Civil Society +10, Federal +8. Trust +5. The cleanest exit in Lagos history.',
        immediate: { publicTrust: 5 },
        factionImpact: { civilSocietyMedia: 10, federalGovt: 8, partyGodfathers: -6 },
      },
      {
        id: 'handover-selective',
        label: 'Selective Disclosure — Protect Sensitive Deals',
        description: 'Godfathers +6, Corruption +4. Civil Society -5. Some records stay in the safe.',
        immediate: { corruptionPressure: 4 },
        factionImpact: { partyGodfathers: 6, civilSocietyMedia: -5 },
      },
      {
        id: 'handover-golden',
        label: 'The Golden Handshake — Secure Your Future',
        description: 'Route transition funds to loyalists. Political Capital +10, Godfathers +8, Corruption +6. Trust -6.',
        immediate: { politicalCapital: 10, publicTrust: -6, corruptionPressure: 6 },
        factionImpact: { partyGodfathers: 8, civilSocietyMedia: -8 },
      },
    ],
  },
  {
    id: 'transition-farewell-address',
    title: 'Transition: Farewell Address',
    body: `The television cameras are set up in the State House briefing room. In twelve hours, you will no longer be Governor of Lagos State. Your staff has prepared three draft closing statements.

This is your last word. What will you say?`,
    severity: 'high',
    category: 'political',
    triggerCondition: (state) =>
      state.week >= 204 &&
      state.reElected === false &&
      state.resolvedEvents.includes('transition-handover-briefing') &&
      !state.resolvedEvents.includes('transition-farewell-address'),
    choices: [
      {
        id: 'farewell-accomplishments',
        label: 'Defend Your Record',
        description: 'List every achievement. Trust +6, Civil Society +5. History will remember the data.',
        immediate: { publicTrust: 6 },
        factionImpact: { civilSocietyMedia: 5 },
      },
      {
        id: 'farewell-concede',
        label: 'A Graceful Concession — Thank the People',
        description: 'Acknowledge the loss, thank your team. Trust +4, Political Capital +6. Leave with dignity.',
        immediate: { publicTrust: 4, politicalCapital: 6 },
        factionImpact: { civilSocietyMedia: 8, federalGovt: 4 },
      },
      {
        id: 'farewell-attack',
        label: 'Go Down Fighting — Attack the Incoming Administration',
        description: 'Claim the election was unfair. Godfathers +6, Trust -4, Civil Society -8. Poison the well.',
        immediate: { publicTrust: -4 },
        factionImpact: { partyGodfathers: 6, civilSocietyMedia: -8, federalGovt: -6 },
      },
    ],
  },
]
