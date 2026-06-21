import type { EventCard } from '../../state/types'

// Three-event locked finale chain — weeks 205–207
// Stage 1 fires via triggerCondition at week 205; stages 2 and 3 arrive via followUpEventId.
// triggerCondition: () => false on stages 2 and 3 locks them out of the random pool.

export const finaleEvents: EventCard[] = [
  {
    id: 'finale-debate',
    title: 'The Final Debate',
    body: `Six days before polls open, the Lagos Broadcasting Service is hosting the only televised debate of this election. Your opponent, Senator Kunle Adebayo, has accepted. Seventeen million viewers are expected — the most-watched political broadcast in Lagos history.

Your chief strategist has spent three days preparing two dossiers. One documents your record: infrastructure delivered, trust maintained, the godfathers neutralised or navigated. The other documents your opponent's: the Lekki road contract that went to his brother-in-law, the student loan scandal from his senate years, three constituency projects that never broke ground.

You have two hours. What you say in this room will be replayed until February.`,
    severity: 'critical',
    category: 'political',
    triggerCondition: (state) => state.week >= 205 && !state.resolvedEvents.includes('finale-debate'),
    followUpEventId: 'finale-security-breakdown',
    choices: [
      {
        id: 'run-on-record',
        label: 'Lead With Your Record — Four Years of Delivered Governance',
        description: 'Infrastructure numbers, fiscal discipline, public trust trajectory. Civil Society +10, Business +6, Trust +8. No knockout — but nothing to walk back. Political Capital -10.',
        immediate: { publicTrust: 8, politicalCapital: -10 },
        factionImpact: { civilSocietyMedia: 10, businessCommunity: 6 },
        constituencyImpact: { victoriaIsland: 6, lagosIsland: 5, lekki: 5 },
      },
      {
        id: 'go-after-adebayo',
        label: 'Attack — Expose the Contract Scandal and Student Loan Fraud',
        description: 'Name names. Document three specific Adebayo failures. Trust -5 (negative campaign read), but Alimosho and Periphery +10 (they love the aggression). Political Capital +15. Godfathers +8.',
        immediate: { publicTrust: -5, politicalCapital: 15 },
        factionImpact: { partyGodfathers: 8, lgChairmen: 6, civilSocietyMedia: -8 },
        constituencyImpact: { alimosho: 10, periphery: 8, oshodi: 6 },
      },
      {
        id: 'vision-second-term',
        label: 'Pivot to Vision — Announce Three Signature Second-Term Promises',
        description: 'Lagos Metro Phase 3. Free vocational training. Digital land registry. Youth Tension -8. Trust +5 in peripheral constituencies. Political Capital -15. A bet on aspiration over record.',
        immediate: { publicTrust: 5, politicalCapital: -15, youthTension: -8 },
        factionImpact: { civilSocietyMedia: 6, informalEconomy: 5 },
        constituencyImpact: { alimosho: 8, periphery: 8, makoko: 6, surulere: 5 },
      },
    ],
  },

  {
    id: 'finale-security-breakdown',
    title: 'Election Eve: Opposition-Sponsored Violence in Alimosho',
    body: `At 11pm, four days before polls open, reports flood in from Alimosho: three campaign offices torched, eight supporters hospitalised, a ward agent missing. Intelligence traced to a coordination channel linked to Adebayo's campaign logistics team, filtered through a transport union intermediary.

Your security commissioner is on the line. LASG has the evidence but acting on it unilaterally means deploying state security forces against an opposition political network three days before a national election. Federal eyes are watching. The Electoral Commission has already issued a caution statement.

Every choice here will be in the tribunal record if this election is contested.`,
    severity: 'critical',
    category: 'crisis',
    triggerCondition: () => false,
    followUpEventId: 'finale-election-eve',
    choices: [
      {
        id: 'deploy-security-forces',
        label: 'Deploy LASG Security — Arrest the Coordinators',
        description: 'Security Index +5. Alimosho +8 (your people see you protecting them). Federal Relationship -8 (Abuja sees it as political policing). Civil Society -6. Political Capital -20.',
        immediate: { securityIndex: 5, politicalCapital: -20 },
        factionImpact: { federalGovt: -8, civilSocietyMedia: -6, lgChairmen: 8 },
        constituencyImpact: { alimosho: 8, oshodi: 5 },
      },
      {
        id: 'community-response',
        label: 'Activate Community Leaders — De-escalate Through Channels',
        description: 'Trust your LGA chairmen and ward agents. Trust +5. No arrest, no federal confrontation. lgChairmen +10. Civil Society +6. Slower — some intimidation continues until polls. Alimosho +4.',
        immediate: { publicTrust: 5 },
        factionImpact: { lgChairmen: 10, civilSocietyMedia: 6, partyGodfathers: 3 },
        constituencyImpact: { alimosho: 4, periphery: 4 },
      },
      {
        id: 'federal-mediation',
        label: 'Call the Inspector-General — Request Federal Electoral Security',
        description: 'Bring the federal government in as neutral referee. Federal Relationship +6. Loses narrative advantage — Adebayo will frame it as you admitting you\'ve lost control. Political Capital -10.',
        immediate: { politicalCapital: -10 },
        factionImpact: { federalGovt: 6, civilSocietyMedia: 4, partyGodfathers: -5 },
        constituencyImpact: { alimosho: 2 },
      },
    ],
  },

  {
    id: 'finale-election-eve',
    title: 'Election Eve: Final Mobilisation',
    body: `Tomorrow is Election Day.

Every data point your campaign has collected converges on one number: turnout in six swing wards determines this. If your people vote, you win. If they stay home — intimidated, uninspired, or simply unbothered — you lose to a man who has never governed anything larger than a senate committee.

Your campaign director has laid out three scenarios. Each requires a different deployment of what remains: your political capital, your cash reserves, and four years of relationships.

The choice made tonight is the last one you will make as a candidate. Tomorrow, you become either a former governor or a re-elected one.`,
    severity: 'critical',
    category: 'election',
    triggerCondition: () => false,
    choices: [
      {
        id: 'full-mobilisation',
        label: 'Full Deployment — Empty the War Chest',
        description: 'Every LGA chairman, every ward agent, every truck, every loudspeaker. Cash -6. Political Capital -30. Maximum turnout operation. Alimosho +12, Periphery +10, Surulere +8, Oshodi +8. You spend everything you built.',
        immediate: { cashReserve: -6, politicalCapital: -30 },
        factionImpact: { lgChairmen: 8, informalEconomy: 8, partyGodfathers: 5 },
        constituencyImpact: { alimosho: 12, periphery: 10, surulere: 8, oshodi: 8, makoko: 5 },
      },
      {
        id: 'targeted-mobilisation',
        label: 'Targeted — Concentrate Resources on the Six Swing Wards',
        description: 'Precision over saturation. Cash -3. Political Capital -15. Alimosho +8, Periphery +6. You leave some wards to their own momentum. Higher ceiling in the six targets, lower floor everywhere else.',
        immediate: { cashReserve: -3, politicalCapital: -15 },
        factionImpact: { lgChairmen: 5, informalEconomy: 5 },
        constituencyImpact: { alimosho: 8, periphery: 6, oshodi: 5, surulere: 4 },
      },
      {
        id: 'trust-the-lead',
        label: 'Hold — The Record Speaks. Let It.',
        description: 'Conserve. Your governance record is your argument. Political Capital -5. No constituency surge — but no desperate optics either. A risk in close wards, dignity in every one.',
        immediate: { politicalCapital: -5 },
        factionImpact: { civilSocietyMedia: 8, businessCommunity: 5 },
      },
    ],
  },
]
