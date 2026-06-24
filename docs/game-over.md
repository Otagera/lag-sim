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
| Term End (win) | week > 208 AND vote share > 50% | → second term begins (week 209–416) |
| Second Term End | week > 416 AND `currentTerm === 2` | → final LegacyScreen |

## Recovery Paths

### Removal Arc Recovery
`partyGodfathers` recovering to ≥ 20 cancels the arc and clears the queue. Stage stays at 1 until recovery or game over.

### Federal Takeover Suppression
While `emergencySuspensionWeeks > 0`, federal takeover is disabled — the suspension is the intervention. After suspension ends (either naturally or via legal challenge), `stateFlags['emergency-ever-suspended']` prevents future federal game over.

### Bankruptcy Escape
Emergency bridge loans auto-disburse when `cashReserve < 0`. First loan: 35% APR; each subsequent loan escalates APR. Capped at 3 emergency loans (`emergencyLoansTaken`).

## Term Transition

### Term 1 → Term 2 (week 208)
- `checkGameOver` in gameLoop checks `week > 208`
- If `currentTerm === 1` and election won: `currentTerm = 2`, week resets continue to 416
- If `currentTerm === 1` and election lost: game over → LegacyScreen
- If `currentTerm === 2`: game over → final LegacyScreen

### Election Formula Triggers
- Term 1: week 208
- Term 2: week 416
- Vote share calculated by `calculateVoteShare()` in `electionEngine.ts`

### Campaign Mode
- Activated at week 195 (13 weeks before election)
- `inCampaignMode: true` unlocks campaign election events
- `routine` events with `maxWeek: 150` have already expired by this point
