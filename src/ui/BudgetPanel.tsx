import { useGameStore } from '../state/gameStore'

const naira = (v: number) => `₦${Math.abs(v).toFixed(1)}bn`

const REVENUE_LINES: { label: string; key: 'paye' | 'mda' | 'luc' | 'other' | 'faac' | 'grants' }[] = [
  { label: 'PAYE Tax Collection', key: 'paye' },
  { label: 'MDA Revenue', key: 'mda' },
  { label: 'Land Use Charge', key: 'luc' },
  { label: 'Other Levies & IGR', key: 'other' },
  { label: 'FAAC Allocation', key: 'faac' },
  { label: 'Aids & Grants', key: 'grants' },
]

const EXPENDITURE_LINES: {
  label: string
  key: 'personnel' | 'debtInterest' | 'debtRepayment' | 'overheads' | 'subventions' | 'contractorPayment'
}[] = [
  { label: 'Civil Servant Salaries', key: 'personnel' },
  { label: 'Debt Interest', key: 'debtInterest' },
  { label: 'Debt Repayment', key: 'debtRepayment' },
  { label: 'Overheads', key: 'overheads' },
  { label: 'Subventions', key: 'subventions' },
  { label: 'Contractor Backlog', key: 'contractorPayment' },
]

const FIXED_EXPENDITURE_FLOOR = 30.1

export function BudgetPanel() {
  const igr = useGameStore((s) => s.stats.igr)
  const expenditure = useGameStore((s) => s.stats.expenditure)
  const corruptionPressure = useGameStore((s) => s.stats.corruptionPressure)
  const mode = useGameStore((s) => s.mode)
  const activeInitiative = useGameStore((s) => s.activeInitiative)
  const revenue = useGameStore((s) => s.lastWeekRevenue)
  const expBreakdown = useGameStore((s) => s.lastWeekExpenditure)

  const stats = useGameStore((s) => s.stats)
  const resolvedEvents = useGameStore((s) => s.resolvedEvents)

  const net = igr - expenditure
  const revenueGap = FIXED_EXPENDITURE_FLOOR - igr
  const atFloor = igr < FIXED_EXPENDITURE_FLOOR

  const payeDone = resolvedEvents.includes('paye-enforcement-result')
  const payeActive = activeInitiative?.id === 'paye-enforcement'
  const lucAtMax = stats.landUseChargeEnforcement >= 3
  const overheadsCut = stats.baseOverheads <= -3 && stats.subventionCutRate >= 0.3
  const grantDone = resolvedEvents.includes('world-bank-grant-result')
  const grantActive = activeInitiative?.id === 'grants-mobilisation'

  const levers = []
  if (!payeActive && !payeDone) levers.push('grow PAYE')
  if (!lucAtMax) levers.push('enforce Land Use Charge')
  if (!overheadsCut) levers.push('reform overheads')
  if (stats.grantsCompliance < 0.9 && !grantActive && !grantDone)
    levers.push('secure World Bank grant')

  return (
    <div className="p-2 border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
      <h2 className="label-caps mb-2">Weekly Budget</h2>

      <div className="mb-2 p-1.5 border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)' }}>
        <div className="flex justify-between text-[10px] mb-1">
          <span style={{ color: 'var(--text-secondary)' }}>Revenue</span>
          <span className="font-semibold" style={{ color: atFloor ? 'var(--error-11)' : 'var(--success-11)' }}>{naira(igr)}</span>
        </div>
        <div className="flex justify-between text-[10px] mb-1">
          <span style={{ color: 'var(--text-secondary)' }}>Expenditure</span>
          <span className="font-semibold" style={{ color: 'var(--error-11)' }}>{naira(expenditure)}</span>
        </div>
        <div className="flex justify-between text-[10px] font-semibold pt-1" style={{ borderTop: '1px solid var(--border)' }}>
          <span style={{ color: 'var(--text)' }}>Net this week</span>
          <span style={{ color: net >= 0 ? 'var(--success-11)' : 'var(--error-11)' }}>
            {net >= 0 ? '+' : '−'}{naira(net)}
          </span>
        </div>
        {atFloor && (
          <p className="text-[9px] mt-1 leading-tight" style={{ color: 'var(--warning-11)' }}>
            Fixed commitments alone cost ₦{FIXED_EXPENDITURE_FLOOR.toFixed(0)}bn/week.
            Revenue needs to reach ₦{(FIXED_EXPENDITURE_FLOOR + 5).toFixed(0)}bn+ to sustain operations.
          </p>
        )}
      </div>

      {activeInitiative && (
        <div className="mb-2 p-1.5 border" style={{ borderColor: 'var(--accent-solid)', backgroundColor: 'var(--accent-bg-subtle)' }}>
          <p className="label-caps mb-1" style={{ color: 'var(--accent-text)' }}>Active Initiative</p>
          <div className="flex justify-between text-[10px] mb-1">
            <span style={{ color: 'var(--text)' }}>{activeInitiative.name}</span>
            <span style={{ color: 'var(--text-secondary)' }}>{activeInitiative.weeksRemaining}w left</span>
          </div>
          <div className="w-full h-1" style={{ backgroundColor: 'var(--neutral-4)' }}>
            <div
              className="h-full"
              style={{
                width: `${((activeInitiative.totalWeeks - activeInitiative.weeksRemaining) / activeInitiative.totalWeeks) * 100}%`,
                backgroundColor: 'var(--accent-solid)',
              }}
            />
          </div>
        </div>
      )}

      {mode === 'detailed' && (
        <div className="space-y-1 text-[10px]">
          <p className="label-caps mt-1">Income Breakdown</p>
          {REVENUE_LINES.map((line) => {
            const value = revenue?.[line.key] ?? 0
            return (
              <div key={line.key} className="flex justify-between">
                <span style={{ color: 'var(--text-secondary)' }}>{line.label}</span>
                <span style={{ color: value === 0 ? 'var(--border-strong)' : 'var(--text)' }}>{naira(value)}</span>
              </div>
            )
          })}

          <p className="label-caps mt-2">Expenditure Breakdown</p>
          {EXPENDITURE_LINES.map((line) => {
            const value = expBreakdown?.[line.key] ?? 0
            const isOverhead = line.key === 'overheads'
            return (
              <div key={line.key} className="flex justify-between">
                <span style={{ color: isOverhead ? 'var(--warning-11)' : 'var(--text-secondary)' }}>{line.label}</span>
                <span style={{ color: isOverhead ? 'var(--warning-9)' : 'var(--text)' }}>{naira(value)}</span>
              </div>
            )
          })}
          {expBreakdown && (
            <p className="text-[9px] mt-0.5 italic" style={{ color: 'var(--border-strong)' }}>
              Overheads include ₦17bn fixed base — reducible through civil service reform.
            </p>
          )}

          <div className="flex justify-between pt-0.5 italic" style={{ color: 'var(--text-secondary)' }}>
            <span>Corruption leakage ~{corruptionPressure.toFixed(0)}% of capital</span>
          </div>

          {revenueGap > 0 && (
            <div className="p-1.5 mt-1 border" style={{ borderColor: 'var(--error-9)', backgroundColor: 'var(--error-3)' }}>
              <p className="text-[9px] font-semibold" style={{ color: 'var(--error-11)' }}>Revenue Gap</p>
              <p className="text-[9px] mt-0.5" style={{ color: 'var(--error-11)' }}>
                {levers.length > 0
                  ? `You need ₦${revenueGap.toFixed(1)}bn more per week. ${levers.join(', ')}.`
                  : `You've pulled every lever available — the remaining gap needs spending cuts or new debt.`}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
