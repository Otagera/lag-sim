import type { GameState, TimelineEntry } from '../state/types'

export type RankedDecision = TimelineEntry & { magnitude: number }

function magnitude(entry: TimelineEntry): number {
  const statScore = Object.values(entry.statDelta ?? {}).reduce(
    (sum, v) => sum + Math.abs(v ?? 0),
    0,
  )
  const factionScore = Object.values(entry.factionDelta ?? {}).reduce(
    (sum, v) => sum + Math.abs(v ?? 0),
    0,
  )
  return statScore + factionScore * 0.5
}

export function rankDecisions(state: GameState): RankedDecision[] {
  return state.timeline
    .filter((e) => e.type === 'event')
    .map((e) => ({ ...e, magnitude: magnitude(e) }))
    .sort((a, b) => b.magnitude - a.magnitude)
    .slice(0, 10)
}

function statDeltaToEnglish(delta: Partial<Record<string, number>>): string {
  const parts: string[] = []
  const push = (value: number | undefined, label: string, format: (v: number) => string) => {
    if (value === undefined || value === 0) return
    parts.push(`${label} ${format(value)}`)
  }
  push(delta.publicTrust, 'trust', (v) => `${v > 0 ? '+' : ''}${v}`)
  push(delta.cashReserve, 'cash', (v) => `₦${v.toFixed(1)}bn`)
  push(delta.infrastructureScore, 'infrastructure', (v) => `${v > 0 ? '+' : ''}${v}`)
  push(delta.corruptionPressure, 'corruption pressure', (v) => `${v > 0 ? '+' : ''}${v}`)
  push(delta.federalRelationship, 'federal relations', (v) => `${v > 0 ? '+' : ''}${v}`)
  push(delta.youthTension, 'youth tension', (v) => `${v > 0 ? '+' : ''}${v}`)
  push(delta.securityIndex, 'security', (v) => `${v > 0 ? '+' : ''}${v}`)
  push(delta.igr, 'IGR', (v) => `${v > 0 ? '+' : ''}₦${v.toFixed(1)}bn/wk`)
  push(delta.debtStock, 'debt', (v) => `${v > 0 ? '+' : ''}₦${v.toFixed(0)}bn`)
  push(delta.politicalCapital, 'political capital', (v) => `${v > 0 ? '+' : ''}${v}`)
  return parts.length > 0 ? parts.join(', ') : 'minor administrative effect'
}

const FLAG_LABELS: Record<string, string> = {
  'lekki-acknowledged':
    'Formally acknowledged the 2020 Lekki toll gate events and created a survivor fund',
  'blue-line-opened': 'Funded and opened the Lagos Metro Blue Line before leaving office',
  'blue-line-incomplete':
    "Left the Blue Line's final 4km unfinished for the incoming administration",
  'school-collapse-prosecuted':
    'Prosecuted the Ojota school collapse contractor for criminal negligence',
  'vi-collapse-prosecuted': 'Prosecuted the Victoria Island high-rise collapse developer',
  'valedictory-honest': 'Gave an honest valedictory address acknowledging failures publicly',
  'valedictory-infrastructure':
    'Led valedictory address with infrastructure delivery as the defining legacy',
  'valedictory-forward': 'Delivered a forward-looking transition address focused on the successor',
  'endorsed-nec-candidate': 'Endorsed the NEC-backed gubernatorial candidate in the final year',
  'defied-nec-diktat': "Defied Abuja's NEC directive and backed an independent reform candidate",
  'primary-kept-clean': 'Refused to rig the governorship primary despite godfather pressure',
  'backed-opposition-candidate':
    'Secretly backed an opposition candidate who aligned with the reform agenda',
  'vp-deal-accepted':
    "Accepted the Vice President's mediation: endorsed NEC candidate, dropped VAT case",
  'vp-deal-rejected': 'Rejected the VP mediation offer and kept the VAT case in the Supreme Court',
  'deputy-hostile': "Backed a rival candidate against the Deputy Governor's own gubernatorial bid",
  'deputy-endorsed':
    "Endorsed the Deputy Governor's gubernatorial campaign in exchange for concessions",
  'efcc-cooperated-term2': 'Cooperated fully with EFCC investigation in the final year',
  'archive-opened-cleanly': 'Published the handover note publicly before the official transition',
  'handover-published':
    'Released the full administration handover note to the press simultaneously with handover',
  'handover-clean':
    'Provided a complete, unredacted official handover note to the incoming administration',
  'financial-disclosure-published':
    'Published eight years of full state financial accounts to counter disinformation',
  'sanitation-enforcement-reformed':
    "Abolished physical sanitation enforcement after viral footage of an officer's death",
  'commissioners-purged': 'Sacked all four commissioners who publicly defected to the rival camp',
  'pivoted-from-state-media':
    'Redirected state communications to private media after LTVS journalist mutiny',
  'audit-published-openly':
    'Published the PwC administration audit with a public response white paper',
  'legacy-bills-executive-order': 'Implemented blocked legacy legislation via executive order',
  'fire-safety-surge':
    'Ordered emergency fire safety inspections citywide after Lagos Island tenement fire',
  'held-high-ground-betrayal':
    'Issued no public response when the chosen successor publicly distanced himself',
  'efcc-investigated': 'Subject of EFCC investigation during tenure',
  'efcc-cooperated': 'Cooperated with EFCC investigation in the first term',
  'populist-shield-succeeded':
    'Successfully used popular mobilisation to stop an assembly removal attempt',
  'legal-challenge-succeeded': 'Won a Federal High Court challenge to an emergency suspension',
  'makoko-demolished': 'Ordered the demolition and resettlement of the Makoko waterfront community',
  'ghost-purge-resolved': 'Resolved the ghost worker crisis through a biometric audit',
  'primary-a': "Won the party primary through Chief Fashemu's godfather network",
  'primary-b': 'Won a contested party primary',
  'primary-c': 'Won an open party primary without godfather endorsement',
  'primary-lost': 'Lost the party primary to Hon. Seun Majekodunmi',
}

function toneGuidance(state: GameState): string {
  const compliance = state.godfatherComplianceCount
  const refusals = state.godfatherRefusalCount
  if (state.fashemuEndingPath === 'D') {
    return 'Something went further than the governor intended. There is weight underneath the words, something that will not be named directly.'
  }
  if (compliance >= 3 && refusals <= 1) {
    return 'The governor worked inside the system. The address should be careful and measured, with things left deliberately unsaid. Full sentences that do not quite say what they mean.'
  }
  if (refusals >= 3 || state.fashemuEndingPath === 'B') {
    return 'The governor fought the system. The address should be direct, a little bruised, proud without boasting.'
  }
  return 'A pragmatic survivor. Some regret, some pride, a lot unremarked. The tone of someone who knows exactly what compromises were made.'
}

export function buildLegacyPrompt(state: GameState): string {
  const ranked = rankDecisions(state)
  const terms = state.currentTerm === 2 ? 'Two terms (8 years)' : 'One term (4 years)'

  let electionLine: string
  if (state.currentTerm === 2) {
    electionLine = 'Second term completed — constitutionally barred from a third term'
  } else if (state.reElected === true) {
    electionLine = `Won re-election with ${state.electionResult?.toFixed(1) ?? '?'}% of the vote`
  } else if (state.reElected === false) {
    electionLine = `Lost re-election bid with ${state.electionResult?.toFixed(1) ?? '?'}% of the vote`
  } else if (state.stateFlags['primary-lost']) {
    electionLine = 'Lost party primary — never reached the general election'
  } else {
    electionLine = 'Term ended'
  }

  const cash = state.stats.cashReserve
  const cashLine =
    cash >= 0 ? `+₦${cash.toFixed(1)}bn surplus` : `-₦${Math.abs(cash).toFixed(1)}bn deficit`

  const totalAsks = state.godfatherComplianceCount + state.godfatherRefusalCount
  const complianceLine =
    totalAsks > 0
      ? `${state.godfatherComplianceCount}/${totalAsks} godfather asks accepted`
      : 'No godfather asks recorded'

  const decisionsBlock = ranked
    .map((d, i) => {
      const effectLine = statDeltaToEnglish(d.statDelta ?? {})
      return `${i + 1}. Week ${d.week} — "${d.title}": chose "${d.description}"\n   Effect: ${effectLine}`
    })
    .join('\n')

  const activeFlags = Object.entries(state.stateFlags)
    .filter(([, v]) => v === true)
    .map(([k]) => FLAG_LABELS[k])
    .filter(Boolean)
  const flagsBlock =
    activeFlags.length > 0 ? activeFlags.map((l) => `- ${l}`).join('\n') : '- No notable flags set'

  return `You are writing the final public address of a Lagos State Governor at the end of their administration. Write in the governor's own voice — not about them, but as them. The tone must reflect who they actually were through their decisions, not who they wanted to be seen as.

ADMINISTRATION DATA:
- Terms served: ${terms}
- Election outcome: ${electionLine}
- Final public trust: ${state.stats.publicTrust.toFixed(0)}/100
- Final infrastructure score: ${state.stats.infrastructureScore.toFixed(0)}/100
- Cash at handover: ${cashLine}
- ${complianceLine}
- Corruption pressure at end: ${state.stats.corruptionPressure.toFixed(0)}/100

10 MOST CONSEQUENTIAL DECISIONS OF THIS ADMINISTRATION (ranked by immediate impact):
${decisionsBlock}

KEY CHOICES MADE DURING THIS RUN:
${flagsBlock}

TONE GUIDANCE:
${toneGuidance(state)}

Write exactly 3 short paragraphs (each 60–90 words) as a valedictory address. Begin the address with "Fellow Lagosians". Do not use headers. Do not use quotation marks. Do not begin a paragraph with "I". Do not mention AI. Write only the three paragraphs — nothing else.`
}
