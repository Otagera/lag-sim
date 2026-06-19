import type { EventCard } from '../../state/types'

// Events gated by stateFlags set in earlier choices.
// These form sub-decks that only activate based on the path the player took.

export const chainEvents: EventCard[] = [
  // ── Ghost Worker Purge: Aggressive path ─────────────────────────────────────

  {
    id: 'union-court-injunction',
    title: 'Union Files Labour Court Injunction',
    body: `The civil service union has filed a labour court injunction to reinstate all sacked ghost workers with full back pay. The court has given you 48 hours to respond. A default judgment means the purge is reversed and you pay severance on top.`,
    severity: 'high',
    category: 'political',
    triggerCondition: (s) =>
      s.stateFlags['ghost-purge-aggressive'] === true &&
      s.resolvedEvents.includes('ghost-worker-strike-negotiation'),
    choices: [
      {
        id: 'contest-injunction',
        label: 'Contest in Court',
        description:
          'State attorneys fight it. Long proceedings, but the purge stands if you win. Trust +5 on victory.',
        immediate: { politicalCapital: -15 },
        factionImpact: { civilSocietyMedia: -5, lgChairmen: -4 },
        delayed: {
          weekOffset: 8,
          delta: { publicTrust: 5 },
          factionImpact: { civilSocietyMedia: 5 },
          eventText: 'The labour court ruled in the state\'s favour. The ghost worker purge stands.',
        },
      },
      {
        id: 'settle-union',
        label: 'Negotiate Settlement',
        description:
          'Offer 6-month severance to end the injunction. Expensive but clean. LG Chairmen relieved.',
        immediate: { cashReserve: -2.5 },
        factionImpact: { lgChairmen: 5, civilSocietyMedia: 3 },
      },
      {
        id: 'ignore-injunction',
        label: 'Ignore the Court',
        description:
          'Constitutional contempt. Trust -20, Federal Relationship -12. NEO gets exactly what she needs.',
        immediate: { publicTrust: -20 },
        factionImpact: { federalGovt: -12, civilSocietyMedia: -15 },
      },
    ],
  },

  // ── Ghost Worker Purge: Quiet path ──────────────────────────────────────────

  {
    id: 'union-work-to-rule',
    title: 'Civil Servants Begin Work-to-Rule',
    body: `Three months into the phased ghost worker removal, civil service unions have declared a work-to-rule. No overtime, no weekend shifts. LASTMA, LAWMA and LASBCA are operating at half capacity. Infrastructure Score is eroding quietly, and the city is starting to notice.`,
    severity: 'medium',
    category: 'political',
    triggerCondition: (s) =>
      s.stateFlags['ghost-purge-quiet'] === true && s.week >= 20,
    choices: [
      {
        id: 'accelerate-reform',
        label: 'Accelerate the Reform',
        description:
          'Push through faster. Unions escalate short-term, but full savings in 8 weeks.',
        immediate: { politicalCapital: -20 },
        factionImpact: { lgChairmen: -8, civilSocietyMedia: 5 },
        delayed: {
          weekOffset: 8,
          delta: { cashReserve: 0.64 },
          eventText: 'Ghost worker removal is complete. Monthly savings of ₦640m are now fully realised.',
        },
      },
      {
        id: 'pause-reform',
        label: 'Pause and Renegotiate',
        description:
          'Buy peace at the cost of delay. Ghost workers stay another 6 months. Full savings postponed.',
        immediate: {},
        factionImpact: { lgChairmen: 8, informalEconomy: 5 },
      },
    ],
  },

  // ── Commissioner Works: Godfather appointment path ───────────────────────────

  {
    id: 'works-tender-scandal',
    title: 'Works Tender: Overbilling Exposed',
    body: `An investigative report in The Punch has traced ₦4.2bn in overbilled road contracts directly to Fashemu Engineering Ltd. Your Commissioner for Works — Fashemu's man — signed every approval. The commissioner is your cabinet, but his loyalties were never in question.`,
    severity: 'high',
    category: 'political',
    triggerCondition: (s) =>
      s.stateFlags['commissioner-works-godfather'] === true && s.week >= 30,
    choices: [
      {
        id: 'suspend-commissioner',
        label: 'Suspend the Commissioner',
        description:
          'Accountability over loyalty. Civil Society +12, Trust +8. Godfather -15. You inherit the procurement mess.',
        immediate: { publicTrust: 8 },
        factionImpact: { partyGodfathers: -15, civilSocietyMedia: 12 },
      },
      {
        id: 'internal-audit',
        label: 'Order Internal Audit',
        description:
          'Buys 6 weeks. Corruption Pressure +8. NEO will call it a whitewash. Civil Society -8.',
        immediate: { corruptionPressure: 8 },
        factionImpact: { civilSocietyMedia: -8, businessCommunity: -3 },
      },
      {
        id: 'blame-contractor',
        label: 'Blame the Contractor',
        description:
          'Plausible deniability. Commissioner stays. Fashemu is satisfied. The story will come back.',
        immediate: { corruptionPressure: 5 },
        factionImpact: { civilSocietyMedia: -5 },
        corruptionTrigger: true,
      },
    ],
  },

  // ── Makoko Demolished: Land grab exposed ────────────────────────────────────

  {
    id: 'makoko-land-grab-exposed',
    title: 'Makoko Land: The Party\'s Stake',
    body: `A Premium Times investigation has mapped title documents for the cleared Makoko waterfront. Multiple plots have been transferred to shell companies linked to your party's financing structure. You approved the demolition. Your fingerprints are adjacent to this.`,
    severity: 'critical',
    category: 'political',
    triggerCondition: (s) =>
      s.stateFlags['makoko-demolished'] === true &&
      s.resolvedEvents.includes('makoko-demolition-order'),
    choices: [
      {
        id: 'distance-from-party',
        label: 'Distance Yourself Publicly',
        description:
          'Trust +10, Civil Society +15. Godfather -20. You make a permanent enemy of the party treasurer.',
        immediate: { publicTrust: 10 },
        factionImpact: { civilSocietyMedia: 15, partyGodfathers: -20 },
      },
      {
        id: 'defend-development',
        label: 'Defend as Development',
        description:
          'Frame it as Lagos attracting investment. Corruption +10, Trust -8. The story will not die.',
        immediate: { publicTrust: -8, corruptionPressure: 10 },
        factionImpact: { businessCommunity: 8, civilSocietyMedia: -15 },
      },
      {
        id: 'commission-inquiry',
        label: 'Commission an Inquiry',
        description:
          'Political Capital -25. Buys credibility with civil society. The inquiry takes 10 weeks.',
        immediate: {},
        factionImpact: { partyGodfathers: -10, civilSocietyMedia: 10 },
        politicalCapitalCost: 25,
        delayed: {
          weekOffset: 10,
          delta: { publicTrust: 12 },
          factionImpact: { civilSocietyMedia: 8 },
          eventText: 'The Makoko land inquiry has published its findings. Partial accountability established.',
        },
      },
    ],
  },
]
