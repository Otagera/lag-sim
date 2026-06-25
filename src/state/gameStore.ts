import { create } from 'zustand'
import { STARTING_STATE } from '../data/startingState'
import { DEPUTY_PROFILES } from '../data/deputies'
import { takeLoan as takeLoanAction } from '../engine/debtEngine'
import { resolveEvent as resolveEventAction } from '../engine/eventEngine'
import { tick as gameLoopTick } from '../engine/gameLoop'
import { resolveGodfather } from '../engine/godfatherEngine'
import { simulateWeeks, type SimulateOptions, type SimulateResult } from '../engine/simulateEngine'
import { evaluateSkipNews } from '../engine/evaluateNews'
import { applyDelta } from '../engine/statEngine'
import { applyFactionDelta } from '../engine/factionEngine'
import { generateCommissionerMessage } from '../engine/inboxEngine'
import { commissionNode } from '../engine/researchEngine'
import { saveGame } from './persistence'
import type { CommissionerRole, CommissionerState, DeputyKey, GameState, LoanSource } from './types'

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
  enrichNewspaperHeadline: (headline: string, deck: string) => void
  economyCutSubventions: () => void
  economyReduceOverheads: () => void
  economyRaiseLuc: () => void
  economyLaunchInitiative: (id: string, name: string, totalWeeks: number, completionEventId: string, pcCost: number, factionImpact: Record<string, number>, statDelta: Record<string, number>) => void
  economyTakeLoan: (amount: number, source: LoanSource) => void
  // Phase D — inbox
  inboxMarkRead: (id: string) => void
  inboxMarkAllRead: () => void
  // Goal tracking
  setGoal: (id: string | null) => void
  // Phase E — research tree
  commissionResearchNode: (nodeId: string) => void
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...STARTING_STATE,
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
  dismissConsequenceBeat: () => set({ lastConsequenceBeat: null }),
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
    set({ ...afterStat, factions: applyFactionDelta(afterStat.factions, { partyGodfathers: -6, lgChairmen: -5 }) })
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
    set({ ...afterStat, factions: applyFactionDelta(afterStat.factions, { businessCommunity: -6 }) })
  },
  economyLaunchInitiative: (id, name, totalWeeks, completionEventId, pcCost, factionImpact, statDelta) => {
    const s = get()
    if (s.activeInitiative) return
    if (s.stats.politicalCapital < pcCost) return
    const delta = { ...statDelta, politicalCapital: -pcCost } as Record<string, number>
    let next = applyDelta(s, delta)
    if (Object.keys(factionImpact).length > 0) {
      next = { ...next, factions: applyFactionDelta(next.factions, factionImpact as any) }
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
  clearNewspaperHeadline: () => {
    set({ newspaperHeadline: undefined })
  },
  enrichNewspaperHeadline: (headline: string, deck: string) => {
    set((s) => ({
      newspaperHeadline: s.newspaperHeadline
        ? { ...s.newspaperHeadline, headline, deck, llmGenerated: true, llmPending: false }
        : undefined,
    }))
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
  setGoal: (id: string | null) => set({ selectedGoalId: id }),
  commissionResearchNode: (nodeId: string) => {
    const state = get()
    const node = state.researchNodeStatuses[nodeId]
    if (node === 'commissioned' || node === 'completed') return
    set(commissionNode(nodeId, state))
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
