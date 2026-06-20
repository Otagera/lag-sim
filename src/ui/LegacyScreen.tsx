import { useState } from 'react'
import { buildLegacy } from '../data/legacy'
import { STARTING_STATE } from '../data/startingState'
import { useGameStore } from '../state/gameStore'
import { clearSave } from '../state/persistence'
import type { ConstituencyKey, FactionKey } from '../state/types'
import { formatGameDate } from '../utils/calendar'

const FACTION_LABELS: Record<FactionKey, string> = {
  businessCommunity: 'Business Community',
  informalEconomy: 'Informal Economy',
  partyGodfathers: 'Party Godfathers',
  federalGovt: 'Federal Government',
  civilSocietyMedia: 'Civil Society & Media',
  lgChairmen: 'LG Chairmen',
}

const CONSTITUENCY_LABELS: Record<ConstituencyKey, string> = {
  lagosIsland: 'Lagos Island',
  victoriaIsland: 'Victoria Island',
  lekki: 'Lekki',
  surulere: 'Surulere',
  oshodi: 'Oshodi',
  alimosho: 'Alimosho',
  periphery: 'Periphery',
  makoko: 'Makoko',
}

function grade(value: number, max: number): string {
  const pct = value / max
  if (pct >= 0.9) return 'A'
  if (pct >= 0.75) return 'B'
  if (pct >= 0.6) return 'C'
  if (pct >= 0.4) return 'D'
  return 'F'
}

function gradeColor(g: string): string {
  switch (g) {
    case 'A': return 'var(--success-11)'
    case 'B': return 'var(--info-11)'
    case 'C': return 'var(--warning-11)'
    case 'D': return 'var(--warning-9)'
    default: return 'var(--error-11)'
  }
}

export function LegacyScreen() {
  const state = useGameStore((s) => s)
  const legacy = buildLegacy(state)
  const [btnHover, setBtnHover] = useState(false)

  const endDate = formatGameDate(state.week)
  const totalEvents = state.resolvedEvents.length

  const monologueStyle = legacy.monologueStyle
  const monologueLabel =
    monologueStyle === 'compliant'
      ? 'The Pragmatist'
      : monologueStyle === 'reformer'
        ? 'The Reformer'
        : 'The Survivor'

  function handleNewGame() {
    clearSave()
    window.location.reload()
  }

  return (
    <div className="min-h-screen py-8 px-4 overflow-y-auto" style={{ backgroundColor: 'var(--background)', color: 'var(--text)' }}>
      <div className="max-w-2xl mx-auto space-y-8">

        {/* Masthead — accent-solid bottom rule mirrors modal header treatment */}
        <div className="pb-4 text-center" style={{ borderBottom: '2px solid var(--accent-solid)' }}>
          <p className="label-caps mb-1">Lagos State Government — Term End Report</p>
          <h1 className="font-display text-2xl font-semibold" style={{ color: 'var(--text)' }}>
            {state.reElected ? 'Re-Election Victory' : state.reElected === false ? 'Term Ended — Defeat' : 'End of Term'}
          </h1>
          <p className="text-[11px] mt-1" style={{ color: 'var(--text-secondary)' }}>
            {endDate} &middot; {totalEvents} major decisions &middot; {state.week} weeks in office
          </p>
          {state.electionResult !== null && (
            <p className="mt-2 text-sm font-semibold" style={{ color: state.reElected ? 'var(--success-11)' : 'var(--error-11)' }}>
              Election result: {state.electionResult.toFixed(1)}% vote share
            </p>
          )}
        </div>

        {/* Headlines */}
        <div className="space-y-4">
          <h2 className="label-caps">The Record — As History Will Judge It</h2>
          {legacy.headlines.map((headline, i) => (
            <div key={headline.key} style={{ borderLeft: '2px solid var(--border)', paddingLeft: '16px' }}>
              <p className="text-[9px] mb-0.5" style={{ color: 'var(--border-strong)' }}>
                VANGUARD / PUNCH / THE NATION #{i + 1}
              </p>
              <h3 className="font-display text-sm font-semibold leading-snug" style={{ color: 'var(--text)' }}>
                {headline.headline}
              </h3>
              <p className="text-[11px] mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {headline.subhead}
              </p>
            </div>
          ))}
        </div>

        {/* Governor's Final Address */}
        <div className="p-4 border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
          <div className="flex items-center gap-2 mb-3">
            <p className="label-caps">Governor's Final Press Address</p>
            <span
              className="text-[9px] px-1.5 py-0.5"
              style={{ backgroundColor: 'var(--neutral-4)', color: 'var(--text-secondary)' }}
            >
              {monologueLabel}
            </span>
          </div>
          <p className="text-sm leading-relaxed italic" style={{ color: 'var(--text)' }}>
            "{legacy.monologue}"
          </p>
        </div>

        {/* Stats Grid */}
        <div>
          <h2 className="label-caps mb-3">Final Scorecard</h2>
          <div className="flex justify-center gap-4 mb-4">
            {(['publicTrust', 'infrastructureScore', 'securityIndex', 'youthTension'] as const).map((key) => {
              const val = key === 'youthTension' ? 100 - state.stats[key] : state.stats[key]
              const g = grade(val, 100)
              const label =
                key === 'publicTrust' ? 'Trust' :
                key === 'infrastructureScore' ? 'Infra' :
                key === 'securityIndex' ? 'Security' : 'Youth'
              const change = val - (key === 'youthTension' ? 100 - STARTING_STATE.stats[key] : STARTING_STATE.stats[key])
              return (
                <div key={key} className="flex flex-col items-center">
                  <span className="text-2xl font-bold" style={{ color: gradeColor(g) }}>{g}</span>
                  <span className="label-caps">{label}</span>
                  <span className="text-[9px]" style={{ color: change >= 0 ? 'var(--success-11)' : 'var(--error-11)' }}>
                    {change >= 0 ? '+' : ''}{change.toFixed(0)}
                  </span>
                </div>
              )
            })}
          </div>

          <div className="grid grid-cols-2 gap-3 text-[10px]">
            <div className="space-y-1">
              <p className="label-caps">Factions</p>
              {(Object.keys(state.factions) as FactionKey[]).map((key) => {
                const change = state.factions[key] - STARTING_STATE.factions[key]
                return (
                  <div key={key} className="flex justify-between">
                    <span className="truncate mr-1" style={{ color: 'var(--text-secondary)' }}>{FACTION_LABELS[key]}</span>
                    <span className="shrink-0" style={{ color: 'var(--text)' }}>
                      {state.factions[key]}
                      <span className="ml-0.5" style={{ color: change >= 0 ? 'var(--success-11)' : 'var(--error-11)' }}>
                        ({change >= 0 ? '+' : ''}{change})
                      </span>
                    </span>
                  </div>
                )
              })}
            </div>
            <div className="space-y-1">
              <p className="label-caps">Constituencies</p>
              {(Object.keys(state.constituencyApproval) as ConstituencyKey[]).map((key) => {
                const change = state.constituencyApproval[key] - STARTING_STATE.constituencyApproval[key]
                return (
                  <div key={key} className="flex justify-between">
                    <span className="truncate mr-1" style={{ color: 'var(--text-secondary)' }}>{CONSTITUENCY_LABELS[key]}</span>
                    <span className="shrink-0" style={{ color: 'var(--text)' }}>
                      {state.constituencyApproval[key]}%
                      <span className="ml-0.5" style={{ color: change >= 0 ? 'var(--success-11)' : 'var(--error-11)' }}>
                        ({change >= 0 ? '+' : ''}{change})
                      </span>
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px]">
            <div>
              <p className="label-caps">Cash</p>
              <p className="font-bold" style={{ color: state.stats.cashReserve >= 0 ? 'var(--success-11)' : 'var(--error-11)' }}>
                {state.stats.cashReserve >= 0 ? 'A' : 'F'}
              </p>
              <p style={{ color: 'var(--text-secondary)' }}>₦{state.stats.cashReserve.toFixed(0)}bn</p>
            </div>
            <div>
              <p className="label-caps">Fashemu</p>
              <p className="font-semibold capitalize" style={{ color: 'var(--text)' }}>{state.fashemuPhase}</p>
              <p style={{ color: 'var(--text-secondary)' }}>Path {state.fashemuEndingPath ?? '—'}</p>
            </div>
            <div>
              <p className="label-caps">Compliance</p>
              <p className="font-semibold" style={{ color: 'var(--text)' }}>
                {state.godfatherComplianceCount}/{state.godfatherComplianceCount + state.godfatherRefusalCount}
              </p>
              <p style={{ color: 'var(--text-secondary)' }}>accepted</p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <button
            type="button"
            onClick={handleNewGame}
            onMouseEnter={() => setBtnHover(true)}
            onMouseLeave={() => setBtnHover(false)}
            className="px-8 py-3 text-sm font-semibold transition-colors"
            style={{
              backgroundColor: btnHover ? 'var(--accent-10)' : 'var(--accent-solid)',
              color: 'var(--accent-on-solid)',
            }}
          >
            New Game
          </button>
        </div>
      </div>
    </div>
  )
}
