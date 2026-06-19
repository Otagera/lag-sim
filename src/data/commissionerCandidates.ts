import type { CommissionerRole } from '../state/types'

export type CandidateProfile = {
  name: string
  background: string
  competence: number
  loyalty: number
}

export const COMMISSIONER_CANDIDATES: Record<CommissionerRole, CandidateProfile[]> = {
  works: [
    {
      name: 'Engr. Yemi Adeyemi',
      background: 'Former World Bank infrastructure consultant, Lagos roads focus',
      competence: 78,
      loyalty: 65,
    },
    {
      name: 'Engr. Taiwo Babatunde',
      background: 'LASG Roads Authority veteran, 20 years on-ground experience',
      competence: 62,
      loyalty: 82,
    },
    {
      name: 'Engr. Biodun Okafor',
      background: 'Private-sector construction MD, SE investor contacts',
      competence: 71,
      loyalty: 55,
    },
  ],
  finance: [
    {
      name: 'Dr. Folake Adeyemi',
      background: 'IMF/World Bank alumni, fiscal policy expert and author',
      competence: 85,
      loyalty: 60,
    },
    {
      name: 'Mrs. Wunmi Ogundimu',
      background: 'LIRS Director General (retired), deep tax enforcement experience',
      competence: 70,
      loyalty: 78,
    },
    {
      name: 'Mr. Segun Adesanya',
      background: 'CBN economic adviser, technocratic macroeconomics background',
      competence: 75,
      loyalty: 62,
    },
  ],
  environment: [
    {
      name: 'Dr. Adaeze Nwosu',
      background: 'NESREA board member, climate policy and waste management advocate',
      competence: 72,
      loyalty: 65,
    },
    {
      name: 'Engr. Kemi Afolabi',
      background: 'Lagos Waste Management Authority ex-GM, knows every landfill route',
      competence: 65,
      loyalty: 80,
    },
    {
      name: 'Dr. Bayo Ogunwale',
      background: 'UNEP consultant, strong international sustainability credentials',
      competence: 80,
      loyalty: 52,
    },
  ],
  transport: [
    {
      name: 'Dr. Olumide Akande',
      background: 'BRT implementation lead, urban transport PhD from UCL',
      competence: 76,
      loyalty: 68,
    },
    {
      name: 'Engr. Femi Adesanya',
      background: 'LAMATA former DG, deep institutional knowledge of the system',
      competence: 68,
      loyalty: 75,
    },
    {
      name: 'Mrs. Chioma Obi',
      background: 'World Bank transport specialist, reform-minded and results-driven',
      competence: 82,
      loyalty: 55,
    },
  ],
  information: [
    {
      name: 'Mr. Tunde Fashola-Briggs',
      background: 'Ex-NTA Lagos correspondent, 18 years in broadcast media',
      competence: 70,
      loyalty: 72,
    },
    {
      name: 'Dr. Kanyinsola Adegoke',
      background: 'Digital strategist, led three gubernatorial media campaigns',
      competence: 65,
      loyalty: 68,
    },
    {
      name: 'Mrs. Ngozi Eze',
      background: 'PR and communications firm CEO, apolitical but effective',
      competence: 78,
      loyalty: 58,
    },
  ],
}
