import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  useNavigate,
} from '@tanstack/react-router'
import { lazy, useEffect, useState } from 'react'
import GameApp from './App'
import type { ArchetypeKey } from './data/archetypes'
import { STARTING_STATE } from './data/startingState'
import { useGameStore } from './state/gameStore'
import { clearSave, hasSavedGame, loadGame } from './state/persistence'
import { ArchetypeSelectionScreen } from './ui/ArchetypeSelectionScreen'
import { DeputySelectionScreen } from './ui/DeputySelectionScreen'
import { DevPanel } from './ui/DevPanel'
import { ThemeProvider } from './ui/design/ThemeProvider'
import { GameErrorBoundary } from './ui/ErrorBoundary'
import { GoalSelectionScreen } from './ui/GoalSelectionScreen'
import { HandoverNotesModal } from './ui/HandoverNotesModal'
import { hasSeenIntro, WelcomeModal } from './ui/WelcomeModal'
import { WelcomeScreen } from './ui/WelcomeScreen'

const LazyStyleLab = lazy(() => import('./ui/StyleLab').then((m) => ({ default: m.StyleLab })))

// ─── Root layout ─────────────────────────────────────────────────────────────
const rootRoute = createRootRoute({
  component: () => (
    <ThemeProvider>
      {import.meta.env.DEV && <DevPanel />}
      <Outlet />
    </ThemeProvider>
  ),
})

// ─── / → Welcome ─────────────────────────────────────────────────────────────
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: function WelcomeRoute() {
    const navigate = useNavigate()

    function handleNewGame() {
      clearSave()
      useGameStore.setState({ ...STARTING_STATE })
      if (!hasSeenIntro()) {
        navigate({ to: '/new-game/intro' })
      } else {
        navigate({ to: '/new-game/archetype' })
      }
    }

    function handleContinue() {
      const saved = loadGame()
      if (!saved) return
      useGameStore.setState({ ...saved })
      navigate({ to: '/game' })
    }

    return (
      <WelcomeScreen
        onNewGame={handleNewGame}
        onContinue={handleContinue}
        canContinue={hasSavedGame()}
      />
    )
  },
})

// ─── /new-game layout ────────────────────────────────────────────────────────
const newGameRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/new-game',
  component: () => <Outlet />,
})

// /new-game/intro → WelcomeModal (first-timer intro)
const introRoute = createRoute({
  getParentRoute: () => newGameRoute,
  path: '/intro',
  component: function IntroRoute() {
    const navigate = useNavigate()
    return <WelcomeModal onStart={() => navigate({ to: '/new-game/archetype', replace: true })} />
  },
})

// /new-game/archetype
const archetypeRoute = createRoute({
  getParentRoute: () => newGameRoute,
  path: '/archetype',
  component: function ArchetypeRoute() {
    const navigate = useNavigate()
    return (
      <ArchetypeSelectionScreen
        onSelect={(_key: ArchetypeKey) => {
          // ArchetypeSelectionScreen already sets runMeta.archetype in Zustand on select
          navigate({ to: '/new-game/deputy', replace: true })
        }}
      />
    )
  },
})

// /new-game/deputy
const deputyRoute = createRoute({
  getParentRoute: () => newGameRoute,
  path: '/deputy',
  component: function DeputyRoute() {
    const navigate = useNavigate()
    const archetypeKey = (useGameStore((s) => s.runMeta.archetype) ?? 'technocrat') as ArchetypeKey
    return (
      <DeputySelectionScreen
        archetypeKey={archetypeKey}
        onSelect={() => navigate({ to: '/new-game/handover', replace: true })}
      />
    )
  },
})

// /new-game/handover
const handoverRoute = createRoute({
  getParentRoute: () => newGameRoute,
  path: '/handover',
  component: function HandoverRoute() {
    const navigate = useNavigate()
    const archetypeKey = (useGameStore((s) => s.runMeta.archetype) ?? 'technocrat') as ArchetypeKey
    return (
      <HandoverNotesModal
        archetypeKey={archetypeKey}
        onClose={() =>
          navigate({ to: '/new-game/goal', search: { context: 'new-game' }, replace: true })
        }
      />
    )
  },
})

// /new-game/goal
const goalRoute = createRoute({
  getParentRoute: () => newGameRoute,
  path: '/goal',
  validateSearch: (search: Record<string, unknown>) => ({
    context: (search.context === 'migration' ? 'migration' : 'new-game') as
      | 'new-game'
      | 'migration',
  }),
  component: function GoalRoute() {
    const navigate = useNavigate()
    const { context } = goalRoute.useSearch()
    return (
      <GoalSelectionScreen
        context={context}
        onSelect={() => navigate({ to: '/game', replace: true })}
      />
    )
  },
})

// ─── /game → main game ───────────────────────────────────────────────────────
function GameRouteGuard() {
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // 1. Try to restore from saved game first (handles refresh mid-game)
    const saved = loadGame()
    if (saved) {
      useGameStore.setState({ ...saved })
      setReady(true)
      return
    }

    // 2. No save — check if store has been properly initialised from setup flow
    const state = useGameStore.getState()
    const hasValidGame =
      state.week >= 1 && state.runMeta.archetype !== null && state.deputy !== null

    if (!hasValidGame) {
      navigate({ to: '/', replace: true })
      return
    }

    setReady(true)
  }, [navigate])

  if (!ready) return null
  return (
    <GameErrorBoundary>
      <GameApp />
    </GameErrorBoundary>
  )
}

const gameRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/game',
  component: GameRouteGuard,
})

// ─── /style-lab → design sandbox ─────────────────────────────────────────────
const styleLabRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/style-lab',
  component: LazyStyleLab,
})

// ─── Router ──────────────────────────────────────────────────────────────────
const routeTree = rootRoute.addChildren([
  indexRoute,
  newGameRoute.addChildren([introRoute, archetypeRoute, deputyRoute, handoverRoute, goalRoute]),
  gameRoute,
  styleLabRoute,
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
