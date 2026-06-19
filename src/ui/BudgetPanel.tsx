import { useGameStore } from '../state/gameStore'

const naira = (v: number) => `₦${v.toFixed(2)}bn`

const REVENUE_LINES: {
  label: string
  key: 'paye' | 'mda' | 'luc' | 'other' | 'faac' | 'grants'
}[] = [
  { label: 'PAYE Tax Collection', key: 'paye' },
  { label: 'MDA Revenue', key: 'mda' },
  { label: 'Land Use Charge', key: 'luc' },
  { label: 'Other Levies & IGR', key: 'other' },
  { label: 'FAAC Allocation', key: 'faac' },
  { label: 'Aids & Grants', key: 'grants' },
]

const EXPENDITURE_LINES: {
  label: string
  key:
    | 'personnel'
    | 'debtInterest'
    | 'debtRepayment'
    | 'overheads'
    | 'subventions'
    | 'contractorPayment'
}[] = [
  { label: 'Civil Servant Salaries', key: 'personnel' },
  { label: 'Debt Interest', key: 'debtInterest' },
  { label: 'Debt Repayment', key: 'debtRepayment' },
  { label: 'Overheads', key: 'overheads' },
  { label: 'Subventions', key: 'subventions' },
  { label: 'Contractor Backlog', key: 'contractorPayment' },
]

export function BudgetPanel() {
  const igr = useGameStore((s) => s.stats.igr)
  const expenditure = useGameStore((s) => s.stats.expenditure)
  const corruptionPressure = useGameStore((s) => s.stats.corruptionPressure)
  const mode = useGameStore((s) => s.mode)
  const revenue = useGameStore((s) => s.lastWeekRevenue)
  const expBreakdown = useGameStore((s) => s.lastWeekExpenditure)

  const net = igr - expenditure

  return (
    <div className="rounded-lg bg-gray-800 p-2">
      <h2 className="text-[11px] font-semibold text-gray-400 uppercase mb-1.5">Weekly Budget</h2>
      {mode === 'detailed' ? (
        <div className="space-y-1 text-[10px]">
          <p className="text-gray-500 uppercase text-[9px] tracking-wide mt-1">Income</p>
          {REVENUE_LINES.map((line) => {
            const value = revenue?.[line.key] ?? 0
            return (
              <div key={line.key} className="flex justify-between">
                <span className="text-gray-400">{line.label}</span>
                <span className="text-gray-300">{naira(value)}</span>
              </div>
            )
          })}
          <div className="flex justify-between font-medium border-t border-gray-700 pt-0.5">
            <span className="text-gray-300">Total Income</span>
            <span className="text-green-400">{naira(igr)}</span>
          </div>
          <p className="text-gray-500 uppercase text-[9px] tracking-wide mt-1">Expenditure</p>
          {EXPENDITURE_LINES.map((line) => {
            const value = expBreakdown?.[line.key] ?? 0
            return (
              <div key={line.key} className="flex justify-between">
                <span className="text-gray-400">{line.label}</span>
                <span className="text-gray-300">{naira(value)}</span>
              </div>
            )
          })}
          <div className="flex justify-between font-medium border-t border-gray-700 pt-0.5">
            <span className="text-gray-300">Total Expenditure</span>
            <span className="text-red-400">{naira(expenditure)}</span>
          </div>
          <div className="flex justify-between pt-0.5">
            <span className="text-gray-500 italic">Corruption leakage ~{corruptionPressure.toFixed(0)}% of capital</span>
          </div>
          <div className="border-t border-gray-700 pt-0.5 mt-0.5 flex justify-between font-semibold">
            <span className="text-gray-300">Net</span>
            <span className={net >= 0 ? 'text-green-400' : 'text-red-400'}>{naira(net)}</span>
          </div>
        </div>
      ) : (
        <div className="space-y-1 text-[10px]">
          <div className="flex justify-between">
            <span className="text-gray-400">Income (IGR)</span>
            <span className="text-green-400">{naira(igr)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Expenditure</span>
            <span className="text-red-400">{naira(expenditure)}</span>
          </div>
          <div className="border-t border-gray-700 pt-1 mt-1 flex justify-between font-medium">
            <span className="text-gray-300">Net</span>
            <span className={net >= 0 ? 'text-green-400' : 'text-red-400'}>{naira(net)}</span>
          </div>
        </div>
      )}
    </div>
  )
}
