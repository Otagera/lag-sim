import { STARTING_STATE } from '../data/startingState'
import { useGameStore } from '../state/gameStore'
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
  lagosIsland:      'Lagos Island',
  etiOsa:           'Eti Osa',
  ibejuLekki:       'Ibeju-Lekki',
  surulere:         'Surulere',
  amuwoOdofin:      'Amuwo Odofin',
  apapa:            'Apapa',
  oshodiIsolo:      'Oshodi/Isolo',
  mushin:           'Mushin',
  shomolu:          'Shomolu',
  kosofe:           'Kosofe',
  lagosMainland:    'Lagos Mainland',
  ikeja:            'Ikeja',
  alimosho:         'Alimosho',
  agege:            'Agege',
  ifakoIjaye:       'Ifako/Ijaye',
  badagry:          'Badagry',
  epe:              'Epe',
  ikorodu:          'Ikorodu',
  ojo:              'Ojo',
  ajeromiIfelodun:  'Ajeromi/Ifelodun',
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
    case 'A':
      return 'text-green-400'
    case 'B':
      return 'text-blue-400'
    case 'C':
      return 'text-yellow-400'
    case 'D':
      return 'text-orange-400'
    default:
      return 'text-red-400'
  }
}

export function Scorecard() {
  const week = useGameStore((s) => s.week)
  const stats = useGameStore((s) => s.stats)
  const factions = useGameStore((s) => s.factions)
  const approval = useGameStore((s) => s.constituencyApproval)

  const cashGrade = stats.cashReserve >= 0 ? 'A' : 'F'

  const avgFaction =
    Object.values(factions).reduce((s, v) => s + v, 0) / Object.keys(factions).length
  const factionGrade = grade(avgFaction + 100, 200)

  const avgApproval =
    Object.values(approval).reduce((s, v) => s + v, 0) / Object.keys(approval).length
  const approvalGrade = grade(avgApproval, 100)

  const totalEvents = useGameStore((s) => s.resolvedEvents).length

  return (
    <div className="rounded-lg bg-gray-800 p-4 space-y-4">
      <div className="text-center">
        <h2 className="text-lg font-bold text-white">Term Scorecard</h2>
        <p className="text-gray-400 text-xs">
          {formatGameDate(week)} | {totalEvents} decisions made
        </p>
      </div>

      <div className="flex justify-center gap-3">
        {(['publicTrust', 'infrastructureScore', 'securityIndex', 'youthTension'] as const).map(
          (key) => {
            const g = key === 'youthTension' ? grade(100 - stats[key], 100) : grade(stats[key], 100)
            const label =
              key === 'publicTrust'
                ? 'Trust'
                : key === 'infrastructureScore'
                  ? 'Infra'
                  : key === 'securityIndex'
                    ? 'Security'
                    : 'Youth'
            const val = key === 'youthTension' ? 100 - stats[key] : stats[key]
            const change = val - STARTING_STATE.stats[key]
            return (
              <div key={key} className="flex flex-col items-center">
                <span className={`text-2xl font-bold ${gradeColor(g)}`}>{g}</span>
                <span className="text-[9px] text-gray-500 uppercase">{label}</span>
                <span className={`text-[9px] ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {change >= 0 ? '+' : ''}
                  {change.toFixed(0)}
                </span>
              </div>
            )
          },
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-[10px]">
        <div className="space-y-1">
          <p className="text-gray-500 uppercase text-[9px] tracking-wide">Factions</p>
          {(Object.keys(factions) as FactionKey[]).map((key) => {
            const change = factions[key] - STARTING_STATE.factions[key]
            return (
              <div key={key} className="flex justify-between">
                <span className="text-gray-400 truncate mr-1">{FACTION_LABELS[key]}</span>
                <span className="text-gray-300 shrink-0">
                  {factions[key]}
                  <span className={change >= 0 ? 'text-green-400 ml-0.5' : 'text-red-400 ml-0.5'}>
                    ({change >= 0 ? '+' : ''}
                    {change})
                  </span>
                </span>
              </div>
            )
          })}
          <div className="flex justify-between border-t border-gray-700 pt-0.5 font-medium">
            <span className="text-gray-300">Average</span>
            <span className={`${gradeColor(factionGrade)}`}>
              {avgFaction.toFixed(0)} ({factionGrade})
            </span>
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-gray-500 uppercase text-[9px] tracking-wide">Constituencies</p>
          {(Object.keys(approval) as ConstituencyKey[]).map((key) => {
            const change = approval[key] - STARTING_STATE.constituencyApproval[key]
            return (
              <div key={key} className="flex justify-between">
                <span className="text-gray-400 truncate mr-1">{CONSTITUENCY_LABELS[key]}</span>
                <span className="text-gray-300 shrink-0">
                  {approval[key]}%
                  <span className={change >= 0 ? 'text-green-400 ml-0.5' : 'text-red-400 ml-0.5'}>
                    ({change >= 0 ? '+' : ''}
                    {change})
                  </span>
                </span>
              </div>
            )
          })}
          <div className="flex justify-between border-t border-gray-700 pt-0.5 font-medium">
            <span className="text-gray-300">Average</span>
            <span className={`${gradeColor(approvalGrade)}`}>
              {avgApproval.toFixed(0)}% ({approvalGrade})
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
        <div>
          <p className="text-gray-500">Cash</p>
          <p className={`font-bold ${cashGrade === 'A' ? 'text-green-400' : 'text-red-400'}`}>
            {cashGrade}
          </p>
          <p className="text-gray-400">₦{stats.cashReserve.toFixed(0)}bn</p>
        </div>
        <div>
          <p className="text-gray-500">Factions</p>
          <p className={`font-bold ${gradeColor(factionGrade)}`}>{factionGrade}</p>
          <p className="text-gray-400">{avgFaction.toFixed(0)} avg</p>
        </div>
        <div>
          <p className="text-gray-500">Approval</p>
          <p className={`font-bold ${gradeColor(approvalGrade)}`}>{approvalGrade}</p>
          <p className="text-gray-400">{avgApproval.toFixed(0)}% avg</p>
        </div>
      </div>
    </div>
  )
}
