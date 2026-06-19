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
    case 'A': return 'text-green-400'
    case 'B': return 'text-blue-400'
    case 'C': return 'text-yellow-400'
    case 'D': return 'text-orange-400'
    default: return 'text-red-400'
  }
}

export function LegacyScreen() {
  const state = useGameStore((s) => s)
  const legacy = buildLegacy(state)

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
    <div className="min-h-screen bg-gray-950 text-white py-8 px-4 overflow-y-auto">
      <div className="max-w-2xl mx-auto space-y-8">

        {/* Masthead */}
        <div className="border-b-2 border-gray-700 pb-4 text-center">
          <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">
            Lagos State Government — Term End Report
          </div>
          <h1 className="text-2xl font-bold">
            {state.reElected ? 'Re-Election Victory' : state.reElected === false ? 'Term Ended — Defeat' : 'End of Term'}
          </h1>
          <p className="text-gray-400 text-xs mt-1">
            {endDate} &middot; {totalEvents} major decisions &middot; {state.week} weeks in office
          </p>
          {state.electionResult !== null && (
            <div className={`mt-2 text-sm font-semibold ${state.reElected ? 'text-green-400' : 'text-red-400'}`}>
              Election result: {state.electionResult.toFixed(1)}% vote share
            </div>
          )}
        </div>

        {/* Headlines */}
        <div className="space-y-4">
          <h2 className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">
            The Record — As History Will Judge It
          </h2>
          {legacy.headlines.map((headline, i) => (
            <div key={headline.key} className="border-l-2 border-gray-700 pl-4">
              <div className="text-[9px] text-gray-600 mb-0.5">VANGUARD / PUNCH / THE NATION #{i + 1}</div>
              <h3 className="text-sm font-bold text-white leading-snug">{headline.headline}</h3>
              <p className="text-gray-400 text-xs mt-1 leading-relaxed">{headline.subhead}</p>
            </div>
          ))}
        </div>

        {/* Governor's Final Address */}
        <div className="rounded-xl border border-gray-700 bg-gray-900 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="text-[10px] text-gray-500 uppercase tracking-widest">
              Governor's Final Press Address
            </div>
            <span className="text-[9px] rounded px-1.5 py-0.5 bg-gray-700 text-gray-400">
              {monologueLabel}
            </span>
          </div>
          <p className="text-gray-200 text-sm leading-relaxed italic">
            "{legacy.monologue}"
          </p>
        </div>

        {/* Stats Grid */}
        <div>
          <h2 className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-3">
            Final Scorecard
          </h2>
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
                  <span className={`text-2xl font-bold ${gradeColor(g)}`}>{g}</span>
                  <span className="text-[9px] text-gray-500 uppercase">{label}</span>
                  <span className={`text-[9px] ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {change >= 0 ? '+' : ''}{change.toFixed(0)}
                  </span>
                </div>
              )
            })}
          </div>

          <div className="grid grid-cols-2 gap-3 text-[10px]">
            <div className="space-y-1">
              <p className="text-gray-500 uppercase text-[9px] tracking-wide">Factions</p>
              {(Object.keys(state.factions) as FactionKey[]).map((key) => {
                const change = state.factions[key] - STARTING_STATE.factions[key]
                return (
                  <div key={key} className="flex justify-between">
                    <span className="text-gray-400 truncate mr-1">{FACTION_LABELS[key]}</span>
                    <span className="text-gray-300 shrink-0">
                      {state.factions[key]}
                      <span className={change >= 0 ? 'text-green-400 ml-0.5' : 'text-red-400 ml-0.5'}>
                        ({change >= 0 ? '+' : ''}{change})
                      </span>
                    </span>
                  </div>
                )
              })}
            </div>
            <div className="space-y-1">
              <p className="text-gray-500 uppercase text-[9px] tracking-wide">Constituencies</p>
              {(Object.keys(state.constituencyApproval) as ConstituencyKey[]).map((key) => {
                const change = state.constituencyApproval[key] - STARTING_STATE.constituencyApproval[key]
                return (
                  <div key={key} className="flex justify-between">
                    <span className="text-gray-400 truncate mr-1">{CONSTITUENCY_LABELS[key]}</span>
                    <span className="text-gray-300 shrink-0">
                      {state.constituencyApproval[key]}%
                      <span className={change >= 0 ? 'text-green-400 ml-0.5' : 'text-red-400 ml-0.5'}>
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
              <p className="text-gray-500">Cash</p>
              <p className={`font-bold ${state.stats.cashReserve >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {state.stats.cashReserve >= 0 ? 'A' : 'F'}
              </p>
              <p className="text-gray-400">₦{state.stats.cashReserve.toFixed(0)}bn</p>
            </div>
            <div>
              <p className="text-gray-500">Fashemu</p>
              <p className="text-gray-300 font-bold capitalize">{state.fashemuPhase}</p>
              <p className="text-gray-400">Path {state.fashemuEndingPath ?? '—'}</p>
            </div>
            <div>
              <p className="text-gray-500">Compliance</p>
              <p className="text-gray-300 font-bold">{state.godfatherComplianceCount}/{state.godfatherComplianceCount + state.godfatherRefusalCount}</p>
              <p className="text-gray-400">accepted</p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <button
            type="button"
            onClick={handleNewGame}
            className="rounded-lg bg-blue-600 hover:bg-blue-500 px-8 py-3 text-sm font-semibold transition-colors"
          >
            New Game
          </button>
        </div>
      </div>
    </div>
  )
}
