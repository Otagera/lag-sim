import { useGameStore } from '../state/gameStore'

const SEVERITY_TEXT: Record<string, { label: string; color: string }> = {
  low: { label: 'Low', color: 'var(--success-11)' },
  medium: { label: 'Medium', color: 'var(--warning-11)' },
  high: { label: 'High', color: 'var(--error-11)' },
  critical: { label: 'Critical', color: 'var(--error-9)' },
}

export function EventCard() {
  const activeEvent = useGameStore((s) => s.activeEvent)
  const resolveEvent = useGameStore((s) => s.resolveEvent)

  if (!activeEvent) {
    return (
      <div
        className="p-4 text-center border"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text-secondary)' }}
      >
        No active event. Click "Next Week" to advance.
      </div>
    )
  }

  const sev = SEVERITY_TEXT[activeEvent.severity] ?? { label: activeEvent.severity, color: 'var(--text-secondary)' }

  return (
    /* Signature move: 2px solid accent-solid rule at top — nowhere else in the UI */
    <div
      className="border"
      style={{
        borderColor: 'var(--border)',
        borderTopWidth: '2px',
        borderTopColor: 'var(--accent-solid)',
        backgroundColor: 'var(--surface)',
      }}
    >
      <div className="p-4">
        <div className="flex justify-between items-start mb-2 gap-2">
          <h2
            className="font-display text-[20px] font-semibold leading-snug"
            style={{ color: 'var(--text)' }}
          >
            {activeEvent.title}
          </h2>
          <div className="shrink-0 text-right">
            <span className="label-caps block" style={{ color: sev.color }}>{sev.label}</span>
            <span className="label-caps block mt-px">{activeEvent.category}</span>
          </div>
        </div>
        <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text)' }}>
          {activeEvent.body}
        </p>
        <div className="space-y-2">
          {activeEvent.choices.map((choice) => (
            <button
              type="button"
              key={choice.id}
              onClick={() => resolveEvent(choice.id)}
              className="w-full text-left p-3 border transition-colors"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)', color: 'var(--text)' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--background)')}
            >
              <span className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{choice.label}</span>
              {choice.description && (
                <p className="text-[11px] mt-1 leading-snug" style={{ color: 'var(--text-secondary)' }}>
                  {choice.description}
                </p>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
