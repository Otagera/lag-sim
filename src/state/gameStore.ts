import { create } from 'zustand'
import { DEPUTY_PROFILES } from '../data/deputies'
import { STARTING_STATE } from '../data/startingState'
import { takeLoan as takeLoanAction } from '../engine/debtEngine'
import { evaluateSkipNews } from '../engine/evaluateNews'
import { resolveEvent as resolveEventAction } from '../engine/eventEngine'
import { calculateWeeklyExpenditure } from '../engine/expenditureEngine'
import { applyFactionDelta } from '../engine/factionEngine'
import { tick as gameLoopTick } from '../engine/gameLoop'
import { resolveGodfather } from '../engine/godfatherEngine'
import { generateCommissionerMessage } from '../engine/inboxEngine'
import { commissionProject as commissionProjectAction } from '../engine/projectsEngine'
import { commissionNode } from '../engine/researchEngine'
import { calculateWeeklyRevenue } from '../engine/revenueEngine'
import { type SimulateOptions, type SimulateResult, simulateWeeks } from '../engine/simulateEngine'
import { applyDelta } from '../engine/statEngine'
import { loadSeenHints, saveGame, saveSeenHints } from './persistence'
import type {
  CommissionerRole,
  CommissionerState,
  DeputyKey,
  FactionDelta,
  GameState,
  LoanSource,
  StatDelta,
} from './types'

export interface GameStore extends GameState {
  tick: () => void
  acceptGodfather: () => void
  refuseGodfather: () => void
  resolveEvent: (choiceId: string) => void
  setMode: (mode: 'simple' | 'detailed') => void
  setDeputy: (key: DeputyKey) => void
  fastForward: (n: number, options?: SimulateOptions) => SimulateResult
  appointCommissioner: (role: CommissionerRole, candidate: CommissionerState) => void
  dismissConsequenceBeat: () => void
  clearNewspaperHeadline: () => void
  economyCutSubventions: () => void
  economyReduceOverheads: () => void
  economyRaiseLuc: () => void
  economyLaunchInitiative: (
    id: string,
    name: string,
    totalWeeks: number,
    completionEventId: string,
    pcCost: number,
    factionImpact: FactionDelta,
    statDelta: StatDelta,
  ) => void
  economyTakeLoan: (amount: number, source: LoanSource) => void
  courtGodfathers: () => void
  // Phase D — inbox
  inboxMarkRead: (id: string) => void
  inboxMarkAllRead: () => void
  // Onboarding hints
  dismissHint: (id: string) => void
  // Goal tracking
  setGoal: (id: string | null) => void
  beginSecondTerm: () => void
  // Phase E — research tree
  commissionResearchNode: (nodeId: string) => void
  // Projects
  commissionProject: (projectId: string) => void
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...STARTING_STATE,
  lastWeekRevenue: calculateWeeklyRevenue(STARTING_STATE as GameState),
  lastWeekExpenditure: calculateWeeklyExpenditure(STARTING_STATE as GameState),
  seenHints: loadSeenHints(),
  tick: () => {
    set(gameLoopTick(get()))
  },
  acceptGodfather: () => {
    const state = get()
    if (!state.activeGodfatherMessage) return
    const pendingInbox = state.inbox.find((m) => m.isGodfatherAsk && !m.actioned)
    set(resolveGodfather(state, state.activeGodfatherMessage, true, pendingInbox?.id))
  },
  refuseGodfather: () => {
    const state = get()
    if (!state.activeGodfatherMessage) return
    const pendingInbox = state.inbox.find((m) => m.isGodfatherAsk && !m.actioned)
    set(resolveGodfather(state, state.activeGodfatherMessage, false, pendingInbox?.id))
  },
  resolveEvent: (choiceId: string) => {
    const state = get()
    if (!state.activeEvent) return
    set(resolveEventAction(state, state.activeEvent, choiceId))
  },
  setMode: (mode: 'simple' | 'detailed') => {
    set({ mode })
  },
  setDeputy: (key: DeputyKey) => {
    const state = get()
    const profile = DEPUTY_PROFILES[key]
    let next: GameState = {
      ...state,
      deputy: { key, resentment: 0, revealed: false },
    }
    if (Object.keys(profile.factionBonuses).length > 0) {
      next = { ...next, factions: applyFactionDelta(next.factions, profile.factionBonuses) }
    }
    if (Object.keys(profile.statBonuses).length > 0) {
      next = applyDelta(next, profile.statBonuses)
    }
    set(next)
  },
  fastForward: (n: number, options?: SimulateOptions) => {
    const prevState = get()
    const result = simulateWeeks(prevState, n, options)
    const skipArticle = evaluateSkipNews(prevState, result.state, n)
    set({
      ...result.state,
      runMeta: {
        ...result.state.runMeta,
        simStrategy: options?.strategy ?? 'first',
        simSeed: result.seed,
        simWeeksSkipped: n,
      },
      newspaperHeadline: skipArticle,
    })
    return result
  },
  appointCommissioner: (role: CommissionerRole, candidate: CommissionerState) => {
    const state = get()
    const pcCost = 8
    if (state.stats.politicalCapital < pcCost) return
    const afterAppoint = applyDelta(
      { ...state, commissioners: { ...state.commissioners, [role]: candidate } },
      { politicalCapital: -pcCost },
    )
    const msg = generateCommissionerMessage(afterAppoint, role, candidate, 'appointed')
    set(msg ? { ...afterAppoint, inbox: [...afterAppoint.inbox, msg] } : afterAppoint)
  },
  dismissConsequenceBeat: () => set((s) => ({ consequenceBeats: s.consequenceBeats.slice(1) })),
  economyCutSubventions: () => {
    const s = get()
    if (s.stats.politicalCapital < 10) return
    if (s.stats.subventionCutRate >= 0.4) return
    const cooldownKey = 'cut-subventions'
    if ((s.economyCooldowns[cooldownKey] ?? 0) > s.week) return
    const newRate = Math.min(0.4, s.stats.subventionCutRate + 0.2)
    const afterStat = applyDelta(
      { ...s, economyCooldowns: { ...s.economyCooldowns, [cooldownKey]: s.week + 8 } },
      { subventionCutRate: newRate, politicalCapital: -10, publicTrust: -5 },
    )
    set({ ...afterStat, factions: applyFactionDelta(afterStat.factions, { informalEconomy: -8 }) })
  },
  economyReduceOverheads: () => {
    const s = get()
    if (s.stats.politicalCapital < 15) return
    const cooldownKey = 'reduce-overheads'
    if ((s.economyCooldowns[cooldownKey] ?? 0) > s.week) return
    const afterStat = applyDelta(
      { ...s, economyCooldowns: { ...s.economyCooldowns, [cooldownKey]: s.week + 8 } },
      { baseOverheads: -3, politicalCapital: -15 },
    )
    set({
      ...afterStat,
      factions: applyFactionDelta(afterStat.factions, { partyGodfathers: -6, lgChairmen: -5 }),
    })
  },
  economyRaiseLuc: () => {
    const s = get()
    if (s.stats.politicalCapital < 10) return
    if (s.stats.landUseChargeEnforcement >= 3) return
    const cooldownKey = 'raise-luc'
    if ((s.economyCooldowns[cooldownKey] ?? 0) > s.week) return
    const newLuc = Math.min(3, s.stats.landUseChargeEnforcement + 0.5)
    const afterStat = applyDelta(
      { ...s, economyCooldowns: { ...s.economyCooldowns, [cooldownKey]: s.week + 12 } },
      { landUseChargeEnforcement: newLuc, politicalCapital: -10 },
    )
    set({
      ...afterStat,
      factions: applyFactionDelta(afterStat.factions, { businessCommunity: -6 }),
    })
  },
  economyLaunchInitiative: (
    id,
    name,
    totalWeeks,
    completionEventId,
    pcCost,
    factionImpact,
    statDelta,
  ) => {
    const s = get()
    if (s.activeInitiative) return
    if (s.stats.politicalCapital < pcCost) return
    const delta: StatDelta = { ...statDelta, politicalCapital: -pcCost }
    let next = applyDelta(s, delta)
    if (Object.keys(factionImpact).length > 0) {
      next = { ...next, factions: applyFactionDelta(next.factions, factionImpact) }
    }
    if (id === 'grants-mobilisation') {
      next = { ...next, stateFlags: { ...next.stateFlags, 'world-bank-grant-submitted': true } }
    }
    set({
      ...next,
      activeInitiative: { id, name, weeksRemaining: totalWeeks, totalWeeks, completionEventId },
    })
  },
  economyTakeLoan: (amount: number, source: LoanSource) => {
    const s = get()
    let pcCost = 5
    if (source === 'bond_issuance') pcCost = 10
    if (source === 'federal_govt') pcCost = 15
    if (s.stats.politicalCapital < pcCost) return
    const afterPc = applyDelta(s, { politicalCapital: -pcCost })
    set(takeLoanAction(afterPc, amount, source))
  },
  courtGodfathers: () => {
    const s = get()
    if (s.stats.politicalCapital >= 25) return
    const cooldownKey = 'court-godfathers'
    if ((s.economyCooldowns[cooldownKey] ?? 0) > s.week) return
    const afterStat = applyDelta(
      { ...s, economyCooldowns: { ...s.economyCooldowns, [cooldownKey]: s.week + 6 } },
      { politicalCapital: 10, publicTrust: -3, corruptionPressure: 3 },
    )
    set({ ...afterStat, factions: applyFactionDelta(afterStat.factions, { partyGodfathers: 5 }) })
  },
  beginSecondTerm: () => {
    set((s) => ({
      ...s,
      isGameOver: false,
      gameOverType: undefined,
      gameOverReason: undefined,
      endingNarrative: undefined,
      electionResult: null,
      reElected: false,
    }))
  },
  clearNewspaperHeadline: () => {
    set({ newspaperHeadline: undefined })
  },
  inboxMarkRead: (id: string) => {
    set((s) => ({
      inbox: s.inbox.map((m) => (m.id === id ? { ...m, read: true } : m)),
    }))
  },
  inboxMarkAllRead: () => {
    set((s) => ({
      inbox: s.inbox.map((m) => ({ ...m, read: true })),
    }))
  },
  dismissHint: (id: string) => {
    set((s) => {
      const seenHints = [...s.seenHints, id]
      saveSeenHints(seenHints)
      return { seenHints, hintQueue: s.hintQueue.filter((h) => h !== id) }
    })
  },
  setGoal: (id: string | null) => set({ selectedGoalId: id }),
  commissionResearchNode: (nodeId: string) => {
    const state = get()
    const node = state.researchNodeStatuses[nodeId]
    if (node === 'commissioned' || node === 'completed') return
    set(commissionNode(nodeId, state))
  },
  commissionProject: (projectId: string) => {
    const state = get()
    const status = state.projectStatuses[projectId]
    if (status === 'commissioned' || status === 'completed') return
    set(commissionProjectAction(projectId, state))
  },
}))

let saveTimeout: ReturnType<typeof setTimeout> | null = null

function scheduleSave() {
  if (saveTimeout) clearTimeout(saveTimeout)
  saveTimeout = setTimeout(() => {
    const state = useGameStore.getState()
    saveGame(state)
  }, 500)
}

useGameStore.subscribe(() => {
  scheduleSave()
})
