# AGENT.md — Lagos Governor Sim
> Read this file before touching any code in this project.

---

## What This Project Is

A browser-based governance simulation game set in Lagos, Nigeria. The player is Governor of Lagos State for a 4-year term (208 weeks). The game is **decision-driven** — think Frostpunk, not SimCity. No tiles, no real-time simulation. The player makes choices from event cards, watches stats change, and deals with delayed consequences weeks later.

**The thesis:** Everyone thinks Lagos is easy to fix. This game lets them try.

**Tech stack:** TypeScript, React, Zustand, Tailwind CSS, Vite. Runs entirely client-side. No backend.

---

## Project Structure

```
/src
  /engine
    gameLoop.ts           — weekly tick orchestrator (the god function)
    statEngine.ts         — pure stat mutation via applyDelta()
    revenueEngine.ts      — calculateWeeklyRevenue: PAYE, MDA, LUC, FAAC, grants
    expenditureEngine.ts  — calculateWeeklyExpenditure: personnel, debt, overheads, subventions
    debtEngine.ts         — takeLoan, emergencyBridgeLoan, repayment scheduling
    dragEngine.ts         — hidden drag: procurement leakage, ghost regen, overhead creep, FAAC variance
    projectEngine.ts      — capital project pipeline, stall logic, completion events
    factionEngine.ts      — faction mood updates and drift
    eventEngine.ts        — card drawing, condition checks, delay queue
    godfatherEngine.ts    — Fashemu arc, phase transitions, ask draw logic
    electionEngine.ts     — vote share calculation for term-end election
  /data
    startingState.ts      — initial GameState values (source of truth for defaults)
    deputies.ts           — 3 deputy profiles (technocrat, politician, loyalist)
    commissioners.ts      — commissioner candidate pool per role
    godfatherAsks.ts      — fashemuAsks[4] + generalGodfatherPool
    legacy.ts             — buildLegacy(): headline templates + monologue styles
    /events
      transport.ts
      infrastructure.ts
      political.ts        — also contains Fashemu arc events, deputy events, LGA/primary events
      crisis.ts
      economy.ts
      characters.ts       — NEO, Dayo, SMJ events + removalResolutionEvent
      election.ts         — 3 mandatory campaign event cards
      llm_generated.ts    — LLM-authored event cards (optional)
  /utils
    calendar.ts           — weekToDate, formatGameDate, seasonOf (display layer only)
  /state
    gameStore.ts          — Zustand store, actions, setDeputy
    types.ts              — ALL TypeScript types live here. Source of truth.
    persistence.ts        — serialize/deserialize with STARTING_STATE merge for compat
  /ui
    App.tsx               — root: welcome modal → deputy select → game → legacy screen
    Dashboard.tsx         — master stats view
    EventCard.tsx         — decision card + choice buttons
    FactionPanel.tsx      — faction approval bars
    BudgetPanel.tsx       — weekly P&L breakdown
    PollPanel.tsx         — constituency approval ratings
    GodfatherInbox.tsx    — Fashemu message thread with phase badge
    DeputySelectionScreen.tsx — full-screen deputy choice at game start
    LegacyScreen.tsx      — end-of-term legacy view (replaces Scorecard)
    TimelinePanel.tsx     — decision history
    Scorecard.tsx         — term grades (used mid-game; LegacyScreen replaces at end)
```

---

## Core Architecture Rules

### The pure function pattern
Every engine function is a pure function: `(state: GameState, ...) => GameState`. No mutation, no side effects.

All stat changes go through:
```typescript
applyDelta(state, delta): GameState         // statEngine.ts
applyFactionDeltaState(state, delta): GameState  // factionEngine.ts
```

### Stat bounds (enforced in statEngine.ts BOUNDS table)
| Stat | Min | Max |
|---|---|---|
| publicTrust | 0 | 100 |
| infrastructureScore | 0 | 100 |
| securityIndex | 0 | 100 |
| politicalCapital | 0 | 200 |
| corruptionPressure | 15 | 80 |
| federalRelationship | -50 | 50 |
| cashReserve | -∞ | ∞ (but triggers emergency loan / bankruptcy) |
| igr, expenditure | 0 | ∞ |

### Weekly tick order (gameLoop.ts)
1. Increment week
2. `revenueEngine` + `expenditureEngine` → apply net flow to cashReserve
3. `dragEngine` → FAAC variance, ghost regen, overhead creep, procurement leakage
4. Loan repayments + debt stock reduction
5. `projectEngine.processProjects`
6. `firePendingDelayed` from pendingDelayed queue
7. `factionEngine.drift`
8. publicTrust drift toward constituency-weighted average (10% pull/week)
9. `activateNPCs` (NEO, Dayo, SMJ threshold checks)
10. `applyFashemuPhaseTransition`
11. LGA election at week 86 (mandatory)
12. Campaign mode flag at week 195
13. `checkGameOver`
14. Draw next event / godfather ask
15. `infrastructureScore -= 0.3` passive decay

---

## Key Types (types.ts — always the source of truth)

`types.ts` is comprehensive and well-documented. Don't duplicate its type definitions here — read it directly. Key structural notes:

**Choice shape:**
```typescript
type Choice = {
  id: string
  label: string
  description: string
  immediate: StatDelta           // NOT statDelta — it's immediate
  factionImpact: FactionDelta
  delayed?: DelayedConsequence
  followUpEventId?: string
  politicalCapitalCost?: number
  corruptionTrigger?: boolean
}
```

**DelayedConsequence shape:**
```typescript
type DelayedConsequence = {
  weekOffset: number
  delta: StatDelta               // NOT statDelta
  factionImpact?: FactionDelta
  eventText: string              // single string, NOT title/description
  constituencyImpact?: Partial<ConstituencyApproval>
  followUpEventId?: string
}
```

**Loan shape:**
```typescript
type Loan = {
  id: string
  source: LoanSource
  principal: number
  outstanding: number
  weeklyRepayment: number
  weeklyInterest: number
  disbursedOnWeek: number
  conditions: string[]
}
```

**EventCard:** no `oneTime` field. Recurring = `isRecurring: true`. One-shot = omit or `isRecurring: false`. `eventQueue: EventCard[]` — push the actual card object, not an id reference.

---

## Phase 2 State Fields

All live in `GameState` (types.ts). Defaults in `startingState.ts`. Persistence handled by `{ ...STARTING_STATE, ...rest }` merge in `persistence.ts` — old saves get defaults automatically.

| Field | Type | Purpose |
|---|---|---|
| `deputy` | `DeputyState \| null` | Chosen deputy governor |
| `fashemuPhase` | `FashemuPhase` | dormant → active → warning → break → reconciled → dead |
| `fashemuAskIndex` | `number` | Which of the 4 ordered asks has been reached |
| `fashemuRelationship` | `number` | Personal relationship score with Fashemu |
| `fashemuEndingPath` | `'A'\|'B'\|'C'\|'D'\|null` | Set at term end |
| `activeNPCs` | `Record<NPCKey, NPCState>` | NEO, Dayo, SMJ activation state |
| `commissioners` | `Partial<Record<CommissionerRole, CommissionerState>>` | Cabinet |
| `lgaElectionResult` | `number \| null` | % of LGAs loyal (set at week 86) |
| `lgaElectionHeld` | `boolean` | |
| `primaryWon` | `boolean \| null` | Party primary result |
| `primaryScenario` | `'A'\|'B'\|'C'\|null` | Smooth / contested / open |
| `campaignDecisions` | `string[]` | Choice ids from 3 campaign event cards |
| `electionResult` | `number \| null` | Vote share at term end |
| `reElected` | `boolean \| null` | |
| `inCampaignMode` | `boolean` | True from week 195 |
| `impeachmentStage` | `number` | 0=none, 1=first reading queued, 2=removed |
| `emergencyLoansTaken` | `number` | Count of emergency bridge loans (escalates APR) |

---

## Game Over Conditions

| Condition | Trigger | Notes |
|---|---|---|
| Bankruptcy | `cashReserve < 0` for 3 consecutive weeks | First negative week auto-triggers ₦10bn emergency bridge loan at 35%+ APR |
| Federal Takeover | `federalRelationship < -40` AND `infrastructureScore < 25` | |
| Mass Uprising | `publicTrust < 15` AND `youthTension > 85` | |
| Party Removal | `partyGodfathers < 10` AND week > 52 | Two-stage: first queues "Removal Resolution" event. Defy = instant removal. Fight/Negotiate = survives. Recovery above 10 cancels it. |
| Term End | `week > 208` | Triggers election result + LegacyScreen |

---

## Fashemu Arc (Named Godfather)

**Chief B.O.A. Fashemu** — 4 ordered asks at week gates 8, 26, 52, 85. Tracked by `fashemuAskIndex`. After all 4 resolved, general godfather pool activates.

Phase transitions run weekly in `applyFashemuPhaseTransition` (godfatherEngine.ts):
- `dormant` → `active`: 2+ compliances
- `active` → `warning`: 3+ refusals
- `warning` → `break`: 4+ refusals
- `break` → `reconciled`: EFCC cooperation timeline entry
- Any → `dead`: `fashemu-death` event fires (low probability after week 130)

**Ending paths** (detected at week > 208 in `checkGameOver`):
- A: compliance ≥ 3, no break → Fashemu backs successor
- B: refusals ≥ 4, survived → freedom at cost
- C: EFCC cooperation timeline entry found → complex legacy
- D: `fashemuPhase === 'dead'` → fragmented network

---

## NPC Activation (gameLoop.ts → activateNPCs)

| NPC | Activates when |
|---|---|
| NEO (Barr. Ngozi Eze-Okoro) | `corruptionPressure > 35` OR procurement scandal resolved |
| Dayo (Comrade Dayo Afolabi) | `youthTension > 55` OR Makoko resolved badly + trust < 45 |
| SMJ (Hon. Seun Majekodunmi) | `partyGodfathers < 45` OR `godfatherRefusalCount >= 2` |

Once active, their event cards become drawable (checked via `triggerCondition: state => state.activeNPCs.neo.isActive`).

---

## Calendar (utils/calendar.ts — display layer only)

Engine truth is `state.week` (1–208). Dates are display-only.

```
START_DATE = 2027-05-29
Week 1  = May 29, 2027
Week 52 = May 27, 2028 (2028 is a leap year)
Week 208 = May 28, 2031
```

Functions: `weekToDate(week)`, `formatGameDate(week)`, `formatGameMonth(week)`, `seasonOf(week)`.

---

## Event Card Writing Rules

When adding new event cards to `/data/events/`:

1. **Every card must have 2–4 choices**
2. **At least one choice must move two factions in opposite directions**
3. **At least one choice should have a `delayed` consequence**
4. **No choice should be obviously correct** — if a choice is clearly right, redesign it
5. **Body text must have Lagos texture** — reference real places, real dynamics
6. **No moralising in body text** — present the situation, not the lesson
7. **Jurisdiction accuracy matters** — state procurement/assembly matters go through LAHA, not Federal Senate. Federal involvement requires a federal funding hook.
8. **Severity calibration:**
   - `low`: single stat moves < 5pts
   - `medium`: 2–3 stats move 5–10pts
   - `high`: multiple stats move 10–20pts, or one stat moves 20+pts
   - `critical`: potential game over path, or irreversible consequence

---

## UI/UX Rules

- **Simple mode** (default): human-readable descriptions, hide raw numbers, lead with narrative
- **Detailed mode**: raw numbers, trend arrows, source footnotes
- Dashboard always shows: date (calendar format), cash reserve, public trust, political capital
- Faction bars are always visible
- Event card takes focus when active — dim everything else
- Delayed consequences show a "flashback" line: *"3 months ago, you chose to..."*
- Term-end renders `<LegacyScreen />` not `<Scorecard />`

---

## Revenue Reference (revenueEngine.ts)

| Line | Base (₦bn/wk) | Driver |
|---|---|---|
| PAYE | 19.6 | infrastructureScore (0.3×), securityIndex (0.2×), youthTension (0.2×), base (0.3×) |
| MDA | 5.9 | infrastructureScore (0.4×), securityIndex (0.2×), base (0.4×) |
| Land Use Charge | 0.3 | × landUseChargeEnforcement (1.0–3.0) |
| Other | 2.1 | half linked to infra, half fixed |
| FAAC | 8.7 | reduced by federalRelationship: -15=0.9×, -30=0.7×, -40=0.4×, below=-0.1× |
| Grants | 0.8 | × grantsCompliance (0.6–1.0) |

## Expenditure Reference (expenditureEngine.ts)

| Line | Base (₦bn/wk) | Driver |
|---|---|---|
| Personnel | 7.7 | inflated by ghostWorkerRate |
| Debt interest | derived | weeklyDebtInterest stat |
| Debt repayment | derived | weeklyDebtRepayment stat |
| Overheads | 15.4 | + godfatherComplianceCount × 0.3 |
| Subventions | 3.9 | × (1 − subventionCutRate) |
| Contractor payment | derived | 15% of backlog/wk, capped ₦4bn |

---

## Lagos Data Reference

| Metric | Real Value |
|---|---|
| Lagos population | 15–22 million |
| Formal sector workers | ~3 million |
| Youth unemployment | ~38% |
| Roads in poor condition | ~40% of 9,000km |
| Civil servants | ~80,000 |
| Annual budget | ₦2.2–2.8 trillion |
| Annual IGR | ~₦660bn |
| Debt stock | ~₦1.4 trillion |
| Corruption drag (est.) | 20–40% of project costs |

---

## Build Tooling — Vite 6 (Downgraded from Vite 8)

Vite 8, vitest 4, jsdom 29 were downgraded to Vite 6 / vitest 3 / jsdom 26 because Coolify's nixpacks resolves `NIXPACKS_NODE_VERSION=22` to Node 22.11.0, below Vite 8's minimum (22.12.0). To upgrade back: change `NIXPACKS_NODE_VERSION` to `24`.

---

## What NOT to Build Yet

- No map
- No multiplayer / backend
- No audio
- No authentication
- No save-to-server (localStorage is fine)
- No second term arc (reElected = true shows placeholder for now)

---

## Questions Before Major Decisions

- Adding a new major stat → ask first, it affects everything downstream
- Changing weekly tick order → ask first, it changes game feel
- Adding real Nigerian political names → sensitive, confirm approach first
- Adding backend → confirm we're in a new phase first

---

## Phase 3 Backlog

Work through these in order. Tick each off when shipped (tests green, build passes).

### Replayability & Systems Depth

- [x] **Event chains / state flags** — `stateFlags: Record<string, boolean>` on GameState; `setFlags?: Record<string, boolean>` on Choice; wired in `resolveEvent`. Four live chains: ghost purge aggressive → `union-court-injunction`; ghost purge quiet → `union-work-to-rule` (week ≥ 20); Fashemu's commissioner → `works-tender-scandal` (week ≥ 30); Makoko demolished → `makoko-land-grab-exposed`. Chain events live in `src/data/events/chains.ts`. 22 tests in `src/engine/__tests__/eventChains.test.ts`.

- [ ] **Lagos Seasons (global modifier)** — at the start of each in-game year, roll a macro-modifier that shifts event weights and stat math:
  - Rainy Season (weeks 5–17 of each year): flood/drainage events weight 3×, FAAC variance widens
  - Federal Election Year (year 3): federalRelationship baseline drops, politicalCapital costs scale up
  - Budget Crunch Quarter: FAAC reduced 20% for 4 weeks

- [ ] **Adjacency-based crisis unlocks** — extreme stat combinations unlock cascades, not just individual event triggers:
  - `corruptionPressure > 75` for 3 consecutive weeks → "International Funding Freeze" (grants drop to 0 for 8 weeks)
  - `youthTension > 70` → normal event pool suspended, riot management sub-deck takes over until tension drops

- [ ] **Governor archetypes (variable starts)** — replace fixed STARTING_STATE with 3 selectable starts:
  - Technocrat: high infrastructureScore + cashReserve, zero politicalCapital, partyGodfathers 30
  - Party Loyalist: partyGodfathers 90, politicalCapital 180, corruptionPressure 50, publicTrust 35
  - Reform Outsider: publicTrust 75, civilSocietyMedia 80, partyGodfathers 20, cashReserve 25

### Characters & Narrative

- [ ] **NPC active AI decks** — NEO, Dayo, SMJ currently fire reactive events. Each should pursue an independent goal via a weighted mini-deck that escalates pressure without player provocation.

- [ ] **Deputy resentment arc** — `resentment` field exists on `DeputyState` but nothing increments it. Wire: specific event choices that override deputy's "recommendation" increment resentment +10. At resentment ≥ 60, fire type-specific consequence card (technocrat leaks to press, politician joins opposition, loyalist secret revealed).

- [ ] **Commissioner mechanical effects** — `competence`/`loyalty` scores are stored but unused by engines. Wire:
  - Works commissioner `isGodfatherChoice: true` → `procurementLeakage +5%` in dragEngine
  - Works commissioner high competence → project completion speed +10% in projectEngine
  - Finance commissioner high competence → `grantsCompliance` starts 0.1 higher
  - Information commissioner loyalty → modifier on civil society event weights

### Tech Debt

- [ ] **simulation.test.ts BOUNDS coverage** — `BOUNDS` in the test only covers 10 of 21 `StatKey` values. Change type to `Partial<Record<StatKey, ...>>` and add entries for `ghostWorkerRate`, `contractorBacklog`, `debtStock`, `weeklyDebtRepayment`, `weeklyDebtInterest`, `landUseChargeEnforcement`, `grantsCompliance`, `civilServiceReformScore`, `baseOverheads`, `subventionCutRate`, `capitalEfficiency`.

- [ ] **Campaign mode UI** — `inCampaignMode` flag exists but dashboard has no visual indicator that the player is in the election stretch. Add a banner/badge in App.tsx when `inCampaignMode === true`.

- [ ] **Commissioner appointment screen** — no UI to browse candidates. Currently only fires via event card. Add a cabinet panel (simple mode: just names; detailed mode: competence/loyalty bars).

- [ ] **NPC relationship display** — no panel showing NEO/Dayo/SMJ status or relationship scores. Add to FactionPanel or a new NPCPanel.

---

## Verification Checklist (run before every merge)

- [ ] `npm run build` passes (zero TypeScript errors)
- [ ] `npx vitest run` — all tests green
- [ ] All stat mutations go through `applyDelta` in statEngine.ts
- [ ] All stats respect their bounds
- [ ] `applyDelta` has no side effects — pure function
- [ ] Weekly tick follows the 15-step order above
- [ ] Every new EventCard conforms to the `EventCard` type (no extra fields like `oneTime`, `statDelta`, `amount`)
- [ ] Every EventCard has no obviously correct choice
- [ ] `Choice.immediate` (not `statDelta`), `DelayedConsequence.delta` (not `statDelta`), `DelayedConsequence.eventText` (not `title`/`description`)
- [ ] `eventQueue` pushes are `EventCard` objects, not id strings
- [ ] Jurisdiction accuracy: state procurement/assembly → LAHA, not Federal Senate

---

*This file is the contract between the game design and the code. Keep it updated.*
