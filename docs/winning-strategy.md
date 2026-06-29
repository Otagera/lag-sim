# Winning Strategy: Simulation AI Tuning

The `'winning'` simulation strategy (`src/engine/simulateEngine.ts`) uses `WINNING_STRATEGY` — a single config object at the top of the file with all thresholds and weights. This strategy wins ≥ 60% of runs across 15 seeds (3 archetypes × 5 seeds; current best: 10/15 = 67%). Baseline with new events gated off: 12/15 = 80%.

## Scope (post Phases A–D)

The simulation covers:
- Event card choices (scored by `scoreWinningChoice`)
- Godfather accept/refuse decisions (`shouldAcceptGodfather`)

The simulation does **not** cover:
- **Phase C proactive economy actions** (cut subventions, reduce overheads, raise LUC, take loans, launch initiatives). These are player-initiated only. The simulation cannot call them because they require game-loop cooldown state and are designed for human-paced play. If the player never uses Phase C levers, the simulation is a faithful model of that play style.
- **Phase A goal selection**. The simulation runs without a selected goal — `selectedGoalId` stays null. Goal progress does not affect simulation scoring.
- **Phase D inbox management**. Inbox messages accumulate during simulation but are never marked read. Godfather ask messages are correctly actioned via the fallback path in `resolveGodfather` (marks `isGodfatherAsk && !actioned` messages as actioned), so `shouldDrawGodfather` is not blocked.

To test the winning strategy impact of Phase C levers, benchmark scripts would need to call economy actions at optimal cooldown points — a separate tuning effort if needed.

## When to Re-Tune

- Revenue/expenditure formula changes (game balance)
- New event categories that alter the option pool
- Stat bound changes (BOUNDS table in statEngine.ts)
- Post-debugging the game economy

## How to Tune

```bash
# 1. Run the benchmark to measure current win rate
npx tsx scripts/benchmark.ts

# 2. Edit WINNING_STRATEGY thresholds in src/engine/simulateEngine.ts
```

## WINNING_STRATEGY Config

```typescript
export const WINNING_STRATEGY = {
  overrideMinScore: 5,     // Minimum score above baseline to override choice[0]
  baselineScore: 0.1,      // Default score baseline for every choice

  // Always-active preferences (weights on immediate stat deltas)
  continuous: {
    cashReserve: 1,            // Keep cash high
    igr: 2,                    // IGR compounds (but above 2 overrides choice[0] too often)
    corruptionPressure: -1,    // Penalise corruption increases
    politicalCapital: 0.3,     // Mild preference for PC preservation
  },

  // Emergency thresholds — only activate when stat crosses boundary
  emergency: {
    fedRel:           { threshold: -10, statWeight: 20, factionWeight: 10 },
    cashReserve:      { threshold: 60,  weight: 25 },   // Active through most of term1
    corruption:       { threshold: 50,  weight: 18 },
    godfathers:       { threshold: 15,  weekGate: 40,  weight: 12 },
    youthTension:     { threshold: 55,  weight: 12 },
    publicTrust:      { threshold: 35,  weight: 12 },
    expenditure:      { cashThreshold: 50, normalWeight: 2, crisisWeight: 8 },
    politicalCapital: { threshold: 25,  weekGate: 209, weight: 15 },  // Term2-only
    igrLoss:          { weekGate: 209,  weight: 8 },  // Term2-only
  },

  // Election-relevant faction floors — only activates when faction is within 10pts of endorsement penalty threshold.
  // Weights (3-4×) are high enough to override when triggered; the threshold ensures existing events
  // (where factions are healthy) are unaffected.
  factionFloors: {
    civilSocietyMedia: { threshold: 45, weight: 4 },  // endorsement penalty at ≤35
    businessCommunity: { threshold: 45, weight: 3 },  // endorsement penalty at ≤35
    lgChairmen:        { threshold: 45, weight: 3 },  // endorsement penalty at ≤35
    informalEconomy:   { threshold: 40, weight: 3 },  // endorsement penalty at ≤30
  },

  // Godfather acceptance logic
  godfather: {
    corruptionRefuseThreshold: 50,  // Refuse if corruption > 50
    emergencyGodfathers: 8,          // Always accept if below 8 (post-week-40)
    safetyGodfathers: 15,            // Accept if below 15
    comfortableGodfathers: 30,       // Refuse if above 30
    middleRefusalCount: 3,           // Accept if we've refused 3+ times
  },
}
```

## Key Levers

### `emergency.cashReserve`
- Threshold: 60, weight: 25
- Raise both to trigger earlier/stronger cash-preserving choices

### `continuous.igr`
- Default: 2
- Raising above 2 overrides choice[0] too often (regression at ≥ 3)

### `godfather.corruptionRefuseThreshold`
- Default: 50
- Lower = refuse earlier to protect grants (corruption > 75 = -0.8bn/wk)
- Raising to 55+ caused corruption death spirals

### `godfather.comfortableGodfathers`
- Default: 30
- When to stop accepting godfather asks
- Raising to 40 caused more risk than benefit

### `overrideMinScore`
- Default: 5
- Minimum score above baseline to override choice[0]
- Lower = more deviation from safe default; 3 caused regressions

### `factionFloors`
- Threshold defaults: 45/45/45/40 (10pts above endorsement penalty cutoffs)
- When a faction is below its threshold, choices that protect it score with weight 3-4×
- Safe to tune aggressively: the threshold prevents it from firing on existing events where factions are healthy
- Calibrated so that a +12 civil society swing clears `overrideMinScore` (5) while a +5 swing doesn't
- **Why conditional, not always-on:** always-on faction weights shift behavior for all events including well-tuned existing ones, causing regressions. The threshold means the formula only acts when factions are already in danger.

## Design Principles

1. **Default to choice[0]** — game designers put the safe/effective option first. Only override when a stat crosses an emergency threshold.
2. **Godfather corruption ceiling** — the funding freeze (corruption > 75) costs 0.8bn/wk in lost grants. Keeping corruption below 60 is worth more than keeping godfathers above 25.
3. **Cash is king in the late game** — the structural deficit (expenditure > revenue) from week 150+ burns cash at 5-8bn/week. The strategy must build a large mid-game buffer and minimize late-game spending.
4. **Loyalist always wins** — high starting godfathers (90) + political capital (180) is dominant. Technocrat and outsider start with weak cash/godfathers and lose whenever events deal an unlucky hand.
5. **Deterministic state seeding** — `makeSeededArchetypeState` ensures NPC/deputy assignment is reproducible, making the benchmark fully deterministic.

## Score Function (`scoreWinningChoice`)

Each choice is scored by:
- Baseline at 0.1
- Continuous weights on `cashReserve`, `igr`, `corruptionPressure`, `politicalCapital`
- Emergency weights activate only when corresponding stat crosses threshold
- Expenditure penalty scales by crisisWeight when cash < 50
- Term 2: PC floor at 25, IGR loss penalty active
- Faction floor weights activate when election-relevant factions fall near endorsement penalty threshold
- If no emergency kicks in, choice[0] wins by default

**Adding new events:** new events don't need to conform to this scoring. The formula is designed to handle a diverse pool — faction scoring was added specifically because the expanded event deck (social/transport/crisis/economy expansion) included events with strong faction tradeoffs the strategy had no opinion on. When tuning is needed, run the benchmark and adjust `factionFloors` thresholds before touching `emergency` weights.

## Godfather Acceptance Logic (`shouldAcceptGodfather`)

1. Refuse if corruption > `corruptionRefuseThreshold` (50)
2. Accept if godfathers < `emergencyGodfathers` (8) and week > `emergencyWeekGate` (40)
3. Accept if godfathers < `safetyGodfathers` (15)
4. Refuse if godfathers > `comfortableGodfathers` (30)
5. Accept if we've refused `middleRefusalCount` (3) times already
