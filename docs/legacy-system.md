# Legacy System — End-Game Valedictory

## Overview

The legacy system ranks the player's top 10 most consequential decisions and assembles a state-derived valedictory address from ranked key moments. It's used on the LegacyScreen after game over or term end.

**As of the ending redesign, all game-over states (not just term-end) show a state-derived narrative ending.** See `src/engine/endingNarrator.ts` and `docs/game-over.md#ending-narrator`.

Source: `src/engine/legacyRanker.ts`

## Decision Ranking (`rankDecisions`)

1. Filters timeline entries to type `'event'` only
2. Computes a `magnitude` score for each:
   - Sum of absolute values of all `statDelta` fields
   - Plus 0.5× sum of absolute values of all `factionDelta` fields
3. Sorts descending by magnitude
4. Returns top 10

### Example magnitude calculation
A choice with `{ publicTrust: 10, cashReserve: -5 }` and `{ civilSocietyMedia: 8 }`:
- statScore = |10| + |-5| = 15
- factionScore = |8| = 8 → 8 × 0.5 = 4
- magnitude = 19

## Valedictory Address (`buildLegacy`)

Assembles a state-derived address from player data:

1. **Administration header**: terms served, election outcome, final trust, infra score, cash position
2. **Godfather summary**: compliance rate (e.g., "3/7 godfather asks accepted")
3. **Top 10 decisions**: each with week number, title, label chosen, and stat effects in English
4. **Active flags**: narrative flags converted to readable labels (e.g., `makoko-demolished` → "Ordered the demolition and resettlement of the Makoko waterfront community")
5. **Tone guidance**: based on fashemu ending path and compliance/refusal ratio (see below)
6. **Output format**: exactly 3 paragraphs (60–90 words each), beginning with "Fellow Lagosians"

## Tone Guidance

| Condition | Tone |
|---|---|
| `fashemuEndingPath === 'D'` | Weighted, something unnamed beneath the surface |
| `compliance >= 3` AND `refusals <= 1` | Careful, measured, things left unsaid |
| `refusals >= 3` OR `fashemuEndingPath === 'B'` | Direct, bruised, proud without boasting |
| Default | Pragmatic survivor, knows what compromises were made |

## Flag Labels (FLAG_LABELS in legacyRanker.ts)

Each narrative `stateFlags` key maps to a legacy-line description:

| Flag | Legacy Text |
|---|---|
| `lekki-acknowledged` | Formally acknowledged the 2020 Lekki toll gate events and created a survivor fund |
| `blue-line-opened` | Funded and opened the Lagos Metro Blue Line before leaving office |
| `blue-line-incomplete` | Left the Blue Line's final 4km unfinished for the incoming administration |
| `school-collapse-prosecuted` | Prosecuted the Ojota school collapse contractor for criminal negligence |
| `makoko-demolished` | Ordered the demolition and resettlement of the Makoko waterfront community |
| `ghost-purge-resolved` | Resolved the ghost worker crisis through a biometric audit |
| `populist-shield-succeeded` | Successfully used popular mobilisation to stop an assembly removal attempt |
| `legal-challenge-succeeded` | Won a Federal High Court challenge to an emergency suspension |
| `primary-a` | Won the party primary through Chief Fashemu's godfather network |
| `primary-b` | Won a contested party primary |
| `primary-c` | Won an open party primary without godfather endorsement |
| `primary-lost` | Lost the party primary to Hon. Seun Majekodunmi |

There are ~30 defined labels in `FLAG_LABELS` covering: infrastructure, elections, EFCC, handover, valedictory tone, civil service, party politics, and scandal flags. See `src/engine/legacyRanker.ts:50-89` for the full list.

## Data Flow

### Ending Path (all game-over types)

1. `checkGameOver` detects exit condition → `endGame(next, gameOverType, reason)` called
2. `buildEndingNarrative(state, gameOverType)` pre-computes the evocative passage from state + timeline
3. `gameOverType` and `endingNarrative` set on state
4. App.tsx renders `LegacyScreen` for any `isGameOver === true`
5. LegacyScreen shows: narrative passage → verdict headline → key moments → scorecard

### Legacy Path (term-end only, within LegacyScreen)

1. `buildLegacy(state)` is called from `src/data/legacy.ts`
2. LegacyScreen renders: legacy headlines (flag-based), governor's final address (LLM or fallback monologue), election journey
3. If LLM text generation fails (or is disabled), the flag-based narrative + stat summary is shown instead

## LLM Integration (Optional)

- `buildLegacyPrompt()` returns a formatted prompt string
- The UI can send this to an external LLM API to generate the valedictory address
- The prompt is self-contained: it has all the data the LLM needs to write in-character
- No LLM call is made inside the game engine — the prompt is displayed for optional external use
