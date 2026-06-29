import type { NewsArticle, InboxMessage, EventCard, Choice } from '../../state/types'

export const FIXTURE_ARTICLES: Record<'fiscal' | 'political' | 'crisis' | 'milestone', NewsArticle> = {
  fiscal: {
    headline: 'Lagos Posts ₦48.2B Budget Surplus — IGR Hits Record High',
    deck: 'Internally Generated Revenue surges past FAAC allocation for the first time, driven by land-use charge enforcement and informal sector formalisation.',
    category: 'fiscal',
    dataPoints: [
      { label: 'IGR (this month)', value: '₦32.6B', delta: '+12.4%', positive: true },
      { label: 'FAAC Allocation', value: '₦28.1B', delta: '-3.1%', positive: false },
      { label: 'Operating Surplus', value: '₦48.2B', delta: '+₦9.7B YoY', positive: true },
      { label: 'Debt Service Ratio', value: '18.3%', delta: '-2.1pp', positive: true },
    ],
    llmGenerated: false,
    channelMeta: {
      channel: 'newspaper',
    },
  },
  political: {
    headline: 'LAHA Speaker Challenges Governor Over Executive Bill 47: "This House Will Not Be Bypassed"',
    deck: 'A coalition of 23 lawmakers from both parties blocked the second reading of the Transport Reform Bill, citing insufficient consultation with Local Government Councils.',
    category: 'political',
    dataPoints: [
      { label: 'Votes For', value: '17', delta: '', positive: false },
      { label: 'Votes Against', value: '23', delta: '', positive: false },
      { label: 'Abstentions', value: '5', delta: '', positive: false },
      { label: 'Public Sentiment', value: '52% support', delta: '', positive: true },
    ],
    llmGenerated: false,
    channelMeta: {
      channel: 'tweet',
      handle: '@LagosPunch',
      hashtag: '#LAHAShowdown',
      retweets: 2340,
      likes: 8700,
    },
  },
  crisis: {
    headline: 'Heavy Flooding Displaces 12,000 in Ajegunle, Badagry — State Declares Emergency',
    deck: 'Three days of torrential rain overwhelmed drainage channels in the coastal wards. LASEMA reports two fatalities and estimates ₦4.7B in property damage.',
    category: 'crisis',
    dataPoints: [
      { label: 'Displaced Persons', value: '12,400', delta: '', positive: false },
      { label: 'Worst-Hit Wards', value: 'Ajegunle, Badagry, Ikorodu', delta: '', positive: false },
      { label: 'Emergency Fund Released', value: '₦1.2B', delta: '', positive: true },
      { label: 'Rainfall (72h)', value: '284mm', delta: '+61% vs avg', positive: false },
    ],
    llmGenerated: false,
    channelMeta: {
      channel: 'whatsapp',
      forwardCount: 8400,
      isRumor: false,
    },
  },
  milestone: {
    headline: 'Fourth Mainland Bridge: Phase One Opens to Traffic — Travel Time to Ikorodu Halved',
    deck: 'The ₦124B first phase connects Lekki-Ajah to Ikorodu via a 14.2 km six-lane carriageway. The project employed 3,800 workers and came in 7% under budget.',
    category: 'milestone',
    dataPoints: [
      { label: 'Total Cost (Phase 1)', value: '₦124B', delta: '-₦9.3B vs budget', positive: true },
      { label: 'Travel Time Saved', value: '75 → 38 min', delta: '-49%', positive: true },
      { label: 'Local Jobs Created', value: '3,800', delta: '', positive: true },
      { label: 'Projected IGR Boost', value: '+₦4.2B/yr', delta: '', positive: true },
    ],
    llmGenerated: false,
    channelMeta: {
      channel: 'shortVideo',
      views: 1_400_000,
      creatorHandle: '@Lagospedia',
    },
  },
}

export const FIXTURE_INBOX: InboxMessage[] = [
  {
    id: 'fixture-inbox-1',
    from: 'chief-of-staff',
    fromLabel: 'Chief of Staff',
    week: 18,
    subject: 'Briefing: LAHA Reconciliation Strategy',
    body: "Governor, I've met with the Majority Leader off the record. He believes we can flip 8 votes if we offer the Badagry road project and a deputy slot on the LASIEC board. Worth pursuing before the next session.",
    tone: 'neutral',
    read: false,
  },
  {
    id: 'fixture-inbox-2',
    from: 'fashemu',
    fromLabel: 'Chief Fashemu',
    week: 20,
    subject: 'The Abeokuta Street Matter',
    body: "My people tell me the Ministry is holding up the building permit for my cousin's development on Abeokuta Street. I expect this resolved by Friday. You remember how I helped you in the primary.",
    tone: 'threatening',
    read: false,
    isGodfatherAsk: true,
    godfatherAskDescription: 'Fast-track a controversial building permit for a godfather associate.',
  },
  {
    id: 'fixture-inbox-3',
    from: 'neo',
    fromLabel: 'Nneoma "Neo" Okonkwo',
    week: 17,
    subject: 'Youth Council Rally — Saturday at Tafawa Balewa Square',
    body: "Governor, we've mobilised 6,000 young Lagosians for the Saturday rally. If you make a surprise appearance and announce the tech hub grant, I can guarantee a positive media narrative. The Commissioner of Police has confirmed security.",
    tone: 'warm',
    read: false,
  },
  {
    id: 'fixture-inbox-4',
    from: 'commissioner',
    fromLabel: 'Commissioner for Finance',
    week: 19,
    subject: 'URGENT: FAAC Shortfall — Treasury Projection',
    body: "Sir, the Federation Account Allocation Committee has notified us of a 22% shortfall this month due to low oil output. Our cash reserve projection for Week 24 is ₦8.2B — below the operating floor. We need either a spending freeze or a stop-gap borrowing approval.",
    tone: 'urgent',
    read: false,
  },
]

function mkChoice(id: string, label: string, desc: string, immediate: Record<string, number>, factionImpact?: Record<string, number>): Choice {
  return { id, label, description: desc, immediate, factionImpact: factionImpact ?? {} }
}

export const FIXTURE_EVENTS: EventCard[] = [
  {
    id: 'fixture-evt-crisis',
    title: 'Makoko Market Fire — 200 Shops Destroyed',
    body: 'A pre-dawn fire swept through the Makoko floating market, razing over 200 shops and leaving an estimated 1,500 traders without livelihoods. LASEMA suspects an electrical fault from illegal connections. Emergency teams have contained the blaze, but the economic fallout is spreading through the lagoon economy.',
    severity: 'high',
    category: 'crisis',
    choices: [
      mkChoice('fixture-evt-crisis-a', 'Declare an Emergency & Release ₦800M Relief Fund',
        'Immediate cash for affected traders, but signals panic to the business community.',
        { cashReserve: -4, publicTrust: 4, politicalCapital: -5 },
        { informalEconomy: 12, businessCommunity: -3 }),
      mkChoice('fixture-evt-crisis-b', 'Visit the Site & Promise Structural Reform',
        'Photo opportunity and a taskforce, but no immediate cash. Builds political capital.',
        { cashReserve: -1, publicTrust: 2, politicalCapital: 3 },
        { informalEconomy: 5, civilSocietyMedia: 8 }),
      mkChoice('fixture-evt-crisis-c', 'Delegate to Deputy Governor & LASEMA',
        'Standard bureaucratic response. Saves political capital but looks detached.',
        { corruptionPressure: 2, politicalCapital: 2 },
        { partyGodfathers: 3, lgChairmen: 2 }),
    ],
  },
  {
    id: 'fixture-evt-political',
    title: 'LGA Autonomy Bill Reaches Committee Stage',
    body: 'A proposed bill granting Local Governments greater financial autonomy has cleared the first reading in LAHA. The Governor must signal a position. Business groups support it (better local procurement); godfathers oppose it (lose control of LGA purse strings).',
    severity: 'medium',
    category: 'political',
    choices: [
      mkChoice('fixture-evt-pol-a', 'Endorse the Bill — Full LGA Autonomy',
        'Popular with civil society and LG chairmen but alienates godfathers.',
        { publicTrust: 5, politicalCapital: -8 },
        { lgChairmen: 15, civilSocietyMedia: 10, partyGodfathers: -12 }),
      mkChoice('fixture-evt-pol-b', 'Propose a Compromise — Partial Devolution',
        'Moderate position. Keeps everyone engaged but satisfies no one fully.',
        { politicalCapital: 2, corruptionPressure: 3 },
        { lgChairmen: 5, partyGodfathers: -3, federalGovt: 3 }),
      mkChoice('fixture-evt-pol-c', 'Oppose the Bill — Status Quo',
        'Pleases godfathers and federal networks but alienates civil society and the press.',
        { publicTrust: -8, politicalCapital: 5 },
        { partyGodfathers: 10, civilSocietyMedia: -15, businessCommunity: -3 }),
    ],
  },
  {
    id: 'fixture-evt-low',
    title: 'Traffic Management: LASTMA Officers Deploy New E-Ticketing System',
    body: 'The new digital traffic ticketing system goes live across five major corridors — Lekki, Ikorodu Road, Oshodi, Apapa, and Ikeja. Early data suggests a 30% reduction in bribe-seeking incidents at checkpoints, but motorists are complaining about the speed of the new devices.',
    severity: 'low',
    category: 'economy',
    choices: [
      mkChoice('fixture-evt-low-a', 'Launch a Public Awareness Campaign',
        'Invest in radio jingles and road shows to smooth adoption.',
        { cashReserve: -1, publicTrust: 3 },
        { civilSocietyMedia: 5, informalEconomy: 3 }),
      mkChoice('fixture-evt-low-b', 'Roll Back to Paper Tickets Temporarily',
        'Relieves motorist frustration but signals weakness on reform.',
        { publicTrust: -2, corruptionPressure: 5 },
        { informalEconomy: 3, partyGodfathers: 3 }),
    ],
  },
]
