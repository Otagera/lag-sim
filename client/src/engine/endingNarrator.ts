import { getGoal, getGoalIsMet, getGoalProgress } from '../data/goals'
import type { GameOverType, GameState, TimelineEntry } from '../state/types'

function hashInt(seed: string): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h + seed.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

function pickVariant(variants: string[], seed: string): string {
  return variants[hashInt(seed) % variants.length]
}

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function worstLGA(state: GameState): { key: string; label: string; approval: number } {
  let worstKey = 'lagosIsland'
  let worstVal = Infinity
  for (const [k, v] of Object.entries(state.constituencyApproval)) {
    if (v < worstVal) {
      worstVal = v
      worstKey = k
    }
  }
  const labels: Record<string, string> = {
    lagosIsland: 'Lagos Island',
    etiOsa: 'Eti Osa',
    ibejuLekki: 'Ibeju-Lekki',
    surulere: 'Surulere',
    amuwoOdofin: 'Amuwo Odofin',
    apapa: 'Apapa',
    oshodiIsolo: 'Oshodi/Isolo',
    mushin: 'Mushin',
    shomolu: 'Shomolu',
    kosofe: 'Kosofe',
    lagosMainland: 'Lagos Mainland',
    ikeja: 'Ikeja',
    alimosho: 'Alimosho',
    agege: 'Agege',
    ifakoIjaye: 'Ifako/Ijaye',
    badagry: 'Badagry',
    epe: 'Epe',
    ikorodu: 'Ikorodu',
    ojo: 'Ojo',
    ajeromiIfelodun: 'Ajeromi/Ifelodun',
  }
  return { key: worstKey, label: labels[worstKey] ?? worstKey, approval: worstVal }
}

function formatDelta(v: number): string {
  return v >= 0 ? `+${v.toFixed(0)}` : v.toFixed(0)
}

type ScoredTimelineEntry = TimelineEntry & { score: number }

function scoreTimelineEntry(entry: TimelineEntry, state: GameState): number {
  const typeWeight: Record<string, number> = {
    godfather: 10,
    milestone: 6,
    'delayed-consequence': 5,
    event: 4,
  }
  const typeScore = typeWeight[entry.type] ?? 3
  const statScore = entry.statDelta
    ? Object.values(entry.statDelta).reduce((a, b) => a + Math.abs(b ?? 0), 0)
    : 0
  const factionScore = entry.factionDelta
    ? Object.values(entry.factionDelta).reduce((a, b) => a + Math.abs(b ?? 0), 0)
    : 0
  const crisisBonuses = [
    'riot',
    'emergency',
    'impeachment',
    'removal',
    'protest',
    'uprising',
    'looting',
    'arrest',
    'indictment',
    'collapse',
    'scandal',
    'inquiry',
  ]
  const narrativeBonus = crisisBonuses.some(
    (kw) => entry.title.toLowerCase().includes(kw) || entry.description.toLowerCase().includes(kw),
  )
    ? 8
    : 0

  const recentPenalty = state.week - entry.week > 100 ? -3 : 0

  return typeScore + statScore * 0.5 + factionScore * 0.5 + narrativeBonus + recentPenalty
}

function pickKeyMoments(state: GameState, count: number, seed: string): ScoredTimelineEntry[] {
  if (state.timeline.length === 0) return []

  const scored = state.timeline.map((e) => ({
    ...e,
    score: scoreTimelineEntry(e, state),
  }))

  scored.sort((a, b) => b.score - a.score)

  const top = scored.slice(0, count * 2)

  const offset = hashInt(`${seed}moments`) % Math.max(1, top.length - count + 1)
  return top.slice(offset, offset + count)
}

function goalLine(state: GameState): string {
  if (!state.selectedGoalId) return ''
  const goal = getGoal(state.selectedGoalId)
  if (!goal) return ''
  const met = getGoalIsMet(goal, state)
  const progress = getGoalProgress(goal, state)
  if (met) {
    return `The goal you set — "${goal.title}" — you achieved. ${goal.flavorClosing}`
  }
  return `You set out to "${goal.title}". You reached ${progress.toFixed(0)}% of the way. ${goal.flavorClosing}`
}

function pickProject(state: GameState, seed: string): string | null {
  const projectFlags = Object.keys(state.stateFlags).filter(
    (f) =>
      f.includes('hub') ||
      f.includes('construction') ||
      f.includes('built') ||
      f.includes('completed') ||
      f.includes('commissioned') ||
      f.includes('laboratory') ||
      f.includes('forensic') ||
      f.includes('hospital') ||
      f.includes('school') ||
      f.includes('road') ||
      f.includes('market') ||
      f.includes('terminal') ||
      f.includes('plant') ||
      f.includes('dump') ||
      f.includes('bus') ||
      f.includes('rail') ||
      f.includes('metro'),
  )
  if (projectFlags.length === 0) {
    const projects = state.capitalProjects.filter((p) => p.status === 'completed')
    if (projects.length === 0) return null
    const idx = hashInt(`${seed}project`) % projects.length
    return projects[idx].name
  }
  const idx = hashInt(`${seed}flag`) % projectFlags.length
  return projectFlags[idx].replace(/-/g, ' ')
}

function overheadsDiagnosis(state: GameState): string {
  const exp = state.lastWeekExpenditure
  if (!exp || exp.total <= 0) return ''
  const overheadPct = ((exp.overheads / exp.total) * 100).toFixed(0)
  const debtPct = ((exp.debtInterest / exp.total) * 100).toFixed(0)
  const biggestIsOverheads = exp.overheads > exp.debtInterest
  return `Overheads were ₦${exp.overheads.toFixed(1)}bn/week — ${overheadPct}% of everything you spent. ${biggestIsOverheads ? `The bleed you could see but didn't stop finally caught you.` : `Debt service consumed ${debtPct}% of expenditure. The borrowing caught up.`}`
}

// ── Fragment families per exit path ───────────────────────────

const BANKRUPTCY_OPENINGS = [
  'Insolvent. {diagnosis} Civil servants went unpaid. The treasury — empty — had nothing left to give.',
  'The account hit zero and kept going. {diagnosis} Three weeks of negative cash, no bridge loan left, no miracle. Lagos stopped paying.',
  'The numbers finally caught up. {diagnosis} The government that could not stop spending met the treasurer who could not find money.',
]

const BANKRUPTCY_ACHIEVEMENTS = [
  'But this is also true: trust stood at {trust}. Security at {security}. Infrastructure at {infra}. {project} — you built that. Civil society {csDescription}.',
  'The story is not only the fall. Trust was {trust}. Security reached {security}. {project} was your doing, and it worked. The books do not tell the whole story.',
  'Before the collapse, you had built something. {project} — proof that something worked. Trust at {trust}. Security at {security}. The city was safer than you found it.',
]

const BANKRUPTCY_CLOSINGS = [
  'Every number tells you what went wrong. And every number also tells you that it was worth trying. Start again. Do not make the same mistake.',
  'I see exactly what killed this term — and I know which lever could have closed it. Next time, pull it before the bleed becomes a flood.',
  'A failure diagnosed is a failure that teaches. The overheads. The debt service. The revenue you could not grow fast enough. You know now. Play again.',
]

const FEDERAL_OPENINGS = [
  'The federal government took over Lagos State administration. Federal relations had fallen to {fedRel}. Infrastructure — at {infra} — was too weak to resist the takeover.',
  'Abuja moved in. When federal relationship hits {fedRel} and infrastructure sits at {infra}, the constitution provides a mechanism. Abuja used it.',
  'The flag at the State House flies both colours now. Federal takeover. {fedRel} on federal relationship and {infra} on infrastructure — the threshold was crossed and the constitution did the rest.',
]

const FEDERAL_ACHIEVEMENTS = [
  'Before the takeover, you achieved things. Trust at {trust}. Security at {security}. {project} — that was yours. {goalFragment}',
  'In your time, {project} was built. Trust reached {trust}. The books, despite everything, showed {cash}bn at best. {goalFragment}',
]

const FEDERAL_CLOSINGS = [
  'The federal government will administer Lagos until new elections. Your term is over — but the work you did is not erased.',
  'A takeover ends your administration but not your record. The numbers tell both stories: what you built and what you could not protect.',
]

const UPRISING_OPENINGS = [
  'The streets rose. Trust had fallen to {trust}%, youth tension at {youth}%. The city became ungovernable — not through riot alone, but through the slow withdrawal of consent.',
  'Mass uprising. When trust hits {trust}% and youth tension reaches {youth}%, the social contract tears. Lagosians stopped believing.',
  'The protests did not start this week. They started the week trust dropped below {trust}% and youth tension climbed past {youth}%. The streets were the final chapter of a long story.',
]

const UPRISING_ACHIEVEMENTS = [
  'Even so, before the collapse: security at {security}. Infrastructure at {infra}. {project} — you commissioned that. The record stands even if the term fell.',
  'Before the uprising, you had achievements. {project} was your doing. Security reached {security}. The city worked in ways it had not before.',
]

const UPRISING_CLOSINGS = [
  'A government that loses the streets loses everything. Next time, invest in the young before they stop believing.',
  'The uprising ends this administration but the lesson remains: trust is not optional. It is the only currency that matters in the end.',
]

const IMPEACHMENT_OPENINGS_DEFIED = [
  'You defied the Assembly and they removed you. The Lagos State House of Assembly — a machine of 40 members, each with a godfather, each with a price — voted you out. Defiance was the cause; the removal was the consequence.',
  'You chose to fight. The Assembly chose to remove you. In Lagos politics, defiance without a shield (civil society, the courts, the federal government) is a gamble. This time, it did not pay.',
]

const IMPEACHMENT_OPENINGS_CONCEDED = [
  'You conceded before the vote. The Assembly had its pound of flesh — the godfathers had their way. The concession preserved the forms of legitimacy but the political reality was clear: the machine held.',
  'Concession spared you the spectacle of a floor vote but the outcome was the same. The party godfathers, backed by the Assembly, had the numbers. You chose to leave rather than be dragged out.',
]

const IMPEACHMENT_ACHIEVEMENTS = [
  'They removed you, but they cannot remove what you built. {project} stands. Trust at {trust}. Security at {security}. Your term was not nothing.',
  'Before the Assembly moved, you had accomplished things. {project}. {goalFragment}. The exit was ugly. The record is yours.',
]

const IMPEACHMENT_CLOSINGS = [
  'The godfathers won this round. The lesson: defy only when you have the shield to survive it. Next time, build the shield first.',
  'Removal is not erasure. You governed, you built, and the machine pushed back. Play again — this time, know what you are up against.',
]

const PRIMARY_OPENINGS = [
  'You lost the primary to Hon. Seun Majekodunmi. {primaryWhy}. The re-election bid ended before the general election began.',
  'The party chose another candidate. {primaryWhy}. Your term as governor ends not with a general election defeat but with a primary loss — a different kind of rejection.',
]

function primaryWhy(state: GameState): string {
  if (state.stateFlags['primary-b-grassroots']) {
    const lgaResult = state.lgaElectionResult ?? 0
    if (lgaResult >= 60)
      return 'The grassroots delivered your LGA base but the party machinery held against you'
    return 'Without the LGA delegate base or civil society endorsement, the ward counts did not hold'
  }
  if (state.stateFlags['primary-b-civil-society']) {
    return 'Despite civil society credibility, the party machinery favoured the establishment candidate'
  }
  return 'Scenario B primary — the numbers did not align in your favour'
}

const PRIMARY_ACHIEVEMENTS = [
  'But your record as governor is real. {project} was built on your watch. Trust reached {trust}. Security stood at {security}. {goalFragment}',
  'The primary loss does not erase the term. {project}. Infrastructure at {infra}. Cash at {cash}bn. You governed. The party decided differently — that is their choice, not your record.',
]

const PRIMARY_CLOSINGS = [
  'Primary defeat stings differently from a general election loss. The system did not reject your policies — it rejected your faction. Politics is like that in Lagos. Play again.',
  'You governed, you built, and the party chose another. That is the nature of the machine. Next time, it may choose differently.',
]

const LOSS_WHY_DIAGNOSES = [
  'The election did not go your way. {badFaction} abandoned you. {worstLGA} swung against you. The vote share was {voteShare}%. Not enough.',
  'Re-election did not come. {badFaction} defected. {worstLGA} — a constituency you needed — delivered {worstLGAVal}% approval, below what the campaign required. The result: {voteShare}%.',
  'Defeat. The coalition that elected you fragmented. {badFaction} withdrew support. The margin in {worstLGA} was too thin to recover. Final vote share: {voteShare}%.',
]

function lossBadFaction(state: GameState): string {
  const labels: Record<string, string> = {
    businessCommunity: 'Business community',
    informalEconomy: 'Informal economy',
    partyGodfathers: 'Party godfathers',
    federalGovt: 'Federal government',
    civilSocietyMedia: 'Civil society and media',
    lgChairmen: 'LG chairmen',
  }
  let worstVal = Infinity
  let worstKey = ''
  for (const [key, val] of Object.entries(state.factions)) {
    if (val < worstVal) {
      worstVal = val
      worstKey = key
    }
  }
  if (!worstKey) return 'key constituencies'
  return labels[worstKey as keyof typeof labels] ?? worstKey
}

const LOSS_ACHIEVEMENTS = [
  'But you did not waste the term. {project}. Trust at {trust}. Security at {security}. Infrastructure at {infra}. {goalFragment}',
  'The loss is real. So is the record. {project} was your doing. Trust reached {trust}. Security at {security}. {goalFragment}',
]

const LOSS_CLOSINGS = [
  'The people did not return you. That is the verdict of democracy. But the work — {project}, the reforms, the infrastructure — that is not undone by an election.',
  'Defeat at the polls does not mean failure in office. The numbers tell a mixed story. Play again and hold the coalition together next time.',
]

const WIN_NARRATIVES = [
  'You held the wheel and the people returned you. {voteShare}% of the vote. {goalFragment} The city chose four more years.',
  'Re-election. {voteShare}%. The mandate is clear. {goalFragment} The second term is the chance to finish what you started.',
]

const WIN_ACHIEVEMENTS = [
  'Look at what you built. {project}. Infrastructure at {infra} — {infraDelta} from where you started. Trust at {trust}. Security at {security}. The city is measurably different.',
  'The numbers are your witness. Trust rose to {trust}. Security to {security}. Infrastructure climbed to {infra}. {project} stands as proof of what a term can build.',
]

const WIN_CLOSINGS = [
  'The legacy is not sealed yet — second term writes the final chapter. But the first term was yours, and you earned the next one.',
  'Four years down, four to go. The foundation is laid; second term is the structure. The people trusted you to build it.',
]

const SECOND_TERM_NARRATIVES = [
  'Eight years. Two terms. A full decade shaping Lagos. {goalFragment} The arc of your governorship is complete — what remains is how history writes it.',
  'Two terms in the hardest job in Nigerian politics. {goalFragment} The city you hand over is not the city you inherited. That is the measure.',
]

const SECOND_TERM_ACHIEVEMENTS = [
  'Eight years of work. {project} was the signature achievement. Infrastructure at {infra} — from {infraStart} to {infra}. Trust at {trust}. Security at {security}. Corruption — {corruption}%, down from the peak.',
  'A full two-term record. {project}. Trust peaked at {trust}. Security rose to {security}. Infrastructure climbed from {infraStart} to {infra}. The eight-year accountability index tells its own story.',
]

const SECOND_TERM_CLOSINGS = [
  'Two terms. No do-overs. The legacy is what it is — and it is yours. The next governor inherits a Lagos you shaped. That is the only verdict that matters.',
  'The books are closed. The files are clean enough. The city moves on — and you move with it into the history of those who governed Lagos. Not many do eight years. You did.',
]

// ── Verdict headline ──────────────────────────────────────────

const BANKRUPTCY_VERDICTS = [
  'The Governor Who Ran Out of Road',
  'Solvent in All the Wrong Ways',
  'The Technocrat the Numbers Undid',
]

const FEDERAL_VERDICTS = [
  'The Governor Abuja Replaced',
  'A Sovereign Subordinate',
  'Lagos Under New Management',
]

const UPRISING_VERDICTS = [
  'The Governor the Streets Rejected',
  'When Trust Runs Out',
  'A Mandate Dissolved',
]

const IMPEACHMENT_VERDICTS = [
  'Removed by the House',
  'The Machine Strikes Back',
  'Defiance and Its Price',
]

const PRIMARY_VERDICTS = [
  'Defeated Before the General',
  'The Primary That Ended It',
  'Party Above Governor',
]

const LOSS_VERDICTS = ['One Term, Not Extended', 'The Voters Chose Change', 'A Single-Term Record']

const WIN_VERDICTS = ['The Mandate Renewed', 'Four More Years', 'The People Returned You']

const SECOND_TERM_VERDICTS = [
  'Eight Years in the Hardest Job',
  'Two Terms: Legacy Sealed',
  'The Full Arc',
]

type EndingNarrativeContext = {
  seed: string
  momentsText: string
  goalFrag: string
  trust: string
  security: string
  infra: string
  infraDelta: string
  cash: string
  youth: string
  fedRel: string
  corruption: string
  voteShare: string
  project: string | null
  csDescription: string
  worstLGA: { key: string; label: string; approval: number }
}

function pickVerdict(exit: GameOverType, seed: string): string {
  switch (exit) {
    case 'bankruptcy':
      return pickVariant(BANKRUPTCY_VERDICTS, seed)
    case 'federalTakeover':
      return pickVariant(FEDERAL_VERDICTS, seed)
    case 'massUprising':
      return pickVariant(UPRISING_VERDICTS, seed)
    case 'impeachment':
      return pickVariant(IMPEACHMENT_VERDICTS, seed)
    case 'primaryLoss':
      return pickVariant(PRIMARY_VERDICTS, seed)
    case 'termEndLoss':
      return pickVariant(LOSS_VERDICTS, seed)
    case 'termEndWin':
      return pickVariant(WIN_VERDICTS, seed)
    case 'secondTermEnd':
      return pickVariant(SECOND_TERM_VERDICTS, seed)
  }
}

function buildEndingContext(state: GameState, exit: GameOverType): EndingNarrativeContext {
  const seed = `ending-${exit}-${state.week}-${state.stats.publicTrust.toFixed(0)}-${state.stats.cashReserve.toFixed(0)}-${state.timeline.length}`
  const moments = pickKeyMoments(state, 2, seed)
  const csScore = state.factions.civilSocietyMedia
  return {
    seed,
    momentsText:
      moments.length > 0 ? `${moments.map((m) => `${capitalise(m.title)}`).join('. ')}.` : '',
    goalFrag: goalLine(state),
    trust: state.stats.publicTrust.toFixed(0),
    security: state.stats.securityIndex.toFixed(0),
    infra: state.stats.infrastructureScore.toFixed(0),
    infraDelta: formatDelta(state.stats.infrastructureScore - 42),
    cash: state.stats.cashReserve.toFixed(1),
    youth: state.stats.youthTension.toFixed(0),
    fedRel: state.stats.federalRelationship.toFixed(0),
    corruption: state.stats.corruptionPressure.toFixed(0),
    voteShare: state.electionResult !== null ? state.electionResult.toFixed(1) : '?',
    project: pickProject(state, seed),
    csDescription:
      csScore >= 60 ? 'endorsed you' : csScore >= 40 ? 'stayed engaged' : 'turned against you',
    worstLGA: worstLGA(state),
  }
}

function fillEndingTemplate(text: string, state: GameState, ctx: EndingNarrativeContext): string {
  return text
    .replace(/\{diagnosis\}/g, overheadsDiagnosis(state))
    .replace(/\{trust\}/g, ctx.trust)
    .replace(/\{security\}/g, ctx.security)
    .replace(/\{infra\}/g, ctx.infra)
    .replace(/\{infraDelta\}/g, ctx.infraDelta)
    .replace(/\{infraStart\}/g, '42')
    .replace(/\{cash\}/g, ctx.cash)
    .replace(/\{youth\}/g, ctx.youth)
    .replace(/\{fedRel\}/g, ctx.fedRel)
    .replace(/\{corruption\}/g, ctx.corruption)
    .replace(/\{project\}/g, ctx.project ?? 'your work')
    .replace(/\{goalFragment\}/g, ctx.goalFrag)
    .replace(/\{voteShare\}/g, ctx.voteShare)
    .replace(/\{csDescription\}/g, ctx.csDescription)
    .replace(/\{worstLGA\}/g, ctx.worstLGA.label)
    .replace(/\{worstLGAVal\}/g, ctx.worstLGA.approval.toFixed(0))
    .replace(/\{badFaction\}/g, lossBadFaction(state))
    .replace(/\{primaryWhy\}/g, primaryWhy(state))
    .replace(/\{moments\}/g, ctx.momentsText)
}

function composeEndingParagraphs(
  state: GameState,
  ctx: EndingNarrativeContext,
  opening: string,
  achievements: string,
  closing: string,
): string {
  const fill = (text: string) => fillEndingTemplate(text, state, ctx)
  const momentsPrefix = ctx.momentsText ? `${ctx.momentsText} ` : ''
  return `${fill(opening)}\n\n${fill(achievements)}\n\n${momentsPrefix}${fill(closing)}`
}

function buildNarrativeForExit(
  state: GameState,
  exit: GameOverType,
  ctx: EndingNarrativeContext,
): string {
  switch (exit) {
    case 'bankruptcy':
      return composeEndingParagraphs(
        state,
        ctx,
        pickVariant(BANKRUPTCY_OPENINGS, `${ctx.seed}o`),
        pickVariant(BANKRUPTCY_ACHIEVEMENTS, `${ctx.seed}a`),
        pickVariant(BANKRUPTCY_CLOSINGS, `${ctx.seed}c`),
      )
    case 'federalTakeover':
      return composeEndingParagraphs(
        state,
        ctx,
        pickVariant(FEDERAL_OPENINGS, `${ctx.seed}o`),
        pickVariant(FEDERAL_ACHIEVEMENTS, `${ctx.seed}a`),
        pickVariant(FEDERAL_CLOSINGS, `${ctx.seed}c`),
      )
    case 'massUprising':
      return composeEndingParagraphs(
        state,
        ctx,
        pickVariant(UPRISING_OPENINGS, `${ctx.seed}o`),
        pickVariant(UPRISING_ACHIEVEMENTS, `${ctx.seed}a`),
        pickVariant(UPRISING_CLOSINGS, `${ctx.seed}c`),
      )
    case 'impeachment':
      return buildImpeachmentNarrative(state, ctx)
    case 'primaryLoss':
      return composeEndingParagraphs(
        state,
        ctx,
        pickVariant(PRIMARY_OPENINGS, `${ctx.seed}o`),
        pickVariant(PRIMARY_ACHIEVEMENTS, `${ctx.seed}a`),
        pickVariant(PRIMARY_CLOSINGS, `${ctx.seed}c`),
      )
    case 'termEndLoss':
      return composeEndingParagraphs(
        state,
        ctx,
        pickVariant(LOSS_WHY_DIAGNOSES, `${ctx.seed}w`),
        pickVariant(LOSS_ACHIEVEMENTS, `${ctx.seed}a`),
        pickVariant(LOSS_CLOSINGS, `${ctx.seed}c`),
      )
    case 'termEndWin':
      return composeEndingParagraphs(
        state,
        ctx,
        pickVariant(WIN_NARRATIVES, `${ctx.seed}n`),
        pickVariant(WIN_ACHIEVEMENTS, `${ctx.seed}a`),
        pickVariant(WIN_CLOSINGS, `${ctx.seed}c`),
      )
    case 'secondTermEnd':
      return composeEndingParagraphs(
        state,
        ctx,
        pickVariant(SECOND_TERM_NARRATIVES, `${ctx.seed}n`),
        pickVariant(SECOND_TERM_ACHIEVEMENTS, `${ctx.seed}a`),
        pickVariant(SECOND_TERM_CLOSINGS, `${ctx.seed}c`),
      )
  }
}

function buildImpeachmentNarrative(state: GameState, ctx: EndingNarrativeContext): string {
  const defied = state.timeline.some(
    (e) => e.title === 'Removal Resolution: First Reading' && e.description === 'Defy the Assembly',
  )
  const openings = defied ? IMPEACHMENT_OPENINGS_DEFIED : IMPEACHMENT_OPENINGS_CONCEDED
  return composeEndingParagraphs(
    state,
    ctx,
    pickVariant(openings, `${ctx.seed}o`),
    pickVariant(IMPEACHMENT_ACHIEVEMENTS, `${ctx.seed}a`),
    pickVariant(IMPEACHMENT_CLOSINGS, `${ctx.seed}c`),
  )
}

// ── Main assembly ─────────────────────────────────────────────

export function buildEndingNarrative(state: GameState, exit: GameOverType): string {
  const ctx = buildEndingContext(state, exit)
  return buildNarrativeForExit(state, exit, ctx).trim()
}

export function pickVerdictHeadline(state: GameState, exit: GameOverType): string {
  const seed = `verdict-${state.week}-${state.stats.publicTrust.toFixed(0)}`
  return pickVerdict(exit, seed)
}

export function pickKeyMomentsForLegacy(state: GameState): ScoredTimelineEntry[] {
  const seed = `legacy-moments-${state.week}-${state.stats.publicTrust.toFixed(0)}`
  return pickKeyMoments(state, 4, seed)
}
