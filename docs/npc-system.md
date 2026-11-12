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

## Escalation (Pressure ≥ 40)

Each archetype has a deck of 2 events (hostile escalation + neutral opportunity):

### Journalist
- **Hostile**: Procurement exposé article published (choices: full disclosure / spin the story / challenge reporting)
- **Neutral**: Back-channel truce offer (establish monitoring board or decline)

### Youth Organiser
- **Hostile**: Mass rally at Ojota (send liaison / ignore / heavy police)
- **Hostile (critical)**: Real electoral threat, youth voter registrations tripled (launch fund / adopt demands / dismiss)

### Insider
- **Hostile**: Project stall via missing approvals (investigate / absorb quietly)
- **Hostile (critical)**: Primary challenge declared (mobilise grassroots / negotiate cabinet / call federal allies)

### Union Leader
- **Hostile**: 72-hour strike ultimatum (pay arrears / negotiate phased / call bluff)
- **Neutral**: Offer of cooperation — no strike for 26 weeks in exchange for wage uplift (accept / decline)

### Opposition Senator
- **Hostile**: Senate hearing on Lagos fiscal transparency (cooperate / obstruct / call ally)
- **Hostile (critical)**: Opposition bloc forms, FAAC suspension threat (engage bloc / presidential intervention / let proceed)

### Diaspora Activist
- **Hostile**: International human rights report (dialogue / dispute)
- **Neutral**: Diaspora investment consortium offer, ₦15bn (accept with monitoring / decline)

### Oba Liaison
- **Hostile**: Traditional land rights dispute (halt project / compensate / proceed anyway)
- **Neutral**: Traditional council endorsement for LGA elections (accept board seat / decline)

### Business Mogul
- **Hostile**: Capital flight warning (settle compensation / port tax relief / call bluff)
- **Neutral**: PPP proposal for Apapa port road + logistics hub (accept / counter open tender / decline)

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
