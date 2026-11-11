/**
 * Content audit: structural checks over every event card so new or edited
 * cards can't silently drift (broken links, choice text promising numbers the
 * code doesn't apply, choices that are strictly better than a sibling).
 */
import { describe, expect, it } from 'vitest'
import type { Choice, EventCard } from '../../state/types'
import { ALL_EVENTS } from '../eventEngine'

const isQueueOnly = (e: EventCard) =>
  !!e.triggerCondition && e.triggerCondition.toString().replace(/\s/g, '') === '()=>false'

describe('content audit — integrity', () => {
  it('event ids are unique', () => {
    const seen = new Map<string, number>()
    for (const e of ALL_EVENTS) seen.set(e.id, (seen.get(e.id) ?? 0) + 1)
    expect([...seen].filter(([, n]) => n > 1).map(([id]) => id)).toEqual([])
  })

  it('choice ids are unique within each card', () => {
    const dupes: string[] = []
    for (const e of ALL_EVENTS) {
      const ids = e.choices.map((c) => c.id)
      for (const id of new Set(ids)) if (ids.filter((x) => x === id).length > 1) dupes.push(`${e.id}/${id}`)
    }
    expect(dupes).toEqual([])
  })

  it('every follow-up / initiative completion points at a real event', () => {
    const ids = new Set(ALL_EVENTS.map((e) => e.id))
    const broken: string[] = []
    for (const e of ALL_EVENTS)
      for (const c of e.choices) {
        for (const ref of [
          c.followUpEventId,
          c.delayed?.followUpEventId,
          c.launchInitiative?.completionEventId,
        ])
          if (ref && !ids.has(ref)) broken.push(`${e.id}/${c.id} -> ${ref}`)
      }
    expect(broken).toEqual([])
  })

  it('drawable cards have 2–4 choices; queue-only outcome cards have 1–4', () => {
    const bad = ALL_EVENTS.filter((e) => {
      const n = e.choices.length
      return isQueueOnly(e) ? n < 1 || n > 4 : n < 2 || n > 4
    }).map((e) => `${e.id} (${e.choices.length})`)
    // Single-choice outcome cards that are drawn by trigger condition (not queue-only)
    const ALLOWED = new Set([
      'suspension-legal-challenge-success (1)',
      'suspension-legal-challenge-fail (1)',
      'populist-shield-success (1)',
      'populist-shield-fail (1)',
      'ghost-worker-biometric-success (1)',
      'ghost-worker-committee-success (1)',
      'federal-liaison-result (1)',
      'paye-enforcement-result (1)',
      'luc-audit-result (1)',
      'world-bank-grant-result (1)',
      'civil-service-reform-result (1)',
      'primary-contest-loss (1)',
    ])
    expect(bad.filter((b) => !ALLOWED.has(b))).toEqual([])
  })
})

// ── Description numbers must match what the choice actually does ───────────

const STATS: [RegExp, string][] = [
  [/^(public )?trust$/i, 'publicTrust'],
  [/^(political capital|pc)$/i, 'politicalCapital'],
  [/^cash( reserve)?$/i, 'cashReserve'],
  [/^infrastructure( score)?$/i, 'infrastructureScore'],
  [/^security( index)?$/i, 'securityIndex'],
  [/^food security$/i, 'foodSecurityIndex'],
  [/^corruption( pressure)?$/i, 'corruptionPressure'],
  [/^youth tension$/i, 'youthTension'],
  [/^federal relationship$/i, 'federalRelationship'],
  [/^igr$/i, 'igr'],
]

function claimedNumbers(c: Choice): { label: string; key: string; value: number }[] {
  const out: { label: string; key: string; value: number }[] = []
  const re = /([A-Za-z][A-Za-z ]{1,24}?)\s*([+\-−])\s*₦?(\d+(?:\.\d+)?)/g
  for (const m of c.description.matchAll(re)) {
    // Use the trailing words of the phrase ("... Political Capital -8" -> "Political Capital")
    const words = m[1].trim().split(/\s+/)
    for (let n = Math.min(3, words.length); n >= 1; n--) {
      const label = words.slice(-n).join(' ')
      const hit = STATS.find(([r]) => r.test(label))
      if (hit) {
        // "Ikeja trust +8" style claims target a constituency, not the state-wide stat
        const qualifier = words[words.length - n - 1]
        if (hit[1] === 'publicTrust' && qualifier && /^[A-Z]/.test(qualifier) && words.length > n) break
        out.push({ label: m[0].trim(), key: hit[1], value: Number(m[3]) * (m[2] === '+' ? 1 : -1) })
        break
      }
    }
  }
  return out
}

function deliveredValues(c: Choice, key: string): number[] {
  const imm = (c.immediate as Record<string, number | undefined>)[key]
  const del = (c.delayed?.delta as Record<string, number | undefined> | undefined)?.[key]
  const vals: number[] = []
  if (imm !== undefined) vals.push(imm)
  if (del !== undefined) vals.push(del, (imm ?? 0) + del)
  if (key === 'politicalCapital' && c.politicalCapitalCost) vals.push(-c.politicalCapitalCost)
  if (key === 'federalRelationship' && c.factionImpact?.federalGovt !== undefined)
    vals.push(c.factionImpact.federalGovt)
  // Completed projects pay a fixed reward (projectEngine): Infrastructure +5, IGR +0.3
  if (c.launchProject && key === 'infrastructureScore') vals.push(5)
  if (c.launchProject && key === 'igr') vals.push(0.3)
  return vals
}

describe('content audit — choice text matches effects', () => {
  it('every "Stat ±N" in a choice description is actually applied', () => {
    // Claims that target constituency trust via constituencyImpact rather than publicTrust
    const ALLOWED = new Set([
      'stomach-infrastructure-pressure/distribute-food-cash: Trust +8',
      'stomach-infrastructure-pressure/empowerment-kits: Trust +4',
    ])
    const problems: string[] = []
    for (const e of ALL_EVENTS)
      for (const c of e.choices)
        for (const claim of claimedNumbers(c)) {
          const vals = deliveredValues(c, claim.key)
          if (vals.some((v) => Math.abs(v - claim.value) < 0.01)) continue
          const id = `${e.id}/${c.id}: ${claim.label.replace(/^.*?(\S+ [+\-−]₦?[\d.]+)$/, '$1')}`
          if ([...ALLOWED].some((a) => id.startsWith(a.split(':')[0]) && id.endsWith(a.split(': ')[1])))
            continue
          problems.push(`${e.id}/${c.id}: says "${claim.label}" but applies ${vals.length ? vals.join(' / ') : 'nothing'} to ${claim.key}`)
        }
    expect(problems).toEqual([])
  })
})

// ── No strictly dominant choices (event rule 4) ─────────────────────────────

const LOWER_IS_BETTER = new Set(['corruptionPressure', 'youthTension'])

function valueVector(c: Choice): Record<string, number> {
  const v: Record<string, number> = {}
  const add = (k: string, x: number) => {
    v[k] = (v[k] ?? 0) + x
  }
  for (const [k, x] of Object.entries(c.immediate ?? {}))
    add(`s.${k}`, (LOWER_IS_BETTER.has(k) ? -1 : 1) * (x ?? 0))
  for (const [k, x] of Object.entries(c.delayed?.delta ?? {}))
    add(`s.${k}`, (LOWER_IS_BETTER.has(k) ? -1 : 1) * (x ?? 0))
  for (const [k, x] of Object.entries(c.factionImpact ?? {})) add(`f.${k}`, x ?? 0)
  if (c.politicalCapitalCost) add('s.politicalCapital', -c.politicalCapitalCost)
  return v
}

const hasSideEffects = (c: Choice) =>
  !!(
    c.setFlags ||
    c.followUpEventId ||
    c.npcImpact ||
    c.constituencyImpact ||
    c.launchInitiative ||
    c.launchProject ||
    c.resentmentDelta ||
    c.corruptionTrigger ||
    c.secondaryFactionImpact
  )

// Known debt from the Nov 2026 content review. Fix these over time and delete
// the entry; new cards must not add to this list.
const KNOWN_DOMINANT = new Set([
  'assembly-public-accounts-hearing:attend-redacted-records>challenge-summons-court',
  'assembly-public-accounts-hearing:support-public-hearing>challenge-summons-court',
  'cholera-outbreak-ajegunle:joint-nema-federal>lasg-containment-no-fed',
  'commissioner-loyalty-test:confront-commissioner>reassign-commissioner',
  'eyo-festival-custom:eyo-leave-traditional-council>restrict-closed-arena',
  'eyo-festival-custom:sponsor-festival-tourism>eyo-leave-traditional-council',
  'eyo-festival-custom:sponsor-festival-tourism>restrict-closed-arena',
  'ghost-worker-strike-negotiation:negotiate-severance>mediate-delay',
  'handover-briefing:assign-to-commissioners>three-red-items',
  'harmattan-fire-risk:fire-safety-campaign>harmattan-do-nothing',
  'ikeja-kidnapping-ring:joint-security-operation>lasg-covert-intelligence',
  'lasuth-drug-stockout:emergency-procurement>blame-nafdac-feds',
  'lasuth-drug-stockout:emergency-procurement>commission-health-inquiry',
  'nurtw-child-labour-motor-park:refer-unicef-feds>dispute-report',
  'paye-enforcement-proposal:voluntary-compliance-pilot>defer-paye-enforcement',
  'phc-immunisation-collapse:appeal-for-donor-support>blame-federal-nphcda',
  'phc-immunisation-collapse:emergency-cold-chain-investment>blame-federal-nphcda',
  'primary-school-collapse-agege:emergency-school-audit>patch-keep-open',
  'primary-school-collapse-agege:emergency-school-audit>targeted-lasbca-review',
  'routine-maintenance-cycle:approve-full-maintenance>defer-to-next-quarter',
  'routine-maintenance-cycle:approve-full-maintenance>half-measure',
  'routine-maintenance-cycle:half-measure>defer-to-next-quarter',
  'routine-security-assessment:fund-neighbourhood>focus-on-oshodi',
  'routine-security-assessment:fund-neighbourhood>increase-patrols',
  'routine-youth-engagement:attend-personally>send-commissioner',
  'sallah-kara-market:deploy-lastma-border>blockade-livestock-trucks',
  'teacher-salary-arrears:partial-arrears>audit-first',
  'term2-commissioner-defection-wave:reassign-defectors>ignore-commissioner-defection',
  'term2-naira-devaluation-shock:local-content-mandate-devaluation>mid-year-budget-review-devaluation',
  'term2-phc-workers-strike-round2:grant-phc-designation-upgrade>phased-designation-upgrade',
  'term2-phc-workers-strike-round2:grant-phc-designation-upgrade>reject-designation-push-salary',
  'viral-pothole-video:fix-and-announce>fix-quietly',
  'viral-pothole-video:fix-and-announce>ignore-video',
  'viral-pothole-video:fix-quietly>ignore-video',
])

describe('content audit — no obviously correct choice', () => {
  it('no choice is at least as good as a sibling on every stat and faction', () => {
    const found: string[] = []
    for (const e of ALL_EVENTS) {
      if (e.choices.length < 2) continue
      for (const a of e.choices)
        for (const b of e.choices) {
          if (a === b || hasSideEffects(a) || hasSideEffects(b)) continue
          const A = valueVector(a)
          const B = valueVector(b)
          let atLeast = true
          let better = false
          for (const k of new Set([...Object.keys(A), ...Object.keys(B)])) {
            if ((A[k] ?? 0) < (B[k] ?? 0)) atLeast = false
            if ((A[k] ?? 0) > (B[k] ?? 0)) better = true
          }
          if (atLeast && better) found.push(`${e.id}:${a.id}>${b.id}`)
        }
    }
    expect(found.filter((f) => !KNOWN_DOMINANT.has(f))).toEqual([])
  })
})
