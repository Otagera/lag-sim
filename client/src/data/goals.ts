import type { FactionKey, GameState } from '../state/types'

function clamp(v: number, min: number, max: number): number {
  if (v < min) return min
  if (v > max) return max
  return v
}

export interface GoalTarget {
  label: string
  progress: (s: GameState) => number
  blockingText: (s: GameState) => string | null
}

export interface Goal {
  id: string
  title: string
  pitch: string
  description: string
  flavorClosing: string
  targets: GoalTarget[]
  relevantFactions: FactionKey[]
  recommendedProjectCategories?: string[]
  recommendedResearchDomains?: string[]
}

function overallProgress(goal: Goal, s: GameState): number {
  if (goal.targets.length === 0) return 0
  const sum = goal.targets.reduce((acc, t) => acc + t.progress(s), 0)
  return (sum / goal.targets.length) * 100
}

function isMet(goal: Goal, s: GameState): boolean {
  return goal.targets.every((t) => t.progress(s) >= 1)
}

function blockingLine(goal: Goal, s: GameState): string | null {
  let worst: { target: GoalTarget; prog: number } | null = null
  for (const t of goal.targets) {
    const p = t.progress(s)
    if (p >= 1) continue
    if (!worst || p < worst.prog) {
      worst = { target: t, prog: p }
    }
  }
  if (!worst) return null
  return worst.target.blockingText(s)
}

export const ALL_GOALS: Goal[] = [
  {
    id: 'break-the-machine',
    title: 'Break the Machine',
    pitch: 'Defy the godfathers and survive your term on your own terms.',
    description:
      "The Lagos political machine runs on patronage. You can feed it, or you can break it. This path means governing clean, keeping the godfathers at arm's length, and making civil society your shield instead. They will try to remove you. Don't let them.",
    flavorClosing: 'You came in owing them everything. You leave owing them nothing.',
    targets: [
      {
        label: 'Survive defiant — godfathers at 20 or below',
        progress: (s) =>
          s.factions.partyGodfathers <= 20
            ? 1
            : clamp((50 - s.factions.partyGodfathers) / 30, 0, 1),
        blockingText: (s) =>
          s.factions.partyGodfathers > 20
            ? `You're still too cozy with the machine (Godfathers at ${s.factions.partyGodfathers.toFixed(0)}). Breaking free means keeping them below 20.`
            : null,
      },
      {
        label: 'Clean hands — corruption at 35% or below',
        progress: (s) => clamp((60 - s.stats.corruptionPressure) / 25, 0, 1),
        blockingText: (s) =>
          s.stats.corruptionPressure > 35
            ? `Corruption is creeping up (${s.stats.corruptionPressure.toFixed(0)}%). A clean break needs it under 35%.`
            : null,
      },
      {
        label: 'Public legitimacy — civil society at 60 or above',
        progress: (s) => clamp(s.factions.civilSocietyMedia / 60, 0, 1),
        blockingText: (s) =>
          s.factions.civilSocietyMedia < 60
            ? `You need civil society in your corner (${s.factions.civilSocietyMedia.toFixed(0)}). Without them, the machine wins quietly.`
            : null,
      },
    ],
    relevantFactions: ['partyGodfathers', 'civilSocietyMedia'],
    recommendedProjectCategories: ['security', 'health'],
    recommendedResearchDomains: ['security'],
  },
  {
    id: 'make-the-promise-real',
    title: 'Make the Promise Real',
    pitch: 'Close the gap between what Lagos could be and what it is.',
    description:
      'Lagos is a city of staggering potential and daily indignity. This path is about closing that gap — building the infrastructure, funding it responsibly, giving the youth a reason to stay, and proving the business community can bet on Lagos and win. Hard. Possible.',
    flavorClosing: 'They said it would never live up to the hype. For once, it did.',
    targets: [
      {
        label: 'Build the base — infrastructure at 65 or above',
        progress: (s) => clamp(s.stats.infrastructureScore / 65, 0, 1),
        blockingText: (s) =>
          s.stats.infrastructureScore < 65
            ? `The promise needs a foundation. Infrastructure is ${s.stats.infrastructureScore.toFixed(0)} — the future needs at least 65.`
            : null,
      },
      {
        label: 'Fund it without breaking the bank',
        progress: (s) =>
          (s.stats.cashReserve >= 0 ? 0.5 : 0) + (s.stats.igr >= s.stats.expenditure ? 0.5 : 0),
        blockingText: (s) => {
          if (s.stats.cashReserve < 0) return "You can't fund the future while insolvent."
          if (s.stats.igr < s.stats.expenditure)
            return 'Still running a deficit — growth you cannot pay for is not real.'
          return null
        },
      },
      {
        label: 'A future for the young — youth tension at 30 or below',
        progress: (s) => clamp((60 - s.stats.youthTension) / 30, 0, 1),
        blockingText: (s) =>
          s.stats.youthTension > 30
            ? `The young don't believe yet (tension ${s.stats.youthTension.toFixed(0)}). The promise is empty if they are still restless.`
            : null,
      },
      {
        label: 'Business confidence — business community at 60 or above',
        progress: (s) => clamp(s.factions.businessCommunity / 60, 0, 1),
        blockingText: (s) =>
          s.factions.businessCommunity < 60
            ? `Investors are not convinced (${s.factions.businessCommunity.toFixed(0)}). No private capital, no startups, no promise.`
            : null,
      },
    ],
    relevantFactions: ['businessCommunity', 'civilSocietyMedia'],
    recommendedProjectCategories: [
      'transport',
      'power',
      'water',
      'health',
      'education',
      'housing',
      'environment',
    ],
    recommendedResearchDomains: ['innovation'],
  },
  {
    id: 'lights-on',
    title: 'Lights On',
    pitch: 'Keep the lights on in a city the grid forgot.',
    description:
      'Every Lagosian knows the sound of a generator. This path is about making reliable power real — building infrastructure to the breaking point, keeping the treasury from collapsing under the weight of it, and earning back the trust of a city that has been promised light and given darkness. Note: power generation is federally constrained; in the current simulation, infrastructureScore is the primary lever.',
    flavorClosing: 'For the first time in memory, the generators went quiet.',
    targets: [
      {
        label: 'Infrastructure backbone — infrastructure at 70 or above',
        progress: (s) => clamp(s.stats.infrastructureScore / 70, 0, 1),
        blockingText: (s) =>
          s.stats.infrastructureScore < 70
            ? `The grid is still failing (infrastructure ${s.stats.infrastructureScore.toFixed(0)}). Reliable power needs it at 70+.`
            : null,
      },
      {
        label: 'Pay for it — cash reserve positive',
        progress: (s) => (s.stats.cashReserve >= 0 ? 1 : clamp(1 + s.stats.cashReserve / 20, 0, 1)),
        blockingText: (s) =>
          s.stats.cashReserve < 0 ? "You can't power a city you cannot pay for." : null,
      },
      {
        label: 'Public trust in delivery — trust at 55 or above',
        progress: (s) => clamp(s.stats.publicTrust / 55, 0, 1),
        blockingText: (s) =>
          s.stats.publicTrust < 55
            ? `Lagosians don't trust it will last (trust ${s.stats.publicTrust.toFixed(0)}%). They have been disappointed before.`
            : null,
      },
    ],
    relevantFactions: ['businessCommunity', 'federalGovt'],
    recommendedProjectCategories: ['power', 'transport', 'water', 'environment'],
    recommendedResearchDomains: ['innovation', 'climate'],
  },

  // ═══════════════════════════════════════════════════════════════
  // TIER 1 — reads existing stats, no new engine work
  // ═══════════════════════════════════════════════════════════════

  {
    id: 'self-sufficient-lagos',
    title: 'Self-Sufficient Lagos',
    pitch: 'Build a Lagos that can fund itself.',
    description:
      "Fiscal sovereignty is the foundation of every other ambition. This path means building IGR until the state can stand without FAAC crutches, eliminating the deficit, and building a cash reserve that insulates the city from Abuja's mood swings. Hard bureaucracy. Quiet transformation.",
    flavorClosing: 'Lagos no longer waits for Abuja. It pays its own way.',
    targets: [
      {
        label: 'Build a ₦5bn cash reserve',
        progress: (s) => Math.min(1, s.stats.cashReserve / 5),
        blockingText: (s) =>
          s.stats.cashReserve < 5
            ? `Cash reserve is ₦${s.stats.cashReserve.toFixed(1)}bn. Need ₦5bn for a real cushion.`
            : null,
      },
      {
        label: 'Eliminate the deficit — IGR must cover expenditure',
        progress: (s) =>
          s.stats.igr >= s.stats.expenditure ? 1 : Math.min(1, s.stats.igr / s.stats.expenditure),
        blockingText: (s) =>
          s.stats.igr < s.stats.expenditure
            ? `Spending ₦${s.stats.expenditure.toFixed(1)}bn/wk but earning ₦${s.stats.igr.toFixed(1)}bn. Close the gap.`
            : null,
      },
      {
        label: 'Sustainable debt — debt stock below annual IGR',
        progress: (s) =>
          s.stats.debtStock <= 0 ? 1 : Math.min(1, (s.stats.igr * 52) / s.stats.debtStock),
        blockingText: (s) =>
          s.stats.debtStock > s.stats.igr * 52
            ? `Debt (₦${s.stats.debtStock.toFixed(0)}bn) exceeds annual IGR.`
            : null,
      },
    ],
    relevantFactions: ['businessCommunity'],
    recommendedProjectCategories: ['power', 'water', 'housing'],
    recommendedResearchDomains: ['administration'],
  },

  {
    id: 'safe-city',
    title: 'The Safe City',
    pitch: 'Make Lagos a city where fear is the exception, not the rule.',
    description:
      'The Safe City path is about the slow, grinding work of public safety: forensic capability that closes cases, a visible security presence that deters, and a justice system the public actually trusts. It pairs naturally with the forensics research domain. Every point of securityIndex is a life less interrupted.',
    flavorClosing: 'Lagosians walk home at night without looking over their shoulders.',
    targets: [
      {
        label: 'Security index at 80 or above',
        progress: (s) => Math.min(1, s.stats.securityIndex / 80),
        blockingText: (s) =>
          s.stats.securityIndex < 80
            ? `Security is at ${s.stats.securityIndex.toFixed(0)}. Needs to reach 80 for real safety.`
            : null,
      },
      {
        label: 'Youth tension below 30%',
        progress: (s) => Math.max(0, Math.min(1, (60 - s.stats.youthTension) / 30)),
        blockingText: (s) =>
          s.stats.youthTension > 30
            ? `Youth tension is ${s.stats.youthTension.toFixed(0)} — above the 30% threshold for calm.`
            : null,
      },
      {
        label: 'Public trust at 75% or above',
        progress: (s) => Math.min(1, s.stats.publicTrust / 75),
        blockingText: (s) =>
          s.stats.publicTrust < 75
            ? `Only ${s.stats.publicTrust.toFixed(0)}% of Lagosians trust the government. Need 75%.`
            : null,
      },
    ],
    relevantFactions: ['civilSocietyMedia', 'businessCommunity'],
    recommendedProjectCategories: ['security'],
    recommendedResearchDomains: ['security'],
  },

  // ═══════════════════════════════════════════════════════════════
  // TIER 2 — reads secondary factions and existing stats
  // ═══════════════════════════════════════════════════════════════

  {
    id: 'creative-capital',
    title: 'Build the Creative Capital',
    pitch: "Turn Lagos into Africa's undisputed creative capital.",
    description:
      "Nollywood, Afrobeats, Lagos Fashion Week — the creative economy already runs the cultural conversation. This path is about formalising it: tax credits for productions, 24-hour power in entertainment districts, and a regulatory environment that lets the industry scale. The creativeEconomy secondary faction measures this sector's health.",
    flavorClosing:
      'Lagos culture is no longer just exported — it is funded, formalised, and flourishing at home.',
    targets: [
      {
        label: 'Creative economy faction at 70+',
        progress: (s) => Math.min(1, (s.secondaryFactions.creativeEconomy ?? 45) / 70),
        blockingText: (s) =>
          (s.secondaryFactions.creativeEconomy ?? 45) < 70
            ? `Creative economy is at ${(s.secondaryFactions.creativeEconomy ?? 45).toFixed(0)}. Needs 70.`
            : null,
      },
      {
        label: 'Anchor constituencies (Surulere, Lagos Island) at 70+',
        progress: (s) => {
          const sur = s.constituencyApproval.surulere ?? 0
          const li = s.constituencyApproval.lagosIsland ?? 0
          return Math.min(1, Math.min(sur, li) / 70)
        },
        blockingText: (s) =>
          `Surulere (${(s.constituencyApproval.surulere ?? 0).toFixed(0)}) / Lagos Island (${(s.constituencyApproval.lagosIsland ?? 0).toFixed(0)}) — both need 70+.`,
      },
      {
        label: 'IGR contribution from creative sector',
        progress: (s) => Math.min(1, s.stats.igr / 15),
        blockingText: (s) =>
          s.stats.igr < 15
            ? `Weekly IGR of ₦${s.stats.igr.toFixed(1)}bn is below the ₦15bn creative-economy threshold.`
            : null,
      },
    ],
    relevantFactions: ['civilSocietyMedia', 'businessCommunity'],
    recommendedProjectCategories: ['power', 'transport'],
    recommendedResearchDomains: ['innovation'],
  },

  {
    id: 'tech-hub',
    title: 'The Tech Hub',
    pitch: 'Make Yaba the address for African tech — and capture the value.',
    description:
      'Yaba was going to be the next Silicon Valley before the power went out and the talent left. This path is about finishing what Lagos started: reliable power, startup infrastructure, a talent pipeline, and a tax framework that keeps tech companies in the city. The techSector secondary faction tracks this ecosystem.',
    flavorClosing: 'Yaba is the address. Lagos is the platform. African tech lives here.',
    targets: [
      {
        label: 'Tech sector faction at 70+',
        progress: (s) => Math.min(1, (s.secondaryFactions.techSector ?? 40) / 70),
        blockingText: (s) =>
          (s.secondaryFactions.techSector ?? 40) < 70
            ? `Tech sector at ${(s.secondaryFactions.techSector ?? 40).toFixed(0)}. Needs 70.`
            : null,
      },
      {
        label: 'Ikeja constituency approval at 70+',
        progress: (s) => Math.min(1, (s.constituencyApproval.ikeja ?? 0) / 70),
        blockingText: (s) =>
          (s.constituencyApproval.ikeja ?? 0) < 70
            ? `Ikeja approval is ${(s.constituencyApproval.ikeja ?? 0).toFixed(0)}. Yaba/Ikeja corridor needs 70+.`
            : null,
      },
      {
        label: 'Infrastructure backbone for tech — infra at 65+',
        progress: (s) => Math.min(1, s.stats.infrastructureScore / 65),
        blockingText: (s) =>
          s.stats.infrastructureScore < 65
            ? `Infrastructure at ${s.stats.infrastructureScore.toFixed(0)}. Tech needs reliable power and transport — at least 65.`
            : null,
      },
    ],
    relevantFactions: ['businessCommunity', 'civilSocietyMedia'],
    recommendedProjectCategories: ['power', 'transport'],
    recommendedResearchDomains: ['innovation'],
  },

  {
    id: 'revive-apapa',
    title: 'Revive Apapa',
    pitch: 'Unclog the port that Lagos — and Nigeria — depends on.',
    description:
      'Apapa port gridlock is legendary: trucks queue for weeks, goods rot, and the Lagos economy loses billions daily. This path is about fixing the road infrastructure, clearing the contractor backlog, and restoring Apapa as an economic artery rather than a bottleneck.',
    flavorClosing: 'The trucks roll through Apapa in hours, not weeks. The port breathes again.',
    targets: [
      {
        label: 'Infrastructure at 70+',
        progress: (s) => Math.min(1, s.stats.infrastructureScore / 70),
        blockingText: (s) =>
          s.stats.infrastructureScore < 70
            ? `Infrastructure is ${s.stats.infrastructureScore.toFixed(0)}. Port access roads need 70+.`
            : null,
      },
      {
        label: 'Apapa constituency approval at 65+',
        progress: (s) => Math.min(1, (s.constituencyApproval.apapa ?? 0) / 65),
        blockingText: (s) =>
          (s.constituencyApproval.apapa ?? 0) < 65
            ? `Apapa approval at ${(s.constituencyApproval.apapa ?? 0).toFixed(0)}. Residents need to feel the change.`
            : null,
      },
      {
        label: 'Contractor backlog cleared (≤ 2)',
        progress: (s) =>
          s.stats.contractorBacklog <= 2
            ? 1
            : Math.max(0, 1 - (s.stats.contractorBacklog - 2) / 10),
        blockingText: (s) =>
          s.stats.contractorBacklog > 2
            ? `Backlog at ${s.stats.contractorBacklog.toFixed(1)}. Every stuck contract is a road not built.`
            : null,
      },
    ],
    relevantFactions: ['businessCommunity', 'informalEconomy'],
    recommendedProjectCategories: ['transport', 'power'],
    recommendedResearchDomains: [],
  },

  {
    id: 'ikeja-corridor',
    title: 'The Ikeja Corridor',
    pitch: 'Turn Ikeja into the live-work destination Lagos deserves.',
    description:
      'Ikeja is the administrative and commercial spine of Lagos. This path is about building the infrastructure density, transport connectivity, and business environment that makes the corridor thrive from Oshodi to Maryland.',
    flavorClosing:
      'Ikeja works — from the government secretariat to the night markets, the corridor delivers.',
    targets: [
      {
        label: 'Infrastructure at 75+',
        progress: (s) => Math.min(1, s.stats.infrastructureScore / 75),
        blockingText: (s) =>
          s.stats.infrastructureScore < 75
            ? `Infrastructure at ${s.stats.infrastructureScore.toFixed(0)}. The corridor needs 75+.`
            : null,
      },
      {
        label: 'Ikeja constituency at 70+',
        progress: (s) => Math.min(1, (s.constituencyApproval.ikeja ?? 0) / 70),
        blockingText: (s) =>
          (s.constituencyApproval.ikeja ?? 0) < 70
            ? `Ikeja approval at ${(s.constituencyApproval.ikeja ?? 0).toFixed(0)}. Needs 70.`
            : null,
      },
    ],
    relevantFactions: ['businessCommunity', 'lgChairmen'],
    recommendedProjectCategories: ['transport', 'power', 'housing'],
    recommendedResearchDomains: [],
  },

  {
    id: 'reclaim-waterfront',
    title: 'Reclaim the Waterfront',
    pitch: 'Return the Lagos lagoon to the people.',
    description:
      "Lagos was built on water — but the waterfront has been ceded to blight, encroachment, and neglect. This path is about cleaning up the lagoon edge from Lagos Mainland to Lagos Island, building public access, and restoring the economic and recreational potential of the city's natural asset.",
    flavorClosing: 'The lagoon is Lagos again — clean, accessible, alive.',
    targets: [
      {
        label: 'Infrastructure at 65+',
        progress: (s) => Math.min(1, s.stats.infrastructureScore / 65),
        blockingText: (s) =>
          s.stats.infrastructureScore < 65
            ? `Infrastructure at ${s.stats.infrastructureScore.toFixed(0)}. Waterfront renewal needs 65+.`
            : null,
      },
      {
        label: 'Lagos Mainland approval at 60+',
        progress: (s) => Math.min(1, (s.constituencyApproval.lagosMainland ?? 0) / 60),
        blockingText: (s) =>
          (s.constituencyApproval.lagosMainland ?? 0) < 60
            ? `Lagos Mainland at ${(s.constituencyApproval.lagosMainland ?? 0).toFixed(0)}.`
            : null,
      },
      {
        label: 'Lagos Island approval at 65+',
        progress: (s) => Math.min(1, (s.constituencyApproval.lagosIsland ?? 0) / 65),
        blockingText: (s) =>
          (s.constituencyApproval.lagosIsland ?? 0) < 65
            ? `Lagos Island at ${(s.constituencyApproval.lagosIsland ?? 0).toFixed(0)}.`
            : null,
      },
    ],
    relevantFactions: ['civilSocietyMedia', 'businessCommunity'],
    recommendedProjectCategories: ['environment', 'transport'],
    recommendedResearchDomains: ['climate'],
  },

  {
    id: 'tame-the-danfo',
    title: 'Tame the Danfo',
    pitch: 'Bring order to the chaotic transport that moves 10 million daily.',
    description:
      'The yellow danfo buses are Lagos — chaotic, loud, essential, and captured by the NURTW cartels. This path is about formalising transport: weakening the union monopoly, modernising the fleet, and building the BRT infrastructure that gives commuters a real alternative.',
    flavorClosing:
      "The danfos still run — but they run on time, on route, and on the state's terms.",
    targets: [
      {
        label: 'NURTW influence broken — informalEconomy at 35 or below',
        progress: (s) =>
          s.factions.informalEconomy <= 35
            ? 1
            : Math.max(0, 1 - (s.factions.informalEconomy - 35) / 40),
        blockingText: (s) =>
          s.factions.informalEconomy > 35
            ? `Informal economy is still strong at ${s.factions.informalEconomy.toFixed(0)}. The union needs to be below 35.`
            : null,
      },
      {
        label: 'Infrastructure for modern transport at 80+',
        progress: (s) => Math.min(1, s.stats.infrastructureScore / 80),
        blockingText: (s) =>
          s.stats.infrastructureScore < 80
            ? `Infrastructure at ${s.stats.infrastructureScore.toFixed(0)}. Modern transport needs 80+.`
            : null,
      },
      {
        label: 'Commuters feel the difference — trust at 65+',
        progress: (s) => Math.min(1, s.stats.publicTrust / 65),
        blockingText: (s) =>
          s.stats.publicTrust < 65
            ? `Only ${s.stats.publicTrust.toFixed(0)}% trust the system. Need 65% for commuters to believe.`
            : null,
      },
    ],
    relevantFactions: ['informalEconomy', 'businessCommunity'],
    recommendedProjectCategories: ['transport'],
    recommendedResearchDomains: ['innovation'],
  },

  {
    id: 'move-the-city',
    title: 'Move the City',
    pitch: 'Build the mass transit Lagos has been promised for decades.',
    description:
      'Every Lagosian has a traffic story. This path is about making the big infrastructure bets — rail, BRT, dedicated corridors — that actually move people. It requires infrastructure at scale and projects completed.',
    flavorClosing: 'Lagos moves. Not fast. But it moves — and it never stops.',
    targets: [
      {
        label: 'Infrastructure at 75+',
        progress: (s) => Math.min(1, s.stats.infrastructureScore / 75),
        blockingText: (s) =>
          s.stats.infrastructureScore < 75
            ? `Infrastructure at ${s.stats.infrastructureScore.toFixed(0)}. Mass transit needs 75+.`
            : null,
      },
      {
        label: 'Public trust in delivery — trust at 60+',
        progress: (s) => Math.min(1, s.stats.publicTrust / 60),
        blockingText: (s) =>
          s.stats.publicTrust < 60
            ? `Trust at ${s.stats.publicTrust.toFixed(0)}%. If people do not believe, they will not board.`
            : null,
      },
    ],
    relevantFactions: ['businessCommunity', 'lgChairmen'],
    recommendedProjectCategories: ['transport'],
    recommendedResearchDomains: ['innovation'],
  },

  {
    id: 'cross-the-water',
    title: 'Cross the Water',
    pitch: 'Connect the mainland and the island — in both directions.',
    description:
      'The Lagos lagoon divides the city as much as it defines it. Ferries, bridges, and water transport are the fastest-growing piece of the transit network. This path is about making the water work for commuters, not just the wealthy with speedboats.',
    flavorClosing: 'The ferry is the fastest commute in Lagos — and anyone can take it.',
    targets: [
      {
        label: 'Infrastructure at 70+',
        progress: (s) => Math.min(1, s.stats.infrastructureScore / 70),
        blockingText: (s) =>
          s.stats.infrastructureScore < 70
            ? `Infrastructure at ${s.stats.infrastructureScore.toFixed(0)}. Water transit needs 70+.`
            : null,
      },
      {
        label: 'Mainland and Island both above 65',
        progress: (s) => {
          const ml = s.constituencyApproval.lagosMainland ?? 0
          const li = s.constituencyApproval.lagosIsland ?? 0
          return Math.min(1, Math.min(ml, li) / 65)
        },
        blockingText: (s) =>
          `Mainland (${(s.constituencyApproval.lagosMainland ?? 0).toFixed(0)}) / Island (${(s.constituencyApproval.lagosIsland ?? 0).toFixed(0)}) — both above 65 needed.`,
      },
    ],
    relevantFactions: ['informalEconomy', 'businessCommunity'],
    recommendedProjectCategories: ['transport'],
    recommendedResearchDomains: [],
  },

  {
    id: 'educate-generation',
    title: 'Educate a Generation',
    pitch: 'Give every Lagos child a classroom that does not leak.',
    description:
      'Lagos has over a million children in public schools — and many learn in dilapidated buildings with overcrowded classrooms. This path is about capital efficiency in education spending, renovating distressed schools, and restoring public confidence in the state school system.',
    flavorClosing: "A Lagos child's future is not determined by their postcode.",
    targets: [
      {
        label: 'Capital efficiency at 80+',
        progress: (s) => Math.min(1, s.stats.capitalEfficiency / 0.8),
        blockingText: (s) =>
          s.stats.capitalEfficiency < 0.8
            ? `Capital efficiency at ${(s.stats.capitalEfficiency * 100).toFixed(0)}%. Education spending is leaking.`
            : null,
      },
      {
        label: 'Public trust in the system at 70+',
        progress: (s) => Math.min(1, s.stats.publicTrust / 70),
        blockingText: (s) =>
          s.stats.publicTrust < 70
            ? `Trust at ${s.stats.publicTrust.toFixed(0)}%. Parents need to believe in state schools.`
            : null,
      },
    ],
    relevantFactions: ['civilSocietyMedia', 'businessCommunity'],
    recommendedProjectCategories: ['education', 'housing'],
    recommendedResearchDomains: ['administration'],
  },

  {
    id: 'healthy-city',
    title: 'The Healthy City',
    pitch: 'Build a health system that serves everyone, not just those who can pay.',
    description:
      "From Lassa fever to maternal mortality, Lagos's health challenges are as big as the city itself. This path is about strengthening the medical establishment, earning public confidence in health delivery, and building the infrastructure for disease prevention. The medicalAssociation secondary faction tracks the health sector.",
    flavorClosing:
      'When a Lagosian falls ill, the state is there — fast, capable, free at the point of care.',
    targets: [
      {
        label: 'Medical association at 65+',
        progress: (s) => Math.min(1, (s.secondaryFactions.medicalAssociation ?? 50) / 65),
        blockingText: (s) =>
          (s.secondaryFactions.medicalAssociation ?? 50) < 65
            ? `Medical association at ${(s.secondaryFactions.medicalAssociation ?? 50).toFixed(0)}. Needs 65.`
            : null,
      },
      {
        label: 'Public trust in health delivery at 65+',
        progress: (s) => Math.min(1, s.stats.publicTrust / 65),
        blockingText: (s) =>
          s.stats.publicTrust < 65
            ? `Trust at ${s.stats.publicTrust.toFixed(0)}%. Lagosians do not trust the health system.`
            : null,
      },
    ],
    relevantFactions: ['civilSocietyMedia'],
    recommendedProjectCategories: ['health'],
    recommendedResearchDomains: [],
  },

  // ═══════════════════════════════════════════════════════════════
  // TIER 3 — reads new stats (foodSecurityIndex, floodResilienceScore)
  // ═══════════════════════════════════════════════════════════════

  {
    id: 'feed-lagos',
    title: 'Feed Lagos',
    pitch: "Secure the food supply for Africa's largest city.",
    description:
      'Lagos consumes more food than any city in West Africa — and produces almost none of it. This path is about agricultural logistics: cold chains, farm-to-market canals, livestock corridors, and the market infrastructure that keeps food prices stable and supply reliable.',
    flavorClosing: 'The market is full, prices are stable, and every Lagosian eats.',
    targets: [
      {
        label: 'Food security index at 70+',
        progress: (s) => Math.min(1, (s.stats.foodSecurityIndex ?? 40) / 70),
        blockingText: (s) =>
          (s.stats.foodSecurityIndex ?? 40) < 70
            ? `Food security is at ${(s.stats.foodSecurityIndex ?? 40).toFixed(0)}. Below the 70 threshold.`
            : null,
      },
      {
        label: 'Agrarian sector alignment at 60+',
        progress: (s) => Math.min(1, (s.secondaryFactions.agrarianSector ?? 40) / 60),
        blockingText: (s) =>
          (s.secondaryFactions.agrarianSector ?? 40) < 60
            ? `Agrarian sector at ${(s.secondaryFactions.agrarianSector ?? 40).toFixed(0)}. Farmers need to be on side.`
            : null,
      },
      {
        label: 'Agrarian constituencies (Epe, Badagry) at 60+',
        progress: (s) => {
          const epe = s.constituencyApproval.epe ?? 0
          const bad = s.constituencyApproval.badagry ?? 0
          return Math.min(1, Math.min(epe, bad) / 60)
        },
        blockingText: (s) =>
          `Epe (${(s.constituencyApproval.epe ?? 0).toFixed(0)}) / Badagry (${(s.constituencyApproval.badagry ?? 0).toFixed(0)}) — farming communities below 60.`,
      },
    ],
    relevantFactions: ['informalEconomy', 'lgChairmen'],
    recommendedProjectCategories: ['water', 'transport', 'environment'],
    recommendedResearchDomains: ['agriculture'],
  },

  {
    id: 'climate-proof-lagos',
    title: 'Climate-Proof Lagos',
    pitch: 'Build a Lagos that can survive what the weather brings.',
    description:
      "Flooding is Lagos's oldest enemy — and climate change is making it worse. This path is about drainage, wetland enforcement, resettlement, and the infrastructure that keeps the city dry when the rains come. The floodResilienceScore stat measures how prepared the city is.",
    flavorClosing: 'The rains come. Lagos does not stop.',
    targets: [
      {
        label: 'Flood resilience score at 65+',
        progress: (s) => Math.min(1, (s.stats.floodResilienceScore ?? 35) / 65),
        blockingText: (s) =>
          (s.stats.floodResilienceScore ?? 35) < 65
            ? `Flood resilience at ${(s.stats.floodResilienceScore ?? 35).toFixed(0)}. Not ready for the next rainy season.`
            : null,
      },
      {
        label: 'Infrastructure backbone at 60+',
        progress: (s) => Math.min(1, s.stats.infrastructureScore / 60),
        blockingText: (s) =>
          s.stats.infrastructureScore < 60
            ? `Infrastructure at ${s.stats.infrastructureScore.toFixed(0)}. Drainage needs a 60+ base.`
            : null,
      },
    ],
    relevantFactions: ['civilSocietyMedia', 'businessCommunity'],
    recommendedProjectCategories: ['environment', 'water', 'housing'],
    recommendedResearchDomains: ['climate'],
  },
]

export function getGoal(id: string | null): Goal | undefined {
  if (!id) return undefined
  return ALL_GOALS.find((g) => g.id === id)
}

export function getGoalProgress(goal: Goal, state: GameState): number {
  return overallProgress(goal, state)
}

export function getGoalIsMet(goal: Goal, state: GameState): boolean {
  return isMet(goal, state)
}

export function getGoalBlocking(goal: Goal, state: GameState): string | null {
  return blockingLine(goal, state)
}

export function getGoalRelevance(
  goalId: string,
): { projectCategories: string[]; researchDomains: string[] } | null {
  const goal = getGoal(goalId)
  if (!goal) return null
  return {
    projectCategories: goal.recommendedProjectCategories ?? [],
    researchDomains: goal.recommendedResearchDomains ?? [],
  }
}
