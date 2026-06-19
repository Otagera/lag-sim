import { useState } from 'react'
import { useGameStore } from '../state/gameStore'
import type { SimulateResult, SimulateStrategy } from '../engine/simulateEngine'

interface StatDiff {
  label: string
  before: number
  after: number
  unit?: string
  invert?: boolean // true = lower is better (corruption, youthTension)
}

function Diff({ label, before, after, unit = '', invert = false }: StatDiff) {
  const delta = after - before
  if (Math.abs(delta) < 0.05) return null
  const positive = invert ? delta < 0 : delta > 0
  const sign = delta > 0 ? '+' : ''
  const color = positive ? 'text-green-400' : 'text-red-400'
  const formatted = Math.abs(delta) >= 1 ? delta.toFixed(1) : delta.toFixed(2)
  return (
    <div className="flex justify-between text-[10px]">
      <span className="text-gray-400">{label}</span>
      <span className={color}>{sign}{formatted}{unit}</span>
    </div>
  )
}

export function DevPanel() {
  const state = useGameStore((s) => s)
  const fastForward = useGameStore((s) => s.fastForward)

  const [open, setOpen] = useState(false)
  const [weeks, setWeeks] = useState(52)
  const [strategy, setStrategy] = useState<SimulateStrategy>('weighted')
  const [seedInput, setSeedInput] = useState('')
  const [result, setResult] = useState<SimulateResult & { weekBefore: number; statsBefore: typeof state.stats; factionsBefore: typeof state.factions } | null>(null)
  const [running, setRunning] = useState(false)

  function handleSimulate() {
    setRunning(true)
    const weekBefore = state.week
    const statsBefore = { ...state.stats }
    const factionsBefore = { ...state.factions }
    const seed = seedInput ? parseInt(seedInput, 10) : undefined

    // Use setTimeout to let React paint the "running" state first
    setTimeout(() => {
      const res = fastForward(weeks, { strategy, seed })
      setResult({ ...res, weekBefore, statsBefore, factionsBefore })
      setRunning(false)
    }, 0)
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 font-mono">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded bg-yellow-600 hover:bg-yellow-500 px-2 py-1 text-[10px] font-bold text-black shadow-lg"
        >
          DEV
        </button>
      ) : (
        <div className="w-56 rounded-lg border border-yellow-600/50 bg-gray-950/95 shadow-2xl text-white">
          <div className="flex items-center justify-between px-3 py-2 border-b border-yellow-600/30">
            <span className="text-[10px] font-bold text-yellow-400">DEV PANEL</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-gray-500 hover:text-white text-xs leading-none"
            >
              ×
            </button>
          </div>

          <div className="p-3 space-y-2">
            <div>
              <label className="text-[9px] text-gray-500 uppercase tracking-wider block mb-1">Strategy</label>
              <select
                value={strategy}
                onChange={(e) => setStrategy(e.target.value as SimulateStrategy)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-[10px] text-white"
              >
                <option value="first">First choice (deterministic)</option>
                <option value="random">Random choices</option>
                <option value="weighted">Weighted (survival-biased)</option>
              </select>
            </div>

            <div>
              <label className="text-[9px] text-gray-500 uppercase tracking-wider block mb-1">Weeks to skip</label>
              <input
                type="number"
                min={1}
                max={208}
                value={weeks}
                onChange={(e) => setWeeks(Math.max(1, Math.min(208, parseInt(e.target.value) || 1)))}
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-[10px] text-white"
              />
            </div>

            <div>
              <label className="text-[9px] text-gray-500 uppercase tracking-wider block mb-1">
                Seed <span className="text-gray-600">(blank = random)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 42"
                value={seedInput}
                onChange={(e) => setSeedInput(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-[10px] text-white placeholder-gray-600"
              />
            </div>

            <button
              type="button"
              onClick={handleSimulate}
              disabled={running || state.isGameOver}
              className="w-full rounded bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-700 disabled:text-gray-500 px-2 py-1.5 text-[10px] font-bold text-black transition-colors"
            >
              {running ? 'Simulating…' : `⏩ Skip ${weeks} week${weeks === 1 ? '' : 's'}`}
            </button>

            {result && (
              <div className="mt-2 space-y-1 border-t border-gray-800 pt-2">
                <div className="text-[9px] text-gray-500">
                  Seed: {result.seed} · Week {result.weekBefore} → {result.state.week}
                  {result.stoppedEarly && <span className="text-red-400 ml-1">(game over)</span>}
                </div>

                {result.state.isGameOver && (
                  <div className="text-[9px] text-red-400 bg-red-900/30 rounded px-1.5 py-1">
                    {result.state.gameOverReason}
                  </div>
                )}

                <div className="space-y-0.5">
                  <Diff label="Cash Reserve" before={result.statsBefore.cashReserve} after={result.state.stats.cashReserve} unit="bn" />
                  <Diff label="IGR" before={result.statsBefore.igr} after={result.state.stats.igr} unit="bn" />
                  <Diff label="Public Trust" before={result.statsBefore.publicTrust} after={result.state.stats.publicTrust} unit="pts" />
                  <Diff label="Corruption" before={result.statsBefore.corruptionPressure} after={result.state.stats.corruptionPressure} unit="pts" invert />
                  <Diff label="Infrastructure" before={result.statsBefore.infrastructureScore} after={result.state.stats.infrastructureScore} unit="pts" />
                  <Diff label="Pol. Capital" before={result.statsBefore.politicalCapital} after={result.state.stats.politicalCapital} unit="pts" />
                  <Diff label="Youth Tension" before={result.statsBefore.youthTension} after={result.state.stats.youthTension} unit="pts" invert />
                  <Diff label="Debt Stock" before={result.statsBefore.debtStock} after={result.state.stats.debtStock} unit="bn" invert />
                </div>

                <div className="space-y-0.5 border-t border-gray-800 pt-1">
                  <div className="text-[9px] text-gray-500 uppercase tracking-wider">Factions</div>
                  <Diff label="Godfathers" before={result.factionsBefore.partyGodfathers} after={result.state.factions.partyGodfathers} unit="pts" />
                  <Diff label="Business" before={result.factionsBefore.businessCommunity} after={result.state.factions.businessCommunity} unit="pts" />
                  <Diff label="Civil Society" before={result.factionsBefore.civilSocietyMedia} after={result.state.factions.civilSocietyMedia} unit="pts" />
                  <Diff label="LG Chairmen" before={result.factionsBefore.lgChairmen} after={result.state.factions.lgChairmen} unit="pts" />
                </div>

                <div className="text-[9px] text-gray-600 border-t border-gray-800 pt-1">
                  Resolved events: {result.state.resolvedEvents.length}
                  {result.state.grantFreezeCount > 0 && <span className="text-orange-400 ml-2">Freezes: {result.state.grantFreezeCount}</span>}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
