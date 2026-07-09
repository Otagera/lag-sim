import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { ARCHETYPE_KEY_ORDER, type ArchetypeKey, getArchetypeState } from '../../data/archetypes'
import { ALL_GOALS } from '../../data/goals'
import { useGameStore } from '../../state/gameStore'
import { saveGame } from '../../state/persistence'
import type { DeputyKey } from '../../state/types'
import { Kicker } from '../components/Typography'
import { useReducedMotion } from '../design/useReducedMotion'
import { ArchetypeCard } from './ArchetypeMock'
import { DeputyCard } from './DeputyMock'
import { GoalCard } from './GoalMock'
import { GOAL_THEME_OF, GOAL_THEME_ORDER, GOAL_THEMES, type GoalThemeKey } from './goalThemes'
import { HandoverMock } from './HandoverMock'
import { ONBOARDING_KEYFRAMES } from './keyframes'
import { StepProgress } from './StepProgress'
import { WelcomeMock } from './WelcomeMock'

const STEPS = [
  { id: 'welcome', label: 'Welcome' },
  { id: 'archetype', label: 'Archetype' },
  { id: 'deputy', label: 'Deputy' },
  { id: 'handover', label: 'Handover' },
  { id: 'goal', label: 'Goal' },
]

const FALLBACK_DEPUTIES: DeputyKey[] = ['technocrat', 'politician', 'loyalist']
const STEP_ANIM = { animation: 'onboarding-step-enter 320ms ease-out' }

function NavButtons({
  stepIndex,
  onPrev,
  onNext,
  canAdvance,
  isLast,
}: {
  stepIndex: number
  onPrev: () => void
  onNext: () => void
  canAdvance: boolean
  isLast: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '8px',
        margin: '24px 0',
        fontFamily: "'Archivo Narrow', sans-serif",
        fontSize: '12px',
      }}
    >
      <button
        type="button"
        onClick={onPrev}
        disabled={stepIndex === 0}
        style={{
          padding: '7px 16px',
          border: '1px solid var(--border)',
          background: 'var(--surface)',
          color: 'var(--text-secondary)',
          cursor: stepIndex === 0 ? 'default' : 'pointer',
          opacity: stepIndex === 0 ? 0.4 : 1,
        }}
      >
        ← Back
      </button>
      {!isLast && (
        <button
          type="button"
          onClick={onNext}
          disabled={!canAdvance}
          style={{
            padding: '7px 16px',
            border: '1px solid var(--accent-solid)',
            background: canAdvance ? 'var(--accent-solid)' : 'var(--surface)',
            color: canAdvance ? 'var(--accent-on-solid)' : 'var(--text-secondary)',
            cursor: canAdvance ? 'pointer' : 'not-allowed',
            opacity: canAdvance ? 1 : 0.5,
            fontWeight: 600,
          }}
        >
          Next →
        </button>
      )}
    </div>
  )
}

function StepHeading({ kicker, title, blurb }: { kicker: string; title: string; blurb: string }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
      <Kicker accent>{kicker}</Kicker>
      <h1
        className="font-display font-semibold"
        style={{ fontSize: '30px', color: 'var(--text)', margin: '4px 0 0' }}
      >
        {title}
      </h1>
      <p className="prose" style={{ marginTop: '6px', color: 'var(--text-secondary)' }}>
        {blurb}
      </p>
    </div>
  )
}

function ArchetypeStep({
  selected,
  onPick,
  governorName,
  onName,
}: {
  selected: ArchetypeKey | null
  onPick: (key: ArchetypeKey) => void
  governorName: string
  onName: (name: string) => void
}) {
  return (
    <div style={{ maxWidth: '880px', margin: '0 auto' }}>
      <StepHeading
        kicker="Choose Your Path"
        title="Who Are You?"
        blurb="Your background shapes how you enter government — and this is where you take your name."
      />
      <div className="mx-auto" style={{ maxWidth: '340px', marginBottom: '24px' }}>
        <label
          htmlFor="governor-name"
          className="label-caps"
          style={{ display: 'block', marginBottom: '5px', color: 'var(--accent-text)' }}
        >
          Sign your administration
        </label>
        <input
          id="governor-name"
          type="text"
          value={governorName}
          onChange={(e) => onName(e.target.value)}
          placeholder="Governor's surname (optional)"
          maxLength={24}
          autoComplete="off"
          className="w-full text-center"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            padding: '9px 12px',
            fontSize: '15px',
            fontFamily: "'Archivo Narrow', sans-serif",
            color: 'var(--text)',
          }}
        />
        <p
          className="mt-1.5 text-center"
          style={{ fontSize: '10px', color: 'var(--text-secondary)' }}
        >
          {governorName.trim()
            ? `Your legacy will read "The ${governorName.trim()} Administration".`
            : 'Names your governor across the game and your shareable cards.'}
        </p>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
        }}
      >
        {ARCHETYPE_KEY_ORDER.map((key) => (
          <ArchetypeCard
            key={key}
            archetypeKey={key}
            selected={selected === key}
            onSelect={() => onPick(key)}
          />
        ))}
      </div>
    </div>
  )
}

function DeputyStep({
  offered,
  selected,
  onPick,
}: {
  offered: DeputyKey[]
  selected: DeputyKey | null
  onPick: (key: DeputyKey) => void
}) {
  return (
    <div style={{ maxWidth: '880px', margin: '0 auto' }}>
      <StepHeading
        kicker="Choose Your Deputy"
        title="Who Stands Beside You?"
        blurb="Your deputy visits sectors on your behalf every week and shapes relationships you can't be everywhere for."
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
        }}
      >
        {offered.map((key) => (
          <DeputyCard
            key={key}
            deputyKey={key}
            selected={selected === key}
            onSelect={() => onPick(key)}
          />
        ))}
      </div>
    </div>
  )
}

function CategoryCarousel({
  active,
  onPick,
}: {
  active: GoalThemeKey
  onPick: (key: GoalThemeKey) => void
}) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '12px',
        overflowX: 'auto',
        padding: '4px 2px 10px',
        scrollSnapType: 'x mandatory',
        marginBottom: '18px',
      }}
    >
      {GOAL_THEME_ORDER.map((key) => {
        const t = GOAL_THEMES[key]
        const Icon = t.Icon
        const isActive = key === active
        const n = ALL_GOALS.filter((g) => GOAL_THEME_OF[g.id] === key).length
        return (
          <button
            key={key}
            type="button"
            onClick={() => onPick(key)}
            aria-pressed={isActive}
            style={{
              scrollSnapAlign: 'center',
              flex: '0 0 auto',
              minWidth: '148px',
              cursor: 'pointer',
              padding: '14px 16px',
              background: isActive ? t.color : 'var(--surface)',
              color: isActive ? '#fff' : 'var(--text)',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: isActive ? t.color : 'var(--border)',
              borderRadius: '10px',
              boxShadow: isActive ? 'var(--shadow-md)' : 'var(--shadow-sm)',
              transition: 'transform var(--dur-fast) ease, box-shadow var(--dur-fast) ease',
              transform: isActive ? 'translateY(-2px)' : 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: isActive ? 'rgba(255,255,255,0.22)' : t.color,
                color: '#fff',
              }}
            >
              <Icon size={20} />
            </span>
            <span
              style={{
                fontFamily: "'Archivo Narrow', sans-serif",
                fontSize: '13px',
                fontWeight: 700,
              }}
            >
              {t.label}
            </span>
            <span style={{ fontSize: '10px', opacity: 0.85 }}>
              {n} mission{n === 1 ? '' : 's'}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function GoalStep({
  selectedGoal,
  onSelectGoal,
  onBegin,
  onSkip,
}: {
  selectedGoal: string | null
  onSelectGoal: (id: string) => void
  onBegin: () => void
  onSkip: () => void
}) {
  const [category, setCategory] = useState<GoalThemeKey>(GOAL_THEME_ORDER[0])
  const theme = GOAL_THEMES[category]
  const goals = ALL_GOALS.filter((g) => GOAL_THEME_OF[g.id] === category)

  return (
    <div style={{ maxWidth: '920px', margin: '0 auto' }}>
      <StepHeading
        kicker="Choose Your Mission"
        title="What Will You Be Remembered For?"
        blurb="Pick a path, choose the mandate you'll chase, then begin. It shapes nothing in the sim — it's the promise you make yourself."
      />

      <CategoryCarousel active={category} onPick={setCategory} />
      <p
        style={{
          textAlign: 'center',
          fontSize: '12px',
          color: 'var(--text-secondary)',
          margin: '0 0 18px',
        }}
      >
        {theme.blurb}
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: '16px',
        }}
      >
        {goals.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            accent={theme.color}
            selected={selectedGoal === goal.id}
            onSelect={() => onSelectGoal(goal.id)}
          />
        ))}
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px',
          marginTop: '28px',
        }}
      >
        <button
          type="button"
          onClick={onBegin}
          disabled={!selectedGoal}
          style={{
            padding: '13px 34px',
            border: 'none',
            background: selectedGoal ? 'var(--accent-solid)' : 'var(--surface-active)',
            color: selectedGoal ? 'var(--accent-on-solid)' : 'var(--text-secondary)',
            borderRadius: '4px',
            fontFamily: "'Archivo Narrow', sans-serif",
            fontSize: '15px',
            fontWeight: 700,
            letterSpacing: '0.02em',
            cursor: selectedGoal ? 'pointer' : 'not-allowed',
            opacity: selectedGoal ? 1 : 0.55,
            boxShadow: selectedGoal ? 'var(--shadow-md)' : 'none',
          }}
        >
          Begin Governing →
        </button>
        <button
          type="button"
          onClick={onSkip}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            fontFamily: "'Archivo Narrow', sans-serif",
            fontSize: '12px',
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          Govern without a goal — every decision on instinct
        </button>
      </div>
    </div>
  )
}

/**
 * The real new-game onboarding: a single five-step flow (Welcome → Archetype →
 * Deputy → Handover → Goal) wired to the store. Replaces the old per-route
 * screens. Archetype selection resets the store to that archetype's starting
 * state (so it must come before naming); the governor name is held locally and
 * committed at the end so an archetype re-pick can't wipe it.
 */
export function NewGameFlow() {
  const navigate = useNavigate()
  const reduced = useReducedMotion()
  const offeredFromStore = useGameStore((s) => s.offeredDeputies)

  const [stepIndex, setStepIndex] = useState(0)
  const [governorName, setGovernorName] = useState('')
  const [archetype, setArchetype] = useState<ArchetypeKey | null>(null)
  const [deputy, setDeputy] = useState<DeputyKey | null>(null)
  const [goalId, setGoalId] = useState<string | null>(null)

  const offered = offeredFromStore?.length === 3 ? offeredFromStore : FALLBACK_DEPUTIES

  function pickArchetype(key: ArchetypeKey) {
    const base = getArchetypeState(key)
    const runSeed = Math.floor(Math.random() * 2 ** 32)
    useGameStore.setState({ ...base, runSeed, runMeta: { ...base.runMeta, archetype: key } })
    setArchetype(key)
    // Re-selecting an archetype resets the run, invalidating any deputy pick.
    setDeputy(null)
  }

  function pickDeputy(key: DeputyKey) {
    useGameStore.getState().setDeputy(key)
    setDeputy(key)
  }

  function commit(chosenGoal: string | null) {
    const store = useGameStore.getState()
    store.setGovernorName(governorName)
    store.setGoal(chosenGoal)
    saveGame(useGameStore.getState())
    navigate({ to: '/game', replace: true })
  }

  const canAdvance = stepIndex === 1 ? archetype !== null : stepIndex === 2 ? deputy !== null : true
  const isLast = stepIndex === STEPS.length - 1

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      style={{ backgroundColor: 'var(--background)', padding: '32px 24px 64px' }}
    >
      <style>{ONBOARDING_KEYFRAMES}</style>
      <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
        <StepProgress
          steps={STEPS}
          currentIndex={stepIndex}
          onStepClick={(i) => i <= stepIndex && setStepIndex(i)}
        />

        <NavButtons
          stepIndex={stepIndex}
          onPrev={() => setStepIndex((i) => Math.max(0, i - 1))}
          onNext={() => canAdvance && setStepIndex((i) => Math.min(STEPS.length - 1, i + 1))}
          canAdvance={canAdvance}
          isLast={isLast}
        />

        <div key={stepIndex} style={reduced ? undefined : STEP_ANIM}>
          {stepIndex === 0 && <WelcomeMock />}
          {stepIndex === 1 && (
            <ArchetypeStep
              selected={archetype}
              onPick={pickArchetype}
              governorName={governorName}
              onName={setGovernorName}
            />
          )}
          {stepIndex === 2 && (
            <DeputyStep offered={offered} selected={deputy} onPick={pickDeputy} />
          )}
          {stepIndex === 3 && <HandoverMock />}
          {stepIndex === 4 && (
            <GoalStep
              selectedGoal={goalId}
              onSelectGoal={setGoalId}
              onBegin={() => commit(goalId)}
              onSkip={() => commit(null)}
            />
          )}
        </div>
      </div>
    </div>
  )
}
