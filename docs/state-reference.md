# State Fields Reference

## Starting State Defaults (`src/data/startingState.ts`)

### Stats (week 1)

| Stat | Default | Notes |
|---|---|---|
| igr | 12.8 | Weekly IGR in ₦bn |
| cashReserve | 45 | ₦45bn starting buffer (~25 weeks runway) |
| expenditure | 11.2 | ₦11.2bn/wk starting spend |
| infrastructureScore | 42 | Decays −0.5/wk base, +extra above 70 |
| publicTrust | 54 | Drifts toward constituency avg (10%/wk) |
| politicalCapital | 100 | Consumed by high-value choices |
| federalRelationship | 5 | Neutral-start, drifts negative in election years |
| securityIndex | 61 | Feeds into PAYE formula |
| corruptionPressure | 28 | Rises from godfather compliance |
| youthTension | 35 | Passive +0.4/wk baseline |
| ghostWorkerRate | 0.09 | Inflates personnel costs |
| contractorBacklog | 0 | Grows when projects unfunded |
| debtStock | 0 | All loans feed here |
| weeklyDebtRepayment | 0 | Derived from active loans |
| weeklyDebtInterest | 0 | Derived from active loans |
| landUseChargeEnforcement | 1.0 | Range 1.0–3.0 |
| grantsCompliance | 0.6 | Range 0.6–1.0; zeroed at 3 freezes |
| civilServiceReformScore | 0 | Tracks reform progress |
| baseOverheads | 0 | Creeps up from godfather compliance |
| subventionCutRate | 0 | Range 0–1 |
| capitalEfficiency | 1 | Multiplier on project build speed |

### Revenue Breakdown (`lastWeekRevenue: RevenueBreakdown`)

Computed each tick by `revenueEngine.ts`. Displayed in the Economy section of StateOfTheState.

| Field | Purpose |
|---|---|
| `paye` | PAYE income tax — scales with infra/security/youth factors |
| `mda` | MDA fees — scales with infra/security factors |
| `luc` | Land Use Charge — scales with enforcement level |
| `other` | Fines, permits, miscellaneous — scales with infra factor |
| `faac` | Federal allocation — penalised by poor federal relationship |
| `grants` | Grant income — zeroed during grant freeze |
| `tourism` | Seasonal tourism revenue — base 0, boosted during Detty December (+0.4/wk), surged by `stateFlags.dettyDecemberSurge` (+1.2/wk) from event choices |
| `total` | Sum of all above |

### Factions (week 1)

| Faction | Default |
|---|---|
| businessCommunity | 55 |
| informalEconomy | 50 |
| partyGodfathers | 65 |
| federalGovt | 48 |
| civilSocietyMedia | 44 |
| lgChairmen | 58 |

### Constituency Approval (week 1, 20 LGAs)

| Constituency | Default | Weight |
|---|---|---|
| alimosho | 38 | 13 |
| ikorodu | 40 | 7 |
| oshodiIsolo | 47 | 6 |
| kosofe | 46 | 6 |
| surulere | 51 | 5 |
| mushin | 45 | 5 |
| lagosMainland | 30 | 5 |
| ikeja | 55 | 5 |
| agege | 40 | 5 |
| badagry | 35 | 5 |
| ojo | 37 | 5 |
| amuwoOdofin | 49 | 4 |
| apapa | 52 | 3 |
| ifakoIjaye | 42 | 4 |
| epe | 38 | 3 |
| ajeromiIfelodun | 33 | 4 |
| shomolu | 48 | 4 |
| lagosIsland | 60 | 4 |
| etiOsa | 62 | 4 |
| ibejuLekki | 55 | 3 |

## State Fields By Phase

### Core

| Field | Type | Purpose |
|---|---|---|
| `week` | `number` | Current week (1–208, or 209–416 in term 2) |
| `stateFlags` | `Record<string, boolean>` | Persistent narrative flags, event gate conditions |
| `stats` | `Record<StatKey, number>` | All numeric game stats (see above) |
| `factions` | `FactionState` | 6 faction relationships (0–100) |
| `constituencyApproval` | `ConstituencyApproval` | Per-LGA approval (0–100), 20 entries |
| `activeEvent` | `EventCard \| null` | Currently displayed event card |
| `eventQueue` | `EventCard[]` | Chained events waiting to fire (priority queue) |
| `pendingDelayed` | `PendingEvent[]` | Delayed consequences waiting to fire |
| `resolvedEvents` | `string[]` | Event IDs that have been resolved (one-shots) |
| `timeline` | `TimelineEntry[]` | Full decision history (used by legacy screen) |

### Term Tracking

| Field | Type | Default | Purpose |
|---|---|---|---|
| `currentTerm` | `number` | `1` | 1 = first term, 2 = second term |
| `choiceUseCounts` | `Record<string, number>` | `{}` | `${eventId}:${choiceId}` — powers diminishing returns |

### Phase 2

| Field | Purpose |
|---|---|
| `deputy` | Chosen deputy governor (`DeputyState \| null`) |
| `fashemuPhase` | dormant → active → warning → break → reconciled → dead |
| `fashemuAskIndex` | Which of 4 ordered Fashemu asks reached |
| `activeNPCs` | `Record<NPCKey, NPCState>` — npc1/npc2/npc3 |
| `commissioners` | `Partial<Record<CommissionerRole, CommissionerState>>` |
| `impeachmentStage` | 0=none, 1=first reading queued, 2=removed |
| `emergencyLoansTaken` | Count of emergency bridge loans (escalates APR) |
| `inCampaignMode` | True from week 195 |
| `primaryScenario` | A/B/C — set by stateFlags; powers primaryBonus() in election formula |
| `lgaElectionResult` | Party loyalty % after week 86 LGA elections |
| `electionResult` | Vote share % from final election |

### Phase 4 — Political Realism

| Field | Type | Default | Purpose |
|---|---|---|---|
| `emergencySuspensionWeeks` | `number` | `0` | Weeks remaining in emergency suspension |
| `administratorActIndex` | `number` | `0` | Which of 5 act texts to show |
| `litigationActive` | `boolean` | `false` | Whether election petition arc is active |
| `litigationTimer` | `number` | `0` | Weeks until `supreme-court-ruling` auto-enqueues |
| `offCycleElection` | `boolean` | `false` | Reserved for rerun election path |

## Archetype Modifiers

| Archetype | Modifiers |
|---|---|
| Technocrat | `cashReserve: 65`, `infrastructureScore: 62`, `politicalCapital: 0`, `partyGodfathers: 30`, `ogunlesi` deputy offered |
| Loyalist | `politicalCapital: 180`, `partyGodfathers: 90`, `publicTrust: 35`, `corruptionPressure: 50`, `hamzat` deputy offered |
| Outsider | `publicTrust: 75`, `civilSocietyMedia: 80`, `cashReserve: 25`, `partyGodfathers: 20`, `falana` deputy offered |

All new fields get defaults in `startingState.ts` and are auto-merged by `{ ...STARTING_STATE, ...rest }` in `persistence.ts`.
