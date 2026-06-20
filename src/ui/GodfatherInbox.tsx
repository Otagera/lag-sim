import { fashemuAsks } from '../data/godfatherAsks'
import { useGameStore } from '../state/gameStore'
import type { FashemuPhase } from '../state/types'

function escalationWarning(count: number): string | null {
  if (count <= 1) return null
  if (count === 2) return 'He is becoming impatient.'
  if (count === 3) return 'He will not ask a fourth time.'
  return 'The relationship is broken.'
}

const PHASE_LABEL: Record<FashemuPhase, { text: string; color: string }> = {
  dormant: { text: 'Quiet', color: 'var(--text-secondary)' },
  active: { text: 'Active', color: 'var(--warning-11)' },
  warning: { text: 'Warning', color: 'var(--warning-9)' },
  break: { text: 'BROKEN', color: 'var(--error-9)' },
  reconciled: { text: 'Reconciled', color: 'var(--info-11)' },
  dead: { text: 'Deceased', color: 'var(--border-strong)' },
}

export function GodfatherInbox() {
  const activeMessage = useGameStore((s) => s.activeGodfatherMessage)
  const messages = useGameStore((s) => s.godfatherMessages)
  const refusalCount = useGameStore((s) => s.godfatherRefusalCount)
  const fashemuPhase = useGameStore((s) => s.fashemuPhase)
  const fashemuAskIndex = useGameStore((s) => s.fashemuAskIndex)
  const acceptGodfather = useGameStore((s) => s.acceptGodfather)
  const refuseGodfather = useGameStore((s) => s.refuseGodfather)

  const warning = escalationWarning(refusalCount)
  const isFashemuMessage = activeMessage
    ? fashemuAsks.some((a) => a.id === activeMessage.id)
    : false
  const phaseInfo = PHASE_LABEL[fashemuPhase]

  return (
    <div
      className="p-3 border"
      style={{
        borderColor: activeMessage ? 'var(--warning-9)' : 'var(--border)',
        backgroundColor: activeMessage ? 'var(--warning-3)' : 'var(--surface)',
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-[12px] font-semibold" style={{ color: 'var(--text)' }}>
            {isFashemuMessage ? 'Chief B.O.A. Fashemu' : 'Godfather'}
          </h2>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] font-medium" style={{ color: phaseInfo.color }}>{phaseInfo.text}</span>
            {fashemuAskIndex < fashemuAsks.length && (
              <span className="text-[10px]" style={{ color: 'var(--border-strong)' }}>
                · Ask {fashemuAskIndex + 1}/4
              </span>
            )}
          </div>
        </div>
        {activeMessage && <span className="label-caps" style={{ color: 'var(--warning-11)' }}>Active</span>}
      </div>

      {activeMessage && (
        <div className="mb-3 space-y-3">
          <p className="text-[13px] italic leading-relaxed" style={{ color: 'var(--text)' }}>{activeMessage.text}</p>
          <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>{activeMessage.ask.description}</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={acceptGodfather}
              className="flex-1 px-3 py-1.5 text-[11px] font-semibold transition-colors"
              style={{ backgroundColor: 'var(--warning-9)', color: 'var(--accent-on-solid)' }}
            >
              Accept
            </button>
            <button
              type="button"
              onClick={refuseGodfather}
              className="flex-1 px-3 py-1.5 text-[11px] border transition-colors"
              style={{ borderColor: 'var(--border)', color: 'var(--text)', backgroundColor: 'var(--surface)' }}
            >
              Refuse
            </button>
          </div>
          {warning && <p className="text-[11px] font-medium" style={{ color: 'var(--error-11)' }}>{warning}</p>}
        </div>
      )}

      {!activeMessage && messages.length === 0 && (
        <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>No messages yet.</p>
      )}

      {!activeMessage && messages.length > 0 && (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {messages.map((msg) => (
            <div key={msg.id} className="pl-2" style={{ borderLeft: '1px solid var(--border)' }}>
              <p className="text-[11px] leading-relaxed line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{msg.text}</p>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--border-strong)' }}>
                Week {msg.week} &middot; {msg.ask.type}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
