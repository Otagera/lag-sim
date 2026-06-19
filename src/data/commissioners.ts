import type { CommissionerRole, CommissionerState } from '../state/types'

export type CommissionerCandidate = CommissionerState & {
  role: CommissionerRole
  bio: string
}

export const COMMISSIONER_CANDIDATES: Record<CommissionerRole, CommissionerCandidate[]> = {
  works: [
    {
      role: 'works',
      name: 'Engr. Sola Adesoji',
      competence: 65,
      loyalty: 30,
      isGodfatherChoice: true,
      bio: "Fashemu's preferred pick. Experienced, well-connected in the contractor network. Known for 'discretion' in procurement.",
    },
    {
      role: 'works',
      name: 'Dr. Ayo Badru',
      competence: 82,
      loyalty: 75,
      isGodfatherChoice: false,
      bio: 'MIT-trained civil engineer. Clean record. Strict on procurement standards. Will not bend rules regardless of who asks.',
    },
  ],
  finance: [
    {
      role: 'finance',
      name: 'Mrs. Folake Adeyemi',
      competence: 78,
      loyalty: 65,
      isGodfatherChoice: false,
      bio: 'Former LIRS director. Strong track record on IGR reform and closing tax loopholes. Respected by civil society.',
    },
    {
      role: 'finance',
      name: 'Mr. Chidi Okonkwo',
      competence: 60,
      loyalty: 82,
      isGodfatherChoice: false,
      bio: 'Party loyalist with financial management background. Not brilliant, but absolutely reliable.',
    },
  ],
  environment: [
    {
      role: 'environment',
      name: 'Dr. Yetunde Bello',
      competence: 85,
      loyalty: 48,
      isGodfatherChoice: false,
      bio: 'Environmental lawyer who has sued the state before. Will push aggressive coastal and wetland protections — including on politically sensitive Ibeju-Lekki properties.',
    },
    {
      role: 'environment',
      name: 'Mr. Rotimi Adisa',
      competence: 54,
      loyalty: 68,
      isGodfatherChoice: true,
      bio: "Fashemu's network choice. Pragmatic about enforcement. Building setback violations have a way of disappearing under his watch.",
    },
  ],
  transport: [
    {
      role: 'transport',
      name: 'Engr. Lola Fashola',
      competence: 80,
      loyalty: 60,
      isGodfatherChoice: false,
      bio: 'BRT and ferry expansion specialist. Popular in Makoko and Alimosho for her advocacy of low-income transport.',
    },
    {
      role: 'transport',
      name: 'Alhaji Bello Musa',
      competence: 62,
      loyalty: 72,
      isGodfatherChoice: false,
      bio: 'Deep network in the informal transport sector. Useful for managing area boys and NURTW tensions. Not a reformer.',
    },
  ],
  information: [
    {
      role: 'information',
      name: 'Mrs. Adunola Kuforiji',
      competence: 75,
      loyalty: 55,
      isGodfatherChoice: false,
      bio: 'Former investigative journalist. Credible with civil society and international press. Will not suppress negative coverage, even yours.',
    },
    {
      role: 'information',
      name: 'Mr. Segun Abiodun',
      competence: 60,
      loyalty: 85,
      isGodfatherChoice: false,
      bio: 'Party media operative. Very loyal. Effective at narrative control and suppressing inconvenient stories.',
    },
  ],
}
