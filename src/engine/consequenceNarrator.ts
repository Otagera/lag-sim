import type { Choice, ConsequenceBeat, GameState } from '../state/types'

/* ============================================================
 * Phase B — Emotional Consequence Text
 *
 * Given a choice just made with its deltas and the state before
 * and after, return a narrative beat assembled DETERMINISTICALLY
 * from templated fragments. No LLM. Pure function.
 *
 * FRAGMENTS MARKED "DRAFT — VOICE PASS NEEDED" are agent-written
 * scaffolding. The human designer owns the voice — every drafted
 * family needs a human edit before the phase is final.
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

  /* ============================================================
   * DRAFT — VOICE PASS NEEDED
   * Agent-written fragments. These carry the right shape and
   * length but need the human designer's Lagos-authentic voice
   * to land. Replace or rewrite each family below.
   * ============================================================ */

  'godfather-drop': {
    tone: 'grim',
    draft: true,
    variants: [
      '{godfather} doesn\'t call. The silence is the message. By Friday, a contractor you\'ve never met has been "recommended" for the {worstLGA} road — a test of whether you\'re listening.',
      'At the party secretariat, word spreads before you\'ve left your office. {godfather}\'s man in the room doesn\'t meet your eyes. The message is delivered without a word.',
      'Your phone is quiet. Too quiet. The party WhatsApp groups have gone cold — and in Lagos politics, cold means something broke.',
      'A memo from the Governor\'s Advisory Council arrives. Polished. Distant. The warmth has been edited out.',
    ],
  },

  'godfather-rise': {
    tone: 'hollow',
    draft: true,
    variants: [
      'The calls come through. Warm, familiar. {godfather}\'s voice on the line, asking after your family. The price, as always, is not mentioned on the call.',
      '{godfather}\'s endorsement arrives by courier before noon. The chairman of the Governor\'s Advisory Council nods at the cabinet meeting. A small thing. Everything.',
      'The party WhatsApp groups light up again. Emojis. Praise. The machine has accepted you back. The relief is real — and so is the bill.',
    ],
  },

  'trust-gain-crisis': {
    tone: 'hollow',
    draft: true,
    variants: [
      'The headlines are kind today. But in {worstLGA}, where the water still rises and the demolition notices haven\'t been withdrawn, kindness in the papers buys nothing.',
      'Approval ticks up. A focus group in {worstLGA} shows the gap — they see the effort, but effort doesn\'t fix the drainage. "He tries," one woman says. "Trying isn\'t enough."',
      'Your pollster calls with good news. Then he pauses. "The numbers are up everywhere except {worstLGA}. They\'re still waiting."',
    ],
  },

  'trust-gain': {
    tone: 'hopeful',
    draft: true,
    variants: [
      'For once, the chatter at the bus stop is not about who failed. A trader in {randomLGA} tells her customers: "This one might be different." Small things.',
      'A letter arrives, handwritten, from an old man in Surulere. "Thank you," it says. No demands. No threats. Just a thank you.',
      'The radio call-in show has more praise than complaints today. The presenter sounds almost surprised.',
    ],
  },

  'trust-drop': {
    tone: 'grim',
    draft: true,
    variants: [
      'The rumour mill is faster than your press office. By noon, everyone knows. By evening, the memes are already in the group chats.',
      'A woman in {worstLGA} tells the Channels TV camera: "They are all the same." The clip trends before your media team can respond.',
      'The price of garri goes up at the {randomLGA} market. Somehow, everyone blames you. In Lagos, the governor owns everything that breaks.',
    ],
  },

  'hollow-win': {
    tone: 'hollow',
    draft: true,
    variants: [
      'On paper, a victory. In the treasury, the same red. You\'ve bought applause you\'ll be paying for in six weeks.',
      'The money arrives. Most of it is already spoken for — salaries, contractors, promises you inherited. A win you can\'t afford to celebrate.',
      'A good decision, made in good faith. The numbers agree. The accountant general does not disagree. But the deficit is a habit you can\'t break in one quarter.',
    ],
  },

  'clean-but-costly': {
    tone: 'hollow',
    draft: true,
    variants: [
      'The right thing, done plainly. Your Commissioner for Finance thinks you\'re naïve. Maybe. But for the first time this month, you can look at the books without flinching.',
      'You sign the directive. No kickback. No "mobilisation fee." Your staff exchanges glances. This is not how things are done. Perhaps that is the point.',
      'A clean procurement, properly tendered. The contractor who didn\'t get the job is already lobbying against you. The one who won it doesn\'t know your name. That is how you know you did it right.',
    ],
  },

  'corruption-up': {
    tone: 'grim',
    draft: true,
    variants: [
      'The Permanent Secretary smiles when he hands you the file. That smile costs. You don\'t ask how much. You don\'t want to know.',
      'A memo crosses your desk with numbers that do not add up. You sign it anyway. The arithmetic of Lagos politics does not require honesty — it requires momentum.',
      'Your Commissioner for Works mentions a "mobilisation fee" as if it is the weather. Routine. Structural. Everywhere. You do not correct him.',
    ],
  },

  'youth-up': {
    tone: 'tense',
    draft: true,
    variants: [
      'The #LagosSpeaks hashtag is trending. The demands are not unreasonable. That is what makes them dangerous — reasonable demands from young people who have stopped asking politely.',
      'At the University of Lagos, a spontaneous protest starts over nothing. It is never about nothing. The police commissioner calls, his voice tight. "Sir, we need guidance."',
      'A group of young men in {worstLGA} have formed a "monitoring team." Their words. The police commissioner uses blunter ones. You tell him to wait. Patience is running out on both sides.',
    ],
  },

  'defiance': {
    tone: 'tense',
    draft: true,
    variants: [
      'You have chosen the hard way. Your staff does not applaud. They watch. The system resists — every memo meets a new form of inertia, every directive encounters a fresh silence.',
      'The order leaves your office. It will be implemented — eventually — through layers of people who wish you hadn\'t given it. But it left. That matters.',
      'A bold move. Your Chief of Staff raises an eyebrow. "Sir, are you sure?" You are not sure. But you are sure that being sure is overrated in a system that has never been challenged.',
    ],
  },

  /* ============================================================
   * PLACEHOLDER — USER TO WRITE
   * These families exist so the engine runs end-to-end. The text
   * is generic and should be replaced with authentic Lagos voice.
   * ============================================================ */

  'civil-gain': {
    tone: 'hopeful',
    draft: false,
    variants: [
      'The editorial board, for once, withholds their knives. A brief mercy.',
      'SERAP issues a statement that is not a lawsuit. A minor miracle.',
      'The civil society coalition issues a measured statement. Almost approving.',
    ],
  },

  'civil-drop': {
    tone: 'tense',
    draft: false,
    variants: [
      'The press conference was not called by you. That is the problem.',
      'Blogs you cannot control carry a story you cannot rebut. The group chats have already decided.',
      'A lawyer in {worstLGA} is filing papers. Another one.',
    ],
  },

  'youth-down': {
    tone: 'hopeful',
    draft: false,
    variants: [
      'The curfew is lifted. The streets fill again. Life, stubborn as always.',
      'A youth leader accepts your invitation to the Secretariat. Not an endorsement. A willingness to talk.',
    ],
  },

  'security-win': {
    tone: 'neutral',
    draft: false,
    variants: [
      'The night market in {randomLGA} stays open past 9pm for the first time in months.',
      'The police commissioner\'s weekly report has one less red entry. One.',
    ],
  },

  'security-loss': {
    tone: 'tense',
    draft: false,
    variants: [
      'A neighbourhood watch in {worstLGA} is forming. When citizens organise security, it means the state has already failed.',
      'The armed robbery rate is down. Car snatching is up. The criminals adapt faster than the police.',
    ],
  },

  'cash-drop': {
    tone: 'grim',
    draft: false,
    variants: [
      'The numbers are crunched before the meeting. They do not improve with rereading.',
      'Your Finance Commissioner clears his throat. That sound precedes bad news.',
      'The accountant general sends a private note. You read it twice. The second time is worse.',
    ],
  },

  'cash-gain': {
    tone: 'neutral',
    draft: false,
    variants: [
      'The treasury reports a modest improvement. Not a surplus. But the bleeding has slowed.',
      'Revenue comes in slightly above projection. Your Finance Commissioner allows himself a small nod.',
    ],
  },

  'infra-gain': {
    tone: 'hopeful',
    draft: false,
    variants: [
      'The asphalt on the {randomLGA} road is still curing. Drivers slow down to smile at it.',
      'A drainage channel in {randomLGA} has been cleared — by your order, on your watch. Water flows.',
    ],
  },

  'infra-loss': {
    tone: 'grim',
    draft: false,
    variants: [
      'A pipe bursts in {worstLGA}. The repair crew does not arrive. The contractor says they were not paid.',
      'The road you repaired last year is already failing. The rain does not respect ribbon cuttings.',
    ],
  },

  'federal-gain': {
    tone: 'neutral',
    draft: false,
    variants: [
      'A call from Abuja. The tone is warm. For now.',
      'The federal allocation arrives on time. No deductions. No explanations. A minor bureaucratic miracle.',
    ],
  },

  'federal-drop': {
    tone: 'tense',
    draft: false,
    variants: [
      'Abuja is not returning your calls. The silence from the presidency is deliberate.',
      'A "routine query" arrives from the federal ministry. It is not routine.',
    ],
  },

  'informal-gain': {
    tone: 'neutral',
    draft: false,
    variants: [
      'The agberos at the {randomLGA} motor park are collecting fewer "taxes." Someone appears to be watching.',
      'Market traders in {randomLGA} report a better week. The ripple reaches the revenue office.',
    ],
  },

  'informal-loss': {
    tone: 'tense',
    draft: false,
    variants: [
      'The market closes early in {worstLGA}. No one says why. Everyone knows why.',
      'A dispute between transport unions in {randomLGA} shuts down the motor park. The revenue loss is small. The message is not.',
    ],
  },

  'business-gain': {
    tone: 'neutral',
    draft: false,
    variants: [
      'The chamber of commerce issues a statement. Cautiously optimistic. That is as close to a hug as they give.',
      'A Nigerian multinational quietly decides not to relocate its HQ. No press release. They just stay.',
    ],
  },

  'business-loss': {
    tone: 'tense',
    draft: false,
    variants: [
      'The Chamber of Commerce issues a statement. The language is diplomatic. The meaning is not.',
      'A business forum in {randomLGA} is poorly attended. The empty chairs are a message.',
    ],
  },

  'lg-gain': {
    tone: 'neutral',
    draft: false,
    variants: [
      'The LG chairmen\'s association issues a rare statement of support. Guarded, but supportive.',
      'A local council chairman in {randomLGA} publicly backs your latest directive. The others notice.',
    ],
  },

  'lg-loss': {
    tone: 'tense',
    draft: false,
    variants: [
      'The LG chairmen are meeting without you. That is never a good sign.',
      'A council chairman in {worstLGA} has "stepped back" from your administration. The language is careful. The message is not.',
    ],
  },

  'neutral': {
    tone: 'neutral',
    draft: false,
    variants: [
      'The decision is made. The machinery of government adjusts, slowly, in response.',
      'Your signature dries on the directive. The work of implementation begins — invisible, thankless, essential.',
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
    let text = fillPlaceholders(raw, nextState, seed)
    // Don't fill godfather for corruption (different context)
    text = text.replace(/\{godfather\}/g, 'Chief Fashemu')
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
