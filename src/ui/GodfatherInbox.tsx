import { useGameStore } from '../state/gameStore'

function escalationWarning(count: number): string | null {
  if (count === 0) return null
  if (count === 1) return null
  if (count === 2) return 'He is becoming impatient.'
  if (count === 3) return 'He will not ask a fourth time.'
  return 'The relationship is broken.'
}

export function GodfatherInbox() {
  const activeMessage = useGameStore((s) => s.activeGodfatherMessage)
  const messages = useGameStore((s) => s.godfatherMessages)
  const refusalCount = useGameStore((s) => s.godfatherRefusalCount)
  const acceptGodfather = useGameStore((s) => s.acceptGodfather)
  const refuseGodfather = useGameStore((s) => s.refuseGodfather)

  const warning = escalationWarning(refusalCount)

  return (
    <div
      className={`rounded border ${activeMessage ? 'border-yellow-600 bg-gray-800' : 'border-gray-700 bg-gray-800'} p-3`}
    >
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-gray-300">Godfather</h2>
        {activeMessage && <span className="text-xs text-yellow-500">ACTIVE</span>}
      </div>

      {activeMessage && (
        <div className="mb-3 space-y-3">
          <p className="text-sm text-gray-200 italic leading-relaxed">{activeMessage.text}</p>
          <p className="text-xs text-gray-400">{activeMessage.ask.description}</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={acceptGodfather}
              className="flex-1 rounded bg-yellow-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-yellow-600"
            >
              Accept
            </button>
            <button
              type="button"
              onClick={refuseGodfather}
              className="flex-1 rounded bg-gray-700 px-3 py-1.5 text-xs font-medium text-gray-200 hover:bg-gray-600"
            >
              Refuse
            </button>
          </div>
          {warning && <p className="text-xs text-red-400 font-medium">{warning}</p>}
        </div>
      )}

      {!activeMessage && messages.length === 0 && (
        <p className="text-xs text-gray-500">No messages yet.</p>
      )}

      {!activeMessage && messages.length > 0 && (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {messages.map((msg) => (
            <div key={msg.id} className="border-l-2 border-gray-600 pl-2">
              <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{msg.text}</p>
              <p className="text-[10px] text-gray-600 mt-0.5">
                Week {msg.week} &middot; {msg.ask.type}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
