import { buildLegacyPrompt, rankDecisions } from '../engine/legacyRanker'
import type { GameState } from '../state/types'
import type { HeadlineSlot } from './headlineTemplates'
import { pickChoiceDrivenHeadlines } from './headlineTemplates'

export type { HeadlineSlot }
export { buildLegacyPrompt }

export type PrimaryNarrative = {
  path: 'A' | 'B' | 'C' | 'uncontested' | 'lost'
  title: string
  summary: string
}

export type LegacyData = {
  headlines: HeadlineSlot[]
  monologue: string
  monologueStyle: 'compliant' | 'reformer' | 'survivor'
  primaryNarrative: PrimaryNarrative
  endorsementSummary: string
  prompt: string
}

// pickHeadlines is superseded by pickChoiceDrivenHeadlines in headlineTemplates.ts
// Kept as a named alias so no other callers break.
function pickHeadlines(state: GameState): HeadlineSlot[] {
  return pickChoiceDrivenHeadlines(state, rankDecisions(state))
}

function pickMonologue(state: GameState): {
  text: string
  style: 'compliant' | 'reformer' | 'survivor'
} {
  const compliance = state.godfatherComplianceCount
  const refusals = state.godfatherRefusalCount
  const trust = state.stats.publicTrust

  if (state.currentTerm === 2) {
    if (state.stats.corruptionPressure >= 70) {
      return {
        style: 'survivor',
        text: `Eight years. The city is different — some of that is my doing, some of it happened despite me. There will be inquiries. Some of what those inquiries find will be accurate. Governance at this scale, under these pressures, is not a clean operation. I made choices about what to protect and what to sacrifice. The books show the cash. What the books cannot show is what it costs to hold a state together when every faction, every godfather, every federal ministry is pulling in a different direction. I served. I would make different choices in some rooms. But I served.`,
      }
    }
    if (state.stats.infrastructureScore >= 65) {
      return {
        style: 'reformer',
        text: `Eight years is a long time to stay honest about what you are doing. I came in with a plan for infrastructure. I am leaving with that plan substantially complete. The metro extension is running. The roads in Alimosho are not what I hoped — that I regret — but the fiscal architecture we built will last longer than any road. My successor inherits something I did not: a state government that people trust with money. That is harder to build than any bridge, and easier to destroy than any road.`,
      }
    }
    return {
      style: compliance >= 3 ? 'compliant' : 'survivor',
      text: `Two terms teaches you things one term cannot. The machine is larger than any individual. What I am proudest of is not what we built — it is that we did not break what we inherited. Lagos came into my hands functioning, fractious, and magnificent. It leaves my hands the same. My successor will face the same machine, the same factions, the same impossible math of a state that wants everything and can fund only half of it. To them I say: the files are clean, the account is settled, and the godfathers are watching. Good luck.`,
    }
  }

  if (compliance >= 3 && refusals <= 1) {
    return {
      style: 'compliant',
      text: `Fellow Lagosians, four years ago I stood here and made promises. I kept most of them — within the constraints that exist in this system. You cannot govern Lagos by pretending those constraints do not exist. I worked with the people who have power because that is the only way to build the roads, the schools, the drainage systems that this city needs. I am not ashamed of it. The work speaks. ${state.stats.infrastructureScore > 50 ? 'The infrastructure score rose under my watch.' : 'We laid foundations others will build on.'} What matters now is what Lagos becomes next.`,
    }
  }

  if (refusals >= 3 || state.fashemuEndingPath === 'B') {
    return {
      style: 'reformer',
      text: `I was told, early in my first week, how things work in Lagos. Who you call. What you owe. I chose a different path. It was not easy. Some of you saw the consequences — the delayed projects, the faction fights, the manufactured crises. But I look at this city today and I see something different from what I inherited. The books are cleaner. The contractors who cannot deliver have lost contracts. ${trust >= 55 ? 'You trusted us with that work, and we honoured that trust.' : 'The work was harder than I expected. But I believe it mattered.'} Lagos is bigger than any network.`,
    }
  }

  return {
    style: 'survivor',
    text: `Four years in government teaches you things no campaign prepares you for. The size of the machine. The depth of what was already in motion before I arrived. I made choices under pressure — some I am proud of, some I would make differently. What I can tell you is that I came to serve, and I served as best I could given what I was handed. ${state.stats.cashReserve >= 10 ? 'The finances are stable.' : 'There is work ahead on the finances.'} To my successor: this city is relentless and magnificent. Treat it with the respect it deserves.`,
  }
}

function pickPrimaryNarrative(state: GameState): PrimaryNarrative {
  if (state.stateFlags['primary-lost']) {
    return {
      path: 'lost',
      title: 'The Primary That Ended It',
      summary: `Hon. Seun Majekodunmi secured the party ticket. Without the LGA delegate base or civil society endorsement needed for a contested primary, the ward counts didn't hold. The re-election bid ended before the general election.`,
    }
  }
  if (state.primaryScenario === 'A') {
    return {
      path: 'A',
      title: 'The Godfather Primary',
      summary: `Chief Fashemu's network delivered the party nomination through coordinated delegate management. The primary was decided in Ikoyi drawing rooms before a single ward voted. Efficient. Owed.`,
    }
  }
  if (state.primaryScenario === 'B') {
    const wasGrassroots = state.stateFlags['primary-b-grassroots']
    return {
      path: 'B',
      title: wasGrassroots ? 'The Grassroots Primary' : 'The Civil Society Primary',
      summary: wasGrassroots
        ? `A contested primary won on LGA delegate votes — ${state.lgaElectionResult?.toFixed(0) ?? '?'}% of LGAs loyal after the midterm elections. The party machinery was against you. The ward structure held.`
        : `A contested primary won through civil society and business community credibility. Neither Fashemu's network nor the ward machine delivered this — reputation did.`,
    }
  }
  if (state.primaryScenario === 'C') {
    return {
      path: 'C',
      title: 'The Open Primary',
      summary: `An open party primary — no godfather endorsement, no guaranteed machine. Won on platform credibility and a reform coalition that held together long enough to secure the ticket.`,
    }
  }
  return {
    path: 'uncontested',
    title: 'No Primary Contested',
    summary: `The re-election campaign reached the general election without a primary contest being formally resolved.`,
  }
}

function buildEndorsementSummary(state: GameState): string {
  const { businessCommunity, civilSocietyMedia, lgChairmen, informalEconomy, partyGodfathers } =
    state.factions
  const parts: string[] = []

  if (businessCommunity >= 60) parts.push('Business community backing strong')
  else if (businessCommunity <= 35) parts.push('Business community withdrew support')

  if (civilSocietyMedia >= 60) parts.push('civil society endorsed')
  else if (civilSocietyMedia <= 35) parts.push('civil society hostile')

  if (lgChairmen >= 65) parts.push('LG chairmen mobilised')
  else if (lgChairmen <= 35) parts.push('LG chairmen defected')

  if (informalEconomy >= 60) parts.push('informal economy networks active')
  else if (informalEconomy <= 30) parts.push('informal economy disengaged')

  if (partyGodfathers >= 50) parts.push('party structure cooperative')
  else parts.push('party structure fractured')

  if (parts.length === 0) return 'No clear bloc endorsed or opposed the administration.'
  return `${parts.join('; ')}.`
}

export function buildLegacy(state: GameState): LegacyData {
  const headlines = pickHeadlines(state)
  const { text, style } = pickMonologue(state)
  const primaryNarrative = pickPrimaryNarrative(state)
  const endorsementSummary = buildEndorsementSummary(state)
  const prompt = buildLegacyPrompt(state)
  return {
    headlines,
    monologue: text,
    monologueStyle: style,
    primaryNarrative,
    endorsementSummary,
    prompt,
  }
}
