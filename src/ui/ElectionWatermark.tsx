import { useGameStore } from '../state/gameStore'
import { electionYear } from '../utils/calendar'

export function ElectionWatermark() {
  const inCampaignMode = useGameStore((s) => s.inCampaignMode)
  const currentTerm = useGameStore((s) => s.currentTerm)
  if (!inCampaignMode) return null

  const year = electionYear(currentTerm)

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {[
        { top: '5%', left: '5%' },
        { top: '23%', left: '55%' },
        { top: '41%', left: '5%' },
        { top: '59%', left: '55%' },
        { top: '77%', left: '5%' },
        { top: '95%', left: '55%' },
        { top: '14%', left: '30%' },
        { top: '32%', left: '80%' },
        { top: '50%', left: '30%' },
        { top: '68%', left: '80%' },
        { top: '86%', left: '30%' },
        { top: '104%', left: '80%' },
      ].map((pos) => (
        <div
          key={`watermark-${pos.top}-${pos.left}`}
          style={{
            position: 'absolute',
            top: pos.top,
            left: pos.left,
            transform: 'rotate(-22deg)',
            fontSize: '13px',
            fontWeight: 700,
            fontFamily: "'Archivo Narrow', sans-serif",
            letterSpacing: '0.08em',
            color: 'rgba(0, 0, 0, 0.035)',
            whiteSpace: 'nowrap',
            userSelect: 'none',
            textTransform: 'uppercase',
          }}
        >
          ELECTION {year}
        </div>
      ))}
    </div>
  )
}
