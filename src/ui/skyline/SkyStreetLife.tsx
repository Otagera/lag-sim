interface Props {
  x?: number
  y?: number
  scale?: number
  opacity?: number
}

/**
 * Promenade market stalls — two faded umbrellas, crates, a goods table.
 * Box: 74w × 38h, ground at y = 38.
 */
export function SkyStalls({ x = 0, y = 0, scale = 1, opacity = 1 }: Props) {
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`} opacity={opacity}>
      {/* umbrella 1 — faded red/white */}
      <line x1="15" y1="38" x2="15" y2="13" stroke="#6E5A44" strokeWidth="1.2" />
      <path
        d="M3 15 Q15 2.5 27 15 Q24 11.6 21 15 Q18 11.6 15 15 Q12 11.6 9 15 Q6 11.6 3 15 Z"
        fill="#C25548"
      />
      <path
        d="M9 15 Q12 11.6 15 15 Q13.4 8 15 4.2 Q10.8 8.4 9 15 Z M21 15 Q18 11.6 15 15 Q16.6 8 15 4.2 Q19.2 8.4 21 15 Z"
        fill="#EFE7D2"
        opacity="0.9"
      />
      {/* crates */}
      <rect x="4" y="30" width="9" height="4" fill="#A9835E" />
      <rect x="5" y="34" width="9" height="4" fill="#8A6A48" />
      <path d="M4 32 L13 32 M5 36 L14 36" stroke="#00000030" strokeWidth="0.6" />
      {/* umbrella 2 — teal/white */}
      <line x1="53" y1="38" x2="53" y2="14" stroke="#6E5A44" strokeWidth="1.2" />
      <path
        d="M41 16 Q53 3.5 65 16 Q62 12.6 59 16 Q56 12.6 53 16 Q50 12.6 47 16 Q44 12.6 41 16 Z"
        fill="#3D8A82"
      />
      <path
        d="M47 16 Q50 12.6 53 16 Q51.4 9 53 5.2 Q48.8 9.4 47 16 Z M59 16 Q56 12.6 53 16 Q54.6 9 53 5.2 Q57.2 9.4 59 16 Z"
        fill="#EFE7D2"
        opacity="0.9"
      />
      {/* goods table with oranges */}
      <rect x="44" y="30.5" width="18" height="2.4" fill="#8A6A48" />
      <path d="M46 33 L45.4 38 M60 33 L60.6 38" stroke="#6E5A44" strokeWidth="1" />
      {[47.5, 50.5, 53.5, 56.5].map((ox) => (
        <circle key={ox} cx={ox} cy="29.4" r="1.3" fill="#D98E32" />
      ))}
      <circle cx="49" cy="27.8" r="1.3" fill="#D98E32" />
      <circle cx="55" cy="27.8" r="1.3" fill="#D98E32" />
    </g>
  )
}

/**
 * Hawker with a head-tray, mid-stride. Box: 13w × 24h, feet at y = 24.
 */
export function SkyHawker({ x = 0, y = 0, scale = 1, opacity = 1 }: Props) {
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`} opacity={opacity}>
      {/* tray + goods */}
      <ellipse cx="6" cy="2.8" rx="5" ry="1.4" fill="#C9A25E" />
      <circle cx="3.6" cy="1.6" r="1.1" fill="#D98E32" />
      <circle cx="6" cy="1.2" r="1.1" fill="#C25548" />
      <circle cx="8.4" cy="1.6" r="1.1" fill="#EFE7D2" />
      {/* head + steadying arm */}
      <circle cx="6" cy="5.4" r="1.9" fill="#4A3226" />
      <path
        d="M8.6 9.5 Q10 6.5 9.4 3.6"
        stroke="#4A3226"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
      />
      {/* blouse */}
      <path d="M3.6 7.6 Q6 6.9 8.4 7.6 L9 13.5 L3 13.5 Z" fill="#3D8A82" />
      {/* wrapper skirt */}
      <path d="M3 13.5 L9 13.5 L8.3 22.5 L3.7 22.5 Z" fill="#8A4A6A" />
      <path
        d="M3.4 16.5 L8.7 16.5 M3.2 19.5 L8.5 19.5"
        stroke="#6E3A56"
        strokeWidth="0.6"
        opacity="0.8"
      />
      {/* stride */}
      <path
        d="M4.6 22.5 L3.8 24 M7.4 22.5 L8.4 24"
        stroke="#4A3226"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </g>
  )
}

/**
 * LASTMA officer — yellow shirt, wine trousers, cap, one arm out directing
 * traffic. Box: 12w × 18h, feet at y = 18.
 */
export function SkyLastma({ x = 0, y = 0, scale = 1, opacity = 1 }: Props) {
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`} opacity={opacity}>
      {/* directing arm */}
      <path d="M6.8 6.6 L11.5 5.6" stroke="#E5C23A" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="11.9" cy="5.5" r="0.7" fill="#4A3226" />
      {/* head + cap */}
      <circle cx="5" cy="3.4" r="1.8" fill="#4A3226" />
      <path d="M3 2.6 Q5 0.6 7 2.6 L7.6 3.2 L2.9 3.2 Z" fill="#6E2A3A" />
      {/* yellow shirt */}
      <path d="M3 5.6 Q5 5 7 5.6 L7.5 11 L2.5 11 Z" fill="#E5C23A" />
      {/* wine trousers */}
      <path
        d="M2.9 11 L7.1 11 L6.8 17.4 L5.6 17.4 L5.2 12.8 L4.6 17.4 L3.4 17.4 Z"
        fill="#6E2A3A"
      />
      <path
        d="M3.4 17.4 L4.8 18 M5.6 17.4 L7 18"
        stroke="#2A2220"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </g>
  )
}

/**
 * Cattle egrets in a loose V. Box: ~56w × 16h.
 */
export function SkyEgrets({ x = 0, y = 0, scale = 1, opacity = 1 }: Props) {
  const birds: [number, number, number][] = [
    [0, 0, 1],
    [14, 6, 0.9],
    [28, 2, 1.05],
    [44, 9, 0.85],
    [20, 13, 0.75],
  ]
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`} opacity={opacity}>
      {birds.map(([bx, by, bs]) => (
        <g key={`${bx}-${by}`} transform={`translate(${bx},${by}) scale(${bs})`}>
          <path
            d="M-4 0 Q-1.2 -2.8 0 0 Q1.2 -2.8 4 0"
            fill="none"
            stroke="#FDFCF7"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
          <ellipse cx="0" cy="0.3" rx="1.3" ry="0.7" fill="#F0EDE2" />
        </g>
      ))}
    </g>
  )
}
