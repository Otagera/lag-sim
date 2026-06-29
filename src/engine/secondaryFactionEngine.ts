import type { GameState, SecondaryFactionKey, SecondaryFactionState } from '../state/types'

const NEUTRAL_TARGETS: Record<SecondaryFactionKey, number> = {
  creativeEconomy: 50,
  techSector: 50,
  medicalAssociation: 55,
  agrarianSector: 45,
}

const BASE_DRIFT_RATES: Record<SecondaryFactionKey, number> = {
  creativeEconomy: 0.02,
  techSector: 0.015,
  medicalAssociation: 0.01,
  agrarianSector: 0.02,
}

const SEASONAL_MODIFIERS: Record<string, Partial<Record<SecondaryFactionKey, { delta: number; multiplier?: number }>>> = {
  // Detty December (weeks ~48-52): creativeEconomy surges
  detty: {
    creativeEconomy: { delta: 5 },
  },
  // Sallah (Eid-el-Kabir): agrarianSector active
  sallah: {
    agrarianSector: { delta: 4 },
  },
  // Eyo Festival: tourism boost
  eyo: {
    creativeEconomy: { delta: 3 },
  },
  // Harmattan (dry season): agrarian suffers, medical sees strain
  harmattan: {
    agrarianSector: { delta: -2 },
    medicalAssociation: { delta: 1 },
  },
}

export function tickSecondaryFactions(state: GameState, isDetty: boolean, isSallah: boolean, isEyo: boolean, isHarmattanSeason: boolean): GameState {
  const factions: SecondaryFactionState = { ...state.secondaryFactions }

  for (const key of Object.keys(factions) as SecondaryFactionKey[]) {
    const neutral = NEUTRAL_TARGETS[key]
    const rate = BASE_DRIFT_RATES[key]
    const current = factions[key]
    const drift = (neutral - current) * rate
    factions[key] = Math.max(0, Math.min(100, current + drift))
  }

  // Seasonal modifiers
  if (isDetty) {
    const mod = SEASONAL_MODIFIERS.detty
    for (const [key, effect] of Object.entries(mod)) {
      factions[key as SecondaryFactionKey] = Math.max(0, Math.min(100, factions[key as SecondaryFactionKey] + effect.delta))
    }
  }
  if (isSallah) {
    const mod = SEASONAL_MODIFIERS.sallah
    for (const [key, effect] of Object.entries(mod)) {
      factions[key as SecondaryFactionKey] = Math.max(0, Math.min(100, factions[key as SecondaryFactionKey] + effect.delta))
    }
  }
  if (isEyo) {
    const mod = SEASONAL_MODIFIERS.eyo
    for (const [key, effect] of Object.entries(mod)) {
      factions[key as SecondaryFactionKey] = Math.max(0, Math.min(100, factions[key as SecondaryFactionKey] + effect.delta))
    }
  }
  if (isHarmattanSeason) {
    const mod = SEASONAL_MODIFIERS.harmattan
    for (const [key, effect] of Object.entries(mod)) {
      factions[key as SecondaryFactionKey] = Math.max(0, Math.min(100, factions[key as SecondaryFactionKey] + effect.delta))
    }
  }

  return { ...state, secondaryFactions: factions }
}
