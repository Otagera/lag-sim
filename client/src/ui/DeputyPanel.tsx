import { useGameStore } from '../state/gameStore'
import type { DeputyKey } from '../state/types'

const DEPUTY_ROLES: Record<DeputyKey, string> = {
  technocrat: 'Technocrat',
  politician: 'Politician',
  loyalist: 'Party Loyalist',
  reformer: 'Reformer',
  traditionalist: 'Traditionalist',
  economist: 'Economist',
  'security-chief': 'Security Chief',
}

const DEPUTY_TRIGGER: Record<DeputyKey, string> = {
  technocrat: 'Infra < 35',
  politician: 'LG Chairmen < 35',
  loyalist: 'Trust < 40',
  reformer: 'Corruption > 55',
  traditionalist: 'Godfather refusals > 2',
  economist: 'Cash < ₦5bn',
  'security-chief': 'Security < 40',
}

function ResentmentBar({ value, revealed }: { value: number; revealed: boolean }) {
  if (revealed) {
    return (
      <p className="text-[9px] italic" style={{ color: 'var(--text-secondary)' }}>
        Consequence resolved — loyalty restored
      </p>
    )
  }
  const pct = Math.round(value)
  const color =
    value >= 70 ? 'var(--error-9)' : value >= 40 ? 'var(--warning-9)' : 'var(--success-9)'
  return (
    <div>
      <div
        className="flex justify-between text-[9px] mb-0.5"
        style={{ color: 'var(--text-secondary)' }}
      >
        <span>Resentment</span>
        <span>{pct} / 100</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden" style={{ backgroundColor: 'var(--neutral-4)' }}>
        <div
          className="h-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      {value >= 60 && (
        <p className="text-[9px] mt-0.5" style={{ color: 'var(--error-11)' }}>
          Consequence event imminent
        </p>
      )}
      {value >= 40 && value < 60 && (
        <p className="text-[9px] mt-0.5" style={{ color: 'var(--warning-11)' }}>
          Deputy growing restless
        </p>
      )}
    </div>
  )
}

export function DeputyPanel() {
  const deputy = useGameStore((s) => s.deputy)
  if (!deputy) return null

  return (
    <div
      className="p-2 border"
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
    >
      <h3 className="label-caps mb-2">Deputy Governor</h3>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold" style={{ color: 'var(--text)' }}>
            {DEPUTY_ROLES[deputy.key]}
          </p>
          {deputy.revealed && (
            <span
              className="text-[9px] px-1.5 py-0.5"
              style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--surface-hover)' }}
            >
              Revealed
            </span>
          )}
        </div>
        <p className="text-[9px]" style={{ color: 'var(--text-secondary)' }}>
          Trigger: {DEPUTY_TRIGGER[deputy.key]}
        </p>
        <ResentmentBar value={deputy.resentment} revealed={deputy.revealed} />
      </div>
    </div>
  )
}
