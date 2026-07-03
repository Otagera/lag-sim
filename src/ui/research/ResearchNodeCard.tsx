import { CheckCircle, Clock, Lock } from 'lucide-react'
import { useEffect } from 'react'
import type { ResearchNode, ResearchNodeStatus } from '../../state/types'

interface DomainColor {
  solid: string
  bg: string
  text: string
}

interface ResearchNodeCardProps {
  x: number
  y: number
  width: number
  height: number
  node: ResearchNode
  status: ResearchNodeStatus
  progress: number | null
  domainColor: DomainColor
  isClickable: boolean
  flash: boolean
  reduced: boolean
  onClick: () => void
  onFlashDone: () => void
}

function borderColorFor(status: ResearchNodeStatus, domainColor: DomainColor): string {
  switch (status) {
    case 'available':
      return domainColor.solid
    case 'commissioned':
      return '#a855f7'
    case 'completed':
      return '#16a34a'
    case 'locked':
      return '#555'
  }
}

function bgColorFor(status: ResearchNodeStatus, domainColor: DomainColor): string {
  switch (status) {
    case 'available':
      return domainColor.bg
    case 'commissioned':
      return '#3b1a6e'
    case 'completed':
      return '#1a3a1a'
    case 'locked':
      return '#1a1a1a'
  }
}

export function ResearchNodeCard({
  x,
  y,
  width,
  height,
  node,
  status,
  progress,
  domainColor,
  isClickable,
  flash,
  reduced,
  onClick,
  onFlashDone,
}: ResearchNodeCardProps) {
  // Reduced motion has no animation event to hook, so the flash needs its own timer-based cleanup.
  useEffect(() => {
    if (flash && reduced) {
      const t = setTimeout(onFlashDone, 900)
      return () => clearTimeout(t)
    }
  }, [flash, reduced, onFlashDone])

  const border = borderColorFor(status, domainColor)
  const bg = bgColorFor(status, domainColor)
  const cx = x + width - 16
  const cy = y + 16
  const r = 10
  const circumference = 2 * Math.PI * r

  const pulseStyle =
    status === 'commissioned' && !reduced
      ? { animation: 'research-pulse 1.8s ease-in-out infinite', color: border }
      : undefined

  const flashStyle =
    flash && !reduced
      ? {
          animation: 'research-lightup 0.9s ease-out 1',
          transformBox: 'fill-box' as const,
          transformOrigin: 'center',
        }
      : undefined

  return (
    <g
      onClick={onClick}
      style={{ cursor: isClickable ? 'pointer' : 'default' }}
      onAnimationEnd={flash && !reduced ? onFlashDone : undefined}
    >
      <g style={flashStyle}>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          rx={6}
          fill={bg}
          stroke={border}
          strokeWidth={status === 'available' ? 2 : flash && reduced ? 3 : 1}
          opacity={status === 'locked' ? 0.5 : 1}
          style={pulseStyle}
        />

        {status === 'commissioned' && progress !== null && (
          <g transform={`rotate(-90 ${cx} ${cy})`}>
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={border}
              strokeWidth={2}
              opacity={0.25}
            />
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={border}
              strokeWidth={2}
              strokeDasharray={`${progress * circumference} ${circumference}`}
              strokeLinecap="round"
            />
          </g>
        )}

        <foreignObject x={x} y={y} width={width} height={height}>
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              padding: '10px 12px',
              boxSizing: 'border-box',
              fontFamily: "'Archivo Narrow', sans-serif",
              overflow: 'hidden',
            }}
            title={node.title}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2px',
              }}
            >
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: domainColor.text,
                }}
              >
                {node.domain.toUpperCase()}
              </span>
              {status === 'completed' && <CheckCircle width={15} height={15} stroke="#16a34a" />}
              {status === 'locked' && <Lock width={15} height={15} stroke="#888" />}
              {status === 'commissioned' && progress === null && (
                <Clock width={15} height={15} stroke="#a855f7" />
              )}
            </div>

            <span
              style={{
                fontSize: '15px',
                fontWeight: 700,
                color: status === 'locked' ? '#aaa' : '#f2f2f2',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                lineHeight: 1.3,
              }}
            >
              {node.title}
            </span>

            {status === 'commissioned' && (
              <span style={{ fontSize: '12px', color: '#c9a4fb', marginTop: '3px' }}>
                {Math.round((progress ?? 0) * 100)}% underway
              </span>
            )}
            {status === 'completed' && (
              <span style={{ fontSize: '12px', color: '#4ade80', marginTop: '3px' }}>Complete</span>
            )}
            {status === 'available' && (
              <span style={{ fontSize: '12px', color: '#d5d5d5', marginTop: '3px' }}>
                ₦{node.cost.toFixed(1)}bn · {node.weeksToComplete}w
              </span>
            )}
            {status === 'locked' && (
              <span style={{ fontSize: '11px', color: '#999', marginTop: '3px' }}>
                {node.prerequisites[0]?.label ?? `₦${node.cost.toFixed(1)}bn needed`}
              </span>
            )}
          </div>
        </foreignObject>
      </g>
    </g>
  )
}
