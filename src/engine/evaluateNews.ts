import type { ConstituencyKey, GameState, NewsArticle } from '../state/types'

type AnalystResult = {
  score: number
  headline: string
  deck: string
  category: NewsArticle['category']
  dataPoints: NewsArticle['dataPoints']
} | null

const CONSTITUENCY_TRUST_WEIGHTS: Record<string, number> = {
  alimosho: 13,
  oshodiIsolo: 6,
  mushin: 5,
  kosofe: 6,
  surulere: 5,
  amuwoOdofin: 4,
  apapa: 3,
  lagosMainland: 5,
  ikeja: 5,
  agege: 5,
  ifakoIjaye: 4,
  ikorodu: 7,
  badagry: 5,
  ojo: 5,
  epe: 3,
  ajeromiIfelodun: 4,
  shomolu: 4,
  lagosIsland: 4,
  etiOsa: 4,
  ibejuLekki: 3,
}

function weightedApproval(state: GameState): number {
  const totalWeight = Object.values(CONSTITUENCY_TRUST_WEIGHTS).reduce((s, w) => s + w, 0)
  const weighted = (Object.entries(CONSTITUENCY_TRUST_WEIGHTS) as [string, number][]).reduce(
    (sum, [key, w]) => sum + w * (state.constituencyApproval[key as ConstituencyKey] ?? 50),
    0,
  )
  return weighted / totalWeight
}

function statAnalyst(prev: GameState, next: GameState): AnalystResult {
  const cashDelta = next.stats.cashReserve - prev.stats.cashReserve
  const trustDelta = next.stats.publicTrust - prev.stats.publicTrust
  const corrDelta = next.stats.corruptionPressure - prev.stats.corruptionPressure
  const infraDelta = next.stats.infrastructureScore - prev.stats.infrastructureScore
  const prevRev = prev.lastWeekRevenue?.total ?? 0
  const nextRev = next.lastWeekRevenue?.total ?? 0
  const revDelta = nextRev - prevRev
  const prevExp = prev.lastWeekExpenditure?.total ?? 0
  const nextExp = next.lastWeekExpenditure?.total ?? 0
  const expDelta = nextExp - prevExp

  const candidates: AnalystResult[] = []

  if (cashDelta < -5) {
    candidates.push({
      score: 6,
      headline: `Cash Reserve Down \u20A6${Math.abs(cashDelta).toFixed(1)}bn in Single Week`,
      deck: `The state treasury contracted by \u20A6${Math.abs(cashDelta).toFixed(1)}bn this week, reflecting persistent spending pressure against revenue collection.`,
      category: 'fiscal',
      dataPoints: [
        {
          label: 'Cash Reserve',
          value: `\u20A6${next.stats.cashReserve.toFixed(1)}bn`,
          delta: `${cashDelta.toFixed(1)}bn`,
          positive: false,
        },
        {
          label: 'Revenue',
          value: `\u20A6${nextRev.toFixed(1)}bn`,
          delta: revDelta !== 0 ? `${revDelta > 0 ? '+' : ''}${revDelta.toFixed(1)}bn` : undefined,
          positive: revDelta > 0,
        },
        {
          label: 'Expenditure',
          value: `\u20A6${nextExp.toFixed(1)}bn`,
          delta: expDelta !== 0 ? `${expDelta > 0 ? '+' : ''}${expDelta.toFixed(1)}bn` : undefined,
          positive: expDelta < 0,
        },
      ],
    })
  } else if (prev.stats.cashReserve >= 0 && next.stats.cashReserve < 0) {
    candidates.push({
      score: 7,
      headline: 'Lagos Treasury in the Red',
      deck: `Cash reserves have fallen below zero for the first time this term. The state is drawing on credit lines to meet obligations.`,
      category: 'crisis',
      dataPoints: [
        {
          label: 'Cash Reserve',
          value: `\u20A6${next.stats.cashReserve.toFixed(1)}bn`,
          delta: `${cashDelta.toFixed(1)}bn`,
          positive: false,
        },
      ],
    })
  }

  if (trustDelta < -5) {
    candidates.push({
      score: 5,
      headline: `Public Trust Drops ${Math.abs(trustDelta).toFixed(0)} Points`,
      deck: `Governor approval slipped ${Math.abs(trustDelta).toFixed(0)} points this week as political pressures continue to erode public confidence.`,
      category: 'political',
      dataPoints: [
        {
          label: 'Public Trust',
          value: `${next.stats.publicTrust.toFixed(0)}%`,
          delta: `${trustDelta.toFixed(0)}pts`,
          positive: false,
        },
      ],
    })
  } else if (trustDelta > 5) {
    candidates.push({
      score: 4,
      headline: `Public Trust Rises ${trustDelta.toFixed(0)} Points`,
      deck: `The governor\u2019s approval rating climbed ${trustDelta.toFixed(0)} points this week, signalling improving sentiment among Lagosians.`,
      category: 'political',
      dataPoints: [
        {
          label: 'Public Trust',
          value: `${next.stats.publicTrust.toFixed(0)}%`,
          delta: `+${trustDelta.toFixed(0)}pts`,
          positive: true,
        },
      ],
    })
  }

  if (corrDelta > 5) {
    candidates.push({
      score: 5,
      headline: `Corruption Pressure Spikes ${Math.abs(corrDelta).toFixed(0)} Points`,
      deck: `Corruption indicators rose sharply this week. Civil society groups are beginning to take notice.`,
      category: 'political',
      dataPoints: [
        {
          label: 'Corruption Pressure',
          value: `${next.stats.corruptionPressure.toFixed(0)}`,
          delta: `+${corrDelta.toFixed(0)}`,
          positive: false,
        },
      ],
    })
  }

  if (infraDelta < -3) {
    candidates.push({
      score: 4,
      headline: `Infrastructure Declines ${Math.abs(infraDelta).toFixed(0)} Points`,
      deck: `The state\u2019s infrastructure score fell by ${Math.abs(infraDelta).toFixed(0)} this week as maintenance spending lags behind decay.`,
      category: 'background',
      dataPoints: [
        {
          label: 'Infrastructure',
          value: `${next.stats.infrastructureScore.toFixed(0)}/100`,
          delta: `${infraDelta.toFixed(0)}pts`,
          positive: false,
        },
      ],
    })
  }

  if (Math.abs(revDelta) > 8) {
    candidates.push({
      score: 6,
      headline: `Revenue Swings \u20A6${Math.abs(revDelta).toFixed(1)}bn Week-on-Week`,
      deck: `Lagos recorded a sharp ${revDelta > 0 ? 'increase' : 'decline'} in weekly revenue, driven largely by FAAC volatility and collection efficiency.`,
      category: 'fiscal',
      dataPoints: [
        {
          label: 'Revenue Swing',
          value: `\u20A6${nextRev.toFixed(1)}bn`,
          delta: `${revDelta > 0 ? '+' : ''}${revDelta.toFixed(1)}bn`,
          positive: revDelta > 0,
        },
      ],
    })
  }

  if (candidates.length === 0) return null
  const sorted = candidates
    .filter((c): c is NonNullable<typeof c> => true)
    .sort((a, b) => b.score - a.score)
  return sorted[0]
}

function trendAnalyst(prev: GameState, next: GameState): AnalystResult {
  const keys = Object.keys(next.approvalHistory) as ConstituencyKey[]
  const deltas: { key: ConstituencyKey; delta: number }[] = []
  for (const key of keys) {
    const h = next.approvalHistory[key]
    if (h.length < 2) continue
    const delta = (h.at(-1) ?? 0) - (h.at(-2) ?? 0)
    deltas.push({ key, delta })
  }
  if (deltas.length < 2) return null

  const gainers = deltas.filter((d) => d.delta > 3)
  const losers = deltas.filter((d) => d.delta < -3)

  const candidates: AnalystResult[] = []

  if (gainers.length >= 3) {
    candidates.push({
      score: 5,
      headline: `${gainers.length} LGAs Show Strong Approval Gains`,
      deck: `${gainers.length} local government areas recorded approval gains exceeding 3 points this week, suggesting improving grassroots sentiment.`,
      category: 'political',
      dataPoints: gainers.slice(0, 3).map((d) => ({
        label: d.key,
        value: `+${d.delta.toFixed(0)}pts`,
        positive: true,
      })),
    })
  }

  if (losers.length >= 3) {
    candidates.push({
      score: 5,
      headline: `${losers.length} LGAs Slide This Week`,
      deck: `${losers.length} local government areas saw approval drop by more than 3 points, indicating growing dissatisfaction in key districts.`,
      category: 'political',
      dataPoints: losers.slice(0, 3).map((d) => ({
        label: d.key,
        value: `${d.delta.toFixed(0)}pts`,
        positive: false,
      })),
    })
  }

  const maxGain = Math.max(...deltas.map((d) => d.delta))
  const maxLoss = Math.min(...deltas.map((d) => d.delta))
  if (maxGain - maxLoss > 10) {
    candidates.push({
      score: 4,
      headline: 'Growing Divide Between Lagos LGAs',
      deck: `The gap between the best and worst-performing districts has widened to ${(maxGain - maxLoss).toFixed(0)} points, signalling uneven governance outcomes across the state.`,
      category: 'political',
      dataPoints: [
        { label: 'Widest gap', value: `${(maxGain - maxLoss).toFixed(0)}pts`, positive: false },
      ],
    })
  }

  const prevWeighted = weightedApproval(prev)
  const nextWeighted = weightedApproval(next)
  const weightedDelta = nextWeighted - prevWeighted
  if (Math.abs(weightedDelta) > 3) {
    candidates.push({
      score: 5,
      headline: 'Constituency Mood Shifts Across Lagos',
      deck: `The constituency-weighted approval average moved ${weightedDelta > 0 ? 'up' : 'down'} by ${Math.abs(weightedDelta).toFixed(1)} points this week, reflecting a broad shift in public sentiment.`,
      category: 'political',
      dataPoints: [
        {
          label: 'Weighted Avg.',
          value: `${nextWeighted.toFixed(1)}%`,
          delta: `${weightedDelta > 0 ? '+' : ''}${weightedDelta.toFixed(1)}pts`,
          positive: weightedDelta > 0,
        },
      ],
    })
  }

  if (candidates.length === 0) return null
  const sorted2 = candidates
    .filter((c): c is NonNullable<typeof c> => true)
    .sort((a, b) => b.score - a.score)
  return sorted2[0]
}

function compositeAnalyst(prev: GameState, next: GameState): AnalystResult {
  const candidates: AnalystResult[] = []

  const milestoneWeeks = [26, 52, 78, 104, 130, 156, 182, 208]
  if (milestoneWeeks.includes(next.week)) {
    candidates.push({
      score: 5,
      headline: `Week ${next.week} — A Governance Milestone`,
      deck: `The administration has reached week ${next.week} of its term. A moment for reflection on progress and setbacks.`,
      category: 'milestone',
      dataPoints: [{ label: 'Term Week', value: `${next.week}`, positive: undefined }],
    })
  }

  if (prev.inCampaignMode !== next.inCampaignMode && next.inCampaignMode) {
    candidates.push({
      score: 7,
      headline: 'Election Campaign Mode Activated',
      deck: 'With 13 weeks until the election, official campaign activities have begun. Every decision from here carries electoral weight.',
      category: 'milestone',
      dataPoints: [{ label: 'Mode', value: 'Campaign', positive: undefined }],
    })
  }

  if (prev.emergencySuspensionWeeks === 0 && next.emergencySuspensionWeeks > 0) {
    candidates.push({
      score: 7,
      headline: 'Federal Government Declares Emergency in Lagos',
      deck: 'The presidency has invoked emergency powers, placing Lagos under federal administrator control. Executive authority is suspended.',
      category: 'crisis',
      dataPoints: [{ label: 'Status', value: 'Emergency Rule', positive: false }],
    })
  }

  if (prev.litigationActive !== next.litigationActive && next.litigationActive) {
    candidates.push({
      score: 7,
      headline: 'Election Petition Filed at Tribunal',
      deck: 'A legal challenge to the validity of the election has been filed. The tribunal will hear arguments in the coming weeks.',
      category: 'crisis',
      dataPoints: [{ label: 'Litigation', value: 'Active', positive: false }],
    })
  }

  if (prev.impeachmentStage !== next.impeachmentStage && next.impeachmentStage > 0) {
    candidates.push({
      score: 7,
      headline: 'Impeachment Proceedings Initiated',
      deck: 'The Lagos State House of Assembly has begun proceedings against the governor. The political stakes are now existential.',
      category: 'crisis',
      dataPoints: [{ label: 'Stage', value: `Stage ${next.impeachmentStage}`, positive: false }],
    })
  }

  if (prev.riotModeActive !== next.riotModeActive && next.riotModeActive) {
    candidates.push({
      score: 7,
      headline: 'Civil Unrest — Riot Mode Declared',
      deck: 'Youth tension has crossed the critical threshold. Normal governance is suspended until order is restored.',
      category: 'crisis',
      dataPoints: [{ label: 'Status', value: 'Riot Mode', positive: false }],
    })
  }

  if (prev.grantFreezeDuration === 0 && next.grantFreezeDuration > 0) {
    candidates.push({
      score: 7,
      headline: 'International Grants Suspended',
      deck: 'Sustained corruption indicators have triggered a freeze on international development grants. Lagos loses access to external funding.',
      category: 'crisis',
      dataPoints: [
        { label: 'Grant Freeze', value: `${next.grantFreezeDuration} weeks`, positive: false },
      ],
    })
  }

  if (prev.lgaElectionHeld !== next.lgaElectionHeld && next.lgaElectionHeld) {
    const result = next.lgaElectionResult ?? 0
    candidates.push({
      score: 8,
      headline: `LGA Elections: Party Wins ${result.toFixed(0)}% of LGAs`,
      deck: `Local government elections have concluded. The party-aligned chairman count gives a ${result.toFixed(0)}% loyalty score across the 20 LGAs.`,
      category: 'milestone',
      dataPoints: [{ label: 'Party LGAs', value: `${result.toFixed(0)}%`, positive: result >= 50 }],
    })
  }

  if (prev.electionResult === null && next.electionResult !== null) {
    const won = next.reElected
    candidates.push({
      score: 8,
      headline: won ? 'Governor Wins Re-Election' : 'Governor Defeated at the Polls',
      deck: won
        ? `With ${next.electionResult.toFixed(1)}% of the vote, the governor secures a second term.`
        : `The governor received ${next.electionResult.toFixed(1)}% of the vote, falling short of the threshold for re-election.`,
      category: 'milestone',
      dataPoints: [
        {
          label: 'Vote Share',
          value: `${next.electionResult.toFixed(1)}%`,
          positive: won ?? false,
        },
      ],
    })
  }

  if (prev.primaryWon === null && next.primaryWon !== null) {
    candidates.push({
      score: 7,
      headline: next.primaryWon ? 'Governor Wins Party Primary' : 'Governor Loses Party Primary',
      deck: next.primaryWon
        ? 'The governor has secured the party nomination for the upcoming election.'
        : 'The party has chosen a different candidate. The governor\u2019s re-election bid ends here.',
      category: 'milestone',
      dataPoints: [
        {
          label: 'Primary Result',
          value: next.primaryWon ? 'Won' : 'Lost',
          positive: next.primaryWon,
        },
      ],
    })
  }

  if (!next.isGameOver && prev.isGameOver !== next.isGameOver) {
    // handled below
  }

  if (candidates.length === 0) return null
  const sorted3 = candidates
    .filter((c): c is NonNullable<typeof c> => true)
    .sort((a, b) => b.score - a.score)
  return sorted3[0]
}

function timelineAnalyst(prev: GameState, next: GameState): AnalystResult {
  const entry = [...next.timeline]
    .reverse()
    .find((e) => (e.type === 'event' || e.type === 'godfather') && e.week === prev.week)

  if (!entry) return null

  const deltas = Object.values(entry.statDelta ?? {}) as number[]
  const maxImpact = deltas.length > 0 ? Math.max(...deltas.map(Math.abs)) : 0
  const score = entry.type === 'godfather' ? 6 : maxImpact > 5 ? 6 : maxImpact > 3 ? 5 : 3

  const category: NewsArticle['category'] =
    entry.type === 'godfather'
      ? 'political'
      : (entry.statDelta?.cashReserve ?? 0) < -3
        ? 'fiscal'
        : 'background'

  const significantDeltas = Object.entries(entry.statDelta ?? {})
    .filter(([, v]) => Math.abs(v as number) > 1)
    .slice(0, 3)
    .map(([k, v]) => ({
      label: k,
      value: `${(v as number) > 0 ? '+' : ''}${(v as number).toFixed(1)}`,
      positive: (v as number) > 0,
    }))

  return {
    score,
    headline: entry.title,
    deck: entry.description,
    category,
    dataPoints: significantDeltas,
  }
}

function mergeDataPoints(sources: AnalystResult[]): NewsArticle['dataPoints'] {
  const seen = new Set<string>()
  const result: NewsArticle['dataPoints'] = []
  for (const src of sources) {
    if (!src) continue
    for (const dp of src.dataPoints) {
      if (!seen.has(dp.label)) {
        seen.add(dp.label)
        result.push(dp)
        if (result.length >= 5) return result
      }
    }
  }
  return result
}

// Generates a recap article after a fast-forward skip. Always returns an article.
export function evaluateSkipNews(
  prev: GameState,
  next: GameState,
  weeksSkipped: number,
): NewsArticle {
  const cashDelta = next.stats.cashReserve - prev.stats.cashReserve
  const trustDelta = next.stats.publicTrust - prev.stats.publicTrust
  const corrDelta = next.stats.corruptionPressure - prev.stats.corruptionPressure

  const skipEntries = next.timeline.filter((e) => e.week > prev.week && e.week <= next.week)
  const eventCount = skipEntries.filter((e) => e.type === 'event').length

  const wentNegative = prev.stats.cashReserve >= 0 && next.stats.cashReserve < 0
  const riotStarted = !prev.riotModeActive && next.riotModeActive
  const emergencyStarted = prev.emergencySuspensionWeeks === 0 && next.emergencySuspensionWeeks > 0

  let headline: string
  let deck: string
  let category: NewsArticle['category']

  if (emergencyStarted) {
    headline = `${weeksSkipped} Weeks Later: Federal Emergency Rule Declared`
    deck = `While the simulation ran, the federal government invoked emergency powers over Lagos State. Immediate intervention required.`
    category = 'crisis'
  } else if (riotStarted) {
    headline = `${weeksSkipped}-Week Summary: Civil Unrest Erupted`
    deck = `Youth tension boiled over during the period. Riot conditions are now active — normal governance is suspended.`
    category = 'crisis'
  } else if (wentNegative) {
    headline = `${weeksSkipped}-Week Summary: Treasury Falls Into Deficit`
    deck = `Cash reserves turned negative over the ${weeksSkipped}-week period. Fiscal intervention is urgently needed.`
    category = 'crisis'
  } else if (cashDelta < -10) {
    headline = `${weeksSkipped} Weeks: Treasury Down ₦${Math.abs(cashDelta).toFixed(1)}bn`
    deck = `The state treasury contracted by ₦${Math.abs(cashDelta).toFixed(1)}bn across ${weeksSkipped} weeks of continued spending pressure.`
    category = 'fiscal'
  } else if (trustDelta < -8) {
    headline = `${weeksSkipped}-Week Recap: Approval Slides ${Math.abs(trustDelta).toFixed(0)} Points`
    deck = `Public support eroded steadily. Key districts showed significant dissatisfaction across the simulated period.`
    category = 'political'
  } else if (trustDelta > 8) {
    headline = `${weeksSkipped}-Week Recap: Trust Climbs ${trustDelta.toFixed(0)} Points`
    deck = `Public approval improved across the board. The administration gained meaningful goodwill during the period.`
    category = 'political'
  } else if (eventCount >= 4) {
    headline = `${weeksSkipped} Weeks — ${eventCount} Events Resolved`
    deck = `The administration handled ${eventCount} decisions during the simulated period. Outcomes varied by choice.`
    category = 'background'
  } else {
    headline = `${weeksSkipped}-Week Recap: Lagos Holds Course`
    deck = `No major crises emerged. The administration continued on its established trajectory across the simulated period.`
    category = 'background'
  }

  const dataPoints: NewsArticle['dataPoints'] = []

  if (Math.abs(cashDelta) > 0.5) {
    dataPoints.push({
      label: 'Cash Reserve',
      value: `₦${next.stats.cashReserve.toFixed(1)}bn`,
      delta: `${cashDelta >= 0 ? '+' : ''}${cashDelta.toFixed(1)}bn`,
      positive: cashDelta >= 0,
    })
  }

  if (Math.abs(trustDelta) > 0.5) {
    dataPoints.push({
      label: 'Public Trust',
      value: `${next.stats.publicTrust.toFixed(0)}%`,
      delta: `${trustDelta >= 0 ? '+' : ''}${trustDelta.toFixed(0)}pts`,
      positive: trustDelta >= 0,
    })
  }

  if (eventCount > 0) {
    dataPoints.push({ label: 'Events Resolved', value: `${eventCount}`, positive: undefined })
  }

  if (Math.abs(corrDelta) > 2) {
    dataPoints.push({
      label: 'Corruption Pressure',
      value: `${next.stats.corruptionPressure.toFixed(0)}`,
      delta: `${corrDelta >= 0 ? '+' : ''}${corrDelta.toFixed(0)}`,
      positive: corrDelta < 0,
    })
  }

  const lastPlayerEvent = [...skipEntries].reverse().find((e) => e.type === 'event')
  if (lastPlayerEvent && dataPoints.length < 5) {
    dataPoints.push({ label: 'Last Event', value: lastPlayerEvent.title, positive: undefined })
  }

  return { headline, deck, category, dataPoints }
}

export function evaluateNews(prev: GameState, next: GameState): NewsArticle | null {
  const statResult = statAnalyst(prev, next)
  const trendResult = trendAnalyst(prev, next)
  const compositeResult = compositeAnalyst(prev, next)
  const timelineResult = timelineAnalyst(prev, next)

  const delayedFired = prev.pendingDelayed.length > next.pendingDelayed.length

  if (compositeResult && compositeResult.score >= 5) {
    return {
      headline: compositeResult.headline,
      deck: compositeResult.deck,
      category: compositeResult.category,
      dataPoints: mergeDataPoints([compositeResult, statResult, trendResult, timelineResult]),
    }
  }

  const candidates: AnalystResult[] = [statResult, trendResult, timelineResult].filter(Boolean)
  if (candidates.length === 0)
    return compositeResult && compositeResult.score >= 4 ? compositeResult : null

  candidates.sort((a, b) => (b?.score ?? 0) - (a?.score ?? 0))
  const best = candidates[0]
  if (!best) return null
  let finalScore = best.score
  if (delayedFired && finalScore >= 3 && finalScore < 7) {
    finalScore = Math.min(finalScore + 2, 9)
  }

  if (finalScore < 4) return null

  const deck =
    delayedFired && best.score >= 3
      ? 'The consequences of prior decisions are now taking effect. ' +
        best.deck.charAt(0).toLowerCase() +
        best.deck.slice(1)
      : best.deck

  return {
    headline: best.headline,
    deck,
    category: best.category,
    dataPoints: mergeDataPoints([
      best,
      statResult !== best ? statResult : null,
      trendResult !== best ? trendResult : null,
      timelineResult !== best ? timelineResult : null,
    ]),
  }
}
