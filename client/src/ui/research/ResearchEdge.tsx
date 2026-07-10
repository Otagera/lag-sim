import type { ResearchNodeStatus } from '../../state/types'

interface ResearchEdgeProps {
  d: string
  color: string
  targetStatus: ResearchNodeStatus
  progress: number | null
  reduced: boolean
  arrowMarkerId: string
}

export function ResearchEdge({
  d,
  color,
  targetStatus,
  progress,
  reduced,
  arrowMarkerId,
}: ResearchEdgeProps) {
  const baseWidth = 2
  const fillWidth = 2.5

  if (targetStatus === 'completed') {
    return (
      <path
        d={d}
        pathLength={100}
        fill="none"
        stroke={color}
        strokeWidth={fillWidth}
        opacity={0.9}
        markerEnd={`url(#${arrowMarkerId})`}
      />
    )
  }

  return (
    <g>
      {/* Base line — always visible, dim; carries the arrowhead so direction
          reads clearly regardless of in-flight/locked state. Cross-domain
          links are a smooth curve (see buildCrossDomainPath in the parent)
          rather than a dashed diagonal, so the curve shape itself — not a
          dash pattern — is what marks it as a cross-domain dependency. */}
      <path
        d={d}
        pathLength={100}
        fill="none"
        stroke={color}
        strokeWidth={baseWidth}
        strokeLinecap="round"
        opacity={0.5}
        markerEnd={`url(#${arrowMarkerId})`}
      />

      {progress !== null && (
        <>
          {/* Flowing dash overlay — "alive" cue while in-flight */}
          {!reduced && (
            <path
              d={d}
              pathLength={100}
              fill="none"
              stroke={color}
              strokeWidth={baseWidth}
              strokeDasharray="4 3"
              opacity={0.8}
              style={{ animation: 'research-flow 1.4s linear infinite' }}
            />
          )}

          {/* Progress-fill overlay — value-driven, no animation needed */}
          <path
            d={d}
            pathLength={100}
            fill="none"
            stroke={color}
            strokeWidth={fillWidth}
            strokeDasharray={`${progress * 100} 100`}
            opacity={1}
          />
        </>
      )}
    </g>
  )
}
