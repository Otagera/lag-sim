# Event Card System

## Event Card Writing Rules

1. Every card has 2–4 choices
2. At least one choice moves two factions in opposite directions
3. At least one choice has a `delayed` consequence
4. No choice is obviously correct — if it is, redesign it
5. Body text has Lagos texture — real places, real dynamics
6. No moralising in body text
7. Jurisdiction accuracy: state assembly = LAHA (not Federal Senate); federal involvement requires a federal funding hook
8. Severity calibration: `low` < 5pts single stat · `medium` 5–10pts multiple · `high` 10–20pts or 20+ single · `critical` potential game over

## Initiatives

New initiatives require an entry in `src/data/initiatives.ts`:

```typescript
'initiative-id': {
  name: 'Display Name',
  description: 'One-sentence description',
  totalWeeks: N,
}
```

`launchInitiative` on a Choice sets `state.activeInitiative`. `tickInitiative` in gameLoop decrements `weeksRemaining` and enqueues `completionEventId` at 0. Completion events must be queue-only (`triggerCondition: () => false`).

## ALL_EVENTS Ordering

`eventEngine.ts` line 25: Phase 4 events are first in the combined array. Since `drawNextEvent` uses `Array.find` over triggered events, phase4 trigger-condition outcomes (`populist-shield-success`, `populist-shield-fail`) fire before any other triggered event in the same tick.

Full ordering:
1. phase4Events (Political Realism)
2. transportEvents
3. infrastructureEvents
4. politicalEvents
5. crisisEvents
6. economyEvents
7. socialEvents
8. routineEvents
9. characterEvents
10. electionEvents
11. midgameEvents
12. campaignEraEvents
13. finaleEvents
14. term2Events
15. chainEvents
16. riotEvents
17. NPC_DECK_EVENTS

## Event Categories Inventory (~160 cards total)

### Routine (10 cards, `routine.ts`)
Early-game narrative: handover briefing (wk 2–6), teacher arrears (wk 3–8), budget address (wk 4–10), first rains flooding, 100-days press.
Recurring governance: budget allocation, media cycle, IGR optimisation, security assessment, maintenance backlog, youth engagement, constituency visit, sanitation drive.
All recurring events have `maxWeek: 150` — they expire before campaign season.

### Infrastructure (file: `infrastructure.ts`)
Water, roads, bridges, power. Mid-game capital project choices.

### Transport (file: `transport.ts`)
BRT fleet, ferry, road corridors, Apapa congestion.

### Political (file: `political.ts`)
Fashemu arc events, deputy events, LGA/primary events, removal arc events.

### Crisis (file: `crisis.ts`)
Fire, flood, disease outbreak, market collapse, building collapse.

### Economy (file: `economy.ts`)
Budget, tax, trade, currency, loan events.

### Social (file: `social.ts`)
Health, education, housing, sanitation, welfare.

### Characters (file: `characters.ts`)
NEO, Dayo, SMJ specific events + deputy consequence events.

### Election (file: `election.ts`, 3 cards)
Mandatory campaign cards that fire during campaign mode.

### Campaign (file: `campaign.ts`, 7 cards)
4 campaign-era events + 3 opponent cards targeting player weaknesses.

### Finale (file: `finale.ts`, 3 cards)
Debate → security breakdown → election eve (weeks 205–207).

### Midgame (file: `midgame.ts`, 4 cards)
Year-anchored trigger events at weeks 60/78/104/130: press verdict, assembly budget revolt, teachers' strike, security audit.

### Chains (file: `chains.ts`, 4 cards)
State-flag-triggered: union court injunction, work-to-rule, tender scandal, land-grab exposed.

### Riot (file: `riot.ts`, 3 cards)
Only available in riot mode: curfew, security surge, youth parley.

### Phase 4 (file: `phase4.ts`)
Cat 4: Ghost worker purge, stomach infrastructure
Cat 3: Assembly quorum maneuver, neighboring sanctuary offer
Cat 2: Federal emergency/suspension arc, EFCC letter
Cat 1: Election petition / litigation arc

### Term 2 (file: `term2.ts`, ~18 cards)
Weeks 210–260+: Fourth Mainland Bridge, Abuja withholding, transport union cartel, cabinet looting, debt default, civil service sabotage, deputy succession, LIRS platform collapse, LASU shutdown, speaker pivot, kidnapping ring, opposition coalition, Apapa pollution, Ajegunle gang war, Olusosun landfill fire, Eko Bridge crisis, Badore jetty collapse, pension deficit, BRT fleet collapse, LASUTH crisis, naira devaluation.

### Roll Your Own (LLM, file: `llm_generated.ts`)
26 template card definitions (no bodies, LLM-generated). Disabled by default.

### NPC Decks (file: `npcDecks.ts`, ~16 cards)
8 archetypes × 2 events each (hostile escalation + neutral opportunity). `{NPC}` placeholder replaced at draw time. See `docs/npc-system.md`.

## Event Drawing Logic (`drawNextEvent`)

1. If event queue is non-empty, return queue front
2. Find first available event with matching `triggerCondition` (excluding NPC/election/initiative events)
3. If riot mode: draw from riot pool only
4. Otherwise: weighted random from non-triggered pool, skipping NPC/election/initiative/riot events
5. Weight influenced by: severity (low=3, medium=2, high/critical=1), wet season multiplier (3× for flood events), information commissioner loyalty (dampens hostile media events)

## Event Resolution (`resolveEvent`)

1. Apply `immediate` stat delta (with diminishing returns scaling if applicable)
2. Apply faction impact, constituency impact
3. Apply political capital cost (scaled by season ×1.2 in election year)
4. Apply corruption trigger (+3 corruptionPressure)
5. Set flags, launch initiative, launch project
6. Handle suspension/litigation timers
7. Handle NPC relationship impact
8. Enqueue delayed consequence
9. Manage event queue (dequeue current, enqueue follow-up)
10. Track recurring cooldowns vs one-shot resolution
11. Log timeline entry
12. Track campaign decisions for election formula
13. Apply diminishing returns penalties (corruption and civil society erosion after 2+ uses)
