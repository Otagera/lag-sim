interface LagosSealMarkProps {
  size?: number
  opacity?: number
  monogram?: string
  tone?: 'accent' | 'ink'
}

// A richer, scalable extension of the small header badge (src/ui/components/Seal.tsx,
// untouched — this is a separate prototype). Only generic civic/coastal shapes —
// a bridge, waves, sun, palm fronds — never the specific heraldic charges of the
// real Lagos State coat of arms. Stroke-based line art throughout so it stays
// crisp both as a faint watermark and as a small crisp badge.
export function LagosSealMark({
  size = 400,
  opacity = 1,
  monogram = 'LGS',
  tone = 'accent',
}: LagosSealMarkProps) {
  const color = tone === 'accent' ? '#1A9B8E' : '#3A3F44'

  // Below ~64px the full engraving turns to visual noise — render a legible
  // reduction instead: rings, sun, one wave, monogram. Same silhouette
  // family as the full mark, so the two read as the same seal at different
  // reproduction sizes (like a real seal on letterhead vs. a lapel pin).
  if (size < 64) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        fill="none"
        aria-label="Fictional Lagos seal badge"
      >
        <g opacity={opacity} stroke={color} strokeWidth="7">
          <circle cx="100" cy="100" r="92" />
          <circle cx="100" cy="100" r="76" strokeWidth="3.5" opacity="0.55" />
          {/* sun */}
          <circle cx="100" cy="72" r="14" fill={color} stroke="none" opacity="0.85" />
          {Array.from({ length: 5 }).map((_, i) => {
            const a = Math.PI + (i / 4) * Math.PI
            return (
              <line
                key={`bray-${a}`}
                x1={100 + Math.cos(a) * 22}
                y1={72 + Math.sin(a) * 22}
                x2={100 + Math.cos(a) * 32}
                y2={72 + Math.sin(a) * 32}
                strokeWidth="6"
                strokeLinecap="round"
              />
            )
          })}
          {/* wave */}
          <path d="M 52 112 Q 68 98 84 112 T 116 112 T 148 112" strokeLinecap="round" />
          <text
            x="100"
            y="162"
            textAnchor="middle"
            fontFamily="'Playfair Display', Georgia, serif"
            fontSize="38"
            fontWeight="600"
            fill={color}
            stroke="none"
          >
            {monogram}
          </text>
        </g>
      </svg>
    )
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      aria-label="Fictional Lagos seal watermark"
    >
      <g opacity={opacity} stroke={color}>
        {/* ── Border rings ── */}
        <circle cx="100" cy="100" r="97" strokeWidth="2.5" />
        <circle cx="100" cy="100" r="93" strokeWidth="0.75" />
        {/* Milled coin edge */}
        <circle
          cx="100"
          cy="100"
          r="90"
          strokeWidth="2"
          strokeDasharray="0.5 2.6"
          strokeLinecap="round"
          opacity="0.8"
        />
        {/* Inner emblem ring */}
        <circle cx="100" cy="100" r="64" strokeWidth="1.25" />
        <circle cx="100" cy="100" r="61" strokeWidth="0.5" opacity="0.6" />

        {/* ── Text arcs (between milled edge and emblem ring) ── */}
        <path id="seal-arc-top" d="M 24 100 A 76 76 0 0 1 176 100" fill="none" stroke="none" />
        <path id="seal-arc-bottom" d="M 28 100 A 72 72 0 0 0 172 100" fill="none" stroke="none" />
        <text
          fontFamily="'Archivo Narrow', sans-serif"
          fontSize="10.5"
          fontWeight="700"
          letterSpacing="2.6"
          fill={color}
          stroke="none"
        >
          <textPath href="#seal-arc-top" startOffset="50%" textAnchor="middle">
            UNITAS · PROGRESSUS · MARE
          </textPath>
        </text>
        <text
          fontFamily="'Archivo Narrow', sans-serif"
          fontSize="9"
          fontWeight="700"
          letterSpacing="3.2"
          fill={color}
          stroke="none"
        >
          <textPath href="#seal-arc-bottom" startOffset="50%" textAnchor="middle">
            EST · MCMLXVII
          </textPath>
        </text>
        {/* Side separators between the two arcs */}
        <path d="M 21 100 l 5 -3 l 0 6 z" fill={color} stroke="none" />
        <path d="M 179 100 l -5 -3 l 0 6 z" fill={color} stroke="none" />

        {/* ── Emblem ── */}
        {/* Guiding star */}
        <path
          d="M 100 44 l 1.8 4.4 4.8 0.4 -3.6 3.1 1.1 4.7 -4.1 -2.5 -4.1 2.5 1.1 -4.7 -3.6 -3.1 4.8 -0.4 z"
          fill={color}
          stroke="none"
          opacity="0.9"
        />

        {/* Rising sun */}
        <circle cx="100" cy="82" r="9" strokeWidth="1.5" />
        <circle cx="100" cy="82" r="4.5" fill={color} stroke="none" opacity="0.55" />
        {Array.from({ length: 9 }).map((_, i) => {
          const a = Math.PI + (i / 8) * Math.PI
          const x1 = 100 + Math.cos(a) * 13
          const y1 = 82 + Math.sin(a) * 13
          const x2 = 100 + Math.cos(a) * (i % 2 === 0 ? 19 : 16)
          const y2 = 82 + Math.sin(a) * (i % 2 === 0 ? 19 : 16)
          return (
            <line
              key={`ray-${a}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          )
        })}

        {/* Arch bridge with hangers and deck */}
        <path d="M 58 112 Q 100 76 142 112" strokeWidth="2.25" strokeLinecap="round" />
        <line x1="54" y1="112" x2="146" y2="112" strokeWidth="1.75" strokeLinecap="round" />
        <line
          x1="54"
          y1="115"
          x2="146"
          y2="115"
          strokeWidth="0.75"
          strokeLinecap="round"
          opacity="0.7"
        />
        {[68, 79, 90, 100, 110, 121, 132].map((hx) => {
          // hanger from arch down to deck: arch y at hx via the quadratic
          const t = (hx - 58) / 84
          const archY = (1 - t) * (1 - t) * 112 + 2 * (1 - t) * t * 76 + t * t * 112
          return (
            <line
              key={`hanger-${hx}`}
              x1={hx}
              y1={archY}
              x2={hx}
              y2={112}
              strokeWidth="0.9"
              opacity="0.85"
            />
          )
        })}

        {/* Water — layered waves with ripple dashes */}
        <path
          d="M 56 124 Q 66 119 76 124 T 96 124 T 116 124 T 136 124 L 144 124"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
        <path
          d="M 62 132 Q 71 127.5 80 132 T 98 132 T 116 132 T 134 132"
          strokeWidth="1.4"
          strokeLinecap="round"
          opacity="0.75"
        />
        <path
          d="M 72 139 Q 80 135 88 139 T 104 139 T 120 139"
          strokeWidth="1.1"
          strokeLinecap="round"
          opacity="0.5"
        />

        {/* Palm fronds flanking the emblem (laurel position) */}
        <g strokeWidth="1.3" strokeLinecap="round">
          {/* left frond */}
          <path d="M 52 148 Q 42 122 52 96" fill="none" />
          {[0.12, 0.28, 0.44, 0.6, 0.76, 0.9].map((t) => {
            const y = 148 - t * 52
            const x = 52 - Math.sin(t * Math.PI) * 10
            return (
              <path
                key={`lf-${t}`}
                d={`M ${x} ${y} q -9 ${-3 - t * 3} -13 ${2 - t * 6}`}
                fill="none"
                opacity="0.85"
              />
            )
          })}
          {/* right frond */}
          <path d="M 148 148 Q 158 122 148 96" fill="none" />
          {[0.12, 0.28, 0.44, 0.6, 0.76, 0.9].map((t) => {
            const y = 148 - t * 52
            const x = 148 + Math.sin(t * Math.PI) * 10
            return (
              <path
                key={`rf-${t}`}
                d={`M ${x} ${y} q 9 ${-3 - t * 3} 13 ${2 - t * 6}`}
                fill="none"
                opacity="0.85"
              />
            )
          })}
          {/* crossed stems at base */}
          <path
            d="M 52 148 Q 76 158 100 152 Q 124 158 148 148"
            fill="none"
            strokeWidth="1"
            opacity="0.7"
          />
        </g>
      </g>
    </svg>
  )
}
