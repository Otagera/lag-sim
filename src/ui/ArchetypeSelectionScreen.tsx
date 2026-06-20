import { ARCHETYPES, ARCHETYPE_KEY_ORDER, getArchetypeState } from '../data/archetypes'
import type { ArchetypeKey } from '../data/archetypes'
import { useGameStore } from '../state/gameStore'

const BORDER_COLOR: Record<ArchetypeKey, string> = {
  technocrat: 'var(--info-9)',
  loyalist: 'var(--warning-9)',
  outsider: 'var(--accent-solid)',
}

type Props = {
  onSelect: (key: ArchetypeKey) => void
}

export function ArchetypeSelectionScreen({ onSelect }: Props) {
  function handleSelect(key: ArchetypeKey) {
    useGameStore.setState(getArchetypeState(key))
    onSelect(key)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-start justify-center py-8 px-4" style={{ backgroundColor: 'var(--background)' }}>
      <div className="w-full max-w-3xl">
        <div className="text-center mb-8">
          <p className="label-caps" style={{ color: 'var(--accent-text)' }}>Choose your path</p>
          <h1 className="font-display text-2xl font-semibold mt-1" style={{ color: 'var(--text)' }}>Who Are You?</h1>
          <p className="text-sm mt-2 max-w-xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Your background shapes how you enter government. Each archetype starts with different
            strengths and liabilities. Choose wisely — this cannot be undone.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ARCHETYPE_KEY_ORDER.map((key) => {
            const arch = ARCHETYPES[key]
            return (
              <div
                key={key}
                className="border p-4 flex flex-col gap-3"
                style={{ borderColor: BORDER_COLOR[key], borderTopWidth: '2px', backgroundColor: 'var(--surface)' }}
              >
                <div>
                  <div className="label-caps" style={{ color: BORDER_COLOR[key] }}>{arch.shortName}</div>
                  <h2 className="text-[13px] font-semibold mt-0.5" style={{ color: 'var(--text)' }}>{arch.name}</h2>
                  <p className="text-[11px] mt-0.5 italic" style={{ color: BORDER_COLOR[key] }}>{arch.tagline}</p>
                </div>

                <p className="text-[11px] leading-relaxed flex-1" style={{ color: 'var(--text)' }}>{arch.description}</p>

                <div className="space-y-1 text-[11px]" style={{ borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
                  {arch.statPreview.map((s) => (
                    <div key={s.label} className="flex justify-between">
                      <span style={{ color: 'var(--text-secondary)' }}>{s.label}</span>
                      <span className="font-semibold" style={{ color: s.positive ? 'var(--success-11)' : 'var(--error-11)' }}>
                        {s.value}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-1 text-[11px]">
                  <div>
                    <span className="font-semibold" style={{ color: 'var(--success-11)' }}>Strength: </span>
                    <span style={{ color: 'var(--text)' }}>{arch.strength}</span>
                  </div>
                  <div>
                    <span className="font-semibold" style={{ color: 'var(--error-11)' }}>Risk: </span>
                    <span style={{ color: 'var(--text)' }}>{arch.risk}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSelect(key)}
                  className="w-full py-2 text-[11px] font-semibold transition-colors"
                  style={{ backgroundColor: BORDER_COLOR[key], color: 'var(--neutral-1)' }}
                >
                  Play as {arch.shortName}
                </button>
              </div>
            )
          })}
        </div>

        <p className="text-center text-[11px] mt-6" style={{ color: 'var(--border-strong)' }}>
          After choosing your archetype you will select your Deputy Governor.
        </p>
      </div>
    </div>
  )
}
