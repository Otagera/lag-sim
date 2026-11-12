# Political Actors — Design

> Status: **phases 1–2 implemented** (Nov 2026); phase 3 pending. Decisions in §11.
>
> **As built (phase 2):** `data/actors.ts` (personalities, situational factors, move library, intros) and `engine/actorEngine.ts` (`scoreMoves`, `runActorMoves`). Utility = base + 0.22 × active factors + 0.5 × pressure/100 + grudge (hostile: 0.2 × pride; wary: −0.1) − risk × (1 − boldness) − 0.15 × prior uses (×0.3 for letters) ± 0.05 seeded noise. Cards clear 0.55 + 0.35 × patience; letters clear 0.2 less. One actor card per week; 3-week minimum between an actor's moves. Each move records `lastMove.because` (the factors that held) for the "why now" line. Fashemu's asks still run on the godfather script (port planned with promises in phase 3). Replaces the NPC "pressure ≥ 40 → draw a card" loop with actors that have goals, memory and timing. Inspired by what makes Civilization's leaders feel real — not their intelligence, but their **motives, memory and visible reasons**.

---

## 1. Goals

1. **Every hostile move has a reason the player can find.** "Why is he attacking me?" must always have an answer in the game.
2. **Actors act on their own agenda, with timing.** They push when you are weak, deal when you are strong, and wait when waiting serves them.
3. **History matters.** Promises kept or broken, favours, humiliations: remembered, fading at different speeds, and talked about between actors.
4. **Two ways to read everything** (see §8). Numbers for players who like watching values move; faces, tone and prose for players who don't. Neither layer is second-class.
5. **Deterministic and pure.** Same seed + same choices = same actor behaviour. Every function stays `(state, …) => state`. No LLM.
6. **Scenario-agnostic.** Actors, agendas and move text are data. A Kano scenario is a different cast on the same engine.

Non-goals: free-text diplomacy, real-time negotiation, a separate actor-vs-actor simulation that runs without the player.

---

## 2. What exists today and what changes

| Today | After |
|---|---|
| 3 NPC slots, each one `relationship` number + `pressure` counter | Actors with an **opinion ledger** (list of reasons) and an **agenda** |
| Pressure rises at a fixed rate; at 40 draws one of 2 archetype cards | Each week each actor **scores possible moves** and picks one (often "wait") |
| Passive effect by relationship tier | Kept — tier now derived from opinion |
| Fashemu: separate `fashemuRelationship` + scripted ask sequence | Fashemu becomes an actor; his asks become moves on his agenda (scripted beats kept as high-priority moves) |
| Factions (businessCommunity, informalEconomy, …) | **Unchanged.** Factions are blocs; actors are people who lead, speak for, or exploit them |

Tick order stays the same. Only the internals of **step 10** ("Activate NPCs → tick pressure → apply goal effects → check escalation") change. *Approved in principle; tests that assert the pressure model get rewritten.*

---

## 3. Data model

### 3.1 Definitions (static data, per scenario)

```ts
type ActorDefinition = {
  id: string                       // 'fashemu', 'nurtw-chair', 'opposition-senator'
  archetype: NPCArchetypeKey | 'godfather' | 'deputy'
  namePool: string[]
  portrait: CharacterId
  faction?: FactionKey             // bloc they lead / speak for
  personality: Personality
  agenda: AgendaItem[]             // what they want, weighted
  moves: MoveId[]                  // the moves this actor can make
  activation: (s: GameState) => boolean
}

type Personality = {               // 0..1 each — fixed per actor, like Civ "flavours"
  greed: number       // values money/contracts over status
  pride: number       // punishes humiliation hard, slow to forgive
  patience: number    // willing to wait for a better moment
  boldness: number    // tolerance for risky, public moves
  loyalty: number     // honours deals; how much a broken promise hurts
}

type AgendaItem = {
  id: string                       // 'control-succession', 'park-levies', 'unseat-governor'
  weight: number
  progress: (s: GameState, a: ActorState) => number   // 0..1, how satisfied they are
}
```

### 3.2 Runtime state (saved)

```ts
type ActorState = {
  id: string
  name: string
  active: boolean
  activeSince?: number
  ledger: OpinionEntry[]
  intent?: { moveId: MoveId; firesAt: number; telegraphed: boolean }  // §4.4
  lastMoveWeek?: number
  cooldowns: Record<MoveId, number>
  promises: PromiseRecord[]
}

type OpinionEntry = {
  reason: ReasonKey                // 'raised-park-levies', 'kept-oshodi-promise'
  value: number                    // signed, e.g. -15
  week: number
  decay: 'fast' | 'slow' | 'permanent'   // ~-25%/8wk | ~-25%/26wk | never
  source?: string                  // event/choice id, for callbacks in text
}
```

`opinion = Σ current values` (clamped −100..100). The relationship **tier** (hostile < −30 ≤ wary < 10 ≤ cordial < 40 ≤ allied) replaces today's 30/65 thresholds and drives passive effects.

### 3.3 Reasons

A `ReasonKey` is one entry in a table:

```ts
REASONS['broke-promise'] = {
  label: 'You broke your promise',                     // numbers view
  line: (a) => `${a.name} has not forgotten that you gave your word and broke it.`,  // narrative view
  decay: 'permanent',
  gossip: 0.5,      // fraction applied to *other* actors who learn of it (§6)
}
```

Choices write reasons through a new optional field, replacing `npcImpact`:

```ts
actorImpact?: { actor: string; reason: ReasonKey; value?: number }[]
```

Existing `npcImpact` entries are converted to `actorImpact` with a fitting reason in one pass during phase 1 — no compatibility shim.

---

## 4. The weekly actor loop (inside step 10)

For each active actor, in a fixed order:

1. **Decay** the ledger; drop entries whose value rounds to 0.
2. **Read the situation** — a small `Situation` snapshot shared by all actors: your trust, PC, cash, security, election proximity, recent crises, your reputation (§6).
3. **Resolve intent** — if a telegraphed move is due, play it (§4.4).
4. **Otherwise choose a move** by utility (§4.1). Most weeks the winner is `wait`.
5. **Emit** the move through a presentation channel (§4.3).
6. **Apply passive effect** by tier (existing behaviour).

Global caps keep the player from being swarmed: max **one actor card per week** (others queue or downgrade to inbox/news), and per-move cooldowns.

### 4.1 Move selection — utility

```
utility(move) =
    Σ agenda.weight × Δprogress(move)          // does it serve what I want?
  + opinionTerm(move)                          // hostile actors like hostile moves, allies like help
  + opportunity(move, situation)               // is the governor weak/strong *right now*?
  − risk(move, situation) × (1 − boldness)     // could this backfire on me?
  + noise(seed, actor, week) × 0.1             // small, seeded — keeps them from being clockwork
```

The highest-scoring move wins if it beats `wait` by a margin scaled by `patience`. **Patient actors wait for openings; impatient ones act early and worse.** This is the single mechanism behind "they struck when I was down".

Example — the opposition senator during flood season:

| Move | agenda | opinion | opportunity | risk | total |
|---|---|---|---|---|---|
| wait | 0 | 0 | 0 | 0 | 0.00 |
| call fiscal hearing | +0.30 | +0.20 | **+0.35** (trust 31, flood crisis) | −0.10 | **0.75** |
| leak procurement memo | +0.25 | +0.20 | +0.15 | −0.30 | 0.30 |

Two months earlier, with trust at 58, the same hearing scores 0.40 — below his patience threshold. He waits.

### 4.2 Move catalogue (v1)

Shared verbs, specialised per archetype by data:

| Verb | Typical actors | Output |
|---|---|---|
| `demand` | godfather, union, LG chairmen | card: comply / negotiate / refuse |
| `offer-deal` | mogul, union, oba, insider | card: accept creates a **promise** (§6) |
| `expose` / `leak` | journalist, insider, senator | card or news; adds corruption/trust pressure |
| `mobilise` | youth organiser, union, NURTW | card; raises youthTension / strike risk |
| `obstruct` | senator, insider, assembly | delays a project or initiative |
| `endorse` / `defend` | allies | news + trust/PC; costs them nothing |
| `court-rival` | any hostile actor | joins/forms a coalition (§7) |
| `ask-favour` | allies | small card; refusing costs opinion, helping banks goodwill |
| `wait` | everyone | nothing visible — sometimes an intel hint |

Existing archetype deck cards become the first concrete moves.

### 4.3 Channels

A move picks the lightest channel that carries it:

| Weight | Channel | Example |
|---|---|---|
| light | **Inbox** message with tone | "Bello writes: the motor parks are restless." |
| medium | **Herald** headline / social post | "SENATOR CALLS FOR LAGOS FISCAL PROBE" |
| heavy | **Event card** with choices | the hearing itself |

### 4.4 Telegraphing (intel)

Big moves are scheduled 1–3 weeks ahead as `intent`. If your security/intel standing allows, you get a hint in the weekly briefing: *"Fashemu has met the Speaker twice this week."* Acting on it (a pre-emptive choice) can change the actor's utility before the move lands. This is what makes moves feel *planned* rather than random.

---

## 5. Writing the moves (hand-authored content)

Each move card is a template with **reason slots** filled from the ledger:

```
title: '{name} Calls for a Fiscal Hearing'
body:  '{name} has convened a public hearing on "fiscal transparency". {topReasonLine}
        Allocation release is being held pending the outcome.'
```

`{topReasonLine}` pulls the strongest negative reason's narrative line ("He has not forgotten Oshodi."). Writers supply 2–3 body variants per move × tier, plus reason lines. This is where hand-written depth and the engine meet: the AI decides *what* and *when*; the writing makes it *personal*.

Budget for v1: ~8 actors × ~5 moves × 2–3 variants ≈ **100 move texts** + ~40 reason lines.

---

## 6. Promises and reputation

Accepting an `offer-deal` (or some existing cards) creates:

```ts
type PromiseRecord = { id: string; actor: string; terms: string; dueWeek: number;
                       check: (s: GameState) => boolean; status: 'open' | 'kept' | 'broken' }
```

At `dueWeek` the check runs: **kept** → `kept-promise` (+, slow decay); **broken** → `broke-promise` (−, permanent).

**Reputation** is a derived value: kept vs broken promises, betrayals, and how hard you crush opponents. Other actors see it — a broken promise propagates as a weaker `heard-you-broke-promise` entry (the reason's `gossip` fraction) to actors who share a faction or network. A low reputation makes `offer-deal` rarer and pricier; a reputation for ruthlessness makes timid actors fold and bold ones organise.

---

## 7. Coalitions

Actors with overlapping grievances (same negative `ReasonKey`s, or agendas that your policy hurts) can `court-rival`. A coalition:

- has members and a shared target (usually "unseat" or a specific policy),
- adds an `opportunity` bonus to members' hostile moves (they move together),
- dissolves when a member's opinion of you rises past *cordial* or members' agendas conflict.

Existing coalition cards (`term2-opposition-super-coalition`, `neo-dayo-coalition`) become coalition outcomes rather than stand-alone events.

---

## 8. Presentation — two ways to read everything

Every actor fact is rendered **twice**: as a number and as a picture or sentence. A setting **"Show the numbers"** switches the emphasis: *off* for first-time players (no prior save and onboarding tour not completed on this device), *on* for everyone else; both layers are always reachable.

| Fact | Numbers view | Narrative / visual view |
|---|---|---|
| Opinion | `−34` with a sparkline of the last 12 weeks | Portrait expression + tier word: *Hostile* · *Wary* · *Cordial* · *Allied*; seal colour shifts |
| Why they feel that way | Ledger list: `Raised park levies −15 (fading)` | The same reasons as sentences in their own voice: *"You put a tax on my boys' bread."* |
| What they want | Agenda bars with % satisfied | One-line motive under the portrait: *"Wants the succession."* |
| What they might do next | Top-3 move utilities (nerd mode only) | Intel briefing prose; Herald rumours; inbox tone turning *cold* → *threatening* |
| Promises | Table: terms, due week, status | Letters on the desk; a broken promise leaves a stamp on their card |
| Reputation | `Reliability 62 · Ruthlessness 30` | How strangers greet you in inbox openings (*"Your Excellency, as a man of your word…"* vs *"We will need it in writing."*) |
| Coalitions | Member list + shared target | A "web" view: portraits linked by red threads |

Presentation can carry meaning without numbers: an actor's **inbox tone**, **portrait expression** and **how often they write** should let a non-numbers player sense a storm coming. Design rule: *if a player ignores every number, the visuals alone should still tell them who is angry, roughly why, and that something is brewing.*

New UI: an **Actors panel** (dock tab) — a card per active actor with portrait, tier, motive, top two reasons, and a "Why?" drawer that opens the full ledger (numbers view) or their own account (narrative view).

---

## 9. Save compatibility

**Not preserved — breaking change accepted.** Phase 1 bumps `SAVE_VERSION` to 8 and drops the migration chain: saves below v8 are discarded on load with a one-line notice ("This save is from an older version of Excellency — starting a new term."). Cloud saves below v8 are ignored the same way. `npcImpact`, `activeNPCs` and `fashemuRelationship` are removed rather than mapped once their content is ported.

---

## 10. Phasing

| Phase | Scope | Player-visible result |
|---|---|---|
| **1 — Ledger & Why** | `OpinionEntry`, reasons table, decay, `actorImpact` (existing `npcImpact` converted), Actors panel with both views. Existing pressure model untouched. | You can see *why* every NPC and Fashemu feels the way they do. |
| **2 — Agendas & moves** | Personality, agenda, utility selection, channels, global caps; port the 16 archetype deck cards + Fashemu asks into moves; write new move texts with reason slots. Replaces pressure≥40. | NPCs pick their moments; moves reference your history. |
| **3 — Promises, reputation, coalitions, intel** | Promise records, gossip, reputation, coalition formation, telegraphed intents. | Betrayal has consequences across the cast; storms are visible before they hit. |

Each phase ships behind the existing tests plus:
- determinism test (same seed + choices → same actor moves),
- `simulation.test.ts` / winning-strategy benchmark kept within current win-rate bands,
- content-audit additions: every `ReasonKey` used has both a `label` and a `line`; every move has ≥2 variants.

---

## 11. Decisions

| # | Question | Decision |
|---|---|---|
| 1 | First cast | Fashemu (godfather), journalist, union leader, opposition senator, youth organiser, business mogul **+ a federal actor** (Presidency liaison / federal minister — owns allocation timing, federal agencies and party-at-the-centre pressure; distinct from the senator, who fights in the legislature). |
| 2 | "Show the numbers" default | Off for first-time players, on for returning players (§8). |
| 3 | Active actors | **3 rotating slots** + Fashemu as a standing actor, one actor card per week cap. Inactive cast members can still appear through inbox/news. |
| 4 | Death / replacement | **Yes.** Actors can die, retire, be jailed or be removed. A successor inherits a fraction of the ledger (e.g. 50% of grudges, 25% of goodwill — successors remember slights better than favours) plus one entry about how the predecessor left (*"You let his father's market burn"*). |
| 5 | Intent visibility | Hybrid, pending sign-off: baseline hints from `securityIndex`, plus a research-tree node (*State Intelligence Unit*) that adds lead time and names the actor. |
| — | Save compatibility | Breaking change accepted (§9). |
