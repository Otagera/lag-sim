import { useGameStore } from '../state/gameStore'

const naira = (v: number) => `₦${v.toFixed(2)}bn`

export function BudgetPanel() {
  const igr = useGameStore((s) => s.stats.igr)
  const expenditure = useGameStore((s) => s.stats.expenditure)
  const corruptionPressure = useGameStore((s) => s.stats.corruptionPressure)

  const corruptionDrag = expenditure * (corruptionPressure / 100) * 0.3
  const net = igr - expenditure - corruptionDrag

  return (
    <div className="rounded-lg bg-gray-800 p-3">
      <h2 className="text-sm font-semibold text-gray-400 uppercase mb-2">Weekly Budget</h2>
      <div className="space-y-1 text-xs">
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
    </div>
  )
}
