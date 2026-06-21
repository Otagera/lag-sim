import type { GameState } from '../state/types'
import type { RankedDecision } from '../engine/legacyRanker'

export type HeadlineSlot = {
  key: string
  headline: string
  subhead: string
}

// Retrospective headlines framed "10 years later", keyed to specific player choices
// via stateFlags and resolvedEvents. These fire before stat-threshold fallbacks.

const FLAG_HEADLINES: Partial<Record<string, HeadlineSlot>> = {
  'lekki-acknowledged': {
    key: 'lekki-acknowledged',
    headline: 'The 2020 Acknowledgment That Changed the Conversation',
    subhead:
      "The Governor's formal recognition of the toll gate events, paired with a survivor fund, is now cited as the moment Lagos youth governance trust began its long recovery.",
  },
  'blue-line-opened': {
    key: 'blue-line-opened',
    headline: 'The Blue Line at Rush Hour: 340,000 Daily Riders a Decade On',
    subhead:
      'The metro the Governor funded in the final months of office has become the spine of Lagos commuter life. The opening ceremony is still shown in transport policy lectures across West Africa.',
  },
  'blue-line-incomplete': {
    key: 'blue-line-incomplete',
    headline: "The 4km That Waited: Lagos Metro's Unfinished Chapter",
    subhead:
      'The decision to defer the Blue Line completion at handover haunted transition discussions for two administrations. The extension opened six years later under a different Governor.',
  },
  'school-collapse-prosecuted': {
    key: 'school-collapse-prosecuted',
    headline: 'Ojota Prosecution Set a Standard Nigerian Courts Still Cite',
    subhead:
      "The administration's criminal prosecution of the school collapse contractor — Nigeria's first such conviction for building code violation — has been cited in eleven subsequent cases.",
  },
  'vi-collapse-prosecuted': {
    key: 'vi-collapse-prosecuted',
    headline: 'Victoria Island Prosecution Changed Developer Accountability in Lagos',
    subhead:
      "The arraignment of the Victoria Island highrise developer altered the calculus for all parties in Lagos's construction industry. LASBCA enforcement has never been the same.",
  },
  'valedictory-honest': {
    key: 'valedictory-honest',
    headline: '"We Failed Some": The Valedictory That Is Still Quoted',
    subhead:
      "The Governor's frank public acknowledgment of failures — rare in Nigerian executive politics — is now taught in governance programmes at three Nigerian universities as a model of public accountability.",
  },
  'valedictory-infrastructure': {
    key: 'valedictory-infrastructure',
    headline: "Governor Chose Concrete as His Final Statement. Lagos Still Debates Whether It Was Enough.",
    subhead:
      'The valedictory address, centred on infrastructure delivery, was well-received by business groups but drew criticism from civil society for not reckoning with social equity gaps.',
  },
  'valedictory-forward': {
    key: 'valedictory-forward',
    headline: 'The Transition Address: A Model of Institutional Generosity',
    subhead:
      'The decision to devote the valedictory entirely to the successor\'s agenda — with no self-defence — was described by governance observers as "unusually mature by Nigerian standards."',
  },
  'defied-nec-diktat': {
    key: 'defied-nec-diktat',
    headline: 'The Governor Who Refused the Party Machine in the Final Year',
    subhead:
      "Political historians now describe the NEC defiance as one of the clearest assertions of gubernatorial independence from federal party structures in Lagos's post-1999 democratic era.",
  },
  'endorsed-nec-candidate': {
    key: 'endorsed-nec-candidate',
    headline: "Former Governor's Final Endorsement: Pragmatism or Surrender?",
    subhead:
      'The decision to back the NEC consensus candidate in the final year remains the most contested act of the second term. Supporters call it political realism. Critics call it the price of a quiet exit.',
  },
  'primary-kept-clean': {
    key: 'primary-kept-clean',
    headline: 'The Clean Primary: A Precedent That Outlasted the Administration',
    subhead:
      "The Governor's refusal to rig the governorship primary despite godfather pressure produced a primary result that was, in retrospect, the cleanest in Lagos party history since 2007.",
  },
  'backed-opposition-candidate': {
    key: 'backed-opposition-candidate',
    headline: "The Governor's Secret: Backing the Opposition's Reformer",
    subhead:
      'Leaked correspondence confirmed what many suspected: the outgoing Governor quietly supported a reform candidate from a rival party. Political analysts still disagree on whether it was principle or calculation.',
  },
  'vp-deal-rejected': {
    key: 'vp-deal-rejected',
    headline: 'The VAT Battle Went to the Supreme Court — and Lagos Won',
    subhead:
      "Refusal of the Vice President's private mediation terms meant two more years of litigation. The 2031 ruling on state VAT autonomy now anchors sub-national fiscal rights across Nigeria.",
  },
  'vp-deal-accepted': {
    key: 'vp-deal-accepted',
    headline: "Lagos Dropped Its VAT Case. The Former Governor Has Never Fully Explained Why.",
    subhead:
      "The withdrawal of the VAT Supreme Court suit — announced with no press conference — remains the most studied episode in Lagos fiscal history. The terms of the settlement have never been published.",
  },
  'efcc-cooperated-term2': {
    key: 'efcc-cooperated-term2',
    headline: "Former Governor's EFCC Cooperation Remains the Administration's Most Debated Act",
    subhead:
      'Credited by reformers with breaking the back of Lagos contracting cartels. Blamed by critics for the political vacuum and retaliatory governance that followed the 2029 sweep.',
  },
  'sanitation-enforcement-reformed': {
    key: 'sanitation-enforcement-reformed',
    headline: 'How a Viral Death Ended Forced Sanitation Enforcement in Lagos',
    subhead:
      "The community-led sanitation model introduced after the enforcement officer's killing has been adopted by Abuja, Port Harcourt, and five other Nigerian cities. A policy change that came too late for one man.",
  },
  'handover-published': {
    key: 'handover-published',
    headline: 'The Handover Note That Changed Nigerian Transition Standards',
    subhead:
      "Publishing the full 480-page administration archive simultaneously with the official handover was unprecedented. Three subsequent Nigerian state administrations have cited it as the new baseline for transparency.",
  },
  'archive-opened-cleanly': {
    key: 'archive-opened-cleanly',
    headline: 'Full Archive Disclosure: A Standard Every Successor Has Been Compared To',
    subhead:
      "The decision to open state records three months before the constitutional handover date was challenged legally and applauded institutionally. It is now referenced in Nigeria's Access to Information reform debates.",
  },
  'financial-disclosure-published': {
    key: 'financial-disclosure-published',
    headline: 'Eight-Year Financial Disclosure: Still the Most Complete in Nigerian Gubernatorial History',
    subhead:
      "The administration's release of full state accounts to counter a disinformation campaign produced an unintended benefit: the most thoroughly documented gubernatorial financial record in Nigeria.",
  },
  'deputy-hostile': {
    key: 'deputy-hostile',
    headline: "The Governor Backed a Rival Against His Own Deputy. Lagos Remembers.",
    subhead:
      'The decision to oppose the Deputy Governor\'s gubernatorial bid created a rupture that shaped Lagos party politics for the next election cycle. It is now a case study in lame-duck executive relationships.',
  },
  'commissioners-purged': {
    key: 'commissioners-purged',
    headline: 'The Purge: Four Commissioners Fired on the Same Morning',
    subhead:
      "The simultaneous dismissal of four defecting commissioners is remembered as the administration's last act of executive authority. It clarified lines of loyalty that had been blurring for months.",
  },
  'populist-shield-succeeded': {
    key: 'populist-shield-succeeded',
    headline: 'Market Women and Agberos Who Held the Assembly House — A Lagos Story',
    subhead:
      "The popular mobilisation that stopped the 2025 quorum maneuver has entered Lagos political mythology. Transport union leaders who participated still reference it when describing their civic role.",
  },
  'legal-challenge-succeeded': {
    key: 'legal-challenge-succeeded',
    headline: "Court Victory During Suspension: A Constitutional Precedent",
    subhead:
      "The successful Federal High Court challenge to the Section 305 emergency declaration set a procedural standard for what constitutes lawful National Assembly ratification. Law faculties still teach it.",
  },
  'makoko-demolished': {
    key: 'makoko-demolished',
    headline: "Makoko: A Decade On, the Argument Has Not Ended",
    subhead:
      "The demolition of West Africa's largest floating settlement remains the administration's most contested act. Every anniversary produces new testimonies — from residents who were displaced and those who were rehoused.",
  },
  'ghost-purge-resolved': {
    key: 'ghost-purge-resolved',
    headline: 'The Biometric Audit That Saved Lagos ₦2.4bn Monthly',
    subhead:
      "Removing 6,200 ghost workers from the state payroll is described by fiscal analysts as the single highest-return administrative reform of the administration. The saving compounded over eight years.",
  },
}

const RESOLVED_EVENT_HEADLINES: Record<string, HeadlineSlot> = {
  'makoko-demolition-order': {
    key: 'makoko-resolved',
    headline: "Makoko: A Decade On, the Argument Has Not Ended",
    subhead:
      "The demolition of West Africa's largest floating settlement remains the administration's most contested act. Every anniversary produces new testimonies — from residents who were displaced and those who were rehoused.",
  },
}

function genericRankedHeadline(decision: RankedDecision, rank: number): HeadlineSlot {
  const delta = decision.statDelta ?? {}
  const isPositive =
    (delta.publicTrust ?? 0) > 0 ||
    (delta.infrastructureScore ?? 0) > 0 ||
    (delta.cashReserve ?? 0) > 0
  const direction = isPositive ? 'remains credited with measurable improvement' : 'is still debated by policy analysts'

  return {
    key: `ranked-${rank}`,
    headline: `"${decision.title}" — A Decision That Defined the Administration`,
    subhead: `The choice to "${decision.description}" in week ${decision.week} ${direction}. It was one of the ten highest-impact moments of the term.`,
  }
}

// Existing stat-threshold fallbacks (from legacy.ts logic) for any remaining slots
function statFallbackHeadlines(state: GameState, needed: number): HeadlineSlot[] {
  const result: HeadlineSlot[] = []
  if (needed <= 0) return result

  if (state.stats.infrastructureScore >= 65) {
    result.push({
      key: 'infrastructure',
      headline: 'Lagos Infrastructure Scorecard: Highest in 20 Years',
      subhead: `The administration leaves office with an infrastructure rating of ${state.stats.infrastructureScore.toFixed(0)}/100 — roads, water, and transit all showing measurable improvement.`,
    })
  } else if (state.stats.infrastructureScore >= 45) {
    result.push({
      key: 'infrastructure',
      headline: 'Mixed Record on Lagos Infrastructure',
      subhead: `Outgoing Governor cited "significant progress" but critics point to persistent delivery gaps. Infrastructure score: ${state.stats.infrastructureScore.toFixed(0)}/100.`,
    })
  } else {
    result.push({
      key: 'infrastructure',
      headline: "Lagos Roads Rank Among Nigeria's Worst-Maintained",
      subhead: `A term defined by deferred maintenance. Infrastructure score fell to ${state.stats.infrastructureScore.toFixed(0)}/100 under the outgoing administration.`,
    })
  }

  if (result.length < needed) {
    const cash = state.stats.cashReserve
    const debt = state.stats.debtStock
    if (cash >= 20 && debt < 50) {
      result.push({
        key: 'finance',
        headline: 'Lagos Records First Consecutive Budget Surpluses in 12 Years',
        subhead: `Cash reserves at ₦${cash.toFixed(0)}bn. Debt stock contained at ₦${debt.toFixed(0)}bn. The incoming governor inherits healthy books.`,
      })
    } else if (cash < 0) {
      result.push({
        key: 'finance',
        headline: `Lagos State Faces ₦${Math.abs(cash).toFixed(0)}bn Liquidity Crisis at Handover`,
        subhead: 'Civil servants unpaid for weeks. The incoming administration faces an immediate fiscal emergency.',
      })
    } else {
      result.push({
        key: 'finance',
        headline: `Lagos Carries ₦${debt.toFixed(0)}bn Debt Burden Into Next Administration`,
        subhead: `Cash reserves of ₦${cash.toFixed(0)}bn provide a limited buffer. Debt restructuring may be necessary in the first year.`,
      })
    }
  }

  if (result.length < needed) {
    if (state.stats.publicTrust >= 60) {
      result.push({
        key: 'trust',
        headline: 'Outgoing Governor Leaves With 60%+ Approval — Unusually High for Lagos',
        subhead: 'Public trust built through visible service delivery and disciplined communication. Pollsters note it rarely lasts into a successor administration.',
      })
    } else {
      result.push({
        key: 'trust',
        headline: `Final Approval Rating: ${state.stats.publicTrust.toFixed(0)}% — A Mixed Verdict`,
        subhead: 'Polls show deep geographic variation: higher approval in Victoria Island and Lekki, lower in Alimosho and the periphery.',
      })
    }
  }

  return result.slice(0, needed)
}

export function pickChoiceDrivenHeadlines(
  state: GameState,
  ranked: RankedDecision[],
): HeadlineSlot[] {
  const headlines: HeadlineSlot[] = []
  const usedKeys = new Set<string>()

  function add(slot: HeadlineSlot) {
    if (headlines.length >= 5 || usedKeys.has(slot.key)) return
    headlines.push(slot)
    usedKeys.add(slot.key)
  }

  // 1. Flag-driven headlines (highest priority — reflect actual choices)
  for (const [flag, slot] of Object.entries(FLAG_HEADLINES)) {
    if (state.stateFlags[flag] === true && slot) add(slot)
    if (headlines.length >= 5) break
  }

  // 2. Resolved event headlines
  for (const [eventId, slot] of Object.entries(RESOLVED_EVENT_HEADLINES)) {
    if (state.resolvedEvents.includes(eventId)) add(slot)
    if (headlines.length >= 5) break
  }

  // 3. Top ranked timeline decisions (for any remaining slots, up to 2)
  let rankedUsed = 0
  for (const decision of ranked) {
    if (headlines.length >= 5 || rankedUsed >= 2) break
    add(genericRankedHeadline(decision, rankedUsed + 1))
    rankedUsed++
  }

  // 4. Stat-threshold fallbacks for any remaining gap
  const fallbacks = statFallbackHeadlines(state, 5 - headlines.length)
  for (const fb of fallbacks) add(fb)

  return headlines.slice(0, 5)
}
