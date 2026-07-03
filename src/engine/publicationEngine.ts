import { PUBLICATIONS, type Publication } from '../data/publications'
import type { GameState } from '../state/types'

type PublicationWeightProfile = Record<string, number>

const DEFAULT_PUBLICATION_WEIGHTS: PublicationWeightProfile = {
  punch: 1,
  vanguard: 1.2,
  'the-nation': 1.2,
  guardian: 1,
  'business-day': 0.8,
  'daily-trust': 0.8,
}

const RIOT_PUBLICATION_WEIGHTS: PublicationWeightProfile = {
  punch: 3,
  vanguard: 0.8,
  'the-nation': 0.5,
  guardian: 2,
  'business-day': 0.5,
  'daily-trust': 1,
}

const EMERGENCY_PUBLICATION_WEIGHTS: PublicationWeightProfile = {
  punch: 4,
  vanguard: 0.5,
  'the-nation': 0.3,
  guardian: 2,
  'business-day': 0.5,
  'daily-trust': 1.5,
}

const CORRUPTION_PUBLICATION_WEIGHTS: PublicationWeightProfile = {
  punch: 2,
  vanguard: 1,
  'the-nation': 0.8,
  guardian: 1.5,
  'business-day': 0.8,
  'daily-trust': 2,
}

const DEFICIT_PUBLICATION_WEIGHTS: PublicationWeightProfile = {
  punch: 1.5,
  vanguard: 1,
  'the-nation': 0.8,
  guardian: 1.5,
  'business-day': 2.5,
  'daily-trust': 1,
}

const LOW_TRUST_PUBLICATION_WEIGHTS: PublicationWeightProfile = {
  punch: 1,
  vanguard: 1.8,
  'the-nation': 2,
  guardian: 1.2,
  'business-day': 0.8,
  'daily-trust': 1,
}

function activePublicationWeights(state: GameState): PublicationWeightProfile {
  if (state.riotModeActive) return RIOT_PUBLICATION_WEIGHTS
  if (state.emergencySuspensionWeeks > 0) return EMERGENCY_PUBLICATION_WEIGHTS
  if (state.stats.corruptionPressure > 60) return CORRUPTION_PUBLICATION_WEIGHTS
  if (state.stats.cashReserve < -10) return DEFICIT_PUBLICATION_WEIGHTS
  if (state.stats.publicTrust < 30) return LOW_TRUST_PUBLICATION_WEIGHTS
  return DEFAULT_PUBLICATION_WEIGHTS
}

function stateModifier(pub: Publication, state: GameState): number {
  return activePublicationWeights(state)[pub.id] ?? 1
}

function pickVariant<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function selectPublicationForArticle(
  state: GameState,
  category: string,
): Publication | null {
  const coverPubs = PUBLICATIONS.filter((p) => p.coverage.categories.includes(category))
  if (coverPubs.length === 0) {
    const fallback = PUBLICATIONS.find((p) => p.id === 'vanguard')
    return fallback ?? PUBLICATIONS[0]
  }

  const weighted = coverPubs.map((p) => {
    let weight = p.baseWeight * stateModifier(p, state)
    if (p.coverage.preferredCategory === category) {
      weight *= 1.5
    }
    return { pub: p, weight: Math.max(0.1, weight) }
  })

  const totalWeight = weighted.reduce((s, w) => s + w.weight, 0)
  const roll = Math.random() * totalWeight
  let cumulative = 0
  for (const entry of weighted) {
    cumulative += entry.weight
    if (roll < cumulative) return entry.pub
  }

  return weighted[weighted.length - 1].pub
}

export function pickFramingVariant(
  pub: Publication,
  category: string,
): { caption: string; editorialNote: string } | null {
  const variants = pub.framing[category]
  if (!variants || variants.length === 0) {
    const fallback = pub.framing.background
    if (fallback && fallback.length > 0) {
      return pickVariant(fallback)
    }
    return null
  }
  return pickVariant(variants)
}
