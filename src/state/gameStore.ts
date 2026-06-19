import { create } from 'zustand'
import { STARTING_STATE } from '../data/startingState'
import { DEPUTY_PROFILES } from '../data/deputies'
import { resolveEvent as resolveEventAction } from '../engine/eventEngine'
import { tick as gameLoopTick } from '../engine/gameLoop'
import { resolveGodfather } from '../engine/godfatherEngine'
import { applyDelta } from '../engine/statEngine'
import { applyFactionDelta } from '../engine/factionEngine'
import { saveGame } from './persistence'
import type { DeputyKey, GameState } from './types'

export interface GameStore extends GameState {
  tick: () => void
  acceptGodfather: () => void
  refuseGodfather: () => void
  resolveEvent: (choiceId: string) => void
  setMode: (mode: 'simple' | 'detailed') => void
  setDeputy: (key: DeputyKey) => void
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
