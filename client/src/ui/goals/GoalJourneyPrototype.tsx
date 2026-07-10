import { useEffect, useMemo, useRef, useState } from 'react'
import type { Goal } from '../../data/goals'
import { getGoalRelevance } from '../../data/goals'
import type { GameState } from '../../state/types'
import { useReducedMotion } from '../design/useReducedMotion'
import { GoalWaypoint } from './GoalWaypoint'
import {
  buildJourneySegment,
  computeAnchors,
  JOURNEY_VIEWBOX,
  sampleLaneMarkers,
  segmentPath,
  travelerPosition,
} from './journeyLayout'
import { GOAL_KEYFRAMES } from './keyframes'
import {
  type GoalProgressOverrides,
  resolveBlockingIndex,
  resolveTargetProgress,
} from './mockGoalState'

const CATEGORY_LABELS: Record<string, string> = {
  transport: 'Transport',
  power: 'Power',
  water: 'Water',
  health: 'Health',
  education: 'Education',
  security: 'Security',
  housing: 'Housing',
  environment: 'Environment',
}

export interface GoalJourneyPrototypeProps {
  goal: Goal
  overrides: GoalProgressOverrides
  baseState: GameState
  forceReducedMotion?: boolean
}

type JourneySvgProps = {
  goal: Goal
  anchors: ReturnType<typeof computeAnchors>
  segments: ReturnType<typeof buildJourneySegment>[]
  targetProgress: number[]
  blockingIndex: number | null
  justCompleted: Set<number>
  reduced: boolean
  traveler: ReturnType<typeof travelerPosition>
  clearFlash: (index: number) => void
}

function JourneySvg({
  goal,
  anchors,
  segments,
  targetProgress,
  blockingIndex,
  justCompleted,
  reduced,
  traveler,
  clearFlash,
}: JourneySvgProps) {
  return (
    <>
      {segments.map((seg) => (
        <path
          key={`road-${seg.p0.x}-${seg.p0.y}-${seg.p3.x}-${seg.p3.y}`}
          d={segmentPath(seg)}
          fill="none"
          stroke="#37494a"
          strokeWidth={16}
          strokeLinecap="round"
        />
      ))}
      {segments.map((seg) => (
        <path
          key={`curb-${seg.p0.x}-${seg.p0.y}-${seg.p3.x}-${seg.p3.y}`}
          d={segmentPath(seg)}
          fill="none"
          stroke="#26332f"
          strokeWidth={18}
          strokeLinecap="round"
          opacity={0.5}
          style={{ mixBlendMode: 'multiply' }}
        />
      ))}
      {segments.map((seg) =>
        sampleLaneMarkers(seg, 4).map((p) => (
          <rect
            key={`dash-${p.x}-${p.y}`}
            x={p.x - 5}
            y={p.y - 1.5}
            width={10}
            height={3}
            rx={1}
            fill="#e8c94a"
            opacity={0.75}
          />
        )),
      )}
      <circle cx={anchors[0].x} cy={anchors[0].y} r={6} fill="#888" />
      {anchors.slice(1).map((anchor, index) => (
        <GoalWaypoint
          key={goal.targets[index].label}
          x={anchor.x}
          y={anchor.y}
          label={goal.targets[index].label}
          progress={targetProgress[index]}
          isBlocking={blockingIndex === index}
          reduced={reduced}
          justCompleted={justCompleted.has(index)}
          onFlashDone={() => clearFlash(index)}
        />
      ))}
      <g
        transform={`translate(${traveler.point.x}, ${traveler.point.y}) rotate(${traveler.angleDeg})`}
        style={{ transition: reduced ? 'none' : 'transform 0.6s ease' }}
      >
        <path d="M0,-12 L8,6 L0,2 L-8,6 Z" fill="#1A9B8E" stroke="#0f2f2b" strokeWidth={1} />
      </g>
    </>
  )
}

type GoalNextStepsProps = {
  met: boolean
  blockingLabel: string | null
  blockingText: string | null
  projectPills: string[]
  researchPills: string[]
}

function GoalNextSteps({
  met,
  blockingLabel,
  blockingText,
  projectPills,
  researchPills,
}: GoalNextStepsProps) {
  return (
    <div
      style={{
        marginTop: '12px',
        padding: '12px 14px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        fontFamily: "'Archivo Narrow', sans-serif",
      }}
    >
      {met ? (
        <p style={{ fontSize: '13px', color: 'var(--success-11)', fontWeight: 700, margin: 0 }}>
          On track — hold this to term end
        </p>
      ) : (
        <p style={{ fontSize: '13px', color: 'var(--warning-11)', fontWeight: 700, margin: 0 }}>
          Next: {blockingLabel} — {blockingText}
        </p>
      )}

      {!met && (projectPills.length > 0 || researchPills.length > 0) && (
        <div
          style={{
            marginTop: '10px',
            paddingTop: '10px',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '0 0 6px' }}>
            What advances this — especially toward "{blockingLabel}"
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {projectPills.map((cat) => (
              <span
                key={cat}
                style={{
                  fontSize: '11px',
                  padding: '3px 8px',
                  background: 'var(--accent-bg-subtle)',
                  color: 'var(--accent-text)',
                  border: '1px solid var(--accent-solid)',
                  borderRadius: '2px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {CATEGORY_LABELS[cat] ?? cat}
              </span>
            ))}
            {researchPills.map((domain) => (
              <span
                key={domain}
                style={{
                  fontSize: '11px',
                  padding: '3px 8px',
                  background: 'var(--surface-2)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '2px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {domain}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function useCompletedFlashes(goal: Goal, targetProgress: number[]) {
  const prevMet = useRef<boolean[]>(goal.targets.map(() => false))
  const prevGoalId = useRef(goal.id)
  const [justCompleted, setJustCompleted] = useState<Set<number>>(new Set())

  useEffect(() => {
    // Switching to a goal with a different target count invalidates the
    // previous per-index tracking — start that goal's baseline fresh.
    if (prevGoalId.current !== goal.id) {
      prevGoalId.current = goal.id
      prevMet.current = goal.targets.map(() => false)
      setJustCompleted(new Set())
    }

    const newlyCompleted: number[] = []
    targetProgress.forEach((progress, index) => {
      const isMet = progress >= 1
      if (isMet && !prevMet.current[index]) newlyCompleted.push(index)
      prevMet.current[index] = isMet
    })
    if (newlyCompleted.length > 0) {
      setJustCompleted((current) => new Set([...current, ...newlyCompleted]))
    }
  }, [goal, targetProgress])

  function clearFlash(index: number) {
    setJustCompleted((current) => {
      if (!current.has(index)) return current
      const next = new Set(current)
      next.delete(index)
      return next
    })
  }

  return { justCompleted, clearFlash }
}

export function GoalJourneyPrototype({
  goal,
  overrides,
  baseState,
  forceReducedMotion,
}: GoalJourneyPrototypeProps) {
  const osReduced = useReducedMotion()
  const reduced = Boolean(forceReducedMotion) || osReduced
  const anchors = useMemo(() => computeAnchors(goal.targets.length), [goal])
  const segments = useMemo(
    () => anchors.slice(1).map((anchor, index) => buildJourneySegment(anchors[index], anchor)),
    [anchors],
  )
  const targetProgress = goal.targets.map((_, i) =>
    resolveTargetProgress(goal, i, overrides, baseState),
  )
  const blockingIndex = resolveBlockingIndex(goal, overrides, baseState)
  const met = blockingIndex === null
  const { justCompleted, clearFlash } = useCompletedFlashes(goal, targetProgress)
  const traveler = travelerPosition(segments, targetProgress)
  const blockingTarget = blockingIndex !== null ? goal.targets[blockingIndex] : null
  const blockingLabel = blockingTarget?.label ?? null
  const blockingText = blockingTarget?.blockingText(baseState) ?? null
  const relevance = getGoalRelevance(goal.id)
  const projectPills = relevance?.projectCategories ?? []
  const researchPills = relevance?.researchDomains ?? []
  const { width: vbW, height: vbH } = JOURNEY_VIEWBOX

  return (
    <div style={{ width: '100%' }}>
      <style>{GOAL_KEYFRAMES}</style>
      <svg
        width="100%"
        height={vbH}
        viewBox={`0 0 ${vbW} ${vbH}`}
        role="img"
        aria-label={`${goal.title} journey`}
      >
        <JourneySvg
          goal={goal}
          anchors={anchors}
          segments={segments}
          targetProgress={targetProgress}
          blockingIndex={blockingIndex}
          justCompleted={justCompleted}
          reduced={reduced}
          traveler={traveler}
          clearFlash={clearFlash}
        />
      </svg>
      <GoalNextSteps
        met={met}
        blockingLabel={blockingLabel}
        blockingText={blockingText}
        projectPills={projectPills}
        researchPills={researchPills}
      />
    </div>
  )
}
