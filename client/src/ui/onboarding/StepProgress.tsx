export interface OnboardingStep {
  id: string
  label: string
}

interface StepProgressProps {
  steps: OnboardingStep[]
  currentIndex: number
  onStepClick?: (index: number) => void
}

interface StepDotProps {
  step: OnboardingStep
  index: number
  isDone: boolean
  isCurrent: boolean
  clickable: boolean
  onStepClick?: (index: number) => void
}

function StepDot({ step, index, isDone, isCurrent, clickable, onStepClick }: StepDotProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
      <button
        type="button"
        onClick={() => onStepClick?.(index)}
        disabled={!clickable}
        aria-current={isCurrent ? 'step' : undefined}
        style={{
          width: '26px',
          height: '26px',
          borderRadius: '50%',
          border: `1.5px solid ${isDone || isCurrent ? 'var(--accent-solid)' : 'var(--border)'}`,
          background: isDone
            ? 'var(--accent-solid)'
            : isCurrent
              ? 'var(--accent-bg-subtle)'
              : 'var(--surface)',
          color: isDone
            ? 'var(--accent-on-solid)'
            : isCurrent
              ? 'var(--accent-text)'
              : 'var(--text-secondary)',
          fontFamily: "'Archivo Narrow', sans-serif",
          fontSize: '11px',
          fontWeight: 700,
          cursor: clickable ? 'pointer' : 'default',
          flexShrink: 0,
        }}
      >
        {isDone ? '✓' : index + 1}
      </button>
      <span
        className="label-caps"
        style={{
          fontSize: '9px',
          color: isCurrent ? 'var(--accent-text)' : 'var(--text-secondary)',
          whiteSpace: 'nowrap',
        }}
      >
        {step.label}
      </span>
    </div>
  )
}

// A straight, numbered stepper — deliberately not the curved "road" motif
// used for the Goal Journey (src/ui/goals/journeyLayout.ts). The two read as
// different journeys (onboarding is a five-step form, the term goal is a
// multi-week campaign), so borrowing the same visual language would blur
// that distinction rather than reinforce it.
export function StepProgress({ steps, currentIndex, onStepClick }: StepProgressProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        width: '100%',
        maxWidth: '640px',
        margin: '0 auto',
      }}
    >
      {steps.map((step, i) => {
        const isDone = i < currentIndex
        const isCurrent = i === currentIndex
        const isLast = i === steps.length - 1
        return (
          <div
            key={step.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              flex: isLast ? '0 0 auto' : '1 1 auto',
            }}
          >
            <StepDot
              step={step}
              index={i}
              isDone={isDone}
              isCurrent={isCurrent}
              clickable={Boolean(onStepClick) && i <= currentIndex}
              onStepClick={onStepClick}
            />
            {!isLast && (
              <div
                style={{
                  flex: 1,
                  height: '1.5px',
                  marginBottom: '18px',
                  background: isDone ? 'var(--accent-solid)' : 'var(--border)',
                  transition: 'background var(--dur-norm) ease',
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
