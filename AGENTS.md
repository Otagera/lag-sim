# AGENTS.md — Lagos Governor Sim

> Read this before touching code. See `README.md` for gameplay docs. Full reference in `docs/`.

```bash
npm run dev          # starts BOTH Vite dev server (client/:5173) + Rust server (server/:3000) via concurrently
npm run test         # all tests green (proxied from root to client/)
npm run build        # TypeScript + Vite build (proxied from root to client/)
npm run test:e2e     # Playwright e2e audit (proxied from root to client/)
# Alternatively, cd client/ or server/ and use npm/cargo directly there
```

**Node ≥ 22.12.0 required.** Vite pinned to v6 (not v8) due to Coolify/nixpacks constraint.

---

## Deploy Pipeline

```
git push → GH Actions (paths-filter: only if server/** changed)
  → build + push to ghcr.io/$OWNER/lag-sim-server:latest
  → curl Coolify webhook (Bearer token)
  → Coolify pulls pre-built image → restart container
```

The server image is **pre-built on GitHub runners**. Coolify never compiles Rust.

**Secrets required (GH repo → Settings → Secrets and variables → Actions):**

| Secret | Value |
|---|---|
| `COOLIFY_WEBHOOK_URL` | Coolify app → Webhooks tab → Deploy Webhook |
| `COOLIFY_TOKEN` | Coolify → Profile → API Tokens (scope: deploy) |

`GITHUB_TOKEN` is automatic — no secret needed for pushing to GHCR.

**After first deploy:** make `lag-sim-server` package public at `github.com/settings/packages` so Coolify can pull without auth.

**Forced rebuild:** `workflow_dispatch` input `force_all: true` from GH Actions UI.

---

## Coolify Reconfiguration

After the monorepo restructure:

| Change | Detail |
|---|---|
| Deploy type | Docker Compose → `docker-compose.prod.yml` (single stack — Postgres + server + client) |
| Client | No longer a separate nixpacks service. Built from `client/Dockerfile` during Coolify deploy (fast — seconds). |
| Server | Pulls pre-built ghcr image (slow Rust compile happens on GH runners). |
| Env vars | `SERVER_IMAGE`, `POSTGRES_PASSWORD`, `CORS_ORIGIN`, `VITE_ANALYTICS_URL` — set in Coolify compose service. |

### Environment Variable Reference

| Variable | Set in | Required | Purpose |
|---|---|---|---|
| `COOLIFY_WEBHOOK_URL` | GH repo secrets | yes | Triggers Coolify deploy after server image build |
| `COOLIFY_TOKEN` | GH repo secrets | yes | Bearer token for Coolify webhook |
| `SERVER_IMAGE` | Coolify env | yes | Full ghcr tag, e.g. `ghcr.io/your-org/lag-sim-server:latest` |
| `POSTGRES_PASSWORD` | Coolify env | yes | DB password (used by both `db` and `server`) |
| `CORS_ORIGIN` | Coolify env | yes | Client origin for CORS, e.g. `https://lag-sim.example.com` |
| `VITE_ANALYTICS_URL` | Coolify env | no | Defaults to `/api/v1/analytics/event` (nginx proxies `/api/` to server) |
| `VITE_SERVER_URL` | Coolify env | no | Optional server base URL override; defaults to empty (relative to origin) |

---

## Local Dev

```bash
docker compose up    # builds + runs Postgres + server on :3000
cd server && cargo run  # or the binary directly
```

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
