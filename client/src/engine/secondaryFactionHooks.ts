import type { SecondaryFactionKey, SecondaryFactionState } from '../state/types'

const EVENT_SECONDARY_IMPACTS: Record<string, Partial<Record<SecondaryFactionKey, number>>> = {
  // Seasonal events
  'sallah-kara-market': { agrarianSector: 6 },
  'detty-december': { creativeEconomy: 8 },
  'eyo-festival': { creativeEconomy: 5 },
  'harmattan-fire': { agrarianSector: -3, medicalAssociation: 2 },

  // Infrastructure / economy events that affect sectors
  'aquaculture-pilot': { agrarianSector: 4 },
  'cold-chain': { agrarianSector: 6 },
  'food-security': { agrarianSector: 8 },
  'revive-the-hub': { techSector: 6 },
  'lasric-grants': { techSector: 4 },
  'startup-incubator': { techSector: 5 },
  'digital-skills': { techSector: 5 },
  'it-tax-base': { techSector: 3 },
}

export function getSecondaryFactionImpact(eventId: string): Partial<SecondaryFactionState> | null {
  return EVENT_SECONDARY_IMPACTS[eventId] ?? null
}
