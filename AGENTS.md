# AGENTS.md — Lagos Governor Sim
> Read this before touching any code. See README.md for gameplay documentation, effect levers, and decision chains.

---

## Project in One Line

Browser-only Lagos governance sim. TypeScript · React · Zustand · Tailwind · Vite. 208-week term. Pure-function engine. No backend.

```bash
npm run dev          # dev server
npx vitest run       # 475 tests (must all pass)
npm run build        # TypeScript + Vite build
```

**Node ≥ 22.12.0 required.** Vite is pinned to v6 (not v8) due to Coolify/nixpacks Node 22.11.0 constraint. To upgrade: change `NIXPACKS_NODE_VERSION` to `24`.

---

## Project Structure

```
/src
  /engine
    gameLoop.ts           — weekly tick orchestrator
    statEngine.ts         — applyDelta(state, delta): GameState  ← all stat mutation goes here
    revenueEngine.ts      — calculateWeeklyRevenue
    expenditureEngine.ts  — calculateWeeklyExpenditure
    debtEngine.ts         — takeLoan, emergencyBridgeLoan
    dragEngine.ts         — ghost regen, overhead creep, procurement leakage, FAAC variance
    projectEngine.ts      — capital project pipeline
    factionEngine.ts      — faction drift
    eventEngine.ts        — drawNextEvent, resolveEvent, firePendingDelayed
    godfatherEngine.ts    — Fashemu arc, ask draw logic
    electionEngine.ts     — vote share calculation
    simulateEngine.ts     — simulateWeeks() for fast-forward / dev mode
  /data
    startingState.ts           — initial GameState (source of truth for field defaults)
    deputies.ts                — 7 deputy profiles
    commissionerCandidates.ts  — 3 candidates per commissioner role
    npcs.ts                    — NPC archetype definitions
    godfatherAsks.ts           — Fashemu asks + general pool
    initiatives.ts             — initiative definitions (id → name, description, totalWeeks)
    legacy.ts                  — buildLegacy()
    archetypes.ts              — 3 starting archetypes (Technocrat / Loyalist / Outsider)
    /events
      transport.ts
      infrastructure.ts
      political.ts        — Fashemu arc events, deputy events, LGA/primary, removal arc
      crisis.ts
      economy.ts
      social.ts
      characters.ts       — NEO, Dayo, SMJ + deputy consequence events
      election.ts         — 3 mandatory campaign cards
      chains.ts           — 4 state-flag-triggered chain events
      riot.ts             — 3 riot-mode events
      phase4.ts           — Phase 4 "Political Realism" (all 4 categories)
      llm_generated.ts    — optional LLM-authored cards
  /state
    types.ts              — ALL TypeScript types. Source of truth. Read this first.
    gameStore.ts          — Zustand store + actions
    persistence.ts        — serialize/deserialize + migration chain
  /engine/__tests__       — unit tests, one file per feature area
```

---

## Core Architecture Rules

### The pure function pattern

Every engine function is `(state: GameState, ...) => GameState`. No mutation, no side effects.

All stat changes go through:
```typescript
applyDelta(state, delta): GameState         // statEngine.ts
applyFactionDelta(factions, delta)          // factionEngine.ts
```

Never write `state.stats.publicTrust += X`. Always go through `applyDelta`.

### Stat bounds (enforced in statEngine.ts BOUNDS table)

| Stat | Min | Max |
|---|---|---|
| publicTrust | 0 | 100 |
| infrastructureScore | 0 | 100 |
| securityIndex | 0 | 100 |
| politicalCapital | 0 | 200 |
| corruptionPressure | 15 | 80 |
| federalRelationship | -50 | 50 |
| cashReserve | −∞ | ∞ |

### Weekly tick order (gameLoop.ts)

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

---

## Key Types (types.ts is the source of truth — read it directly)

### Critical shapes

**Choice:**
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
  resentmentDelta?: number        // applied to deputy.resentment
  npcImpact?: Record<string, number>
  setSuspensionWeeks?: number     // sets emergencySuspensionWeeks; > 0 starts, = 0 clears
  setLitigationTimer?: number     // sets litigationTimer; also sets litigationActive: timer > 0
}
```

**DelayedConsequence:**
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

**EventCard — common pitfalls:**
- No `oneTime` field. Recurring = `isRecurring: true`. One-shot = omit.
- `eventQueue: EventCard[]` — push the **card object**, not an id string.
- `maxTotalFirings?: number` — recurring event retires after N total firings (counted via `resolvedEvents.filter(...)`).
- Queue-only events (completion events, stall events, arc outcomes): `triggerCondition: () => false`. They won't appear in the random pool but still fire when enqueued.

### ALL_EVENTS ordering matters

`phase4Events` is **first** in `ALL_EVENTS` (eventEngine.ts). When multiple events have matching `triggerCondition` simultaneously, the first one wins (`Array.find`). This gives `populist-shield-success`/`populist-shield-fail` priority over other triggered events.

---

## State Fields Reference

### Term tracking field

| Field | Type | Default | Purpose |
|---|---|---|---|
| `currentTerm` | `number` | `1` | 1 = first term, 2 = second term. Set to 2 by `checkGameOver` on re-election instead of ending the game. |
| `choiceUseCounts` | `Record<string, number>` | `{}` | Tracks how many times `${eventId}:${choiceId}` was chosen; powers diminishing returns scaling. |

### Phase 4 fields (added for Political Realism arc)

| Field | Type | Default | Purpose |
|---|---|---|---|
| `emergencySuspensionWeeks` | `number` | `0` | Weeks remaining in emergency suspension |
| `administratorActIndex` | `number` | `0` | Which of 5 act texts to show (incremented each suspended week) |
| `litigationActive` | `boolean` | `false` | Whether election petition arc is active |
| `litigationTimer` | `number` | `0` | Weeks until `supreme-court-ruling` auto-enqueues |
| `offCycleElection` | `boolean` | `false` | Reserved for rerun election path |

### Key Phase 2 fields

| Field | Purpose |
|---|---|
| `deputy` | Chosen deputy governor (`DeputyState \| null`) |
| `fashemuPhase` | dormant → active → warning → break → reconciled → dead |
| `fashemuAskIndex` | Which of 4 ordered Fashemu asks has been reached |
| `activeNPCs` | `Record<NPCKey, NPCState>` — npc1/npc2/npc3 |
| `commissioners` | `Partial<Record<CommissionerRole, CommissionerState>>` |
| `impeachmentStage` | 0=none, 1=first reading queued, 2=removed |
| `emergencyLoansTaken` | Count of emergency bridge loans (escalates APR) |
| `inCampaignMode` | True from week 195 |

All new fields get defaults in `startingState.ts` and are auto-merged by `{ ...STARTING_STATE, ...rest }` in `persistence.ts`.

---

## Game Over Conditions

| Condition | Trigger |
|---|---|
| Bankruptcy | `cashReserve < 0` for 3 consecutive weeks |
| Federal Takeover | `federalRelationship < -40` AND `infrastructureScore < 25` AND `emergencySuspensionWeeks === 0` |
| Mass Uprising | `publicTrust < 15` AND `youthTension > 85` |
| Party Removal | `partyGodfathers < 10` AND week > 52, AND removal arc completes (3-stage: resolution → committee → floor vote) |
| Term End (loss) | week > 208 AND vote ≤ 50% → LegacyScreen |
| Second Term | week > 208 AND vote > 50% → `currentTerm = 2`, continue to week 416 |
| Second Term End | week > 416 AND `currentTerm === 2` → final LegacyScreen |
| Primary Defeat | Scenario B primary requirements not met by week 176 → `primary-contest-loss` event → game over |

**Recovery from removal arc:** `partyGodfathers` recovering to ≥ 20 cancels the arc and clears the queue. Stage stays at 1 until recovery or game over.

---

## Event Card Writing Rules

1. Every card has 2–4 choices
2. At least one choice moves two factions in opposite directions
3. At least one choice has a `delayed` consequence
4. No choice is obviously correct — if it is, redesign it
5. Body text has Lagos texture — real places, real dynamics
6. No moralising in body text
7. Jurisdiction accuracy: state assembly = LAHA (not Federal Senate); federal involvement requires a federal funding hook
8. Severity calibration: `low` < 5pts single stat · `medium` 5–10pts multiple · `high` 10–20pts or 20+ single · `critical` potential game over

---

## Initiatives

New initiatives require an entry in `src/data/initiatives.ts`:
```typescript
'initiative-id': {
  name: 'Display Name',
  description: 'One-sentence description',
  totalWeeks: N,
}
```

`launchInitiative` on a Choice sets `state.activeInitiative`. `tickInitiative` in gameLoop decrements `weeksRemaining` and enqueues `completionEventId` at 0. Completion events must be queue-only (`triggerCondition: () => false`).

---

## Questions Before Major Decisions

- Adding a new major stat → ask first (affects BOUNDS, simulation.test.ts, startingState.ts, revenueEngine, expenditureEngine)
- Changing weekly tick order → ask first (affects game feel and test assumptions)
- Adding real Nigerian political names → confirm approach (sensitivity)
- Adding backend → confirm new phase first

---

## Phase 3 + Phase 4 Backlog

### Phase 3 (shipped)

- [x] Event chains / state flags
- [x] Lagos seasons (global modifier)
- [x] Adjacency-based crisis unlocks (riot mode, grant freeze)
- [x] Governor archetypes (variable starts)
- [x] NPC active AI decks
- [x] Deputy resentment arc
- [x] Deputy resentment UI
- [x] Commissioner mechanical effects
- [x] simulation.test.ts BOUNDS coverage
- [x] Campaign mode UI
- [x] Commissioner appointment screen
- [x] NPC relationship display
- [x] Fast-forward / speed-run mode
- [x] Save versioning migration layer

### Balance + Mid-Game + Second Term (shipped)

- [x] **Infrastructure balance**: decay raised from −0.3 to −0.5/wk + maintenance scaling above 70 (prevents near-100 trivially holding)
- [x] **Youth tension passive drift**: +0.4/wk baseline; 0 tension is no longer achievable permanently
- [x] **Mid-game chapter events** (`src/data/events/midgame.ts`): 4 triggered inflection points at weeks 60/78/104/130 — press verdict, assembly budget revolt, teachers' strike, security audit
- [x] **Primary narrative wired** (`setFlags` → `primaryScenario` derivation): path A/B/C now mechanically determines `primaryBonus()` in election formula
- [x] **Primary loss condition**: Scenario B fails if requirements not met by week 176 → `primary-contest-loss` event → game over
- [x] **Election formula widened**: adds LGA midterm bonus (±3), faction endorsement bonus (±7), recalibrated primary weights
- [x] **Campaign sub-deck** (`src/data/events/campaign.ts`): 4 campaign events + 3 opponent cards that target actual player weaknesses
- [x] **Finale chain** (`src/data/events/finale.ts`): debate → security breakdown → election eve (weeks 205–207)
- [x] **Routine card expiry**: `maxWeek: 150` on all 8 routine events — campaign era fills the vacuum
- [x] **Stomach infrastructure diminishing returns**: repeat use scales yields down; escalating corruption + civil society penalties
- [x] **Second term**: `currentTerm` field; re-election at week 208 continues to week 416 instead of ending game
- [x] **Legacy screen enriched**: primary path narrative, endorsement picture, second-term masthead
- [x] **SAVE_VERSION = 4** with `migrateV3toV4` (adds `currentTerm: 1` to old saves)

### Phase 4 — Political Realism

- [x] **Cat 4: Ghost Worker Purge** — biometric (12 wks) vs committee (8 wks) initiative. Committee path has midpoint stall event (allowance demand). Both set `ghost-purge-resolved`. 59 tests in `phase4CatFourAndThree.test.ts`.
- [x] **Cat 4: Stomach Infrastructure** — `stomach-infrastructure-pressure` (recurring, wk 155+) and `rally-funding-demand` (recurring, campaign mode).
- [x] **Cat 3: Assembly Quorum Maneuver** — `assembly-quorum-maneuver` (recurring, cooldown 18 wks). Populist shield = dual trigger-condition outcome events. Buy-off rebels = delayed warning. Concede = chains to removal arc.
- [x] **Cat 3: Neighboring Sanctuary Offer** — fires during impeachment stage 1 with low godfathers. Accept = PC +80 exiled. Refuse = stand ground.
- [x] **Cat 2: Federal Emergency / Suspension arc** — threat → declared → `tickSuspension` (5-week passive drain + 5 administrator act events) → legal challenge path (dual success/fail trigger events). EFCC letter fires independently at high corruption.
- [x] **Cat 1: Election Petition / Litigation arc** — petition (weeks 2–8, corruption > 45) → 20-week `litigationTimer` → tribunal midpoint hearing → `supreme-court-ruling`. 58 tests in `phase4CatTwoAndOne.test.ts`.

---

## Design Context

- **Register**: product
- **Purpose**: browser governance sim — data-dense, decision-focused UI
- **Audience**: serious player, adult register, reads fast under pressure
- **Personality**: Consequential · Grounded · Pressured
- **DNA**: Federal Gazette — Editorial Minimalism base + Data-Dense Pro layout discipline — see DESIGN.md
- **Archetype**: Sage (evidence-led, measured, zero decoration)
- **Mode**: Light + dark (toggle in header; `.dark` class on `<html>` overrides all tokens)
- **Constraints**: Tailwind v4 (`@import "tailwindcss"`), React inline styles for token refs (`style={{ color: 'var(--token)' }}`), WCAG AA
- **Fonts**: Newsreader (EventCard titles only, `.font-display`) + Archivo Narrow (everything else)
- **Signature move**: `border-top: 2px solid var(--accent-solid)` on EventCard — nowhere else
- **Kill list**: no `rounded-lg`, no shadows, no `bg-gray-*`, no second accent color

## Verification Checklist

Run before every merge:

- [ ] `npm run build` — zero TypeScript errors
- [ ] `npx vitest run` — all tests green
- [ ] All stat mutations go through `applyDelta` in statEngine.ts
- [ ] All stats respect their BOUNDS
- [ ] `applyDelta` has no side effects
- [ ] Weekly tick follows the 22-step order above
- [ ] New EventCard uses `immediate` (not `statDelta`), `DelayedConsequence.delta` (not `statDelta`), `DelayedConsequence.eventText` (not `title`/`description`)
- [ ] `eventQueue` pushes are `EventCard` objects, not id strings
- [ ] Queue-only events have `triggerCondition: () => false`
- [ ] Jurisdiction accuracy: state assembly/procurement → LAHA, not Federal Senate
- [ ] New initiative has entry in `src/data/initiatives.ts`

### Winning Strategy Tuning

The `'winning'` simulation strategy (`src/engine/simulateEngine.ts`) uses `WINNING_STRATEGY` — a single config object at the top of the file with all thresholds and weights. This strategy wins ≥ 60% of runs across 15 seeds (3 archetypes × 5 seeds; current best: 10/15 = 67%).

**When to re-tune:**
- Revenue/expenditure formula changes (game balance)
- New event categories that alter the option pool
- Stat bound changes (BOUNDS table in statEngine.ts)
- Post-debugging the game economy

**How to tune:**

```bash
# 1. Run the benchmark to measure current win rate
npx tsx scripts/benchmark.ts

# 2. Edit WINNING_STRATEGY thresholds in src/engine/simulateEngine.ts
#    Key levers:
#    - emergency.cashReserve: threshold (default 60) + weight (default 25) —
#      raise both to trigger earlier / stronger cash-preserving choices
#    - continuous.cashReserve + continuous.igr (default 1 and 2) —
#      always-active cash preference; raising above 2 overrides choice[0]
#      too often (tested: ≥ 3 caused regression)
#    - godfather.corruptionRefuseThreshold (default 50): lower = refuse earlier
#      to protect grants (corruption > 75 = -0.8bn/wk). Raising to 55+ caused
#      corruption death spirals; 50 is the sweet spot.
#    - godfather.comfortableGodfathers (default 30): when to stop accepting.
#      Raising to 40 caused more risk than benefit.
#    - overrideMinScore (default 5): minimum score above baseline to override
#      choice[0]. Lower = more deviation from safe default. 3 caused regressions.

# 3. Verify the benchmark passes (≥ 60%)
```

**Design principles behind the config:**
1. **Default to choice[0]** — game designers put the safe/effective option first on every event card. Only override when a stat crosses an emergency threshold.
2. **Godfather corruption ceiling** — the funding freeze (corruption > 75) costs 0.8bn/wk in lost grants. Keeping corruption below 60 is worth more than keeping godfathers above 25.
3. **Cash is king in the late game** — the structural deficit (expenditure > revenue) from week 150+ burns cash at 5-8bn/week. The strategy must build a large mid-game buffer and minimize late-game spending.
4. **Loyalist always wins** — high starting godfathers (90) + political capital (180) is dominant. Technocrat and outsider start with weak cash/godfathers and lose whenever events deal an unlucky hand.
5. **Deterministic state seeding** — `makeSeededArchetypeState` in both the benchmark test and standalone script ensures NPC/deputy assignment is reproducible, making the benchmark fully deterministic.
