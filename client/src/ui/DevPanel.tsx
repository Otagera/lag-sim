import { useState } from 'react'
import { getGoal } from '../data/goals'
import type { SimulateResult, SimulateStrategy } from '../engine/simulateEngine'
import { useGameStore } from '../state/gameStore'
import type { GameState } from '../state/types'
import { SAVE_VERSION } from '../version'

interface StatDiff {
  label: string
  before: number
  after: number
  unit?: string
  invert?: boolean // true = lower is better (corruption, youthTension)
}

type DevSimResult = SimulateResult & {
  weekBefore: number
  statsBefore: GameState['stats']
  factionsBefore: GameState['factions']
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
      <span style={{ color: colorVar }}>
        {sign}
        {formatted}
        {unit}
      </span>
    </div>
  )
}

function downloadStateReport() {
  const s = useGameStore.getState()
  const exportData = {
    version: SAVE_VERSION,
    exportedAt: new Date().toISOString(),
    week: s.week,
    meta: {
      archetype: s.runMeta.archetype,
      simStrategy: s.runMeta.simStrategy,
      simSeed: s.runMeta.simSeed,
      simWeeksSkipped: s.runMeta.simWeeksSkipped,
      currentTerm: s.currentTerm,
      selectedGoalId: s.selectedGoalId,
      selectedGoalTitle: getGoal(s.selectedGoalId)?.title ?? null,
    },
    stats: s.stats,
    factions: s.factions,
    secondaryFactions: s.secondaryFactions,
    constituencyApproval: s.constituencyApproval,
    budget: { lastWeekRevenue: s.lastWeekRevenue, lastWeekExpenditure: s.lastWeekExpenditure },
    loans: s.activeLoans,
    pendingDelayed: s.pendingDelayed,
    timeline: s.timeline,
    resolvedEvents: s.resolvedEvents,
  }
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `lagos-report-week${s.week}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function DevHeader({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="flex items-center justify-between px-3 py-2"
      style={{ borderBottom: '1px solid var(--border)' }}
    >
      <span className="text-[10px] font-bold" style={{ color: 'var(--warning-11)' }}>
        DEV PANEL
      </span>
      <button
        type="button"
        onClick={onClose}
        className="text-xs leading-none"
        style={{ color: 'var(--text-secondary)' }}
      >
        ×
      </button>
    </div>
  )
}

function DevControls({
  disabled,
  running,
  seedInput,
  setSeedInput,
  setStrategy,
  setWeeks,
  strategy,
  weeks,
  onSimulate,
}: {
  disabled: boolean
  running: boolean
  seedInput: string
  setSeedInput: (value: string) => void
  setStrategy: (value: SimulateStrategy) => void
  setWeeks: (value: number) => void
  strategy: SimulateStrategy
  weeks: number
  onSimulate: () => void
}) {
  return (
    <>
      <label htmlFor="dev-panel-strategy" className="label-caps block mb-1">
        Strategy
      </label>
      <select
        id="dev-panel-strategy"
        value={strategy}
        onChange={(e) => setStrategy(e.target.value as SimulateStrategy)}
        className="w-full px-2 py-1 text-[10px] border"
        style={{
          borderColor: 'var(--border)',
          backgroundColor: 'var(--background)',
          color: 'var(--text)',
        }}
      >
        <option value="first">First choice (deterministic)</option>
        <option value="random">Random choices</option>
        <option value="weighted">Weighted (survival-biased)</option>
        <option value="winning">Winning (tuned strategy)</option>
      </select>
      <label htmlFor="dev-panel-weeks" className="label-caps block mb-1 mt-2">
        Weeks to skip
      </label>
      <input
        id="dev-panel-weeks"
        type="number"
        min={1}
        max={208}
        value={weeks}
        onChange={(e) => setWeeks(Math.max(1, Math.min(208, parseInt(e.target.value, 10) || 1)))}
        className="w-full px-2 py-1 text-[10px] border"
        style={{
          borderColor: 'var(--border)',
          backgroundColor: 'var(--background)',
          color: 'var(--text)',
        }}
      />
      <label htmlFor="dev-panel-seed" className="label-caps block mb-1 mt-2">
        Seed <span style={{ color: 'var(--border-strong)' }}>(blank = random)</span>
      </label>
      <input
        id="dev-panel-seed"
        type="text"
        placeholder="e.g. 42"
        value={seedInput}
        onChange={(e) => setSeedInput(e.target.value)}
        className="w-full px-2 py-1 text-[10px] border"
        style={{
          borderColor: 'var(--border)',
          backgroundColor: 'var(--background)',
          color: 'var(--text)',
        }}
      />
      <button
        type="button"
        onClick={onSimulate}
        disabled={disabled}
        className="w-full px-2 py-1.5 text-[10px] font-bold transition-colors mt-2"
        style={{
          backgroundColor: disabled ? 'var(--neutral-4)' : 'var(--warning-9)',
          color: disabled ? 'var(--text-secondary)' : 'var(--neutral-12)',
        }}
      >
        {running ? 'Simulating…' : `⏩ Skip ${weeks} week${weeks === 1 ? '' : 's'}`}
      </button>
    </>
  )
}

function ResultSummary({ result }: { result: DevSimResult }) {
  return (
    <>
      <div className="text-[9px]" style={{ color: 'var(--text-secondary)' }}>
        Seed: {result.seed} · Week {result.weekBefore} → {result.state.week}
        {result.stoppedEarly && (
          <span className="ml-1" style={{ color: 'var(--error-11)' }}>
            (game over)
          </span>
        )}
      </div>
      {result.state.reElected && (
        <div
          className="text-[9px] px-1.5 py-1 font-bold"
          style={{ color: 'var(--success-11)', backgroundColor: 'var(--success-3)' }}
        >
          RE-ELECTED — {result.state.electionResult?.toFixed(1)}% of vote · Term{' '}
          {result.state.currentTerm}
        </div>
      )}
      {result.state.electionResult !== undefined &&
        result.state.electionResult !== null &&
        !result.state.reElected && (
          <div
            className="text-[9px] px-1.5 py-1 font-bold"
            style={{ color: 'var(--text)', backgroundColor: 'var(--warning-3)' }}
          >
            Election: {result.state.electionResult.toFixed(1)}% — not re-elected
          </div>
        )}
      {result.state.isGameOver && (
        <div
          className="text-[9px] px-1.5 py-1"
          style={{ color: 'var(--error-11)', backgroundColor: 'var(--error-3)' }}
        >
          {result.state.gameOverReason}
        </div>
      )}
    </>
  )
}

function StatDiffs({ result }: { result: DevSimResult }) {
  const { statsBefore } = result
  const statsAfter = result.state.stats
  return (
    <div className="space-y-0.5">
      <Diff
        label="Cash Reserve"
        before={statsBefore.cashReserve}
        after={statsAfter.cashReserve}
        unit="bn"
      />
      <Diff label="IGR" before={statsBefore.igr} after={statsAfter.igr} unit="bn" />
      <Diff
        label="Public Trust"
        before={statsBefore.publicTrust}
        after={statsAfter.publicTrust}
        unit="pts"
      />
      <Diff
        label="Corruption"
        before={statsBefore.corruptionPressure}
        after={statsAfter.corruptionPressure}
        unit="pts"
        invert
      />
      <Diff
        label="Infrastructure"
        before={statsBefore.infrastructureScore}
        after={statsAfter.infrastructureScore}
        unit="pts"
      />
      <Diff
        label="Pol. Capital"
        before={statsBefore.politicalCapital}
        after={statsAfter.politicalCapital}
        unit="pts"
      />
      <Diff
        label="Youth Tension"
        before={statsBefore.youthTension}
        after={statsAfter.youthTension}
        unit="pts"
        invert
      />
      <Diff
        label="Debt Stock"
        before={statsBefore.debtStock}
        after={statsAfter.debtStock}
        unit="bn"
        invert
      />
    </div>
  )
}

function FactionDiffs({ result }: { result: DevSimResult }) {
  const before = result.factionsBefore
  const after = result.state.factions
  return (
    <div className="space-y-0.5 pt-1" style={{ borderTop: '1px solid var(--border)' }}>
      <p className="label-caps">Factions</p>
      <Diff
        label="Godfathers"
        before={before.partyGodfathers}
        after={after.partyGodfathers}
        unit="pts"
      />
      <Diff
        label="Business"
        before={before.businessCommunity}
        after={after.businessCommunity}
        unit="pts"
      />
      <Diff
        label="Civil Society"
        before={before.civilSocietyMedia}
        after={after.civilSocietyMedia}
        unit="pts"
      />
      <Diff label="LG Chairmen" before={before.lgChairmen} after={after.lgChairmen} unit="pts" />
    </div>
  )
}

function ResultFooter({ result }: { result: DevSimResult }) {
  return (
    <div
      className="text-[9px] pt-1"
      style={{ borderTop: '1px solid var(--border)', color: 'var(--text-secondary)' }}
    >
      Resolved events: {result.state.resolvedEvents.length}
      {result.state.grantFreezeCount > 0 && (
        <span className="ml-2" style={{ color: 'var(--warning-11)' }}>
          Freezes: {result.state.grantFreezeCount}
        </span>
      )}
    </div>
  )
}

function ResultPanel({ result }: { result: DevSimResult | null }) {
  if (!result) return null
  return (
    <div className="mt-2 space-y-1 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
      <ResultSummary result={result} />
      <StatDiffs result={result} />
      <FactionDiffs result={result} />
      <ResultFooter result={result} />
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
  const [result, setResult] = useState<DevSimResult | null>(null)
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

  if (!open) {
    return (
      <div className="fixed bottom-4 right-4 z-50 font-mono">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="px-2 py-1 text-[10px] font-bold"
          style={{ backgroundColor: 'var(--warning-9)', color: 'var(--neutral-12)' }}
        >
          DEV
        </button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 font-mono">
      <div
        className="w-56 border"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
      >
        <DevHeader onClose={() => setOpen(false)} />
        <div className="p-3 space-y-2">
          <DevControls
            disabled={disabled}
            running={running}
            seedInput={seedInput}
            setSeedInput={setSeedInput}
            setStrategy={setStrategy}
            setWeeks={setWeeks}
            strategy={strategy}
            weeks={weeks}
            onSimulate={handleSimulate}
          />
          <button
            type="button"
            onClick={downloadStateReport}
            className="w-full px-2 py-1.5 text-[10px] font-medium transition-colors border"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border)',
              color: 'var(--text-secondary)',
            }}
            title="Download the current game state as a JSON report"
          >
            ⬇ Download report (JSON)
          </button>
          <ResultPanel result={result} />
        </div>
      </div>
    </div>
  )
}
