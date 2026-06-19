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
    startingState.ts           — initial GameState values (source of truth for defaults)
    deputies.ts                — 7 deputy profiles (technocrat, politician, loyalist, reformer, traditionalist, economist, security-chief)
    commissionerCandidates.ts  — 3 candidates per commissioner role with competence/loyalty/background
    npcs.ts                    — NPCArchetypeDefinition (key, role, goal, passiveEffect, activationCondition, baseWeeklyPressure, namePools)
    godfatherAsks.ts           — fashemuAsks[4] + generalGodfatherPool
    legacy.ts             — buildLegacy(): headline templates + monologue styles
    /events
      transport.ts
      infrastructure.ts
      political.ts        — also contains Fashemu arc events, deputy events, LGA/primary events
      crisis.ts
      economy.ts
      characters.ts       — NEO, Dayo, SMJ events + 3-stage removal arc (removal-resolution-reading → committee → floor-vote)
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
    DeputyPanel.tsx       — resentment bar + trigger hint (right sidebar, hidden if no deputy)
    CabinetPanel.tsx      — collapsible commissioner roster + appointment UI (costs 8 PC)
    LegacyScreen.tsx      — end-of-term legacy view (replaces Scorecard)
    TimelinePanel.tsx     — decision history
    Scorecard.tsx         — term grades (used mid-game; LegacyScreen replaces at end)
    DevPanel.tsx          — DEV-only: simulateWeeks wrapper, strategy/seed/weeks inputs, stat diff display
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
9. `tickDeputyResentment` — per-archetype resentment accumulation
10. `activateNPCs` — threshold checks per NPC slot
11. `tickNPCPressure` — relationship-based weekly pressure gain
12. `applyNPCGoalEffects` — passive stat effects from active NPC goals
13. `checkNPCEscalation` — enqueue deck events when pressure ≥ 40
14. `tickInitiative`
15. `applyFashemuPhaseTransition`
16. LGA election at week 86 (mandatory)
17. Campaign mode flag at week 195
18. `checkGameOver`
19. Draw next event / godfather ask
20. `infrastructureScore -= 0.3` passive decay

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

**EventCard:** no `oneTime` field. Recurring = `isRecurring: true`. One-shot = omit or `isRecurring: false`. `eventQueue: EventCard[]` — push the actual card object, not an id reference. `maxTotalFirings?: number` — recurring event retires after firing this many times total (counted via `resolvedEvents.filter(id === event.id).length`). Cooldown still applies between firings.

**Choice:** `resentmentDelta?: number` — applied to `state.deputy.resentment` in `resolveEvent`. Use negative values on consequence choices that repair the deputy relationship.

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
| Party Removal | `partyGodfathers < 10` AND week > 52 | Three-stage arc: (1) `removal-resolution-reading` queued (`impeachmentStage = 1`). "Fight It" → chains to committee stage via `followUpEventId`. "Stonewall" in committee → chains to floor vote. "Accept the Outcome" (floor vote) or "Defy the Assembly" (reading) = game over. Recovery to **≥ 20** (not just > 10) cancels arc and clears queue. Stage stays at 1 until recovery or game over — does not re-trigger. |
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

## NPC System (gameLoop.ts)

NPCs are stored in `activeNPCs: Record<NPCKey, NPCState>` (npc1/npc2/npc3). Each slot has an archetype drawn from `NPC_ARCHETYPES` in `src/data/npcs.ts`.

**NPCArchetypeDefinition fields:**
- `goal: string` — displayed in NPCPanel; describes what this NPC is pursuing
- `activationCondition: (state) => boolean` — NPC becomes active when true
- `baseWeeklyPressure: (relationship) => number` — pressure gain per tick (hostile > neutral > ally)
- `passiveEffect: (npc, state) => StatDelta` — **applies every tick while active** based on relationship tier

**Passive effects by archetype (hostile / ally):**
| Archetype | Goal | Hostile effect | Ally effect |
|---|---|---|---|
| journalist | Expose Corruption | corruptionPressure +0.5/wk | corruptionPressure -0.3/wk |
| youth-organiser | Build Movement | youthTension +1.5/wk | youthTension -0.5, publicTrust +0.2/wk |
| insider | Undermine Governor | politicalCapital -1/wk | politicalCapital +0.5/wk |
| union-leader | Protect Workers | civilServiceReformScore -0.3/wk | infrastructureScore +0.1/wk |
| opposition-senator | Block Federal Support | federalRelationship -0.5/wk | federalRelationship +0.3/wk |
| diaspora-activist | International Accountability | publicTrust -0.3/wk | publicTrust +0.2/wk |
| oba-liaison | Community Relations | publicTrust -0.2/wk | publicTrust +0.2/wk |
| business-mogul | Business Growth | igr -0.1/wk | igr +0.1/wk |

Neutral tier (relationship 30–64) has no passive effect. Hostile = relationship < 30. Ally = relationship ≥ 65.

**Escalation:** when pressure ≥ 40, `checkNPCEscalation` enqueues a tier-matched event card from `NPC_DECK_BY_ARCHETYPE` and resets pressure to 0.

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

- [x] **Lagos Seasons (global modifier)** — `getSeasonModifier(week)` in `src/engine/seasonEngine.ts` returns a `SeasonModifier` each tick. Three overlapping conditions:
  - **Wet season** (June–September, ~weeks 5–18 of year 1): `faacVarianceScale=1.5`, `floodEventWeightMultiplier=3.0`. `lekki-flooding-developer` tagged `season: 'wet'` to pick up the multiplier.
  - **Federal Election Year** (weeks 1–52 and 157–208 — Nigerian 2027/2031 cycle): `politicalCapitalCostScale=1.2`, `federalRelationshipWeeklyDrift=-0.3/week`, `faacBasePenalty=0.1`.
  - **Budget Crunch** (December–January, ~weeks 28–35): `faacBasePenalty=0.2` (overrides election-year 0.1).
  - Wired in: `eventEngine.ts` (weight bias + PC cost scaling), `gameLoop.ts` (FAAC variance, crunch penalty, election drift). 28 tests in `src/engine/__tests__/seasonEngine.test.ts`.

- [x] **Adjacency-based crisis unlocks** — extreme stat combinations trigger cascades, implemented in `gameLoop.ts`:
  - **International Funding Freeze**: `corruptionPressure > 75` for 3 consecutive weeks sets `grantFreezeDuration = 8`; `revenueEngine.ts` returns `grants = 0` while active; `highCorruptionWeeks` counter resets if pressure drops below 75. `grantFreezeCount` tracks total lifetime freezes — message varies by count; at count ≥ 3, `grantsCompliance` is permanently zeroed.
  - **Riot Mode**: `youthTension > 70` sets `riotModeActive = true`; `drawNextEvent` in `eventEngine.ts` serves only `category: 'riot'` events from `src/data/events/riot.ts` (3 events: curfew, security surge, youth parley) until tension returns to ≤ 70. 15 tests in `src/engine/__tests__/cascades.test.ts`.

- [x] **Governor archetypes (variable starts)** — `src/data/archetypes.ts` defines 3 archetypes via `getArchetypeState(key)` (merges onto `STARTING_STATE`); `ArchetypeSelectionScreen.tsx` shows before `DeputySelectionScreen` in the new-game flow (App.tsx); `STARTING_STATE` itself is unchanged (used as test baseline). Three archetypes:
  - **Technocrat**: cashReserve 65, infrastructureScore 62, politicalCapital 0, partyGodfathers 30
  - **Loyalist**: politicalCapital 180, partyGodfathers 90, publicTrust 35, corruptionPressure 50
  - **Outsider**: publicTrust 75, civilSocietyMedia 80, cashReserve 25, partyGodfathers 20
  - 17 tests in `src/data/__tests__/archetypes.test.ts`.

### Characters & Narrative

- [x] **NPC active AI decks** — all 8 archetypes in `npcs.ts` now have `goal: string` and `passiveEffect: (npc, state) => StatDelta`. Applied each tick via `applyNPCGoalEffects` in `gameLoop.ts` (step 12 of tick order). Hostile NPCs drain relevant stats; ally NPCs provide small weekly bonuses. Neutral tier has no effect. See the NPC System section above for the full table.

- [x] **Deputy resentment arc** — `tickDeputyResentment` in `gameLoop.ts` accumulates resentment per tick based on deputy type:
  - technocrat: infra < 35 → +1/wk; politician: lgChairmen < 35 → +2/wk; loyalist: trust < 40 → +1/wk; reformer: corruption > 55 → +2/wk; traditionalist: refusals > 2 → +2/wk; economist: cash < 5 → +2/wk; security-chief: security < 40 → +1/wk.
  - Three consequence events in `characters.ts`: `deputy-consequence-politician` (resentment ≥ 60), `deputy-consequence-loyalist` (week ≥ 130), `deputy-consequence-reformer` (godfatherComplianceCount ≥ 3).
  - `resentmentDelta?: number` added to `Choice` type and wired in `resolveEvent` — negative values let consequence choices reset relationship.
  - After consequence resolves: `deputy.revealed = true`, resentment resets to 0, accumulation stops.

- [x] **Deputy resentment UI** — `DeputyPanel.tsx` in the right sidebar shows: archetype label, resentment bar (0–100, green/orange/red), trigger condition hint, and warning text at ≥ 40 / ≥ 60 resentment. Hidden if `deputy === null`.

- [x] **Commissioner mechanical effects** — all four wired:
  - Works `isGodfatherChoice: true` → `procurementLeakage +5%` in `dragEngine.ts` and `projectEngine.ts`
  - Works high competence (clean) → `effectiveProgressGain × (1 + competence/100 × 0.1)` in `projectEngine.ts`
  - Finance competence → `grants += 0.8 × min(1, grantsCompliance + competence/100 × 0.15)` in `revenueEngine.ts`
  - Information loyalty → `weight × (1 − loyalty/100 × 0.25)` for events with civilSocietyMedia < -3 in `eventEngine.ts`

### Tech Debt

- [ ] **simulation.test.ts BOUNDS coverage** — `BOUNDS` in the test only covers 10 of 21 `StatKey` values. Change type to `Partial<Record<StatKey, ...>>` and add entries for `ghostWorkerRate`, `contractorBacklog`, `debtStock`, `weeklyDebtRepayment`, `weeklyDebtInterest`, `landUseChargeEnforcement`, `grantsCompliance`, `civilServiceReformScore`, `baseOverheads`, `subventionCutRate`, `capitalEfficiency`.

- [x] **Campaign mode UI** — `inCampaignMode` flag activates at week 195. `App.tsx` renders a purple banner ("ELECTION CAMPAIGN MODE — Week 195+ · Every decision counts") directly below the header when `inCampaignMode === true` and the game is not over.

- [x] **Commissioner appointment screen** — `CabinetPanel.tsx` in the right sidebar shows all 5 commissioner roles (works, finance, environment, transport, information). Each role card shows the current commissioner (competence/loyalty bars + "GF Pick" badge if godfather-appointed) or "Vacant". "Appoint"/"Replace" button opens inline candidate list from `src/data/commissionerCandidates.ts` (3 candidates per role with background description). Appointment costs 8 Pol. Capital and always sets `isGodfatherChoice: false`. Panel is collapsible. `appointCommissioner(role, candidate)` action on the Zustand store.

- [x] **NPC relationship display** — `NPCPanel.tsx` added, shows all 3 active NPC slots with: name, short role, Ally/Neutral/Hostile badge, Goal text, relationship bar, pressure bar. Dormant slots show "Watching. Not yet active."

- [x] **Fast-forward / speed-run mode** — `src/engine/simulateEngine.ts` exports:
  - `simulateWeeks(state, n, options): SimulateResult` — pure function. Temporarily replaces `Math.random` with mulberry32 seeded PRNG for full determinism (tick internals + choice selection both draw from the same seed). Strategies: `'first'` (always choice 0), `'random'` (random draw), `'weighted'` (softmax biased toward stat-improving choices). Returns `{ state, weeksSimulated, stoppedEarly, seed }`.
  - `SimulateStrategy`, `SimulateOptions`, `SimulateResult` types.
  - `fastForward(n, options)` action on the Zustand store wraps `simulateWeeks` and writes state.
  - `DevPanel` component (`src/ui/DevPanel.tsx`) renders only in `import.meta.env.DEV` (bottom-right corner, collapsible). Shows strategy/weeks/seed inputs, a "⏩ Skip N weeks" button, and a before/after diff of key stats + factions after each run.

- [ ] **Save versioning migration layer** — `persistence.ts` already embeds `version: SAVE_VERSION` (currently `2`) in localStorage and exports. When `SAVE_VERSION` increments, `loadGame` should detect mismatches and either migrate the old save or warn the user. Currently it silently uses `{ ...STARTING_STATE, ...rest }` merge which handles additive changes but not field renames or removals. Add a `migrateV1toV2(raw)` pattern for breaking changes.

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
