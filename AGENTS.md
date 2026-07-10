# AGENTS.md — Lagos Governor Sim

> Read this before touching code. See `README.md` for gameplay docs. Full reference in `docs/`.

```bash
npm run dev          # dev server (proxied from root to client/)
npm run test         # all tests green (proxied from root to client/)
npm run build        # TypeScript + Vite build (proxied from root to client/)
npm run test:e2e     # Playwright e2e audit (proxied from root to client/)
# Alternatively, cd client/ and use npm/npx directly there
```

**Server (backend stack):**
```bash
docker compose up    # builds + runs Postgres + Rust server on :3000
cd server && cargo run  # or just the server binary directly
```

**Node ≥ 22.12.0 required.** Vite pinned to v6 (not v8) due to Coolify/nixpacks constraint.

---

## Architecture — docs/architecture.md

Every engine function is `(state: GameState, ...) => GameState`. No mutation. All stat changes through `applyDelta()` in statEngine.ts. Never write `state.stats.X += Y`.

### BOUNDS table

| Stat | Min | Max |
|---|---|---|
| publicTrust | 0 | 100 |
| infrastructureScore | 0 | 100 |
| securityIndex | 0 | 100 |
| politicalCapital | 0 | 200 |
| corruptionPressure | 15 | 80 |
| federalRelationship | -50 | 50 |
| cashReserve | −∞ | ∞ |

### 22-step weekly tick (gameLoop.ts)

1. Increment week
2. Revenue + expenditure → cashReserve
3. Drag (FAAC variance, ghost regen, overhead creep, procurement leakage)
4. Loan repayments + debt reduction
5. Process projects
6. Fire delayed consequences
7. Faction drift
8. PublicTrust drift toward constituency-weighted avg (10%/wk)
9. Deputy resentment
10. Activate NPCs → tick pressure → apply goal effects → check escalation
11. Tick initiative → tick suspension → tick litigation
12. LGA election (wk 86) → campaign mode (wk 195)
13. Check game over
14. Draw event / godfather ask
15. Infrastructure decay (-0.5/wk base + extra above 70) + youthTension +0.4/wk

---

## Key Types — docs/architecture.md

**Choice:** `{ id, label, description, immediate: StatDelta, factionImpact?, delayed?, followUpEventId?, politicalCapitalCost?, corruptionTrigger?, setFlags?, launchInitiative?, launchProject?, resentmentDelta?, npcImpact?, setSuspensionWeeks?, setLitigationTimer?, diminishingReturns? }`

**DelayedConsequence:** `{ weekOffset, delta: StatDelta, factionImpact?, eventText, followUpEventId?, constituencyImpact? }`

**EventCard pitfalls:**
- No `oneTime`. Recurring = `isRecurring: true`. One-shot = omit.
- `eventQueue` pushes are **card objects**, not id strings.
- Queue-only events: `triggerCondition: () => false`.
- `maxTotalFirings` counts via `resolvedEvents.filter(...)`.

**ALL_EVENTS** ordering: `phase4Events` first. `Array.find` over triggered events means first matching wins.

---

## State Fields — docs/state-reference.md | game-over.md

Core fields in `client/src/state/types.ts` (378 lines). Starting defaults in `client/src/data/startingState.ts`. All new fields get defaults there and are auto-merged by `{ ...STARTING_STATE, ...rest }` in persistence.ts.

**Game over:** Bankruptcy (3 wks < 0 cash) · Federal takeover (fedRel < -40 AND infra < 25 AND not suspended) · Mass uprising (trust < 15 AND youthTension > 85) · Party removal (godfathers < 10, wk > 52, arc completes) · Primary defeat (wk 176, scenario B) · Term end (wk 208/416, vote ≤ 50%).

---

## Event Cards — docs/event-rules.md

1. 2–4 choices per card
2. ≥1 choice moves two factions in opposite directions
3. ≥1 choice has a `delayed` consequence
4. No obviously correct choice
5. Lagos texture in body text (real places, real dynamics)
6. Jurisdiction: LAHA (state assembly), not Federal Senate
7. ~160 cards across 18 files

**Initiatives:** Entry in `client/src/data/initiatives.ts`; `launchInitiative` on a Choice; `tickInitiative` enqueues completion; completion events: `triggerCondition: () => false`.

---

## Docs Reference

| File | What it covers |
|---|---|
| `docs/architecture.md` | Pure functions, BOUNDS, tick order, key types, project structure |
| `docs/state-reference.md` | All GameState fields, starting defaults, archetype modifiers |
| `docs/event-rules.md` | Card writing rules, ALL_EVENTS ordering, initiatives, event inventory |
| `docs/game-over.md` | All game over conditions, recovery paths, term transitions |
| `docs/revenue-expenditure.md` | Revenue formulas, expenditure lines, deficit math, key levers |
| `docs/npc-system.md` | NPC archetypes, passive effects, escalation deck, activation |
| `docs/commissioners.md` | Roles, effects, candidates, godfather dynamics |
| `docs/season-system.md` | Season modifier, federal election year, budget crunch, wet season |
| `docs/news-engine.md` | evaluateNews, evaluateSkipNews, LLM news system |
| `docs/legacy-system.md` | Decision ranking, valedictory prompt, flag labels |
| `docs/winning-strategy.md` | Benchmark guide, WINNING_STRATEGY config, tuning principles |
| `docs/design.md` | Federal Gazette design tokens, typography, color system |

---

## Questions Before Major Decisions

- Adding a new major stat → ask first (BOUNDS, simulation.test.ts, startingState.ts, revenueEngine, expenditureEngine)
- Changing weekly tick order → ask first (game feel, test assumptions)
- Adding real Nigerian political names → confirm approach (sensitivity)
- Adding backend → confirm new phase first

---

## Election Season (MVP) — Implemented, client/src/ui/

| Work Item | Files |
|---|---|
| INEC watermark CSS overlay | `src/ui/ElectionWatermark.tsx`, rendered in `App.tsx` when `inCampaignMode` |
| Campaign Tracker panel (decisions, attacks, countdown, polling) | `src/ui/CampaignTracker.tsx`, added as dock tab `election` when `inCampaignMode` |
| Polling projection widget | Vote share in `Dashboard.tsx` and in CampaignTracker panel |
| Campaign event badge | `ELECTION '27` chip in `EventCard.tsx` when `inCampaignMode` |
| Election-day finale polish | LIVE ELECTION COVERAGE banner / ELECTION SEASON 2027 banner for events prefixed `finale-` |

### Deferred to Phase 2 / Post-MVP
- Full-blown campaign mini-game (e.g., choosing rally locations on a map)
- Opponent AI that responds dynamically to player choices
- Televised debate mini-game beyond the single finale-debate card
