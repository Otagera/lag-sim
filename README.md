# Lagos Governor Sim

> Everyone thinks Lagos is easy to fix. This game lets them try.

A browser-based governance simulation set in Lagos, Nigeria. You are Governor for a 4-year term (208 weeks). The game is **decision-driven** — think Frostpunk, not SimCity. No map, no tiles, no real-time simulation. You make choices from event cards, watch stats cascade weeks later, and deal with the political economy of a state that has its own immune system.

**Tech:** TypeScript · React · Zustand · Tailwind CSS · Vite · Vitest  
**Runs:** Entirely client-side. No backend.

---

## Getting Started

```bash
npm install
npm run dev          # dev server at localhost:5173
npm run build        # production build
npx vitest run       # full test suite (475 tests)
```

**Node requirement:** ≥ 22.12.0. The project uses Vite 6 (not 8) due to Node compatibility constraints on Coolify's nixpacks (see build notes in AGENTS.md).

---

## How the Game Works

### The Core Loop

Each week:
1. Revenue flows in (PAYE, FAAC, LUC, grants, MDA fees)
2. Expenditure flows out (personnel, debt, overheads, subventions, contractors)
3. Background drags apply (ghost regen, procurement leakage, FAAC variance)
4. An event card appears. You choose. Consequences fire immediately or weeks later.
5. Factions shift. Stats drift. Crises compound.

After 208 weeks, an election determines your legacy.

### Starting Archetypes

| Archetype | Strength | Weakness |
|---|---|---|
| Technocrat | Cash 65, Infra 62 | PC 0, Party 30 |
| Loyalist | PC 180, Party 90 | Trust 35, Corruption 50 |
| Outsider | Trust 75, Civil Society 80 | Cash 25, Party 20 |

---

## Stats Reference

### What Each Stat Does

| Stat | Key Effects | Danger Zone |
|---|---|---|
| `cashReserve` (₦bn) | Enables spending choices; below 0 triggers emergency loan | < 0 for 3 weeks = bankruptcy game-over |
| `publicTrust` (0–100) | Drifts toward constituency average; low = riot risk | < 15 with youthTension > 85 = mass uprising |
| `politicalCapital` (0–200) | Spent on high-value choices; limited resource | < 20 = many choices unavailable |
| `infrastructureScore` (0–100) | Drives PAYE revenue; decays 0.3/week passively | < 25 with bad federal relation = takeover |
| `federalRelationship` (-50–50) | Multiplies FAAC transfers; negative = federal hostility | < -40 with infra < 25 = federal takeover |
| `corruptionPressure` (15–80) | Triggers EFCC events, grant freezes, capital flight | > 68 = EFCC investigation; > 75 for 3 wks = grant freeze |
| `youthTension` (0–100) | > 70 activates riot mode (replaces normal events) | > 85 with trust < 15 = game over |
| `ghostWorkerRate` (0.0–∞) | Inflates personnel costs each week | > 0.14 = ghost worker crisis event fires |
| `securityIndex` (0–100) | Feeds into PAYE; below 40 triggers deputy resentment | |
| `igr` (₦bn/wk) | Base revenue multiplier (influenced by infra + security) | |
| `debtStock` | Grows with loans; affects weekly interest + repayment | |

### Stats You Rarely See (but Matter)

| Stat | Purpose |
|---|---|
| `civilServiceReformScore` | Tracks reform progress; unlocked by ghost worker purge events |
| `baseOverheads` | Persistent overhead creep added by godfather compliance |
| `subventionCutRate` | Percentage cut to subvention expenditure (0–1) |
| `capitalEfficiency` | Multiplier on capital project build speed |
| `landUseChargeEnforcement` | Multiplier on LUC revenue (1.0–3.0) |
| `grantsCompliance` | Multiplier on grant income (0.6–1.0); zeroed permanently after 3 freezes |
| `contractorBacklog` | Outstanding ₦bn owed to contractors; 15%/week paid, capped at ₦4bn |
| `weeklyDebtRepayment` / `weeklyDebtInterest` | Derived from active loans |

---

## Effect Levers: What Causes What

Use this section to find the source of a problem or pull a specific lever.

### Revenue is falling — what's driving it?

| Symptom | Root Cause | Fix |
|---|---|---|
| PAYE drops steadily | `infrastructureScore` decaying (−0.3/wk) | Capital projects, infrastructure events, resist stomach-infrastructure choice |
| PAYE drops sharply | `youthTension` rising | Resolve riots, youth-oriented social events |
| FAAC drops to near-zero | `federalRelationship` < −30 | Cooperate with federal delegation, avoid defying Abuja |
| FAAC variance spike | Wet season (weeks 5–18 of each year) OR federal election year | Ride it out; avoid loans |
| Grants drop to 0 | `corruptionPressure` > 75 for 3+ consecutive weeks | Reduce corruption, cooperate with EFCC |
| Grants permanently zero | `grantFreezeCount` reached 3 | Irreversible; `grantsCompliance` = 0 forever |
| MDA fees shrink | `infrastructureScore` low + `securityIndex` low | Dual infrastructure/security investment |
| LUC revenue flat | `landUseChargeEnforcement` = 1.0 | Trigger LUC audit initiative, PAYE enforcement events |

### Expenditure is too high — what's driving it?

| Symptom | Root Cause | Fix |
|---|---|---|
| Personnel costs high | `ghostWorkerRate` elevated (0.09 default, rises over time) | Ghost worker purge initiative |
| Overheads bloated | `godfatherComplianceCount` high (+0.3/wk per compliance) | Refuse godfather asks (but watch resentment) |
| Overheads also creep up | `dragEngine` overhead creep: +0.1/wk if `corruptionPressure > 50` | Keep corruption under control |
| Debt repayments crushing | Too many loans taken | Emergency loans especially — 35%+ APR escalates |
| Subventions high | Default 3.9bn/wk; `subventionCutRate = 0` | Pass subvention cut event choices |
| Contractor backlog grows | Capital projects launched without cash buffer | Stagger project launches |

### Trust is falling — what's driving it?

| Symptom | Root Cause | Fix |
|---|---|---|
| Slow trust drift | Constituency average is below current trust (10% pull/wk) | Improve constituency approval scores |
| Fast trust drop | Hostile youth-organiser NPC active (−1.5 youthTension/wk affects indirectly) | Manage NPC relationship |
| Trust drop on events | Godfather compliance choices; riot-mode curfew choices | Review delayed consequences |
| Emergency suspension | Passive −1/wk during suspension | Survive or win legal challenge early |

### Political capital is gone — why?

| Cause | Weekly drain | Notes |
|---|---|---|
| Assembly rebellion choices | −20 to −30 per event | |
| Federal election year | Costs scaled ×1.2 | Weeks 1–52 and 157–208 |
| Legal challenges during suspension | −30 per challenge | |
| Hostile insider NPC | −1 PC/wk | Relationship < 30 |

### Factions are hostile — who moves them?

| Faction | Positive levers | Negative levers |
|---|---|---|
| `partyGodfathers` | Comply with Fashemu asks; buy-off rebellion | Refuse asks; NPC insider pressure; suspension passive drain |
| `lgChairmen` | LGA election results; loyalty choices | Dissolution events; biometric audit; suspension |
| `civilSocietyMedia` | EFCC cooperation; reform choices; oppose stomach-infra | Curfew choices; challenge EFCC; quiet settlements |
| `businessCommunity` | Infrastructure investment; biometric audit (clean state signal) | Makoko demolition; high corruption |
| `informalEconomy` | Market-friendly choices; sanctuary message | Curfew; security surge in riot mode |
| `federalGovt` | Cooperate with Abuja; EFCC cooperation | Publicly defy emergency; challenge EFCC |

---

## Decision Chains: Multi-Layer Consequences

The game has several **decision chains** — choices that trigger delayed or conditional events weeks later. Here is the full map:

### Ghost Worker Purge Chain
```
ghostWorkerRate > 0.14
  → ghost-worker-crisis-alert [choose path]
    ├── Biometric Audit (₦8bn, 12 wks)
    │     → ghost-worker-biometric-success [ghostWorkerRate -40%]
    └── Committee Audit (8 wks)
          → [week+4] ghost-worker-committee-stall
                ├── Pay allowances → full investigation → ghost-worker-committee-success [-20%]
                └── Refuse → ghost-workers shift (+2% now) → ghost-worker-committee-success [-20% partial]
```

### Federal Emergency / Suspension Chain
```
federalRelationship < -25 AND youthTension > 65
  → federal-emergency-threat [choose response]
    ├── Cooperate → relationship +10, trust -3, suspension avoided
    └── Defy → [week+2] federal-emergency-declared
          → sets emergencySuspensionWeeks (3 or 5)
          → tickSuspension each week:
              passive: cash -1.5, trust -1, godfathers -2, lgChairmen -2
              enqueues: sole-administrator-act-N
              player can: file-legal-challenge (PC -30)
                → legal-challenge-filed: true
                → if partyGodfathers > 30 AND trust > 40:
                    suspension-legal-challenge-success → end early (+PC, +trust)
                → else:
                    suspension-legal-challenge-fail → lose PC, continue
          → natural end: emergency-ever-suspended: true (no future federal game-over)
```

### Election Petition / Litigation Chain
```
week 2-8 AND corruptionPressure > 45
  → election-petition-filed [choose response]
    ├── Negotiate withdrawal → petition-avoided, no litigation (cash/PC cost)
    └── Contest aggressively → setLitigationTimer: 20, litigationActive: true
          → each week: litigationTimer -1
          → litigationTimer ≤ 10 AND active:
              → tribunal-midpoint-hearing [hearing choice]
                  ├── Aggressive → PC -20, improves odds
                  ├── Concede minor points → no cost
                  └── Settle → setLitigationTimer: 0, litigation ends
          → litigationTimer hits 0:
              → supreme-court-ruling [outcome event]
                  ├── Upheld → PC +80, trust +10, litigation-won
                  └── Rerun ordered → PC -40, trust -10, litigation-lost
```

### Assembly Removal / Impeachment Chain
```
partyGodfathers < 10 AND week > 52
  → removal-resolution-reading [queued in gameLoop]
    → "Fight It" → [followUpEventId] removal-committee-stage
      → "Stonewall" → [followUpEventId] removal-floor-vote
        → "Accept" or "Defy" → game over (impeachmentStage = 2)
    → "Accept the Outcome" (at any stage) → game over

Recovery: partyGodfathers >= 20 clears the arc and the queue
```

### Populist Shield Chain
```
assembly-quorum-maneuver → invoke-populist-shield
  → sets populist-shield-invoked: true
  → next tick (phase4Events checked first in ALL_EVENTS):
      if infra > 60 AND trust > 55:
        → populist-shield-success [+trust, +PC, +godfathers]
      else:
        → populist-shield-fail [-trust, -PC] → chains to removal-resolution-reading
```

### Fashemu Arc Chain
```
Week 8/26/52/85: fashemuAskIndex gates draw Fashemu asks (ordered)
  compliance → godfatherComplianceCount++, fashemuRelationship+
  refusal → refusals track

Transitions (weekly in applyFashemuPhaseTransition):
  dormant → active (2+ compliances)
  active → warning (3+ refusals)
  warning → break (4+ refusals)
  break → reconciled (EFCC cooperation timeline entry found)
  any → dead (low-probability after week 130)

After all 4 Fashemu asks: general godfather pool activates
```

### Civil Service / Union Chains (chains.ts)
```
ghost-purge-aggressive → union-court-injunction
ghost-purge-quiet (week ≥ 20) → union-work-to-rule
Fashemu's commissioner appointed → works-tender-scandal (week ≥ 30)
Makoko demolished → makoko-land-grab-exposed
```

---

## Crises and Cascades

### Riot Mode
- Trigger: `youthTension > 70`
- Effect: normal event pool replaced by `category: 'riot'` events only
- Available riots: curfew · security surge · youth parley
- Exit: resolve youthTension to ≤ 70

### Grant Freeze
- Trigger: `corruptionPressure > 75` for 3+ consecutive weeks
- Effect: grants = 0 for 8 weeks; `grantFreezeCount++`
- Permanent: at `grantFreezeCount >= 3`, `grantsCompliance = 0` forever

### Emergency Bridge Loan Spiral
- Trigger: `cashReserve < 0`
- First loan: 35% APR; each subsequent loan escalates APR
- Cap: 3 emergency loans max (from `emergencyLoansTaken`)

### Budget Crunch Season
- Trigger: December–January (weeks ~28–35 of each game year)
- Effect: additional FAAC penalty on top of base

### Federal Election Year
- Trigger: years 1 and 4 (weeks 1–52 and 157–208)
- Effect: PC cost scale ×1.2; FAAC variance elevated; federal relationship drifts -0.3/wk

---

## Game Over Conditions

| Condition | Trigger |
|---|---|
| Bankruptcy | `cashReserve < 0` for 3 consecutive weeks |
| Federal Takeover | `federalRelationship < -40` AND `infrastructureScore < 25` AND not suspended |
| Mass Uprising | `publicTrust < 15` AND `youthTension > 85` |
| Party Removal | `partyGodfathers < 10` AND week > 52, AND removal arc completes |
| Term End | week > 208 → election result → LegacyScreen |

> **Note:** Federal Takeover is suppressed while `emergencySuspensionWeeks > 0` — the suspension IS the federal intervention.

---

## Seasonal Calendar

Engine truth is `state.week` (1–208). Dates are display-only.

```
START_DATE = 2027-05-29
Week 1   = May 29, 2027
Week 52  = May 27, 2028 (leap year)
Week 208 = May 28, 2031
```

| Season | Weeks in year | Modifier |
|---|---|---|
| Wet season | ~5–18 | Flood events 3× weight; FAAC variance 1.5× |
| Federal election year | Year 1 + Year 4 | PC costs ×1.2; FAAC drift -0.3/wk |
| Budget crunch | ~28–35 | FAAC base penalty +0.2 |

---

## NPC System

Three NPC slots (npc1/npc2/npc3). Each activates when its `activationCondition` is met. Passive effects apply **every tick** based on relationship tier:

| Archetype | Hostile effect (rel < 30) | Ally effect (rel ≥ 65) |
|---|---|---|
| journalist | corruptionPressure +0.5/wk | corruptionPressure -0.3/wk |
| youth-organiser | youthTension +1.5/wk | youthTension -0.5, publicTrust +0.2/wk |
| insider | politicalCapital -1/wk | politicalCapital +0.5/wk |
| union-leader | civilServiceReformScore -0.3/wk | infrastructureScore +0.1/wk |
| opposition-senator | federalRelationship -0.5/wk | federalRelationship +0.3/wk |
| diaspora-activist | publicTrust -0.3/wk | publicTrust +0.2/wk |
| oba-liaison | publicTrust -0.2/wk | publicTrust +0.2/wk |
| business-mogul | igr -0.1/wk | igr +0.1/wk |

When pressure ≥ 40: escalation event fires from that archetype's deck.

---

## Commissioner Effects

| Role | Effect |
|---|---|
| Works (godfather pick) | procurementLeakage +5%; project cost overruns |
| Works (high competence) | effectiveProjectProgress × (1 + competence/100 × 0.1) |
| Finance (high competence) | grants += 0.8 × min(1, grantsCompliance + competence/100 × 0.15) |
| Information (high loyalty) | hostile media/civil-society events drawn less frequently |

---

## Revenue Formula (per week)

```
PAYE      = 19.6 × (0.3×base + 0.3×infraScore + 0.2×securityIndex + 0.2×(100-youthTension)) / 100
MDA       = 5.9 × (0.4×base + 0.4×infraScore + 0.2×securityIndex) / 100
LUC       = 0.3 × landUseChargeEnforcement
Other     = 2.1 × (0.5 + 0.5×infraScore/100)
FAAC      = 8.7 × federalMultiplier (0 to 1, drops sharply below -15 relationship)
Grants    = 0.8 × grantsCompliance  (0 if freeze active, 0 if compliance zeroed)
```

---

## Lagos Data Reference

| Metric | Real Value |
|---|---|
| Population | 15–22 million |
| Formal sector workers | ~3 million |
| Youth unemployment | ~38% |
| Roads in poor condition | ~40% of 9,000km |
| Civil servants | ~80,000 |
| Annual budget | ₦2.2–2.8 trillion |
| Annual IGR | ~₦660bn |
| Debt stock | ~₦1.4 trillion |
| Corruption drag (est.) | 20–40% of project costs |

---

## What Is Not Built (and Should Not Be)

- No map or tiles
- No multiplayer / backend
- No audio
- No authentication
- No save-to-server (localStorage only)
- No second-term arc (placeholder only)

---

## For Developers and Contributors

See **AGENTS.md** for the technical contract: engine patterns, type shapes, tick order, event card rules, and the verification checklist. That file is kept short and agent-focused.

### Adding an Event Card

1. Add to the relevant file in `src/data/events/`
2. Use `triggerCondition: () => false` for queue-only events (completions, stall events)
3. No choice should be obviously correct
4. Body text must have Lagos texture — reference real places and dynamics
5. Every `immediate` field uses `StatDelta` key names (not `statDelta`, not `amount`)
6. Run `npx vitest run` — all 475 tests must stay green

### Adding a New Stat

Consult before doing this — new stats affect `applyDelta`, `BOUNDS` in `statEngine.ts`, `simulation.test.ts`, and `startingState.ts`. See AGENTS.md for the pattern.

### Debugging a Specific Effect

Use the DevPanel (visible only in `import.meta.env.DEV`, bottom-right). Set strategy, seed, and week count to simulate forward deterministically and observe the stat diff.
