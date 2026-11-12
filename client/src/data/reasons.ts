import type { NPCArchetypeKey, OpinionDecay } from '../state/types'

/**
 * Opinion reasons — the "why" behind every actor's feelings.
 *
 * Each reason renders twice (see docs/political-actors.md §8):
 *   label — terse, for the numbers view ("You sent the police  −20")
 *   line  — a sentence for the narrative view ("Tunde has not forgotten the police at Ojota.")
 *
 * `{name}` is replaced with the actor's name; `{source}` with the card title
 * where the reason was earned (omit it from lines that read badly without one).
 */
export type ReasonDefinition = {
  label: string
  line: string
  decay: OpinionDecay
}

export const REASONS = {
  // ── Goodwill ────────────────────────────────────────────────────────────
  'cooperated-openly': {
    label: 'You cooperated in the open',
    line: '{name} noted that you opened the books when it would have been easier not to.',
    decay: 'slow',
  },
  'took-up-their-cause': {
    label: 'You took up their cause',
    line: '{name} heard you say out loud what they have been saying for years.',
    decay: 'slow',
  },
  'adopted-their-demands': {
    label: 'You adopted their demands',
    line: '{name} calls it theft of their agenda — but it is their agenda now being funded.',
    decay: 'fast',
  },
  'gave-them-a-hearing': {
    label: 'You gave them a hearing',
    line: '{name} got a meeting, a seat and a cup of tea. It counts for something, for now.',
    decay: 'fast',
  },
  'struck-a-deal': {
    label: 'You struck a deal',
    line: '{name} has your word on a deal. They are watching to see if it holds.',
    decay: 'slow',
  },
  'paid-what-was-owed': {
    label: 'You paid what was owed',
    line: '{name} saw the money arrive. People remember who pays.',
    decay: 'slow',
  },
  'met-them-halfway': {
    label: 'You met them halfway',
    line: '{name} did not get everything, but they got something, and they got it from you.',
    decay: 'fast',
  },
  'looked-the-other-way': {
    label: 'You looked the other way',
    line: '{name} noticed you let it slide. They read it as weakness or as courtesy — they have not decided.',
    decay: 'fast',
  },
  'offered-a-seat-at-the-table': {
    label: 'You offered them a seat at the table',
    line: '{name} accepted a role inside your government. Inside the tent, for now.',
    decay: 'slow',
  },

  // ── Grievance ───────────────────────────────────────────────────────────
  stonewalled: {
    label: 'You stonewalled them',
    line: '{name} got lawyers and press releases instead of answers.',
    decay: 'fast',
  },
  'defied-them': {
    label: 'You defied them openly',
    line: '{name} made a demand and you said no in public. They have not forgotten the tone.',
    decay: 'slow',
  },
  'turned-down-their-offer': {
    label: 'You turned down their offer',
    line: '{name} came with an offer and left with nothing.',
    decay: 'fast',
  },
  'attacked-their-reputation': {
    label: 'You went after their reputation',
    line: '{name} will not forgive the attempt to destroy their name.',
    decay: 'permanent',
  },
  'dismissed-them-publicly': {
    label: 'You dismissed them in public',
    line: '{name} heard you call their movement "opportunism" on live radio.',
    decay: 'slow',
  },
  'ignored-them': {
    label: 'You ignored them',
    line: '{name} spoke and your office said nothing.',
    decay: 'fast',
  },
  'sent-the-police': {
    label: 'You sent the police',
    line: '{name} has not forgotten the police lines and the tear gas.',
    decay: 'permanent',
  },
  'investigated-them': {
    label: 'You opened an investigation into them',
    line: '{name} knows your investigators have been asking questions about them.',
    decay: 'slow',
  },
  'lied-about-them': {
    label: 'You called them a liar',
    line: '{name} knows you denied something both of you know is true.',
    decay: 'slow',
  },
  'fired-their-contact': {
    label: 'You fired someone they say was innocent',
    line: '{name} says you sacrificed an innocent aide to stop a leak.',
    decay: 'slow',
  },
  'beat-them-inside-the-party': {
    label: 'You outmanoeuvred them inside the party',
    line: '{name} lost the delegates to you. In the party, that is personal.',
    decay: 'slow',
  },
  'went-over-their-head': {
    label: 'You went over their head to Abuja',
    line: '{name} found out you called Abuja to have them squeezed.',
    decay: 'slow',
  },
  'overrode-their-claim': {
    label: 'You overrode their claim',
    line: '{name} watched the bulldozers go in anyway.',
    decay: 'permanent',
  },
  'disputed-their-findings': {
    label: 'You disputed their findings',
    line: '{name} spent a year on that report. You answered it with a press release.',
    decay: 'slow',
  },
  'gambled-against-them': {
    label: 'You bet they would fail',
    line: '{name} saw you let their motion run, betting it would collapse.',
    decay: 'fast',
  },

  // ── Why they turned up at all (seeded on activation) ────────────────────
  'act-smells-corruption': {
    label: 'They think your government is dirty',
    line: '{name} has been following the contracts. What they see does not smell right.',
    decay: 'slow',
  },
  'act-youth-anger': {
    label: 'Their people are angry, and you are the face of it',
    line: '{name} speaks for young people who think the state has written them off.',
    decay: 'slow',
  },
  'act-wants-your-seat': {
    label: 'They want what you have',
    line: '{name} thinks the party picked the wrong candidate in 2022.',
    decay: 'slow',
  },
  'act-unpaid-workers': {
    label: 'Their members are owed money',
    line: '{name} has members who have not been paid properly. They blame your office.',
    decay: 'slow',
  },
  'act-partisan-rival': {
    label: 'You are the other side’s prize',
    line: '{name} sits on the other side of the aisle. Taking you down is the job.',
    decay: 'slow',
  },
  'act-rights-record': {
    label: 'They are documenting your record abroad',
    line: '{name} has the ear of foreign press and funders, and a file on your government.',
    decay: 'slow',
  },
  'act-palace-unconsulted': {
    label: 'The palace feels unconsulted',
    line: '{name} says the traditional council learns about your plans from the newspapers.',
    decay: 'slow',
  },
  'act-bad-for-business': {
    label: 'They think you are bad for business',
    line: '{name} believes your government makes it harder to make money here.',
    decay: 'slow',
  },

  'lined-up-behind-abuja': {
    label: 'You lined up behind Abuja',
    line: '{name} reported to the Villa that you can be counted on.',
    decay: 'slow',
  },
  'defied-abuja': {
    label: 'You defied Abuja',
    line: '{name} had to explain to the Villa why the state said no.',
    decay: 'slow',
  },
  'act-centre-wants-control': {
    label: 'The centre wants the state in line',
    line: '{name} was sent to make sure the state remembers where allocations come from.',
    decay: 'slow',
  },

  // ── Godfather ───────────────────────────────────────────────────────────
  'did-what-he-asked': {
    label: 'You did what he asked',
    line: '{name} asked and you delivered. He will ask again.',
    decay: 'slow',
  },
  'refused-him': {
    label: 'You refused him',
    line: '{name} is not used to hearing no. He heard it from you.',
    decay: 'slow',
  },
} satisfies Record<string, ReasonDefinition>

export type ReasonKey = keyof typeof REASONS

/** Why an actor first turned up — and how strongly they start against you. */
export const ACTIVATION_REASON: Record<NPCArchetypeKey, { reason: ReasonKey; value: number }> = {
  journalist: { reason: 'act-smells-corruption', value: -40 },
  'youth-organiser': { reason: 'act-youth-anger', value: -40 },
  insider: { reason: 'act-wants-your-seat', value: -40 },
  'union-leader': { reason: 'act-unpaid-workers', value: -40 },
  'opposition-senator': { reason: 'act-partisan-rival', value: -40 },
  'diaspora-activist': { reason: 'act-rights-record', value: -40 },
  'oba-liaison': { reason: 'act-palace-unconsulted', value: -40 },
  'business-mogul': { reason: 'act-bad-for-business', value: -40 },
  'federal-liaison': { reason: 'act-centre-wants-control', value: -40 },
}

export function renderReasonLine(reason: string, name: string, source?: string): string {
  const def = (REASONS as Record<string, ReasonDefinition>)[reason]
  if (!def) return ''
  return def.line.replaceAll('{name}', name || 'They').replaceAll('{source}', source ?? '')
}
