# Phases A–D Implementation Status

Captured after the initial agent build and subsequent review. All four phases are shipped and tested. Gaps noted below are sequenced for follow-up — none block playability.

---

## Phase A — Starting Goals

**Status: ✅ Shipped**

Files:
- `src/data/goals.ts` — 3 goals: Break the Machine, Make the Promise Real, Lights On
- `src/ui/GoalSelectionScreen.tsx` — appears after deputy selection (new-game) or on save migration
- `src/ui/GoalTracker.tsx` — persistent progress bar + blocking line in sidebar
- `selectedGoalId: string | null` in `GameState` and `STARTING_STATE`

Roadmap checklist:
- [x] Player picks a goal at start; it persists across save/load
- [x] Goal tracker shows live progress that moves as relevant stats move
- [x] "What's blocking you" line correctly names the real obstacle
- [ ] **GAP**: Goal completion → major positive event / legacy boost — not yet wired. When `getGoalIsMet` returns true at term end, no special event fires. Defer to Phase E+ work when legacy scoring is revisited.
- [ ] Playtest verification — must be done by human

---

## Phase B — Emotional Consequence Text

**Status: ✅ Shipped**

Files:
- `src/engine/consequenceNarrator.ts` — deterministic template engine, 25+ fragment families
- `src/state/types.ts` — `ConsequenceBeat` type
- `src/engine/eventEngine.ts:289` — `narrateConsequence()` called on every choice resolution
- `src/ui/EventCard.tsx:187` — beat displayed between events; dismissed by player
- `src/state/gameStore.ts` — `dismissConsequenceBeat()` action

Voice pass: many families are marked `draft: true`. Every family with `draft: true` needs a human rewrite before the phase is considered final. The scaffolding is correct; the voice is placeholder.

Roadmap checklist:
- [x] After a significant choice, a specific narrative beat appears
- [x] Beat references player's actual situation (LGA names, correct characters)
- [x] No runtime LLM; no performance hit
- [ ] **GAP**: Delayed consequences don't yet get their own narrative beat — the beat only fires on immediate resolution. Delayed eventText is already in the schema; the beat for delayed fires could be added to `firePendingDelayed` when needed.
- [ ] Playtest verification — does the choice now make you feel something?

---

## Phase C — Proactive Economy Panel

**Status: ✅ Shipped (3 bugs fixed)**

Files:
- `src/ui/EconomyPanel.tsx` — Revenue Levers, Spending Cuts, Financing sections
- `src/state/gameStore.ts` — 5 economy actions: `economyCutSubventions`, `economyReduceOverheads`, `economyRaiseLuc`, `economyLaunchInitiative`, `economyTakeLoan`
- `economyCooldowns: Record<string, number>` in `GameState`

**Bugs fixed in review:**
- `economyCutSubventions` was missing `informalEconomy: -8` faction hit (now applied)
- `economyReduceOverheads` was missing `partyGodfathers: -6, lgChairmen: -5` faction hits (now applied)
- `economyRaiseLuc` was missing `businessCommunity: -6` faction hit (now applied)

Revenue lever IDs and their completion events:
| Lever | PC Cost | Weeks | Payoff event |
|---|---|---|---|
| PAYE Enforcement Drive | 5 | 10 | `paye-enforcement-result` |
| Land Use Charge Audit | 8 | 8 | `luc-audit-result` |
| World Bank Grant | 5 | 6 | `world-bank-grant-result` |
| Civil Service Reform | 10 | 14 | `civil-service-reform-result` |

Roadmap checklist:
- [x] Player can cut overheads / take a planned loan / launch an initiative without waiting for an event card
- [x] Each action shows its cost before commit
- [x] `takeLoan` (world_bank/bond/federal) is reachable and works
- [ ] Playtest: do you now feel like you're governing, not just answering mail?

---

## Phase D — Inbox + Present Characters

**Status: ✅ Shipped (2 gaps wired in review)**

Files:
- `src/ui/Inbox.tsx` — list + detail view with tone indicators and avatars
- `src/ui/AvatarMonogram.tsx` — deterministic colour monograms per character
- `src/engine/inboxEngine.ts` — message generators for all characters
- `src/state/types.ts` — `InboxMessage`, `CharacterId`, `InboxMessageTone` types
- `inbox: InboxMessage[]` in `GameState`

Characters with inbox presence:
| Character | From ID | When it fires |
|---|---|---|
| Chief Fashemu | `fashemu` | Phase transitions + godfather asks |
| Chief of Staff | `chief-of-staff` | Every 4 weeks (automated) |
| NEO (journalist) | `neo` | NPC activation + escalation |
| Comrade Dayo | `dayo` | NPC activation + escalation |
| Hon. Seun Majekodunmi | `smj` | NPC activation + escalation |
| Deputy Governor | `deputy` | When resentment first crosses 60 |
| Commissioner | `commissioner` | On appointment |

**Gaps wired in review:**
- `generateDeputyMessage` now fires from `gameLoop.ts` when deputy resentment first crosses 60
- `generateCommissionerMessage` now fires from `gameStore.ts` `appointCommissioner` action
- `generateNPCEscalationMessage` is defined in inboxEngine but **not yet called** — escalation currently queues NPC events but doesn't add inbox messages. Wire from `checkNPCEscalation` in gameLoop if richer inbox presence is wanted.

Roadmap checklist:
- [x] Characters send messages that reflect the real relationship state
- [x] Inbox messages sometimes carry decisions (godfather asks); sometimes just presence
- [ ] **GAP**: Each recurring character needs a consistent portrait (AI-generated, static asset). Not yet created.
- [ ] **GAP**: NPC escalation messages not yet wired to inbox (only events are queued)
- [ ] Playtest: do you now care about / fear specific characters?

---

## Cross-cutting notes

**Voice pass needed**: All fragment families in `consequenceNarrator.ts` marked `draft: true`, and all message bodies in `inboxEngine.ts` marked `DRAFT — VOICE PASS NEEDED`, need human rewriting before phases B and D feel authentic. The system architecture is correct; the text is scaffolding.

**Simulation (simulateEngine)**: The winning-strategy simulation does not call proactive economy actions (Phase C). This is intentional — economy actions are player-initiated. The simulation remains focused on reactive event choices and godfather decisions. See `docs/winning-strategy.md`.

**Next phase**: Phase E (Research/Future-Investment Tree). Do not start until Phases A–D have been playtested and the voice pass is done on at least the most-seen fragments.
