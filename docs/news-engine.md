# News Engine

## Overview

The news engine generates newspaper-style articles from week-to-week state changes. It's purely cosmetic — no gameplay effect, no mechanical consequences. Two systems work together:

1. **`evaluateNews`**: Generates articles for normal tick-by-tick play
2. **`evaluateSkipNews`**: Generates a summary article after fast-forward/simulation
3. **`llmNews`** (optional): Uses a web worker + local LLM to generate dynamic text (currently disabled)

Both are pure functions: `(prev: GameState, next: GameState) => NewsArticle | null`.

## Article Categories

```typescript
type NewsArticle = {
  headline: string
  deck: string
  category: 'fiscal' | 'political' | 'crisis' | 'milestone' | 'background'
  dataPoints: Array<{ label, value, delta?, positive? }>
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

## LLM News Generation (`src/engine/llmNews.ts`)

**Currently disabled** (`LLM_ENABLED = false` in `llmNews.ts:29`).

Architecture:
- Web worker (`src/workers/llmWorker.ts`) loads at runtime
- `buildNewsPrompt()` constructs a prompt from the NewsArticle template, week, and campaign mode flag
- 45-second timeout
- When enabled: potentially heavy — generates one sentence per readable article

## Data Flow

1. `gameLoop.ts:tick()` evaluates news after all state changes
2. `evaluateNews(prev, next)` produces `NewsArticle | null`
3. Result stored in `state.newspaperHeadline`
4. UI reads it from Zustand store (rendered as a sidebar or notification)
5. After fast-forward: `evaluateSkipNews()` produces guaranteed article with stat summary
