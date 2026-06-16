import type { EventCard } from '../../state/types'

export const socialEvents: EventCard[] = [
  {
    id: 'okada-reinstatement-petition',
    title: 'Okada Reinstatement Petition',
    body: `A coalition of 400,000 former okada riders has presented a petition to reinstate commercial motorcycles in Lagos. Youth unemployment is at 38%. The ban was necessary for safety. The alternative livelihood programme promised never materialised.`,
    severity: 'medium',
    category: 'social',
    choices: [
      {
        id: 'partial-reinstatement',
        label: 'Partial Reinstatement',
        description:
          'Select roads only. Youth Tension -10, Informal Economy +10, Business -6. Security -4, Trust +6.',
        immediate: { youthTension: -10, securityIndex: -4, publicTrust: 6 },
        factionImpact: { informalEconomy: 10, businessCommunity: -6 },
      },
      {
        id: 'maintain-ban-livelihood',
        label: 'Maintain Ban, New Programme',
        description:
          'Announce real livelihood programme. Costs Political Capital and ₦0.8bn. Youth Tension -6 delayed, Trust +4 delayed.',
        immediate: { igr: -0.8 },
        factionImpact: {},
        politicalCapitalCost: 25,
        delayed: {
          weekOffset: 8,
          delta: { youthTension: -6, publicTrust: 4 },
          eventText: `The alternative livelihood programme for former okada riders is showing results. Youth unemployment is ticking down.`,
        },
      },
      {
        id: 'maintain-ban-no-programme',
        label: 'Maintain Ban, No Programme',
        description: 'Youth Tension +8, Trust -8, Civil Society -10, Informal Economy -12.',
        immediate: { youthTension: 8, publicTrust: -8 },
        factionImpact: { civilSocietyMedia: -10, informalEconomy: -12 },
      },
    ],
  },
  {
    id: 'endsars-anniversary',
    title: '#EndSARS Anniversary',
    body: `It is October. Civil society groups have announced a memorial march. Some factions want it to evolve into a protest about your administration's handling of youth unemployment and police reform. SARS is disbanded nationally but the energy remains. Your security apparatus is nervous.`,
    severity: 'high',
    category: 'social',
    choices: [
      {
        id: 'engage-publicly',
        label: 'Engage Publicly',
        description:
          'Announce police liaison reform. Youth Tension -12, Trust +8, Security -4 (seen as soft), Civil Society +15. Costs Political Capital.',
        immediate: { youthTension: -12, publicTrust: 8, securityIndex: -4 },
        factionImpact: { civilSocietyMedia: 15 },
        politicalCapitalCost: 15,
      },
      {
        id: 'let-it-happen',
        label: 'Let It Happen',
        description:
          'Maintain distance. Youth Tension -5. 20% risk of escalation: if it turns violent, Security -15, Trust -20.',
        immediate: { youthTension: -5 },
        factionImpact: {},
      },
      {
        id: 'heavy-security',
        label: 'Heavy Security Presence',
        description:
          'Security +4 short-term. Youth Tension +15, Civil Society -20, Trust -10. International optics bad.',
        immediate: { securityIndex: 4, youthTension: 15, publicTrust: -10 },
        factionImpact: { civilSocietyMedia: -20 },
      },
    ],
  },
]
