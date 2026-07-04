import { useGameStore } from '../../../state/gameStore'
import { BudgetPanel } from '../../BudgetPanel'
import { EconomyPanel } from '../../EconomyPanel'
import { CommandPanel } from '../CommandPanel'
import { CommandSection } from '../CommandSection'
import { getStrategicSummary } from '../dockSelectors'

const naira = (value: number) => `₦${Math.abs(value).toFixed(1)}bn`

function FinanceCard({
  label,
  value,
  detail,
  color,
}: {
  label: string
  value: string
  detail: string
  color?: string
}) {
  return (
    <div
      style={{
        border: '1px solid var(--border)',
        padding: '12px',
        background: 'var(--background)',
      }}
    >
      <div className="label-caps" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </div>
      <div
        style={{
          marginTop: '6px',
          fontSize: '24px',
          fontWeight: 700,
          color: color ?? 'var(--text)',
        }}
      >
        {value}
      </div>
      <p style={{ margin: '6px 0 0', fontSize: '11px', color: 'var(--text-secondary)' }}>
        {detail}
      </p>
    </div>
  )
}

export function TreasuryPanel() {
  const state = useGameStore((store) => store)
  const strategic = getStrategicSummary(state)
  const revenue = state.lastWeekRevenue?.total ?? state.stats.igr
  const expenditure = state.lastWeekExpenditure?.total ?? state.stats.expenditure

  return (
    <CommandPanel
      question="Can we pay for this?"
      summary="Budget position, cash runway, and the levers that can keep the lights on."
      statusItems={[
        {
          label: 'Cash reserve',
          value: naira(state.stats.cashReserve),
          tone: state.stats.cashReserve < 15 ? 'warning' : 'neutral',
        },
        {
          label: 'Net flow',
          value: `${strategic.netFlow >= 0 ? '+' : '−'}${naira(strategic.netFlow)}`,
          tone: strategic.netFlow >= 0 ? 'success' : 'danger',
        },
        {
          label: 'Bankruptcy clock',
          value:
            strategic.weeksOfCashLeft === Infinity
              ? 'Surplus'
              : strategic.weeksOfCashLeft < 0
                ? 'Overdrawn'
                : `~${Math.max(1, Math.floor(strategic.weeksOfCashLeft))}w`,
          tone:
            strategic.weeksOfCashLeft === Infinity
              ? 'success'
              : strategic.weeksOfCashLeft <= 8
                ? 'danger'
                : 'warning',
        },
      ]}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px',
        }}
      >
        <FinanceCard
          label="Weekly revenue"
          value={naira(revenue)}
          detail="What came in last week across IGR, FAAC, grants, and levies."
          color="var(--success-11)"
        />
        <FinanceCard
          label="Weekly spend"
          value={naira(expenditure)}
          detail="Payroll, debt service, overheads, and contractor obligations."
          color="var(--error-11)"
        />
        <FinanceCard
          label="Forecast"
          value={strategic.bankruptcyWeek ? `${strategic.bankruptcyWeek} weeks` : 'Stable'}
          detail={
            strategic.bankruptcyWeek
              ? 'Current burn rate pushes cash below zero inside the quarter forecast.'
              : 'Current trajectory stays above zero over the next 12 weeks.'
          }
          color={strategic.bankruptcyWeek ? 'var(--warning-11)' : 'var(--success-11)'}
        />
      </div>

      <CommandSection
        title="Budget snapshot"
        description="Core revenue and expenditure picture."
        collapsible
      >
        <BudgetPanel />
      </CommandSection>

      <CommandSection
        title="Finance levers"
        description="Loans, reforms, and quick interventions available right now."
        collapsible
        defaultCollapsed
      >
        <EconomyPanel />
      </CommandSection>
    </CommandPanel>
  )
}
