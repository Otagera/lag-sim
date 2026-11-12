# NPC System

## Overview

Three NPC slots (npc1/npc2/npc3). Each activates when its `activationCondition` is met. Passive effects apply every tick based on relationship tier. When pressure ≥ 40, escalation events fire from the NPC's archetype deck.

> **Opinion ledger (v8, Political Actors phase 1).** `relationship` is no longer set directly: it is derived from `ledger: OpinionEntry[]` — a list of remembered reasons that decay (fast / slow / permanent). Tiers: hostile < −30 ≤ wary < 10 ≤ cordial < 40 ≤ allied. On activation each NPC is seeded with the reason they turned up (`ACTIVATION_REASON`, data/reasons.ts). See `docs/political-actors.md` and `engine/opinionEngine.ts`.

Source: `src/data/npcs.ts` (definitions), `src/data/events/npcDecks.ts` (escalation events), `src/engine/gameLoop.ts` (tick processing)

## Activation

Each NPC archetype has an `activationCondition` in `src/data/npcs.ts`. Examples:
- journalist: `week > 10`
- youth-organiser: `youthTension > 45`
- insider: `week > 20 AND partyGodfathers > 50`
- union-leader: `civilServiceReformScore > 5 OR ghostWorkerRate > 0.12`

## Passive Effects (Applied Every Tick)

| Archetype | Hostile (rel < −30) | Allied (rel ≥ 40) |
|---|---|---|
| journalist | corruptionPressure +0.5/wk | corruptionPressure -0.3/wk |
| youth-organiser | youthTension +1.5/wk | youthTension -0.5, publicTrust +0.2/wk |
| insider | politicalCapital -1/wk | politicalCapital +0.5/wk |
| union-leader | civilServiceReformScore -0.3/wk | infrastructureScore +0.1/wk |
| opposition-senator | federalRelationship -0.5/wk | federalRelationship +0.3/wk |
| diaspora-activist | publicTrust -0.3/wk | publicTrust +0.2/wk |
| oba-liaison | publicTrust -0.2/wk | publicTrust +0.2/wk |
| business-mogul | igr -0.1/wk | igr +0.1/wk |

## Moves (replaces "Escalation at pressure ≥ 40")

Since Political Actors phase 2, actors **choose** when to act (`engine/actorEngine.ts`, data in `data/actors.ts`). Each week every active actor scores its in-character moves — deck cards and inbox letters — from: the move's base appeal, situational factors that hold right now ("your public trust is low", "the election is approaching"…), pressure, grudge, risk vs boldness, and how often it has used the move before. It acts only if the best move clears a bar set by its patience (letters have a lower bar). One actor card reaches the player per week. The deck cards below are still the card moves; their bodies end with a `{REASON}` slot filled with the actor's strongest relevant reason. `lastMove` records why the moment was chosen and is shown in the Political Actors panel.

Archetypes: journalist, youth-organiser, insider, union-leader, opposition-senator, diaspora-activist, oba-liaison, business-mogul, **federal-liaison** (Presidency liaison: allocation delays, federal flagship offers, campaign loyalty demands).

## Tick Processing (gameLoop.ts)

1. `activateNPCs` — checks activation conditions for inactive NPCs, assigns seated archetypes
2. `tickNPCPressure` — increments pressure based on relationship direction
3. `applyNPCGoalEffects` — applies the passive relationship tier effects above
4. `checkNPCEscalation` — if pressure ≥ 40, draws from `NPC_DECK_BY_ARCHETYPE[archetypeKey]`, replaces `{NPC}` placeholder with actual NPC name

## NPC State Shape

```typescript
type NPCState = {
  isActive: boolean
  relationship: number      // -100 to 100
  pressure: number          // 0 to 100
  archetypeKey: NPCArchetypeKey
  name: string
  hasBeenInvited?: boolean  // set when first activation event drawn
  activeWeek?: number       // week of activation
}
```

## NPC Impact from Event Choices

Event choices change NPC opinion through `choice.actorImpact`, each entry carrying a reason from `data/reasons.ts`:

```typescript
actorImpact: [{ actor: 'journalist', reason: 'cooperated-openly', value: 18 }]
```

`actor` matches the `NPCArchetypeKey`, not the slot name. The engine appends an `OpinionEntry` (with the card title as `source`) to the matching slot's ledger and re-derives `relationship`. Every reason has a numbers `label` and a narrative `line`; the content-audit test fails on unknown reasons.
