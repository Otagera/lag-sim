import type { GameState } from '../state/types'

export type HeadlineSlot = {
  key: string
  headline: string
  subhead: string
}

export type LegacyData = {
  headlines: HeadlineSlot[]
  monologue: string
  monologueStyle: 'compliant' | 'reformer' | 'survivor'
}

function pickHeadlines(state: GameState): HeadlineSlot[] {
  const headlines: HeadlineSlot[] = []

  // Infrastructure headline
  if (state.stats.infrastructureScore >= 65) {
    headlines.push({
      key: 'infrastructure',
      headline: 'Lagos Infrastructure Scorecard: Highest in 20 Years',
      subhead: `Governor leaves office with infrastructure rating at ${state.stats.infrastructureScore.toFixed(0)}/100 — roads, water, and transit all show measurable improvement.`,
    })
  } else if (state.stats.infrastructureScore >= 45) {
    headlines.push({
      key: 'infrastructure',
      headline: 'Mixed Record on Lagos Infrastructure',
      subhead: `Outgoing Governor cites "significant progress" but critics point to persistent gaps. Infrastructure score: ${state.stats.infrastructureScore.toFixed(0)}/100.`,
    })
  } else {
    headlines.push({
      key: 'infrastructure',
      headline: 'Lagos Roads Rank Among Nigeria\'s Worst-Maintained',
      subhead: `A term defined by deferred maintenance. Infrastructure score fell to ${state.stats.infrastructureScore.toFixed(0)}/100 under outgoing administration.`,
    })
  }

  // Godfather / political headline
  if (state.fashemuEndingPath === 'B' || state.godfatherRefusalCount >= 4) {
    headlines.push({
      key: 'godfather',
      headline: 'The Governor Who Broke the Godfather Machine',
      subhead: 'Rare in Lagos politics: an executive who refused every patronage demand. The cost was real. So was the independence.',
    })
  } else if (state.fashemuEndingPath === 'C') {
    headlines.push({
      key: 'godfather',
      headline: 'Former Governor Cooperated With EFCC on Fashemu File — Sources',
      subhead: 'A complex legacy: the governor who worked inside the system to expose it.',
    })
  } else if (state.fashemuEndingPath === 'D') {
    headlines.push({
      key: 'godfather',
      headline: 'With Fashemu Gone, Lagos Enters New Political Era',
      subhead: 'The death of Chief B.O.A. Fashemu leaves a power vacuum. Three lieutenants are already positioning.',
    })
  } else if (state.godfatherComplianceCount >= 3) {
    headlines.push({
      key: 'godfather',
      headline: 'Outgoing Governor Returns to Private Life in Arrangement Critics Call a "Managed Exit"',
      subhead: "Chief Fashemu's network is said to be backing the Governor's preferred successor.",
    })
  } else {
    headlines.push({
      key: 'godfather',
      headline: 'Governor Navigates Four Years Between Party Factions',
      subhead: 'Neither fully compliant nor openly defiant, the administration steered a narrow course.',
    })
  }

  // Finance headline
  const cash = state.stats.cashReserve
  const debt = state.stats.debtStock
  if (cash >= 20 && debt < 50) {
    headlines.push({
      key: 'finance',
      headline: 'Lagos Records First Consecutive Budget Surpluses in 12 Years',
      subhead: `Cash reserves at ₦${cash.toFixed(0)}bn. Debt stock contained at ₦${debt.toFixed(0)}bn. Incoming governor inherits healthy books.`,
    })
  } else if (cash < 0) {
    headlines.push({
      key: 'finance',
      headline: `Lagos State Faces ₦${Math.abs(cash).toFixed(0)}bn Liquidity Crisis at Handover`,
      subhead: 'Civil servants unpaid for weeks. Incoming administration faces immediate fiscal emergency.',
    })
  } else {
    headlines.push({
      key: 'finance',
      headline: `Lagos Carries ₦${debt.toFixed(0)}bn Debt Burden Into Next Administration`,
      subhead: `Cash reserves of ₦${cash.toFixed(0)}bn provide limited buffer. Debt restructuring may be necessary.`,
    })
  }

  // Trust / Makoko headline
  if (state.resolvedEvents.includes('makoko-demolition-order')) {
    if (state.stats.publicTrust >= 55) {
      headlines.push({
        key: 'makoko',
        headline: 'Makoko Waterfront Transformation: A Model or a Warning?',
        subhead: 'The controversial resettlement program drew international attention. Residents remain divided on outcomes.',
      })
    } else {
      headlines.push({
        key: 'makoko',
        headline: 'Makoko: Four Years On, Displaced Residents Still Fighting for Compensation',
        subhead: `Demolition of West Africa's largest floating slum remains the defining image of the administration.`,
      })
    }
  } else if (state.stats.publicTrust >= 60) {
    headlines.push({
      key: 'trust',
      headline: 'Outgoing Governor Leaves With 60%+ Approval — Unusually High for Lagos',
      subhead: 'Public trust built through visible service delivery and disciplined communication.',
    })
  } else {
    headlines.push({
      key: 'trust',
      headline: `Final Approval Rating: ${state.stats.publicTrust.toFixed(0)}% — A Mixed Verdict`,
      subhead: 'Polls show deep geographic variation: higher approval in Victoria Island and Lekki, lower in Alimosho and periphery.',
    })
  }

  // Election headline
  if (state.reElected === true) {
    headlines.push({
      key: 'election',
      headline: 'Re-Elected in Hard-Fought Contest, Governor Begins Second Term',
      subhead: `Vote share: ${state.electionResult?.toFixed(1) ?? '?'}%. Mandate secured despite opposition coalition.`,
    })
  } else if (state.reElected === false) {
    headlines.push({
      key: 'election',
      headline: 'Handed Defeat at the Polls After One Term',
      subhead: `Vote share: ${state.electionResult?.toFixed(1) ?? '?'}%. Opposition's infrastructure and corruption narrative resonated.`,
    })
  }

  return headlines.slice(0, 5)
}

function pickMonologue(state: GameState): { text: string; style: 'compliant' | 'reformer' | 'survivor' } {
  const compliance = state.godfatherComplianceCount
  const refusals = state.godfatherRefusalCount
  const trust = state.stats.publicTrust

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

export function buildLegacy(state: GameState): LegacyData {
  const headlines = pickHeadlines(state)
  const { text, style } = pickMonologue(state)
  return { headlines, monologue: text, monologueStyle: style }
}
