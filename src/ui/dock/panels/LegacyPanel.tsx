import { lazy, Suspense } from 'react'
import { calculateVoteShare } from '../../../engine/electionEngine'
import { useGameStore } from '../../../state/gameStore'
import { CommandPanel } from '../CommandPanel'
import { CommandSection } from '../CommandSection'

const LazyCampaignTracker = lazy(() =>
  import('../../CampaignTracker').then((module) => ({ default: module.CampaignTracker })),
)
const LazyStrategicDashboard = lazy(() =>
  import('../../StrategicDashboard').then((module) => ({ default: module.StrategicDashboard })),
)

function LegacyCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div
      style={{
        border: '1px solid var(--border)',
        padding: '12px',
        background: 'var(--background)',
      }}
    >
      <div className="label-caps" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </div>
      <div style={{ marginTop: '6px', fontSize: '24px', fontWeight: 700, color: 'var(--text)' }}>
        {value}
      </div>
      <p style={{ margin: '6px 0 0', fontSize: '11px', color: 'var(--text-secondary)' }}>
        {detail}
      </p>
    </div>
  )
}

function buildRiskCount(state: ReturnType<typeof useGameStore.getState>) {
  return [
    state.stats.cashReserve < 0,
    state.stats.federalRelationship < -35 && state.stats.infrastructureScore < 30,
    state.stats.publicTrust < 20 && state.stats.youthTension > 75,
    !state.selectedGoalId,
  ].filter(Boolean).length
}

function SnapshotMetric({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: 'neutral' | 'warning' | 'danger' | 'success'
}) {
  const color = {
    neutral: 'var(--text)',
    warning: 'var(--warning-11)',
    danger: 'var(--error-11)',
    success: 'var(--success-11)',
  }[tone ?? 'neutral']

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        padding: '10px',
        background: 'var(--background)',
      }}
    >
      <div className="label-caps" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </div>
      <div style={{ marginTop: '6px', fontSize: '20px', fontWeight: 700, color }}>{value}</div>
    </div>
  )
}

export function LegacyPanel() {
  const state = useGameStore((store) => store)
  const voteShare = calculateVoteShare(state)
  const termEndWeek = state.currentTerm === 2 ? 416 : 208
  const weeksRemaining = Math.max(0, termEndWeek - state.week)
  const riskCount = buildRiskCount(state)

  return (
    <CommandPanel
      question="Are we on track to win / leave a legacy?"
      summary="Zoom out from the week-to-week noise and read the term trajectory."
      statusItems={[
        {
          label: 'Weeks left',
          value: weeksRemaining,
          tone: weeksRemaining <= 24 ? 'warning' : 'neutral',
        },
        {
          label: 'Vote projection',
          value: `${voteShare.toFixed(0)}%`,
          tone: voteShare >= 50 ? 'success' : 'danger',
        },
        {
          label: state.inCampaignMode ? 'Campaign' : 'Structural risks',
          value: state.inCampaignMode ? 'LIVE' : riskCount,
          tone: state.inCampaignMode ? 'accent' : riskCount > 0 ? 'warning' : 'neutral',
        },
      ]}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px',
        }}
      >
        <LegacyCard
          label="Election path"
          value={`${voteShare.toFixed(0)}%`}
          detail={
            state.inCampaignMode
              ? 'Campaign mode is active; every visible decision now echoes into the ballot.'
              : 'This is the current vote share projection if an election were held today.'
          }
        />
        <LegacyCard
          label="Term clock"
          value={`${weeksRemaining} weeks`}
          detail="Time left before the mandate is judged at the end of the term."
        />
        <LegacyCard
          label="Goal status"
          value={state.selectedGoalId ? 'Set' : 'Unset'}
          detail={
            state.selectedGoalId
              ? 'A term goal is selected and can be tracked below.'
              : 'No term goal is currently selected.'
          }
        />
      </div>

      <CommandSection
        title="Strategic dashboard"
        description="Finance runway, initiatives in flight, and quarter outlook."
        collapsible
      >
        <Suspense fallback={null}>
          <LazyStrategicDashboard showGoalTracker={false} />
        </Suspense>
      </CommandSection>

      {state.inCampaignMode ? (
        <CommandSection
          title="Campaign command"
          description="Election cadence, decisions, and vote projection during campaign mode."
          collapsible
        >
          <Suspense fallback={null}>
            <LazyCampaignTracker />
          </Suspense>
        </CommandSection>
      ) : null}

      <CommandSection
        title="State snapshot"
        description="A compact read of the wider environment without repeating the full goal journey."
        collapsible
        defaultCollapsed
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '10px',
          }}
        >
          <SnapshotMetric
            label="Public trust"
            value={`${state.stats.publicTrust.toFixed(0)}%`}
            tone={state.stats.publicTrust < 40 ? 'warning' : 'success'}
          />
          <SnapshotMetric
            label="Infrastructure"
            value={state.stats.infrastructureScore.toFixed(0)}
            tone={state.stats.infrastructureScore < 35 ? 'warning' : 'success'}
          />
          <SnapshotMetric
            label="Federal relationship"
            value={state.stats.federalRelationship.toFixed(0)}
            tone={state.stats.federalRelationship < -20 ? 'danger' : 'neutral'}
          />
          <SnapshotMetric
            label="Corruption pressure"
            value={state.stats.corruptionPressure.toFixed(0)}
            tone={state.stats.corruptionPressure > 55 ? 'warning' : 'neutral'}
          />
        </div>
      </CommandSection>
    </CommandPanel>
  )
}
