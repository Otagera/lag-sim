import { useGameStore } from '../state/gameStore'

export function EventCard() {
  const activeEvent = useGameStore((s) => s.activeEvent)
  const resolveEvent = useGameStore((s) => s.resolveEvent)

  if (!activeEvent) {
    return (
      <div className="rounded-lg bg-gray-800 p-4 text-gray-400 text-center">
        No active event. Click "Next Week" to advance.
      </div>
    )
  }

  const severityColors: Record<string, string> = {
    low: 'border-green-600',
    medium: 'border-yellow-600',
    high: 'border-orange-600',
    critical: 'border-red-600',
  }

  return (
    <div
      className={`rounded-lg bg-gray-800 border-l-4 p-4 ${severityColors[activeEvent.severity] || 'border-gray-600'}`}
    >
      <div className="flex justify-between items-start mb-2">
        <h2 className="text-lg font-bold text-white">{activeEvent.title}</h2>
        <span className="text-xs uppercase text-gray-400">{activeEvent.category}</span>
      </div>
      <p className="text-gray-300 text-sm mb-4">{activeEvent.body}</p>
      <div className="space-y-2">
        {activeEvent.choices.map((choice) => (
          <button
            type="button"
            key={choice.id}
            onClick={() => resolveEvent(choice.id)}
            className="w-full text-left rounded bg-gray-700 hover:bg-gray-600 p-3 transition-colors"
          >
            <span className="text-white font-medium">{choice.label}</span>
            <p className="text-gray-400 text-xs mt-1">{choice.description}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
