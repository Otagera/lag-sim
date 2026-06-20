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
22. `infrastructureScore -= 0.3` passive decay

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
| Term End | week > 208 → election → LegacyScreen |

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
- **Mode**: Light only
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
