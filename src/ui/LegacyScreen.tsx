import { useState } from 'react'
import { getGoal, getGoalIsMet } from '../data/goals'
import { buildLegacy } from '../data/legacy'
import { STARTING_STATE } from '../data/startingState'
import { pickKeyMomentsForLegacy, pickVerdictHeadline } from '../engine/endingNarrator'
import { useGameStore } from '../state/gameStore'
import { clearSave } from '../state/persistence'
import type { ConstituencyKey, FactionKey, GameState } from '../state/types'
import { formatGameDate } from '../utils/calendar'
import { Heading } from './components'

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
  etiOsa: 'Eti Osa',
  ibejuLekki: 'Ibeju-Lekki',
  surulere: 'Surulere',
  amuwoOdofin: 'Amuwo Odofin',
  apapa: 'Apapa',
  oshodiIsolo: 'Oshodi/Isolo',
  mushin: 'Mushin',
  shomolu: 'Shomolu',
  kosofe: 'Kosofe',
  lagosMainland: 'Lagos Mainland',
  ikeja: 'Ikeja',
  alimosho: 'Alimosho',
  agege: 'Agege',
  ifakoIjaye: 'Ifako/Ijaye',
  badagry: 'Badagry',
  epe: 'Epe',
  ikorodu: 'Ikorodu',
  ojo: 'Ojo',
  ajeromiIfelodun: 'Ajeromi/Ifelodun',
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
      return 'var(--success-11)'
    case 'B':
      return 'var(--info-11)'
    case 'C':
      return 'var(--warning-11)'
    case 'D':
      return 'var(--warning-9)'
    default:
      return 'var(--error-11)'
  }
}

type LegacyData = ReturnType<typeof buildLegacy>
type LegacyDecision = ReturnType<typeof pickKeyMomentsForLegacy>[number]

const EXIT_REASONS: Partial<Record<string, string>> = {
  bankruptcy: 'State Insolvency — Term Cut Short',
  federalTakeover: 'Federal Takeover — Term Ended',
  massUprising: 'Mass Uprising — Government Overwhelmed',
  impeachment: 'Removal by Assembly',
  primaryLoss: 'Primary Defeat — Re-Election Ended',
  termEndLoss: 'Term Ended — Not Re-Elected',
  secondTermEnd: 'Two Terms Complete — Legacy Sealed',
}

const GRADED_STATS = [
  'publicTrust',
  'infrastructureScore',
  'securityIndex',
  'youthTension',
] as const

function isTermEndState(state: GameState): boolean {
  return state.gameOverType === 'termEndLoss' || state.gameOverType === 'secondTermEnd'
}

function getExitLabel(state: GameState): string {
  return state.gameOverType ? (EXIT_REASONS[state.gameOverType] ?? 'Game Over') : 'Game Over'
}

function getLegacyTitle(state: GameState): string {
  if (state.currentTerm === 2 && isTermEndState(state)) return 'Two Terms: Legacy Sealed'
  if (state.reElected) return 'Re-Election Victory'
  if (state.gameOverType === 'termEndLoss') return 'Term Ended — Defeat'
  return ''
}

function getMonologueLabel(style: LegacyData['monologueStyle']): string {
  if (style === 'compliant') return 'The Pragmatist'
  if (style === 'reformer') return 'The Reformer'
  return 'The Survivor'
}

function getNarrativeBorderColor(gameOverType: GameState['gameOverType']): string {
  switch (gameOverType) {
    case 'bankruptcy':
    case 'massUprising':
      return 'var(--error-9)'
    case 'impeachment':
    case 'federalTakeover':
      return 'var(--warning-9)'
    case 'primaryLoss':
    case 'termEndLoss':
      return 'var(--warning-7)'
    case 'termEndWin':
    case 'secondTermEnd':
      return 'var(--success-9)'
    default:
      return 'var(--accent-solid)'
  }
}

export function LegacyScreen({ onNewGame }: { onNewGame: () => void }) {
  const state = useGameStore((s) => s)
  const legacy = buildLegacy(state)
  const verdictHeadline = state.gameOverType ? pickVerdictHeadline(state, state.gameOverType) : ''
  const decisions = pickKeyMomentsForLegacy(state)

  function handleNewGame() {
    clearSave()
    onNewGame()
  }

  return (
    <div
      className="min-h-screen py-8 px-4 overflow-y-auto"
      style={{ backgroundColor: 'var(--background)', color: 'var(--text)' }}
    >
      <div className="max-w-2xl mx-auto space-y-8">
        <LegacyHeader legacy={legacy} state={state} />
        <EndingNarrative state={state} />
        <VerdictHeadlineSection verdictHeadline={verdictHeadline} />
        <DecisionSummary decisions={decisions} />
        <LegacyTermSections legacy={legacy} state={state} />
        <div>
          <h2 className="label-caps mb-3">Final Scorecard</h2>
          <LegacyStatGrid stats={state.stats} />
          <div className="grid grid-cols-2 gap-3 text-[10px]">
            <FactionSummary factions={state.factions} />
            <ConstituencySummary constituencyApproval={state.constituencyApproval} />
          </div>
          <LegacyOperationalStats state={state} />
        </div>
        <EightYearAccountability state={state} />
        <LegacyFooter onNewGame={handleNewGame} />
      </div>
    </div>
  )
}

function LegacyHeader(props: { legacy: LegacyData; state: GameState }) {
  const { state } = props
  const endDate = formatGameDate(state.week)
  const totalEvents = state.resolvedEvents.length

  return (
    <div className="text-center">
      <div
        style={{
          height: '1px',
          background:
            'linear-gradient(to right, transparent, var(--accent-solid) 30%, transparent)',
          border: 'none',
          marginBottom: '16px',
        }}
      />
      <p className="label-caps mb-1">Lagos State Government — {getExitLabel(state)}</p>
      <h1 className="font-display text-2xl font-semibold" style={{ color: 'var(--text)' }}>
        {getLegacyTitle(state)}
      </h1>
      <p className="text-[11px] mt-1" style={{ color: 'var(--text-secondary)' }}>
        {endDate} &middot; {totalEvents} major decisions &middot; {state.week} weeks in office
      </p>
      {state.electionResult !== null && (
        <p
          className="mt-2 text-sm font-semibold"
          style={{ color: state.reElected ? 'var(--success-11)' : 'var(--error-11)' }}
        >
          Election result: {state.electionResult.toFixed(1)}% vote share
        </p>
      )}
    </div>
  )
}

function EndingNarrative({ state }: { state: GameState }) {
  if (!state.endingNarrative) return null

  return (
    <div
      className="p-5 border-l-4"
      style={{
        borderLeftColor: getNarrativeBorderColor(state.gameOverType),
        backgroundColor: 'var(--surface)',
        borderTopRightRadius: '4px',
        borderBottomRightRadius: '4px',
      }}
    >
      <p
        className="text-sm leading-relaxed italic"
        style={{ color: 'var(--text)', lineHeight: '1.7' }}
      >
        {state.endingNarrative.split('\n\n').map((paragraph) => (
          <span key={`para-${paragraph.slice(0, 32)}`}>
            {paragraph}
            <br />
            <br />
          </span>
        ))}
      </p>
    </div>
  )
}

function VerdictHeadlineSection({ verdictHeadline }: { verdictHeadline: string }) {
  if (!verdictHeadline) return null

  return (
    <div className="text-center">
      <p className="text-[10px] label-caps mb-1" style={{ color: 'var(--text-secondary)' }}>
        VERDICT
      </p>
      <Heading level={1} display style={{ color: 'var(--accent-text)' }}>
        {verdictHeadline}
      </Heading>
    </div>
  )
}

function DecisionSummary({ decisions }: { decisions: LegacyDecision[] }) {
  if (decisions.length === 0) return null

  return (
    <div className="space-y-3">
      <h2 className="label-caps">Key Moments</h2>
      <div className="space-y-2">
        {decisions.map((decision) => (
          <RankedDecisionItem
            key={`moment-${decision.week}-${decision.title.slice(0, 16)}`}
            decision={decision}
          />
        ))}
      </div>
    </div>
  )
}

function RankedDecisionItem({ decision }: { decision: LegacyDecision }) {
  return (
    <div style={{ borderLeft: '2px solid var(--border)', paddingLeft: '12px' }}>
      <p className="text-[9px] mb-0.5 label-caps" style={{ color: 'var(--border-strong)' }}>
        Week {decision.week} &middot; {decision.type.toUpperCase()}
      </p>
      <p className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
        {decision.title}
      </p>
      <p className="text-[10px] mt-0.5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        {decision.description}
      </p>
    </div>
  )
}

function LegacyTermSections({ legacy, state }: { legacy: LegacyData; state: GameState }) {
  if (!isTermEndState(state)) return null

  return (
    <>
      <LegacyHeadlines legacy={legacy} />
      <LegacyFinalAddress legacy={legacy} />
      <LegacyElectionJourney legacy={legacy} state={state} />
    </>
  )
}

function LegacyHeadlines({ legacy }: { legacy: LegacyData }) {
  return (
    <div className="space-y-4">
      <h2 className="label-caps">The Record — As History Will Judge It</h2>
      {legacy.headlines.map((headline, index) => (
        <div
          key={headline.key}
          style={{ borderLeft: '2px solid var(--border)', paddingLeft: '16px' }}
        >
          <p className="text-[9px] mb-0.5" style={{ color: 'var(--border-strong)' }}>
            VANGUARD / PUNCH / THE NATION #{index + 1}
          </p>
          <h3
            className="font-display text-sm font-semibold leading-snug"
            style={{ color: 'var(--text)' }}
          >
            {headline.headline}
          </h3>
          <p
            className="text-[11px] mt-1 leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
          >
            {headline.subhead}
          </p>
        </div>
      ))}
    </div>
  )
}

function LegacyFinalAddress({ legacy }: { legacy: LegacyData }) {
  return (
    <div
      className="p-4 border transition-all"
      style={{
        borderColor: 'var(--border)',
        backgroundColor: 'var(--surface)',
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <p className="label-caps">Governor's Final Press Address</p>
        <span
          className="text-[9px] px-1.5 py-0.5"
          style={{ backgroundColor: 'var(--neutral-4)', color: 'var(--text-secondary)' }}
        >
          {getMonologueLabel(legacy.monologueStyle)}
        </span>
      </div>
      <p className="text-sm leading-relaxed italic" style={{ color: 'var(--text)' }}>
        "{legacy.monologue}"
      </p>
    </div>
  )
}

function LegacyElectionJourney({ legacy, state }: { legacy: LegacyData; state: GameState }) {
  if (state.electionResult === null && !state.stateFlags['primary-lost']) return null

  return (
    <div className="space-y-3">
      <h2 className="label-caps">The Road to the Election</h2>
      <div style={{ borderLeft: '2px solid var(--accent-solid)', paddingLeft: '16px' }}>
        <p className="text-[9px] mb-0.5 label-caps" style={{ color: 'var(--border-strong)' }}>
          {legacy.primaryNarrative.path === 'lost'
            ? 'PRIMARY — DEFEATED'
            : `PRIMARY PATH — SCENARIO ${legacy.primaryNarrative.path.toUpperCase()}`}
        </p>
        <h3 className="font-display text-sm font-semibold" style={{ color: 'var(--text)' }}>
          {legacy.primaryNarrative.title}
        </h3>
        <p className="text-[11px] mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {legacy.primaryNarrative.summary}
        </p>
      </div>
      <div
        className="text-[10px] p-3"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border)',
          border: '1px solid',
        }}
      >
        <p className="label-caps mb-1">Endorsement Picture</p>
        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          {legacy.endorsementSummary}
        </p>
      </div>
    </div>
  )
}

function LegacyStatGrid({ stats }: { stats: GameState['stats'] }) {
  return (
    <div className="flex justify-center gap-4 mb-4">
      {GRADED_STATS.map((key) => {
        const value = key === 'youthTension' ? 100 - stats[key] : stats[key]
        const label =
          key === 'publicTrust'
            ? 'Trust'
            : key === 'infrastructureScore'
              ? 'Infra'
              : key === 'securityIndex'
                ? 'Security'
                : 'Youth'
        const change =
          value -
          (key === 'youthTension' ? 100 - STARTING_STATE.stats[key] : STARTING_STATE.stats[key])
        const letterGrade = grade(value, 100)

        return (
          <div key={key} className="flex flex-col items-center">
            <span className="text-2xl font-bold" style={{ color: gradeColor(letterGrade) }}>
              {letterGrade}
            </span>
            <span className="label-caps">{label}</span>
            <span
              className="text-[9px]"
              style={{ color: change >= 0 ? 'var(--success-11)' : 'var(--error-11)' }}
            >
              {change >= 0 ? '+' : ''}
              {change.toFixed(0)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function FactionSummary({ factions }: { factions: GameState['factions'] }) {
  return (
    <div className="space-y-1">
      <p className="label-caps">Factions</p>
      {(Object.keys(factions) as FactionKey[]).map((key) => {
        const change = factions[key] - STARTING_STATE.factions[key]

        return (
          <div key={key} className="flex justify-between">
            <span className="truncate mr-1" style={{ color: 'var(--text-secondary)' }}>
              {FACTION_LABELS[key]}
            </span>
            <span className="shrink-0" style={{ color: 'var(--text)' }}>
              {factions[key]}
              <span
                className="ml-0.5"
                style={{ color: change >= 0 ? 'var(--success-11)' : 'var(--error-11)' }}
              >
                ({change >= 0 ? '+' : ''}
                {change})
              </span>
            </span>
          </div>
        )
      })}
    </div>
  )
}

function ConstituencySummary({
  constituencyApproval,
}: {
  constituencyApproval: GameState['constituencyApproval']
}) {
  return (
    <div className="space-y-1">
      <p className="label-caps">Constituencies</p>
      {(Object.keys(constituencyApproval) as ConstituencyKey[]).map((key) => {
        const change = constituencyApproval[key] - STARTING_STATE.constituencyApproval[key]

        return (
          <div key={key} className="flex justify-between">
            <span className="truncate mr-1" style={{ color: 'var(--text-secondary)' }}>
              {CONSTITUENCY_LABELS[key]}
            </span>
            <span className="shrink-0" style={{ color: 'var(--text)' }}>
              {constituencyApproval[key]}%
              <span
                className="ml-0.5"
                style={{ color: change >= 0 ? 'var(--success-11)' : 'var(--error-11)' }}
              >
                ({change >= 0 ? '+' : ''}
                {change})
              </span>
            </span>
          </div>
        )
      })}
    </div>
  )
}

function LegacyOperationalStats({ state }: { state: GameState }) {
  return (
    <div className="mt-3 grid grid-cols-4 gap-2 text-center text-[10px]">
      <div>
        <p className="label-caps">Cash</p>
        <p
          className="font-bold"
          style={{ color: state.stats.cashReserve >= 0 ? 'var(--success-11)' : 'var(--error-11)' }}
        >
          {state.stats.cashReserve >= 0 ? 'A' : 'F'}
        </p>
        <p style={{ color: 'var(--text-secondary)' }}>₦{state.stats.cashReserve.toFixed(0)}bn</p>
      </div>
      <div>
        <p className="label-caps">Fashemu</p>
        <p className="font-semibold capitalize" style={{ color: 'var(--text)' }}>
          {state.fashemuPhase}
        </p>
        <p style={{ color: 'var(--text-secondary)' }}>Path {state.fashemuEndingPath ?? '—'}</p>
      </div>
      <div>
        <p className="label-caps">Compliance</p>
        <p className="font-semibold" style={{ color: 'var(--text)' }}>
          {state.godfatherComplianceCount}/
          {state.godfatherComplianceCount + state.godfatherRefusalCount}
        </p>
        <p style={{ color: 'var(--text-secondary)' }}>accepted</p>
      </div>
      <div>
        <p className="label-caps">Personal Goal</p>
        <GoalLegacyOutcome state={state} />
      </div>
    </div>
  )
}

function EightYearAccountability({ state }: { state: GameState }) {
  if (state.currentTerm !== 2) return null

  return (
    <div>
      <h2 className="label-caps mb-3">Eight-Year Accountability Index</h2>
      <div className="grid grid-cols-2 gap-3 text-[10px]">
        <div
          className="p-3"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <p className="label-caps mb-1">Corruption at Exit</p>
          <p
            className="text-xl font-bold"
            style={{
              color:
                state.stats.corruptionPressure >= 70
                  ? 'var(--error-11)'
                  : state.stats.corruptionPressure >= 50
                    ? 'var(--warning-11)'
                    : 'var(--success-11)',
            }}
          >
            {state.stats.corruptionPressure.toFixed(0)}%
          </p>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            {state.stats.corruptionPressure >= 70
              ? 'Accountability crisis — EFCC inquiry pending'
              : state.stats.corruptionPressure >= 50
                ? 'Under scrutiny — irregularities noted'
                : 'Clean exit — no material findings'}
          </p>
        </div>
        <div
          className="p-3"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <p className="label-caps mb-1">Cash at Handover</p>
          <p className="text-xl font-bold" style={{ color: 'var(--text)' }}>
            ₦{state.stats.cashReserve.toFixed(0)}bn
          </p>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            {state.stats.cashReserve >= 150
              ? `Fiscal surplus — ₦${(state.stats.cashReserve - 50).toFixed(0)}bn above operational floor`
              : state.stats.cashReserve >= 0
                ? 'Stable — books balanced at handover'
                : 'Deficit — successor faces liquidity gap'}
          </p>
        </div>
      </div>
    </div>
  )
}

function LegacyFooter({ onNewGame }: { onNewGame: () => void }) {
  const [btnHover, setBtnHover] = useState(false)
  const beginSecondTerm = useGameStore((s) => s.beginSecondTerm)
  const gameOverType = useGameStore((s) => s.gameOverType)

  return (
    <div className="text-center space-x-3">
      {gameOverType === 'termEndWin' && (
        <button
          type="button"
          onClick={beginSecondTerm}
          className="px-8 py-3 text-sm font-semibold transition-colors"
          style={{
            backgroundColor: 'var(--success-9)',
            color: '#fff',
          }}
        >
          Begin Second Term
        </button>
      )}
      <button
        type="button"
        onClick={onNewGame}
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
  )
}

function GoalLegacyOutcome({ state }: { state: GameState }) {
  if (!state.selectedGoalId)
    return (
      <>
        <p className="font-semibold" style={{ color: 'var(--text-secondary)' }}>
          —
        </p>
        <p style={{ color: 'var(--text-secondary)' }}>not chosen</p>
      </>
    )

  const goal = getGoal(state.selectedGoalId)
  if (!goal)
    return (
      <>
        <p className="font-semibold" style={{ color: 'var(--text-secondary)' }}>
          —
        </p>
        <p style={{ color: 'var(--text-secondary)' }}>unknown</p>
      </>
    )

  const met = getGoalIsMet(goal, state)
  return (
    <>
      <p className="font-bold" style={{ color: met ? 'var(--success-11)' : 'var(--error-11)' }}>
        {met ? 'ACHIEVED' : 'NOT MET'}
      </p>
      <p style={{ color: 'var(--text-secondary)' }}>{goal.title}</p>
      {met && (
        <p className="text-[9px] italic mt-0.5" style={{ color: 'var(--success-9)' }}>
          {goal.flavorClosing}
        </p>
      )}
    </>
  )
}
