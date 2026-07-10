interface Props {
  x?: number
  y?: number
  scale?: number
  opacity?: number
}

export function SkyFerry({ x = 0, y = 0, scale = 1, opacity = 1 }: Props) {
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`} opacity={opacity}>
      {/* Wake / bow wave */}
      <path
        d="M-6,22 Q0,24 10,24 Q20,24 26,22"
        fill="none"
        stroke="#cfe6ea"
        strokeWidth="1.5"
        opacity="0.5"
      />
      <path
        d="M-4,25 Q4,27 14,27 Q24,27 30,25"
        fill="none"
        stroke="#cfe6ea"
        strokeWidth="1"
        opacity="0.35"
      />
      {/* Hull */}
      <path
        d="M0,20 L0,16 L4,14 L44,14 L50,16 L58,4 Q60,0 62,0 L68,0 Q70,0 70,4 L66,14 L60,16 L56,20 Z"
        fill="#2B3A3A"
      />
      <path
        d="M0,20 L0,17 L4,15 L44,15 L50,17 L58,5 Q60,1 62,1 L68,1 Q70,1 70,5 L66,15 L60,17 L56,20 Z"
        fill="#3D5353"
      />
      {/* Hull stripe */}
      <rect x="2" y="17" width="52" height="1.5" fill="#E8C94A" />
      {/* Lower deck cabin */}
      <rect x="4" y="8" width="46" height="7" rx="0.5" fill="#E8ECEF" />
      {/* Lower deck windows */}
      {[6, 10, 14, 18, 22, 26, 30, 34, 38, 42].map((x) => (
        <rect key={x} x={x} y="9.5" width="2.5" height="4" rx="0.5" fill="#90A4AE" />
      ))}
      {/* Upper deck cabin */}
      <rect x="6" y="4" width="38" height="5" rx="0.5" fill="#ECEFF1" />
      {/* Upper deck windows */}
      {[8, 12, 16, 20, 24, 28, 32, 36].map((x) => (
        <rect key={x} x={x} y="5" width="2" height="3" rx="0.3" fill="#90A4AE" />
      ))}
      {/* Pilot house / bridge */}
      <rect x="26" y="1" width="12" height="3.5" rx="0.5" fill="#ECEFF1" />
      <rect x="28" y="1.5" width="8" height="2" rx="0.3" fill="#B0BEC5" />
      <rect x="30" y="1.5" width="2" height="2" fill="#90A4AE" />
      <rect x="34" y="1.5" width="2" height="2" fill="#90A4AE" />
      {/* Antenna */}
      <line x1="34" y1="1" x2="34" y2="-1.5" stroke="#546E7A" strokeWidth="0.5" />
      <circle cx="34" cy="-1.5" r="0.5" fill="#D32F2F" />
      {/* Flag pole */}
      <line x1="6" y1="4" x2="6" y2="-2" stroke="#546E7A" strokeWidth="0.5" />
      {/* Nigerian flag */}
      <rect x="5.5" y="-1.5" width="4" height="2.5" fill="#008751" />
      <rect x="7.5" y="-1.5" width="1" height="2.5" fill="white" />
    </g>
  )
}
