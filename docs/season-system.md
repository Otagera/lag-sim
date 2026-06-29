# Season System

## Overview

The season engine (`src/engine/seasonEngine.ts`) computes a `SeasonModifier` struct once per tick. It affects FAAC variance, event weights, and political capital costs. Five cyclical seasonal events in `src/data/events/seasonal.ts` bring themed content tied to the calendar.

## Season Modifier Shape

```typescript
type SeasonModifier = {
  label: string                // Display string: "Rainy Season · Harmattan · Detty December"
  season: 'wet' | 'dry'
  isWetSeason: boolean
  isFederalElectionYear: boolean
  isBudgetCrunch: boolean
  isHarmattan: boolean         // Dec–Feb: dry Saharan winds
  isDettyDecember: boolean     // December: diaspora tourism boom
  isSallahPeriod: boolean      // June: Eid-el-Kabir livestock market
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
| Harmattan | December–February (~28–41) | Label only; triggers Harmattan Fire event (40%) |
| Detty December | December (~28–31) | Label only; triggers Detty December tourism event |
| Sallah | June (~3–7) | Label only; triggers Sallah Ram Market event |

## Cyclical Seasonal Events (`src/data/events/seasonal.ts`)

Five events fire via `triggerCondition` + `cooldownWeeks: 48–52`, appearing once per year in their calendar window. All are `isRecurring: true`.

| Event | Window | Key Trade-off |
|---|---|---|
| **Sallah Ram Market** | June (week 3+) | Deploy LASTMA to border (−₦0.5bn, trust +3) vs. blockade livestock (−₦0.3bn, informal −8) vs. do nothing (trust −6, delayed youth tension) |
| **Detty December** | December (week 27+) | Night Gang Shift + drones (−₦0.5bn, trust +4, igr +0.5, delayed cash back) vs. event fines (trust −3) vs. tolerate chaos (igr +0.8, trust −6) |
| **Eyo Festival** | Late May (week 2+) | State sponsorship (−₦0.3bn, trust +3, delayed cash back) vs. restrict to arena (trust −5) vs. leave to council (neutral) |
| **Harmattan Fire** | Dec–Feb (week 27+), 40% chance | Fire hydrants (−₦1.0bn, trust +4, infra +3, delayed cash back) vs. campaign (−₦0.3bn, weaker) vs. do nothing (trust −8 when fire hits) |
| **Seasonal Flooding** | June+ (week 4+, wet season) | Demolish illegal structures (PC −15, trust +6, delayed) vs. desilt (−₦1.0bn, trust +2, infra +3) vs. blame federal (trust −4) |

## Calendar Utility Functions (`src/utils/calendar.ts`)

```typescript
isSallahPeriod(week: number): boolean    // month === 6
isDettyDecember(week: number): boolean   // month === 12
isEyoFestival(week: number): boolean     // month === 5, day >= 20
isHarmattan(week: number): boolean       // month >= 12 || month <= 2
```

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

## Revenue: Tourism Component

The `RevenueBreakdown` (computed each tick) includes a `tourism` field:
- **Base**: 0 outside Detty December, +0.4/wk during December
- **Surge**: +1.2/wk extra when the Detty December event choice sets `stateFlags.dettyDecemberSurge`
- Displayed in the IGR breakdown row in StateOfTheState

## Gameplay Impact

- **Planning**: The player should expect wider FAAC swings during wet season, more expensive political capital in election years, and dry FAAC in budget crunch months
- **Event probability**: Flood/infrastructure events are 3× more likely to appear during wet season. Harmattan fire event has a 40% chance per trigger attempt
- **Information commissioner**: High-loyalty information commissioner reduces hostile media event probability by up to 25%
- **Season label**: Displayed in the Status Bar as an accent-coloured string: "Rainy Season · Harmattan · Detty December"
