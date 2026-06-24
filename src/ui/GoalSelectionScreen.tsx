import { useGameStore } from '../state/gameStore'
import { ALL_GOALS, getGoalProgress } from '../data/goals'
import type { Goal } from '../data/goals'

type Props = {
  onSelect: () => void
  context: 'new-game' | 'migration'
}

export function GoalSelectionScreen({ onSelect, context }: Props) {
  const state = useGameStore.getState()

  function handleSelect(id: string | null) {
    useGameStore.setState({ selectedGoalId: id })
    onSelect()
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-start justify-center py-8 px-4" style={{ backgroundColor: 'var(--background)' }}>
      <div className="w-full max-w-3xl">
        <div className="text-center mb-8">
          <p className="label-caps" style={{ color: 'var(--accent-text)' }}>
            {context === 'migration' ? 'Your legacy' : 'Your mandate'}
          </p>
          <h1 className="font-display text-2xl font-semibold mt-1" style={{ color: 'var(--text)' }}>
            {context === 'migration'
              ? 'It Is Not Too Late'
              : 'What Will You Fight For?'}
          </h1>
          <p className="text-sm mt-2 max-w-xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
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
          <button
            type="button"
            onClick={() => handleSelect(null)}
            className="px-4 py-2 text-[11px] transition-colors border"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', backgroundColor: 'var(--surface)' }}
          >
            Govern without a goal — every decision on instinct
          </button>
        </div>

        <p className="text-center text-[11px] mt-6" style={{ color: 'var(--border-strong)' }}>
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
    <div
      className="border p-4 flex flex-col gap-3"
      style={{ borderColor: 'var(--border)', borderTopWidth: '2px', borderTopColor: 'var(--accent-solid)', backgroundColor: 'var(--surface)' }}
    >
      <div>
        <h2 className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>
          {goal.title}
        </h2>
        <p className="text-[11px] mt-0.5 italic" style={{ color: 'var(--text-secondary)' }}>
          {goal.pitch}
        </p>
      </div>

      <p className="text-[11px] leading-relaxed flex-1" style={{ color: 'var(--text)' }}>
        {goal.description}
      </p>

      <div>
        <p className="label-caps mb-1">Targets</p>
        <ul className="space-y-1">
          {goal.targets.map((t, i) => (
            <li key={i} className="text-[10px] flex items-start gap-1.5" style={{ color: 'var(--text-secondary)' }}>
              <span style={{ color: 'var(--accent-solid)' }}>•</span>
              <span>{t.label}</span>
            </li>
          ))}
        </ul>
      </div>

      {context === 'migration' && (
        <div>
          <div className="flex justify-between text-[10px] mb-0.5">
            <span style={{ color: 'var(--text-secondary)' }}>Current progress</span>
            <span className="font-semibold" style={{ color: 'var(--accent-text)' }}>{progress.toFixed(0)}%</span>
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

      <button
        type="button"
        onClick={onSelect}
        className="w-full py-2 text-[11px] font-semibold transition-colors"
        style={{ backgroundColor: 'var(--accent-solid)', color: 'var(--accent-on-solid)' }}
      >
        Make it my goal
      </button>
    </div>
  )
}
