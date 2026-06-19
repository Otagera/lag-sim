# AGENT.md — Lagos Governor Sim
> Read this file before touching any code in this project.

---

## What This Project Is

A browser-based governance simulation game set in Lagos, Nigeria. The player is Governor of Lagos State. The game is **decision-driven** — think Frostpunk, not SimCity. No tiles, no real-time simulation. The player makes choices from event cards, watches stats change, and deals with delayed consequences weeks later.

**The thesis:** Everyone thinks Lagos is easy to fix. This game lets them try.

**Tech stack:** TypeScript, React, Zustand, Tailwind CSS, Vite. Runs entirely client-side. No backend in Phase 1.

---

## Project Structure

```
/src
  /engine
    gameLoop.ts         — weekly tick orchestrator
    statEngine.ts       — pure stat mutation functions
    budgetEngine.ts     — (deprecated) replaced by revenueEngine + expenditureEngine
    revenueEngine.ts    — calculateWeeklyRevenue: PAYE, MDA, LUC, FAAC, grants
    expenditureEngine.ts— calculateWeeklyExpenditure: personnel, debt, overheads, subventions
    debtEngine.ts       — takeLoan, repayment scheduling, interest accrual
    dragEngine.ts       — hidden drag: procurement leakage, ghost regen, overhead creep, FAAC variance
    projectEngine.ts    — capital project pipeline, stall logic, completion events
    factionEngine.ts    — faction mood updates
    eventEngine.ts      — card drawing, condition checks, delay queue
    corruptionEngine.ts — corruption pressure mechanics
  /data
    /events             — EventCard definitions, one file per category
      transport.ts
      infrastructure.ts
      political.ts
      crisis.ts
      economy.ts
    factions.ts         — faction definitions and base values
    constituencies.ts   — zone definitions and primary concerns
    startingState.ts    — initial game state values
  /state
    gameStore.ts        — Zustand store, single source of truth
    types.ts            — ALL TypeScript types live here
  /ui
    Dashboard.tsx       — master stats view
    EventCard.tsx       — decision card + choice buttons
    FactionPanel.tsx    — faction approval bars
    BudgetPanel.tsx     — weekly P&L breakdown
    PollPanel.tsx       — constituency approval ratings
    GodfatherInbox.tsx  — godfather message thread
  /hooks
    useGameLoop.ts      — drives the weekly tick
    useEventQueue.ts    — manages pending and delayed events
  App.tsx
```

---

## Core Types (types.ts — the source of truth)

Every engine function is built around these types. Do not deviate from them without updating this file and all consumers.

```typescript
// --- Stat Keys ---
export type StatKey =
  | 'igr'                  // weekly income in ₦bn (DERIVED: sum of all revenue lines)
  | 'cashReserve'          // total liquid funds in ₦bn
  | 'expenditure'          // weekly fixed costs in ₦bn (DERIVED: sum of all spending lines)
  | 'infrastructureScore'  // 0–100
  | 'publicTrust'          // 0–100 (percentage)
  | 'politicalCapital'     // 0–200 (spendable resource)
  | 'federalRelationship'  // -50 to +50
  | 'securityIndex'        // 0–100
  | 'corruptionPressure'   // 0–100 (percentage of budget lost)
  | 'youthTension'         // 0–100
  // Budget system stats (new):
  | 'ghostWorkerRate'          // 0.05–0.20. Passive creep upward. Resets on purge but regenerates.
  | 'contractorBacklog'        // ₦bn owed to contractors. Stalls projects if > ₦20bn.
  | 'debtStock'                // total outstanding debt in ₦bn
  | 'weeklyDebtRepayment'      // scheduled principal payment in ₦bn/wk
  | 'weeklyDebtInterest'       // interest payment in ₦bn/wk (derived from debtStock * rate)
  | 'landUseChargeEnforcement' // 0–3.0 multiplier. Starts at 1.0. Player can invest in enforcement.
  | 'grantsCompliance'         // 0–1.0. World Bank/donor conditions compliance. Starts 0.6.
  | 'civilServiceReformScore'  // 0–100. Slows ghost worker regen. Hard to build.
  | 'baseOverheads'            // tracks overhead creep in ₦bn/wk above floor
  | 'subventionCutRate'        // 0–0.4. Player can cut agency subventions. Has event consequences.
  | 'capitalEfficiency'        // 0–1.0 (derived: 1 - procurementLeakageRate). Shows in project completion.

export type StatDelta = Partial<Record<StatKey, number>>

// --- Factions ---
export type FactionKey =
  | 'businessCommunity'
  | 'informalEconomy'
  | 'partyGodfathers'
  | 'federalGovt'
  | 'civilSocietyMedia'
  | 'lgChairmen'

export type FactionDelta = Partial<Record<FactionKey, number>>

export type FactionState = Record<FactionKey, number> // -100 to +100

// --- Constituencies ---
export type ConstituencyKey =
  | 'lagosIsland'
  | 'victoriaIsland'
  | 'lekki'
  | 'surulere'
  | 'oshodi'
  | 'alimosho'
  | 'periphery'   // Badagry, Epe, Ikorodu combined
  | 'makoko'

export type ConstituencyApproval = Record<ConstituencyKey, number> // 0–100

// --- Revenue & Expenditure Breakdowns ---
export type RevenueBreakdown = {
  paye: number
  mda: number
  luc: number
  other: number
  faac: number
  grants: number
  total: number
}

export type ExpenditureBreakdown = {
  personnel: number
  debtInterest: number
  debtRepayment: number
  overheads: number
  subventions: number
  contractorPayment: number
  total: number
}

export type HiddenDrag = {
  procurementLeakage: number
  ghostRegenRate: number
  overheadCreep: number
  faacVariance: number
}

// --- Capital Projects ---
export type ProjectStatus = 'active' | 'stalled' | 'completed' | 'abandoned'

export type CapitalProject = {
  id: string
  name: string
  location: ConstituencyKey
  totalCost: number              // ₦bn
  weeklyDraw: number             // how much cash leaves per week
  totalSpent: number             // running total
  effectiveProgress: number      // 0–100. Degraded by procurement leakage.
  contractorId: string           // who's building it (Godfather connection possible)
  weeksRemaining: number
  status: ProjectStatus
  stalledReason?: 'backlog' | 'political' | 'flooding' | 'procurement_inquiry'
}

// --- Borrowing ---
export type LoanSource = 'domestic_bank' | 'world_bank' | 'bond_issuance' | 'federal_govt'

export type LoanTerms = {
  annualRate: number    // 0.18–0.22 for domestic, 0.03–0.05 for world bank, etc.
  tenorYears: number
  negotiationWeeks: number     // weeks before funds are available
  conditions?: string[]        // e.g. 'open_procurement_required' for world bank
}

export type Loan = {
  id: string
  source: LoanSource
  principal: number
  outstanding: number
  weeklyRepayment: number
  weeklyInterest: number
  disbursedOnWeek: number
  conditions: string[]
}

// --- Event Cards ---
export type DelayedConsequence = {
  weekOffset: number        // fires X weeks after choice is made
  delta: StatDelta
  factionImpact?: FactionDelta
  eventText: string         // narrative shown when it fires
  constituencyImpact?: Partial<ConstituencyApproval>
  followUpEventId?: string
}

export type Choice = {
  id: string
  label: string                          // short button label
  description: string                    // full choice explanation
  immediate: StatDelta
  factionImpact: FactionDelta
  constituencyImpact?: Partial<ConstituencyApproval>
  delayed?: DelayedConsequence
  followUpEventId?: string
  politicalCapitalCost?: number
  corruptionTrigger?: boolean
}

export type EventCard = {
  id: string
  week?: number                          // undefined = draw from pool
  triggerCondition?: (state: GameState) => boolean
  title: string
  body: string
  choices: Choice[]
  isRecurring?: boolean
  cooldownWeeks?: number
  weight?: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  category: 'transport' | 'infrastructure' | 'political' | 'crisis' | 'economy' | 'social'
}

// --- Pending Delayed Events ---
export type PendingEvent = {
  id: string
  firesOnWeek: number
  consequence: DelayedConsequence
  sourceEventTitle: string              // for player context
}

export type TimelineEntry = {
  week: number
  type: 'event' | 'delayed-consequence' | 'godfather' | 'milestone'
  title: string
  description: string
}

// --- Godfather ---
export type GodfatherMessage = {
  id: string
  week: number
  text: string
  ask: GodfatherAsk
}

export type GodfatherAsk = {
  type: 'contract' | 'appointment' | 'suppress' | 'money'
  description: string
  onAccept: StatDelta & { factionImpact?: FactionDelta }
  onRefuse: StatDelta & { factionImpact?: FactionDelta }
}

// --- Master Game State ---
export type GameState = {
  week: number
  stats: Record<StatKey, number>
  factions: FactionState
  constituencyApproval: ConstituencyApproval
  activeEvent: EventCard | null
  eventQueue: EventCard[]               // upcoming scheduled events
  pendingDelayed: PendingEvent[]        // delayed consequences waiting to fire
  resolvedEvents: string[]              // ids of completed events
  eventsResolvedThisWeek: number
  consecutiveBankruptWeeks: number
  eventCooldowns: Record<string, number>
  timeline: TimelineEntry[]
  godfatherMessages: GodfatherMessage[]
  godfatherRefusalCount: number
  activeGodfatherMessage: GodfatherMessage | null
  usedGodfatherAskIds: string[]
  lastGodfatherWeek: number
  // Budget system state
  activeLoans: Loan[]
  capitalProjects: CapitalProject[]
  contractorBacklog: number
  ghostWorkerRate: number
  faacVarianceAccumulated: number
  consecutiveDeficitWeeks: number
  lastWeekRevenue?: RevenueBreakdown
  lastWeekExpenditure?: ExpenditureBreakdown
  weeklyDebtRepayment: number
  weeklyDebtInterest: number
  baseOverheads: number
  godfatherComplianceCount: number
  // Game over fields
  isGameOver: boolean
  gameOverReason?: string
  mode: 'simple' | 'detailed'          // UI display mode
}
```

---

## Engine Rules (Do Not Break These)

### statEngine.ts
- All stat mutation must go through `applyDelta(state, delta): GameState`
- Stats have hard bounds — enforce them:
  - `publicTrust`: 0–100
  - `infrastructureScore`: 0–100
  - `securityIndex`: 0–100
  - `politicalCapital`: 0–200
  - `corruptionPressure`: 0–100
  - `federalRelationship`: -50 to +50
  - `cashReserve`: can go negative (triggers bankruptcy check)
  - `igr` and `expenditure`: cannot go below 0
- `applyDelta` must be a **pure function** — no side effects

### budgetEngine.ts
- (deprecated) Replaced by revenueEngine.ts + expenditureEngine.ts

### revenueEngine.ts
- `calculateWeeklyRevenue(state): RevenueBreakdown` — pure function
- Every revenue line is a formula driven by game stats, not a fixed number:
  - **PAYE** (base 19.6): driven by infrastructureScore (0.3×), securityIndex (0.2×), youthTension (0.2×), plus 0.3× base
  - **MDA** (base 5.9): driven by infrastructureScore (0.4×), securityIndex (0.2×), plus 0.4× base
  - **Land Use Charge** (base 0.3): multiplied by `landUseChargeEnforcement` stat (1.0–3.0)
  - **Other** (base 2.1): half linked to infrastructureScore, half fixed
  - **FAAC** (base 8.7): reduced by federalRelationship < 0 — 0.9× at -15, 0.7× at -30, 0.4× at -40, 0.1× below
  - **Grants** (base 0.8): multiplied by `grantsCompliance` stat (0.6–1.0)

### expenditureEngine.ts
- `calculateWeeklyExpenditure(state): ExpenditureBreakdown` — pure function
- Every expense line has structural pressure:
  - **Personnel** (base 7.7): inflated by `ghostWorkerRate` × base (ghost worker drag)
  - **Debt interest**: derived from `weeklyDebtInterest` stat (tracks outstanding debt × rate)
  - **Debt repayment**: derived from `weeklyDebtRepayment` stat (scheduled principal)
  - **Overheads** (base 15.4): inflated by godfather compliance (`godfatherComplianceCount × 0.3`)
  - **Subventions** (base 3.9): reduced by `subventionCutRate` (0–0.4, player-controlled at event cost)
  - **Contractor payment**: 15% of backlog per week, capped at ₦4bn

### debtEngine.ts
- `takeLoan(state, amount, source): GameState` — adds debt stock, sets repayment schedule
- Loan sources have different terms:
  - `domestic_bank`: 18–22% rate, 3yr tenor, fast, no conditions
  - `world_bank`: 3–5% rate, 20yr tenor, slow (negotiationWeeks), requires `open_procurement`
  - `bond_issuance`: 15–18% rate, 7yr tenor, medium, public scrutiny
  - `federal_govt`: 0% rate, political cost (federalRelationship -10)
- Loan conditions create gameplay constraints (e.g., World Bank blocks godfather contracts)

### dragEngine.ts
- `calculateHiddenDrag(state, capitalSpend): HiddenDrag` — pure function
- Runs underneath every tick — player never sees raw numbers, only consequences:
  - **Procurement leakage**: 15% + (corruptionPressure / 100 × 25%) of capital spend. At 28% corruption: 22% leakage. At 60%: 30%.
  - **Ghost worker regen**: 0.001 × (1 − civilServiceReformScore / 100) per week. Slow drift upward after purge.
  - **Overhead creep**: ₦0.05bn/week passive growth. Every MDA inflates its overhead request each budget cycle.
  - **FAAC variance**: ±15% random walk each month. Logged as volatility event if swing > ₦2bn.

### projectEngine.ts
- Capital project pipeline management
- Projects draw `weeklyDraw` from cash reserve each week
- `effectiveProgress` degraded by procurement leakage — player pays for 100%, gets less
- Projects stall when: contractor backlog > ₦20bn, political event fires, flooding hits, procurement inquiry launched
- Stalled projects trigger constituency approval drops (half-finished road = political crisis)
- Completion events push infrastructureScore, igr bump, and constituency approval gains

### eventEngine.ts
- Each week: check `triggerCondition` on all unresolved events first
- Then draw from pool if no condition-triggered event fires
- Max 2 events per week
- After player chooses: apply `immediate` delta, queue `delayed` if present
- `pendingDelayed` is checked every week — fire if `week >= firesOnWeek`
- Recurring events (flooding) fire every year (week 26 and 52 range) with severity variance

### factionEngine.ts
- Faction values drift toward neutral (50) by 2 points per week if no events affect them
- Faction below 20 = hostile (triggers passive negative effects)
- Faction above 80 = ally (triggers passive positive effects)
- Godfather faction is special: it does not drift. It stays where you left it.

### corruptionEngine.ts
- `corruptionPressure` rises by 0.5 per week passively
- Rises by additional amount when godfather asks are accepted
- Can be reduced by audit events (cost: Political Capital)
- Cannot go below 15 (endemic baseline) or above 80 (system collapse)

### gameLoop.ts (weekly tick order)
1. Increment week
2. Run `revenueEngine.calculateWeeklyRevenue` + `expenditureEngine.calculateWeeklyExpenditure`
3. Calculate hidden drag via `dragEngine.calculateHiddenDrag`
4. Apply net flow to cashReserve, update ghost worker rate, overhead creep, contractor backlog
5. Fire any `pendingDelayed` events that are due
6. Run `factionEngine.drift` → apply to state
7. Check game over conditions
8. Draw/trigger next event card(s)
9. Passive stat decay: `infrastructureScore -= 0.3` per week without maintenance spend

---

## Starting State (startingState.ts)

```typescript
export const STARTING_STATE: GameState = {
  week: 1,
  stats: {
    igr: 12.8,                  // ₦bn per week
    cashReserve: 45,            // ₦bn
    expenditure: 11.2,          // ₦bn per week
    infrastructureScore: 42,
    publicTrust: 54,
    politicalCapital: 100,
    federalRelationship: 5,
    securityIndex: 61,
    corruptionPressure: 28,
    youthTension: 35,
  },
  factions: {
    businessCommunity: 55,
    informalEconomy: 50,
    partyGodfathers: 65,        // starts high — you owe them
    federalGovt: 48,
    civilSocietyMedia: 44,
    lgChairmen: 58,
  },
  constituencyApproval: {
    lagosIsland: 60,
    victoriaIsland: 62,
    lekki: 55,
    surulere: 51,
    oshodi: 47,
    alimosho: 38,               // always the most neglected
    periphery: 35,
    makoko: 30,
  },
  activeEvent: null,
  eventQueue: [],
  pendingDelayed: [],
  resolvedEvents: [],
  godfatherMessages: [],
  godfatherRefusalCount: 0,
  isGameOver: false,
  mode: 'simple',
}
```

---

## 🚧 Known Design Debt — Units of Measurement

All stat values are currently raw `number` types with no formalised units. A reader must infer from context (or comments) whether a value is in ₦bn, percentage points, or an index score. This works fine for now but will become a source of bugs as the stat surface grows.

**Deferred solution (revisit when it bites us):** Branded nominal types (`type Naira = number & { __brand: 'Naira' }`) per field to make unit mismatches a compile error. See `src/state/types.ts:StatKey` for all fields that need this treatment.

---

## Game Over Conditions (check after every weekly tick)

| Condition | Trigger |
|---|---|
| Bankruptcy | `cashReserve < 0` for 3 consecutive weeks |
| Federal Takeover | `federalRelationship < -40` AND `infrastructureScore < 25` |
| Mass Uprising | `publicTrust < 15` AND `youthTension > 85` |
| Party Removal | `partyGodfathers < 10` AND week > 52 (after first year) |
| Term End | `week > 208` (4 years) → scorecard, not game over |

---

## Event Card Writing Rules

When adding new event cards to `/data/events/`:

1. **Every card must have a minimum of 2, maximum of 4 choices**
2. **At least one choice must move two factions in opposite directions**
3. **At least one choice should have a `delayed` consequence**
4. **No choice should be obviously correct** — if a choice is clearly right, redesign it
5. **Body text must be written with Lagos texture** — reference real places, real dynamics
6. **No moralising in the body text** — present the situation, not the lesson
7. **Severity must be calibrated:**
   - `low`: single stat moves < 5pts
   - `medium`: 2-3 stats move 5-10pts
   - `high`: multiple stats move 10-20pts, or one stat moves 20+pts
   - `critical`: potential game over path, or irreversible consequence

---

## UI/UX Rules

- **Simple mode** (default): Show human-readable descriptions, hide raw numbers, lead with narrative
- **Detailed mode**: Show all raw numbers, trend arrows, source footnotes for real data
- The toggle lives in settings and persists in localStorage
- Dashboard always shows: week number, cash reserve, public trust, political capital (the four "at a glance" stats)
- Faction bars are always visible — they are the political weather
- Event card takes focus when active — dim everything else
- Delayed consequences that fire show a brief "flashback" line: *"3 months ago, you chose to..."*

---

## What NOT to Build Yet

- No map (Phase 2)
- No multiplayer
- No audio
- No backend
- No authentication
- No save-to-server (localStorage is fine)
- No Game B (the political career ladder)

---

## Verification Checklist (Claude Code: run these checks)

- [ ] All stat mutations go through `applyDelta` in statEngine.ts
- [ ] All stats respect their bounds (no publicTrust > 100, no corruptionPressure < 15, etc.)
- [ ] `applyDelta` has no side effects — it is a pure function
- [ ] `weeklyTick` in gameLoop.ts follows the 9-step order defined above
- [ ] Every EventCard in `/data/events/` conforms to the `EventCard` type
- [ ] Every EventCard has no "obviously correct" choice
- [ ] Every EventCard with `severity: 'critical'` has a delayed consequence path
- [ ] `godfatherRefusalCount` increments on every refusal and triggers escalation at 2, 3, and 4
- [ ] Game over conditions are checked after `budgetEngine.weeklyTick` fires, not before
- [ ] `pendingDelayed` queue is sorted by `firesOnWeek` ascending
- [ ] `constituencyApproval` contributes to `publicTrust` as a weighted average (Alimosho + periphery + makoko = 40% weight, Island + VI + Lekki = 30%, others = 30%)
- [ ] Simple/Detailed mode toggle does not affect game state — only presentation layer

---

## Lagos Data Reference (for calibrating event consequences)

Keep these numbers in mind when writing event outcomes:

| Metric | Real Value |
|---|---|
| Lagos population | 15–22 million (uncertain) |
| Formal sector workers | ~3 million |
| Youth unemployment | ~38% |
| Roads in poor condition | ~40% of 9,000km |
| Power grid coverage | 30–40% of city need |
| Pipe-borne water access | ~30% of residents |
| BRT daily ridership | ~200,000 (need is 10x) |
| Building collapses/year | 40+ |
| Civil servants | ~80,000 |
| Annual budget | ₦2.2–2.8 trillion |
| Annual IGR | ~₦660bn |
| Debt stock | ~₦1.4 trillion |
| Traffic cost (annual) | ~$1bn in lost productivity |
| Corruption drag (estimated) | 20–40% of project costs |

---

## Questions for the Human (Before Major Decisions)

If you are about to:
- Add a new major stat → ask first, it affects everything
- Change the weekly tick order → ask first, it changes game feel
- Add a backend → Phase 2 concern, confirm we are there
- Add map components → Phase 2 concern, confirm engine is validated first
- Add real Nigerian political names → sensitive, confirm approach first

---

*This file is the contract between the game design and the code. Keep it updated.*