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
  const colorVar = positive ? 'var(--success-11)' : 'var(--error-11)'
  const formatted = Math.abs(delta) >= 1 ? delta.toFixed(1) : delta.toFixed(2)
  return (
    <div className="flex justify-between text-[10px]">
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ color: colorVar }}>{sign}{formatted}{unit}</span>
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

  const disabled = running || state.isGameOver

  return (
    <div className="fixed bottom-4 right-4 z-50 font-mono">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="px-2 py-1 text-[10px] font-bold"
          style={{ backgroundColor: 'var(--warning-9)', color: 'var(--neutral-12)' }}
        >
          DEV
        </button>
      ) : (
        <div className="w-56 border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
          <div
            className="flex items-center justify-between px-3 py-2"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <span className="text-[10px] font-bold" style={{ color: 'var(--warning-11)' }}>DEV PANEL</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs leading-none"
              style={{ color: 'var(--text-secondary)' }}
            >
              ×
            </button>
          </div>

          <div className="p-3 space-y-2">
            <div>
              <label className="label-caps block mb-1">Strategy</label>
              <select
                value={strategy}
                onChange={(e) => setStrategy(e.target.value as SimulateStrategy)}
                className="w-full px-2 py-1 text-[10px] border"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)', color: 'var(--text)' }}
              >
                <option value="first">First choice (deterministic)</option>
                <option value="random">Random choices</option>
                <option value="weighted">Weighted (survival-biased)</option>
                <option value="winning">Winning (tuned strategy)</option>
              </select>
            </div>

            <div>
              <label className="label-caps block mb-1">Weeks to skip</label>
              <input
                type="number"
                min={1}
                max={208}
                value={weeks}
                onChange={(e) => setWeeks(Math.max(1, Math.min(208, parseInt(e.target.value) || 1)))}
                className="w-full px-2 py-1 text-[10px] border"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)', color: 'var(--text)' }}
              />
            </div>

            <div>
              <label className="label-caps block mb-1">
                Seed <span style={{ color: 'var(--border-strong)' }}>(blank = random)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 42"
                value={seedInput}
                onChange={(e) => setSeedInput(e.target.value)}
                className="w-full px-2 py-1 text-[10px] border"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)', color: 'var(--text)' }}
              />
            </div>

            <button
              type="button"
              onClick={handleSimulate}
              disabled={disabled}
              className="w-full px-2 py-1.5 text-[10px] font-bold transition-colors"
              style={{
                backgroundColor: disabled ? 'var(--neutral-4)' : 'var(--warning-9)',
                color: disabled ? 'var(--text-secondary)' : 'var(--neutral-12)',
              }}
            >
              {running ? 'Simulating…' : `⏩ Skip ${weeks} week${weeks === 1 ? '' : 's'}`}
            </button>

            {result && (
              <div className="mt-2 space-y-1 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                <div className="text-[9px]" style={{ color: 'var(--text-secondary)' }}>
                  Seed: {result.seed} · Week {result.weekBefore} → {result.state.week}
                  {result.stoppedEarly && (
                    <span className="ml-1" style={{ color: 'var(--error-11)' }}>(game over)</span>
                  )}
                </div>

                {result.state.reElected && (
                  <div className="text-[9px] px-1.5 py-1 font-bold" style={{ color: 'var(--success-11)', backgroundColor: 'var(--success-3)' }}>
                    RE-ELECTED — {result.state.electionResult?.toFixed(1)}% of vote · Term {result.state.currentTerm}
                  </div>
                )}
                {result.state.electionResult !== undefined && result.state.electionResult !== null && !result.state.reElected && (
                  <div className="text-[9px] px-1.5 py-1 font-bold" style={{ color: 'var(--text)', backgroundColor: 'var(--warning-3)' }}>
                    Election: {result.state.electionResult.toFixed(1)}% — not re-elected
                  </div>
                )}

                {result.state.isGameOver && (
                  <div className="text-[9px] px-1.5 py-1" style={{ color: 'var(--error-11)', backgroundColor: 'var(--error-3)' }}>
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

                <div className="space-y-0.5 pt-1" style={{ borderTop: '1px solid var(--border)' }}>
                  <p className="label-caps">Factions</p>
                  <Diff label="Godfathers" before={result.factionsBefore.partyGodfathers} after={result.state.factions.partyGodfathers} unit="pts" />
                  <Diff label="Business" before={result.factionsBefore.businessCommunity} after={result.state.factions.businessCommunity} unit="pts" />
                  <Diff label="Civil Society" before={result.factionsBefore.civilSocietyMedia} after={result.state.factions.civilSocietyMedia} unit="pts" />
                  <Diff label="LG Chairmen" before={result.factionsBefore.lgChairmen} after={result.state.factions.lgChairmen} unit="pts" />
                </div>

                <div className="text-[9px] pt-1" style={{ borderTop: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                  Resolved events: {result.state.resolvedEvents.length}
                  {result.state.grantFreezeCount > 0 && (
                    <span className="ml-2" style={{ color: 'var(--warning-11)' }}>
                      Freezes: {result.state.grantFreezeCount}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
