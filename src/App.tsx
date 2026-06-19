import { useEffect, useState } from 'react'
import { STARTING_STATE } from './data/startingState'
import { useGameStore } from './state/gameStore'
import { clearSave, hasSavedGame, loadGame } from './state/persistence'
import { ArchetypeSelectionScreen } from './ui/ArchetypeSelectionScreen'
import { BudgetPanel } from './ui/BudgetPanel'
import { Dashboard, TERMS } from './ui/Dashboard'
import { DeputySelectionScreen } from './ui/DeputySelectionScreen'
import { EventCard } from './ui/EventCard'
import { FactionPanel } from './ui/FactionPanel'
import { GodfatherInbox } from './ui/GodfatherInbox'
import { LegacyScreen } from './ui/LegacyScreen'
import { PollPanel } from './ui/PollPanel'
import { TimelinePanel } from './ui/TimelinePanel'
import { WelcomeModal, hasSeenIntro } from './ui/WelcomeModal'
import { formatGameMonth } from './utils/calendar'

function App() {
  const tick = useGameStore((s) => s.tick)
  const isGameOver = useGameStore((s) => s.isGameOver)
  const gameOverReason = useGameStore((s) => s.gameOverReason)
  const week = useGameStore((s) => s.week)
  const mode = useGameStore((s) => s.mode)
  const setMode = useGameStore((s) => s.setMode)
  const [showLoadPrompt, setShowLoadPrompt] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)
  const [showArchetypeSelect, setShowArchetypeSelect] = useState(false)
  const [showDeputySelect, setShowDeputySelect] = useState(false)

  useEffect(() => {
    if (hasSavedGame()) {
      setShowLoadPrompt(true)
    } else if (!hasSeenIntro()) {
      setShowWelcome(true)
    }
  }, [])

  function handleResume() {
    const saved = loadGame()
    if (saved) {
      useGameStore.setState({ ...saved })
    }
    setShowLoadPrompt(false)
  }

  function handleNewGame() {
    clearSave()
    useGameStore.setState({ ...STARTING_STATE })
    setShowLoadPrompt(false)
    if (!hasSeenIntro()) {
      setShowWelcome(true)
    } else {
      setShowArchetypeSelect(true)
    }
  }

  function handleExport() {
    const state = useGameStore.getState()
    const exportData = {
      exportedAt: new Date().toISOString(),
      week: state.week,
      stats: state.stats,
      factions: state.factions,
      constituencyApproval: state.constituencyApproval,
      budget: {
        lastWeekRevenue: state.lastWeekRevenue,
        lastWeekExpenditure: state.lastWeekExpenditure,
      },
      loans: state.activeLoans,
      pendingDelayed: state.pendingDelayed,
      timeline: state.timeline,
      resolvedEvents: state.resolvedEvents,
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lagos-save-week${state.week}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const year = Math.ceil(week / 52)
  const termLabel = TERMS[Math.min(year - 1, TERMS.length - 1)]
  const monthLabel = formatGameMonth(week)

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col overflow-hidden">
      {showWelcome && (
        <WelcomeModal
          onStart={() => {
            setShowWelcome(false)
            setShowArchetypeSelect(true)
          }}
        />
      )}
      {showArchetypeSelect && !showWelcome && (
        <ArchetypeSelectionScreen
          onSelect={() => {
            setShowArchetypeSelect(false)
            setShowDeputySelect(true)
          }}
        />
      )}
      {showDeputySelect && !showArchetypeSelect && !showWelcome && (
        <DeputySelectionScreen onSelect={() => setShowDeputySelect(false)} />
      )}
      <header className="shrink-0 flex items-center justify-between px-3 py-2 border-b border-gray-800">
        <div>
          <h1 className="text-sm font-bold">Lagos Governor Sim</h1>
          <p className="text-[10px] text-gray-500">{termLabel} · {monthLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="rounded bg-gray-700 hover:bg-gray-600 px-2 py-1 text-[10px] font-medium transition-colors"
            title="Download current game state as JSON"
          >
            Export
          </button>
          <button
            type="button"
            onClick={() => setMode(mode === 'simple' ? 'detailed' : 'simple')}
            className="rounded bg-gray-700 hover:bg-gray-600 px-2 py-1 text-[10px] font-medium transition-colors"
          >
            {mode === 'simple' ? 'Detailed' : 'Simple'}
          </button>
          {!isGameOver && (
            <button
              type="button"
              onClick={tick}
              className="rounded bg-blue-600 hover:bg-blue-500 px-3 py-1 text-xs font-medium transition-colors"
            >
              Next Week
            </button>
          )}
        </div>
      </header>

      {showLoadPrompt && (
        <div className="shrink-0 mx-3 mt-2 rounded-lg bg-blue-900/50 border border-blue-700 p-3 text-center">
          <p className="text-xs text-blue-200 mb-2">
            A saved game was found. Resume where you left off?
          </p>
          <div className="flex justify-center gap-2">
            <button
              type="button"
              onClick={handleResume}
              className="rounded bg-blue-600 hover:bg-blue-500 px-3 py-1 text-xs font-medium"
            >
              Resume
            </button>
            <button
              type="button"
              onClick={handleNewGame}
              className="rounded bg-gray-700 hover:bg-gray-600 px-3 py-1 text-xs font-medium"
            >
              New Game
            </button>
          </div>
        </div>
      )}

      {isGameOver && gameOverReason?.includes('term has ended') ? (
        <div className="flex-1 overflow-y-auto min-h-0">
          <LegacyScreen />
        </div>
      ) : (
        <>
          {isGameOver && (
            <div className="shrink-0 mx-3 mt-2 rounded-lg bg-red-900/50 border border-red-700 p-2 text-center">
              <h2 className="text-sm font-bold text-red-400">Game Over</h2>
              <p className="text-xs text-red-200 mt-0.5">{gameOverReason}</p>
            </div>
          )}

          <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-2 p-2 overflow-hidden">
            <div className="lg:col-span-2 space-y-2 overflow-y-auto min-h-0">
              <Dashboard />
              <EventCard />
              <TimelinePanel />
            </div>
            <div className="space-y-2 overflow-y-auto min-h-0">
              <FactionPanel />
              <BudgetPanel />
              <PollPanel />
              <GodfatherInbox />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default App
