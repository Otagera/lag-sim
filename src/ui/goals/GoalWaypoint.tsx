import { CheckCircle, Flag } from 'lucide-react'
import { useEffect } from 'react'

interface GoalWaypointProps {
  x: number
  y: number
  label: string
  progress: number
  isBlocking: boolean
  reduced: boolean
  justCompleted: boolean
  onFlashDone: () => void
}

const TRACK_COLOR = 'var(--border-strong, var(--border))'
const PROGRESS_COLOR = '#1A9B8E'
const MET_COLOR = '#16a34a'
const BLOCKING_COLOR = '#eab308'
const LABEL_COLOR = 'var(--text-secondary)'
const R = 14
const CIRCUMFERENCE = 2 * Math.PI * R

export function GoalWaypoint({
  x,
  y,
  label,
  progress,
  isBlocking,
  reduced,
  justCompleted,
  onFlashDone,
}: GoalWaypointProps) {
  useEffect(() => {
    if (justCompleted && reduced) {
      const t = setTimeout(onFlashDone, 900)
      return () => clearTimeout(t)
    }
  }, [justCompleted, reduced, onFlashDone])

  const met = progress >= 1
  const fill = met ? MET_COLOR : progress > 0 ? '#2a4a46' : '#2a2a2a'
  const ringColor = met ? MET_COLOR : PROGRESS_COLOR

  const pulseStyle =
    isBlocking && !reduced
      ? { animation: 'goal-blocking-pulse 2s ease-in-out infinite', color: BLOCKING_COLOR }
      : undefined
  const flashStyle =
    justCompleted && !reduced
      ? {
          animation: 'goal-lightup 0.9s ease-out 1',
          transformBox: 'fill-box' as const,
          transformOrigin: 'center',
        }
      : undefined

  return (
    <g onAnimationEnd={justCompleted && !reduced ? onFlashDone : undefined}>
      {/* Full label on hover/focus over the dot or the (often-truncated)
          text below it — waypoint labels routinely run longer than the
          ~120px of horizontal room between neighboring stops. */}
      <title>{label}</title>
      {isBlocking && (
        <g transform={`translate(${x}, ${y - R - 22})`} style={pulseStyle} color={BLOCKING_COLOR}>
          <Flag width={16} height={16} fill={BLOCKING_COLOR} stroke={BLOCKING_COLOR} />
        </g>
      )}

      <g style={flashStyle}>
        {isBlocking && (
          <circle
            cx={x}
            cy={y}
            r={R + 5}
            fill="none"
            stroke={BLOCKING_COLOR}
            strokeWidth={2}
            opacity={0.6}
            style={pulseStyle}
          />
        )}

        <circle
          cx={x}
          cy={y}
          r={R}
          fill="none"
          stroke={TRACK_COLOR}
          strokeWidth={3}
          opacity={0.4}
        />
        <circle
          cx={x}
          cy={y}
          r={R}
          fill="none"
          stroke={ringColor}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={`${Math.max(0, Math.min(1, progress)) * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
          transform={`rotate(-90 ${x} ${y})`}
        />
        <circle cx={x} cy={y} r={R - 5} fill={fill} />
        {met && (
          <g transform={`translate(${x - 8}, ${y - 8})`}>
            <CheckCircle width={16} height={16} stroke={MET_COLOR} />
          </g>
        )}
      </g>

      <text
        x={x}
        y={y + R + 18}
        textAnchor="middle"
        fontFamily="'Archivo Narrow', sans-serif"
        fontSize="12"
        fontWeight={isBlocking ? 700 : 500}
        fill={isBlocking ? BLOCKING_COLOR : LABEL_COLOR}
      >
        {label.length > 28 ? `${label.slice(0, 27)}…` : label}
      </text>
    </g>
  )
}
