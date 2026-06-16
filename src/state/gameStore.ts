import { create } from 'zustand'
import { STARTING_STATE } from '../data/startingState'
import { resolveEvent as resolveEventAction } from '../engine/eventEngine'
import { tick as gameLoopTick } from '../engine/gameLoop'
import { resolveGodfather } from '../engine/godfatherEngine'
import { saveGame } from './persistence'
import type { GameState } from './types'

export interface GameStore extends GameState {
  tick: () => void
  acceptGodfather: () => void
  refuseGodfather: () => void
  resolveEvent: (choiceId: string) => void
  setMode: (mode: 'simple' | 'detailed') => void
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
