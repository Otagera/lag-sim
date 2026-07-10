import { useGameStore } from '../state/gameStore'

const INITIATIVE_PAYOFFS: Record<string, string> = {
  'paye-enforcement': '+2bn IGR/wk',
  'luc-audit': '↑ Land Use Charge enforcement',
  'grants-mobilisation': '+8bn one-time grant',
  'federal-liaison': '+20 Federal Relationship',
  'civil-service-reform': '-3bn overheads/wk',
  'ghost-worker-biometric': '-2bn overheads/wk, -6% ghost workers',
  'ghost-worker-committee': '-3% ghost workers (partial)',
}

const INITIATIVE_NET_FLOW_DELTA: Record<string, number> = {
  'paye-enforcement': 2,
  'civil-service-reform': 3,
  'ghost-worker-biometric': 2,
}

export function useStrategicSelectors() {
  const cashReserve = useGameStore((s) => s.stats.cashReserve)
  const igrTotal = useGameStore((s) => s.stats.igr)
  const expendTotal = useGameStore((s) => s.stats.expenditure)
  const lastRevenue = useGameStore((s) => s.lastWeekRevenue)
  const lastExpenditure = useGameStore((s) => s.lastWeekExpenditure)
  const activeInitiative = useGameStore((s) => s.activeInitiative)
  const capitalProjects = useGameStore((s) => s.capitalProjects)
  const activeLoans = useGameStore((s) => s.activeLoans)

  const isInsolvent = cashReserve < 0
  const revenue = lastRevenue?.total ?? igrTotal
  const expenditure = lastExpenditure?.total ?? expendTotal
  const netFlow = revenue - expenditure
  const isSurplus = netFlow >= 0
  const burnRate = Math.max(0.1, Math.abs(netFlow))
  const weeksOfCashLeft = isInsolvent ? -1 : isSurplus ? Infinity : cashReserve / burnRate

  const initiative = activeInitiative
    ? {
        ...activeInitiative,
        progress:
          activeInitiative.totalWeeks > 0
            ? (activeInitiative.totalWeeks - activeInitiative.weeksRemaining) /
              activeInitiative.totalWeeks
            : 0,
        payoff: INITIATIVE_PAYOFFS[activeInitiative.id] ?? '',
      }
    : null

  const activeProjects = capitalProjects.filter((p) => p.status === 'active')

  const FORECAST_WEEKS = 12
  const forecast: { week: number; cash: number }[] = []
  let runningCash = cashReserve
  let baseDelta = netFlow

  for (let w = 1; w <= FORECAST_WEEKS; w++) {
    if (initiative && initiative.weeksRemaining === w) {
      baseDelta += INITIATIVE_NET_FLOW_DELTA[initiative.id] ?? 0
    }
    for (const loan of activeLoans) {
      const weeksUntilPayoff = Math.ceil(loan.outstanding / Math.max(0.01, loan.weeklyRepayment))
      if (weeksUntilPayoff === w) {
        baseDelta += loan.weeklyRepayment + loan.weeklyInterest
      }
    }
    runningCash += baseDelta
    forecast.push({ week: w, cash: runningCash })
  }

  const bankruptcyWeek = forecast.find((f) => f.cash < 0)?.week

  return {
    cashReserve,
    netFlow,
    isSurplus,
    isInsolvent,
    weeksOfCashLeft,
    initiative,
    activeProjects,
    forecast,
    bankruptcyWeek,
  } as const
}
