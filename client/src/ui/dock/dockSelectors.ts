import { calculateVoteShare } from '../../engine/electionEngine'
import type { GameState } from '../../state/types'
import type { DockBadge, DockTab } from './dockTypes'

const TOTAL_COMMISSIONER_ROLES = 5

export type StrategicSummary = {
  netFlow: number
  isSurplus: boolean
  weeksOfCashLeft: number
  bankruptcyWeek: number | null
}

function badgeCount(value: number): number | string {
  return value > 99 ? '99+' : value
}

function roundWeeks(value: number): string {
  return `${Math.max(1, Math.floor(value))}w`
}

export function getStrategicSummary(state: GameState): StrategicSummary {
  const revenue = state.lastWeekRevenue?.total ?? state.stats.igr
  const expenditure = state.lastWeekExpenditure?.total ?? state.stats.expenditure
  const netFlow = revenue - expenditure
  const isSurplus = netFlow >= 0
  const burnRate = Math.max(0.1, Math.abs(netFlow))
  const weeksOfCashLeft =
    state.stats.cashReserve < 0 ? -1 : isSurplus ? Infinity : state.stats.cashReserve / burnRate

  const forecast: number[] = []
  let runningCash = state.stats.cashReserve
  for (let week = 1; week <= 12; week++) {
    runningCash += netFlow
    forecast.push(runningCash)
  }

  return {
    netFlow,
    isSurplus,
    weeksOfCashLeft,
    bankruptcyWeek: forecast.findIndex((cash) => cash < 0) + 1 || null,
  }
}

export function getBriefingBadge(state: GameState): DockBadge | null {
  const unreadInbox = state.inbox.filter((message) => !message.read).length
  const activeAsk = state.activeGodfatherMessage ? 1 : 0
  const queuedEvents = state.eventQueue.length + (state.activeEvent ? 1 : 0)
  const dueSoon = state.pendingDelayed.filter((event) => event.firesOnWeek <= state.week + 2).length
  const total = unreadInbox + activeAsk + queuedEvents + dueSoon + (state.newspaperHeadline ? 1 : 0)

  if (total === 0) return null
  return {
    value: badgeCount(total),
    tone: activeAsk > 0 || dueSoon > 0 ? 'danger' : queuedEvents > 0 ? 'warning' : 'info',
    ariaLabel: `${total} briefing alerts`,
  }
}

export function getTreasuryBadge(
  state: GameState,
  strategic: StrategicSummary = getStrategicSummary(state),
): DockBadge | null {
  if (state.consecutiveBankruptWeeks > 0) {
    const weeksUntilCollapse = Math.max(1, 3 - state.consecutiveBankruptWeeks)
    return {
      value: roundWeeks(weeksUntilCollapse),
      tone: 'danger',
      ariaLabel: `Bankruptcy risk in ${weeksUntilCollapse} weeks`,
    }
  }

  if (strategic.bankruptcyWeek && strategic.bankruptcyWeek <= 12) {
    return {
      value: `${strategic.bankruptcyWeek}w`,
      tone: strategic.bankruptcyWeek <= 4 ? 'danger' : 'warning',
      ariaLabel: `Cash forecast turns negative in ${strategic.bankruptcyWeek} weeks`,
    }
  }

  const flags = [strategic.netFlow < 0, state.stats.cashReserve < 15].filter(Boolean).length
  if (flags === 0) return null
  return {
    value: badgeCount(flags),
    tone: strategic.netFlow < 0 ? 'warning' : 'info',
    ariaLabel: `${flags} treasury warning${flags === 1 ? '' : 's'}`,
  }
}

export function getPowerBadge(state: GameState): DockBadge | null {
  const angryFactions = Object.values(state.factions).filter((value) => value <= 25).length
  const hostileNPCs = Object.values(state.activeNPCs).filter(
    (npc) => npc.isActive && (npc.pressure >= 70 || npc.relationship < 30),
  ).length
  const deputyRisk = state.deputy && !state.deputy.revealed && state.deputy.resentment >= 40 ? 1 : 0
  const vacancies = Math.max(0, TOTAL_COMMISSIONER_ROLES - Object.keys(state.commissioners).length)
  const total = angryFactions + hostileNPCs + deputyRisk + vacancies

  if (total === 0) return null
  return {
    value: badgeCount(total),
    tone: angryFactions > 0 || hostileNPCs > 0 || deputyRisk > 0 ? 'danger' : 'warning',
    ariaLabel: `${total} power blockers detected`,
  }
}

export function getLagosBadge(state: GameState): DockBadge | null {
  const lowApproval = Object.values(state.constituencyApproval).filter((value) => value < 40).length
  const stalledProjects = state.capitalProjects.filter(
    (project) => project.status === 'stalled',
  ).length
  const total = lowApproval + stalledProjects

  if (total === 0) return null
  return {
    value: badgeCount(total),
    tone: lowApproval >= 3 || stalledProjects > 0 ? 'danger' : 'warning',
    ariaLabel: `${total} Lagos hotspot${total === 1 ? '' : 's'}`,
  }
}

export function getDeliveryBadge(state: GameState): DockBadge | null {
  const stalledProjects = state.capitalProjects.filter(
    (project) => project.status === 'stalled',
  ).length
  const initiativeRisk =
    state.activeInitiative && state.activeInitiative.weeksRemaining <= 2 ? 1 : 0
  const researchDueSoon = state.commissionedResearchNodes.filter(
    (node) => node.completionWeek <= state.week + 2,
  ).length
  const projectsDueSoon = state.commissionedProjects.filter(
    (project) => project.completionWeek <= state.week + 2,
  ).length
  const pendingEffects = state.pendingDelayed.filter(
    (event) => event.firesOnWeek <= state.week + 2,
  ).length
  const total =
    stalledProjects + initiativeRisk + researchDueSoon + projectsDueSoon + pendingEffects

  if (total === 0) return null
  return {
    value: badgeCount(total),
    tone: stalledProjects > 0 ? 'danger' : 'warning',
    ariaLabel: `${total} delivery risk${total === 1 ? '' : 's'}`,
  }
}

export function getLegacyBadge(state: GameState): DockBadge | null {
  if (state.inCampaignMode) {
    return {
      value: 'LIVE',
      tone: 'accent',
      ariaLabel: 'Campaign mode active',
    }
  }

  const voteShare = calculateVoteShare(state)
  const goalRisk = state.selectedGoalId ? 0 : 1
  const electionRisk = state.week >= 176 && voteShare < 50 ? 1 : 0
  const gameOverRisks = [
    state.stats.cashReserve < 0,
    state.stats.federalRelationship < -35 && state.stats.infrastructureScore < 30,
    state.stats.publicTrust < 20 && state.stats.youthTension > 75,
  ].filter(Boolean).length
  const total = goalRisk + electionRisk + gameOverRisks

  if (total === 0) return null
  return {
    value: badgeCount(total),
    tone: gameOverRisks > 0 || electionRisk > 0 ? 'danger' : 'warning',
    ariaLabel: `${total} legacy risk${total === 1 ? '' : 's'}`,
  }
}

export function getDockBadges(state: GameState): Record<DockTab, DockBadge | null> {
  const strategic = getStrategicSummary(state)

  return {
    briefing: getBriefingBadge(state),
    treasury: getTreasuryBadge(state, strategic),
    power: getPowerBadge(state),
    lagos: getLagosBadge(state),
    delivery: getDeliveryBadge(state),
    legacy: getLegacyBadge(state),
  }
}
