interface Props {
  x?: number
  y?: number
  scale?: number
  opacity?: number
}

/**
 * The Apapa tanker — long rusty fuel tanker crawling along, cab facing LEFT.
 * Box: 64w × 22h, wheels on y = 22.
 */
export function SkyTanker({ x = 0, y = 0, scale = 1, opacity = 1 }: Props) {
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`} opacity={opacity}>
      {/* chassis */}
      <rect x="1" y="17" width="62" height="2" fill="#2A2A28" />
      {/* cab */}
      <rect x="1" y="8" width="11" height="9.5" rx="1.5" fill="#4A5A66" />
      <rect x="2.4" y="9.5" width="4.6" height="3.6" rx="0.6" fill="#B9CDD4" />
      <rect x="1" y="14.5" width="11" height="1.2" fill="#3A4650" />
      {/* tank cylinder */}
      <rect x="14" y="6" width="48" height="11.5" rx="5.6" fill="#9A7E64" />
      <rect x="16.5" y="7.2" width="43" height="2" rx="1" fill="#B39A80" opacity="0.7" />
      {/* weld rings */}
      <path
        d="M27 6.4 L27 17.2 M39 6.4 L39 17.2 M51 6.4 L51 17.2"
        stroke="#7A6450"
        strokeWidth="0.8"
        opacity="0.9"
      />
      {/* rust streaks */}
      <path
        d="M22 10 Q21.6 13 22 16.5 M33 8 Q32.6 12 33.2 16.8 M45 9.5 Q44.6 13 45 16.8 M57 8.5 Q56.6 12.5 57 16.5"
        stroke="#7A5E44"
        strokeWidth="1"
        opacity="0.55"
        fill="none"
      />
      {/* rear ladder */}
      <path
        d="M60.5 7 L60.5 17 M62 7 L62 17 M60.5 9.5 L62 9.5 M60.5 12.5 L62 12.5 M60.5 15.5 L62 15.5"
        stroke="#6E5A48"
        strokeWidth="0.5"
      />
      {/* wheels */}
      {[6, 40, 47, 54].map((wx) => (
        <g key={wx}>
          <circle cx={wx} cy="19.4" r="2.6" fill="#17140F" />
          <circle cx={wx} cy="19.4" r="0.9" fill="#7A7A74" />
        </g>
      ))}
    </g>
  )
}
