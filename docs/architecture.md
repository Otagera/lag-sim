# Architecture — Engine Core

## The Pure Function Pattern

Every engine function is `(state: GameState, ...) => GameState`. No mutation, no side effects.

All stat changes go through:
```typescript
applyDelta(state, delta): GameState         // statEngine.ts
applyFactionDelta(factions, delta)          // factionEngine.ts
```

Never write `state.stats.publicTrust += X`. Always go through `applyDelta`.

## Stat Bounds (enforced in statEngine.ts BOUNDS table)

| Stat | Min | Max |
|---|---|---|
| publicTrust | 0 | 100 |
| infrastructureScore | 0 | 100 |
| securityIndex | 0 | 100 |
| politicalCapital | 0 | 200 |
| corruptionPressure | 15 | 80 |
| federalRelationship | -50 | 50 |
| cashReserve | −∞ | ∞ |

## Weekly Tick Order (gameLoop.ts)

1. Increment week
2. `revenueEngine` + `expenditureEngine` → cashReserve
3. `dragEngine` → FAAC variance, ghost regen, overhead creep, procurement leakage
4. Loan repayments + debt stock reduction
5. `projectEngine.processProjects`
6. `firePendingDelayed` from pendingDelayed queue
7. `factionEngine.drift`
8. publicTrust drift toward constituency-weighted average (10% pull/wk)
9. `tickDeputyResentment`
10. `activateNPCs`
11. `tickNPCPressure`
12. `applyNPCGoalEffects`
13. `checkNPCEscalation`
14. `tickInitiative`
15. `applyFashemuPhaseTransition`
16. `tickSuspension` — passive drain + administrator act progression if `emergencySuspensionWeeks > 0`
17. `tickLitigation` — timer countdown; enqueues `supreme-court-ruling` at 0
18. LGA election at week 86 (mandatory)
19. Campaign mode flag at week 195
20. `checkGameOver`
21. Draw next event / godfather ask
22. Infrastructure passive decay: `infrastructureScore -= (0.5 + max(0, score - 70) * 0.005)` + youth tension passive rise `youthTension += 0.4`

## Key Types (types.ts is the source of truth)

### Choice

```typescript
type Choice = {
  id: string
  label: string
  description: string
  immediate: StatDelta            // NOT "statDelta" — field is "immediate"
  factionImpact?: FactionDelta
  delayed?: DelayedConsequence
  followUpEventId?: string
  politicalCapitalCost?: number
  corruptionTrigger?: boolean
  setFlags?: Record<string, boolean>
  launchInitiative?: InitiativeState
  launchProject?: { name, location, totalCost, weeklyDraw, weeksRemaining, contractorId }
  resentmentDelta?: number        // applied to deputy.resentment
  npcImpact?: Record<string, number>
  setSuspensionWeeks?: number     // sets emergencySuspensionWeeks; > 0 starts, = 0 clears
  setLitigationTimer?: number     // sets litigationTimer; also sets litigationActive: timer > 0
  diminishingReturns?: boolean    // yield scales down on repeat selection; corruption spikes after 2nd use
}
```

### DelayedConsequence

```typescript
type DelayedConsequence = {
  weekOffset: number
  delta: StatDelta                // NOT "statDelta"
  factionImpact?: FactionDelta
  eventText: string               // single string, NOT title/description
  followUpEventId?: string
  constituencyImpact?: Partial<ConstituencyApproval>
}
```

### EventCard — Common Pitfalls

- No `oneTime` field. Recurring = `isRecurring: true`. One-shot = omit.
- `eventQueue: EventCard[]` — push the **card object**, not an id string.
- `maxTotalFirings?: number` — recurring event retires after N total firings (counted via `resolvedEvents.filter(...)`).
- Queue-only events (completion events, stall events, arc outcomes): `triggerCondition: () => false`. They won't appear in the random pool but still fire when enqueued.

### ALL_EVENTS Ordering Matters

`phase4Events` is **first** in `ALL_EVENTS` (eventEngine.ts). When multiple events have matching `triggerCondition` simultaneously, the first one wins (`Array.find`). This gives `populist-shield-success`/`populist-shield-fail` priority over other triggered events.

## Project Structure

```
/src
  /engine                — Pure-function stateless engine
    gameLoop.ts          — Weekly tick orchestrator
    statEngine.ts        — applyDelta, BOUNDS enforcement
    revenueEngine.ts     — calculateWeeklyRevenue()
    expenditureEngine.ts — calculateWeeklyExpenditure()
    debtEngine.ts        — takeLoan, emergencyBridgeLoan
    dragEngine.ts        — ghost regen, overhead creep, procurement leakage, FAAC variance
    projectEngine.ts     — Capital project pipeline
    factionEngine.ts     — Faction drift
    eventEngine.ts       — drawNextEvent, resolveEvent, firePendingDelayed
    godfatherEngine.ts   — Fashemu arc, ask draw logic
    electionEngine.ts    — Vote share calculation
    seasonEngine.ts      — Season modifier (wet/dry, election year, budget crunch)
    constituencyEngine.ts — applyConstituencyImpact()
    legacyRanker.ts      — Builds valedictory address LLM prompt
    evaluateNews.ts      — Generates newspaper articles from stat changes
    llmNews.ts           — Optional LLM-powered news text (currently disabled)
    budgetEngine.ts      — Deprecated simple budget (not used in tick)
    corruptionEngine.ts  — Stub (returns 0)
    simulateEngine.ts    — simulateWeeks() for fast-forward / dev mode
  /data                  — Static data (no logic)
    startingState.ts     — Initial GameState (source of truth for field defaults)
    deputies.ts          — 7 deputy profiles
    commissionerCandidates.ts — 3 candidates per commissioner role
    npcs.ts              — NPC archetype definitions
    godfatherAsks.ts     — Fashemu asks + general pool
    initiatives.ts       — Initiative definitions
    legacy.ts            — buildLegacy()
    archetypes.ts        — 3 starting archetypes
    /events              — ~18 files (~160 event cards total)
  /state                 — State management
    types.ts             — ALL TypeScript types (source of truth)
    gameStore.ts         — Zustand store + actions
    persistence.ts       — Serialize/deserialize + migration chain (SAVE_VERSION = 4)
  /engine/__tests__      — Unit tests (~475 total)
  /workers
    llmWorker.ts         — Web worker for optional LLM news generation
/scripts
  benchmark.ts           — Win-rate benchmark for simulation strategies
/docs                    — Documentation
```
