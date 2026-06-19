import { DEPUTY_PROFILES } from '../data/deputies'
import { useGameStore } from '../state/gameStore'
import type { DeputyKey } from '../state/types'

const KEY_ORDER: DeputyKey[] = ['technocrat', 'politician', 'loyalist']

const BG_COLORS: Record<DeputyKey, string> = {
  technocrat: 'border-blue-600 bg-blue-900/20',
  politician: 'border-green-600 bg-green-900/20',
  loyalist: 'border-amber-600 bg-amber-900/20',
}

const ACCENT: Record<DeputyKey, string> = {
  technocrat: 'text-blue-400',
  politician: 'text-green-400',
  loyalist: 'text-amber-400',
}

type Props = {
  onSelect: () => void
}

export function DeputySelectionScreen({ onSelect }: Props) {
  const setDeputy = useGameStore((s) => s.setDeputy)

  function handleSelect(key: DeputyKey) {
    setDeputy(key)
    onSelect()
  }

  return (
    <div className="fixed inset-0 bg-gray-950 z-50 overflow-y-auto flex items-start justify-center py-8 px-4">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">Choose Your Deputy Governor</h1>
          <p className="text-gray-400 text-sm mt-2 max-w-xl mx-auto">
            Your Deputy will shape how the administration governs. Each brings different strengths
            and risks. This decision cannot be undone.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {KEY_ORDER.map((key) => {
            const profile = DEPUTY_PROFILES[key]
            return (
              <div
                key={key}
                className={`rounded-xl border-2 p-4 flex flex-col gap-3 ${BG_COLORS[key]}`}
              >
                <div>
                  <div className={`text-xs font-semibold uppercase tracking-wide ${ACCENT[key]}`}>
                    {key}
                  </div>
                  <h2 className="text-sm font-bold text-white mt-0.5">{profile.name}</h2>
                  <p className="text-[11px] text-gray-400 mt-0.5">{profile.title}</p>
                </div>

                <p className="text-xs text-gray-300 leading-relaxed flex-1">
                  {profile.description}
                </p>

                <div className="space-y-2 text-[11px]">
                  <div>
                    <span className="text-green-400 font-semibold">Strength: </span>
                    <span className="text-gray-300">{profile.strength}</span>
                  </div>
                  <div>
                    <span className="text-red-400 font-semibold">Risk: </span>
                    <span className="text-gray-300">{profile.risk}</span>
                  </div>
                </div>

                {Object.keys(profile.factionBonuses).length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(profile.factionBonuses).map(([faction, delta]) => (
                      <span
                        key={faction}
                        className="text-[10px] rounded px-1.5 py-0.5 bg-green-900/40 text-green-300"
                      >
                        {faction.replace(/([A-Z])/g, ' $1').trim()} {delta > 0 ? '+' : ''}
                        {delta}
                      </span>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => handleSelect(key)}
                  className={`w-full rounded-lg py-2 text-xs font-semibold text-white transition-colors ${
                    key === 'technocrat'
                      ? 'bg-blue-700 hover:bg-blue-600'
                      : key === 'politician'
                        ? 'bg-green-700 hover:bg-green-600'
                        : 'bg-amber-700 hover:bg-amber-600'
                  }`}
                >
                  Select {profile.shortName}
                </button>
              </div>
            )
          })}
        </div>

        <p className="text-center text-gray-600 text-[11px] mt-6">
          Your choice will be applied immediately. The deputy's strengths activate at game start.
        </p>
      </div>
    </div>
  )
}
