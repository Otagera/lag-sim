import { create } from 'zustand'
import { STARTING_STATE } from '../data/startingState'
import { DEPUTY_PROFILES } from '../data/deputies'
import { resolveEvent as resolveEventAction } from '../engine/eventEngine'
import { tick as gameLoopTick } from '../engine/gameLoop'
import { resolveGodfather } from '../engine/godfatherEngine'
import { simulateWeeks, type SimulateOptions, type SimulateResult } from '../engine/simulateEngine'
import { evaluateSkipNews } from '../engine/evaluateNews'
import { applyDelta } from '../engine/statEngine'
import { applyFactionDelta } from '../engine/factionEngine'
import { saveGame } from './persistence'
import type { CommissionerRole, CommissionerState, DeputyKey, GameState } from './types'

export interface GameStore extends GameState {
  tick: () => void
  acceptGodfather: () => void
  refuseGodfather: () => void
  resolveEvent: (choiceId: string) => void
  setMode: (mode: 'simple' | 'detailed') => void
  setDeputy: (key: DeputyKey) => void
  fastForward: (n: number, options?: SimulateOptions) => SimulateResult
  appointCommissioner: (role: CommissionerRole, candidate: CommissionerState) => void
  clearNewspaperHeadline: () => void
  enrichNewspaperHeadline: (headline: string, deck: string) => void
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...STARTING_STATE,
  tick: () => {
    set(gameLoopTick(get()))
  },
  acceptGodfather: () => {
    const state = get()
    if (!state.activeGodfatherMessage) return
    set(resolveGodfather(state, state.activeGodfatherMessage, true))
  },
  refuseGodfather: () => {
    const state = get()
    if (!state.activeGodfatherMessage) return
    set(resolveGodfather(state, state.activeGodfatherMessage, false))
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
    set(applyDelta(
      { ...state, commissioners: { ...state.commissioners, [role]: candidate } },
      { politicalCapital: -pcCost },
    ))
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
