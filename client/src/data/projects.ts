import type { ProjectDef } from '../state/types'

export const PROJECTS: ProjectDef[] = [
  // ── TRANSPORT ─────────────────────────────────────────────
  {
    id: 'brt-corridor',
    category: 'transport',
    title: 'Lekki–Epe BRT Corridor',
    pitch:
      "A 13.5 km dedicated BRT corridor from Eleko Junction to Epe T-junction, with pedestrian bridges, bus stations, and bike parking. Extends the existing BRT network into Lagos's fastest-growing corridor.",
    cost: 8,
    pcCost: 3,
    weeksToComplete: 12,
    effect: { infrastructureScore: 4 },
    factionImpact: { informalEconomy: -3 },
    goalRelevance: ['make-the-promise-real', 'lights-on'],
  },
  {
    id: 'lagoon-ferries',
    category: 'transport',
    title: 'Lagoon Waterway Ferry Terminals',
    pitch:
      "Four new ferry terminals across the lagoon — Badagry, Ikorodu, Epe, and Marina — with electric ferries and integrated BRT ticketing. The waterways are Lagos's best commuter asset; make them usable.",
    cost: 4,
    pcCost: 2,
    weeksToComplete: 8,
    effect: { infrastructureScore: 2, publicTrust: 2 },
    factionImpact: { informalEconomy: 3 },
    goalRelevance: ['make-the-promise-real', 'lights-on'],
  },
  {
    id: 'opebi-mende-bridge',
    category: 'transport',
    title: 'Opebi–Mende Link Bridge',
    pitch:
      'A link bridge connecting Opebi to Mende, providing an alternative route that bypasses the Kudirat Abiola Way bottleneck. Expected to cut commute times for 50,000 daily travellers and unlock property development in the corridor.',
    cost: 7,
    pcCost: 4,
    weeksToComplete: 14,
    effect: { infrastructureScore: 3, publicTrust: 2 },
    goalRelevance: ['make-the-promise-real'],
  },

  // ── POWER ─────────────────────────────────────────────────
  {
    id: 'alausa-ipp',
    category: 'power',
    title: 'Alausa 10MW IPP',
    pitch:
      'An independent power plant powering the State Secretariat and adjacent government facilities. Lagos already operates six IPPs across the state — this stabilises the administrative heart of the government and proves the model works.',
    cost: 10,
    pcCost: 5,
    weeksToComplete: 10,
    effect: { infrastructureScore: 5, publicTrust: 3 },
    goalRelevance: ['make-the-promise-real', 'lights-on'],
  },

  // ── WATER ─────────────────────────────────────────────────
  {
    id: 'agege-drainage',
    category: 'water',
    title: 'Agege Drainage Overhaul',
    pitch:
      "Complete replacement of the colonial-era drainage system in Agege, one of Lagos's worst flood zones. 8 km of new channels, 4 retention basins, and a maintenance schedule that does not rely on the rainy season revealing the blockages.",
    cost: 5,
    pcCost: 2,
    weeksToComplete: 8,
    effect: { infrastructureScore: 3, publicTrust: 2 },
    goalRelevance: ['make-the-promise-real', 'lights-on'],
  },
  {
    id: 'island-water-treatment',
    category: 'water',
    title: 'Island Water Treatment Plant',
    pitch:
      'A new water treatment plant serving Lagos Island and Eti-Osa, where pipe-borne water reaches only 30% of households. 40 million litres per day capacity, with distribution network to the worst-served wards.',
    cost: 8,
    pcCost: 3,
    weeksToComplete: 12,
    effect: { infrastructureScore: 3, publicTrust: 4 },
    goalRelevance: ['make-the-promise-real'],
  },

  // ── HEALTH ────────────────────────────────────────────────
  {
    id: 'ikeja-general-hospital',
    category: 'health',
    title: 'General Hospital Renovation (Ikeja)',
    pitch:
      'Full renovation of the oldest general hospital in Ikeja — new A&E wing, maternity ward, and diagnostic centre. 200,000 patients a year currently depend on a building last upgraded in the 1990s.',
    cost: 6,
    pcCost: 3,
    weeksToComplete: 10,
    effect: { infrastructureScore: 2, publicTrust: 4 },
    factionImpact: { civilSocietyMedia: 5 },
    goalRelevance: ['make-the-promise-real', 'break-the-machine'],
  },
  {
    id: 'primary-health-network',
    category: 'health',
    title: 'Primary Health Center Network',
    pitch:
      '30 new primary health centres across underserved LGAs — Alimosho, Badagry, Ojo, Ikorodu, Epe. Each with solar power, drug supply chain, and a midwife. Basic care within 30 minutes of every Lagosian — the standard the city deserves.',
    cost: 6,
    pcCost: 4,
    weeksToComplete: 10,
    effect: { infrastructureScore: 2, publicTrust: 5 },
    factionImpact: { civilSocietyMedia: 4 },
    goalRelevance: ['make-the-promise-real', 'break-the-machine'],
  },

  // ── EDUCATION ─────────────────────────────────────────────
  {
    id: 'eko-secondary-schools',
    category: 'education',
    title: 'Eko Secondary School Rebuilding',
    pitch:
      'Rebuild 12 dilapidated secondary schools across the educational districts — new classrooms, science labs, and sanitation blocks. The ones where children sit on the floor and the roof leaks. Fix the basics first.',
    cost: 4,
    pcCost: 2,
    weeksToComplete: 8,
    effect: { infrastructureScore: 2, publicTrust: 3 },
    factionImpact: { civilSocietyMedia: 4 },
    goalRelevance: ['make-the-promise-real'],
  },
  {
    id: 'vocational-training',
    category: 'education',
    title: 'Vocational Training Center',
    pitch:
      'A flagship vocational training centre in partnership with the Lagos Agrinnovation Club — agritech, solar installation, digital fabrication. Not classroom learning; hands-on skills that turn unemployed youth into employable technicians.',
    cost: 5,
    pcCost: 2,
    weeksToComplete: 8,
    effect: { infrastructureScore: 2, publicTrust: 2, youthTension: -3 },
    goalRelevance: ['make-the-promise-real'],
  },

  // ── SECURITY ──────────────────────────────────────────────
  {
    id: 'rrs-hq',
    category: 'security',
    title: 'Rapid Response Squad HQ',
    pitch:
      'A new command centre and barracks for the Rapid Response Squad — replacing the cramped, undersupplied facility that currently limits emergency response to 30% of calls within target time. Central dispatch, modern communications, proper vehicles.',
    cost: 3,
    pcCost: 2,
    weeksToComplete: 6,
    effect: { securityIndex: 3, publicTrust: 2 },
    goalRelevance: ['break-the-machine'],
  },
  {
    id: 'community-policing',
    category: 'security',
    title: 'Community Policing Centers (LNSC)',
    pitch:
      '10 neighbourhood safety posts across high-crime areas, operated by the Lagos Neighbourhood Safety Corps. Community-based, trust-building, non-militarised. The model that actually reduces crime in Lagos — if you give it the resources to work.',
    cost: 4,
    pcCost: 3,
    weeksToComplete: 8,
    effect: { securityIndex: 2, publicTrust: 3 },
    factionImpact: { civilSocietyMedia: 3 },
    goalRelevance: ['break-the-machine'],
  },

  // ── HOUSING ───────────────────────────────────────────────
  {
    id: 'ajah-housing',
    category: 'housing',
    title: 'Ajah Affordable Housing',
    pitch:
      '504-unit LAGOSHOMS-style housing scheme in Sangotedo, Ajah — mix of one-bedroom flats and two-bedroom terrace houses for low- and middle-income earners. Lagos needs 500,000 homes a year; this is a start that proves the model can scale.',
    cost: 12,
    pcCost: 5,
    weeksToComplete: 14,
    effect: { infrastructureScore: 4, publicTrust: 3 },
    factionImpact: { informalEconomy: -5 },
    goalRelevance: ['make-the-promise-real'],
  },

  // ── ENVIRONMENT ───────────────────────────────────────────
  {
    id: 'flood-control-channels',
    category: 'environment',
    title: 'Flood Control Channels',
    pitch:
      'Engineered flood control channels in Alimosho, Badagry, and Epe — the three worst-hit LGAs each rainy season. The Drainage Master Plan identified the priority zones; this is the concrete follow-through. Channels wide enough to matter, deep enough to last.',
    cost: 7,
    pcCost: 3,
    weeksToComplete: 12,
    prerequisites: [
      { type: 'node', nodeId: 'drainage-master-plan', label: 'Drainage Master Plan' },
    ],
    effect: { infrastructureScore: 3, publicTrust: 3 },
    goalRelevance: ['make-the-promise-real', 'lights-on'],
  },
]
