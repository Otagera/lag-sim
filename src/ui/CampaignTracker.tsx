import { useGameStore } from '../state/gameStore'
import { calculateVoteShare } from '../engine/electionEngine'
import { STAT_ICONS } from '../data/icons'
import { ArrowRight, Vote, Flag, AlertTriangle, ThumbsUp, Users } from 'lucide-react'

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

function ElectionBadge({ variant, children }: { variant: 'good' | 'bad' | 'neutral'; children: React.ReactNode }) {
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
      <div style={{ flex: 1, height: '6px', background: 'var(--border-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${value}%`,
          background: confidenceLevel.color,
          borderRadius: '3px',
          transition: 'width 700ms ease, background 300ms ease',
        }} />
      </div>
      <span style={{ fontSize: '10px', fontWeight: 600, color: confidenceLevel.color, fontVariantNumeric: 'tabular-nums', minWidth: '40px', textAlign: 'right' }}>
        {value.toFixed(0)}% &middot; {confidenceLevel.label}
      </span>
    </div>
  )
}

const ELECTION_WEEK = 208

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

  const decisions: DecisionRow[] = campaignDecisions.map((id) => {
    if (CAMPAIGN_DECISION_LABELS[id]) return { id, label: CAMPAIGN_DECISION_LABELS[id], source: 'campaign' as const }
    if (OPPONENT_ATTACK_LABELS[id]) return { id, label: OPPONENT_ATTACK_LABELS[id], source: 'opponent' as const }
    return { id, label: id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()), source: 'event' as const }
  })

  const campaignDecisionsList = decisions.filter((d) => d.source === 'campaign')
  const opponentDecisionsList = decisions.filter((d) => d.source === 'opponent')

  const endorsementCount = [factions.businessCommunity >= 60, factions.civilSocietyMedia >= 60, factions.lgChairmen >= 65, factions.informalEconomy >= 60].filter(Boolean).length

  const isPostElection = weeksUntilElection === 0 && inCampaignMode

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Vote size={16} style={{ color: 'var(--accent-solid)' }} />
          <span className="font-display" style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>
            Campaign Dashboard
          </span>
        </div>
        <ElectionBadge variant={inCampaignMode ? 'good' : 'neutral'}>
          {inCampaignMode ? 'ACTIVE' : 'INACTIVE'}
        </ElectionBadge>
      </div>

      {/* Countdown bar */}
      <div style={{
        padding: '10px 12px',
        background: 'var(--surface)',
        borderRadius: '2px',
        border: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}>
        <Flag size={14} style={{ color: 'var(--accent-solid)', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Election Day
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text)', fontWeight: 600 }}>
            {isPostElection ? 'Results Pending' : weeksUntilElection === 0 ? 'Today!' : `Week ${ELECTION_WEEK} · ${weeksUntilElection} week${weeksUntilElection !== 1 ? 's' : ''} remaining`}
          </div>
        </div>
        <div style={{
          width: '80px',
          height: '6px',
          background: 'var(--border-subtle)',
          borderRadius: '3px',
          overflow: 'hidden',
          flexShrink: 0,
        }}>
          <div style={{
            height: '100%',
            width: `${Math.min(100, (week / ELECTION_WEEK) * 100)}%`,
            background: 'var(--accent-solid)',
            borderRadius: '3px',
            transition: 'width 600ms ease',
          }} />
        </div>
      </div>

      {/* Vote Share Projection */}
      <div style={{
        padding: '12px',
        background: 'var(--surface)',
        borderRadius: '2px',
        border: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
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
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '6px',
          fontSize: '9px',
          color: 'var(--text-secondary)',
        }}>
          <span>Majority: 50%</span>
          {voteShare >= 50
            ? <span style={{ color: 'var(--success-11)' }}>Projected to win</span>
            : <span style={{ color: 'var(--error-11)' }}>Projected to lose</span>
          }
        </div>
      </div>

      {/* Key election stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '6px',
      }}>
        {[
          { label: 'Public Trust', value: s.publicTrust, icon: STAT_ICONS.publicTrust.icon },
          { label: 'Youth Tension', value: s.youthTension, icon: STAT_ICONS.youthTension.icon },
          { label: 'Corruption', value: s.corruptionPressure, icon: STAT_ICONS.corruptionPressure.icon },
          { label: 'Infrastructure', value: s.infrastructureScore, icon: STAT_ICONS.infrastructureScore.icon },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} style={{
            padding: '8px 10px',
            background: 'var(--surface)',
            borderRadius: '2px',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            {Icon && <Icon size={12} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>{label}</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
                {value.toFixed(1)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Faction endorsements */}
      {lgaElectionResult !== null && (
        <div style={{
          padding: '10px 12px',
          background: 'var(--surface)',
          borderRadius: '2px',
          border: '1px solid var(--border)',
        }}>
          <div className="label-caps" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
            <Users size={10} />
            Faction Endorsements
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text)' }}>
            {endorsementCount}/4 factions aligned
          </div>
          <div style={{
            display: 'flex',
            gap: '6px',
            marginTop: '4px',
            flexWrap: 'wrap',
          }}>
            {[
              { key: 'businessCommunity', label: 'Business' },
              { key: 'civilSocietyMedia', label: 'Civil Soc.' },
              { key: 'lgChairmen', label: 'LG' },
              { key: 'informalEconomy', label: 'Informal' },
            ].map(({ key, label }) => {
              const val = factions[key as keyof typeof factions] as number
              const aligned = key === 'lgChairmen' ? val >= 65 : val >= 60
              return (
                <span key={key} style={{
                  fontSize: '9px',
                  padding: '2px 5px',
                  borderRadius: '2px',
                  background: aligned ? 'var(--success-3)' : 'var(--error-3)',
                  color: aligned ? 'var(--success-11)' : 'var(--error-11)',
                  fontWeight: 600,
                }}>
                  {label}: {val.toFixed(0)} {aligned ? '✓' : '✗'}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* Campaign decisions */}
      {campaignDecisionsList.length > 0 && (
        <div>
          <div className="label-caps" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
            <ArrowRight size={10} />
            Campaign Decisions
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {campaignDecisionsList.map((d) => (
              <div key={d.id} style={{
                padding: '6px 10px',
                background: 'var(--surface)',
                borderRadius: '2px',
                border: '1px solid var(--border)',
                fontSize: '11px',
                color: 'var(--text)',
              }}>
                {d.label}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Opponent attacks */}
      {opponentDecisionsList.length > 0 && (
        <div>
          <div className="label-caps" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
            <AlertTriangle size={10} />
            Opponent Responses
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {opponentDecisionsList.map((d) => (
              <div key={d.id} style={{
                padding: '6px 10px',
                background: 'var(--surface)',
                borderRadius: '2px',
                border: '1px solid var(--border)',
                fontSize: '11px',
                color: 'var(--text)',
              }}>
                {d.label}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {campaignDecisionsList.length === 0 && (
        <div style={{
          padding: '16px',
          textAlign: 'center',
          fontSize: '11px',
          color: 'var(--text-secondary)',
          background: 'var(--surface)',
          borderRadius: '2px',
          border: '1px dashed var(--border)',
        }}>
          No campaign decisions made yet.
        </div>
      )}
    </div>
  )
}
