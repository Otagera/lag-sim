import type { OpinionTier } from '../engine/opinionEngine'
import type { GameState, InboxMessageTone, NPCArchetypeKey } from '../state/types'

/**
 * Political Actors — personalities and the moves each actor can make.
 * Each week an active actor scores its moves (engine/actorEngine.ts) and acts
 * only when the best one clears a bar set by its patience. See
 * docs/political-actors.md §4.
 */

/** 0..1 each. Fixed per archetype, like Civilization's leader "flavours". */
export type Personality = {
  patience: number // waits for a better moment (raises the bar to act)
  boldness: number // tolerance for risky, public moves
  pride: number // reacts harder to slights (amplifies hostility)
}

export const ACTOR_PERSONALITY: Record<NPCArchetypeKey, Personality> = {
  journalist: { patience: 0.6, boldness: 0.7, pride: 0.5 },
  'youth-organiser': { patience: 0.2, boldness: 0.8, pride: 0.6 },
  insider: { patience: 0.8, boldness: 0.4, pride: 0.7 },
  'union-leader': { patience: 0.4, boldness: 0.6, pride: 0.5 },
  'opposition-senator': { patience: 0.7, boldness: 0.6, pride: 0.6 },
  'diaspora-activist': { patience: 0.6, boldness: 0.5, pride: 0.4 },
  'oba-liaison': { patience: 0.7, boldness: 0.3, pride: 0.9 },
  'business-mogul': { patience: 0.5, boldness: 0.4, pride: 0.5 },
  'federal-liaison': { patience: 0.7, boldness: 0.5, pride: 0.7 },
}

// ── Situational factors: "why now" ─────────────────────────────────────────
// Labels are written as the explanation a player reads ("They moved because …").

export type Factor = { id: string; label: string; test: (s: GameState) => boolean }

export const FACTORS = {
  lowTrust: {
    id: 'lowTrust',
    label: 'your public trust is low',
    test: (s) => s.stats.publicTrust < 40,
  },
  highTrust: {
    id: 'highTrust',
    label: 'you are popular right now',
    test: (s) => s.stats.publicTrust > 60,
  },
  corruption: {
    id: 'corruption',
    label: 'corruption stories are everywhere',
    test: (s) => s.stats.corruptionPressure > 50,
  },
  restless: {
    id: 'restless',
    label: 'the streets are restless',
    test: (s) => s.stats.youthTension > 60,
  },
  lowPC: {
    id: 'lowPC',
    label: 'you have little political capital left',
    test: (s) => s.stats.politicalCapital < 25,
  },
  highPC: {
    id: 'highPC',
    label: 'you have political capital to spend',
    test: (s) => s.stats.politicalCapital > 70,
  },
  brokeTreasury: {
    id: 'brokeTreasury',
    label: 'the treasury is nearly empty',
    test: (s) => s.stats.cashReserve < 10,
  },
  flushTreasury: {
    id: 'flushTreasury',
    label: 'the treasury is flush',
    test: (s) => s.stats.cashReserve > 40,
  },
  electionNear: {
    id: 'electionNear',
    label: 'the election is approaching',
    test: (s) => s.currentTerm === 1 && s.week >= 160,
  },
  abujaCold: {
    id: 'abujaCold',
    label: 'Abuja is cold to you',
    test: (s) => s.stats.federalRelationship < -10,
  },
  failingInfra: {
    id: 'failingInfra',
    label: 'infrastructure is failing',
    test: (s) => s.stats.infrastructureScore < 35,
  },
  weakGodfathers: {
    id: 'weakGodfathers',
    label: 'the party godfathers are turning on you',
    test: (s) => s.factions.partyGodfathers < 30,
  },
  businessUneasy: {
    id: 'businessUneasy',
    label: 'business confidence is falling',
    test: (s) => s.factions.businessCommunity < 35,
  },
} satisfies Record<string, Factor>

// ── Moves ──────────────────────────────────────────────────────────────────

export type ActorMove = {
  id: string
  actor: NPCArchetypeKey
  /** Opinion tiers in which this move is in character */
  tiers: OpinionTier[]
  /** Intrinsic appeal — how much the move serves the actor's agenda (0..1) */
  base: number
  /** Situations that make this the moment (each adds FACTOR_WEIGHT) */
  factors: Factor[]
  /** 0..1 — how much this move could backfire on the actor */
  risk: number
  cooldownWeeks: number
} & (
  | { channel: 'card'; eventId: string }
  | {
      channel: 'inbox'
      subject: string
      tone: InboxMessageTone
      /** {NAME} and {REASON} are filled at send time */
      bodies: string[]
    }
)

const HOSTILE: OpinionTier[] = ['hostile']
const COLD: OpinionTier[] = ['hostile', 'wary']
const OPEN: OpinionTier[] = ['wary', 'cordial']
const WARM: OpinionTier[] = ['cordial', 'allied']

const F = FACTORS

/** Inbox warning + goodwill note in each actor's own voice */
function voice(
  actor: NPCArchetypeKey,
  warn: { subject: string; bodies: string[] },
  goodwill: { subject: string; bodies: string[] },
): ActorMove[] {
  return [
    {
      id: `${actor}:warn`,
      actor,
      tiers: COLD,
      base: 0.35,
      factors: [],
      risk: 0,
      cooldownWeeks: 6,
      channel: 'inbox',
      tone: 'cold',
      ...warn,
    },
    {
      id: `${actor}:goodwill`,
      actor,
      tiers: WARM,
      base: 0.35,
      factors: [],
      risk: 0,
      cooldownWeeks: 8,
      channel: 'inbox',
      tone: 'warm',
      ...goodwill,
    },
  ]
}

export const ACTOR_MOVES: ActorMove[] = [
  // ── Journalist ──
  {
    id: 'journalist:expose',
    actor: 'journalist',
    channel: 'card',
    eventId: 'npc-journalist-procurement-expose',
    tiers: COLD,
    base: 0.45,
    factors: [F.corruption, F.lowTrust, F.electionNear],
    risk: 0.3,
    cooldownWeeks: 12,
  },
  {
    id: 'journalist:truce',
    actor: 'journalist',
    channel: 'card',
    eventId: 'npc-journalist-truce-offer',
    tiers: OPEN,
    base: 0.4,
    factors: [F.highTrust],
    risk: 0.1,
    cooldownWeeks: 20,
  },
  ...voice(
    'journalist',
    {
      subject: 'I am still reading the contracts',
      bodies: [
        'Governor, a courtesy note. {REASON} My next piece is not finished, but it is getting longer.',
        'Your press office keeps sending me statements. I would rather have documents. {REASON}',
      ],
    },
    {
      subject: 'A fair week',
      bodies: [
        'For the record: the disclosure was noticed. {REASON} Do not make me regret writing that down.',
      ],
    },
  ),

  // ── Youth organiser ──
  {
    id: 'youth-organiser:rally',
    actor: 'youth-organiser',
    channel: 'card',
    eventId: 'npc-youth-rally-ojota',
    tiers: COLD,
    base: 0.45,
    factors: [F.restless, F.lowTrust, F.brokeTreasury],
    risk: 0.3,
    cooldownWeeks: 8,
  },
  {
    id: 'youth-organiser:electoral',
    actor: 'youth-organiser',
    channel: 'card',
    eventId: 'npc-youth-electoral-traction',
    tiers: COLD,
    base: 0.3,
    factors: [F.electionNear, F.lowTrust],
    risk: 0.2,
    cooldownWeeks: 26,
  },
  ...voice(
    'youth-organiser',
    {
      subject: 'The timeline is watching',
      bodies: [
        '{REASON} We are counting, Governor. Every bus fare, every school fee, every promise.',
        'Next time we will not be asking for a meeting. {REASON}',
      ],
    },
    {
      subject: 'Respect',
      bodies: ['The young people saw what you did. {REASON} Keep going and we keep quiet.'],
    },
  ),

  // ── Insider ──
  {
    id: 'insider:sabotage',
    actor: 'insider',
    channel: 'card',
    eventId: 'npc-insider-sabotage',
    tiers: COLD,
    base: 0.3,
    factors: [F.lowPC, F.weakGodfathers],
    risk: 0.2,
    cooldownWeeks: 10,
  },
  {
    id: 'insider:primary',
    actor: 'insider',
    channel: 'card',
    eventId: 'npc-insider-primary-threat',
    tiers: HOSTILE,
    base: 0.3,
    factors: [F.electionNear, F.weakGodfathers, F.lowTrust],
    risk: 0.5,
    cooldownWeeks: 52,
  },
  ...voice(
    'insider',
    {
      subject: 'A friendly word',
      bodies: [
        'Some of us in the party are asking questions. {REASON} I would answer them before the delegates do.',
        '{REASON} I only mention it because I want you to succeed. Truly.',
      ],
    },
    {
      subject: 'The party is settling',
      bodies: ['The noise in the caucus has died down. {REASON} Let us keep it that way.'],
    },
  ),

  // ── Union leader ──
  {
    id: 'union-leader:strike',
    actor: 'union-leader',
    channel: 'card',
    eventId: 'npc-union-strike-warning',
    tiers: COLD,
    base: 0.45,
    factors: [F.brokeTreasury, F.lowTrust, F.electionNear],
    risk: 0.3,
    cooldownWeeks: 10,
  },
  {
    id: 'union-leader:deal',
    actor: 'union-leader',
    channel: 'card',
    eventId: 'npc-union-ally-opportunity',
    tiers: OPEN,
    base: 0.35,
    factors: [F.flushTreasury],
    risk: 0.1,
    cooldownWeeks: 26,
  },
  ...voice(
    'union-leader',
    {
      subject: 'Our members are meeting on Saturday',
      bodies: [
        '{REASON} I cannot hold the branches back forever. Saturday will decide a lot.',
        'Governor, the workers have long memories and short patience. {REASON}',
      ],
    },
    {
      subject: 'Thank you, Governor',
      bodies: [
        'The branches noticed. {REASON} You will not hear from us for a while — that is a compliment.',
      ],
    },
  ),

  // ── Opposition senator ──
  {
    id: 'opposition-senator:hearing',
    actor: 'opposition-senator',
    channel: 'card',
    eventId: 'npc-senator-abuja-hearing',
    tiers: COLD,
    base: 0.4,
    factors: [F.lowTrust, F.corruption, F.abujaCold],
    risk: 0.3,
    cooldownWeeks: 14,
  },
  {
    id: 'opposition-senator:bloc',
    actor: 'opposition-senator',
    channel: 'card',
    eventId: 'npc-senator-coalition-threat',
    tiers: HOSTILE,
    base: 0.3,
    factors: [F.electionNear, F.abujaCold, F.lowPC],
    risk: 0.5,
    cooldownWeeks: 40,
  },
  ...voice(
    'opposition-senator',
    {
      subject: 'From the floor of the Senate',
      bodies: [
        '{REASON} My committee has a long agenda. Your state keeps volunteering for it.',
        'Governor, I say this with respect: you are making my job very easy. {REASON}',
      ],
    },
    {
      subject: 'A rare agreement',
      bodies: [
        'We will never be on the same ballot, but this once we are on the same side. {REASON}',
      ],
    },
  ),

  // ── Diaspora activist ──
  {
    id: 'diaspora-activist:report',
    actor: 'diaspora-activist',
    channel: 'card',
    eventId: 'npc-diaspora-international-report',
    tiers: COLD,
    base: 0.4,
    factors: [F.restless, F.lowTrust],
    risk: 0.2,
    cooldownWeeks: 16,
  },
  {
    id: 'diaspora-activist:invest',
    actor: 'diaspora-activist',
    channel: 'card',
    eventId: 'npc-diaspora-investment-bridge',
    tiers: OPEN,
    base: 0.35,
    factors: [F.highTrust, F.businessUneasy],
    risk: 0.1,
    cooldownWeeks: 26,
  },
  ...voice(
    'diaspora-activist',
    {
      subject: 'London is asking about you',
      bodies: [
        '{REASON} Two foundations have asked me for a briefing on your government. I have not said yes yet.',
      ],
    },
    {
      subject: 'Good news travels too',
      bodies: [
        'The diaspora groups are talking about your state for the right reasons this month. {REASON}',
      ],
    },
  ),

  // ── Oba liaison ──
  {
    id: 'oba-liaison:land',
    actor: 'oba-liaison',
    channel: 'card',
    eventId: 'npc-oba-land-dispute',
    tiers: COLD,
    base: 0.4,
    factors: [F.failingInfra, F.lowTrust],
    risk: 0.2,
    cooldownWeeks: 14,
  },
  {
    id: 'oba-liaison:endorse',
    actor: 'oba-liaison',
    channel: 'card',
    eventId: 'npc-oba-endorsement-offer',
    tiers: OPEN,
    base: 0.35,
    factors: [F.electionNear, F.highTrust],
    risk: 0.1,
    cooldownWeeks: 30,
  },
  ...voice(
    'oba-liaison',
    {
      subject: 'The palace has noticed',
      bodies: [
        'Kabiyesi has asked me to convey his concern. {REASON} The palace does not like to repeat itself.',
      ],
    },
    {
      subject: 'Greetings from the palace',
      bodies: ['Kabiyesi sends his blessings. {REASON} The chiefs speak well of you this season.'],
    },
  ),

  // ── Business mogul ──
  {
    id: 'business-mogul:flight',
    actor: 'business-mogul',
    channel: 'card',
    eventId: 'npc-mogul-capital-flight-warning',
    tiers: COLD,
    base: 0.4,
    factors: [F.businessUneasy, F.failingInfra, F.brokeTreasury],
    risk: 0.3,
    cooldownWeeks: 12,
  },
  {
    id: 'business-mogul:ppp',
    actor: 'business-mogul',
    channel: 'card',
    eventId: 'npc-mogul-partnership-offer',
    tiers: OPEN,
    base: 0.35,
    factors: [F.highTrust, F.failingInfra],
    risk: 0.1,
    cooldownWeeks: 26,
  },
  ...voice(
    'business-mogul',
    {
      subject: 'My board is nervous',
      bodies: [
        '{REASON} My board meets next month to discuss where we expand. I would like to say here.',
      ],
    },
    {
      subject: 'Lunch soon?',
      bodies: [
        'Things are moving in the right direction. {REASON} My people would like to talk about what comes next.',
      ],
    },
  ),

  // ── Federal liaison ──
  {
    id: 'federal-liaison:allocation',
    actor: 'federal-liaison',
    channel: 'card',
    eventId: 'npc-federal-allocation-delay',
    tiers: COLD,
    base: 0.4,
    factors: [F.abujaCold, F.brokeTreasury, F.lowPC],
    risk: 0.3,
    cooldownWeeks: 16,
  },
  {
    id: 'federal-liaison:flagship',
    actor: 'federal-liaison',
    channel: 'card',
    eventId: 'npc-federal-project-offer',
    tiers: OPEN,
    base: 0.35,
    factors: [F.failingInfra, F.highTrust],
    risk: 0.1,
    cooldownWeeks: 30,
  },
  {
    id: 'federal-liaison:loyalty',
    actor: 'federal-liaison',
    channel: 'card',
    eventId: 'npc-federal-loyalty-demand',
    tiers: COLD,
    base: 0.3,
    factors: [F.electionNear, F.flushTreasury],
    risk: 0.2,
    cooldownWeeks: 52,
  },
  ...voice(
    'federal-liaison',
    {
      subject: 'A note from the Villa',
      bodies: [
        '{REASON} The Villa values partners who understand how things work. I trust you are one of them.',
        'Allocations are a federal matter, Governor, and federal matters take time. {REASON}',
      ],
    },
    {
      subject: 'The Villa is pleased',
      bodies: ['The President mentioned your state at Council this week, favourably. {REASON}'],
    },
  ),
]

export const MOVES_BY_ACTOR: Record<NPCArchetypeKey, ActorMove[]> = Object.fromEntries(
  (Object.keys(ACTOR_PERSONALITY) as NPCArchetypeKey[]).map((k) => [
    k,
    ACTOR_MOVES.filter((m) => m.actor === k),
  ]),
) as Record<NPCArchetypeKey, ActorMove[]>

/** First letter an actor sends when they turn up — sets their voice. */
export const ACTOR_INTRO: Record<
  NPCArchetypeKey,
  { subject: string; body: string; tone: InboxMessageTone }
> = {
  journalist: {
    subject: 'Watching',
    body: 'Governor. I will be covering your administration, starting with the contracts. My readers expect the truth. I trust you do too.',
    tone: 'neutral',
  },
  'youth-organiser': {
    subject: 'The youth expect better',
    body: 'Governor, young people worked for your victory and are still waiting for it to work for them. We are organising. Whether that is with you or against you is your choice.',
    tone: 'cold',
  },
  insider: {
    subject: 'A word from the party',
    body: 'Congratulations again, Governor. I was in the room when the party chose its candidate. Some of us still remember the other names on the list.',
    tone: 'neutral',
  },
  'union-leader': {
    subject: 'From the workers',
    body: 'Governor, our members keep this state running and some of them have not been paid properly in months. I would rather meet you at a table than at a picket line.',
    tone: 'cold',
  },
  'opposition-senator': {
    subject: 'Greetings from Abuja',
    body: 'Governor, my committee oversees several federal lines that touch your state. I look forward to examining them closely. Nothing personal.',
    tone: 'neutral',
  },
  'diaspora-activist': {
    subject: 'Introducing myself',
    body: 'Governor, I work with diaspora groups and foreign foundations who care about this state. Some want to invest. Some want answers. I talk to both.',
    tone: 'neutral',
  },
  'oba-liaison': {
    subject: 'From the palace',
    body: 'Kabiyesi sends his greetings and asks to be consulted before decisions touching land and tradition. The palace has always worked with governors who listen.',
    tone: 'neutral',
  },
  'business-mogul': {
    subject: 'Doing business here',
    body: 'Governor, my group employs eleven thousand people in this state. We would like to keep growing here. That depends on the next few decisions your government makes.',
    tone: 'neutral',
  },
  'federal-liaison': {
    subject: 'From the Villa',
    body: 'Governor, the Presidency has asked me to be its point of contact with your government. Allocations, agencies, the coming campaign — you will be hearing from me.',
    tone: 'cold',
  },
}
