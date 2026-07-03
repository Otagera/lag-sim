import type { GameState, RevenueBreakdown } from '../state/types'
import { isDettyDecember } from '../utils/calendar'

export function calculateWeeklyRevenue(state: GameState): RevenueBreakdown {
  const {
    infrastructureScore,
    securityIndex,
    youthTension,
    federalRelationship,
    landUseChargeEnforcement,
    grantsCompliance,
  } = state.stats

  const infraFactor = infrastructureScore / 100
  const securityFactor = securityIndex / 100
  const youthFactor = 1 - youthTension / 200

  const paye = 19.6 * (infraFactor * 0.3 + securityFactor * 0.2 + youthFactor * 0.2 + 0.3)
  const mda = 5.9 * (infraFactor * 0.4 + securityFactor * 0.2 + 0.4)
  const luc = landUseChargeEnforcement * 0.3
  const other = 2.1 * (infraFactor * 0.5 + 0.5)

  let faacMultiplier = 1
  if (federalRelationship < -40) faacMultiplier = 0.1
  else if (federalRelationship < -30) faacMultiplier = 0.4
  else if (federalRelationship >= -15) faacMultiplier = 1
  else faacMultiplier = 0.7
  const faac = 8.7 * faacMultiplier

  const financeCommissioner = state.commissioners?.finance
  const grantsBonus = financeCommissioner ? (financeCommissioner.competence / 100) * 0.15 : 0
  const grants =
    state.grantFreezeDuration > 0 ? 0 : 0.8 * Math.min(1, grantsCompliance + grantsBonus)

  // Tourism: seasonal boost from Detty December; stateFlags surge from event choices
  const dettyBase = isDettyDecember(state.week) ? 0.4 : 0
  const surgeBoost = state.stateFlags.dettyDecemberSurge ? 1.2 : 0
  const tourism = dettyBase + surgeBoost

  const total = paye + mda + luc + other + faac + grants + tourism

  return { paye, mda, luc, other, faac, grants, tourism, total }
}
