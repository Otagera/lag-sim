import type { GameState } from '../state/types'
import { pickThreeDeputies } from './deputies'
import { generateNPCName, pickThreeNPCArchetypes } from './npcs'
import { STARTING_STATE } from './startingState'

export type ArchetypeKey = 'technocrat' | 'loyalist' | 'outsider'

type ArchetypeDefinition = {
  key: ArchetypeKey
  name: string
  shortName: string
  tagline: string
  description: string
  strength: string
  risk: string
  statPreview: { label: string; value: string; positive: boolean }[]
}

export const ARCHETYPES: Record<ArchetypeKey, ArchetypeDefinition> = {
  technocrat: {
    key: 'technocrat',
    name: 'The Technocrat',
    shortName: 'Technocrat',
    tagline: 'Former World Bank advisor. Delivery over politics.',
    description:
      'You built roads before you built alliances. Your infrastructure credentials are impeccable. The party machine respects results but not outsiders — you start without their goodwill.',
    strength: 'Infrastructure head start, stronger cash reserves.',
    risk: 'Zero political capital means every early move costs you twice.',
    statPreview: [
      { label: 'Cash Reserve', value: '₦65bn', positive: true },
      { label: 'Infrastructure', value: '+20', positive: true },
      { label: 'Political Capital', value: '0', positive: false },
      { label: 'Party Godfathers', value: '30', positive: false },
    ],
  },
  loyalist: {
    key: 'loyalist',
    name: 'The Party Loyalist',
    shortName: 'Loyalist',
    tagline: 'Party machine behind you. The public is watching.',
    description:
      'You rose through obedience and patronage. The godfathers made you governor and they expect returns. You have political capital to burn — but years of machine politics have already corroded trust.',
    strength: 'Maximum political capital, iron party support.',
    risk: 'High corruption pressure and low public trust from day one.',
    statPreview: [
      { label: 'Political Capital', value: '180', positive: true },
      { label: 'Party Godfathers', value: '90', positive: true },
      { label: 'Public Trust', value: '35', positive: false },
      { label: 'Corruption Pressure', value: '50', positive: false },
    ],
  },
  outsider: {
    key: 'outsider',
    name: 'The Reform Outsider',
    shortName: 'Outsider',
    tagline: 'Won on momentum. The streets are with you — for now.',
    description:
      'You ran an anti-corruption campaign and won on popular anger. Civil society loves you. But your treasury is thin, the godfathers never endorsed you, and Abuja is cold.',
    strength: 'High public trust, dominant civil society support.',
    risk: 'Thin cash reserves and very weak party backing.',
    statPreview: [
      { label: 'Public Trust', value: '75', positive: true },
      { label: 'Civil Society', value: '80', positive: true },
      { label: 'Cash Reserve', value: '₦25bn', positive: false },
      { label: 'Party Godfathers', value: '20', positive: false },
    ],
  },
}

export const ARCHETYPE_KEY_ORDER: ArchetypeKey[] = ['technocrat', 'loyalist', 'outsider']

export function getArchetypeState(key: ArchetypeKey): GameState {
  const base: GameState = {
    ...STARTING_STATE,
    stats: { ...STARTING_STATE.stats },
    factions: { ...STARTING_STATE.factions },
  }

  if (key === 'technocrat') {
    base.stats.cashReserve = 65
    base.stats.infrastructureScore = 62
    base.stats.politicalCapital = 0
    base.factions.partyGodfathers = 30
  } else if (key === 'loyalist') {
    base.stats.politicalCapital = 180
    base.stats.corruptionPressure = 50
    base.stats.publicTrust = 35
    base.factions.partyGodfathers = 90
  } else if (key === 'outsider') {
    base.stats.publicTrust = 75
    base.stats.cashReserve = 25
    base.factions.civilSocietyMedia = 80
    base.factions.partyGodfathers = 20
  }

  // Randomly assign 3 NPC archetypes with names
  const [a1, a2, a3] = pickThreeNPCArchetypes()
  base.activeNPCs = {
    npc1: {
      isActive: false,
      relationship: 0,
      pressure: 0,
      archetypeKey: a1,
      name: generateNPCName(a1),
    },
    npc2: {
      isActive: false,
      relationship: 0,
      pressure: 0,
      archetypeKey: a2,
      name: generateNPCName(a2),
    },
    npc3: {
      isActive: false,
      relationship: 0,
      pressure: 0,
      archetypeKey: a3,
      name: generateNPCName(a3),
    },
  }

  // Randomly offer 3 deputy types to choose from
  base.offeredDeputies = pickThreeDeputies()

  return base
}
