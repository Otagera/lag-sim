import type { GameState, Loan, LoanSource, LoanTerms } from '../state/types'

const LOAN_TERMS: Record<LoanSource, LoanTerms> = {
  domestic_bank: { annualRate: 0.2, tenorYears: 3, negotiationWeeks: 2, conditions: [] },
  world_bank: {
    annualRate: 0.04,
    tenorYears: 20,
    negotiationWeeks: 16,
    conditions: ['open_procurement_required'],
  },
  bond_issuance: { annualRate: 0.165, tenorYears: 7, negotiationWeeks: 8, conditions: [] },
  federal_govt: { annualRate: 0, tenorYears: 5, negotiationWeeks: 4, conditions: [] },
}

let loanIdCounter = 0

export function takeLoan(state: GameState, amount: number, source: LoanSource): GameState {
  const terms = LOAN_TERMS[source]
  loanIdCounter++

  const weeklyRepayment = amount / (terms.tenorYears * 52)
  const weeklyInterest = (amount * terms.annualRate) / 52

  const loan: Loan = {
    id: `loan-${loanIdCounter}`,
    source,
    principal: amount,
    outstanding: amount,
    weeklyRepayment,
    weeklyInterest,
    disbursedOnWeek: state.week + terms.negotiationWeeks,
    conditions: [...(terms.conditions || [])],
  }

  const federalPenalty = source === 'federal_govt' ? { federalRelationship: -10 } : {}

  return {
    ...state,
    stats: {
      ...state.stats,
      cashReserve: state.stats.cashReserve + amount,
      debtStock: state.stats.debtStock + amount,
      weeklyDebtRepayment: state.stats.weeklyDebtRepayment + weeklyRepayment,
      weeklyDebtInterest: state.stats.weeklyDebtInterest + weeklyInterest,
      ...federalPenalty,
    },
    activeLoans: [...state.activeLoans, loan],
  }
}

export function WEEKLY_INTEREST_RATE(): number {
  return 0.04 / 52
}
