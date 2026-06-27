import type { ConstituencyKey, GameState, GameOverType, NPCKey, TimelineEntry } from '../state/types'
import { NPC_ARCHETYPES } from '../data/npcs'
import { NPC_DECK_BY_ARCHETYPE } from '../data/events/npcDecks'
import { calculateHiddenDrag } from './dragEngine'
import { calculateVoteShare } from './electionEngine'
import { ALL_EVENTS, drawNextEvent, firePendingDelayed } from './eventEngine'
import { calculateWeeklyExpenditure } from './expenditureEngine'
import { applyFactionDeltaState, drift } from './factionEngine'
import { applyFashemuPhaseTransition, drawGodfatherAsk, godfatherToEventCard, shouldDrawGodfather } from './godfatherEngine'
import { generateChiefOfStaffBriefing, generateDeputyMessage, generateGodfatherPhaseMessage, generateNPCActivationMessage } from './inboxEngine'
import { emergencyBridgeLoan } from './debtEngine'
import { primaryContestLossEvent, removalResolutionEvent } from '../data/events/characters'
import { processProjects } from './projectEngine'
import { tickProjects } from './projectsEngine'
import { calculateWeeklyRevenue } from './revenueEngine'
import { getSeasonModifier } from './seasonEngine'
import { applyDelta } from './statEngine'
import { evaluateNews } from './evaluateNews'
import { tickResearchNodes } from './researchEngine'
import { selectPublicationForArticle, pickFramingVariant } from './publicationEngine'
import { getGoal, getGoalIsMet, getGoalProgress } from '../data/goals'
import { buildEndingNarrative } from './endingNarrator'
import { ALL_HINTS } from '../data/hints'

const CONSTITUENCY_TRUST_WEIGHTS: Partial<Record<string, number>> = {
  alimosho:        13,
  oshodiIsolo:      6,
  mushin:           5,
  kosofe:           6,
  surulere:         5,
  amuwoOdofin:      4,
  apapa:            3,
  lagosMainland:    5,
  ikeja:            5,
  agege:            5,
  ifakoIjaye:       4,
  ikorodu:          7,
  badagry:          5,
  ojo:              5,
  epe:              3,
  ajeromiIfelodun:  4,
  shomolu:          4,
  lagosIsland:      4,
  etiOsa:           4,
  ibejuLekki:       3,
}

export function tick(state: GameState): GameState {
  let next: GameState = {
    ...state,
    week: state.week + 1,
    eventsResolvedThisWeek: 0,
    stats: { ...state.stats },
  }

  const revenue = calculateWeeklyRevenue(next)
  const expenditure = calculateWeeklyExpenditure(next)
  next = {
    ...next,
    lastWeekRevenue: revenue,
    lastWeekExpenditure: expenditure,
    lastWeekStatSnapshot: {
      cashReserve: state.stats.cashReserve,
      publicTrust: state.stats.publicTrust,
      politicalCapital: state.stats.politicalCapital,
    },
  }

  const capitalSpend = next.capitalProjects
    .filter((p) => p.status === 'active')
    .reduce((sum, p) => sum + p.weeklyDraw, 0)
  const drag = calculateHiddenDrag(next, capitalSpend)
  const leakageRate = 0.15 + (next.stats.corruptionPressure / 100) * 0.25
  const capitalEfficiency = 1 - (capitalSpend > 0 ? leakageRate : 0)

  const netFlow = revenue.total - expenditure.total
  next.stats.cashReserve += netFlow
  next.stats.igr = revenue.total
  next.stats.expenditure = expenditure.total
  next.stats.capitalEfficiency = Math.max(0, Math.min(1, capitalEfficiency))

  // Apply FAAC variance (scaled by season — wet season = wilder swings)
  const mod = getSeasonModifier(next.week)
  const scaledFaacVariance = drag.faacVariance * mod.faacVarianceScale
  next.stats.cashReserve += scaledFaacVariance
  next = { ...next, faacVarianceAccumulated: next.faacVarianceAccumulated + Math.abs(scaledFaacVariance) }
  if (Math.abs(scaledFaacVariance) > 2) {
    next = {
      ...next,
      timeline: [
        ...next.timeline,
        {
          week: next.week,
          type: 'delayed-consequence' as const,
          title: 'FAAC Volatility',
          description: `Federal allocation ${scaledFaacVariance > 0 ? 'surged' : 'fell'} by ₦${Math.abs(scaledFaacVariance).toFixed(1)}bn this week.${mod.isWetSeason ? ' (Rainy season amplification)' : ''}`,
        },
      ],
    }
  }

  // Budget crunch (Dec–Jan): Abuja withholds a fraction of FAAC
  if (mod.faacBasePenalty > 0) {
    const penalty = revenue.faac * mod.faacBasePenalty
    next.stats.cashReserve -= penalty
  }

  // Federal election year: federalRelationship drifts down each week
  if (mod.federalRelationshipWeeklyDrift !== 0) {
    next = applyDelta(next, { federalRelationship: mod.federalRelationshipWeeklyDrift })
  }

  // Passive corruption rise
  next = applyDelta(next, { corruptionPressure: 0.5 })

  // Cascade: high corruption streak → International Funding Freeze
  if (next.stats.corruptionPressure > 75) {
    const streak = next.highCorruptionWeeks + 1
    next = { ...next, highCorruptionWeeks: streak }
    if (streak >= 3 && next.grantFreezeDuration === 0) {
      const freezeCount = next.grantFreezeCount + 1
      const freezeMessages = [
        'Sustained extreme corruption has triggered suspension of international grants for 8 weeks.',
        'International donors have extended the grant suspension. Corruption indicators remain at crisis levels.',
        'Third consecutive grant suspension. International credit agencies have flagged Lagos for a rating review.',
      ]
      const description = freezeMessages[Math.min(freezeCount - 1, freezeMessages.length - 1)]
      next = {
        ...next,
        grantFreezeCount: freezeCount,
        // After 3 freezes, grantsCompliance is permanently locked to 0 for the term
        ...(freezeCount >= 3 ? { stats: { ...next.stats, grantsCompliance: 0 } } : {}),
        grantFreezeDuration: 8,
        timeline: [
          ...next.timeline,
          {
            week: next.week,
            type: 'delayed-consequence' as const,
            title: 'International Funding Freeze',
            description,
          },
        ],
      }
    }
  } else {
    next = { ...next, highCorruptionWeeks: 0 }
  }
  if (next.grantFreezeDuration > 0) {
    next = { ...next, grantFreezeDuration: next.grantFreezeDuration - 1 }
  }

  // Cascade: youthTension > 70 → riot mode (normal event pool suspended)
  if (next.stats.youthTension > 70 && !next.riotModeActive) {
    next = {
      ...next,
      riotModeActive: true,
      timeline: [
        ...next.timeline,
        {
          week: next.week,
          type: 'delayed-consequence' as const,
          title: 'Riot Alert',
          description:
            'Youth tension has exceeded critical threshold. Normal governance suspended — riot management required.',
        },
      ],
    }
  } else if (next.stats.youthTension <= 70 && next.riotModeActive) {
    next = {
      ...next,
      riotModeActive: false,
      timeline: [
        ...next.timeline,
        {
          week: next.week,
          type: 'delayed-consequence' as const,
          title: 'Crisis Resolved',
          description: 'Youth tension has subsided. Normal governance resumes.',
        },
      ],
    }
  }

  next.stats.ghostWorkerRate = Math.min(0.2, next.stats.ghostWorkerRate + drag.ghostRegenRate)
  next = applyDelta(next, { baseOverheads: drag.overheadCreep })
  next.stats.contractorBacklog = Math.max(
    0,
    next.stats.contractorBacklog + 0.1 - expenditure.contractorPayment,
  )

  // Loan payoff: reduce outstanding balance and clean up completed loans
  if (next.activeLoans.length > 0) {
    const updatedLoans = next.activeLoans.map((loan) => ({
      ...loan,
      outstanding: Math.max(0, loan.outstanding - loan.weeklyRepayment),
    }))
    const completedLoans = updatedLoans.filter((l) => l.outstanding <= 0)
    const remainingLoans = updatedLoans.filter((l) => l.outstanding > 0)
    for (const loan of completedLoans) {
      next = applyDelta(next, {
        weeklyDebtRepayment: -loan.weeklyRepayment,
        weeklyDebtInterest: -loan.weeklyInterest,
      })
    }
    next = { ...next, activeLoans: remainingLoans }
  }
  // Reduce debt stock by what was repaid this week
  if (next.stats.weeklyDebtRepayment > 0) {
    next = applyDelta(next, { debtStock: -next.stats.weeklyDebtRepayment })
  }

  next = processProjects(next)

  const { state: afterDelayed } = firePendingDelayed(next)
  next = afterDelayed

  const driftDelta = drift(next.factions)
  if (Object.keys(driftDelta).length > 0) {
    next = applyFactionDeltaState(next, driftDelta)
  }

  // publicTrust drifts toward constituency-weighted average (10% pull per week)
  const weightedTrust =
    Object.entries(next.constituencyApproval).reduce(
      (sum, [key, val]) => sum + (CONSTITUENCY_TRUST_WEIGHTS[key] ?? 0) * val,
      0,
    ) / 100
  const trustDelta = (weightedTrust - next.stats.publicTrust) * 0.1
  if (Math.abs(trustDelta) > 0.01) {
    next = applyDelta(next, { publicTrust: trustDelta })
  }

  // Deputy resentment accumulation
  const prevDeputyResentment = next.deputy?.resentment ?? 0
  next = tickDeputyResentment(next)
  // When resentment first crosses 60, send an inbox message
  if (
    next.deputy &&
    !next.deputy.revealed &&
    prevDeputyResentment < 60 &&
    next.deputy.resentment >= 60
  ) {
    const msg = generateDeputyMessage(next, next.deputy.key)
    if (msg) next = { ...next, inbox: [...next.inbox, msg] }
  }

  // Activate NPCs based on conditions, tick pressure, apply goal effects, and check escalation
  next = activateNPCs(next)
  // Generate inbox messages for newly activated NPCs
  for (const slot of NPC_SLOTS) {
    const npc = next.activeNPCs[slot]
    if (npc.isActive && npc.activeWeek === next.week) {
      const msg = generateNPCActivationMessage(next, slot, npc)
      if (msg) next = { ...next, inbox: [...next.inbox, msg] }
    }
  }
  next = tickNPCPressure(next)
  next = applyNPCGoalEffects(next)
  next = checkNPCEscalation(next)

  // Initiative tick
  next = tickInitiative(next)

  // Phase E — research tree tick
  next = tickResearchNodes(next)

  // Projects tick
  next = tickProjects(next)

  // Fashemu phase transitions
  const oldPhase = next.fashemuPhase
  next = applyFashemuPhaseTransition(next)
  if (next.fashemuPhase !== oldPhase) {
    const msg = generateGodfatherPhaseMessage(next, oldPhase, next.fashemuPhase)
    if (msg) next = { ...next, inbox: [...next.inbox, msg] }
  }

  // Emergency suspension tick (must run before checkGameOver so suspension suppresses federal takeover)
  next = tickSuspension(next)

  // Litigation arc countdown
  next = tickLitigation(next)

  // LGA election result calculation (mandatory week 86)
  if (next.week === 86 && !next.lgaElectionHeld) {
    next = resolveLGAElection(next)
  }

  // Enter campaign mode at week 195 (first term only — second term has no election)
  if (next.week >= 195 && !next.inCampaignMode && next.currentTerm === 1) {
    next = { ...next, inCampaignMode: true }
  }

  next = checkGameOver(next)

  if (!next.isGameOver) {
    if (!next.activeEvent) {
      const event = drawNextEvent(next)
      if (event) {
        next = { ...next, activeEvent: event }
      }
    }
    if (shouldDrawGodfather(next)) {
      const message = drawGodfatherAsk(next)
      if (message) {
        const event = godfatherToEventCard(message)
        next = {
          ...next,
          usedGodfatherAskIds: [...next.usedGodfatherAskIds, message.id],
          lastGodfatherWeek: next.week,
          eventQueue: [...next.eventQueue, event],
        }
      }
    }
  }

  // Infrastructure decay: base -0.5/week, +0.005 per point above 70 (high-infra states need more maintenance)
  const infraDecay = 0.5 + Math.max(0, next.stats.infrastructureScore - 70) * 0.005
  // Youth tension: passive +0.4/week — the city always generates new pressure
  next = applyDelta(next, { infrastructureScore: -infraDecay, youthTension: 0.4 })

  // Append this week's per-LGA approval to rolling 8-week window
  const updatedHistory = {} as Record<ConstituencyKey, number[]>
  for (const key of Object.keys(next.constituencyApproval) as ConstituencyKey[]) {
    const prev = next.approvalHistory[key] ?? []
    updatedHistory[key] = [...prev, next.constituencyApproval[key]].slice(-8)
  }
  next = { ...next, approvalHistory: updatedHistory }

  const NEWS_COOLDOWN = 3
  const article = (next.week - next.lastNewsWeek >= NEWS_COOLDOWN) ? evaluateNews(state, next) : null
  if (article) {
    const pub = selectPublicationForArticle(next, article.category)
    if (pub) {
      const framing = pickFramingVariant(pub, article.category)
      let afterPublication: GameState = {
        ...next,
        newspaperHeadline: {
          ...article,
          publicationId: pub.id,
          framingCaption: framing?.caption,
          framingEditorialNote: framing?.editorialNote,
        },
      }
      if (pub.gameplayEffect.statDelta && Object.keys(pub.gameplayEffect.statDelta).length > 0) {
        afterPublication = applyDelta(afterPublication, pub.gameplayEffect.statDelta)
      }
      if (pub.gameplayEffect.factionDelta && Object.keys(pub.gameplayEffect.factionDelta).length > 0) {
        afterPublication = applyFactionDeltaState(afterPublication, pub.gameplayEffect.factionDelta)
      }
      next = { ...afterPublication, lastNewsWeek: next.week }
    } else {
      next = { ...next, newspaperHeadline: article }
    }
  }

  // Phase D — Chief of Staff briefing every 4 weeks
  if (next.week % 4 === 0) {
    const briefing = generateChiefOfStaffBriefing(next)
    next = { ...next, inbox: [...next.inbox, briefing] }
  }

  // Onboarding hints — check triggers against previous state
  for (const hint of ALL_HINTS) {
    if (next.seenHints.includes(hint.id) || next.hintQueue.includes(hint.id)) continue
    if (hint.trigger(state, next)) {
      next = { ...next, hintQueue: [...next.hintQueue, hint.id] }
    }
  }

  return next
}

const NPC_SLOTS: NPCKey[] = ['npc1', 'npc2', 'npc3']

function activateNPCs(state: GameState): GameState {
  let next = state
  let changed = false

  for (const slot of NPC_SLOTS) {
    const npc = next.activeNPCs[slot]
    if (npc.isActive) continue
    const def = NPC_ARCHETYPES[npc.archetypeKey]
    if (def && def.activationCondition(next)) {
      next = {
        ...next,
        activeNPCs: {
          ...next.activeNPCs,
          [slot]: { ...npc, isActive: true, activeWeek: next.week },
        },
      }
      changed = true
    }
  }

  return changed ? next : state
}

function tickNPCPressure(state: GameState): GameState {
  let next = state
  let changed = false

  for (const slot of NPC_SLOTS) {
    const npc = next.activeNPCs[slot]
    if (!npc.isActive) continue
    const def = NPC_ARCHETYPES[npc.archetypeKey]
    if (!def) continue
    const rate = def.baseWeeklyPressure(npc.relationship)
    if (rate === 0) continue
    next = {
      ...next,
      activeNPCs: {
        ...next.activeNPCs,
        [slot]: { ...next.activeNPCs[slot], pressure: Math.min(100, npc.pressure + rate) },
      },
    }
    changed = true
  }

  return changed ? next : state
}

function applyNPCGoalEffects(state: GameState): GameState {
  let next = state
  for (const slot of NPC_SLOTS) {
    const npc = next.activeNPCs[slot]
    if (!npc.isActive) continue
    const def = NPC_ARCHETYPES[npc.archetypeKey]
    if (!def) continue
    const delta = def.passiveEffect(npc, next)
    if (Object.keys(delta).length > 0) {
      next = applyDelta(next, delta)
    }
  }
  return next
}

function checkNPCEscalation(state: GameState): GameState {
  let next = state

  for (const slot of NPC_SLOTS) {
    const npc = next.activeNPCs[slot]
    if (!npc.isActive || npc.pressure < 40) continue

    const deckEvents = NPC_DECK_BY_ARCHETYPE[npc.archetypeKey] ?? []
    const available = deckEvents.filter(
      (e) =>
        !next.resolvedEvents.includes(e.id) &&
        !(e.id in next.eventCooldowns && next.week < next.eventCooldowns[e.id]) &&
        !next.eventQueue.some((q) => q.id === e.id),
    )
    if (available.length === 0) continue

    // Prefer tier-matched events; fall back to any available
    const tier = npc.relationship < 30 ? 'hostile' : npc.relationship < 65 ? 'neutral' : 'ally'
    const tiered = available.filter((e) => e.npcTier === tier)
    const baseEvent = tiered.length > 0 ? tiered[0] : available[0]

    // Substitute {NPC} placeholder with actual NPC name
    const event = {
      ...baseEvent,
      title: baseEvent.title.replace(/\{NPC\}/g, npc.name),
      body: baseEvent.body.replace(/\{NPC\}/g, npc.name),
      choices: baseEvent.choices.map((c) => ({
        ...c,
        label: c.label.replace(/\{NPC\}/g, npc.name),
        description: c.description.replace(/\{NPC\}/g, npc.name),
        delayed: c.delayed
          ? { ...c.delayed, eventText: c.delayed.eventText.replace(/\{NPC\}/g, npc.name) }
          : undefined,
      })),
    }

    next = {
      ...next,
      eventQueue: [...next.eventQueue, event],
      activeNPCs: {
        ...next.activeNPCs,
        [slot]: { ...next.activeNPCs[slot], pressure: 0 },
      },
    }
  }

  return next
}

function resolveLGAElection(state: GameState): GameState {
  // Calculate LGA result: base from lgChairmen faction score
  const lgBase = (state.factions.lgChairmen / 100) * 20
  const fashemuBonus = state.fashemuPhase === 'active' ? 4 : 0

  // Check how election was run
  const ranPartyMachine = state.resolvedEvents.includes('lga-election-buildup') &&
    state.timeline.some((e) => e.title === 'LGA Elections: Campaign Begins' && e.description === 'Mobilise Party Machine')
  const ranIndependent = state.resolvedEvents.includes('lga-election-buildup') &&
    state.timeline.some((e) => e.title === 'LGA Elections: Campaign Begins' && e.description === 'Independent Mobilisation')

  const campaignBonus = ranPartyMachine ? 3 : ranIndependent ? 2 : 0

  const loyalLGAs = Math.round(Math.min(20, Math.max(0, lgBase + fashemuBonus + campaignBonus)))
  const lgaElectionResult = (loyalLGAs / 20) * 100

  let next: GameState = {
    ...state,
    lgaElectionResult,
    lgaElectionHeld: true,
    timeline: [
      ...state.timeline,
      {
        week: state.week,
        type: 'milestone',
        title: 'LGA Election Results',
        description: `${loyalLGAs}/20 LGAs returned party-aligned chairmen. Result: ${lgaElectionResult.toFixed(0)}%.`,
      },
    ],
  }

  // Permanent penalty if result is poor
  if (lgaElectionResult < 40) {
    next = {
      ...next,
      factions: {
        ...next.factions,
        lgChairmen: next.factions.lgChairmen - 8,
      },
    }
  }

  return next
}

function tickInitiative(state: GameState): GameState {
  const initiative = state.activeInitiative
  if (!initiative) return state
  const weeksRemaining = initiative.weeksRemaining - 1
  if (weeksRemaining <= 0) {
    const completionEvent = ALL_EVENTS.find((e) => e.id === initiative.completionEventId)
    if (!completionEvent) return { ...state, activeInitiative: null }
    // Guard: don't re-enqueue a completion event that already resolved
    const alreadyResolved = state.resolvedEvents.includes(completionEvent.id)
    const alreadyQueued = state.eventQueue.some((e) => e.id === completionEvent.id)
    if (alreadyResolved || alreadyQueued) return { ...state, activeInitiative: null }
    return {
      ...state,
      activeInitiative: null,
      eventQueue: [...state.eventQueue, completionEvent],
    }
  }
  return { ...state, activeInitiative: { ...initiative, weeksRemaining } }
}

function tickDeputyResentment(state: GameState): GameState {
  const deputy = state.deputy
  if (!deputy) return state

  // Once the consequence event has resolved, mark revealed and stop accumulating
  const consequenceId = `deputy-consequence-${deputy.key}`
  if (state.resolvedEvents.includes(consequenceId)) {
    if (!deputy.revealed) return { ...state, deputy: { ...deputy, revealed: true, resentment: 0 } }
    return state
  }

  let delta = 0
  switch (deputy.key) {
    case 'technocrat':
      if (state.stats.infrastructureScore < 35) delta = 1
      break
    case 'politician':
      if (state.factions.lgChairmen < 35) delta = 2
      break
    case 'loyalist':
      if (state.stats.publicTrust < 40) delta = 1
      break
    case 'reformer':
      if (state.stats.corruptionPressure > 55) delta = 2
      break
    case 'traditionalist':
      if (state.godfatherRefusalCount > 2) delta = 2
      break
    case 'economist':
      if (state.stats.cashReserve < 5) delta = 2
      break
    case 'security-chief':
      if (state.stats.securityIndex < 40) delta = 1
      break
  }

  if (delta === 0) return state
  return {
    ...state,
    deputy: { ...deputy, resentment: Math.min(100, deputy.resentment + delta) },
  }
}

const ADMINISTRATOR_ACTIONS = [
  'Alhaji Olurin has awarded a ₦5bn road contract to a federal contractor without competitive tender. Your Works Commissioner has been replaced.',
  'Federal troops dispersed a protest at Lagos Island. The Administrator claims order has been restored — to his benefit, not yours.',
  'The Administrator has dissolved three local government councils loyal to you and installed federal-approved replacements.',
  'Chief Adesanya writes from his hotel: "Sir, your supporters are organising. We await your word. Do not let them see you broken."',
  'State government property was vandalised overnight. The Administrator blamed "remnants of your administration." The press is printing it unchallenged.',
]

function tickSuspension(state: GameState): GameState {
  if (state.emergencySuspensionWeeks <= 0) return state

  // If a legal challenge succeeded, end suspension immediately
  if (state.stateFlags['legal-challenge-succeeded']) {
    const next: GameState = {
      ...state,
      emergencySuspensionWeeks: 0,
      stateFlags: { ...state.stateFlags, 'legal-challenge-succeeded': false },
      timeline: [
        ...state.timeline,
        {
          week: state.week,
          type: 'milestone' as const,
          title: 'Reinstatement: Legal Victory',
          description: 'The court has ruled the emergency declaration unconstitutional. You are restored to full executive authority.',
        },
      ],
    }
    return applyDelta(next, { publicTrust: 10, politicalCapital: 30 })
  }

  const actText = ADMINISTRATOR_ACTIONS[state.administratorActIndex % ADMINISTRATOR_ACTIONS.length]
  const weeksLeft = state.emergencySuspensionWeeks - 1

  let next: GameState = {
    ...state,
    emergencySuspensionWeeks: weeksLeft,
    administratorActIndex: state.administratorActIndex + 1,
    timeline: [
      ...state.timeline,
      {
        week: state.week,
        type: 'delayed-consequence' as const,
        title: 'Federal Administrator',
        description: actText,
      },
    ],
  }

  // Passive drain: administrator mismanages treasury and erodes support
  next = applyDelta(next, { cashReserve: -1.5, publicTrust: -1 })
  next = applyFactionDeltaState(next, { partyGodfathers: -2, lgChairmen: -2 })

  // Enqueue the current act event if not already in queue
  const actEventId = `sole-administrator-act-${(state.administratorActIndex % 5) + 1}`
  if (!next.eventQueue.some((e) => e.id === actEventId) && !next.activeEvent) {
    const actEvent = ALL_EVENTS.find((e) => e.id === actEventId)
    if (actEvent) {
      next = { ...next, eventQueue: [...next.eventQueue, actEvent] }
    }
  }

  // Natural reinstatement when weeks hit 0
  if (weeksLeft === 0) {
    next = {
      ...next,
      stateFlags: { ...next.stateFlags, 'emergency-ever-suspended': true },
      timeline: [
        ...next.timeline,
        {
          week: next.week,
          type: 'milestone' as const,
          title: 'Emergency Ended',
          description: 'The federal emergency period has expired. You are restored to executive authority — but the state has been changed.',
        },
      ],
    }
    next = applyDelta(next, { publicTrust: 3, politicalCapital: 15 })
  }

  return next
}

function tickLitigation(state: GameState): GameState {
  if (!state.litigationActive || state.litigationTimer <= 0) return state

  const timer = state.litigationTimer - 1
  let next: GameState = { ...state, litigationTimer: timer }

  if (timer === 0) {
    // Supreme Court ruling event fires via queue
    next = { ...next, litigationActive: false }
    const rulingEvent = ALL_EVENTS.find((e) => e.id === 'supreme-court-ruling')
    if (rulingEvent && !next.eventQueue.some((e) => e.id === 'supreme-court-ruling')) {
      next = { ...next, eventQueue: [...next.eventQueue, rulingEvent] }
    }
  }

  return next
}

function endGame(state: GameState, gameOverType: GameOverType, gameOverReason: string): GameState {
  const narrative = buildEndingNarrative(state, gameOverType)
  return { ...state, isGameOver: true, gameOverType, gameOverReason, endingNarrative: narrative }
}

function checkGameOver(state: GameState): GameState {
  if (state.isGameOver) return state

  let next = { ...state }

  if (next.stats.cashReserve < 0) {
    if (next.consecutiveBankruptWeeks === 0 && next.emergencyLoansTaken < 3) {
      next = emergencyBridgeLoan(next)
      if (next.emergencyLoansTaken === 3) {
        next = {
          ...next,
          timeline: [
            ...next.timeline,
            {
              week: next.week,
              type: 'delayed-consequence' as const,
              title: 'Credit Exhausted',
              description:
                'Lagos has drawn its final emergency credit line. No further bailouts are available — the state must balance its books or face insolvency.',
            },
          ],
        }
      }
      if (next.stats.cashReserve >= 0) return next
    }
    next.consecutiveBankruptWeeks++
    if (next.consecutiveBankruptWeeks >= 3) {
      return endGame(next, 'bankruptcy', 'Bankruptcy: Lagos State is insolvent. Civil servants cannot be paid.')
    }
  } else {
    next.consecutiveBankruptWeeks = 0
  }

  // Federal takeover: suppressed during an active emergency suspension (the suspension IS the intervention)
  if (
    next.stats.federalRelationship < -40 &&
    next.stats.infrastructureScore < 25 &&
    next.emergencySuspensionWeeks === 0
  ) {
    return endGame(next, 'federalTakeover', 'Federal Government has taken over Lagos State administration.')
  }

  if (next.stats.publicTrust < 15 && next.stats.youthTension > 85) {
    return endGame(next, 'massUprising', 'Mass uprising has overwhelmed the state government.')
  }

  // Impeachment arc — check game-over paths first regardless of current godfather level
  if (next.impeachmentStage >= 1) {
    const defied = next.timeline.some(
      (e) => e.title === 'Removal Resolution: First Reading' && e.description === 'Defy the Assembly',
    )
    const conceded = next.stateFlags['conceded-to-assembly'] === true
    if (defied || conceded) {
      return {
        ...endGame(next, 'impeachment', 'The Lagos State House of Assembly voted to remove you from office.'),
        impeachmentStage: 2,
      }
    }
  }

  if (next.factions.partyGodfathers < 10 && next.week > 52) {
    if (next.impeachmentStage === 0) {
      // Only queue stage 1 if not already in the event queue
      const alreadyQueued = next.eventQueue.some((e) => e.id === 'removal-resolution-reading')
      if (!alreadyQueued) {
        next = {
          ...next,
          impeachmentStage: 1,
          eventQueue: [...next.eventQueue, removalResolutionEvent],
        }
      }
    }
    // impeachmentStage stays at 1 while partyGodfathers < 10 — no reset to 0 until recovery
  } else if (next.factions.partyGodfathers >= 20 && next.impeachmentStage === 1) {
    // Godfathers recovered above 20 — cancel the arc and allow future triggering
    next = {
      ...next,
      impeachmentStage: 0,
      eventQueue: next.eventQueue.filter(
        (e) => !['removal-resolution-reading', 'removal-resolution-committee', 'removal-resolution-floor-vote'].includes(e.id),
      ),
    }
  }

  // Derive primaryScenario from stateFlags once a primary event has resolved (term1 only)
  if (!next.primaryScenario && next.currentTerm === 1) {
    if (next.stateFlags['primary-a']) next = { ...next, primaryScenario: 'A' }
    else if (next.stateFlags['primary-b']) next = { ...next, primaryScenario: 'B' }
    else if (next.stateFlags['primary-c']) next = { ...next, primaryScenario: 'C' }
  }

  // Scenario B primary loss: check requirements on the first tick after week 175 (term1 only)
  if (next.stateFlags['primary-b'] && next.week >= 176 && next.primaryWon === null && next.currentTerm === 1) {
    const grassrootsWin =
      next.stateFlags['primary-b-grassroots'] && (next.lgaElectionResult ?? 0) >= 60
    const civilWin =
      next.stateFlags['primary-b-civil-society'] &&
      next.factions.civilSocietyMedia >= 55 &&
      next.factions.businessCommunity >= 50
    if (grassrootsWin || civilWin) {
      next = { ...next, primaryWon: true }
    } else if (!next.eventQueue.some((e) => e.id === 'primary-contest-loss')) {
      next = {
        ...next,
        primaryWon: false,
        eventQueue: [...next.eventQueue, primaryContestLossEvent],
      }
    }
  }

  // Primary loss game-over — fires after player resolves the loss event (term1 only)
  if (next.stateFlags['primary-lost'] && next.currentTerm === 1) {
    return endGame(next, 'primaryLoss', 'You lost the party primary to Hon. Seun Majekodunmi. Your re-election bid ends here.')
  }

  // Append goal outcome to any non-game-over return (captured in the term-end branches above)
  // For intermediate ticks, nothing to do — goals only matter at the end.

  // Second term end: week 416 is 208 weeks × 2 terms
  if (next.week > 416 && next.currentTerm === 2) {
    let nextWithGoal = { ...next }
    if (nextWithGoal.selectedGoalId) {
      const goal = getGoal(nextWithGoal.selectedGoalId)
      if (goal) {
        const met = getGoalIsMet(goal, nextWithGoal)
        const progress = getGoalProgress(goal, nextWithGoal)
        nextWithGoal.timeline = [...nextWithGoal.timeline, {
          week: next.week,
          type: 'milestone' as const,
          title: met ? 'Personal Goal: Achieved' : 'Personal Goal: Unfulfilled',
          description: met ? goal.flavorClosing : `You set out to "${goal.title}" but reached only ${progress.toFixed(0)}% of your targets. The ambition was real — the execution fell short.`,
        }]
      }
    }
    return endGame(nextWithGoal, 'secondTermEnd', 'Your second term has ended. Your legacy is now sealed.')
  }

  if (next.week > 208 && next.currentTerm === 1) {
    const electionResult = calculateVoteShare(next)
    const reElected = electionResult > 50

    let fashemuEndingPath = next.fashemuEndingPath
    if (!fashemuEndingPath) {
      const cooopedEFCC = next.timeline.some(
        (e) => e.title === 'EFCC Contact: The Fashemu File' && e.description === 'Cooperate Quietly',
      )
      if (next.fashemuPhase === 'dead') fashemuEndingPath = 'D'
      else if (cooopedEFCC) fashemuEndingPath = 'C'
      else if (next.godfatherRefusalCount >= 4) fashemuEndingPath = 'B'
      else if (next.godfatherComplianceCount >= 3) fashemuEndingPath = 'A'
    }

    if (reElected) {
      // Continue into second term instead of ending the game
      const goalTimeline: TimelineEntry[] = []
      if (next.selectedGoalId) {
        const goal = getGoal(next.selectedGoalId)
        if (goal) {
          const met = getGoalIsMet(goal, next)
          goalTimeline.push({
            week: next.week,
            type: 'milestone' as const,
            title: met ? 'Personal Goal: On Track' : 'Personal Goal: Carried Forward',
            description: met
              ? `Your ${goal.title} goal is on track — hold this to term end.`
              : `Your ${goal.title} goal is ${getGoalProgress(goal, next).toFixed(0)}% complete. Second term is the chance to finish it.`,
          })
        }
      }
      return {
        ...next,
        electionResult,
        reElected,
        fashemuEndingPath,
        currentTerm: 2,
        inCampaignMode: false,
        primaryScenario: null,
        primaryWon: null,
        timeline: [
          ...next.timeline,
          {
            week: next.week,
            type: 'milestone' as const,
            title: 'Re-Election Victory — Second Term Begins',
            description: `${electionResult.toFixed(1)}% of the vote. The people have given you another mandate. Second term begins — the stakes are higher, the margin for error is smaller.`,
          },
          ...goalTimeline,
        ],
      }
    }

    let nextWithGoal = { ...next }
    if (nextWithGoal.selectedGoalId) {
      const goal = getGoal(nextWithGoal.selectedGoalId)
      if (goal) {
        const met = getGoalIsMet(goal, nextWithGoal)
        const progress = getGoalProgress(goal, nextWithGoal)
        nextWithGoal.timeline = [...nextWithGoal.timeline, {
          week: next.week,
          type: 'milestone' as const,
          title: met ? 'Personal Goal: Achieved' : 'Personal Goal: Unfulfilled',
          description: met ? goal.flavorClosing : `You set out to "${goal.title}" but reached only ${progress.toFixed(0)}% of your targets. The ambition was real — the execution fell short.`,
        }]
      }
    }
    return {
      ...endGame(nextWithGoal, 'termEndLoss', 'Your term has ended. Check your final scorecard.'),
      electionResult,
      reElected,
      fashemuEndingPath,
    }
  }

  return next
}
