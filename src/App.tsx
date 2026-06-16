import { useGameStore } from './state/gameStore'
import { BudgetPanel } from './ui/BudgetPanel'
import { Dashboard } from './ui/Dashboard'
import { EventCard } from './ui/EventCard'
import { FactionPanel } from './ui/FactionPanel'
import { GodfatherInbox } from './ui/GodfatherInbox'
import { PollPanel } from './ui/PollPanel'
import { TimelinePanel } from './ui/TimelinePanel'

function App() {
  const tick = useGameStore((s) => s.tick)
  const isGameOver = useGameStore((s) => s.isGameOver)
  const gameOverReason = useGameStore((s) => s.gameOverReason)

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <header className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Lagos Governor Sim</h1>
        {!isGameOver && (
          <button
            type="button"
            onClick={tick}
            className="rounded bg-blue-600 hover:bg-blue-500 px-4 py-2 text-sm font-medium transition-colors"
          >
            Next Week
          </button>
        )}
      </header>

      {isGameOver && (
        <div className="mb-6 rounded-lg bg-red-900/50 border border-red-700 p-4 text-center">
          <h2 className="text-xl font-bold text-red-400">Game Over</h2>
          <p className="text-red-200 mt-1">{gameOverReason}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Dashboard />
          <EventCard />
          <TimelinePanel />
        </div>
        <div className="space-y-4">
          <FactionPanel />
          <BudgetPanel />
          <PollPanel />
          <GodfatherInbox />
        </div>
      </div>
    </div>
  )
}

export default App
