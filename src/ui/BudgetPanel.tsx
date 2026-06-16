import { useGameStore } from '../state/gameStore'

const naira = (v: number) => `₦${v.toFixed(2)}bn`

const DETAILED_INCOME = [
  { label: 'PAYE Tax Collection', value: 6.2 },
  { label: 'Land Use Charges', value: 1.1 },
  { label: 'Vehicle Reg./Fees', value: 0.8 },
  { label: 'FAAC Allocation', value: 3.2 },
  { label: 'Other Levies & IGR', value: 1.5 },
]

const DETAILED_EXPENDITURE = [
  { label: 'Civil Servant Salaries', value: 4.8 },
  { label: 'Debt Servicing', value: 1.6 },
  { label: 'Security Vote', value: 0.9 },
  { label: 'Infrastructure Maint.', value: 1.2 },
  { label: 'Health & Education', value: 1.4 },
  { label: 'Contractor Backlog', value: 0.8 },
  { label: 'Corruption Drag', value: 0.5 },
]

export function BudgetPanel() {
  const igr = useGameStore((s) => s.stats.igr)
  const expenditure = useGameStore((s) => s.stats.expenditure)
  const corruptionPressure = useGameStore((s) => s.stats.corruptionPressure)
  const mode = useGameStore((s) => s.mode)

  const corruptionDrag = expenditure * (corruptionPressure / 100) * 0.3
  const net = igr - expenditure - corruptionDrag

  const incomeTotal = DETAILED_INCOME.reduce((s, i) => s + i.value, 0)
  const expendTotal = DETAILED_EXPENDITURE.reduce((s, e) => s + e.value, 0)

  return (
    <div className="rounded-lg bg-gray-800 p-2">
      <h2 className="text-[11px] font-semibold text-gray-400 uppercase mb-1.5">Weekly Budget</h2>
      {mode === 'detailed' ? (
        <div className="space-y-1 text-[10px]">
          <p className="text-gray-500 uppercase text-[9px] tracking-wide mt-1">Income</p>
          {DETAILED_INCOME.map((item) => (
            <div key={item.label} className="flex justify-between">
              <span className="text-gray-400">{item.label}</span>
              <span className="text-gray-300">{naira(item.value)}</span>
            </div>
          ))}
          <div className="flex justify-between font-medium border-t border-gray-700 pt-0.5">
            <span className="text-gray-300">Total Income</span>
            <span className="text-green-400">{naira(incomeTotal)}</span>
          </div>
          <p className="text-gray-500 uppercase text-[9px] tracking-wide mt-1">Expenditure</p>
          {DETAILED_EXPENDITURE.map((item) => (
            <div key={item.label} className="flex justify-between">
              <span className="text-gray-400">{item.label}</span>
              <span className="text-gray-300">{naira(item.value)}</span>
            </div>
          ))}
          <div className="flex justify-between font-medium border-t border-gray-700 pt-0.5">
            <span className="text-gray-300">Total Expenditure</span>
            <span className="text-red-400">{naira(expendTotal)}</span>
          </div>
          <div className="flex justify-between pt-0.5">
            <span className="text-gray-400">Actual Net</span>
            <span className={net >= 0 ? 'text-green-400' : 'text-red-400'}>{naira(net)}</span>
          </div>
          <div className="border-t border-gray-700 pt-0.5 mt-0.5 flex justify-between font-semibold">
            <span className="text-gray-300">IGR</span>
            <span className="text-green-400">{naira(igr)}</span>
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
          <div className="flex justify-between">
            <span className="text-gray-400">Corruption Drag</span>
            <span className="text-red-400">-{naira(corruptionDrag)}</span>
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
