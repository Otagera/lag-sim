# Game Over and Term Transitions

## Game Over Conditions

| Condition | Trigger | Notes |
|---|---|---|
| Bankruptcy | `cashReserve < 0` for 3 consecutive weeks | Counter resets if cash goes positive |
| Federal Takeover | `federalRelationship < -40` AND `infrastructureScore < 25` AND `emergencySuspensionWeeks === 0` | Suppressed during suspension — the suspension IS the federal intervention |
| Mass Uprising | `publicTrust < 15` AND `youthTension > 85` | Both must be met simultaneously |
| Party Removal | `partyGodfathers < 10` AND week > 52 | 3-stage removal arc must complete (resolution → committee → floor vote) |
| Primary Defeat | Scenario B primary lost (requirements not met by week 176) | `primary-contest-loss` event → game over |
| Term End (loss) | week > 208 AND vote share ≤ 50% | → LegacyScreen |
| Term End (win) | week > 208 AND vote share > 50% | → `termEndWin` **pause** on LegacyScreen; "Begin Second Term" resumes into weeks 209–416 |
| Second Term End | week > 416 AND `currentTerm === 2` | → final LegacyScreen |

## Recovery Paths

### Removal Arc Recovery
`partyGodfathers` recovering to ≥ 20 cancels the arc and clears the queue. Stage stays at 1 until recovery or game over.

### Federal Takeover Suppression
While `emergencySuspensionWeeks > 0`, federal takeover is disabled — the suspension is the intervention. After suspension ends (either naturally or via legal challenge), `stateFlags['emergency-ever-suspended']` prevents future federal game over.

### Bankruptcy Escape
Emergency bridge loans auto-disburse when `cashReserve < 0`. First loan: 35% APR; each subsequent loan escalates APR. Capped at 3 emergency loans (`emergencyLoansTaken`).

## Ending Narrator (`src/engine/endingNarrator.ts`)

Every game-over state now produces a state-derived narrative ending (not grey text). The `endGame()` helper in `gameLoop.ts` pre-computes `endingNarrative` and sets `gameOverType` at the moment of game over.

### Eight Exit Types

| Type | Game State Trigger | Narrative Register |
|---|---|---|
| `bankruptcy` | 3 consecutive weeks cash < 0 | Tragic — diagnoses the financial cause (overheads, debt service), names achievements, goal progress, retry closing |
| `federalTakeover` | fedRel < -40 AND infra < 25 | Bitter — the constitutional mechanism explained, what you built before it |
| `massUprising` | trust < 15 AND youthTension > 85 | Tragic — the withdrawal of consent, what you built before the streets turned |
| `impeachment` | Assembly removal vote triggers | Tense — defiance vs concession path detected from timeline, the godfather machine |
| `primaryLoss` | scenario B primary lost | Wistful — why (grassroots or civil society failure), what you built |
| `termEndLoss` | week > 208 AND vote ≤ 50% | Wistful — why you lost diagnosed from worst faction + worst constituency swing |
| `termEndWin` | week > 208 AND vote > 50% (re-elected) | Hopeful — mandate confirmed, second term ahead |
| `secondTermEnd` | week > 416 | Hopeful/mixed — full 8-year arc |

### Narrative Assembly

1. **Fragment families**: Each exit type has 3+ variant slots (diagnosis, achievements, closing) selected deterministically via `hashInt(exit + state.snapshot)` — replay produces variety
2. **State-aware specifics**: Reads `lastWeekExpenditure` for overheads % diagnosis, real stat values (trust, infra, security), worst/best LGA, faction standings
3. **Goal integration**: Reads `selectedGoalId`, computes `getGoalProgress`/`getGoalIsMet`, weaves result into narrative
4. **Key moments from timeline**: Scores timeline entries by type weight (godfather=10, milestone=6, crisis bonus=8), delta magnitude, recency. Picks top 2-4.
5. **Verdict headline**: A short epitaph per exit type (e.g., "The Governor Who Ran Out of Road", "A Single-Term Record")

### UI Display

All exit types render the enhanced `LegacyScreen`, which shows:

1. **Masthead** — exit type label, date, weeks served
2. **Narrative passage** — italic blockquote in tone-colored left border (red for tragic, yellow for tense, green for hopeful)
3. **Verdict headline** — centered epitaph
4. **Key moments** — top timeline moments with week and type
5. **Legacy scorecard** — stat grades, factions, constituencies, goal outcome (always shown)
6. **Term-end-only** — legacy headlines, governor's final address, election journey (hidden for mid-game failures)

### Game Over Type on State

```typescript
type GameOverType = 'bankruptcy' | 'federalTakeover' | 'massUprising' | 'impeachment'
  | 'primaryLoss' | 'termEndLoss' | 'termEndWin' | 'secondTermEnd'
```

Set on `state.gameOverType` at game-over time. `state.endingNarrative` is pre-computed string.

## Term Transition

### Term 1 → Term 2 (week 208)
- `checkGameOver` in gameLoop checks `week > 208`
- If `currentTerm === 1` and election won: `currentTerm` is set to 2 **but the game is flagged over** with `gameOverType: 'termEndWin'` (see below) — play then continues to week 416
- If `currentTerm === 1` and election lost: game over → LegacyScreen (`termEndLoss`)
- If `currentTerm === 2`: game over → final LegacyScreen (`secondTermEnd`)

### `termEndWin` is a deliberate pause, not a terminal game over
A re-election win is modelled as a game over (`isGameOver: true`, `gameOverType: 'termEndWin'`, `currentTerm: 2`) **on purpose** — it forces the UI to stop so the player sees the LegacyScreen celebration, the re-election share moment, and an explicit **"Begin Second Term"** button. Only clicking that button (store action `beginSecondTerm`) clears the game-over flags and resumes play in term 2.

- The pure state transition lives in `beginSecondTermState(state)` in `gameLoop.ts` (clears `isGameOver`/`gameOverType`/`gameOverReason`/`endingNarrative`, resets `electionResult`/`reElected`; `currentTerm` is already 2). Both `beginSecondTerm` (which additionally offers the share moment) and the simulation reuse this helper — do not duplicate the field resets.
- Because `reElected` is reset to `false` when the second term begins, **`currentTerm === 2` is the durable "won re-election" signal** for any code inspecting a final/late state (the benchmark and its tests rely on this, not on `reElected`).

### Simulation crossing the term boundary
`simulateWeeks` stops on `isGameOver` like the real game, so by default it halts on the `termEndWin` pause at week 208 — this is what keeps `fastForward` (DevPanel skip) landing on the celebration instead of silently skipping it. To simulate a full two terms, pass `{ continueAcrossTerms: true }`: the sim then auto-applies `beginSecondTermState` on `termEndWin` (standing in for the player clicking "Begin Second Term") and runs on to the week-416 `secondTermEnd`. The two-term benchmark (`scripts/benchmark.ts`) opts in; interactive `fastForward` does not.

### Election Formula Triggers
- Term 1: week 208
- Term 2: week 416
- Vote share calculated by `calculateVoteShare()` in `electionEngine.ts`

### Campaign Mode
- Activated at week 195 (13 weeks before election)
- `inCampaignMode: true` unlocks campaign election events
- `routine` events with `maxWeek: 150` have already expired by this point
