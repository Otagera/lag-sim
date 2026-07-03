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
    () => anchors.slice(1).map((a, i) => buildJourneySegment(anchors[i], a)),
    [anchors],
  )

  const targetProgress = goal.targets.map((_, i) =>
    resolveTargetProgress(goal, i, overrides, baseState),
  )
  const blockingIndex = resolveBlockingIndex(goal, overrides, baseState)
  const met = blockingIndex === null

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
    targetProgress.forEach((p, i) => {
      const isMet = p >= 1
      if (isMet && !prevMet.current[i]) newlyCompleted.push(i)
      prevMet.current[i] = isMet
    })
    if (newlyCompleted.length > 0) {
      setJustCompleted((s) => new Set([...s, ...newlyCompleted]))
    }
  }, [goal, targetProgress])

  function clearFlash(index: number) {
    setJustCompleted((s) => {
      if (!s.has(index)) return s
      const next = new Set(s)
      next.delete(index)
      return next
    })
  }

  const traveler = travelerPosition(segments, targetProgress)

  const blockingLabel = blockingIndex !== null ? goal.targets[blockingIndex].label : null
  const blockingText =
    blockingIndex !== null ? goal.targets[blockingIndex].blockingText(baseState) : null

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
        {/* Road */}
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

        {/* Lane markers */}
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

        {/* Start anchor */}
        <circle cx={anchors[0].x} cy={anchors[0].y} r={6} fill="#888" />

        {/* Waypoints */}
        {anchors.slice(1).map((a, i) => (
          <GoalWaypoint
            key={goal.targets[i].label}
            x={a.x}
            y={a.y}
            label={goal.targets[i].label}
            progress={targetProgress[i]}
            isBlocking={blockingIndex === i}
            reduced={reduced}
            justCompleted={justCompleted.has(i)}
            onFlashDone={() => clearFlash(i)}
          />
        ))}

        {/* Traveler */}
        <g
          transform={`translate(${traveler.point.x}, ${traveler.point.y}) rotate(${traveler.angleDeg})`}
          style={{ transition: reduced ? 'none' : 'transform 0.6s ease' }}
        >
          <path d="M0,-12 L8,6 L0,2 L-8,6 Z" fill="#1A9B8E" stroke="#0f2f2b" strokeWidth={1} />
        </g>
      </svg>

      {/* What's next + what advances you */}
      <div
        style={{
          marginTop: '12px',
          padding: '12px 14px',
          background: '#1c1c1c',
          border: '1px solid #333',
          borderRadius: '4px',
          fontFamily: "'Archivo Narrow', sans-serif",
        }}
      >
        {met ? (
          <p style={{ fontSize: '13px', color: '#4ade80', fontWeight: 700, margin: 0 }}>
            On track — hold this to term end
          </p>
        ) : (
          <p style={{ fontSize: '13px', color: '#eab308', fontWeight: 700, margin: 0 }}>
            Next: {blockingLabel} — {blockingText}
          </p>
        )}

        {!met && (projectPills.length > 0 || researchPills.length > 0) && (
          <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #333' }}>
            <p style={{ fontSize: '11px', color: '#999', margin: '0 0 6px' }}>
              What advances this — especially toward "{blockingLabel}"
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {projectPills.map((cat) => (
                <span
                  key={cat}
                  style={{
                    fontSize: '11px',
                    padding: '3px 8px',
                    background: '#233a37',
                    color: '#7fd6c8',
                    border: '1px solid #1A9B8E',
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
                    background: '#262626',
                    color: '#bbb',
                    border: '1px solid #444',
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
    </div>
  )
}
