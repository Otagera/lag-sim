type DeskStyle = 'modern' | 'traditional' | 'simple'

interface Props {
  x?: number
  y?: number
  width?: number
  height?: number
  deskStyle?: DeskStyle
}

export function DeskSurface({ x = 0, y = 0, width = 500, height = 200, deskStyle = 'modern' }: Props) {
  const top = y
  const left = x
  const right = x + width
  const bottom = y + height

  if (deskStyle === 'modern') {
    return (
      <g>
        {/* Desk top - glass/metal */}
        <path d={`M${left},${top} L${right},${top} L${right},${bottom} L${left},${bottom} Z`} fill="#e8e4e0" opacity="0.95" />
        {/* Glass reflection */}
        <path d={`M${left},${top} L${right},${top} L${right},${top + 12} L${left},${top + 12} Z`} fill="white" opacity="0.15" />
        {/* Metal edge trim */}
        <rect x={left} y={top} width={width} height={3} rx={1} fill="#b0b0b0" />
        <rect x={left} y={bottom - 3} width={width} height={3} rx={1} fill="#b0b0b0" />
        {/* Desk legs */}
        <rect x={left + 10} y={bottom} width={6} height={40} rx={2} fill="#999" />
        <rect x={right - 16} y={bottom} width={6} height={40} rx={2} fill="#999" />
        {/* Leg feet */}
        <rect x={left + 6} y={bottom + 36} width={14} height={4} rx={2} fill="#888" />
        <rect x={right - 20} y={bottom + 36} width={14} height={4} rx={2} fill="#888" />
        {/* Subtle grain */}
        <path d={`M${left + 20},${top + 30} Q${left + width / 2},${top + 35} ${right - 20},${top + 30}`} fill="none" stroke="#d0ccc8" strokeWidth="0.5" opacity="0.5" />
        <path d={`M${left + 40},${top + 80} Q${left + width / 2},${top + 85} ${right - 40},${top + 80}`} fill="none" stroke="#d0ccc8" strokeWidth="0.5" opacity="0.5" />
      </g>
    )
  }

  if (deskStyle === 'traditional') {
    return (
      <g>
        {/* Desk top - dark wood */}
        <path d={`M${left},${top} L${right},${top} L${right},${bottom} L${left},${bottom} Z`} fill="#5c3a1e" />
        {/* Wood grain highlights */}
        <path d={`M${left + 20},${top + 10} Q${left + width * 0.3},${top + 16} ${left + width * 0.6},${top + 8} Q${left + width * 0.8},${top + 14} ${right - 20},${top + 10}`} fill="none" stroke="#7a5230" strokeWidth="0.6" opacity="0.4" />
        <path d={`M${left + 40},${top + 40} Q${left + width * 0.4},${top + 46} ${left + width * 0.7},${top + 38} Q${right - 60},${top + 44} ${right - 40},${top + 40}`} fill="none" stroke="#7a5230" strokeWidth="0.6" opacity="0.3" />
        <path d={`M${left + 10},${top + 70} Q${left + width * 0.25},${top + 74} ${left + width * 0.5},${top + 68} Q${left + width * 0.75},${top + 72} ${right - 10},${top + 70}`} fill="none" stroke="#7a5230" strokeWidth="0.6" opacity="0.35" />
        <path d={`M${left + 30},${top + 100} Q${left + width * 0.35},${top + 106} ${left + width * 0.65},${top + 98} Q${right - 50},${top + 104} ${right - 30},${top + 100}`} fill="none" stroke="#7a5230" strokeWidth="0.6" opacity="0.3" />
        {/* Ornate edge top */}
        <path d={`M${left - 4},${top - 2} L${right + 4},${top - 2} Q${right + 8},${top + 3} ${right + 4},${top + 6} L${left - 4},${top + 6} Q${left - 8},${top + 3} ${left - 4},${top - 2} Z`} fill="#4a2e14" />
        {/* Edge highlight */}
        <rect x={left} y={top} width={width} height={2} rx={1} fill="#7a5230" opacity="0.6" />
        {/* Front panel with decorative molding */}
        <rect x={left} y={bottom - 40} width={width} height={40} rx={2} fill="#4a2e14" />
        <rect x={left + 4} y={bottom - 36} width={width - 8} height={32} rx={1} fill="#3d2210" />
        {/* Molding lines */}
        <line x1={left + 8} y1={bottom - 28} x2={right - 8} y2={bottom - 28} stroke="#5c3a1e" strokeWidth="1" />
        <line x1={left + 8} y1={bottom - 16} x2={right - 8} y2={bottom - 16} stroke="#5c3a1e" strokeWidth="1" />
        {/* Center drawer */}
        <rect x={left + width / 2 - 30} y={bottom - 34} width={60} height={28} rx={2} fill="#3d2210" stroke="#5c3a1e" strokeWidth="0.8" />
        <circle cx={left + width / 2} cy={bottom - 20} r={2.5} fill="#b8860b" />
        {/* Ornate corner details */}
        <path d={`M${left + 8},${bottom - 4} Q${left + 12},${bottom - 10} ${left + 8},${bottom - 14}`} fill="none" stroke="#7a5230" strokeWidth="0.8" opacity="0.5" />
        <path d={`M${right - 8},${bottom - 4} Q${right - 12},${bottom - 10} ${right - 8},${bottom - 14}`} fill="none" stroke="#7a5230" strokeWidth="0.8" opacity="0.5" />
        {/* Desk legs - turned wood */}
        <path d={`M${left + 12},${bottom} L${left + 8},${bottom + 25} Q${left + 6},${bottom + 30} ${left + 10},${bottom + 35} L${left + 16},${bottom + 35} Q${left + 20},${bottom + 30} ${left + 18},${bottom + 25} L${left + 14},${bottom} Z`} fill="#4a2e14" />
        <path d={`M${right - 12},${bottom} L${right - 16},${bottom + 25} Q${right - 18},${bottom + 30} ${right - 14},${bottom + 35} L${right - 8},${bottom + 35} Q${right - 4},${bottom + 30} ${right - 6},${bottom + 25} L${right - 10},${bottom} Z`} fill="#4a2e14" />
        {/* Feet */}
        <rect x={left + 6} y={bottom + 32} width={14} height={4} rx={2} fill="#3d2210" />
        <rect x={right - 20} y={bottom + 32} width={14} height={4} rx={2} fill="#3d2210" />
      </g>
    )
  }

  /* simple */
  return (
    <g>
      {/* Flat surface */}
      <path d={`M${left},${top} L${right},${top} L${right},${bottom} L${left},${bottom} Z`} fill="#d4cfc8" />
      {/* Edge shadow */}
      <line x1={left} y1={top} x2={right} y2={top} stroke="#b8b3ac" strokeWidth="1.5" />
      <line x1={left} y1={bottom} x2={right} y2={bottom} stroke="#b8b3ac" strokeWidth="1.5" />
      {/* Subtle highlight */}
      <path d={`M${left + 10},${top + 4} L${right - 10},${top + 4}`} fill="none" stroke="white" strokeWidth="0.8" opacity="0.3" />
    </g>
  )
}
