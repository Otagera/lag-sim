import { useGameStore } from '../state/gameStore'
import { electionYear } from '../utils/calendar'
import { ElectoralMark } from './seals/ElectoralMark'
import { WatermarkLayer } from './seals/WatermarkLayer'

function ElectionYearTag({ year }: { year: number }) {
  return (
    <span
      style={{
        fontSize: '13px',
        fontWeight: 700,
        fontFamily: "'Archivo Narrow', sans-serif",
        letterSpacing: '0.08em',
        color: 'var(--text)',
        whiteSpace: 'nowrap',
        userSelect: 'none',
        textTransform: 'uppercase',
      }}
    >
      ELECTION {year}
    </span>
  )
}

// Built on the WatermarkLayer/ElectoralMark system prototyped in
// src/ui/seals/ (Style Lab "Seals" tab) — replaces the old hand-rolled
// 12-position absolute grid and its raw rgba(0,0,0,...) color (a Coastal
// Lagos kill-list violation) with the tile-ring layout (center reserved for
// the LBIC electoral mark, "ELECTION {year}" tiling the ring around it) and
// a token-driven color.
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
      <WatermarkLayer opacity={0.035} rotationDeg={-22} tile tileCount={8}>
        <ElectionYearTag year={year} />
      </WatermarkLayer>
      <WatermarkLayer opacity={0.05} rotationDeg={-8} placement="center" zIndex={2}>
        <ElectoralMark size={260} />
      </WatermarkLayer>
    </div>
  )
}
