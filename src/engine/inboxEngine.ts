import type {
  CharacterId,
  CommissionerRole,
  CommissionerState,
  DeputyKey,
  FashemuPhase,
  GameState,
  InboxMessage,
  NPCKey,
  NPCState,
} from '../state/types'

// ── Helpers ──────────────────────────────────────────────

let _msgCounter = 0
function nextId(): string {
  _msgCounter++
  return `inbox-${Date.now()}-${_msgCounter}`
}

function npcCharacterId(npc: NPCState): CharacterId {
  if (npc.archetypeKey === 'youth-organiser') return 'dayo'
  if (npc.archetypeKey === 'insider') return 'smj'
  return 'neo'
}

function npcLabel(npc: NPCState): string {
  if (npc.name) return npc.name
  if (npc.archetypeKey === 'youth-organiser') return 'Comrade Dayo Afolabi'
  if (npc.archetypeKey === 'insider') return 'Hon. Seun Majekodunmi'
  return 'NEO'
}

function commissionerLabel(role: CommissionerRole, commissioner: CommissionerState): string {
  const roleName: Record<CommissionerRole, string> = {
    works: 'Works',
    finance: 'Finance',
    environment: 'Environment',
    transport: 'Transport',
    information: 'Information',
  }
  return `${commissioner.name} (${roleName[role]})`
}

// ── Generators ───────────────────────────────────────────

/** Fashemu godfather — phase transition messages */
export function generateGodfatherPhaseMessage(
  state: GameState,
  oldPhase: FashemuPhase,
  newPhase: FashemuPhase,
): InboxMessage | null {
  if (oldPhase === newPhase) return null

  const subjects: Record<FashemuPhase, string> = {
    dormant: 'Your administration',
    active: 'A word',
    warning: 'Tread carefully',
    break: 'You chose your path',
    reconciled: 'Water under the bridge',
    dead: 'Announcement',
  }
  /* DRAFT — VOICE PASS NEEDED */
  const bodies: Record<FashemuPhase, string[]> = {
    dormant: [''],
    active: [
      'Governor. Good to see you in the chair. Lagos is a city of relationships — let us ensure ours is fruitful.',
    ],
    warning: [
      'I notice certain promises have not materialised. Lagos remembers its friends, Governor. And its forgetful ones.',
    ],
    break: [
      'You have made your position clear. Expect mine soon. You will not like it.',
    ],
    reconciled: [
      'Water under the bridge, Governor. Let us focus on what matters — Lagos. My door remains open.',
    ],
    dead: [
      'Chief B.O.A. Fashemu passed peacefully this morning. Burial arrangements to follow. The family requests privacy.',
    ],
  }

  const variants = bodies[newPhase]
  if (variants.length === 0 || variants[0] === '') return null

  const week = state.week
  const idx = week % variants.length

  return {
    id: nextId(),
    from: 'fashemu',
    fromLabel: 'Chief B.O.A. Fashemu',
    week,
    subject: newPhase === 'dead' ? 'Announcement' : subjects[newPhase],
    body: variants[idx],
    tone: newPhase === 'break' || newPhase === 'warning' ? 'cold' : newPhase === 'dead' ? 'neutral' : 'warm',
    read: false,
  }
}

/** Godfather ask — wraps a pending ask into an inbox message */
export function generateGodfatherAskMessage(
  state: GameState,
  askText: string,
  askDescription: string,
): InboxMessage {
  return {
    id: nextId(),
    from: 'fashemu',
    fromLabel: 'Chief B.O.A. Fashemu',
    week: state.week,
    subject: 'Your attention is required',
    body: askText,
    tone: 'threatening',
    read: false,
    isGodfatherAsk: true,
    godfatherAskDescription: askDescription,
  }
}

/** NPC activation message (first contact) */
export function generateNPCActivationMessage(
  state: GameState,
  _slot: NPCKey,
  npc: NPCState,
): InboxMessage | null {
  if (!npc.isActive) return null
  const charId = npcCharacterId(npc)
  const label = npcLabel(npc)
  /* DRAFT — VOICE PASS NEEDED */
  const bodies: Record<string, string[]> = {
    neo: [
      'Governor. I will be covering your administration. My readers expect the truth — I trust you do too.',
    ],
    dayo: [
      'Governor, Comrade Dayo Afolabi. Young Lagos worked for your victory. We expect you to work for us.',
    ],
    smj: [
      'Congratulations on the win, Governor. I was in the room when the party chose you. Let us keep it that way.',
    ],
  }
  const variants = bodies[charId] ?? ['Welcome to office, Governor.']
  const idx = state.week % variants.length

  return {
    id: nextId(),
    from: charId,
    fromLabel: label,
    week: state.week,
    subject: charId === 'neo' ? 'Watching' : charId === 'dayo' ? 'The youth expect better' : 'A word from the party',
    body: variants[idx],
    tone: charId === 'neo' ? 'neutral' : charId === 'dayo' ? 'warm' : 'neutral',
    read: false,
  }
}

/** NPC escalation message — when pressure reaches threshold */
export function generateNPCEscalationMessage(
  state: GameState,
  _slot: NPCKey,
  npc: NPCState,
  linkedEventId?: string,
): InboxMessage | null {
  if (!npc.isActive) return null
  const charId = npcCharacterId(npc)
  const label = npcLabel(npc)
  /* DRAFT — VOICE PASS NEEDED */
  const bodies: Record<string, string[]> = {
    neo: ['I am picking up something concerning. My sources say your administration is not as clean as it claims. I will be watching closely.'],
    dayo: ['The streets are talking, Governor. Young people are losing patience. When the budget fails the poor, they do not forget at the ballot box.'],
    smj: ['A friendly word from someone who wants you to succeed. Certain people are getting nervous. You might want to reach out before they act.'],
  }
  const variants = bodies[charId] ?? ['I need to speak with you, Governor.']
  const idx = state.week % variants.length

  return {
    id: nextId(),
    from: charId,
    fromLabel: label,
    week: state.week,
    subject: charId === 'neo' ? 'I have questions' : charId === 'dayo' ? 'Unrest brewing' : 'A quiet warning',
    body: variants[idx],
    tone: charId === 'neo' ? 'urgent' : 'urgent',
    read: false,
    linkedEventId,
  }
}

/** Chief of Staff periodic briefing (every 4 weeks) */
export function generateChiefOfStaffBriefing(state: GameState): InboxMessage {
  const cash = state.stats.cashReserve
  const trust = state.stats.publicTrust
  const pc = state.stats.politicalCapital
  const week = state.week

  let cashLine: string
  if (cash < 0) cashLine = `we are overdrawn by ₦${Math.abs(cash).toFixed(1)}bn — emergency measures needed`
  else if (cash < 10) cashLine = `reserves are critically low at ₦${cash.toFixed(1)}bn`
  else if (cash < 40) cashLine = `reserves at ₦${cash.toFixed(1)}bn — stable but lean`
  else cashLine = `reserves healthy at ₦${cash.toFixed(1)}bn`

  const trustFmt = Math.round(trust)
  const pcFmt    = Math.round(pc)

  let trustLine: string
  if (trust < 25) trustLine = `public trust is dangerously low at ${trustFmt}% — the streets are restless`
  else if (trust < 45) trustLine = `trust sitting at ${trustFmt}% — fragile`
  else trustLine = `trust at ${trustFmt}% — no alarm`

  let pcLine: string
  if (pc < 20) pcLine = `political capital almost exhausted at ${pcFmt}/200`
  else if (pc < 50) pcLine = `we are running low on political capital (${pcFmt}/200)`
  else pcLine = `political capital at ${pcFmt}/200 — room to manoeuvre`

  /* DRAFT — VOICE PASS NEEDED */
  const variants = [
    `Governor. Quick position: ${cashLine}. ${trustLine}. ${pcLine}. I will have a fuller briefing on your desk by morning.`,
    `Morning, Governor. The numbers this week: ${cashLine}. On the political front, ${trustLine}. ${pcLine}. A few things crossing my desk that need your eye.`,
    `Briefing for week ${week}. ${cashLine}. ${trustLine}. ${pcLine}. Suggest we prioritise shoring up our position before the next quarter.`,
  ]
  const idx = week % variants.length

  return {
    id: nextId(),
    from: 'chief-of-staff',
    fromLabel: 'Chief of Staff',
    week,
    subject: week % 12 === 0 ? 'Quarterly Position Report' : week % 4 === 0 ? 'Weekly Briefing' : 'Briefing',
    body: variants[idx],
    tone: cash < 0 ? 'urgent' : cash < 10 ? 'cold' : 'neutral',
    read: false,
  }
}

/** Commissioner message — on appointment or low loyalty warning */
export function generateCommissionerMessage(
  state: GameState,
  role: CommissionerRole,
  commissioner: CommissionerState,
  reason: 'appointed' | 'low-loyalty',
): InboxMessage | null {
  const label = commissionerLabel(role, commissioner)
  /* DRAFT — VOICE PASS NEEDED */
  if (reason === 'appointed') {
    const bodies: string[] = [
      `Thank you for the appointment, Governor. I look forward to serving Lagos. I have reviewed the ministry's books — there are things that need your attention.`,
    ]
    return {
      id: nextId(),
      from: 'commissioner',
      fromLabel: label,
      week: state.week,
      subject: 'Thank you for the appointment',
      body: bodies[state.week % bodies.length],
      tone: commissioner.loyalty >= 50 ? 'warm' : 'neutral',
      read: false,
    }
  }

  if (reason === 'low-loyalty') {
    const bodies: string[] = [
      'Governor, I must be frank. My ministry has been sidelined consistently. My team is demoralised. I need to know if I still have your confidence — because if I do not, there are others who would value my experience.',
    ]
    return {
      id: nextId(),
      from: 'commissioner',
      fromLabel: label,
      week: state.week,
      subject: 'I need clarity',
      body: bodies[state.week % bodies.length],
      tone: 'cold',
      read: false,
    }
  }

  return null
}

const DEPUTY_LABELS: Record<DeputyKey, string> = {
  technocrat: 'Deputy Gov. Tunde Balogun-Coker',
  politician: 'Deputy Gov. Amaka Obiora',
  loyalist: 'Deputy Gov. Korede Adeyemi-Shaw',
  reformer: 'Deputy Gov. Kanyinsola Fashola-Eze',
  traditionalist: 'Deputy Gov. Adewole Fasanya',
  economist: 'Deputy Gov. Chioma Nwosu-Adegbite',
  'security-chief': 'Deputy Gov. Kamoru Adesina',
}

/** Deputy message — on resentment threshold crossed */
export function generateDeputyMessage(
  state: GameState,
  deputyKey: DeputyKey,
): InboxMessage | null {
  const deputy = state.deputy
  if (!deputy) return null
  /* DRAFT — VOICE PASS NEEDED */
  const bodies: Record<DeputyKey, string[]> = {
    technocrat: ['Governor, the infrastructure plan is stalling. I cannot deliver results if the funding keeps getting diverted. My reputation is on the line.'],
    politician: ['The LG chairmen are getting restless. They feel you are ignoring them. I have been defending you but my arguments are wearing thin.'],
    loyalist: ['I have stood by you through everything. But I am hearing things that worry me. If there is something you need to tell me, now is the time.'],
    reformer: ['You know why I took this job. If we are going to compromise on every principle, I do not see what I am doing here.'],
    traditionalist: ['The traditional council is asking questions. Your relationship with the godfathers affects how they see you. I need something to tell them.'],
    economist: ['Governor, the debt situation is worse than the public numbers show. If we do not act soon, the bond market will act for us.'],
    'security-chief': ['Security intelligence is concerning. Certain actors are testing our response. We need to be visible in the coming weeks.'],
  }
  const variants = bodies[deputyKey] ?? ['Governor, we need to talk.']
  const idx = state.week % variants.length

  return {
    id: nextId(),
    from: 'deputy',
    fromLabel: DEPUTY_LABELS[deputyKey] ?? 'Deputy Governor',
    week: state.week,
    subject: 'We need to talk',
    body: variants[idx],
    tone: deputy.resentment >= 60 ? 'urgent' : 'neutral',
    read: false,
  }
}

/**
 * Cap the inbox so it stays manageable over a 200+ week game. The player reads
 * recent reactions — nobody scrolls to week-3 flavor at week 180 — so older
 * messages simply drop off. Two invariants:
 *   1. Anything still needing action (an un-actioned godfather ask) is ALWAYS kept,
 *      regardless of age, so a pending demand can never be pruned away.
 *   2. Otherwise keep the most recent `cap` messages (inbox is in append order).
 * Original append order is preserved; the result may slightly exceed `cap` if
 * there are many pending asks (correctness over an exact count).
 */
export const INBOX_CAP = 50

export function pruneInbox(inbox: InboxMessage[], cap = INBOX_CAP): InboxMessage[] {
  if (inbox.length <= cap) return inbox
  const needsAction = (m: InboxMessage) => m.isGodfatherAsk === true && m.actioned !== true
  const mustKeepIds = new Set(inbox.filter(needsAction).map((m) => m.id))
  const recentIds = new Set(
    inbox.filter((m) => !mustKeepIds.has(m.id)).slice(-cap).map((m) => m.id),
  )
  return inbox.filter((m) => mustKeepIds.has(m.id) || recentIds.has(m.id))
}
