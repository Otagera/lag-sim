import { useGameStore } from '../../../state/gameStore'
import { Inbox } from '../../Inbox'
import { TimelinePanel } from '../../TimelinePanel'
import { CommandPanel } from '../CommandPanel'
import { CommandSection } from '../CommandSection'

function SummaryCard({
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

export function BriefingPanel() {
  const week = useGameStore((state) => state.week)
  const activeEvent = useGameStore((state) => state.activeEvent)
  const eventQueue = useGameStore((state) => state.eventQueue)
  const pendingDelayed = useGameStore((state) => state.pendingDelayed)
  const newspaperHeadline = useGameStore((state) => state.newspaperHeadline)
  const inbox = useGameStore((state) => state.inbox)
  const activeGodfatherMessage = useGameStore((state) => state.activeGodfatherMessage)

  const unreadCount = inbox.filter((message) => !message.read).length
  const pendingSoon = pendingDelayed.filter((event) => event.firesOnWeek <= week + 2)

  return (
    <CommandPanel
      question="What needs my attention?"
      summary="Your command inbox, live narrative, and immediate fallout in one place."
      statusItems={[
        { label: 'Unread', value: unreadCount, tone: unreadCount > 0 ? 'info' : 'neutral' },
        {
          label: 'Queued events',
          value: eventQueue.length + (activeEvent ? 1 : 0),
          tone: activeEvent ? 'warning' : 'neutral',
        },
        {
          label: 'Consequences due',
          value: pendingSoon.length,
          tone: pendingSoon.length > 0 ? 'danger' : 'neutral',
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
        <SummaryCard
          label="Immediate decisions"
          value={activeEvent ? eventQueue.length + 1 : eventQueue.length}
          detail={activeEvent?.title ?? 'No active event on the desk.'}
        />
        <SummaryCard
          label="Stakeholder heat"
          value={activeGodfatherMessage ? 'LIVE' : unreadCount}
          detail={
            activeGodfatherMessage?.text ??
            (unreadCount > 0
              ? 'Unread messages are waiting in the inbox.'
              : 'No direct asks waiting.')
          }
        />
        <SummaryCard
          label="Delayed fallout"
          value={pendingSoon.length}
          detail={
            pendingSoon[0]
              ? `${pendingSoon[0].sourceEventTitle} lands in week ${pendingSoon[0].firesOnWeek}.`
              : 'No near-term delayed consequence scheduled.'
          }
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '16px',
        }}
      >
        <CommandSection
          title="Action feed"
          description="Unread mail, political asks, and decision-linked messages."
        >
          <Inbox />
        </CommandSection>

        <CommandSection
          title="Media pulse"
          description="How the week is being framed outside Government House."
        >
          {newspaperHeadline ? (
            <div
              style={{
                border: '1px solid var(--border)',
                padding: '12px',
                background: 'var(--background)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div className="label-caps" style={{ color: 'var(--accent-text)' }}>
                {newspaperHeadline.category}
              </div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>
                {newspaperHeadline.headline}
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
                {newspaperHeadline.deck}
              </p>
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
              No fresh headline is dominating the cycle right now.
            </p>
          )}
        </CommandSection>
      </div>

      <CommandSection
        title="Recent consequences"
        description="A running log of the choices already shaping the state."
      >
        <TimelinePanel />
      </CommandSection>
    </CommandPanel>
  )
}
