# Game Logic Audit — Lagos Governor Sim

Audited from `src/engine/`, `src/data/`, `src/state/`. Maps are shelved and excluded.

---

## 1. ENGINE — What Actually Works

### 1.1 Stats — every real stat

| Stat | Default | Bounds | Mutated by | Drives |
|---|---|---|---|---|
| `cashReserve` | 45bn | -∞ ∞ | netFlow, FAAC variance, loans, emergencyBridgeLoan, project draws, choice effects, suspension drain | Game over (3 consecutive weeks < 0) |
| `publicTrust` | 54 | 0–100 | choices, constituency drift (10%/wk toward weighted avg), suspension drain, decay | Game over (< 15 with youthTension > 85), zone colour |
| `infrastructureScore` | 42 | 0–100 | choices, project completions (+5), stalled projects (−0.5 each), passive decay (−0.5/wk + extra above 70) | Revenue (PAYE, MDA, other), federal takeover check |
| `politicalCapital` | 100 | 0–200 | choices, commissioners appointments (−8), godfather escalation, suspension | Commissioner affordability, some choices |
| `corruptionPressure` | 28 | 15–80 | passive +0.5/wk, corruptionTrigger (+3), diminishingReturns escalation, godfather escalation | Procurement leakage rate, grant freeze trigger (> 75 for 3+ weeks) |
| `federalRelationship` | 5 | −50–50 | choices, federal-election-year drift (−0.3/wk), federal loan penalty (−10) | FAAC multiplier (range 0.1–1.0), federal takeover check |
| `securityIndex` | 61 | 0–100 | choices, deputy visits | Revenue (PAYE, MDA), flicker stability |
| `youthTension` | 35 | 0–100 | passive +0.4/wk, choices, deputy visits | Riot mode (> 70), game over (> 85 with trust < 15) |
| `igr` | 12.8bn | 0–∞ | set to revenue.total each tick, choice effects | Budget solvency |
| `expenditure` | 11.2bn | 0–∞ | set to expenditure.total each tick | Dev readability |
| `ghostWorkerRate` | 0.09 | 0.05–0.2 | dragEngine ghostRegenRate +0.001/wk per missing reform, choices | Personnel = 9.2 × (1 + rate) |
| `contractorBacklog` | 0 | 0–∞ | +0.1/wk − contractorPayment, choices | Contractor payment rate |
| `debtStock` | 0 | 0–∞ | loan principal, −weeklyDebtRepayment | Dev readability |
| `weeklyDebtRepayment` | 0 | 0–∞ | loan repayment terms, completed loan removal | Expenditure line item |
| `weeklyDebtInterest` | 0 | 0–∞ | loan interest terms, completed loan removal | Expenditure line item |
| `landUseChargeEnforcement` | 1 | 0–3 | choices | Revenue: 0.3 × value per week |
| `grantsCompliance` | 0.6 | 0–1 | grant freeze (set to 0 after 3rd freeze), choices | Revenue: 0.8 × min(1, value + commissioner bonus) |
| `civilServiceReformScore` | 0 | 0–100 | choices | Ghost regen rate multiplier |
| `baseOverheads` | 0 | — | dragEngine +0.05/wk (+0.02 in term 2) | Overheads = 17 + godfatherInflation + baseOverheads |
| `subventionCutRate` | 0 | 0–0.4 | choices | Subventions = 3.9 × (1 − rate) |
| `capitalEfficiency` | 1 | 0–1 | calculated each tick | Dev readability |

### 1.2 Weekly tick — what happens step-by-step

Code in `src/engine/gameLoop.ts:tick()` (290 lines). Actual order:

1. **Increment week** (`state.week + 1`)
2. **Revenue + expenditure** — real formulas run; netFlow = total − total
3. **FAAC variance** — `dragEngine.calculateHiddenDrag()` → scaled by season → applied to cashReserve. Timeline entry if > 2bn swing.
4. **Budget crunch** — Dec/Jan withholds fraction of FAAC
5. **Federal election drift** — −0.3 federalRelationship/wk in election years
6. **Passive corruption rise** — +0.5/wk, always
7. **Grant freeze cascade** — corruption > 75 for 3+ weeks → 8-week freeze. 3 freezes → grantsCompliance permanently 0
8. **Riot mode** — youthTension > 70 triggers riotModeActive
9. **Ghost regen, overhead creep, contractor backlog** — all real
10. **Loan repayments** — outstanding reduced each week; completed loans removed, repayment removed from weeklyDebtRepayment
11. **Debt stock reduction** — debtStock −= weeklyDebtRepayment
12. **Project engine** — `processProjects()` draws cash, checks affordability, applies leakage, advances progress, completes projects
13. **Fire pending delayed** — all delayed consequences whose `firesOnWeek ≥ state.week` fire now
14. **Faction drift** — 5 factions drift ±2/wk toward neutral (50)
15. **PublicTrust drift** — 10% pull toward constituency-weighted average
16. **Deputy resentment** — ticks up based on deputy key + conditions
17. **NPC activation** — checks archetype activationCondition
18. **NPC pressure** — ticks up based on relationship level
19. **NPC goal effects** — passive stat deltas (corruption, youthTension, etc.)
20. **NPC escalation** — pressure ≥ 40 → drafts NPC deck event, enqueues it (if available for tier)
21. **Initiative tick** — decrements `weeksRemaining`; enqueues completion event at 0
22. **Fashemu phase transition** — checks refusal count, resolved events → sets phase
23. **Suspension tick** — drains cash −1.5bn/wk + trust −1/wk + factions; enqueues administrator act events
24. **Litigation tick** — decrements timer; at 0, enqueues `supreme-court-ruling`
25. **LGA election** — week 86 mandatory calculation
26. **Campaign mode** — week 195 flip (term 1 only)
27. **Game over checks** — bankruptcy, federal takeover, uprising, impeachment, primary loss, term end
28. **Draw next event** — only if no activeEvent; checks queue first, then triggered, then weighted pool
29. **Draw godfather** — only if `shouldDrawGodfather()` returns true
30. **Infra decay + youthTension rise** — applied every tick
31. **Approval history** — 8-week rolling window per LGA
32. **News article** — `evaluateNews()` generates newspaper headline

### 1.3 Budget — does it actually bite?

**Yes.** The starting deficit is real:

```typescript
// revenueEngine.ts line 33
const total = paye + mda + luc + other + faac + grants
// At starting state: ~29.1bn/week

// expenditureEngine.ts line 21
const total = personnel + debtInterest + debtRepayment + overheads + subventions + contractorPayment
// At starting state: ~30.9bn/week

// Net: −1.8bn/week
```

Starting `cashReserve = 45bn`. Without any intervention the player goes bankrupt in ~25 weeks. Emergency bridge loans (3 × 10bn at 35%+ APR) stretch survival to ~42 weeks. To survive the full 208 weeks the player MUST raise IGR, cut overheads, and/or secure grants — the formulas force it.

Key revenue levers that actually work through events:
- `PAYE enforcement` → igr +4.5bn/week after initiative completes
- `LUC audit` → landUseChargeEnforcement 0→3, adding 0.9bn/week
- `World bank grant` → grants 0→0.8bn/week after initiative
- `Federal relationship` → FAAC multiplier swings 0.1–1.0 (max delta: 7.8bn/week)

### 1.4 Corruption / Debt / Backlog — real or stubbed?

| Mechanic | Status | Evidence |
|---|---|---|
| **Corruption pressure** | **Fully real** | Passive +0.5/wk, checks on procurement leakage (15% + corr/100×25%), grant freeze trigger at >75 for 3 weeks, diminishingReturns escalation, godfather refusal escalation |
| **Procurement leakage** | **Fully real** | `dragEngine.ts:6` — `leakageRate = 0.15 + (corruption/100) * 0.25 + godfatherChoiceBonus`. Applied in projectEngine: `effectiveProgressGain = (draw/totalCost) * 100 * (1 - leakage)` |
| **Debt system** | **Partial** | `emergencyBridgeLoan` fully implemented. `takeLoan()` function exists for other sources (world_bank, bond, federal_govt) with proper terms, but NO event or UI calls it. Only emergency loans fire automatically. |
| **Contractor backlog** | **Real** | Accrues +0.1/wk, reduced by contractorPayment (min(backlog×0.15, 4)/wk). Stalled projects when cash is insufficient. |
| **Ghost workers** | **Real** | Rate drifts up via dragEngine, inflated personnel cost, can be reduced via civil-service-reform initiative (14-week). Biometric audit is a separate initiative path. |

---

## 2. CONTENT — How Much Actually Exists

### 2.1 Event card count: 242

| Category | Count | Covers |
|---|---|---|
| transport | 3 | Traffic, bridge, potholes |
| infrastructure | 9 | Bridge collapse, flooding, power, landfill, projects |
| political | 25 | Fashemu arc, deputies, commissioners, LGA elections, primaries, corruption, federal liaison, ghost worker, state of state |
| crisis | 5 | Power outage, Makoko, building collapse, tanker explosion, resettlement |
| economy | 13 | Tax evasion, inflation, agbero, FAAC shortfall, PAYE enforcement, LUC audit, world bank grant, civil service reform, capital flight |
| social | 2 | Okada, #EndSARS |
| characters | 18 | NEO journalist, Dayo organiser, SMJ insider, deputy consequences, removal resolution |
| election | 3 | Rally, promise, media strategy |
| chains | 4 | Union injunction, work-to-rule, tender scandal, land grab |
| riot | 3 | Curfew, security surge, youth parley |
| phase4 | 23 | Suspension arc, litigation arc, ghost worker purge, assembly maneuver, sanctuary offer, stomach infrastructure, EFCC |
| llm_generated | 26 | Long-form flavor events (random pool only) |
| routine | 13 | Handover, teacher salary, budget, rains, press, weekly allocation, IGR, security, maintenance, youth, constituency, sanitation |
| midgame | 4 | Press verdict, budget revolt, teachers strike, security audit |
| campaign | 7 | Blackout, oba endorsement, swing ward, transport hostage, 3 opponent attacks |
| finale | 3 | Debate, security breakdown, election eve |
| term2 | 65 | Full second-term deck — infrastructure, debt, succession, EFCC, media, governors, etc. |
| npcDecks | 16 | Per-archetype NPC events (journalist, organiser, insider, union, senator, diaspora, oba, mogul) |

### 2.2 Representative event structure

From `economy.ts:63 — agbero-ultimatum`:

```typescript
{
  id: 'agbero-ultimatum',
  title: 'Agbero Ultimatum',
  body: `NURTW-affiliated agberos have given the state government 72 hours...`,
  severity: 'high',
  category: 'economy',
  choices: [
    {
      id: 'pay-levy-relief',
      label: 'Pay Levy Relief',
      description: 'Transport keeps moving. IGR -0.3bn, Corruption +3...',
      immediate: { igr: -0.3, corruptionPressure: 3 },
      factionImpact: { informalEconomy: 8, businessCommunity: -4 },
    },
    {
      id: 'arrest-leadership',
      label: 'Arrest Faction Leadership',
      description: 'Security +5 now. Informal Economy -15...',
      immediate: { securityIndex: 5 },
      factionImpact: { informalEconomy: -15, lgChairmen: -8 },
      delayed: {                            // ← fully implemented
        weekOffset: 6,
        delta: { igr: -1.2 },
        eventText: `The agberos have made good on their threat...`,
      },
    },
  ],
}
```

**Delayed consequences fire correctly.** `firePendingDelayed()` runs every tick (gameLoop.ts:207) and applies the delta, faction impact, constituent impact, and follow-up event enqueuing. Confirmed by 601 passing tests including `delayeds`.

### 2.3 Godfather mechanic

**Fully implemented** through `godfatherEngine.ts`:
- **Fashemu arc**: 4 ordered asks at weeks 8/26/52/85 with phase transitions: dormant → active → warning → break → reconciled/dead. Each ask is a distinct type: contract → appointment → suppress → money.
- **General pool**: 12 asks (4 contract, 3 appointment, 3 suppress, 2 money) drawn randomly when weeks-since-last exceeds threshold.
- **Escalation**: refusal count tracks; at 2 → lgChairmen −8; at 3 → partyGodfathers −10, PC −15; beyond → weekly fed decline.
- **UI**: `GodfatherInbox.tsx` renders active message with accept/refuse buttons. `resolveGodfather()` handles stat/faction effects and phase transitions.

### 2.4 Elections / Deputy / Commissioners

| System | Status | Details |
|---|---|---|
| **Deputy** | **Fully implemented** | 7 profiles, pick 3 at start (via `DeputySelectionScreen.tsx`), resentment ticks from `tickDeputyResentment()`, consequence event fires at resentment ≥ 60 (character events: `deputy-consequence-politician` etc.) |
| **LGA elections** | **Real** | Fires automatically at week 86 via `resolveLGAElection()`. Result depends on lgChairmen faction score, fashemu phase, and campaign choice history. Result feeds `lgaBonus()` in vote calculation. |
| **Party primaries** | **Real** | Scenarios A/B/C derived from `stateFlags` set by earlier events. Scenario B has loss condition at week 176. Primary bonus feeds `calculateVoteShare()`. |
| **Campaign mode** | **Real** | Activates at week 195. Events with `category: 'election'` become eligible. `campaignDecisions[]` feeds `campaignModifier()`. |
| **General election** | **Real** | `calculateVoteShare()` at week 208. Aggregates base approval + primary + campaign + fashemu + NPC + LGA + faction endorsement bonuses. Re-election at >50%. |
| **Commissioners** | **Implemented** | 5 roles × 3 candidates in `commissionerCandidates.ts`. Appointed via `CabinetPanel.tsx` for 8 PC each. Works commissioner affects project speed + leakage; finance affects grants bonus; information affects media dampening. |
| **Second term** | **Implemented** | `currentTerm` field, re-election at week 208 triggers term 2, continues to week 416. `term2Events` deck (65 cards) activates. Term2 adjusts overhead formula. |

---

## 3. State & Flow

### 3.1 Win/lose conditions — real triggers

All in `checkGameOver()` (gameLoop.ts:614–806):

| Condition | Code trigger | Actually fires? |
|---|---|---|
| **Bankruptcy** | `cashReserve < 0` for 3 consecutive weeks, emergency loans exhausted | Yes. Emergency loans auto-fire for first 3 bankruptcies; 4th is game over |
| **Federal takeover** | `federalRelationship < -40` AND `infrastructureScore < 25` AND no active suspension | Yes |
| **Mass uprising** | `publicTrust < 15` AND `youthTension > 85` | Yes |
| **Impeachment** | Impeachment stage 1 + defy/concede → stage 2 + game over | Yes — but requires partyGodfathers < 10 AND week > 52 to trigger arc |
| **Primary loss** | Scenario B + week ≥ 176 + requirements not met → `primary-contest-loss` event → `stateFlags['primary-lost']` | Yes |
| **Term end (loss)** | Week > 208, vote ≤ 50%, term 1 → game over | Yes |
| **Second term end** | Week > 416, term 2 → game over (shows final legacy) | Yes |
| **Re-election** | Week > 208, vote > 50%, term 1 → continue to term 2 | Yes — sets `currentTerm: 2`, resets campaign state |

### 3.2 How many weeks can actually be played

**All 208 (term 1) + 208 (term 2) = 416 weeks.** Content exists for every phase:

- **Weeks 1–52**: Routine events (week-gated, expire by 150), early triggered events, midgame events at weeks 60/78/104/130
- **Weeks 52–150**: routine pool available, chain events, Phase 4 arcs
- **Weeks 150–194**: routine events expire by 150 → empty pool → triggered events only (Phase 4 stomach infrastructure, assembly quorum)
- **Weeks 195–207**: campaign mode, campaign events (7), opponent attacks (3), finale chain (3)
- **Week 208**: election → term 2 or game over
- **Weeks 209–416 (term 2)**: 65 dedicated term2 events, Phase 4 arcs

The bottleneck is the **week 150–194 gap**: after all 13 routine events expire at `maxWeek: 150`, the random pool is empty unless triggered events fire. Triggered events with `triggerCondition` checks still fire (assembly-quorum-maneuver, stomach-infrastructure-pressure, etc.), but the weekly event cadence drops from ~1/week to ~0.3/week. This is intentional (campaign era fills some of it) but the mid-game can feel quiet.

### 3.3 Save system

**Fully working.** `persistence.ts`:
- Serializes via `toSerializable()`: strips activeEvent/eventQueue → stores IDs only
- Deserializes via `fromSerializable()`: merges with STARTING_STATE defaults for missing fields
- Migration chain: v1→v2, v2→v3, v3→v4 (`currentTerm: 1`)
- `SAVE_VERSION = 4` in `version.ts`
- Autosaves on every state change via `useGameStore.subscribe()` (500ms debounce)
- `loadGame()` returns `null` if no save or parse fails
- `hasSavedGame()` + `clearSave()` for UI detection/reset

---

## 4. The Honest Gaps

### 4.1 Defined in types but NOT implemented

| Thing | Where defined | Status |
|---|---|---|
| `world_bank` / `bond_issuance` / `federal_govt` loans | `debtEngine.ts:3` — `LOAN_TERMS` fully defined | **No trigger.** `takeLoan()` exists but nothing calls it. Only `emergencyBridgeLoan()` fires automatically. A Finance Commissioner has no "take a loan" action. |
| `offCycleElection` field | `types.ts:367` | **Never set.** Reserved for litigation-won path; no event currently sets it. |
| `federalCharacterAppointment` event | `political.ts` — card exists | Untested in play — may work but depends on trigger conditions. |
| `llm_generated` headlines via API | `App.tsx:83–108` | Wired but requires an LLM API key. Falls back silently to generated headline text. |

### 4.2 The single biggest missing thing

**No strategic "dashboard" view of your choices.** The game gives you event cards one at a time with short-term stat deltas, but there is no way to see:
- What your projected revenue/expenditure will be in 10 weeks (no forecasting UI)
- Which of your initiatives are active and how far along
- What your faction score changes will look like next quarter

The `BudgetPanel.tsx` exists but shows only the current week's static numbers. The player cannot see "if I raise IGR by 4bn, my bankruptcy clock extends by X weeks." The game forces intuitive play rather than strategic planning.

**Second biggest gap:** The week 150–194 content gap. The `routineEvents` all have `maxWeek: 150`. After that, only triggered events fire. The `campaignEraEvents` (7 cards) are election-specific. The `finaleEvents` (3 cards) cover weeks 205–207. That's 45 weeks where the random pool is almost empty. Phase 4 events (`assembly-quorum-maneuver`, `stomach-infrastructure-pressure`, `rally-funding-demand`) are recurring and fill some gaps, but the cadence drops noticeably.

### 4.3 Where it gets repetitive or shallow

1. **Event body text repeats.** The `routineEvents` pool has 13 cards. By week 100 you've seen each 5–8 times (they're recurring with `cooldownWeeks: 18`). The body text is identical each time.

2. **Choice structure is formulaic.** Most event cards follow the same pattern: choice A (safe, small stat impact), choice B (risky, larger stat impact), choice C (political/faction play). After 30+ events the player can predict the choice structure before reading.

3. **No long-term project pipeline.** Capital projects are launched by events — you can't proactively say "I want to build a BRT corridor in Lekki." Projects only appear when the right event card fires.

4. **Events are independent.** Outside of explicit chain events (`followUpEventId`), no event references past choices. The `stateFlags` system exists for this but only ~15 cards use it.

5. **Commissioners are set-and-forget.** You appoint 5 commissioners once and never revisit them (unless a `commissioner-loyalty-test` event fires). There's no cabinet reshuffle mechanic, no performance review.

6. **Deputy resentment is invisible until it's critical.** The UI shows a numeric resentment value, but there's no "tell" for which actions trigger it until an event fires and you see the consequence.

7. **NPCs are passive.** NPCs accumulate pressure and fire events, but you can't proactively meet with them, make deals, or change their trajectory outside of event choices.

### 4.4 Honest summary

The game is **playable start-to-finish across 416 weeks** with real budget pressure, real consequences, real game-over states, and real re-election mechanics. The event system (242 cards) covers the full arc from handover to second-term legacy. Delayed consequences, faction drift, NPC escalation, and all four Phase 4 arcs work correctly.

The shallowness is in **repetitive content** (routine events recycle 13 cards across 150 weeks), **lack of player agency outside events** (no proactive project pipeline, no commissioner management, no loan UI), and **a mid-game content gap** (weeks 150–194).

A live LLM integration for headline enrichment exists but is optional. The strategic planning tools (budget forecasting, initiative tracker visualization) are missing entirely — the player reacts week-to-week rather than planning quarter-to-quarter.

**Verdict**: A complete single-player governance sim with real mechanical depth but a narrow interaction model. The core loop (event → choose → see consequence → tick) works for 416 weeks. The replayability comes from 3 archetypes × 3 NPC rolls × event variance, not from strategic depth.
