import type { Choice, ConsequenceBeat, GameState } from '../state/types'

/* ============================================================
 * Phase B — Emotional Consequence Text
 *
 * Given a choice just made with its deltas and the state before
 * and after, return a narrative beat assembled DETERMINISTICALLY
 * from templated fragments. No LLM. Pure function.
 * ============================================================ */

// ── Priority tiers ────────────────────────────────────────────
// Higher-numbered tier wins when magnitudes are within ±3 of each other.
interface ChangeCandidate {
  key: string
  delta: number
  tier: number
}

const TIER: Record<string, number> = {
  partyGodfathers: 100,
  federalGovt: 95,
  publicTrust: 50,
  civilSocietyMedia: 30,
  corruptionPressure: 25,
  youthTension: 20,
  securityIndex: 15,
  cashReserve: 10,
  infrastructureScore: 8,
  businessCommunity: 5,
  informalEconomy: 5,
  lgChairmen: 5,
}

// Minimum absolute change to trigger a beat (cash uses smaller threshold)
const THRESHOLD: Record<string, number> = {
  cashReserve: 0.5,
}

function minDelta(key: string): number {
  return THRESHOLD[key] ?? 2
}

// ── Deterministic hash (stable across renders) ───────────────
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

// ── State-aware specifics ────────────────────────────────────
const CONSTITUENCY_LABELS: Record<string, string> = {
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

function worstLGA(state: GameState): { key: string; label: string; approval: number } {
  let worstKey = 'lagosIsland'
  let worstVal = Infinity
  for (const [k, v] of Object.entries(state.constituencyApproval)) {
    if (v < worstVal) {
      worstVal = v
      worstKey = k
    }
  }
  return { key: worstKey, label: CONSTITUENCY_LABELS[worstKey] ?? worstKey, approval: worstVal }
}

function pickStableLGA(state: GameState, seed: string): string {
  const keys = Object.keys(state.constituencyApproval).sort()
  const idx = hashInt(seed + 'lga') % keys.length
  return CONSTITUENCY_LABELS[keys[idx]] ?? keys[idx]
}

// ── Fragment families ────────────────────────────────────────

interface FragmentFamily {
  tone: ConsequenceBeat['tone']
  variants: string[]
  draft: boolean // true = agent-written, needs voice pass
}

const FAMILIES: Record<string, FragmentFamily> = {

  'godfather-drop': {
    tone: 'grim',
    draft: false,
    variants: [
      '{godfather} doesn\'t call. The silence is the message. By Friday, a contractor you\'ve never met has been "recommended" for the {worstLGA} road — a test of whether you\'re listening.',
      'At the party secretariat, word spreads before you\'ve left your office. {godfather}\'s man in the room doesn\'t meet your eyes. The message is delivered without words.',
      'The party WhatsApp groups have gone cold. Not hostile — cold. In Lagos politics, cold is what comes before hostile.',
    ],
  },

  'godfather-rise': {
    tone: 'hollow',
    draft: false,
    variants: [
      'The calls come through. Warm, familiar. {godfather}\'s voice on the line, asking after your family. The price, as always, is not mentioned on the call.',
      '{godfather}\'s man is in the room at the cabinet meeting — not speaking, just present. The chairman of the Governor\'s Advisory Council nods once in your direction. A small thing. Everything.',
      'The party WhatsApp groups light up again. Emojis. Praise. The machine has accepted you back. The relief is real. So is the bill.',
    ],
  },

  'trust-gain-crisis': {
    tone: 'hollow',
    draft: false,
    variants: [
      'The headlines are kind today. But in {worstLGA}, where the water still rises and the demolition notices haven\'t been withdrawn, kindness in the papers buys nothing.',
      'Approval ticks up. A focus group in {worstLGA} shows the gap — they see the effort, but effort doesn\'t fix the drainage. "He tries," one woman says. "Trying isn\'t enough."',
      'Your pollster calls with good news. Then he pauses. "{worstLGA} is still at the bottom. Everywhere else has moved. They\'re watching to see if you notice them."',
    ],
  },

  'trust-gain': {
    tone: 'hopeful',
    draft: false,
    variants: [
      'For once, the chatter at the bus stop is not about who failed. A trader in {randomLGA} tells her customers: "This one might actually be different." That kind of thing spreads slowly. It also sticks.',
      'A letter arrives, handwritten, from an old man in Surulere. "Thank you," it says. No demands. No threats. Just those two words. Your Chief of Staff leaves it on your desk without comment.',
      'The Lagos FM call-in show this morning took twelve callers. Nine of them said something positive — not effusive, not partisan, just positive. The presenter sounded almost startled.',
    ],
  },

  'trust-drop': {
    tone: 'grim',
    draft: false,
    variants: [
      'By 9am, the story is already in twelve different WhatsApp groups. By noon, there is a meme. Your press office is drafting a response to a version of events that has already moved on.',
      'A woman in {worstLGA} tells a Channels TV camera: "They are all the same." The clip reaches 2 million views before your media team can draft a response. By then it doesn\'t matter.',
      'Garri prices at the {randomLGA} market jumped 40% last week. Nobody draws that line to monetary policy. They draw it to you. In Lagos, everything broken belongs to the governor.',
    ],
  },

  'hollow-win': {
    tone: 'hollow',
    draft: false,
    variants: [
      'On paper, a victory. In the treasury, the same red. The applause costs more than it looks.',
      'The numbers move in the right direction. The Accountant-General notes it without celebrating — he can see the cash position behind the headline figure, and he is not celebrating.',
      'A genuine win, made honestly, in a hole. The civil servants who will benefit from it work in offices that haven\'t seen a budget reallocation in three years. They\'ll take it.',
    ],
  },

  'clean-but-costly': {
    tone: 'hollow',
    draft: false,
    variants: [
      'The right thing, done the right way. Your Finance Commissioner thinks you\'re being naïve. Maybe. But for the first time this month, you can read the accounts without flinching.',
      'You sign the directive. No kickback. No "mobilisation fee." Your staff exchange a glance. This is not how things are done. Perhaps that is the point.',
      'A clean procurement, properly tendered. The contractor who didn\'t win the job is already lobbying against you. The one who did doesn\'t know your name. That is how you know you got it right.',
    ],
  },

  'corruption-up': {
    tone: 'grim',
    draft: false,
    variants: [
      'The Permanent Secretary smiles when he hands you the file. That smile has a number attached to it. You don\'t ask what it is. You already know not to ask.',
      'A memo crosses your desk with figures that don\'t reconcile. You sign it anyway. The arithmetic of Lagos politics does not require honesty — it requires momentum, and momentum has a price.',
      'Your Commissioner for Works mentions the "mobilisation fee" the way he mentions traffic — as weather. Routine. Structural. You do not correct him. That is the decision.',
    ],
  },

  'youth-up': {
    tone: 'tense',
    draft: false,
    variants: [
      '#LagosSpeaks is trending again. The demands are not unreasonable — that is what makes them harder to dismiss. Young people who have stopped asking politely are in a different register entirely.',
      'A protest outside the UNILAG main gate starts over a lighting bill and becomes something larger by 3pm. It is never about the lighting bill. Your police commissioner calls. His voice is tight.',
      'Young men in {worstLGA} have formed what they call a "monitoring team." Your security coordinator uses blunter language. You tell him to wait. Patience is thinning on both sides.',
    ],
  },

  'defiance': {
    tone: 'tense',
    draft: false,
    variants: [
      'You have chosen the hard way. Your staff doesn\'t applaud — they watch. Every directive meets a new form of resistance, every memo a fresh silence. The system has reflexes you haven\'t mapped yet.',
      'The directive leaves your desk. It will be implemented — eventually, and through layers of people who wished you hadn\'t signed it. But it left. In Lagos, a signed directive that actually leaves is not nothing.',
      'Your Chief of Staff raises an eyebrow. Says nothing. The system has absorbed bolder gestures than this and continued as before. But you signed it anyway. That counts.',
    ],
  },

  'civil-gain': {
    tone: 'hopeful',
    draft: false,
    variants: [
      'A SERAP statement arrives, measured, almost complimentary. Your media aide prints it and pins it to the Secretariat notice board. Small wins are still wins.',
      'The NGO coalition holds a press briefing. "Cautious optimism," their statement says. In Lagos, cautious optimism from civil society is a standing ovation.',
      'For the first time this month, The Guardian editorial is not a rebuke. Your Chief of Staff reads it twice, then walks into your office and places it on your desk without comment.',
    ],
  },

  'civil-drop': {
    tone: 'tense',
    draft: false,
    variants: [
      'By 9am the civic coalition\'s letter is in the group chats. By noon it is a thread. By 3pm your press office is drafting a response to a story that has already moved on without them.',
      'The NUJ Lagos chapter issues a statement your media aide learns about from X, not from the PR firm. That is the problem — not the statement itself, but the fact that it arrived that way.',
      'A SERAP press release sits in your inbox, flagged by your Chief of Staff. "This one has claws," she has written in the margin. It does.',
    ],
  },

  'youth-down': {
    tone: 'hopeful',
    draft: false,
    variants: [
      'The NANS branch secretary from UNILAG calls to say the planned march is postponed. Not cancelled — postponed. For now, that is enough.',
      'The boys at the Agege motor park are watching the news again, not the streets. Tension has a temperature. Today it dropped a degree.',
      'An audio note circulating on WhatsApp this morning was different — not anger, just exhaustion, and a grudging acknowledgement that something shifted. That kind of shift is worth protecting.',
    ],
  },

  'security-win': {
    tone: 'neutral',
    draft: false,
    variants: [
      'The RRS unit deployed to Mushin last week has done what three press conferences couldn\'t. The night market on Lagos-Abeokuta Road reopened last night. Small radius. Genuine relief.',
      'The police commissioner\'s weekly report mentions Ikeja GRA for the first time this year — not as a flashpoint, but as a restored area. One less red mark on the map.',
      'A community leader in Badagry sends a voice note to your aide: "The road is safe at night now." He has been saying the opposite for two years.',
    ],
  },

  'security-loss': {
    tone: 'tense',
    draft: false,
    variants: [
      'The Mushin night market is closing before 7pm. Not by order — by common sense. When a market starts closing early in Lagos, the police aren\'t saying something they should be saying.',
      'Armed robbery at Berger interchange, 11pm, three vehicles. The victims posted before the police were called. Your security coordinator is watching the same Instagram story as everyone else.',
      'A community watch group in Ajegunle has started patrolling with torches. When residents organise their own security in Lagos, the state has already lost that argument.',
    ],
  },

  'cash-drop': {
    tone: 'grim',
    draft: false,
    variants: [
      'The Accountant-General calls at 7.14am. He never calls before 9. That tells you everything before he says a word. "The FAAC figure came in low, sir."',
      'Your Finance Commissioner has stopped talking about the medium-term framework. He talks in weeks now. Three contractors on the Ikorodu road project have quietly put their equipment under tarps.',
      'The weekly treasury brief arrives as an apology. The numbers are the same numbers. They just don\'t add up the same way they did last quarter.',
    ],
  },

  'cash-gain': {
    tone: 'neutral',
    draft: false,
    variants: [
      'The FAAC alert comes in ₦2.3bn above projection. Your Finance Commissioner nods slowly at the number. "This is breathing room," he says. That word — room — means everything right now.',
      'A Land Use Charge clearance from Eti-Osa estates lands at Alausa. Not transformative. But the contractors who were watching the payroll have stopped watching.',
      'For the first time in six weeks, the weekly treasury brief is not an apology. Numbers are numbers. These ones are better.',
    ],
  },

  'infra-gain': {
    tone: 'hopeful',
    draft: false,
    variants: [
      'The flyover access ramp in {randomLGA} opens without ceremony — no ribbon, no cameras. The traffic just clears itself. The contractor is already on the next job. That is what progress looks like when it is working.',
      'It rained last night. The drainage channel on Egbeda Road that was cleared last week did its job. {randomLGA} did not flood. That sounds like nothing. It is not nothing.',
      'Your Commissioner for Works clears a contractor invoice three days early. The project in {randomLGA} restarts Wednesday. On some sites, that is the only language that matters.',
    ],
  },

  'infra-loss': {
    tone: 'grim',
    draft: false,
    variants: [
      'The road on Agege Motor Road that was sealed last month is failing at the edges. The contractor used the wrong aggregate. He is not returning calls from your project office.',
      'A contractor at the {worstLGA} drainage works has stopped without notice. Your coordinator drives out. The site is empty — equipment, workers, nothing. Only a handwritten note: "Payment pending."',
      'The drainage project in {worstLGA} that was 60% complete is now 60% abandoned. The rains are eight weeks away. That is not enough time to restart the procurement process from scratch.',
    ],
  },

  'federal-gain': {
    tone: 'neutral',
    draft: false,
    variants: [
      'The Minister of Finance mentions Lagos by name at FEC — favourably. Your Abuja liaison hears it in the corridor and calls immediately. That is how federal approval travels. You will know when the tone changes.',
      'A routine call from the Presidency. The PS asks after your light rail timeline with what sounds like genuine interest. In Abuja, genuine interest in your projects is a signal. Note it.',
      'The FAAC disbursement arrives on the 15th with no unexplained deductions. In another country, that would be unremarkable. Here, you write it in the briefing notes.',
    ],
  },

  'federal-drop': {
    tone: 'tense',
    draft: false,
    variants: [
      'The FAAC remittance is ₦1.1bn short. No letter, no explanation. You call the Minister\'s office. His aide says he will pass the message. That is how Abuja declines to discuss something.',
      'A federal ministry has opened a new office in Victoria Island. Jurisdiction unclear, mandate unclear. Your Commissioner for Information has called the PS three times. Three voicemails.',
      'Everything from the Presidency now routes through the deputy chief of staff, who is polite and unhelpful in equal parts. Aso Rock is punishing Lagos at a distance, and doing it properly.',
    ],
  },

  'informal-gain': {
    tone: 'neutral',
    draft: false,
    variants: [
      'Mile 12 market recorded its highest turnover in six months last week. It arrived as a footnote in a treasury briefing. At Mile 12, turnover is a weather report for the whole informal economy.',
      'A union leader from Alaba International calls your office — not to complain, not to threaten. To say traders are doing business again. Three weeks ago his calls were about something else entirely.',
      'The agbero at the Oshodi interchange paid his licensing fee this week without a fight. That small fact — one operator complying voluntarily — is the data your informal economy team has been waiting for.',
    ],
  },

  'informal-loss': {
    tone: 'tense',
    draft: false,
    variants: [
      'Balogun Market closed for half a day. No incident, no formal notice — a PSP operator dispute with the traders\' cooperative. Small. Until things like this stop being small.',
      'The agberos at Mile 2 motor park have imposed a new "environment levy" nobody authorised. Your transport regulation office sends a letter. The agberos send it back.',
      'A spontaneous market shutdown in {worstLGA} — traders simply didn\'t open. No strike declaration, no leadership statement. Just closed gates. In Lagos, that silence organises faster than noise.',
    ],
  },

  'business-gain': {
    tone: 'neutral',
    draft: false,
    variants: [
      'A Lagos Chamber of Commerce delegation comes to the Secretariat — not to complain, which is what delegations usually come to do. They want to discuss the investment climate survey. First time they\'ve led with something positive.',
      'A major FMCG group that had been reviewing its Lagos presence has quietly taken a new long-lease on a Lekki Free Zone space. They didn\'t announce it. Your investment officer found it on a property database.',
      'At the Eko Club last night, three business contacts who have not attended a state event in eight months were in the room. Not warmly. But in the room. That distance is closing.',
    ],
  },

  'business-loss': {
    tone: 'tense',
    draft: false,
    variants: [
      'The Lagos Chamber issues a statement in the careful, hedged language of an institution that has been patient and has now stopped being patient. The language is diplomatic. The meaning isn\'t.',
      'A manufacturing group negotiating a ₦4bn Lekki Free Zone expansion has paused the process. "Regulatory uncertainty," their filing says. That phrase means they spoke to a lawyer before they called you.',
      'The BOI liaison desk in Ikeja has seen traffic drop by a third this quarter. Nobody said anything. Nobody had to. The empty desk is the statement.',
    ],
  },

  'lg-gain': {
    tone: 'neutral',
    draft: false,
    variants: [
      'The Ikorodu LGA chairman attended Monday\'s briefing himself — not a representative, himself. That small detail has a meaning everyone in the room understood and nobody stated.',
      'Three LG chairmen co-signed a project support letter this week without being asked to. Your Chief of Staff flags it at the morning brief. "That doesn\'t happen," she says.',
      'The Epe chairman calls to say the community leaders\' forum will publicly back the coastal road project on Thursday. Epe doesn\'t move early on anything. This means something.',
    ],
  },

  'lg-loss': {
    tone: 'tense',
    draft: false,
    variants: [
      'The Alimosho chairman has missed the last two Monday briefings. His office cites "scheduling conflicts." In twelve months there have been no scheduling conflicts. There is one now.',
      'A chairman in {worstLGA} has asked that future communications from your office route through his party liaison rather than his office directly. That is a polite way of ending a professional relationship.',
      'The LG council association held an extraordinary meeting. Your office was not informed. The minutes have not been shared. This is how political distance begins to organise itself formally.',
    ],
  },

  'neutral': {
    tone: 'neutral',
    draft: false,
    variants: [
      'The week ends in the ordinary way government weeks end: a 4pm briefing, three pending memos, one signed. Lagos does not notice. The work continues regardless.',
      'Something moved. Something didn\'t. The balance sheet of governance is not always legible on the day it is made. Your Chief of Staff has already moved to the next item on the list.',
      'The state moves at the speed the state moves — not fast, not without cost, not without meaning. Lagos is large enough to absorb decisions that feel small on the day they are signed.',
    ],
  },
}

// ── Family selection logic ────────────────────────────────────

/**
 * Map a winning change to its fragment family key.
 * Returns null if no family matches.
 */
function changeToFamily(
  key: string,
  delta: number,
  dir: 'gain' | 'loss',
  _state: GameState,
  nextState: GameState,
  choice: Choice,
): string | null {
  // Corruption trigger always uses its own family
  if (choice.corruptionTrigger) return 'corruption-up'

  // Hollow win: gain while insolvent — prefer this over lower-priority families
  if (dir === 'gain' && nextState.stats.cashReserve < 0 && Math.abs(delta) >= 3) {
    const tier = TIER[key] ?? 0
    if (tier < 50) return 'hollow-win' // don't override partyGodfathers/federal/trust
  }

  switch (key) {
    case 'partyGodfathers':
      return dir === 'gain' ? 'godfather-rise' : 'godfather-drop'

    case 'federalGovt':
      return dir === 'gain' ? 'federal-gain' : 'federal-drop'

    case 'publicTrust': {
      if (dir === 'loss') return 'trust-drop'
      const w = worstLGA(nextState)
      if (w.approval < 35) return 'trust-gain-crisis'
      return 'trust-gain'
    }

    case 'civilSocietyMedia':
      return dir === 'gain' ? 'civil-gain' : 'civil-drop'

    case 'corruptionPressure':
      return 'corruption-up'

    case 'youthTension':
      return dir === 'gain' ? 'youth-up' : 'youth-down'

    case 'securityIndex':
      return dir === 'gain' ? 'security-win' : 'security-loss'

    case 'cashReserve':
      // Check for hollow-win again (direct cash gain while insolvent)
      if (dir === 'gain' && nextState.stats.cashReserve < 0) return 'hollow-win'
      // Large clean spend (corruption not rising) → clean-but-costly
      if (dir === 'loss' && Math.abs(delta) >= 2 && (choice.immediate.corruptionPressure ?? 0) <= 0) {
        return 'clean-but-costly'
      }
      return dir === 'gain' ? 'cash-gain' : 'cash-drop'

    case 'infrastructureScore':
      return dir === 'gain' ? 'infra-gain' : 'infra-loss'

    case 'businessCommunity':
      return dir === 'gain' ? 'business-gain' : 'business-loss'

    case 'informalEconomy':
      return dir === 'gain' ? 'informal-gain' : 'informal-loss'

    case 'lgChairmen':
      return dir === 'gain' ? 'lg-gain' : 'lg-loss'

    default:
      return 'neutral'
  }
}

// ── Placeholder filler ───────────────────────────────────────

function fillPlaceholders(text: string, state: GameState, seed: string): string {
  const w = worstLGA(state)
  return text
    .replace(/\{worstLGA\}/g, w.label)
    .replace(/\{godfather\}/g, 'Chief Fashemu')
    .replace(/\{randomLGA\}/g, pickStableLGA(state, seed))
}

// ── Main exported function ───────────────────────────────────

export function narrateConsequence(
  choice: Choice,
  _event: { id: string },
  state: GameState,
  nextState: GameState,
  seed: string,
): ConsequenceBeat | null {
  // 1. Collect candidate changes from immediate stats and faction impacts
  const candidates: ChangeCandidate[] = []

  for (const [key, value] of Object.entries(choice.immediate)) {
    if (value === undefined || value === 0) continue
    const abs = Math.abs(value)
    if (abs < minDelta(key)) continue
    candidates.push({ key, delta: value, tier: TIER[key] ?? 0 })
  }

  for (const [key, value] of Object.entries(choice.factionImpact)) {
    if (value === undefined || value === 0) continue
    const abs = Math.abs(value)
    if (abs < minDelta(key)) continue
    candidates.push({ key, delta: value, tier: TIER[key] ?? 0 })
  }

  // 2. If corruptionTrigger, force corruption-up
  if (choice.corruptionTrigger) {
    const family = FAMILIES['corruption-up']
    const raw = pickVariant(family.variants, seed)
    const text = fillPlaceholders(raw, nextState, seed)
    return {
      text,
      tone: family.tone,
      choiceLabel: choice.label,
      choiceDescription: choice.description,
      immediate: choice.immediate,
      factionImpact: choice.factionImpact,
      politicalCapitalCost: choice.politicalCapitalCost,
    }
  }

  // 3. Check for defiance (choice sets new flags)
  if (choice.setFlags && Object.keys(choice.setFlags).length > 0) {
    const anyNew = Object.keys(choice.setFlags).some((k) => !state.stateFlags[k])
    if (anyNew && candidates.length <= 1) {
      // If the only meaningful change is the flag itself, use defiance
      const family = FAMILIES['defiance']
      const raw = pickVariant(family.variants, seed)
      const text = fillPlaceholders(raw, nextState, seed)
      return {
        text,
        tone: family.tone,
        choiceLabel: choice.label,
        choiceDescription: choice.description,
        immediate: choice.immediate,
        factionImpact: choice.factionImpact,
        politicalCapitalCost: choice.politicalCapitalCost,
      }
    }
  }

  // 4. If nothing significant changed, return null
  if (candidates.length === 0) return null

  // 5. Score and pick winner
  candidates.sort((a, b) => {
    const scoreA = Math.abs(a.delta) + a.tier
    const scoreB = Math.abs(b.delta) + b.tier
    if (scoreB !== scoreA) return scoreB - scoreA
    return b.tier - a.tier
  })

  const winner = candidates[0]
  const direction = winner.delta >= 0 ? 'gain' : 'loss'

  // 6. Map to family
  const familyKey = changeToFamily(winner.key, winner.delta, direction, state, nextState, choice)
  if (!familyKey) return null

  const family = FAMILIES[familyKey]
  if (!family) return null

  // 7. Pick variant
  const raw = pickVariant(family.variants, seed)
  const text = fillPlaceholders(raw, nextState, seed)

  return {
    text,
    tone: family.tone,
    choiceLabel: choice.label,
    choiceDescription: choice.description,
    immediate: choice.immediate,
    factionImpact: choice.factionImpact,
    politicalCapitalCost: choice.politicalCapitalCost,
  }
}
