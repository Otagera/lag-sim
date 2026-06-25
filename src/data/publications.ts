import type { FactionDelta, StatDelta } from '../state/types'

export interface PublicationFramingVariant {
  caption: string
  editorialNote: string
}

export interface Publication {
  id: string
  name: string
  masthead: string
  description: string
  color: string
  baseWeight: number
  bias: {
    govtLean: number
    sensationalism: number
  }
  coverage: {
    categories: string[]
    preferredCategory?: string
  }
  framing: Record<string, PublicationFramingVariant[]>
  gameplayEffect: {
    statDelta?: StatDelta
    factionDelta?: FactionDelta
  }
}

export const PUBLICATIONS: Publication[] = [
  {
    id: 'punch',
    name: 'Punch',
    masthead: 'PUNCH',
    description: 'Lagos\'s Independent Voice',
    color: '#dc2626',
    baseWeight: 1,
    bias: { govtLean: -0.4, sensationalism: 0.8 },
    coverage: { categories: ['crisis', 'political', 'social'], preferredCategory: 'crisis' },
    framing: {
      crisis: [
        { caption: 'CRISIS WATCH', editorialNote: 'The administration\'s response has been inadequate. Citizens deserve better.' },
        { caption: 'EXPOSED: UNDER SIEGE', editorialNote: 'Lagosians are paying the price for governance failures.' },
        { caption: 'BREAKING POINT', editorialNote: 'How much more can the system take before it breaks?' },
      ],
      political: [
        { caption: 'THE POWER GAME', editorialNote: 'Behind every decision is a political calculation. We report both.' },
        { caption: 'INSIDER TRACKING', editorialNote: 'The corridors of power are restless. Sources say…' },
        { caption: 'ANALYSIS: WHO BENEFITS', editorialNote: 'Follow the money. It always tells the real story.' },
      ],
      background: [
        { caption: 'UNDER THE SURFACE', editorialNote: 'What doesn\'t make the headlines matters most.' },
        { caption: 'THE LONG VIEW', editorialNote: 'Today\'s decisions echo for years. We\'re watching.' },
      ],
      fiscal: [
        { caption: 'TREASURY WATCH', editorialNote: 'Every naira must be accounted for. We are watching.' },
        { caption: 'THE BOTTOM LINE', editorialNote: 'Fiscal discipline is not optional — it is survival.' },
      ],
      milestone: [
        { caption: 'THE RECORD', editorialNote: 'Milestones matter. What comes next matters more.' },
        { caption: 'MARKING TIME', editorialNote: 'Another week, another chapter in Lagos\'s story.' },
      ],
    },
    gameplayEffect: { statDelta: { publicTrust: -0.7 } },
  },
  {
    id: 'vanguard',
    name: 'Vanguard',
    masthead: 'VANGUARD',
    description: 'The National Interest',
    color: '#2563eb',
    baseWeight: 1.2,
    bias: { govtLean: 0.3, sensationalism: 0.4 },
    coverage: { categories: ['fiscal', 'political', 'crisis', 'milestone', 'background'], preferredCategory: 'political' },
    framing: {
      fiscal: [
        { caption: 'ECONOMY WATCH', editorialNote: 'The numbers tell a story. We help you read it.' },
        { caption: 'FISCAL PULSE', editorialNote: 'Revenue and expenditure — the twin engines of governance.' },
      ],
      political: [
        { caption: 'NATIONAL PERSPECTIVE', editorialNote: 'The administration continues to navigate these challenges with resolve.' },
        { caption: 'IN FOCUS', editorialNote: 'Despite the headwinds, progress is being made on key fronts.' },
        { caption: 'THE BIG STORY', editorialNote: 'This is a defining moment for Lagos governance.' },
      ],
      crisis: [
        { caption: 'CRISIS MANAGEMENT', editorialNote: 'The government is responding. The outcome is uncertain.' },
        { caption: 'UNDER PRESSURE', editorialNote: 'Tough times test leadership. All eyes are on the Governor.' },
        { caption: 'EMERGENCY BRIEFING', editorialNote: 'The situation is developing. We will keep you informed.' },
      ],
      milestone: [
        { caption: 'A HISTORIC MOMENT', editorialNote: 'Another chapter in Lagos\'s journey. The best is yet to come.' },
        { caption: 'MARKING PROGRESS', editorialNote: 'Step by step, the vision is taking shape.' },
      ],
      background: [
        { caption: 'BRIEFING', editorialNote: 'Context matters. We provide the full picture.' },
        { caption: 'BEHIND THE STORY', editorialNote: 'What led to this moment? We trace the thread.' },
      ],
    },
    gameplayEffect: { statDelta: { publicTrust: 0.5 } },
  },
  {
    id: 'the-nation',
    name: 'The Nation',
    masthead: 'THE NATION',
    description: 'Nigeria\'s Most Influential',
    color: '#7c3aed',
    baseWeight: 1.2,
    bias: { govtLean: 0.5, sensationalism: 0.2 },
    coverage: { categories: ['political', 'milestone', 'background'] },
    framing: {
      political: [
        { caption: 'STATE CRAFT', editorialNote: 'The governor\'s steady hand has guided Lagos through turbulent waters.' },
        { caption: 'GOVERNANCE DIGEST', editorialNote: 'This administration remains committed to its mandate.' },
        { caption: 'THE CORRIDORS', editorialNote: 'Leadership is about choices. Lagos is making them.' },
      ],
      milestone: [
        { caption: 'THE RECORD', editorialNote: 'History will note this moment. Lagos is on the move.' },
        { caption: 'A MILESTONE ACHIEVED', editorialNote: 'Progress is not accidental — it is earned.' },
      ],
      background: [
        { caption: 'BRIEFING: INSIDE THE ADMINISTRATION', editorialNote: 'The work of government continues, seen and unseen.' },
        { caption: 'CONTEXT & PERSPECTIVE', editorialNote: 'Understanding Lagos requires patience. We provide it.' },
      ],
      fiscal: [
        { caption: 'ECONOMIC OUTLOOK', editorialNote: 'Fiscal management is the foundation of all governance.' },
        { caption: 'TREASURY REPORT', editorialNote: 'The books are being managed with care and attention.' },
      ],
      crisis: [
        { caption: 'SITUATION ROOM', editorialNote: 'The administration is handling this with the seriousness it deserves.' },
        { caption: 'CRISIS RESPONSE', editorialNote: 'Leadership is tested in moments like this.' },
      ],
    },
    gameplayEffect: { statDelta: { publicTrust: 0.3 }, factionDelta: { partyGodfathers: 0.5 } },
  },
  {
    id: 'guardian',
    name: 'The Guardian',
    masthead: 'THE GUARDIAN',
    description: 'Conscience, Nurtured',
    color: '#059669',
    baseWeight: 1,
    bias: { govtLean: -0.2, sensationalism: 0.3 },
    coverage: { categories: ['fiscal', 'political', 'crisis', 'milestone', 'background'] },
    framing: {
      fiscal: [
        { caption: 'FISCAL ACCOUNTABILITY', editorialNote: 'The gap between promise and delivery remains a concern.' },
        { caption: 'THE PUBLIC PURSE', editorialNote: 'Every naira spent is a naira borrowed from Lagos\'s future.' },
      ],
      political: [
        { caption: 'CONSCIENCE WATCH', editorialNote: 'History will judge whether this was progress or missed opportunity.' },
        { caption: 'MATTERS OF STATE', editorialNote: 'Governance is about trust. Trust is earned in drops and lost in buckets.' },
        { caption: 'THE LONG VIEW', editorialNote: 'Beyond the headlines, the real story is unfolding.' },
      ],
      crisis: [
        { caption: 'CRISIS OF CONFIDENCE', editorialNote: 'When institutions falter, citizens bear the cost.' },
        { caption: 'STATE OF EMERGENCY', editorialNote: 'This is a test of the system itself, not just the government.' },
      ],
      milestone: [
        { caption: 'MARKING TIME', editorialNote: 'A moment to reflect on how far we have come — and how far remains.' },
        { caption: 'THE RECORD SO FAR', editorialNote: 'Milestones are only meaningful if we learn from them.' },
      ],
      background: [
        { caption: 'BEYOND THE HEADLINES', editorialNote: 'The full story is always more complex.' },
        { caption: 'DEEPER DIVE', editorialNote: 'Understanding Lagos requires looking beneath the surface.' },
      ],
    },
    gameplayEffect: { statDelta: { publicTrust: -0.3 } },
  },
  {
    id: 'business-day',
    name: 'Business Day',
    masthead: 'BUSINESS DAY',
    description: 'Markets. Policy. People.',
    color: '#d97706',
    baseWeight: 0.8,
    bias: { govtLean: 0, sensationalism: 0.1 },
    coverage: { categories: ['fiscal'] },
    framing: {
      fiscal: [
        { caption: 'MARKET MOVES', editorialNote: 'Markets respond to fiscal discipline. Long-term outlook requires consistency.' },
        { caption: 'FISCAL PULSE', editorialNote: 'The business community watches the numbers. We report them.' },
        { caption: 'ECONOMIC INDICATORS', editorialNote: 'Data-driven analysis for decision-makers.' },
      ],
    },
    gameplayEffect: { factionDelta: { businessCommunity: 1 } },
  },
  {
    id: 'daily-trust',
    name: 'Daily Trust',
    masthead: 'DAILY TRUST',
    description: 'Truth in Reporting',
    color: '#0891b2',
    baseWeight: 0.8,
    bias: { govtLean: 0, sensationalism: 0.3 },
    coverage: { categories: ['political', 'social', 'fiscal', 'crisis'] },
    framing: {
      political: [
        { caption: 'TRUTH IN REPORTING', editorialNote: 'The facts speak for themselves. Lagosians will draw their own conclusions.' },
        { caption: 'ACROSS THE AISLE', editorialNote: 'Every decision has multiple perspectives. We present them.' },
        { caption: 'THE MIDDLE GROUND', editorialNote: 'Balance is not neutrality — it is fairness.' },
      ],
      fiscal: [
        { caption: 'THE PEOPLE\'S BUDGET', editorialNote: 'Public money deserves public scrutiny.' },
        { caption: 'FISCAL FAIRNESS', editorialNote: 'Who pays, who benefits, and who decides.' },
      ],
      crisis: [
        { caption: 'GROUND REPORT', editorialNote: 'On the ground, the reality is always different from the official version.' },
        { caption: 'COMMUNITY VOICES', editorialNote: 'We speak to those most affected.' },
      ],
      milestone: [
        { caption: 'A CROSSROADS', editorialNote: 'Where do we go from here? The debate continues.' },
        { caption: 'THE PEOPLE\'S RECORD', editorialNote: 'History is written by many hands.' },
      ],
      background: [
        { caption: 'CONTEXT MATTERS', editorialNote: 'The full picture requires looking beyond the obvious.' },
        { caption: 'DEEPER DIVE', editorialNote: 'We go beyond the press release to find the story.' },
      ],
    },
    gameplayEffect: {},
  },
]

export function getPublication(id: string): Publication | undefined {
  return PUBLICATIONS.find((p) => p.id === id)
}
