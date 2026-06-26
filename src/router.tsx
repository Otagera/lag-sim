import { createRootRoute, createRoute, createRouter, Outlet } from '@tanstack/react-router'
import { useNavigate } from '@tanstack/react-router'
import { ThemeProvider } from './ui/design/ThemeProvider'
import { DevPanel } from './ui/DevPanel'
import { WelcomeScreen } from './ui/WelcomeScreen'
import { WelcomeModal, hasSeenIntro } from './ui/WelcomeModal'
import { ArchetypeSelectionScreen } from './ui/ArchetypeSelectionScreen'
import { DeputySelectionScreen } from './ui/DeputySelectionScreen'
import { HandoverNotesModal } from './ui/HandoverNotesModal'
import { GoalSelectionScreen } from './ui/GoalSelectionScreen'
import { StyleLab } from './ui/StyleLab'
import { useGameStore } from './state/gameStore'
import { clearSave, hasSavedGame, loadGame } from './state/persistence'
import { STARTING_STATE } from './data/startingState'
import type { ArchetypeKey } from './data/archetypes'
import GameApp from './App'

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
      if (saved.selectedGoalId === null && saved.week > 1) {
        navigate({ to: '/new-game/goal', search: { context: 'migration' } })
      } else {
        navigate({ to: '/game' })
      }
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
    return (
      <WelcomeModal
        onStart={() => navigate({ to: '/new-game/archetype' })}
      />
    )
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
          navigate({ to: '/new-game/deputy' })
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
        onSelect={() => navigate({ to: '/new-game/handover' })}
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
        onClose={() => navigate({ to: '/new-game/goal', search: { context: 'new-game' } })}
      />
    )
  },
})

// /new-game/goal
const goalRoute = createRoute({
  getParentRoute: () => newGameRoute,
  path: '/goal',
  validateSearch: (search: Record<string, unknown>) => ({
    context: (search.context === 'migration' ? 'migration' : 'new-game') as 'new-game' | 'migration',
  }),
  component: function GoalRoute() {
    const navigate = useNavigate()
    const { context } = goalRoute.useSearch()
    return (
      <GoalSelectionScreen
        context={context}
        onSelect={() => navigate({ to: '/game' })}
      />
    )
  },
})

// ─── /game → main game ───────────────────────────────────────────────────────
const gameRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/game',
  component: GameApp,
})

// ─── /style-lab → design sandbox ─────────────────────────────────────────────
const styleLabRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/style-lab',
  component: StyleLab,
})

// ─── Router ──────────────────────────────────────────────────────────────────
const routeTree = rootRoute.addChildren([
  indexRoute,
  newGameRoute.addChildren([
    introRoute,
    archetypeRoute,
    deputyRoute,
    handoverRoute,
    goalRoute,
  ]),
  gameRoute,
  styleLabRoute,
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
