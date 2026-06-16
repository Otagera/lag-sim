import { create } from 'zustand'
import { STARTING_STATE } from '../data/startingState'
import type { GameState } from './types'

export const useGameStore = create<GameState>(() => ({
  ...STARTING_STATE,
}))
