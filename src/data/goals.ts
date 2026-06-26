import type { GameState, FactionKey } from '../state/types'

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
      'The Lagos political machine runs on patronage. You can feed it, or you can break it. This path means governing clean, keeping the godfathers at arm\'s length, and making civil society your shield instead. They will try to remove you. Don\'t let them.',
    flavorClosing:
      'You came in owing them everything. You leave owing them nothing.',
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
    flavorClosing:
      'They said it would never live up to the hype. For once, it did.',
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
          (s.stats.cashReserve >= 0 ? 0.5 : 0) +
          (s.stats.igr >= s.stats.expenditure ? 0.5 : 0),
        blockingText: (s) => {
          if (s.stats.cashReserve < 0)
            return "You can't fund the future while insolvent."
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
    recommendedProjectCategories: ['transport', 'power', 'water', 'health', 'education', 'housing', 'environment'],
    recommendedResearchDomains: ['innovation'],
  },
  {
    id: 'lights-on',
    title: 'Lights On',
    pitch: 'Keep the lights on in a city the grid forgot.',
    description:
      'Every Lagosian knows the sound of a generator. This path is about making reliable power real — building infrastructure to the breaking point, keeping the treasury from collapsing under the weight of it, and earning back the trust of a city that has been promised light and given darkness. Note: power generation is federally constrained; in the current simulation, infrastructureScore is the primary lever.',
    flavorClosing:
      'For the first time in memory, the generators went quiet.',
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
        progress: (s) =>
          s.stats.cashReserve >= 0
            ? 1
            : clamp(1 + s.stats.cashReserve / 20, 0, 1),
        blockingText: (s) =>
          s.stats.cashReserve < 0
            ? "You can't power a city you cannot pay for."
            : null,
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

export function getGoalRelevance(goalId: string):
  { projectCategories: string[]; researchDomains: string[] } | null {
  const goal = getGoal(goalId)
  if (!goal) return null
  return {
    projectCategories: goal.recommendedProjectCategories ?? [],
    researchDomains: goal.recommendedResearchDomains ?? [],
  }
}
