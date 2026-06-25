import type { GameState } from '../state/types'
import { PUBLICATIONS, type Publication } from '../data/publications'

function stateModifier(pub: Publication, state: GameState): number {
  let mod = 1
  if (state.riotModeActive) {
    switch (pub.id) {
      case 'punch': mod = 3; break
      case 'vanguard': mod = 0.8; break
      case 'the-nation': mod = 0.5; break
      case 'guardian': mod = 2; break
      case 'business-day': mod = 0.5; break
      case 'daily-trust': mod = 1; break
    }
    return mod
  }
  if (state.emergencySuspensionWeeks > 0) {
    switch (pub.id) {
      case 'punch': mod = 4; break
      case 'vanguard': mod = 0.5; break
      case 'the-nation': mod = 0.3; break
      case 'guardian': mod = 2; break
      case 'business-day': mod = 0.5; break
      case 'daily-trust': mod = 1.5; break
    }
    return mod
  }
  if (state.stats.corruptionPressure > 60) {
    switch (pub.id) {
      case 'punch': mod = 2; break
      case 'vanguard': mod = 1; break
      case 'the-nation': mod = 0.8; break
      case 'guardian': mod = 1.5; break
      case 'business-day': mod = 0.8; break
      case 'daily-trust': mod = 2; break
    }
    return mod
  }
  if (state.stats.cashReserve < -10) {
    switch (pub.id) {
      case 'punch': mod = 1.5; break
      case 'vanguard': mod = 1; break
      case 'the-nation': mod = 0.8; break
      case 'guardian': mod = 1.5; break
      case 'business-day': mod = 2.5; break
      case 'daily-trust': mod = 1; break
    }
    return mod
  }
  if (state.stats.publicTrust < 30) {
    switch (pub.id) {
      case 'punch': mod = 1; break
      case 'vanguard': mod = 1.8; break
      case 'the-nation': mod = 2; break
      case 'guardian': mod = 1.2; break
      case 'business-day': mod = 0.8; break
      case 'daily-trust': mod = 1; break
    }
    return mod
  }
  switch (pub.id) {
    case 'punch': return 1
    case 'vanguard': return 1.2
    case 'the-nation': return 1.2
    case 'guardian': return 1
    case 'business-day': return 0.8
    case 'daily-trust': return 0.8
    default: return 1
  }
}

function pickVariant<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function selectPublicationForArticle(
  state: GameState,
  category: string,
): Publication | null {
  const coverPubs = PUBLICATIONS.filter((p) =>
    p.coverage.categories.includes(category),
  )
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
    const fallback = pub.framing['background']
    if (fallback && fallback.length > 0) {
      return pickVariant(fallback)
    }
    return null
  }
  return pickVariant(variants)
}
