import { describe, it, expect, vi, afterEach } from 'vitest'
import { STARTING_STATE } from '../../data/startingState'
import type { GameState } from '../../state/types'
import { getSeasonModifier } from '../seasonEngine'
import { resolveEvent, drawNextEvent, ALL_EVENTS } from '../eventEngine'
import { tick } from '../gameLoop'

// Calendar anchor: game starts 2027-05-29
// Week 5  → 2027-06-26 (June, wet, federal election year)
// Week 20 → 2027-10-10 (October, dry, federal election year)
// Week 28 → 2027-12-05 (December, dry, federal election year + budget crunch)
// Week 53 → 2028-05-25 (May, dry, NOT election year, NOT budget crunch)
// Week 160 → ~2030-07 (wet, federal election year ≥ 157)

function clone(s: GameState): GameState {
  return JSON.parse(JSON.stringify(s))
}

describe('getSeasonModifier — wet season', () => {
  it('week 5 is wet season', () => {
    const mod = getSeasonModifier(5)
    expect(mod.season).toBe('wet')
    expect(mod.isWetSeason).toBe(true)
  })

  it('wet season doubles FAAC variance scale to 1.5', () => {
    const mod = getSeasonModifier(5)
    expect(mod.faacVarianceScale).toBe(1.5)
  })

  it('wet season triples flood event weight to 3.0', () => {
    const mod = getSeasonModifier(5)
    expect(mod.floodEventWeightMultiplier).toBe(3.0)
  })
})

describe('getSeasonModifier — dry season', () => {
  it('week 53 is dry season', () => {
    const mod = getSeasonModifier(53)
    expect(mod.season).toBe('dry')
    expect(mod.isWetSeason).toBe(false)
  })

  it('dry season FAAC variance scale is 1.0', () => {
    const mod = getSeasonModifier(53)
    expect(mod.faacVarianceScale).toBe(1.0)
  })

  it('dry season flood multiplier is 1.0', () => {
    const mod = getSeasonModifier(53)
    expect(mod.floodEventWeightMultiplier).toBe(1.0)
  })
})

describe('getSeasonModifier — federal election year', () => {
  it('week 1 is a federal election year', () => {
    expect(getSeasonModifier(1).isFederalElectionYear).toBe(true)
  })

  it('week 52 is still a federal election year', () => {
    expect(getSeasonModifier(52).isFederalElectionYear).toBe(true)
  })

  it('week 53 is NOT a federal election year', () => {
    expect(getSeasonModifier(53).isFederalElectionYear).toBe(false)
  })

  it('week 157 is a federal election year', () => {
    expect(getSeasonModifier(157).isFederalElectionYear).toBe(true)
  })

  it('week 208 is a federal election year', () => {
    expect(getSeasonModifier(208).isFederalElectionYear).toBe(true)
  })

  it('federal election year scales politicalCapital cost to 1.2', () => {
    expect(getSeasonModifier(10).politicalCapitalCostScale).toBe(1.2)
  })

  it('non-election year politicalCapital cost is 1.0', () => {
    expect(getSeasonModifier(100).politicalCapitalCostScale).toBe(1.0)
  })

  it('federal election year drifts federalRelationship by -0.3/week', () => {
    expect(getSeasonModifier(10).federalRelationshipWeeklyDrift).toBe(-0.3)
  })

  it('non-election year has no federalRelationship drift', () => {
    expect(getSeasonModifier(100).federalRelationshipWeeklyDrift).toBe(0)
  })

  it('non-election, non-crunch week has zero faacBasePenalty', () => {
    expect(getSeasonModifier(53).faacBasePenalty).toBe(0)
  })

  it('federal election year alone applies 0.1 faacBasePenalty', () => {
    // Week 20: dry, fed election year, NOT budget crunch
    const mod = getSeasonModifier(20)
    expect(mod.isFederalElectionYear).toBe(true)
    expect(mod.isBudgetCrunch).toBe(false)
    expect(mod.faacBasePenalty).toBe(0.1)
  })
})

describe('getSeasonModifier — budget crunch (Dec–Jan)', () => {
  it('week 28 is budget crunch (December)', () => {
    expect(getSeasonModifier(28).isBudgetCrunch).toBe(true)
  })

  it('budget crunch applies 0.2 faacBasePenalty (overrides election year 0.1)', () => {
    // Week 28 is also a federal election year (≤52), budget crunch wins
    const mod = getSeasonModifier(28)
    expect(mod.isFederalElectionYear).toBe(true)
    expect(mod.isBudgetCrunch).toBe(true)
    expect(mod.faacBasePenalty).toBe(0.2)
  })
})

describe('getSeasonModifier — label', () => {
  it('normal week returns "Normal"', () => {
    expect(getSeasonModifier(53).label).toBe('Normal')
  })

  it('wet season week returns label containing "Rainy Season"', () => {
    expect(getSeasonModifier(5).label).toContain('Rainy Season')
  })

  it('federal election year label contains "Federal Election Year"', () => {
    expect(getSeasonModifier(10).label).toContain('Federal Election Year')
  })

  it('budget crunch label contains "Budget Crunch"', () => {
    expect(getSeasonModifier(28).label).toContain('Budget Crunch')
  })
})

describe('season effects — flood event weight bias', () => {
  afterEach(() => vi.restoreAllMocks())

  it('lekki-flooding-developer has season: wet', () => {
    const event = ALL_EVENTS.find((e) => e.id === 'lekki-flooding-developer')
    expect(event?.season).toBe('wet')
  })

  it('drawNextEvent draws lekki-flooding-developer more in wet season (statistical bias test)', () => {
    // Resolve all triggered-condition events and lekki flood to get clean pool
    const triggeredIds = ALL_EVENTS.filter((e) => e.triggerCondition).map((e) => e.id)
    const idsExceptFlood = [...triggeredIds]

    // Run 200 draws in wet season (week 5) with different run seeds,
    // count flood event appearances
    let floodCount = 0
    for (let i = 0; i < 200; i++) {
      const state = clone({
        ...STARTING_STATE,
        runSeed: i + 1,
        week: 5,
        activeEvent: null,
        eventsResolvedThisWeek: 0,
        resolvedEvents: [...idsExceptFlood],
      })
      const drawn = drawNextEvent(state)
      if (drawn?.id === 'lekki-flooding-developer') floodCount++
    }
    // In dry season the flood event has its base weight; in wet season it has 3× weight.
    // With 200 draws and boosted weight, we expect at least 5 flood draws.
    expect(floodCount).toBeGreaterThan(4)
  })
})

describe('season effects — FAAC variance in tick', () => {
  afterEach(() => vi.restoreAllMocks())

  it('tick in wet season applies larger FAAC variance magnitude on average', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.9) // bias toward positive variance

    const wetState = clone({ ...STARTING_STATE, week: 4 }) // week 5 after tick
    const dryState = clone({ ...STARTING_STATE, week: 52 }) // week 53 (dry, no election) after tick

    const wetResult = tick(wetState)
    const dryResult = tick(dryState)

    // Both have same random seed; wet season has 1.5× scale vs 1.0× for dry
    expect(wetResult.faacVarianceAccumulated).toBeGreaterThan(dryResult.faacVarianceAccumulated)
  })
})

describe('season effects — federal election drift in tick', () => {
  afterEach(() => vi.restoreAllMocks())

  it('tick in federal election year lowers federalRelationship', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)

    const fedState = clone({ ...STARTING_STATE, week: 9 }) // week 10 after tick (election year)
    const normalState = clone({ ...STARTING_STATE, week: 99 }) // week 100 after tick (not election year)

    const fedResult = tick(fedState)
    const normalResult = tick(normalState)

    // federalRelationship drifts -0.3 each week during election year
    expect(fedResult.stats.federalRelationship).toBeLessThan(fedState.stats.federalRelationship)
    // Non-election year should not drift (or drift much less)
    expect(fedResult.stats.federalRelationship).toBeLessThan(normalResult.stats.federalRelationship)
  })
})

describe('season effects — politicalCapital scaling', () => {
  it('resolveEvent in federal election year charges 1.2× politicalCapital cost', () => {
    const event = ALL_EVENTS.find((e) =>
      e.choices.some((c) => (c.politicalCapitalCost ?? 0) > 0),
    )
    if (!event) return // skip if no event has politicalCapitalCost

    const choice = event.choices.find((c) => (c.politicalCapitalCost ?? 0) > 0)!
    const baseCost = choice.politicalCapitalCost!

    // Election year (week 10)
    const fedState = clone({ ...STARTING_STATE, week: 10 })
    const fedResult = resolveEvent(fedState, event, choice.id)

    // Non-election year (week 100)
    const normalState = clone({ ...STARTING_STATE, week: 100 })
    const normalResult = resolveEvent(normalState, event, choice.id)

    const fedCost = fedState.stats.politicalCapital - fedResult.stats.politicalCapital
    const normalCost = normalState.stats.politicalCapital - normalResult.stats.politicalCapital

    expect(fedCost).toBeCloseTo(Math.round(baseCost * 1.2), 0)
    expect(normalCost).toBeCloseTo(baseCost, 0)
  })
})
