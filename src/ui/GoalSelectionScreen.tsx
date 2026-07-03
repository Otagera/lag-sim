import type { Goal } from '../data/goals'
import { ALL_GOALS, getGoalProgress } from '../data/goals'
import { useGameStore } from '../state/gameStore'
import { saveGame } from '../state/persistence'
import { Button, Heading, Surface } from './components'

type Props = {
  onSelect: () => void
  context: 'new-game' | 'migration'
}

export function GoalSelectionScreen({ onSelect, context }: Props) {
  const state = useGameStore.getState()
  const setGoal = useGameStore((s) => s.setGoal)

  function handleSelect(id: string | null) {
    setGoal(id)
    // Flush the save synchronously before navigating. The store's auto-save is
    // debounced (500ms), but leaving this screen immediately routes to /game,
    // where GameRouteGuard reloads state from localStorage — which would restore
    // the pre-goal save and clobber the just-picked goal. Writing now guarantees
    // selectedGoalId is persisted before that reload.
    saveGame(useGameStore.getState())
    onSelect()
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto flex items-start justify-center py-8 px-4"
      style={{ backgroundColor: 'var(--background)' }}
    >
      <div className="w-full max-w-3xl">
        <div className="text-center mb-8">
          <p className="label-caps" style={{ color: 'var(--accent-text)' }}>
            {context === 'migration' ? 'Your legacy' : 'Your mandate'}
          </p>
          <Heading level={1} display>
            {context === 'migration' ? 'It Is Not Too Late' : 'What Will You Fight For?'}
          </Heading>
          <p
            className="mt-2 max-w-xl mx-auto"
            style={{ fontSize: '13px', color: 'var(--text-secondary)' }}
          >
            {context === 'migration'
              ? 'Your administration is already in motion. Choose what you want it to be remembered for — the targets adapt to where you stand today.'
              : 'Your inheritance is clear. The handover has shown you what you are walking into. Now decide what this administration will be remembered for.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ALL_GOALS.map((goal) => {
            const progress = context === 'migration' ? getGoalProgress(goal, state) : 0
            return (
              <GoalCard
                key={goal.id}
                goal={goal}
                progress={progress}
                context={context}
                onSelect={() => handleSelect(goal.id)}
              />
            )
          })}
        </div>

        <div className="mt-4 text-center">
          <Button variant="ghost" onClick={() => handleSelect(null)}>
            Govern without a goal — every decision on instinct
          </Button>
        </div>

        <p className="text-center mt-6" style={{ fontSize: '11px', color: 'var(--border-strong)' }}>
          {context === 'migration'
            ? 'You can review your goal at any time from the dashboard.'
            : 'Your goal can be tracked from the dashboard. It does not change the simulation — it is a personal commitment.'}
        </p>
      </div>
    </div>
  )
}

function GoalCard({
  goal,
  progress,
  context,
  onSelect,
}: {
  goal: Goal
  progress: number
  context: 'new-game' | 'migration'
  onSelect: () => void
}) {
  return (
    <Surface
      elevation="raised"
      padding="16px"
      style={{
        borderTop: '2px solid var(--accent-solid)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <div>
        <h2 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{goal.title}</h2>
        <p
          style={{
            fontSize: '11px',
            marginTop: '2px',
            fontStyle: 'italic',
            color: 'var(--text-secondary)',
          }}
        >
          {goal.pitch}
        </p>
      </div>

      <p style={{ fontSize: '11px', lineHeight: 1.7, color: 'var(--text)', flex: 1 }}>
        {goal.description}
      </p>

      <div>
        <p className="label-caps mb-1">Targets</p>
        <ul className="space-y-1">
          {goal.targets.map((t) => (
            <li
              key={`${goal.id}-${t.label}`}
              style={{
                fontSize: '10px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '6px',
                color: 'var(--text-secondary)',
              }}
            >
              <span style={{ color: 'var(--accent-solid)' }}>•</span>
              <span>{t.label}</span>
            </li>
          ))}
        </ul>
      </div>

      {context === 'migration' && (
        <div>
          <div className="flex justify-between mb-0.5" style={{ fontSize: '10px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Current progress</span>
            <span className="font-semibold" style={{ color: 'var(--accent-text)' }}>
              {progress.toFixed(0)}%
            </span>
          </div>
          <div className="w-full h-1" style={{ backgroundColor: 'var(--neutral-4)' }}>
            <div
              className="h-full"
              style={{
                width: `${progress}%`,
                backgroundColor: 'var(--accent-solid)',
              }}
            />
          </div>
        </div>
      )}

      <Button variant="primary" fullWidth onClick={onSelect}>
        Make it my goal
      </Button>
    </Surface>
  )
}
