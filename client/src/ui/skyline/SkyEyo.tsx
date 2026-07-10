interface Props {
  x?: number
  y?: number
  scale?: number
  opacity?: number
}

/**
 * Eyo masquerade — hand-drawn. The identity is the all-white flowing agbada,
 * the wide-brim hat (aga) with its ribbon band, the veiled (faceless) head,
 * and the opambata staff. Rendered as a staggered group of three so the
 * promenade reads as a procession, not one lonely figure.
 * Figure box: 40w × 56h, feet at y=56.
 */
function EyoFigure({ band = '#7E3A34' }: { band?: string }) {
  return (
    <g>
      {/* opambata staff, held out to the right */}
      <path d="M31 52 L36.5 8" stroke="#A58762" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="36.7" cy="7" r="1.4" fill="#8A6A48" />
      {/* flowing white robe */}
      <path
        d="M20 12 Q12 14 9 22 Q5 34 4 50 Q4 53 8 53.6 Q14 54.6 20 54.6 Q26 54.6 32 53.6 Q36 53 36 50 Q35 34 31 22 Q28 14 20 12 Z"
        fill="#F2EEE3"
      />
      <path
        d="M20 12 Q28 14 31 22 Q35 34 36 50 Q36 53 32 53.6 Q28 54.2 24 54.5 Q28 40 26 26 Q24.5 17 20 12 Z"
        fill="#DDD7C8"
        opacity="0.8"
      />
      <path
        d="M14 24 Q12 38 11 52 M20 22 Q19.5 38 19.5 54 M26 24 Q28 38 29 52"
        fill="none"
        stroke="#C9C2B2"
        strokeWidth="0.8"
        opacity="0.7"
      />
      {/* gloved hand on the staff */}
      <circle cx="32.6" cy="37" r="2" fill="#EDE9DC" />
      {/* veiled head under the brim — no face, ever */}
      <ellipse cx="20" cy="12.5" rx="6.5" ry="3.8" fill="#B8B2A2" opacity="0.85" />
      {/* aga — wide-brim hat */}
      <ellipse cx="20" cy="9.4" rx="12.6" ry="2.8" fill="#CFC9BA" />
      <ellipse cx="20" cy="8.6" rx="13" ry="3.4" fill="#F6F3EA" />
      <path
        d="M12 8.2 Q12 1.5 20 1.2 Q28 1.5 28 8.2 Q24 6.8 20 6.8 Q16 6.8 12 8.2 Z"
        fill="#F6F3EA"
      />
      <path
        d="M12.5 7.6 Q16 6.2 20 6.2 Q24 6.2 27.5 7.6 L27.5 9 Q24 7.6 20 7.6 Q16 7.6 12.5 9 Z"
        fill={band}
      />
      {/* ground shadow */}
      <ellipse cx="20" cy="55" rx="14" ry="1.7" fill="#000" opacity="0.12" />
    </g>
  )
}

export function SkyEyo({ x = 0, y = 0, scale = 1, opacity = 1 }: Props) {
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`} opacity={opacity}>
      {/* back figure (smaller, slightly uphill) */}
      <g transform="translate(-15 13.5) scale(0.72)">
        <EyoFigure band="#3D6A62" />
      </g>
      {/* middle figure */}
      <g transform="translate(24 9) scale(0.84)">
        <EyoFigure band="#7E3A34" />
      </g>
      {/* lead figure */}
      <EyoFigure band="#7E3A34" />
    </g>
  )
}
