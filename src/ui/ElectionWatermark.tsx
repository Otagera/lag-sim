import { useGameStore } from '../state/gameStore'

export function ElectionWatermark() {
  const inCampaignMode = useGameStore((s) => s.inCampaignMode)
  if (!inCampaignMode) return null

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
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: `${(i % 6) * 18 + 5}%`,
            left: `${(i % 2 === 0 ? 5 : 55)}%`,
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
          ELECTION 2027
        </div>
      ))}
    </div>
  )
}
