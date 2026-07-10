interface Props {
  x?: number
  y?: number
  scale?: number
  opacity?: number
}

/**
 * Lekki-Ikoyi Link Bridge — simplified from references/lekki-link-bridge.svg
 * (redrawn, not traced). The identity: a single leaning white pylon with an
 * asymmetric fan of cables over a gently arched deck.
 * Box: 300w × 84h, deck surface at y ≈ 62–66, pier feet reach y ≈ 76.
 */
export function SkyLekkiBridge({ x = 0, y = 0, scale = 1, opacity = 1 }: Props) {
  const leftCables = [0, 1, 2, 3, 4, 5, 6, 7]
  const rightCables = [0, 1, 2, 3, 4, 5, 6, 7]
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`} opacity={opacity}>
      {/* cable fans (behind the pylon) */}
      <g stroke="#AEBDBD" strokeWidth="0.7" opacity="0.85">
        {leftCables.map((i) => (
          <line
            key={`l-${i}`}
            x1={156 - i * 0.9}
            y1={8 + i * 5}
            x2={30 + i * 14}
            y2={62.5 - Math.sin(((30 + i * 14) / 300) * Math.PI) * 3}
          />
        ))}
        {rightCables.map((i) => (
          <line
            key={`r-${i}`}
            x1={158 - i * 0.7}
            y1={8 + i * 5}
            x2={288 - i * 13}
            y2={62.5 - Math.sin(((288 - i * 13) / 300) * Math.PI) * 3}
          />
        ))}
      </g>
      {/* pylon — leaning spire, two-tone */}
      <path d="M146 63 L157 4 L162 4.5 L156 63 Z" fill="#E9E6DA" />
      <path d="M156 63 L162 4.5 L164.2 6.2 L160.2 63 Z" fill="#C6CBBB" />
      <path d="M157 4 L158.6 -2" stroke="#C6CBBB" strokeWidth="1.2" strokeLinecap="round" />
      {/* deck — gentle arch */}
      <path d="M0 66 Q150 57.5 300 66 L300 62.5 Q150 54 0 62.5 Z" fill="#B8C6C6" />
      <path d="M0 62.5 Q150 54 300 62.5" fill="none" stroke="#98ACAE" strokeWidth="1" />
      {/* railing */}
      <path
        d="M0 60.8 Q150 52.3 300 60.8"
        fill="none"
        stroke="#9FB2B3"
        strokeWidth="0.7"
        strokeDasharray="2.6 2.6"
        opacity="0.9"
      />
      {/* piers + reflections */}
      {[70, 150, 230].map((px) => (
        <g key={px}>
          <rect x={px - 1.5} y={64.5} width="3" height="9" fill="#9FB2B3" />
          <path
            d={`M${px - 1.5} 76.5 L${px + 1.5} 76.5`}
            stroke="#8FA6A8"
            strokeWidth="1.4"
            opacity="0.35"
          />
          <path
            d={`M${px - 1} 79.5 L${px + 1} 79.5`}
            stroke="#8FA6A8"
            strokeWidth="1"
            opacity="0.22"
          />
        </g>
      ))}
      {/* pylon reflection */}
      <path
        d="M150 76 L154 83"
        stroke="#C6CBBB"
        strokeWidth="1.6"
        opacity="0.25"
        strokeLinecap="round"
      />
    </g>
  )
}
