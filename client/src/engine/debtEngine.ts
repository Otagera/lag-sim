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

export function emergencyBridgeLoan(state: GameState): GameState {
  const principal = 10
  const annualRate = 0.35 + state.emergencyLoansTaken * 0.05
  const weeklyRepayment = principal / (2 * 52)
  const weeklyInterest = (principal * annualRate) / 52

  loanIdCounter++
  const loan: Loan = {
    id: `emergency-loan-${loanIdCounter}`,
    source: 'domestic_bank',
    principal,
    outstanding: principal,
    weeklyRepayment,
    weeklyInterest,
    disbursedOnWeek: state.week,
    conditions: ['emergency_terms'],
  }

  return {
    ...state,
    stats: {
      ...state.stats,
      cashReserve: state.stats.cashReserve + principal,
      debtStock: state.stats.debtStock + principal,
      weeklyDebtRepayment: state.stats.weeklyDebtRepayment + weeklyRepayment,
      weeklyDebtInterest: state.stats.weeklyDebtInterest + weeklyInterest,
    },
    activeLoans: [...state.activeLoans, loan],
    emergencyLoansTaken: state.emergencyLoansTaken + 1,
    timeline: [
      ...state.timeline,
      {
        week: state.week,
        type: 'delayed-consequence' as const,
        title: 'Emergency Bridge Loan',
        description: `Domestic banks advanced ₦10bn at ${(annualRate * 100).toFixed(0)}% APR. Debt burden increases.`,
      },
    ],
  }
}

export function WEEKLY_INTEREST_RATE(): number {
  return 0.04 / 52
}
