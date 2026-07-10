import { useState } from 'react'
import { useReducedMotion } from '../design/useReducedMotion'
import { ArchetypeMock } from './ArchetypeMock'
import { DeputyMock } from './DeputyMock'
import { GoalMock } from './GoalMock'
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

const STEP_COMPONENTS = [WelcomeMock, ArchetypeMock, DeputyMock, HandoverMock, GoalMock]

// Redesign prototype for the 5-step onboarding flow (Welcome → Archetype →
// Deputy → Handover → Goal) — this tab is genuinely new design exploration,
// unlike tab 2 "Onboarding" which is a live QA harness that just mounts the
// real production screens stacked for comparison. Prototype-only: no changes
// to the real WelcomeModal/ArchetypeSelectionScreen/DeputySelectionScreen/
// HandoverNotesModal/GoalSelectionScreen, no router or store changes.
export function OnboardingRedesignTab() {
  const [stepIndex, setStepIndex] = useState(0)
  const reduced = useReducedMotion()
  const StepComponent = STEP_COMPONENTS[stepIndex]

  return (
    <div
      className="sl-tab-section"
      style={{ padding: '32px 24px 60px', maxWidth: '1000px', margin: '0 auto', width: '100%' }}
    >
      <style>{ONBOARDING_KEYFRAMES}</style>

      <StepProgress steps={STEPS} currentIndex={stepIndex} onStepClick={setStepIndex} />

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '8px',
          margin: '24px 0',
          fontFamily: "'Archivo Narrow', sans-serif",
          fontSize: '11px',
        }}
      >
        <button
          type="button"
          onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
          disabled={stepIndex === 0}
          style={{
            padding: '6px 14px',
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            color: 'var(--text-secondary)',
            cursor: stepIndex === 0 ? 'default' : 'pointer',
            opacity: stepIndex === 0 ? 0.5 : 1,
          }}
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={() => setStepIndex((i) => Math.min(STEPS.length - 1, i + 1))}
          disabled={stepIndex === STEPS.length - 1}
          style={{
            padding: '6px 14px',
            border: '1px solid var(--accent-solid)',
            background: 'var(--surface)',
            color: 'var(--accent-text)',
            cursor: stepIndex === STEPS.length - 1 ? 'default' : 'pointer',
            opacity: stepIndex === STEPS.length - 1 ? 0.5 : 1,
          }}
        >
          Next →
        </button>
      </div>

      <div
        key={stepIndex}
        style={reduced ? undefined : { animation: 'onboarding-step-enter 320ms ease-out' }}
      >
        <StepComponent />
      </div>
    </div>
  )
}
