import { CONSTITUENCIES } from '../../../data/constituencies'
import { useGameStore } from '../../../state/gameStore'
import { MapPanel } from '../../MapPanel'
import { PollPanel } from '../../PollPanel'
import { CommandPanel } from '../CommandPanel'
import { CommandSection } from '../CommandSection'

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string
  value: string | number
  detail: string
}) {
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

export function LagosPulsePanel() {
  const constituencyApproval = useGameStore((state) => state.constituencyApproval)
  const capitalProjects = useGameStore((state) => state.capitalProjects)

  const approvalEntries = Object.entries(constituencyApproval)
    .map(([key, value]) => ({
      key,
      value,
      label: CONSTITUENCIES.find((zone) => zone.key === key)?.label ?? key,
    }))
    .sort((a, b) => a.value - b.value)

  const lowest = approvalEntries[0]
  const hotspotCount = approvalEntries.filter((entry) => entry.value < 40).length
  const stalledProjects = capitalProjects.filter((project) => project.status === 'stalled').length
  const averageApproval =
    approvalEntries.reduce((sum, entry) => sum + entry.value, 0) /
    Math.max(1, approvalEntries.length)

  return (
    <CommandPanel
      question="Where is Lagos hurting?"
      summary="Map approval, service pain, and project stress across the state."
      statusItems={[
        {
          label: 'Hotspot LGAs',
          value: hotspotCount,
          tone: hotspotCount > 0 ? 'danger' : 'neutral',
        },
        {
          label: 'Stalled works',
          value: stalledProjects,
          tone: stalledProjects > 0 ? 'danger' : 'neutral',
        },
        {
          label: 'Average approval',
          value: `${averageApproval.toFixed(0)}%`,
          tone: averageApproval < 45 ? 'warning' : 'success',
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
        <MetricCard
          label="Lowest approval"
          value={lowest ? `${lowest.value.toFixed(0)}%` : '—'}
          detail={
            lowest
              ? `${lowest.label} is currently your weakest patch.`
              : 'Approval data is still loading.'
          }
        />
        <MetricCard
          label="Hotspots"
          value={hotspotCount}
          detail="LGAs under 40% approval need visible presence or practical relief fast."
        />
        <MetricCard
          label="Works under stress"
          value={stalledProjects}
          detail="Stalled projects are showing up directly on the map and in district dossiers."
        />
      </div>

      <CommandSection
        title="Spatial pulse"
        description="Approval, district dossier, and project markers on the Lagos map."
        collapsible
        defaultCollapsed
      >
        <MapPanel />
      </CommandSection>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '16px',
        }}
      >
        <CommandSection title="Polling by LGA" description="Public mandate across the 20 LGAs.">
          <PollPanel />
        </CommandSection>

        <CommandSection
          title="Districts to visit"
          description="Your weakest areas, ordered by approval."
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {approvalEntries.slice(0, 5).map((entry) => (
              <div
                key={entry.key}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '12px',
                  padding: '8px 10px',
                  border: '1px solid var(--border)',
                  background: 'var(--background)',
                }}
              >
                <span style={{ fontSize: '12px', color: 'var(--text)' }}>{entry.label}</span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)' }}>
                  {entry.value.toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </CommandSection>
      </div>
    </CommandPanel>
  )
}
