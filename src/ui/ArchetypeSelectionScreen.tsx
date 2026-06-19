import { ARCHETYPES, ARCHETYPE_KEY_ORDER, getArchetypeState } from '../data/archetypes'
import type { ArchetypeKey } from '../data/archetypes'
import { useGameStore } from '../state/gameStore'

const BG: Record<ArchetypeKey, string> = {
  technocrat: 'border-blue-600 bg-blue-900/20',
  loyalist: 'border-amber-600 bg-amber-900/20',
  outsider: 'border-green-600 bg-green-900/20',
}

const ACCENT: Record<ArchetypeKey, string> = {
  technocrat: 'text-blue-400',
  loyalist: 'text-amber-400',
  outsider: 'text-green-400',
}

const BTN: Record<ArchetypeKey, string> = {
  technocrat: 'bg-blue-700 hover:bg-blue-600',
  loyalist: 'bg-amber-700 hover:bg-amber-600',
  outsider: 'bg-green-700 hover:bg-green-600',
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
    <div className="fixed inset-0 bg-gray-950 z-50 overflow-y-auto flex items-start justify-center py-8 px-4">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">Who Are You?</h1>
          <p className="text-gray-400 text-sm mt-2 max-w-xl mx-auto">
            Your background shapes how you enter government. Each archetype starts with different
            strengths and liabilities. Choose wisely — this cannot be undone.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ARCHETYPE_KEY_ORDER.map((key) => {
            const arch = ARCHETYPES[key]
            return (
              <div key={key} className={`rounded-xl border-2 p-4 flex flex-col gap-3 ${BG[key]}`}>
                <div>
                  <div className={`text-xs font-semibold uppercase tracking-wide ${ACCENT[key]}`}>
                    {arch.shortName}
                  </div>
                  <h2 className="text-sm font-bold text-white mt-0.5">{arch.name}</h2>
                  <p className={`text-[11px] mt-0.5 ${ACCENT[key]}`}>{arch.tagline}</p>
                </div>

                <p className="text-xs text-gray-300 leading-relaxed flex-1">{arch.description}</p>

                <div className="space-y-1 text-[11px]">
                  {arch.statPreview.map((s) => (
                    <div key={s.label} className="flex justify-between">
                      <span className="text-gray-400">{s.label}</span>
                      <span className={s.positive ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}>
                        {s.value}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-1 text-[11px]">
                  <div>
                    <span className="text-green-400 font-semibold">Strength: </span>
                    <span className="text-gray-300">{arch.strength}</span>
                  </div>
                  <div>
                    <span className="text-red-400 font-semibold">Risk: </span>
                    <span className="text-gray-300">{arch.risk}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSelect(key)}
                  className={`w-full rounded-lg py-2 text-xs font-semibold text-white transition-colors ${BTN[key]}`}
                >
                  Play as {arch.shortName}
                </button>
              </div>
            )
          })}
        </div>

        <p className="text-center text-gray-600 text-[11px] mt-6">
          After choosing your archetype you will select your Deputy Governor.
        </p>
      </div>
    </div>
  )
}
