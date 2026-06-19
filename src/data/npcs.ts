import type { GameState, NPCArchetypeKey, NPCState, StatDelta } from '../state/types'

export type NPCArchetypeDefinition = {
  key: NPCArchetypeKey
  role: string
  shortRole: string
  description: string
  goal: string
  activationCondition: (state: GameState) => boolean
  baseWeeklyPressure: (relationship: number) => number
  passiveEffect: (npc: NPCState, state: GameState) => StatDelta
  namePools: string[]
}

// Lagos-weighted name pools: ~5-6 Yoruba, then Igbo, South-South, Hausa/Tiv
export const NPC_ARCHETYPES: Record<NPCArchetypeKey, NPCArchetypeDefinition> = {
  journalist: {
    key: 'journalist',
    role: 'Investigative Journalist',
    shortRole: 'Journalist',
    description:
      'A barrister-turned-investigative journalist with deep source networks in the state legislature. Relentless on procurement and corruption angles.',
    goal: 'Expose Corruption',
    activationCondition: (s) =>
      s.stats.corruptionPressure > 35 ||
      s.resolvedEvents.includes('ibeju-lekki-property') ||
      s.resolvedEvents.includes('building-approval-bury'),
    baseWeeklyPressure: (r) => (r < 30 ? 4 : r < 65 ? 2 : 0),
    passiveEffect: (npc) => {
      if (npc.relationship < 30) return { corruptionPressure: 0.5 }
      if (npc.relationship >= 65) return { corruptionPressure: -0.3 }
      return {}
    },
    namePools: [
      'Barr. Rotimi Adesanya',
      'Barr. Yetunde Fashola-Briggs',
      'Barr. Kanyinsola Adegoke',
      'Barr. Olumide Badejo',
      'Barr. Tunde Afolabi',
      'Barr. Ngozi Eze-Okoro',
      'Barr. Adaeze Nwosu',
      'Barr. Aondofa Gbinde',
    ],
  },
  'youth-organiser': {
    key: 'youth-organiser',
    role: 'Youth Movement Leader',
    shortRole: 'Organiser',
    description:
      'A street-level organiser who channels youth anger into coordinated protest and electoral threat. Harder to dismiss than an opposition politician.',
    goal: 'Build Movement',
    activationCondition: (s) =>
      s.stats.youthTension > 55 ||
      (s.resolvedEvents.includes('makoko-demolition-order') && s.stats.publicTrust < 45),
    baseWeeklyPressure: (r) => (r < 30 ? 5 : r < 65 ? 2 : 0),
    passiveEffect: (npc) => {
      if (npc.relationship < 30) return { youthTension: 1.5 }
      if (npc.relationship >= 65) return { youthTension: -0.5, publicTrust: 0.2 }
      return {}
    },
    namePools: [
      'Comrade Dayo Afolabi',
      'Comrade Babatunde Akindele',
      'Comrade Koyinsola Oloruntoba',
      'Comrade Seun Adeyemi',
      'Comrade Biodun Ogunwale',
      'Comrade Emeka Nwosu',
      'Comrade Terungwa Iortim',
      'Comrade Effiong Ekpenyong',
    ],
  },
  insider: {
    key: 'insider',
    role: 'Party Insider',
    shortRole: 'Insider',
    description:
      'A lawmaker with deep roots in the party machine who operates in the shadows. When godfathers are unhappy, he is their instrument.',
    goal: 'Undermine Governor',
    activationCondition: (s) =>
      s.factions.partyGodfathers < 45 || s.godfatherRefusalCount >= 2,
    baseWeeklyPressure: (r) => (r < 30 ? 3 : r < 65 ? 1 : 0),
    passiveEffect: (npc) => {
      if (npc.relationship < 30) return { politicalCapital: -1 }
      if (npc.relationship >= 65) return { politicalCapital: 0.5 }
      return {}
    },
    namePools: [
      'Hon. Seun Majekodunmi',
      'Hon. Akinwunmi Adeleke',
      'Hon. Olayinka Adeleye',
      'Hon. Femi Adesanya',
      'Hon. Lekan Okonkwor',
      'Hon. Chidinma Uchenna',
      'Hon. Babatunde Akande',
      'Hon. Rufus Ikyaagba',
    ],
  },
  'union-leader': {
    key: 'union-leader',
    role: 'Union Leader',
    shortRole: 'Union',
    description:
      'Controls public-sector workers across infrastructure, health, and education. A strike call can paralyse the state in 48 hours.',
    goal: 'Protect Workers',
    activationCondition: (s) =>
      s.stats.infrastructureScore < 40 || s.stats.contractorBacklog > 3,
    baseWeeklyPressure: (r) => (r < 30 ? 4 : r < 65 ? 2 : 0),
    passiveEffect: (npc) => {
      if (npc.relationship < 30) return { civilServiceReformScore: -0.3 }
      if (npc.relationship >= 65) return { infrastructureScore: 0.1 }
      return {}
    },
    namePools: [
      'Com. Gbenga Alabi',
      'Com. Lanre Ogundimu',
      'Com. Taiwo Adeyemi',
      'Com. Kayode Badejo',
      'Com. Oluwaseun Akindele',
      'Com. Ifeanyi Okafor',
      'Com. Hezekiah Iornem',
      'Com. Inyang Briggs',
    ],
  },
  'opposition-senator': {
    key: 'opposition-senator',
    role: 'Opposition Senator',
    shortRole: 'Senator',
    description:
      'A federal lawmaker using committee power and floor debates to embarrass the state government in Abuja. Controls federal budget lines affecting Lagos.',
    goal: 'Block Federal Support',
    activationCondition: (s) => s.stats.politicalCapital < 50,
    baseWeeklyPressure: (r) => (r < 30 ? 5 : r < 65 ? 2 : 0),
    passiveEffect: (npc) => {
      if (npc.relationship < 30) return { federalRelationship: -0.5 }
      if (npc.relationship >= 65) return { federalRelationship: 0.3 }
      return {}
    },
    namePools: [
      'Sen. Kehinde Fashola',
      'Sen. Tunde Oloruntoba',
      'Sen. Olumide Adegboye',
      'Sen. Oluwakemi Adeyemi',
      'Sen. Babajide Akande',
      'Sen. Ngozi Nwosu',
      'Sen. Ibrahim Musa',
      'Sen. Zipporah Msugh',
    ],
  },
  'diaspora-activist': {
    key: 'diaspora-activist',
    role: 'Diaspora Activist',
    shortRole: 'Activist',
    description:
      'A Lagos-born academic and online organiser based abroad. International media connections and foreign donor relationships give her unusual reach.',
    goal: 'International Accountability',
    activationCondition: (s) => s.week >= 30,
    baseWeeklyPressure: (r) => (r < 30 ? 3 : r < 65 ? 1 : 0),
    passiveEffect: (npc) => {
      if (npc.relationship < 30) return { publicTrust: -0.3 }
      if (npc.relationship >= 65) return { publicTrust: 0.2 }
      return {}
    },
    namePools: [
      'Dr. Adeola Adesanya-Williams',
      'Dr. Kanyinsola Ogunwale',
      'Dr. Femi Adegoke',
      'Dr. Akin Adeleye',
      'Dr. Oluwaseun Balogun',
      'Dr. Chukwuemeka Obiora',
      'Dr. Tonye Briggs',
      'Dr. Nguember Orngu',
    ],
  },
  'oba-liaison': {
    key: 'oba-liaison',
    role: 'Traditional Ruler Liaison',
    shortRole: 'Oba Liaison',
    description:
      'Speaks for the council of traditional rulers. Commands deep respect in local communities and shapes informal opinion across all of Lagos.',
    goal: 'Community Relations',
    activationCondition: (s) => s.factions.lgChairmen < 45,
    baseWeeklyPressure: (r) => (r < 30 ? 2 : r < 65 ? 1 : 0),
    passiveEffect: (npc) => {
      if (npc.relationship < 30) return { publicTrust: -0.2 }
      if (npc.relationship >= 65) return { publicTrust: 0.2 }
      return {}
    },
    namePools: [
      'High Chief Adewale Balogun',
      'High Chief Oluwafemi Akinwunmi',
      'High Chief Babatunde Ambode',
      'High Chief Gbenga Okafor',
      'High Chief Yetunde Tinubu-Adeyemi',
      'High Chief Chukwuka Eze',
      'High Chief Dooember Iortim',
      'High Chief Shehu Dantata',
    ],
  },
  'business-mogul': {
    key: 'business-mogul',
    role: 'Business Mogul',
    shortRole: 'Mogul',
    description:
      'Controls significant employment and supply chains across Lagos. Threatens capital flight and business-community defection when policy hurts his interests.',
    goal: 'Business Growth',
    activationCondition: (s) => s.factions.businessCommunity < 40,
    baseWeeklyPressure: (r) => (r < 30 ? 3 : r < 65 ? 1 : 0),
    passiveEffect: (npc) => {
      if (npc.relationship < 30) return { igr: -0.1 }
      if (npc.relationship >= 65) return { igr: 0.1 }
      return {}
    },
    namePools: [
      'Otunba Adewale Ogundimu',
      'Chief Tunde Fashola-Coker',
      'Chief Lekan Akindele',
      'Chief Olumide Adesanya',
      'Alhaji Babajide Adeyemi',
      'Dr. Amaka Nwosu',
      'Alhaji Musa Dangote',
      'Dr. Preye Effiong',
    ],
  },
}

export const NPC_ARCHETYPE_KEYS: NPCArchetypeKey[] = [
  'journalist',
  'youth-organiser',
  'insider',
  'union-leader',
  'opposition-senator',
  'diaspora-activist',
  'oba-liaison',
  'business-mogul',
]

export function generateNPCName(key: NPCArchetypeKey): string {
  const pool = NPC_ARCHETYPES[key].namePools
  return pool[Math.floor(Math.random() * pool.length)]
}

export function pickThreeNPCArchetypes(): [NPCArchetypeKey, NPCArchetypeKey, NPCArchetypeKey] {
  const shuffled = [...NPC_ARCHETYPE_KEYS].sort(() => Math.random() - 0.5)
  return [shuffled[0], shuffled[1], shuffled[2]]
}

export function findNPCSlot(
  state: GameState,
  archetypeKey: NPCArchetypeKey,
): NPCState | null {
  for (const slot of ['npc1', 'npc2', 'npc3'] as const) {
    if (state.activeNPCs[slot].archetypeKey === archetypeKey) {
      return state.activeNPCs[slot]
    }
  }
  return null
}
