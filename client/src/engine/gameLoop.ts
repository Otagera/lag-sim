import { primaryContestLossEvent, removalResolutionEvent } from '../data/events/characters'
import { NPC_DECK_BY_ARCHETYPE } from '../data/events/npcDecks'
import { getGoal, getGoalIsMet, getGoalProgress } from '../data/goals'
import { ALL_HINTS } from '../data/hints'
import { NPC_ARCHETYPES } from '../data/npcs'
import type {
  ConstituencyKey,
  ExpenditureBreakdown,
  FashemuEndingPath,
  GameOverType,
  GameState,
  HiddenDrag,
  NPCKey,
  RevenueBreakdown,
  TimelineEntry,
} from '../state/types'
import { isDettyDecember, isEyoFestival, isHarmattan, isSallahPeriod } from '../utils/calendar'
import { selectChannelMeta } from './channelEngine'
import { emergencyBridgeLoan } from './debtEngine'
import { calculateHiddenDrag } from './dragEngine'
import { calculateVoteShare } from './electionEngine'
import { buildEndingNarrative } from './endingNarrator'
import { evaluateNews } from './evaluateNews'
import { ALL_EVENTS, drawNextEvent, firePendingDelayed } from './eventEngine'
import { calculateWeeklyExpenditure } from './expenditureEngine'
import { applyFactionDeltaState, drift } from './factionEngine'
import {
  applyFashemuPhaseTransition,
  drawGodfatherAsk,
  godfatherToEventCard,
  shouldDrawGodfather,
} from './godfatherEngine'
import {
  generateChiefOfStaffBriefing,
  generateDeputyMessage,
  generateGodfatherPhaseMessage,
  generateNPCActivationMessage,
  generateNPCEscalationMessage,
  pruneInbox,
} from './inboxEngine'
import { detectMoment } from './momentDetector'
import { processProjects } from './projectEngine'
import { tickProjects } from './projectsEngine'
import { pickFramingVariant, selectPublicationForArticle } from './publicationEngine'
import { tickResearchNodes } from './researchEngine'
import { calculateWeeklyRevenue } from './revenueEngine'
import { getSeasonModifier } from './seasonEngine'
import { tickSecondaryFactions } from './secondaryFactionEngine'
import { applyDelta } from './statEngine'

const CONSTITUENCY_TRUST_WEIGHTS: Partial<Record<string, number>> = {
  alimosho: 13,
  oshodiIsolo: 6,
  mushin: 5,
  kosofe: 6,
  surulere: 5,
  amuwoOdofin: 4,
  apapa: 3,
  lagosMainland: 5,
  ikeja: 5,
  agege: 5,
  ifakoIjaye: 4,
  ikorodu: 7,
  badagry: 5,
  ojo: 5,
  epe: 3,
  ajeromiIfelodun: 4,
  shomolu: 4,
  lagosIsland: 4,
  etiOsa: 4,
  ibejuLekki: 3,
}

function tickWeekSetup(state: GameState): GameState {
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

  return next
}

function applyFaacEffects(
  state: GameState,
  revenue: RevenueBreakdown,
  drag: HiddenDrag,
): GameState {
  let next = state
  const mod = getSeasonModifier(next.week)
  const scaledFaacVariance = drag.faacVariance * mod.faacVarianceScale

  next = applyDelta(next, { cashReserve: scaledFaacVariance })
  next = {
    ...next,
    faacVarianceAccumulated: next.faacVarianceAccumulated + Math.abs(scaledFaacVariance),
  }
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

  if (mod.faacBasePenalty > 0) {
    const penalty = revenue.faac * mod.faacBasePenalty
    next = applyDelta(next, { cashReserve: -penalty })
  }
  if (mod.federalRelationshipWeeklyDrift !== 0) {
    next = applyDelta(next, { federalRelationship: mod.federalRelationshipWeeklyDrift })
  }
  return next
}

function applyCorruptionAndRiotEffects(state: GameState): GameState {
  let next = applyDelta(state, { corruptionPressure: 0.5 })

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
      if (freezeCount >= 3) {
        next = applyDelta(next, { grantsCompliance: -next.stats.grantsCompliance })
      }
    }
  } else {
    next = { ...next, highCorruptionWeeks: 0 }
  }
  if (next.grantFreezeDuration > 0) {
    next = { ...next, grantFreezeDuration: next.grantFreezeDuration - 1 }
  }

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

  return next
}

function applyGhostAndLoanEffects(
  state: GameState,
  drag: HiddenDrag,
  expenditure: ExpenditureBreakdown,
): GameState {
  let next = applyDelta(state, {
    ghostWorkerRate:
      Math.min(0.2, state.stats.ghostWorkerRate + drag.ghostRegenRate) -
      state.stats.ghostWorkerRate,
    baseOverheads: drag.overheadCreep,
    contractorBacklog:
      Math.max(0, state.stats.contractorBacklog + 0.1 - expenditure.contractorPayment) -
      state.stats.contractorBacklog,
  })

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
  if (next.stats.weeklyDebtRepayment > 0) {
    next = applyDelta(next, { debtStock: -next.stats.weeklyDebtRepayment })
  }
  return next
}

function tickEconomyAndDrag(state: GameState): GameState {
  const next = state
  const revenue = next.lastWeekRevenue ?? calculateWeeklyRevenue(next)
  const expenditure = next.lastWeekExpenditure ?? calculateWeeklyExpenditure(next)

  const capitalSpend = next.capitalProjects
    .filter((p) => p.status === 'active')
    .reduce((sum, p) => sum + p.weeklyDraw, 0)
  const drag = calculateHiddenDrag(next, capitalSpend)
  const leakageRate = 0.15 + (next.stats.corruptionPressure / 100) * 0.25
  const capitalEfficiency = 1 - (capitalSpend > 0 ? leakageRate : 0)

  const netFlow = revenue.total - expenditure.total
  let afterRevenue = applyDelta(next, {
    cashReserve: netFlow,
    igr: revenue.total - next.stats.igr,
    expenditure: expenditure.total - next.stats.expenditure,
    capitalEfficiency: Math.max(0, Math.min(1, capitalEfficiency)) - next.stats.capitalEfficiency,
  })

  afterRevenue = applyFaacEffects(afterRevenue, revenue, drag)
  afterRevenue = applyCorruptionAndRiotEffects(afterRevenue)
  return applyGhostAndLoanEffects(afterRevenue, drag, expenditure)
}

function tickProjectsAndDelayed(state: GameState): GameState {
  let next = processProjects(state)

  const { state: afterDelayed } = firePendingDelayed(next)
  next = afterDelayed

  return next
}

function tickFactionsAndTrust(state: GameState): GameState {
  let next = state

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

  return next
}

function tickNPCsAndInitiatives(state: GameState): GameState {
  let next = state

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

  return next
}

function tickResearchAndPolitical(state: GameState): GameState {
  let next = state

  // Phase E — research tree tick
  next = tickResearchNodes(next)

  // Secondary faction tick (drift + seasonal modulation)
  next = tickSecondaryFactions(
    next,
    isDettyDecember(next.week),
    isSallahPeriod(next.week),
    isEyoFestival(next.week),
    isHarmattan(next.week),
  )

  // Projects tick
  next = tickProjects(next)

  // Fashemu phase transitions
  const oldPhase = next.fashemuPhase
  next = applyFashemuPhaseTransition(next)
  if (next.fashemuPhase !== oldPhase) {
    const msg = generateGodfatherPhaseMessage(next, oldPhase, next.fashemuPhase)
    if (msg) next = { ...next, inbox: [...next.inbox, msg] }
  }

  return next
}

function tickCampaignAndGameOver(state: GameState): GameState {
  let next = state

  // Emergency suspension tick (must run before checkGameOver so suspension suppresses federal takeover)
  next = tickSuspension(next)

  // Litigation arc countdown
  next = tickLitigation(next)

  // LGA election result calculation (mandatory week 86)
  if (next.week === 86 && !next.lgaElectionHeld) {
    next = resolveLGAElection(next)
  }

  // Enter campaign mode at week 187 (first term only — second term has no election)
  if (next.week >= 187 && !next.inCampaignMode && next.currentTerm === 1) {
    next = { ...next, inCampaignMode: true }
  }

  next = checkGameOver(next)

  return next
}

function tickEventDraw(state: GameState): GameState {
  let next = state

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

  return next
}

function tickDecayAndNews(state: GameState, prevState: GameState): GameState {
  let next = state

  // Infrastructure decay: base -0.5/week, +0.005 per point above 70 (high-infra states need more maintenance)
  const infraDecay = 0.5 + Math.max(0, next.stats.infrastructureScore - 70) * 0.005
  // Youth tension: passive +0.4/week — the city always generates new pressure
  // Political capital: passive +0.8/week — mirrors corruption's automatic growth,
  // ensuring zero is not an absorbing state. A patient player rebuilds.
  next = applyDelta(next, { infrastructureScore: -infraDecay, youthTension: 0.4, politicalCapital: 0.8 })

  // OTA-32: food+flood decay re-enabled now that accessible counterplay ships alongside it
  // (agricultureEvents food counter-tools, infrastructure flood counter-tools, + climate/agri
  // research nodes). Seasonal multipliers softened from the original OTA-39 values so a diligent
  // player can out-pace the bleed over a term and still reach the Feed Lagos / Climate-Proof goals.
  const FOOD_FLOOD_DECAY_ENABLED = true
  const mod = getSeasonModifier(next.week)
  if (FOOD_FLOOD_DECAY_ENABLED) {
    const foodDecay = 0.15 + (mod.isHarmattan ? 0.15 : 0) // -0.15/wk base, -0.30 in Harmattan
    next = applyDelta(next, { foodSecurityIndex: -foodDecay })
    const floodDecay = 0.1 + (mod.isWetSeason ? 0.25 : 0) // -0.10/wk base, -0.35 in wet season
    next = applyDelta(next, { floodResilienceScore: -floodDecay })
  }

  // Append this week's per-LGA approval to rolling 8-week window
  const updatedHistory = {} as Record<ConstituencyKey, number[]>
  for (const key of Object.keys(next.constituencyApproval) as ConstituencyKey[]) {
    const prev = next.approvalHistory[key] ?? []
    updatedHistory[key] = [...prev, next.constituencyApproval[key]].slice(-8)
  }
  next = { ...next, approvalHistory: updatedHistory }

  const NEWS_COOLDOWN = 3
  const article =
    next.week - next.lastNewsWeek >= NEWS_COOLDOWN ? evaluateNews(prevState, next) : null
  if (article) {
    const channelMeta = selectChannelMeta(article, next)
    const articleWithChannel = { ...article, channelMeta }
    const pub =
      channelMeta.channel === 'newspaper'
        ? selectPublicationForArticle(next, article.category)
        : null
    if (pub) {
      const framing = pickFramingVariant(pub, article.category)
      let afterPublication: GameState = {
        ...next,
        newspaperHeadline: {
          ...articleWithChannel,
          publicationId: pub.id,
          framingCaption: framing?.caption,
          framingEditorialNote: framing?.editorialNote,
        },
      }
      if (pub.gameplayEffect.statDelta && Object.keys(pub.gameplayEffect.statDelta).length > 0) {
        afterPublication = applyDelta(afterPublication, pub.gameplayEffect.statDelta)
      }
      if (
        pub.gameplayEffect.factionDelta &&
        Object.keys(pub.gameplayEffect.factionDelta).length > 0
      ) {
        afterPublication = applyFactionDeltaState(afterPublication, pub.gameplayEffect.factionDelta)
      }
      next = { ...afterPublication, lastNewsWeek: next.week }
    } else {
      next = { ...next, newspaperHeadline: articleWithChannel, lastNewsWeek: next.week }
    }
  }

  return next
}

function tickCleanup(state: GameState, prevState: GameState): GameState {
  let next = state

  // Phase D — Chief of Staff briefing every 4 weeks
  if (next.week % 4 === 0) {
    const briefing = generateChiefOfStaffBriefing(next)
    next = { ...next, inbox: [...next.inbox, briefing] }
  }

  // Onboarding hints — check triggers against previous state
  for (const hint of ALL_HINTS) {
    if (next.seenHints.includes(hint.id) || next.hintQueue.includes(hint.id)) continue
    if (hint.trigger(prevState, next)) {
      next = { ...next, hintQueue: [...next.hintQueue, hint.id] }
    }
  }

  // Shareable "moment" detection — single-slot, offered once per key. Mirrors
  // the hint loop: compare prev→next, never overwrite a pending offer.
  if (!next.pendingMoment) {
    const moment = detectMoment(prevState, next)
    if (moment && !next.sharedMoments.includes(moment.key)) {
      next = { ...next, pendingMoment: moment }
    }
  }

  // Cap inbox growth over a long game — keeps recent reactions, drops old flavor,
  // never prunes an un-actioned godfather ask.
  const pruned = pruneInbox(next.inbox)
  if (pruned.length !== next.inbox.length) next = { ...next, inbox: pruned }

  return next
}

export function tick(state: GameState): GameState {
  let next = tickWeekSetup(state)
  next = tickEconomyAndDrag(next)
  next = tickProjectsAndDelayed(next)
  next = tickFactionsAndTrust(next)
  next = tickNPCsAndInitiatives(next)
  next = tickResearchAndPolitical(next)
  next = tickCampaignAndGameOver(next)
  if (!next.isGameOver) next = tickEventDraw(next)
  next = tickDecayAndNews(next, state)
  next = tickCleanup(next, state)
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
    if (def?.activationCondition(next)) {
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

    // Push an inbox notification so the player sees the escalation
    const msg = generateNPCEscalationMessage(next, slot, npc, event.id)
    if (msg) next = { ...next, inbox: [...next.inbox, msg] }
  }

  return next
}

function resolveLGAElection(state: GameState): GameState {
  // Calculate LGA result: base from lgChairmen faction score
  const lgBase = (state.factions.lgChairmen / 100) * 20
  const fashemuBonus = state.fashemuPhase === 'active' ? 4 : 0

  // Check how election was run
  const ranPartyMachine =
    state.resolvedEvents.includes('lga-election-buildup') &&
    state.timeline.some(
      (e) =>
        e.title === 'LGA Elections: Campaign Begins' && e.description === 'Mobilise Party Machine',
    )
  const ranIndependent =
    state.resolvedEvents.includes('lga-election-buildup') &&
    state.timeline.some(
      (e) =>
        e.title === 'LGA Elections: Campaign Begins' &&
        e.description === 'Independent Mobilisation',
    )

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
    let next: GameState = { ...state, activeInitiative: null }

    // Apply PC reward if present (prestige actions)
    if (initiative.pcReward && initiative.pcReward > 0) {
      next = applyDelta(next, { politicalCapital: initiative.pcReward })
    }

    if (!initiative.completionEventId) return next

    const completionEvent = ALL_EVENTS.find((e) => e.id === initiative.completionEventId)
    if (!completionEvent) return next
    const alreadyResolved = next.resolvedEvents.includes(completionEvent.id)
    const alreadyQueued = next.eventQueue.some((e) => e.id === completionEvent.id)
    if (alreadyResolved || alreadyQueued) return next
    return { ...next, eventQueue: [...next.eventQueue, completionEvent] }
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
          description:
            'The court has ruled the emergency declaration unconstitutional. You are restored to full executive authority.',
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
          description:
            'The federal emergency period has expired. You are restored to executive authority — but the state has been changed.',
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

// Clears the term-1 re-election game-over so play continues into term 2.
// currentTerm is already 2 (set upstream by checkFirstTermEnd). This is the pure
// core shared by the store's beginSecondTerm action and the simulation harness.
export function beginSecondTermState(state: GameState): GameState {
  return {
    ...state,
    isGameOver: false,
    gameOverType: undefined,
    gameOverReason: undefined,
    endingNarrative: undefined,
    electionResult: null,
    reElected: false,
  }
}

function checkBankruptcy(state: GameState): GameState {
  let next = state
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
    next = { ...next, consecutiveBankruptWeeks: next.consecutiveBankruptWeeks + 1 }
    if (next.consecutiveBankruptWeeks >= 3) {
      return endGame(
        next,
        'bankruptcy',
        'Bankruptcy: Lagos State is insolvent. Civil servants cannot be paid.',
      )
    }
  } else {
    next = { ...next, consecutiveBankruptWeeks: 0 }
  }

  return next
}

function bankruptcyResolvedByBridgeLoan(before: GameState, after: GameState): boolean {
  return (
    before.stats.cashReserve < 0 &&
    before.consecutiveBankruptWeeks === 0 &&
    before.emergencyLoansTaken < 3 &&
    after.stats.cashReserve >= 0 &&
    !after.isGameOver
  )
}

function checkFederalTakeover(state: GameState): GameState {
  // Federal takeover: suppressed during an active emergency suspension (the suspension IS the intervention)
  if (
    state.stats.federalRelationship < -40 &&
    state.stats.infrastructureScore < 25 &&
    state.emergencySuspensionWeeks === 0
  ) {
    return endGame(
      state,
      'federalTakeover',
      'Federal Government has taken over Lagos State administration.',
    )
  }

  return state
}

function checkMassUprising(state: GameState): GameState {
  if (state.stats.publicTrust < 15 && state.stats.youthTension > 85) {
    return endGame(state, 'massUprising', 'Mass uprising has overwhelmed the state government.')
  }

  return state
}

function checkImpeachmentArc(state: GameState): GameState {
  let next = state
  // Impeachment arc — check game-over paths first regardless of current godfather level
  if (next.impeachmentStage >= 1) {
    const defied = next.timeline.some(
      (e) =>
        e.title === 'Removal Resolution: First Reading' && e.description === 'Defy the Assembly',
    )
    const conceded = next.stateFlags['conceded-to-assembly'] === true
    if (defied || conceded) {
      return {
        ...endGame(
          next,
          'impeachment',
          'The Lagos State House of Assembly voted to remove you from office.',
        ),
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
        (e) =>
          ![
            'removal-resolution-reading',
            'removal-resolution-committee',
            'removal-resolution-floor-vote',
          ].includes(e.id),
      ),
    }
  }

  return next
}

function checkPrimaryScenario(state: GameState): GameState {
  let next = state
  // Derive primaryScenario from stateFlags once a primary event has resolved (term1 only)
  if (!next.primaryScenario && next.currentTerm === 1) {
    if (next.stateFlags['primary-a']) next = { ...next, primaryScenario: 'A' }
    else if (next.stateFlags['primary-b']) next = { ...next, primaryScenario: 'B' }
    else if (next.stateFlags['primary-c']) next = { ...next, primaryScenario: 'C' }
  }

  // Scenario B primary loss: check requirements on the first tick after week 175 (term1 only)
  if (
    next.stateFlags['primary-b'] &&
    next.week >= 176 &&
    next.primaryWon === null &&
    next.currentTerm === 1
  ) {
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
    return endGame(
      next,
      'primaryLoss',
      'You lost the party primary to Hon. Seun Majekodunmi. Your re-election bid ends here.',
    )
  }

  return next
}

function buildGoalTimelineEntry(state: GameState): TimelineEntry[] {
  if (!state.selectedGoalId) return []
  const goal = getGoal(state.selectedGoalId)
  if (!goal) return []
  const met = getGoalIsMet(goal, state)
  const progress = getGoalProgress(goal, state)
  return [
    {
      week: state.week,
      type: 'milestone' as const,
      title: met ? 'Personal Goal: On Track' : 'Personal Goal: Carried Forward',
      description: met
        ? `Your ${goal.title} goal is on track — hold this to term end.`
        : `Your ${goal.title} goal is ${progress.toFixed(0)}% complete. Second term is the chance to finish it.`,
    },
  ]
}

function checkSecondTermEnd(state: GameState): GameState | null {
  if (state.week < 416 || state.currentTerm !== 2) return null
  const next = { ...state }
  if (next.selectedGoalId) {
    const goal = getGoal(next.selectedGoalId)
    if (goal) {
      const met = getGoalIsMet(goal, next)
      const progress = getGoalProgress(goal, next)
      next.timeline = [
        ...next.timeline,
        {
          week: next.week,
          type: 'milestone' as const,
          title: met ? 'Personal Goal: Achieved' : 'Personal Goal: Unfulfilled',
          description: met
            ? goal.flavorClosing
            : `You set out to "${goal.title}" but reached only ${progress.toFixed(0)}% of your targets. The ambition was real — the execution fell short.`,
        },
      ]
    }
  }
  return endGame(next, 'secondTermEnd', 'Your second term has ended. Your legacy is now sealed.')
}

function checkFirstTermEnd(state: GameState): GameState | null {
  if (state.week < 208 || state.currentTerm !== 1 || state.electionResult === null) return null
  if (state.reElected) {
    return endGame(
      { ...state, currentTerm: 2, primaryScenario: null, primaryWon: null },
      'termEndWin',
      `Re-elected with ${state.electionResult.toFixed(1)}% of the vote. Inauguration day.`,
    )
  }
  return endGame(state, 'termEndLoss', 'Defeated in the election. Your term ends.')
}

function deriveFashemuEndingPath(state: GameState): FashemuEndingPath | null {
  if (state.fashemuEndingPath) return state.fashemuEndingPath
  const cooopedEFCC = state.timeline.some(
    (e) => e.title === 'EFCC Contact: The Fashemu File' && e.description === 'Cooperate Quietly',
  )
  if (state.fashemuPhase === 'dead') return 'D'
  if (cooopedEFCC) return 'C'
  if (state.godfatherRefusalCount >= 4) return 'B'
  if (state.godfatherComplianceCount >= 3) return 'A'
  return null
}

function checkElectionDay(state: GameState): GameState | null {
  if (state.week < 200 || state.currentTerm !== 1 || state.electionResult !== null) return null
  const electionResult = calculateVoteShare(state)
  const reElected = electionResult > 50
  const fashemuEndingPath = deriveFashemuEndingPath(state)
  return {
    ...state,
    electionResult,
    reElected,
    fashemuEndingPath,
    inCampaignMode: false,
    timeline: [
      ...state.timeline,
      {
        week: state.week,
        type: 'milestone' as const,
        title: reElected ? 'Re-Election Victory' : 'Defeated at the Polls',
        description: reElected
          ? `${electionResult.toFixed(1)}% of the vote. The people have returned you. Transition period until inauguration at week 208.`
          : `${electionResult.toFixed(1)}% of the vote. Your term continues until the handover at week 208.`,
      },
      ...buildGoalTimelineEntry(state),
    ],
  }
}

function checkTermEndAndElection(state: GameState): GameState {
  return checkSecondTermEnd(state) ?? checkFirstTermEnd(state) ?? checkElectionDay(state) ?? state
}

function checkGameOver(state: GameState): GameState {
  if (state.isGameOver) return state

  let next = { ...state }
  const beforeBankruptcy = next
  next = checkBankruptcy(next)
  if (next.isGameOver || bankruptcyResolvedByBridgeLoan(beforeBankruptcy, next)) return next

  next = checkFederalTakeover(next)
  if (next.isGameOver) return next

  next = checkMassUprising(next)
  if (next.isGameOver) return next

  next = checkImpeachmentArc(next)
  if (next.isGameOver) return next

  next = checkPrimaryScenario(next)
  if (next.isGameOver) return next

  return checkTermEndAndElection(next)
}
