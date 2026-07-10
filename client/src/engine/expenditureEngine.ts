import type { ExpenditureBreakdown, GameState } from '../state/types'

export function calculateWeeklyExpenditure(state: GameState): ExpenditureBreakdown {
  const personnelBase = 9.2
  const ghostWorkerDrag = state.stats.ghostWorkerRate * personnelBase
  const personnel = personnelBase + ghostWorkerDrag

  const debtInterest = state.stats.weeklyDebtInterest
  const debtRepayment = state.stats.weeklyDebtRepayment

  // Term2 institutions are leaner: 4 years of reform, fewer setup costs
  const overheadBase = state.currentTerm === 2 ? 5.0 : 17.0
  const godfatherInflation = state.godfatherComplianceCount * 0.3 + state.stats.baseOverheads
  const overheads = overheadBase + godfatherInflation

  const subventions = 3.9 * (1 - state.stats.subventionCutRate)

  const contractorPayment =
    state.stats.contractorBacklog > 0 ? Math.min(state.stats.contractorBacklog * 0.15, 4) : 0

  const total =
    personnel + debtInterest + debtRepayment + overheads + subventions + contractorPayment

  return {
    personnel,
    debtInterest,
    debtRepayment,
    overheads,
    subventions,
    contractorPayment,
    total,
  }
}
