import { describe, it, expect, vi, afterEach } from 'vitest'
import { STARTING_STATE } from '../../data/startingState'
import type { GameState, StatKey, FactionKey, ConstituencyKey } from '../../state/types'
import { tick } from '../gameLoop'
import { resolveEvent } from '../eventEngine'
import { resolveGodfather } from '../godfatherEngine'

const BOUNDS: Record<StatKey, { min: number; max: number }> = {
  cashReserve: { min: -Infinity, max: Infinity },
  igr: { min: 0, max: Infinity },
  expenditure: { min: 0, max: Infinity },
  publicTrust: { min: 0, max: 100 },
  infrastructureScore: { min: 0, max: 100 },
  politicalCapital: { min: 0, max: 200 },
  federalRelationship: { min: -50, max: 50 },
  securityIndex: { min: 0, max: 100 },
  corruptionPressure: { min: 15, max: 80 },
  youthTension: { min: 0, max: 100 },
  ghostWorkerRate: { min: 0.05, max: 0.20 },
  contractorBacklog: { min: 0, max: Infinity },
  debtStock: { min: 0, max: Infinity },
  weeklyDebtRepayment: { min: 0, max: Infinity },
  weeklyDebtInterest: { min: 0, max: Infinity },
  landUseChargeEnforcement: { min: 1.0, max: 3.0 },
  grantsCompliance: { min: 0, max: 1.0 },
  civilServiceReformScore: { min: 0, max: 100 },
  baseOverheads: { min: -Infinity, max: Infinity },
  subventionCutRate: { min: 0, max: 0.4 },
  capitalEfficiency: { min: 0, max: 1.0 },
}

const BOUNDED_STATS = Object.entries(BOUNDS).filter(
  ([, b]) => b.min !== -Infinity || b.max !== Infinity,
) as [StatKey, { min: number; max: number }][]

const FACTIONS: FactionKey[] = [
  'businessCommunity',
  'informalEconomy',
  'partyGodfathers',
  'federalGovt',
  'civilSocietyMedia',
  'lgChairmen',
]

const CONSTITUENCIES: ConstituencyKey[] = [
  'lagosIsland', 'etiOsa', 'ibejuLekki', 'surulere', 'amuwoOdofin',
  'apapa', 'oshodiIsolo', 'mushin', 'shomolu', 'kosofe',
  'lagosMainland', 'ikeja', 'alimosho', 'agege', 'ifakoIjaye',
  'badagry', 'epe', 'ikorodu', 'ojo', 'ajeromiIfelodun',
]

function invariants(state: GameState, week: number) {
  for (const [key, { min, max }] of BOUNDED_STATS) {
    const val = state.stats[key]
    expect(
      val >= min && val <= max,
      `Week ${week}: ${key} = ${val}, expected [${min}, ${max}]`,
    ).toBe(true)
  }

  for (const key of FACTIONS) {
    const val = state.factions[key]
    expect(
      val >= -100 && val <= 100,
      `Week ${week}: faction ${key} = ${val}, expected [-100, 100]`,
    ).toBe(true)
  }

  for (const key of CONSTITUENCIES) {
    const val = state.constituencyApproval[key]
    expect(
      val >= 0 && val <= 100,
      `Week ${week}: constituency ${key} = ${val}, expected [0, 100]`,
    ).toBe(true)
  }

  expect(state.week).toBeGreaterThan(0)

  expect(state.eventsResolvedThisWeek).toBeLessThanOrEqual(2)

  expect(state.stats.corruptionPressure).toBeGreaterThanOrEqual(15)
  expect(state.stats.corruptionPressure).toBeLessThanOrEqual(80)

  // Newspaper: lastNewsWeek is within valid range
  expect(state.lastNewsWeek).toBeGreaterThanOrEqual(0)
  expect(state.lastNewsWeek).toBeLessThanOrEqual(state.week)

  // Phase E: research node statuses are valid
  if (state.researchNodeStatuses) {
    for (const [, status] of Object.entries(state.researchNodeStatuses)) {
      expect(['locked', 'available', 'commissioned', 'completed']).toContain(status)
    }
  }
  if (state.commissionedResearchNodes) {
    for (const crn of state.commissionedResearchNodes) {
      expect(typeof crn.nodeId).toBe('string')
      expect(typeof crn.completionWeek).toBe('number')
      expect(crn.completionWeek).toBeGreaterThan(0)
    }
  }
}

/**
 * Run a simulation with a fixed Math.random seed value.
 * The seed is the return value for every Math.random call.
 */
function runWithSeed(
  seed: number,
  weeks: number,
  eventStrategy: 'first' | 'alternate' | 'last' = 'first',
  godfatherStrategy: 'accept' | 'refuse' | 'alternate' = 'alternate',
): GameState {
  vi.spyOn(Math, 'random').mockReturnValue(seed)

  const state = JSON.parse(JSON.stringify(STARTING_STATE)) as GameState

  let s = state
  for (let w = 0; w < weeks; w++) {
    s = tick(s)
    invariants(s, w)

    if (s.activeGodfatherMessage) {
      const accept = godfatherStrategy === 'accept'
        ? true
        : godfatherStrategy === 'refuse'
          ? false
          : w % 2 === 0
      s = resolveGodfather(s, s.activeGodfatherMessage, accept)
      invariants(s, w)
    }

    if (s.activeEvent) {
      const choiceIdx = eventStrategy === 'first'
        ? 0
        : eventStrategy === 'last'
          ? s.activeEvent.choices.length - 1
          : w % 2
      const choiceId = s.activeEvent.choices[choiceIdx]?.id
      if (choiceId) {
        s = resolveEvent(s, s.activeEvent, choiceId)
        invariants(s, w)
      }
    }
  }

  return s
}

// async function awaitEventModule() {
//   return await import('../eventEngine')
// }
/* placeholder for event module import */

describe('simulation — deterministic scenarios', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  const SEEDS = [0.1, 0.25, 0.5, 0.75, 0.9]
  const STRATEGIES = [
    { event: 'first' as const, godfather: 'alternate' as const, label: 'first-choice/alternate-godfather' },
    { event: 'alternate' as const, godfather: 'accept' as const, label: 'alternate-choice/accept-godfather' },
    { event: 'last' as const, godfather: 'refuse' as const, label: 'last-choice/refuse-godfather' },
  ]

  for (const seed of SEEDS) {
    for (const strat of STRATEGIES) {
      it(`runs 20 weeks maintaining stat invariants (seed=${seed}, ${strat.label})`, () => {
        const end = runWithSeed(seed, 20, strat.event, strat.godfather)
        // Invariants are checked mid-loop; here just verify final state is internally consistent
        expect(end.week).toBeGreaterThanOrEqual(2) // at least one tick happened
        // If game ended early due to fiscal pressure, that's valid; verify stats stayed in bounds
        for (const [key, { min, max }] of BOUNDED_STATS) {
          expect(end.stats[key]).toBeGreaterThanOrEqual(min)
          expect(end.stats[key]).toBeLessThanOrEqual(max)
        }
      })
    }
  }

  it('tick increments week by exactly 1 each time', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    let s = JSON.parse(JSON.stringify(STARTING_STATE)) as GameState
    expect(s.week).toBe(1)
    s = tick(s)
    expect(s.week).toBe(2)
    s = tick(s)
    expect(s.week).toBe(3)
  })

  it('eventsResolvedThisWeek resets to 0 at the start of each tick', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    let s = JSON.parse(JSON.stringify(STARTING_STATE)) as GameState
    // If we resolve an event in week 1, eventsResolvedThisWeek should be 1
    s = tick(s)
    if (s.activeEvent) {
      s = resolveEvent(s, s.activeEvent, s.activeEvent.choices[0].id)
      expect(s.eventsResolvedThisWeek).toBe(1)
    }
    // Next tick should reset to 0 (or a new event drawn)
    s = tick(s)
    expect(s.eventsResolvedThisWeek).toBe(0)
  })

  it('cash reserve changes each week by budget net', () => {
    const s = JSON.parse(JSON.stringify(STARTING_STATE)) as GameState
    const initialCash = s.stats.cashReserve
    const next = tick(s)
    // cashReserve should have changed (budget net was applied)
    expect(next.stats.cashReserve).not.toBe(initialCash)
  })
})

describe('simulation — invariant fuzz', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  function randomSequence(values: number[]) {
    let i = 0
    return () => values[i++ % values.length]
  }

  it('alternating random sequence does not break invariants', () => {
    vi.spyOn(Math, 'random').mockImplementation(randomSequence([0.1, 0.9, 0.3, 0.7, 0.5]))

    let s = JSON.parse(JSON.stringify(STARTING_STATE)) as GameState
    for (let w = 0; w < 15; w++) {
      s = tick(s)
      invariants(s, w)

      if (s.activeEvent) {
        // Pick a random choice index based on week
        const idx = w % s.activeEvent.choices.length
        s = resolveEvent(s, s.activeEvent, s.activeEvent.choices[idx].id)
        invariants(s, w)
      }

      if (s.activeGodfatherMessage) {
        s = resolveGodfather(s, s.activeGodfatherMessage, w % 3 !== 0)
        invariants(s, w)
      }
    }
  })

  it('all-refuse strategy does not trigger game over early', () => {
    // Use 0.24 so first godfather check passes (random < 0.25) at week 3
    // Subsequent draws use escalating chance, 0.24 triggers at intervals within 12 weeks
    vi.spyOn(Math, 'random').mockReturnValue(0.24)
    let s = JSON.parse(JSON.stringify(STARTING_STATE)) as GameState

    for (let w = 0; w < 12; w++) {
      s = tick(s)
      invariants(s, w)

      if (s.activeEvent) {
        s = resolveEvent(s, s.activeEvent, s.activeEvent.choices[0].id)
      }

      if (s.activeGodfatherMessage) {
        s = resolveGodfather(s, s.activeGodfatherMessage, false)
      }

      invariants(s, w)
    }

    // At least one godfather should have been refused
    expect(s.godfatherRefusalCount).toBeGreaterThan(0)
    expect(s.isGameOver).toBe(false)
  })

  it('timeline entries grow as events are resolved', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    let s = JSON.parse(JSON.stringify(STARTING_STATE)) as GameState
    const initialLen = s.timeline.length

    for (let w = 0; w < 10; w++) {
      s = tick(s)

      if (s.activeEvent) {
        s = resolveEvent(s, s.activeEvent, s.activeEvent.choices[0].id)
      }
    }

    // Timeline should have grown
    expect(s.timeline.length).toBeGreaterThan(initialLen)
  })
})
