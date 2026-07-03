# News Engine

## Overview

The news engine generates newspaper-style articles from week-to-week state changes. Each article is published by one of six competing publications, each with its own editorial slant and small gameplay effects. Two systems work together:

1. **`evaluateNews`**: Generates articles for normal tick-by-tick play
2. **`evaluateSkipNews`**: Generates a summary article after fast-forward/simulation

Both `evaluateNews` and `evaluateSkipNews` are pure functions: `(prev: GameState, next: GameState) => NewsArticle | null`.

## Article Categories

```typescript
type NewsArticle = {
  headline: string
  deck: string
  category: 'fiscal' | 'political' | 'crisis' | 'milestone' | 'background'
  dataPoints: Array<{ label, value, delta?, positive? }>
  // Set by publicationEngine — adds editorial framing
  publicationId?: string
  framingCaption?: string
  framingEditorialNote?: string
}
```

## evaluateNews (`src/engine/evaluateNews.ts`)

Four analysts run every tick, highest-scoring article wins:

### 1. Stat Analyst (`statAnalyst`)
Triggers on significant one-week stat changes:
- Cash drop > ₦5bn → fiscal article
- Cash goes negative → crisis article (score: 7)
- Trust swing > 5pts → political article
- Corruption spike > 5pts → political article
- Infrastructure drop > 3pts → background article
- Revenue swing > ₦8bn → fiscal article

### 2. Trend Analyst (`trendAnalyst`)
Looks at constituency approval history (8-week sliding window):
- 3+ LGAs gaining > 3pts in a week → political article
- 3+ LGAs losing > 3pts → political article
- Widening gap between best/worst LGA (> 10pts) → political article
- Weighted approval swing > 3pts → political article

### 3. Composite Analyst (`compositeAnalyst`)
Detects state transitions and milestones:
- Milestone weeks (26, 52, 78, 104, 130, 156, 182, 208) → milestone article
- Campaign mode activated → milestone (score: 7)
- Emergency suspension started → crisis (score: 7)
- Litigation activated → crisis (score: 7)
- Impeachment stage change → crisis (score: 7)
- Riot mode activated → crisis (score: 7)
- Grant freeze started → crisis (score: 7)
- LGA election held → milestone (score: 8)
- Election result → milestone (score: 8)
- Primary result → milestone (score: 7)

### 4. Timeline Analyst (`timelineAnalyst`)
Looks at the most recent event/godfather timeline entry and converts it to headlines. Lower priority unless impact is large.

### Winner Selection
- Composite articles with score ≥ 5 always win
- Otherwise: highest-scoring among stat/trend/timeline analysts
- Delayed consequences firing in the tick boost score by 2
- Articles with score < 4 are suppressed (null returned)

## evaluateSkipNews (`evaluateSkipNews`)

Generates a recap article after fast-forward. Always returns an article (never null). Prioritises in order:
1. Emergency suspension declared → crisis
2. Riot started → crisis
3. Cash went negative → crisis
4. Large cash drawdown → fiscal
5. Trust change > 8pts → political
6. Event count ≥ 4 → background
7. Default: "Lagos Holds Course" → background

## Publication System (`src/data/publications.ts` + `src/engine/publicationEngine.ts`)

After an article is selected by `evaluateNews`, the game loop selects a publication and attaches framing.

### Six Publications

| Publication | Bias | Coverage | Gameplay Effect |
|---|---|---|---|
| **Punch** | Hostile-sensational | crisis, political, background | −0.7 trust |
| **Vanguard** | Aligned-broad | ALL categories | +0.5 trust |
| **The Nation** | Loyalist | crisis, political, background | +0.3 trust, +0.5 godfathers |
| **Guardian** | Skeptical | crisis, political, fiscal | −0.3 trust |
| **Business Day** | Neutral-fiscal | fiscal | +1 business community |
| **Daily Trust** | Neutral-broad | crisis, political, background | none |

### State-Weighted Selection

Publication weights are modified by game conditions:
- **Riot active**: Punch ×3, Guardian ×2
- **Emergency suspension**: Punch ×4, Guardian ×2, Daily Trust ×1.5
- **Corruption > 60**: Punch ×2, Daily Trust ×2
- **Cash < −10**: Business Day ×2.5
- **Trust < 30**: Vanguard ×1.8, The Nation ×2

If no publication covers an article's category, Vanguard (covers all) is the fallback.

### Framing Variants

Each publication has 2–3 (caption, editorialNote) pairs per covered category. `pickFramingVariant` selects randomly. The caption appears as a colored badge above the headline; the editorial note appears as italic text below the deck.

### Cooldown

A 2-week minimum gap is enforced between non-crisis, non-milestone articles. The `lastNewsWeek` field on `GameState` tracks the most recent publication week. Crisis and milestone articles always bypass the cooldown.

## Data Flow

1. `gameLoop.ts:tick()` evaluates news after all state changes
2. `evaluateNews(prev, next)` produces `NewsArticle | null`
3. If article exists and passes cooldown check, `selectPublicationForArticle` picks a publication
4. `pickFramingVariant` attaches caption + editorial note
5. Publication's gameplay effect is applied via `applyDelta`/`applyFactionDeltaState`
6. Article stored in `state.newspaperHeadline`, `state.lastNewsWeek` updated to current week
7. UI reads from Zustand store; LagosHerald component renders publication name/color, caption badge, and editorial note
8. After fast-forward: `evaluateSkipNews()` produces guaranteed article with stat summary
