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

// Fixed floor from expenditureEngine: 17 (overheads) + 9.2 (personnel) + 3.9 (subventions)
const FIXED_EXPENDITURE_FLOOR = 30.1

export function BudgetPanel() {
  const igr = useGameStore((s) => s.stats.igr)
  const expenditure = useGameStore((s) => s.stats.expenditure)
  const corruptionPressure = useGameStore((s) => s.stats.corruptionPressure)
  const mode = useGameStore((s) => s.mode)
  const activeInitiative = useGameStore((s) => s.activeInitiative)
  const revenue = useGameStore((s) => s.lastWeekRevenue)
  const expBreakdown = useGameStore((s) => s.lastWeekExpenditure)

  const net = igr - expenditure
  const revenueGap = FIXED_EXPENDITURE_FLOOR - igr
  const atFloor = igr < FIXED_EXPENDITURE_FLOOR

  return (
    <div className="rounded-lg bg-gray-800 p-2">
      <h2 className="text-[11px] font-semibold text-gray-400 uppercase mb-1.5">Weekly Budget</h2>

      {/* Fiscal health bar — always visible */}
      <div className="mb-2 rounded bg-gray-750 border border-gray-700 p-1.5">
        <div className="flex justify-between text-[10px] mb-1">
          <span className="text-gray-400">Revenue</span>
          <span className={`font-medium ${atFloor ? 'text-red-400' : 'text-green-400'}`}>{naira(igr)}</span>
        </div>
        <div className="flex justify-between text-[10px] mb-1">
          <span className="text-gray-400">Expenditure</span>
          <span className="text-red-400 font-medium">{naira(expenditure)}</span>
        </div>
        <div className="border-t border-gray-700 pt-1 flex justify-between text-[10px] font-semibold">
          <span className="text-gray-300">Net this week</span>
          <span className={net >= 0 ? 'text-green-400' : 'text-red-400'}>
            {net >= 0 ? '+' : '−'}{naira(net)}
          </span>
        </div>
        {atFloor && (
          <p className="text-[9px] text-amber-400 mt-1 leading-tight">
            Fixed commitments alone cost ₦{FIXED_EXPENDITURE_FLOOR.toFixed(0)}bn/week.
            Revenue needs to reach ₦{(FIXED_EXPENDITURE_FLOOR + 5).toFixed(0)}bn+ to sustain operations.
          </p>
        )}
      </div>

      {activeInitiative && (
        <div className="mb-2 rounded bg-gray-750 border border-blue-900/50 p-1.5">
          <p className="text-[9px] text-blue-400 uppercase tracking-wide mb-1">Active Initiative</p>
          <div className="flex justify-between text-[10px] mb-1">
            <span className="text-gray-300">{activeInitiative.name}</span>
            <span className="text-gray-400">{activeInitiative.weeksRemaining}w left</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1">
            <div
              className="bg-blue-500 h-1 rounded-full"
              style={{ width: `${((activeInitiative.totalWeeks - activeInitiative.weeksRemaining) / activeInitiative.totalWeeks) * 100}%` }}
            />
          </div>
        </div>
      )}

      {mode === 'detailed' && (
        <div className="space-y-1 text-[10px]">
          <p className="text-gray-500 uppercase text-[9px] tracking-wide">Income Breakdown</p>
          {REVENUE_LINES.map((line) => {
            const value = revenue?.[line.key] ?? 0
            return (
              <div key={line.key} className="flex justify-between">
                <span className="text-gray-400">{line.label}</span>
                <span className={value === 0 ? 'text-gray-600' : 'text-gray-300'}>{naira(value)}</span>
              </div>
            )
          })}

          <p className="text-gray-500 uppercase text-[9px] tracking-wide mt-1">Expenditure Breakdown</p>
          {EXPENDITURE_LINES.map((line) => {
            const value = expBreakdown?.[line.key] ?? 0
            const isOverhead = line.key === 'overheads'
            return (
              <div key={line.key} className="flex justify-between">
                <span className={isOverhead ? 'text-amber-500/80' : 'text-gray-400'}>{line.label}</span>
                <span className={isOverhead ? 'text-amber-400' : 'text-gray-300'}>{naira(value)}</span>
              </div>
            )
          })}
          {expBreakdown && (
            <p className="text-[9px] text-gray-600 italic mt-0.5">
              Overheads include ₦17bn fixed base — reducible through civil service reform.
            </p>
          )}

          <div className="flex justify-between pt-0.5 text-gray-500 italic">
            <span>Corruption leakage ~{corruptionPressure.toFixed(0)}% of capital</span>
          </div>

          {revenueGap > 0 && (
            <div className="rounded bg-red-950/60 border border-red-900/50 p-1.5 mt-1">
              <p className="text-[9px] text-red-300 font-medium">Revenue Gap</p>
              <p className="text-[9px] text-red-400 mt-0.5">
                You need ₦{revenueGap.toFixed(1)}bn more per week just to cover fixed commitments.
                Grow PAYE, enforce Land Use Charge, and reform overheads.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
