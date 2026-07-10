import { create, type StoreApi } from 'zustand'
import { getDeviceId } from '../analytics/telemetry'
import { instrumentNewGame, instrumentStateChange, instrumentChoiceResolved } from '../analytics/instrumentation'
import { uploadSave, fetchCloudSave } from '../cloud/api'
import { DEPUTY_PROFILES } from '../data/deputies'
import { PRESTIGE_ACTIONS } from '../data/prestigeActions'
import { STARTING_STATE } from '../data/startingState'
import { takeLoan as takeLoanAction } from '../engine/debtEngine'
import { evaluateSkipNews } from '../engine/evaluateNews'
import { resolveEvent as resolveEventAction } from '../engine/eventEngine'
import { calculateWeeklyExpenditure } from '../engine/expenditureEngine'
import { applyFactionDelta } from '../engine/factionEngine'
import { beginSecondTermState, tick as gameLoopTick } from '../engine/gameLoop'
import { resolveGodfather } from '../engine/godfatherEngine'
import { generateCommissionerMessage } from '../engine/inboxEngine'
import { commissionProject as commissionProjectAction } from '../engine/projectsEngine'
import { commissionNode } from '../engine/researchEngine'
import { calculateWeeklyRevenue } from '../engine/revenueEngine'
import { type SimulateOptions, type SimulateResult, simulateWeeks } from '../engine/simulateEngine'
import { applyDelta } from '../engine/statEngine'
import { fromSerializable, loadSeenHints, saveGame, saveSeenHints, toSerializable, type SerializableState } from './persistence'
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
  inboxMarkRead: (id: string) => void
  inboxMarkAllRead: () => void
  dismissHint: (id: string) => void
  setGoal: (id: string | null) => void
  setGovernorName: (name: string) => void
  shareMoment: () => void
  dismissMoment: () => void
  beginSecondTerm: () => void
  commissionResearchNode: (nodeId: string) => void
  commissionProject: (projectId: string) => void
  activateQueuedEvent: (eventId: string) => void
  launchPrestigeAction: (id: string) => void
}

type StoreSet = StoreApi<GameStore>['setState']
type StoreGet = StoreApi<GameStore>['getState']
type CoreActions = Pick<
  GameStore,
  | 'tick'
  | 'acceptGodfather'
  | 'refuseGodfather'
  | 'resolveEvent'
  | 'setMode'
  | 'setDeputy'
  | 'fastForward'
  | 'appointCommissioner'
  | 'dismissConsequenceBeat'
>
type EconomyLeverActions = Pick<
  GameStore,
  'economyCutSubventions' | 'economyReduceOverheads' | 'economyRaiseLuc'
>
type EconomyInvestmentActions = Pick<
  GameStore,
  'economyLaunchInitiative' | 'economyTakeLoan' | 'courtGodfathers'
>
type MetaActions = Pick<
  GameStore,
  | 'beginSecondTerm'
  | 'clearNewspaperHeadline'
  | 'inboxMarkRead'
  | 'inboxMarkAllRead'
  | 'dismissHint'
  | 'setGoal'
  | 'setGovernorName'
  | 'shareMoment'
  | 'dismissMoment'
  | 'commissionResearchNode'
  | 'commissionProject'
  | 'activateQueuedEvent'
  | 'launchPrestigeAction'
>

const resolveGodfatherAsk = (set: StoreSet, get: StoreGet, accepted: boolean) => {
  const state = get()
  if (!state.activeGodfatherMessage) return
  const pendingInbox = state.inbox.find((m) => m.isGodfatherAsk && !m.actioned)
  set(resolveGodfather(state, state.activeGodfatherMessage, accepted, pendingInbox?.id))
}

const createCoreActions = (set: StoreSet, get: StoreGet): CoreActions => ({
  tick: () => {
    const prev = get()
    const next = gameLoopTick(prev)
    set(next)
    instrumentStateChange(next)
  },
  acceptGodfather: () => resolveGodfatherAsk(set, get, true),
  refuseGodfather: () => resolveGodfatherAsk(set, get, false),
  resolveEvent: (choiceId) => {
    const state = get()
    if (!state.activeEvent) return
    const eventId = state.activeEvent.id
    const next = resolveEventAction(state, state.activeEvent, choiceId)
    set(next)
    instrumentChoiceResolved(next, choiceId, eventId)
  },
  setMode: (mode) => set({ mode }),
  setDeputy: (key) => {
    const state = get()
    const profile = DEPUTY_PROFILES[key]
    let next: GameState = { ...state, deputy: { key, resentment: 0, revealed: false } }
    if (Object.keys(profile.factionBonuses).length > 0) {
      next = { ...next, factions: applyFactionDelta(next.factions, profile.factionBonuses) }
    }
    if (Object.keys(profile.statBonuses).length > 0) next = applyDelta(next, profile.statBonuses)
    set(next)
  },
  fastForward: (n, options) => {
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
  appointCommissioner: (role, candidate) => {
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
})

const createEconomyLeverActions = (set: StoreSet, get: StoreGet): EconomyLeverActions => ({
  economyCutSubventions: () => {
    const s = get()
    if (s.stats.politicalCapital < 10 || s.stats.subventionCutRate >= 0.4) return
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
    if (s.stats.politicalCapital < 10 || s.stats.landUseChargeEnforcement >= 3) return
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
})

const createEconomyInvestmentActions = (
  set: StoreSet,
  get: StoreGet,
): EconomyInvestmentActions => ({
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
    if (s.activeInitiative || s.stats.politicalCapital < pcCost) return
    let next = applyDelta(s, { ...statDelta, politicalCapital: -pcCost })
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
  economyTakeLoan: (amount, source) => {
    const s = get()
    let pcCost = 5
    if (source === 'bond_issuance') pcCost = 10
    if (source === 'federal_govt') pcCost = 15
    if (s.stats.politicalCapital < pcCost) return
    set(takeLoanAction(applyDelta(s, { politicalCapital: -pcCost }), amount, source))
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
})

const createMetaActions = (set: StoreSet, get: StoreGet): MetaActions => ({
  beginSecondTerm: () =>
    set((s) => {
      // Offer the re-election share as the second term begins (capturing the
      // vote share before electionResult is cleared). It's a game-over at the
      // moment of victory, so it can't be caught by the tick-based detector.
      const offerReElection = !s.sharedMoments.includes('re-election') && !s.pendingMoment
      // Capture the vote-share label before beginSecondTermState clears electionResult.
      const pendingMoment = offerReElection
        ? {
            type: 're-election' as const,
            key: 're-election',
            label:
              s.electionResult != null ? `${s.electionResult.toFixed(1)}% of the vote` : undefined,
          }
        : s.pendingMoment
      return { ...beginSecondTermState(s), pendingMoment }
    }),
  clearNewspaperHeadline: () => set({ newspaperHeadline: undefined }),
  inboxMarkRead: (id) =>
    set((s) => ({ inbox: s.inbox.map((m) => (m.id === id ? { ...m, read: true } : m)) })),
  inboxMarkAllRead: () => set((s) => ({ inbox: s.inbox.map((m) => ({ ...m, read: true })) })),
  dismissHint: (id) => {
    set((s) => {
      const seenHints = [...s.seenHints, id]
      saveSeenHints(seenHints)
      return { seenHints, hintQueue: s.hintQueue.filter((h) => h !== id) }
    })
  },
  setGoal: (id) => set({ selectedGoalId: id }),
  // Cap length only; leading/trailing whitespace is trimmed at read-time
  // (administrationLabel / caption) so spaces can be typed between words.
  setGovernorName: (name) => set({ governorName: name.slice(0, 24) }),
  // Sharing or dismissing a moment both retire it into the ledger so it is
  // never offered again, and clear the pending slot.
  shareMoment: () =>
    set((s) =>
      s.pendingMoment
        ? { sharedMoments: [...s.sharedMoments, s.pendingMoment.key], pendingMoment: null }
        : {},
    ),
  dismissMoment: () =>
    set((s) =>
      s.pendingMoment
        ? { sharedMoments: [...s.sharedMoments, s.pendingMoment.key], pendingMoment: null }
        : {},
    ),
  commissionResearchNode: (nodeId) => {
    const state = get()
    const node = state.researchNodeStatuses[nodeId]
    if (node === 'commissioned' || node === 'completed') return
    set(commissionNode(nodeId, state))
  },
  commissionProject: (projectId) => {
    const state = get()
    const status = state.projectStatuses[projectId]
    if (status === 'commissioned' || status === 'completed') return
    set(commissionProjectAction(projectId, state))
  },
  activateQueuedEvent: (eventId) =>
    set((s) => {
      const idx = s.eventQueue.findIndex((e) => e.id === eventId)
      if (idx === -1) return {}
      const event = s.eventQueue[idx]
      return {
        activeEvent: event,
        eventQueue: [...s.eventQueue.slice(0, idx), ...s.eventQueue.slice(idx + 1)],
      }
    }),
  launchPrestigeAction: (id) => {
    const s = get()
    const def = PRESTIGE_ACTIONS[id]
    if (!def) return

    if (def.type === 'timed') {
      if (s.activeInitiative) return
      if (s.stats.cashReserve < def.cashCost) return

      let next = applyDelta(s, { cashReserve: -def.cashCost })
      if (def.statDelta && Object.keys(def.statDelta).length > 0) {
        next = applyDelta(next, def.statDelta)
      }
      if (def.factionImpact && Object.keys(def.factionImpact).length > 0) {
        next = { ...next, factions: applyFactionDelta(next.factions, def.factionImpact) }
      }

      set({
        ...next,
        activeInitiative: {
          id: def.id,
          name: def.name,
          weeksRemaining: def.weeksToComplete!,
          totalWeeks: def.weeksToComplete!,
          completionEventId: '',
          pcReward: def.pcReward,
        },
      })
    } else if (def.type === 'instant') {
      const cooldownKey = `prestige-${def.id}`
      if ((s.prestigeCooldowns[cooldownKey] ?? 0) > s.week) return
      if (s.stats.cashReserve < def.cashCost) return

      let next = applyDelta(s, { cashReserve: -def.cashCost, politicalCapital: def.pcReward })
      if (def.statDelta && Object.keys(def.statDelta).length > 0) {
        next = applyDelta(next, def.statDelta)
      }
      if (def.factionImpact && Object.keys(def.factionImpact).length > 0) {
        next = { ...next, factions: applyFactionDelta(next.factions, def.factionImpact) }
      }

      set({
        ...next,
        prestigeCooldowns: {
          ...next.prestigeCooldowns,
          [cooldownKey]: s.week + (def.cooldownWeeks ?? 0),
        },
      })
    }
  },
})

export const useGameStore = create<GameStore>((set, get) => ({
  ...STARTING_STATE,
  lastWeekRevenue: calculateWeeklyRevenue(STARTING_STATE as GameState),
  lastWeekExpenditure: calculateWeeklyExpenditure(STARTING_STATE as GameState),
  seenHints: loadSeenHints(),
  ...createCoreActions(set, get),
  ...createEconomyLeverActions(set, get),
  ...createEconomyInvestmentActions(set, get),
  ...createMetaActions(set, get),
}))

let saveTimeout: ReturnType<typeof setTimeout> | null = null
let cloudSaveTimeout: ReturnType<typeof setTimeout> | null = null

function scheduleSave() {
  if (saveTimeout) clearTimeout(saveTimeout)
  saveTimeout = setTimeout(() => {
    const state = useGameStore.getState()
    saveGame(state)
  }, 500)

  if (cloudSaveTimeout) clearTimeout(cloudSaveTimeout)
  cloudSaveTimeout = setTimeout(() => {
    const state = useGameStore.getState()
    const serialized = toSerializable(state) as unknown as Record<string, unknown>
    uploadSave(getDeviceId(), serialized, serialized.version as number)
  }, 5000)
}

useGameStore.subscribe(() => {
  scheduleSave()
})

// On startup: if no local save but cloud has one, restore from cloud
;(async function tryRestoreFromCloud() {
  const initial = useGameStore.getState()
  if (initial.week > 1) return
  const deviceId = getDeviceId()
  const cloudEntry = await fetchCloudSave(deviceId)
  if (!cloudEntry) return
  const cloudData = cloudEntry.save_data as Record<string, unknown>
  if (typeof cloudData.week === 'number' && cloudData.week > 1) {
    const restored = fromSerializable(cloudData as unknown as SerializableState)
    useGameStore.setState({ ...restored })
  }
})()

// Detect new game: when week resets to 1 after having been > 1
let analyticsPreviousWeek = useGameStore.getState().week
useGameStore.subscribe((state) => {
  if (state.week === 1 && analyticsPreviousWeek > 1) {
    instrumentNewGame(state)
  }
  analyticsPreviousWeek = state.week
})
