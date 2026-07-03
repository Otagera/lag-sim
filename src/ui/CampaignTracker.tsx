import { AlertTriangle, ArrowRight, Flag, ThumbsUp, Users, Vote } from 'lucide-react'
import { STAT_ICONS } from '../data/icons'
import { calculateVoteShare } from '../engine/electionEngine'
import { useGameStore } from '../state/gameStore'
import type { GameState } from '../state/types'

const CAMPAIGN_DECISION_LABELS: Record<string, string> = {
  'rally-alimosho': 'Rally in Alimosho & Periphery',
  'rally-lagos-island': 'Rally in Lagos Island & Business District',
  'rally-surulere': 'Rally in Surulere (Swing Territory)',
  'promise-education': 'Pledge: Free Secondary Education',
  'promise-infrastructure': 'Pledge: Lagos Metro Rail Phase 2',
  'promise-youth-jobs': 'Pledge: 100,000 Youth Employment Fund',
  'go-positive': 'Media: Run on Your Record',
  'attack-opponent': 'Media: Attack Opponent',
  'defend-reform': 'Media: Lead With Accountability',
}

const OPPONENT_ATTACK_LABELS: Record<string, string> = {
  'release-full-audit': 'Corruption Attack: Released Independent Audit',
  'attack-adebayo-record': 'Corruption Attack: Countered with Senate Record',
  'stay-silent-corruption': 'Corruption Attack: Stayed Silent',
  'counter-rally-mainland': 'Mainland Rally Attack: Counter-Rallied',
  'release-alimosho-spending-data': 'Mainland Rally Attack: Published Spending Data',
  'ignore-mainland-rallies': 'Mainland Rally Attack: Ignored',
  'match-youth-promise': 'Youth Pledge Attack: Matched with Grant Programme',
  'pivot-to-employment-record': 'Youth Pledge Attack: Pivoted to Employment Data',
  'ignore-youth-pledge': 'Youth Pledge Attack: Dismissed as Fantasy',
}

interface DecisionRow {
  id: string
  label: string
  source: 'campaign' | 'opponent' | 'event'
}

function ElectionBadge({
  variant,
  children,
}: {
  variant: 'good' | 'bad' | 'neutral'
  children: React.ReactNode
}) {
  const colors = {
    good: 'var(--success-9)',
    bad: 'var(--error-9)',
    neutral: 'var(--neutral-6)',
  }
  return (
    <span
      className="label-caps"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '3px',
        padding: '2px 6px',
        borderRadius: '2px',
        fontSize: '9px',
        background: colors[variant],
        color: '#fff',
      }}
    >
      {children}
    </span>
  )
}

function ConfidenceMeter({ value }: { value: number }) {
  const confidenceLevel = (() => {
    if (value >= 55) return { label: 'Strong', color: 'var(--success-9)' }
    if (value >= 45) return { label: 'Lean', color: 'var(--warning-9)' }
    return { label: 'Weak', color: 'var(--error-9)' }
  })()

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <div
        style={{
          flex: 1,
          height: '6px',
          background: 'var(--border-subtle)',
          borderRadius: '3px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${value}%`,
            background: confidenceLevel.color,
            borderRadius: '3px',
            transition: 'width 700ms ease, background 300ms ease',
          }}
        />
      </div>
      <span
        style={{
          fontSize: '10px',
          fontWeight: 600,
          color: confidenceLevel.color,
          fontVariantNumeric: 'tabular-nums',
          minWidth: '40px',
          textAlign: 'right',
        }}
      >
        {value.toFixed(0)}% &middot; {confidenceLevel.label}
      </span>
    </div>
  )
}

const ELECTION_WEEK = 200

const buildDecisionRows = (campaignDecisions: string[]): DecisionRow[] =>
  campaignDecisions.map((id) => {
    if (CAMPAIGN_DECISION_LABELS[id]) {
      return { id, label: CAMPAIGN_DECISION_LABELS[id], source: 'campaign' }
    }
    if (OPPONENT_ATTACK_LABELS[id]) {
      return { id, label: OPPONENT_ATTACK_LABELS[id], source: 'opponent' }
    }
    return {
      id,
      label: id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      source: 'event',
    }
  })

const getEndorsementCount = (factions: GameState['factions']) =>
  [
    factions.businessCommunity >= 60,
    factions.civilSocietyMedia >= 60,
    factions.lgChairmen >= 65,
    factions.informalEconomy >= 60,
  ].filter(Boolean).length

function CampaignHeader({ inCampaignMode }: { inCampaignMode: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Vote size={16} style={{ color: 'var(--accent-solid)' }} />
        <span
          className="font-display"
          style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}
        >
          Campaign Dashboard
        </span>
      </div>
      <ElectionBadge variant={inCampaignMode ? 'good' : 'neutral'}>
        {inCampaignMode ? 'ACTIVE' : 'INACTIVE'}
      </ElectionBadge>
    </div>
  )
}

function CountdownCard({
  week,
  weeksUntilElection,
  isPostElection,
}: {
  week: number
  weeksUntilElection: number
  isPostElection: boolean
}) {
  const countdownLabel = isPostElection
    ? 'Results Pending'
    : weeksUntilElection === 0
      ? 'Today!'
      : `Week ${ELECTION_WEEK} · ${weeksUntilElection} week${weeksUntilElection !== 1 ? 's' : ''} remaining`

  return (
    <div
      style={{
        padding: '10px 12px',
        background: 'var(--surface)',
        borderRadius: '2px',
        border: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}
    >
      <Flag size={14} style={{ color: 'var(--accent-solid)', flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
          Election Day
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text)', fontWeight: 600 }}>
          {countdownLabel}
        </div>
      </div>
      <ProgressPill value={Math.min(100, (week / ELECTION_WEEK) * 100)} />
    </div>
  )
}

function ProgressPill({ value }: { value: number }) {
  return (
    <div
      style={{
        width: '80px',
        height: '6px',
        background: 'var(--border-subtle)',
        borderRadius: '3px',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${value}%`,
          background: 'var(--accent-solid)',
          borderRadius: '3px',
          transition: 'width 600ms ease',
        }}
      />
    </div>
  )
}

function VoteProjectionCard({
  voteShare,
  lgaElectionResult,
}: {
  voteShare: number
  lgaElectionResult: number | null
}) {
  return (
    <div
      style={{
        padding: '12px',
        background: 'var(--surface)',
        borderRadius: '2px',
        border: '1px solid var(--border)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px',
        }}
      >
        <div className="label-caps" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <ThumbsUp size={10} />
          Projected Vote Share
        </div>
        {lgaElectionResult !== null && (
          <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
            LGA result: {lgaElectionResult.toFixed(0)}%
          </span>
        )}
      </div>
      <ConfidenceMeter value={voteShare} />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '6px',
          fontSize: '9px',
          color: 'var(--text-secondary)',
        }}
      >
        <span>Majority: 50%</span>
        {voteShare >= 50 ? (
          <span style={{ color: 'var(--success-11)' }}>Projected to win</span>
        ) : (
          <span style={{ color: 'var(--error-11)' }}>Projected to lose</span>
        )}
      </div>
    </div>
  )
}

function ElectionStatsGrid({ stats }: { stats: GameState['stats'] }) {
  const rows = [
    { label: 'Public Trust', value: stats.publicTrust, icon: STAT_ICONS.publicTrust.icon },
    { label: 'Youth Tension', value: stats.youthTension, icon: STAT_ICONS.youthTension.icon },
    {
      label: 'Corruption',
      value: stats.corruptionPressure,
      icon: STAT_ICONS.corruptionPressure.icon,
    },
    {
      label: 'Infrastructure',
      value: stats.infrastructureScore,
      icon: STAT_ICONS.infrastructureScore.icon,
    },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
      {rows.map(({ label, value, icon: Icon }) => (
        <div
          key={label}
          style={{
            padding: '8px 10px',
            background: 'var(--surface)',
            borderRadius: '2px',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          {Icon && <Icon size={12} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>{label}</div>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {value.toFixed(1)}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function FactionEndorsements({
  factions,
  endorsementCount,
}: {
  factions: GameState['factions']
  endorsementCount: number
}) {
  const rows = [
    { key: 'businessCommunity', label: 'Business', threshold: 60 },
    { key: 'civilSocietyMedia', label: 'Civil Soc.', threshold: 60 },
    { key: 'lgChairmen', label: 'LG', threshold: 65 },
    { key: 'informalEconomy', label: 'Informal', threshold: 60 },
  ] as const

  return (
    <div
      style={{
        padding: '10px 12px',
        background: 'var(--surface)',
        borderRadius: '2px',
        border: '1px solid var(--border)',
      }}
    >
      <div
        className="label-caps"
        style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}
      >
        <Users size={10} />
        Faction Endorsements
      </div>
      <div style={{ fontSize: '12px', color: 'var(--text)' }}>
        {endorsementCount}/4 factions aligned
      </div>
      <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
        {rows.map(({ key, label, threshold }) => {
          const val = factions[key]
          const aligned = val >= threshold
          return <EndorsementChip key={key} label={label} value={val} aligned={aligned} />
        })}
      </div>
    </div>
  )
}

function EndorsementChip({
  label,
  value,
  aligned,
}: {
  label: string
  value: number
  aligned: boolean
}) {
  return (
    <span
      style={{
        fontSize: '9px',
        padding: '2px 5px',
        borderRadius: '2px',
        background: aligned ? 'var(--success-3)' : 'var(--error-3)',
        color: aligned ? 'var(--success-11)' : 'var(--error-11)',
        fontWeight: 600,
      }}
    >
      {label}: {value.toFixed(0)} {aligned ? '✓' : '✗'}
    </span>
  )
}

function DecisionList({
  title,
  icon,
  decisions,
}: {
  title: string
  icon: 'campaign' | 'opponent'
  decisions: DecisionRow[]
}) {
  const Icon = icon === 'campaign' ? ArrowRight : AlertTriangle
  if (decisions.length === 0) return null
  return (
    <div>
      <div
        className="label-caps"
        style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}
      >
        <Icon size={10} />
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
        {decisions.map((d) => (
          <DecisionItem key={d.id} decision={d} />
        ))}
      </div>
    </div>
  )
}

function DecisionItem({ decision }: { decision: DecisionRow }) {
  return (
    <div
      style={{
        padding: '6px 10px',
        background: 'var(--surface)',
        borderRadius: '2px',
        border: '1px solid var(--border)',
        fontSize: '11px',
        color: 'var(--text)',
      }}
    >
      {decision.label}
    </div>
  )
}

function EmptyCampaignState() {
  return (
    <div
      style={{
        padding: '16px',
        textAlign: 'center',
        fontSize: '11px',
        color: 'var(--text-secondary)',
        background: 'var(--surface)',
        borderRadius: '2px',
        border: '1px dashed var(--border)',
      }}
    >
      No campaign decisions made yet.
    </div>
  )
}

export function CampaignTracker() {
  const week = useGameStore((s) => s.week)
  const campaignDecisions = useGameStore((s) => s.campaignDecisions)
  const lgaElectionResult = useGameStore((s) => s.lgaElectionResult)
  const inCampaignMode = useGameStore((s) => s.inCampaignMode)
  const factions = useGameStore((s) => s.factions)
  const s = useGameStore((s) => s.stats)

  const state = useGameStore.getState()
  const voteShare = calculateVoteShare(state)

  const weeksUntilElection = Math.max(0, ELECTION_WEEK - week)

  const decisions = buildDecisionRows(campaignDecisions)

  const campaignDecisionsList = decisions.filter((d) => d.source === 'campaign')
  const opponentDecisionsList = decisions.filter((d) => d.source === 'opponent')

  const endorsementCount = getEndorsementCount(factions)
  const isPostElection = weeksUntilElection === 0 && inCampaignMode

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <CampaignHeader inCampaignMode={inCampaignMode} />
      <CountdownCard
        week={week}
        weeksUntilElection={weeksUntilElection}
        isPostElection={isPostElection}
      />
      <VoteProjectionCard voteShare={voteShare} lgaElectionResult={lgaElectionResult} />
      <ElectionStatsGrid stats={s} />
      {lgaElectionResult !== null && (
        <FactionEndorsements factions={factions} endorsementCount={endorsementCount} />
      )}
      <DecisionList title="Campaign Decisions" icon="campaign" decisions={campaignDecisionsList} />
      <DecisionList title="Opponent Responses" icon="opponent" decisions={opponentDecisionsList} />
      {campaignDecisionsList.length === 0 && <EmptyCampaignState />}
    </div>
  )
}
