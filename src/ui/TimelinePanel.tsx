import { useGameStore } from '../state/gameStore'

export function TimelinePanel() {
  const timeline = useGameStore((s) => s.timeline)

  if (timeline.length === 0) {
    return (
      <div className="rounded-lg bg-gray-800 p-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">Timeline</h3>
        <p className="text-gray-500 text-xs">No events yet.</p>
      </div>
    )
  }

  const reversed = [...timeline].reverse().slice(0, 10)

  return (
    <div className="rounded-lg bg-gray-800 p-4">
      <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">Timeline</h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {reversed.map((entry) => (
          <div
            key={`${entry.week}-${entry.title}-${entry.description}`}
            className="border-l-2 border-gray-600 pl-3 text-xs"
          >
            <span className="text-gray-500">Week {entry.week}</span>
            <p className="text-white">{entry.title}</p>
            <p className="text-gray-400">{entry.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
