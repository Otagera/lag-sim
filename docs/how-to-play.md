# How to Play — Archetypes & the Political Capital Economy

A player-facing strategy reference. Distinct from [`winning-strategy.md`](./winning-strategy.md),
which documents the *simulation AI* tuning — this doc is for **humans deciding what to
actually do**. Numbers below are sourced from the engine so they stay correct; if you
change balance, update the cited file and this doc together.

> Status: seed of a proper "How to Play." Grown from real playtest findings (week-32
> technocrat insolvency). Some sections flag **open balance questions**, not settled advice.

---

## 1. Political Capital (PC) is the master resource

PC gates almost every *proactive* move you can make. Across the whole deck there are
**67** choices that grant PC versus **169** that spend it — the economy is deliberately
PC-scarce, but no longer an absorbing trap.

### How PC regenerates
- **Passive regen: +0.8 PC / week** — a slow baseline so zero is never permanent. With
  patience you climb back, but it takes ~12 weeks to afford even a single commissioner.
- **Prestige actions** (Treasury panel → "Raise Your Profile") — deliberate PC-earning
  moves: summits (+15–20), constituency tours (+8), media blitzes (+5). Timed actions
  share the initiative slot with revenue levers (choose: raise revenue or raise profile).
- **Project completion** — finishing a capital project grants +3–5 PC scaled to its cost.
  The ribbon-cutting ceremony *is* the prestige gain.
- **Assertive / reformist event choices** — the "strong" option on a card. Examples: the
  Budget Address (+8), refusing a Chief Fashemu ask (often +8), crisis-response choices
  (+10 / +15 / +20).
- **Scripted milestones** — e.g. legal reinstatement after an emergency period (+30).

### Where PC goes (spend) — the proactive levers (`gameStore.ts`)
| Action | PC cost | Also costs | Effect |
|---|---|---|---|
| Appoint commissioner | **8** | — | installs a commissioner (competence boosts revenue/effects) |
| Raise Land Use Charge | **10** | Business −6 | LUC enforcement +0.5 (max 3.0) → more IGR |
| Cut subventions | **10** | Trust −5, Informal −8 | subvention spend −20% (max −40%) |
| Reduce overheads | **15** | Godfathers −6, LG −5 | `baseOverheads` −3 (min −3) |
| Launch initiative | variable | varies | one active initiative at a time |

Plus **169** event choices carry a PC cost inline.

**The core loop:** balance passive regen against your burn rate. Prestige actions and
project completions give you deliberate ways to earn PC — but they cost cash and (for
summits) compete with revenue initiatives for the same slot. If you spend to zero, the
+0.8/wk regen pulls you back, but it's slow: supplement it with tours, blitzes, and
project completions to accelerate.

---

## 2. The three archetypes

All start from a shared base (`startingState.ts`: PC 100, cash ₦45bn, infra 42, trust 54,
fed rel +5, corruption 28, godfathers 65, civil society 44) and then override a few stats
(`archetypes.ts` `getArchetypeState`). Only the overridden values differ; everything else
is the base.

| | **Technocrat** | **Loyalist** | **Outsider** |
|---|---|---|---|
| **Political Capital** | **0** ⚠ | **180** | 100 (base) |
| Cash reserve | ₦65bn | ₦45bn | ₦25bn ⚠ |
| Infrastructure | 62 | 42 | 42 |
| Public trust | 54 | 35 ⚠ | 75 |
| Corruption | 28 | 50 ⚠ | 28 |
| Party godfathers | 30 ⚠ | 90 | 20 ⚠ |
| Civil society | 44 | 44 | 80 |
| **Premise** | Delivery over politics | The machine's man | Won on popular anger |
| **Strength** | Infra head start, deep cash | Max PC + iron party | High trust + civil society |
| **Risk** | **0 PC — every early move costs double** | High corruption + low trust | Thin cash + weak party |

### Technocrat — the tightest needle
You start with a strong balance sheet (₦65bn, infra 62) but **zero political capital**.
That means you *cannot* immediately appoint commissioners (8 PC), raise LUC (10), or cut
overheads (15) — the exact tools that fix a structural deficit. You have to bootstrap PC
from event choices first, while the overheads clock (§3) is already running.

- **Do:** hunt PC-granting choices early; refuse most Fashemu asks (PC-positive *and* avoids
  the overhead tax); protect your cash lead; use `reduceOverheads` the moment you can afford it.
- **Don't:** accept godfather asks to "buy" short-term relief — it permanently inflates your
  overheads and you can't afford the cure.
- **Tip:** use prestige actions (Treasury → Raise Your Profile) to accelerate PC recovery
  once you have the cash. A Media Blitz (+5 PC, ₦1bn) is your cheapest early option.
  Project completions also grant PC — so building roads is doubly valuable.

### Loyalist — the easy mode
180 PC and 90 godfathers means you can appoint, cut, and raise levers at will from day one.
The drag is **corruption 50 + trust 35** — you're one grant-freeze (corruption > 75) away
from trouble, and low trust hurts revenue and elections. Spend PC freely on structural
fixes and reform choices that rebuild trust; keep corruption off the 75 ceiling.

### Outsider — trust rich, cash poor
Base PC (100) is fine, and trust 75 / civil society 80 is a strong revenue and election
base. The problem is **₦25bn cash + godfathers 20**: you have little buffer and no machine.
Convert your popularity into IGR (trust feeds PAYE), avoid early deficits, and don't pick
fights that need godfather muscle you don't have.

---

## 3. The overheads trap (why the Fashemu path kills you)

Overheads are the biggest structural expense and the usual cause of insolvency
(`expenditureEngine.ts`):

```
overheads = 17.0 (term-1 base)          // drops to 5.0 in term 2
          + godfatherComplianceCount × 0.3   // EACH Fashemu "Accept", permanent
          + baseOverheads               // creep; only reducible via reduceOverheads (−3)
```

Every Chief Fashemu **Accept** adds **+₦0.3bn/week to overheads forever** (plus corruption).
Accepting 5 asks = +₦1.5bn/week baked in for the rest of the term. Combined with the fixed
₦17bn base, overheads can reach ₦20bn/week — 57% of all spending. The only counter is
`reduceOverheads` (−3 to `baseOverheads`, 15 PC each), which a PC-starved run can't afford.

**Rule of thumb:** watch the overheads line, not IGR. Refusing Fashemu is usually the
correct play — it's PC-positive and avoids the permanent tax.

---

## 4. Income is mostly structural (don't expect a "raise taxes" button)

Revenue (`revenueEngine.ts`) is largely a *function of governance quality*:
- **PAYE** (biggest line, base 19.6) scales with infrastructure, security, and low youth tension.
- **MDA** (base 5.9) scales with infrastructure + security.
- **LUC** is the one direct knob: `landUseChargeEnforcement × 0.3`, raisable 1.0 → 3.0 via the lever.
- **FAAC** (base 8.7) is federal and **capped at 1.0×** — but watch the cliff:

| Federal relationship | FAAC multiplier |
|---|---|
| ≥ −15 | 1.0× |
| −15 to −30 | 0.7× (−₦2.6bn/wk) |
| −30 to −40 | 0.4× |
| < −40 | 0.1× |

Because PAYE/MDA are near their caps once infra is high, the real budget fight is on the
**spend side** (overheads, subventions) and **protecting FAAC** (don't cross −15), not on
squeezing more income.

---

## 5. Opening checklist (first ~10 weeks)

1. **Pick a personal goal** — it focuses your projects/research and colors the ending.
   (Goal selection now persists correctly; earlier it was silently lost.)
2. **Read the overheads number.** If it's climbing, plan to `reduceOverheads` as soon as PC allows.
3. **Bank PC before spending it.** Take assertive/reformist choices; refuse most Fashemu asks.
4. **Keep federal relationship above −15** to protect the FAAC lump.
5. **Keep corruption off 75** to avoid the grant freeze.
6. **Use prestige actions when cash allows** — a Media Blitz (+5 PC, ₦1bn, 4wk cooldown) is
   cheap insurance against PC starvation. Summits give bigger chunks but cost more and
   block your revenue initiative slot.
7. Archetype-specific: Technocrat → bootstrap PC first via events + cheap prestige actions;
   Loyalist → spend freely, fix trust; Outsider → convert popularity to IGR, guard thin cash.

---

## Sources (keep in sync when balancing)
- Archetype start values: `src/data/archetypes.ts`, `src/data/startingState.ts`
- PC bounds & sinks: `src/engine/statEngine.ts`, `src/state/gameStore.ts`
- PC passive regen (+0.8/wk): `src/engine/gameLoop.ts` (`tickDecayAndNews`)
- Prestige actions: `src/data/prestigeActions.ts`, `src/state/gameStore.ts` (`launchPrestigeAction`)
- Project completion PC reward: `src/engine/projectEngine.ts`
- Overheads: `src/engine/expenditureEngine.ts`
- Revenue & FAAC cliff: `src/engine/revenueEngine.ts`
- Sim-AI tuning (separate concern): `docs/winning-strategy.md`
