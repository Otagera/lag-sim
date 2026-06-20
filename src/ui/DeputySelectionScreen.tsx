import { DEPUTY_PROFILES } from '../data/deputies'
import { useGameStore } from '../state/gameStore'
import type { DeputyKey } from '../state/types'

const FALLBACK_KEYS: DeputyKey[] = ['technocrat', 'politician', 'loyalist']

type Props = {
  onSelect: () => void
}

export function DeputySelectionScreen({ onSelect }: Props) {
  const setDeputy = useGameStore((s) => s.setDeputy)
  const offeredDeputies = useGameStore((s) => s.offeredDeputies)
  const keys: DeputyKey[] = offeredDeputies?.length === 3 ? offeredDeputies : FALLBACK_KEYS

  function handleSelect(key: DeputyKey) {
    setDeputy(key)
    onSelect()
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-start justify-center py-8 px-4" style={{ backgroundColor: 'var(--background)' }}>
      <div className="w-full max-w-3xl">
        <div className="text-center mb-8">
          <p className="label-caps" style={{ color: 'var(--accent-text)' }}>Your running mate</p>
          <h1 className="font-display text-2xl font-semibold mt-1" style={{ color: 'var(--text)' }}>Choose Your Deputy Governor</h1>
          <p className="text-sm mt-2 max-w-xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Your Deputy will shape how the administration governs. Each brings different strengths
            and risks. This decision cannot be undone.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {keys.map((key) => {
            const profile = DEPUTY_PROFILES[key]
            return (
              <div
                key={key}
                className="border p-4 flex flex-col gap-3"
                style={{ borderColor: 'var(--border)', borderTopWidth: '2px', borderTopColor: 'var(--accent-solid)', backgroundColor: 'var(--surface)' }}
              >
                <div>
                  <div className="label-caps" style={{ color: 'var(--accent-text)' }}>{profile.shortName}</div>
                  <h2 className="text-[13px] font-semibold mt-0.5" style={{ color: 'var(--text)' }}>{profile.name}</h2>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>{profile.title}</p>
                </div>

                <p className="text-[11px] leading-relaxed flex-1" style={{ color: 'var(--text)' }}>
                  {profile.description}
                </p>

                <div className="space-y-1.5 text-[11px]">
                  <div>
                    <span className="font-semibold" style={{ color: 'var(--success-11)' }}>Strength: </span>
                    <span style={{ color: 'var(--text)' }}>{profile.strength}</span>
                  </div>
                  <div>
                    <span className="font-semibold" style={{ color: 'var(--error-11)' }}>Risk: </span>
                    <span style={{ color: 'var(--text)' }}>{profile.risk}</span>
                  </div>
                </div>

                {Object.keys(profile.factionBonuses).length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(profile.factionBonuses).map(([faction, delta]) => (
                      <span
                        key={faction}
                        className="text-[10px] px-1.5 py-0.5"
                        style={{
                          backgroundColor: (delta ?? 0) >= 0 ? 'var(--success-3)' : 'var(--error-3)',
                          color: (delta ?? 0) >= 0 ? 'var(--success-11)' : 'var(--error-11)',
                        }}
                      >
                        {faction.replace(/([A-Z])/g, ' $1').trim()} {(delta ?? 0) > 0 ? '+' : ''}{delta}
                      </span>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => handleSelect(key)}
                  className="w-full py-2 text-[11px] font-semibold transition-colors"
                  style={{ backgroundColor: 'var(--accent-solid)', color: 'var(--accent-on-solid)' }}
                >
                  Select {profile.shortName}
                </button>
              </div>
            )
          })}
        </div>

        <p className="text-center text-[11px] mt-6" style={{ color: 'var(--border-strong)' }}>
          Your choice will be applied immediately. The deputy's strengths activate at game start.
        </p>
      </div>
    </div>
  )
}
