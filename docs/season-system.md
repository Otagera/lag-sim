# Season System

## Overview

The season engine (`src/engine/seasonEngine.ts`) computes a `SeasonModifier` struct once per tick. It affects FAAC variance, event weights, and political capital costs.

## Season Modifier Shape

```typescript
type SeasonModifier = {
  label: string                // Display string: "Rainy Season · Federal Election Year"
  season: 'wet' | 'dry'
  isWetSeason: boolean
  isFederalElectionYear: boolean
  isBudgetCrunch: boolean
  faacVarianceScale: number          // wet season: 1.5 (wider FAAC swings)
  faacBasePenalty: number            // 0–1 fraction of FAAC lost (budget crunch / election noise)
  politicalCapitalCostScale: number  // federal election year: 1.2 (everything costs more)
  federalRelationshipWeeklyDrift: number  // negative = downward drift per week
  floodEventWeightMultiplier: number // wet-season events: 3.0 in wet season
}
```

## Seasonal Calendar

Engine truth is `state.week` (1–208 for term 1). Dates are display-only.

```
START_DATE = 2027-05-29
Week 1   = May 29, 2027
Week 52  = May 27, 2028 (leap year)
Week 208 = May 28, 2031
```

| Season | Weeks in year | Modifier |
|---|---|---|
| Wet season | ~5–18 | Flood events 3× weight; FAAC variance 1.5× |
| Federal election year | Year 1 + Year 4 (weeks 1–52, 157–208) | PC costs ×1.2; FAAC drift -0.3/wk |
| Budget crunch | December–January (~28–35) | FAAC base penalty +0.2 |

## Federal Election Year

- Weeks 1–52 (year 1) and 157–208 (year 4)
- Nigerian presidential cycle: 2023 → 2027 → 2031
- Both the start and end of the governor's term coincide with national campaigns
- Effects: `politicalCapitalCostScale = 1.2`, `federalRelationshipWeeklyDrift = -0.3`, `faacBasePenalty = 0.1`

## Budget Crunch

- December–January: Lagos appropriations bill not yet signed
- FAAC transfers often withheld pending new-year confirmation from Abuja
- `getSeasonModifier` uses `weekToDate(week).getMonth()` which maps week → calendar month
- Effect: `faacBasePenalty = 0.2`

## Wet Season

- Derived from `seasonOf(week)` utility in `src/utils/calendar`
- Effects: `faacVarianceScale = 1.5`, `floodEventWeightMultiplier = 3.0`
- Flood events tagged `season: 'wet'` get 3× weight in the event draw pool

## Gameplay Impact

- **Planning**: The player should expect wider FAAC swings during wet season, more expensive political capital in election years, and dry FAAC in budget crunch months
- **Event probability**: Flood/infrastructure events are 3× more likely to appear during wet season
- **Information commissioner**: High-loyalty information commissioner reduces hostile media event probability by up to 25%
