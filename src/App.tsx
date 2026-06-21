import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

// Apply stored theme before first render to avoid flash
if (localStorage.getItem('theme') === 'dark') {
  document.documentElement.classList.add('dark')
}
import { STARTING_STATE } from './data/startingState'
import { useGameStore } from './state/gameStore'
import { clearSave, hasSavedGame, loadGame } from './state/persistence'
import { SAVE_VERSION } from './version'
import { ArchetypeSelectionScreen } from './ui/ArchetypeSelectionScreen'
import { HandoverNotesModal, hasSeenHandover } from './ui/HandoverNotesModal'
import { BudgetPanel } from './ui/BudgetPanel'
import { Dashboard, YEARS } from './ui/Dashboard'
import { DeputySelectionScreen } from './ui/DeputySelectionScreen'
import { EventCard } from './ui/EventCard'
import { FactionPanel } from './ui/FactionPanel'
import { GodfatherInbox } from './ui/GodfatherInbox'
import { NPCPanel } from './ui/NPCPanel'
import { LegacyScreen } from './ui/LegacyScreen'
import { PollPanel } from './ui/PollPanel'
import { TimelinePanel } from './ui/TimelinePanel'
import { WelcomeModal, hasSeenIntro } from './ui/WelcomeModal'
import { formatGameMonth } from './utils/calendar'
import { CabinetPanel } from './ui/CabinetPanel'
import { DeputyPanel } from './ui/DeputyPanel'
import { DevPanel } from './ui/DevPanel'
import { SidebarTabs } from './ui/SidebarTabs'

type MobileTab = 'event' | 'factions' | 'gov' | 'data'

function App() {
  const tick = useGameStore((s) => s.tick)
  const isGameOver = useGameStore((s) => s.isGameOver)
  const gameOverReason = useGameStore((s) => s.gameOverReason)
  const week = useGameStore((s) => s.week)
  const mode = useGameStore((s) => s.mode)
  const setMode = useGameStore((s) => s.setMode)
  const inCampaignMode = useGameStore((s) => s.inCampaignMode)
  const currentTerm = useGameStore((s) => s.currentTerm)
  const factions = useGameStore((s) => s.factions)
  const activeGodfatherMessage = useGameStore((s) => s.activeGodfatherMessage)

  const [showLoadPrompt, setShowLoadPrompt] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)
  const [showArchetypeSelect, setShowArchetypeSelect] = useState(false)
  const [showDeputySelect, setShowDeputySelect] = useState(false)
  const [showHandover, setShowHandover] = useState(false)
  const [selectedArchetype, setSelectedArchetype] = useState<'technocrat' | 'loyalist' | 'outsider'>('technocrat')
  const [activeMobileTab, setActiveMobileTab] = useState<MobileTab>('event')
  const [theme, setTheme] = useState<'light' | 'dark'>(
    () => (localStorage.getItem('theme') as 'light' | 'dark') ?? 'light'
  )

  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    localStorage.setItem('theme', next)
    if (next === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

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
      version: SAVE_VERSION,
      exportedAt: new Date().toISOString(),
      week: state.week,
      meta: {
        archetype: state.runMeta.archetype,
        simStrategy: state.runMeta.simStrategy,
        simSeed: state.runMeta.simSeed,
        simWeeksSkipped: state.runMeta.simWeeksSkipped,
        currentTerm: state.currentTerm,
      },
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

  const termBaseWeek = currentTerm === 2 ? week - 208 : week
  const year = Math.ceil(termBaseWeek / 52)
  const termLabel = currentTerm === 2 ? `Year ${year + 4}` : YEARS[Math.min(year - 1, YEARS.length - 1)]
  const monthLabel = formatGameMonth(week)

  const factionAlert = Object.values(factions).some((v) => v <= 25)
  const godfatherAlert = activeGodfatherMessage !== null

  const mobileTabs: { id: MobileTab; label: string; alert?: boolean }[] = [
    { id: 'event', label: 'Event', alert: godfatherAlert },
    { id: 'factions', label: 'Factions', alert: factionAlert },
    { id: 'gov', label: 'Gov' },
    { id: 'data', label: 'Data' },
  ]

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--background)', color: 'var(--text)' }}>
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
          onSelect={(key) => {
            setSelectedArchetype(key)
            setShowArchetypeSelect(false)
            setShowDeputySelect(true)
          }}
        />
      )}
      {showDeputySelect && !showArchetypeSelect && !showWelcome && (
        <DeputySelectionScreen
          archetypeKey={selectedArchetype}
          onSelect={() => {
            setShowDeputySelect(false)
            if (!hasSeenHandover()) setShowHandover(true)
          }}
        />
      )}
      {showHandover && !showDeputySelect && (
        <HandoverNotesModal
          archetypeKey={selectedArchetype}
          onClose={() => setShowHandover(false)}
        />
      )}

      <header className="shrink-0 flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
        <div>
          <h1 className="font-display text-sm font-semibold" style={{ color: 'var(--text)' }}>Lagos Governor Sim</h1>
          <p className="label-caps mt-px">{termLabel} · {monthLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="hidden sm:block px-2 py-1 text-[10px] font-medium transition-colors border"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            title="Download current game state as JSON"
          >
            Export
          </button>
          <button
            type="button"
            onClick={() => setMode(mode === 'simple' ? 'detailed' : 'simple')}
            className="px-2 py-1 text-[10px] font-medium transition-colors border"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          >
            {mode === 'simple' ? 'Detailed' : 'Simple'}
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            className="p-1.5 border transition-colors flex items-center justify-center"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
          {!isGameOver && (
            <button
              type="button"
              onClick={tick}
              className="px-3 py-1 text-[11px] font-semibold transition-colors"
              style={{ backgroundColor: 'var(--accent-solid)', color: 'var(--accent-on-solid)' }}
            >
              Next Week
            </button>
          )}
        </div>
      </header>

      {/* Term progress strip — 2px hairline filling left-to-right over 208 weeks */}
      <div className="shrink-0" style={{ height: '2px', backgroundColor: 'var(--neutral-4)' }}>
        <div
          style={{
            height: '100%',
            width: `${Math.min(((currentTerm === 2 ? week - 208 : week) / 208) * 100, 100)}%`,
            backgroundColor: 'var(--accent-solid)',
            transition: 'width 0.5s ease',
          }}
        />
      </div>

      {currentTerm === 2 && !isGameOver && (
        <div className="shrink-0 mx-3 mt-1 border px-3 py-1 text-center text-[10px] font-semibold tracking-wide" style={{ borderColor: 'var(--accent-solid)', color: 'var(--accent-text)', backgroundColor: 'var(--accent-bg-subtle)' }}>
          SECOND TERM — Week {week} · Years {year + 4} of 8
        </div>
      )}
      {inCampaignMode && !isGameOver && (
        <div className="shrink-0 mx-3 mt-1 border px-3 py-1 text-center text-[10px] font-semibold tracking-wide" style={{ borderColor: 'var(--accent-solid)', color: 'var(--accent-text)', backgroundColor: 'var(--accent-bg-subtle)' }}>
          ELECTION CAMPAIGN MODE — Week 195+ · Every decision counts
        </div>
      )}

      {showLoadPrompt && (
        <div className="shrink-0 mx-3 mt-2 border p-3 text-center" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
          <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
            A saved game was found. Resume where you left off?
          </p>
          <div className="flex justify-center gap-2">
            <button
              type="button"
              onClick={handleResume}
              className="px-3 py-1 text-xs font-semibold"
              style={{ backgroundColor: 'var(--accent-solid)', color: 'var(--accent-on-solid)' }}
            >
              Resume
            </button>
            <button
              type="button"
              onClick={handleNewGame}
              className="px-3 py-1 text-xs border"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', backgroundColor: 'var(--surface)' }}
            >
              New Game
            </button>
          </div>
        </div>
      )}

      {/* Development panel, I want to run fast forwrads on the go */}
      {/* {import.meta.env.DEV && <DevPanel />} */}
      <DevPanel />

      {isGameOver && gameOverReason?.includes('term has ended') ? (
        <div className="flex-1 overflow-y-auto min-h-0">
          <LegacyScreen />
        </div>
      ) : (
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {isGameOver && (
            <div className="shrink-0 mx-3 mt-2 border p-2 text-center" style={{ borderColor: 'var(--error-9)', backgroundColor: 'var(--error-3)' }}>
              <h2 className="text-sm font-bold" style={{ color: 'var(--error-11)' }}>Game Over</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--error-11)' }}>{gameOverReason}</p>
            </div>
          )}

          {/* Desktop layout — two columns with tabbed sidebar */}
          <div className="hidden lg:flex flex-1 gap-2 p-2 overflow-hidden min-h-0">
            <div className="flex-1 space-y-2 overflow-y-auto min-h-0">
              <Dashboard />
              <EventCard />
            </div>
            <div className="w-72 xl:w-80 shrink-0 flex flex-col min-h-0">
              <SidebarTabs />
            </div>
          </div>

          {/* Mobile layout — full width with bottom nav */}
          <div className="lg:hidden flex-1 flex flex-col overflow-hidden min-h-0">
            <div className="flex-1 overflow-y-auto min-h-0 p-2">
              {activeMobileTab === 'event' && (
                <div className="space-y-2">
                  <Dashboard />
                  <EventCard />
                  <GodfatherInbox />
                </div>
              )}
              {activeMobileTab === 'factions' && (
                <div className="space-y-2">
                  <FactionPanel />
                  <PollPanel />
                </div>
              )}
              {activeMobileTab === 'gov' && (
                <div className="space-y-2">
                  <DeputyPanel />
                  <NPCPanel />
                  <CabinetPanel />
                </div>
              )}
              {activeMobileTab === 'data' && (
                <div className="space-y-2">
                  <BudgetPanel />
                  <TimelinePanel />
                </div>
              )}
            </div>

            {/* Bottom nav */}
            <div className="shrink-0 flex border-t" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)' }}>
              {mobileTabs.map(({ id, label, alert }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveMobileTab(id)}
                  className="relative flex-1 py-2.5 text-[10px] font-semibold uppercase tracking-wide transition-colors"
                  style={{
                    color: activeMobileTab === id ? 'var(--text)' : 'var(--text-secondary)',
                    borderTop: activeMobileTab === id ? '2px solid var(--accent-solid)' : '2px solid transparent',
                    marginTop: '-1px',
                  }}
                >
                  {label}
                  {alert && (
                    <span
                      className="absolute top-1.5 right-1 w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: id === 'event' ? 'var(--warning-9)' : 'var(--error-9)' }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
