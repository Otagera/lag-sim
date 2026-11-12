import type { GameState, NPCArchetypeKey } from '../state/types'

/**
 * Promises the governor can make to political actors (docs/political-actors.md §6).
 *
 * A choice with `makePromise: '<id>'` opens one. When it falls due, `kept`
 * decides the outcome; a later choice with `breakPromise: '<id>'` breaks it
 * immediately. Kept promises earn lasting goodwill; broken ones are
 * remembered permanently — and every other actor hears about it.
 */
export type PromiseDefinition = {
  actor: NPCArchetypeKey | 'fashemu'
  /** What you gave your word to, as the governor would say it */
  terms: string
  dueInWeeks: number
  /** Evaluated on the due week if nothing broke it earlier */
  kept: (s: GameState) => boolean
  /** One-line hint shown in the numbers view: how it will be judged */
  test: string
}

export const PROMISES = {
  'journalist-monitoring-board': {
    actor: 'journalist',
    terms: 'Keep the procurement monitoring board independent',
    dueInWeeks: 26,
    kept: (s) => s.stats.corruptionPressure <= 55,
    test: 'Corruption Pressure ≤ 55 when due',
  },
  'union-wage-uplift': {
    actor: 'union-leader',
    terms: 'Pay the wage uplift on time',
    dueInWeeks: 26,
    kept: (s) => s.stats.cashReserve >= 0 && s.consecutiveDeficitWeeks === 0,
    test: 'Treasury in credit when due',
  },
  'oba-consult-palace': {
    actor: 'oba-liaison',
    terms: 'Consult the palace before touching traditional land',
    dueInWeeks: 52,
    kept: () => true,
    test: 'Broken if you override a traditional land claim',
  },
  'mogul-ppp-delivery': {
    actor: 'business-mogul',
    terms: 'Keep the PPP corridor on schedule',
    dueInWeeks: 26,
    kept: (s) => s.stats.infrastructureScore >= 45,
    test: 'Infrastructure ≥ 45 when due',
  },
  'diaspora-transparency': {
    actor: 'diaspora-activist',
    terms: 'Publish how the consortium money is spent',
    dueInWeeks: 26,
    kept: (s) => s.stats.corruptionPressure <= 50,
    test: 'Corruption Pressure ≤ 50 when due',
  },
  'federal-stay-on-message': {
    actor: 'federal-liaison',
    terms: 'Stay on message with the Villa',
    dueInWeeks: 39,
    kept: () => true,
    test: 'Broken if you publicly defy Abuja',
  },
  'fashemu-loyalty': {
    actor: 'fashemu',
    terms: 'Keep faith with the party machine',
    dueInWeeks: 26,
    kept: () => true,
    test: 'Broken if you refuse one of his asks',
  },
} satisfies Record<string, PromiseDefinition>

export type PromiseId = keyof typeof PROMISES
