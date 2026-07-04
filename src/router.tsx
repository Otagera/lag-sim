import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  useNavigate,
} from '@tanstack/react-router'
import { lazy, useEffect, useState } from 'react'
import GameApp from './App'
import { STARTING_STATE } from './data/startingState'
import { useGameStore } from './state/gameStore'
import { clearSave, hasSavedGame, loadGame } from './state/persistence'
import { DevPanel } from './ui/DevPanel'
import { ThemeProvider } from './ui/design/ThemeProvider'
import { GameErrorBoundary } from './ui/ErrorBoundary'
import { NewGameFlow } from './ui/onboarding/NewGameFlow'
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
      navigate({ to: '/new-game' })
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

// ─── /new-game → onboarding flow ─────────────────────────────────────────────
const newGameRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/new-game',
  component: NewGameFlow,
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
const routeTree = rootRoute.addChildren([indexRoute, newGameRoute, gameRoute, styleLabRoute])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
