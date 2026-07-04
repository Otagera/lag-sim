interface Props {
  x?: number
  y?: number
  scale?: number
  opacity?: number
}

/**
 * Makoko — stilt houses on the lagoon. Corrugated roofs, weathered board
 * walls, thin stilt legs with water reflections, a connecting boardwalk.
 * Box: 126w × 48h, waterline at y = 40.
 */
function Shack({
  x,
  w,
  h,
  wall,
  roof,
  slope = 1,
}: {
  x: number
  w: number
  h: number
  wall: string
  roof: string
  slope?: number
}) {
  const top = 38 - h
  return (
    <g>
      {/* stilts + reflections */}
      {[x + 2, x + w / 2, x + w - 2].map((sx) => (
        <g key={sx}>
          <line x1={sx} y1={38} x2={sx} y2={45.5} stroke="#5A4636" strokeWidth="1.2" />
          <line
            x1={sx}
            y1={41.5}
            x2={sx}
            y2={46.5}
            stroke="#4A3A2E"
            strokeWidth="0.8"
            opacity="0.3"
          />
        </g>
      ))}
      {/* walls */}
      <rect x={x} y={top} width={w} height={h} fill={wall} />
      <path
        d={`M${x + w * 0.33} ${top + 1.5} L${x + w * 0.33} ${top + h - 1} M${x + w * 0.66} ${top + 1.5} L${x + w * 0.66} ${top + h - 1}`}
        stroke="#00000030"
        strokeWidth="0.7"
      />
      {/* window + door hints */}
      <rect x={x + w * 0.18} y={top + h * 0.3} width="2.6" height="2.6" fill="#2E2620" />
      <rect
        x={x + w * 0.62}
        y={top + h * 0.42}
        width="3.2"
        height={h * 0.58 - 1}
        fill="#2E2620"
        opacity="0.85"
      />
      {/* corrugated roof with overhang */}
      <path
        d={`M${x - 2.5} ${top + 1.5 * slope} L${x + w + 2.5} ${top - 1.5 * slope} L${x + w + 2.5} ${top - 3.5 * slope - 1} L${x - 2.5} ${top - 0.5 * slope - 1} Z`}
        fill={roof}
      />
      <path
        d={`M${x + 1} ${top + 0.6 * slope} L${x + 1} ${top - 1.8 * slope - 0.6} M${x + w / 2} ${top} L${x + w / 2} ${top - 2.5 * slope - 0.8} M${x + w - 1} ${top - slope} L${x + w - 1} ${top - 3 * slope - 1}`}
        stroke="#00000028"
        strokeWidth="0.7"
      />
    </g>
  )
}

export function SkyMakoko({ x = 0, y = 0, scale = 1, opacity = 1 }: Props) {
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`} opacity={opacity}>
      <Shack x={4} w={22} h={13} wall="#8A6E52" roof="#5E6E78" />
      <Shack x={32} w={18} h={11} wall="#6E5A44" roof="#8A5A42" slope={-1} />
      <Shack x={56} w={24} h={15} wall="#9A8266" roof="#55606A" />
      <Shack x={86} w={20} h={12} wall="#7A6248" roof="#6E4A3A" slope={-1} />
      {/* boardwalk plank connecting the cluster */}
      <line x1="8" y1="39" x2="118" y2="39" stroke="#7A6248" strokeWidth="1.3" opacity="0.85" />
      {/* moored dugout at the end of the walk */}
      <path
        d="M108 41.5 Q112 43.6 118 43.6 Q123 43.6 126 41.8 Q121 42.6 115 42.5 Q111 42.4 108 41.5 Z"
        fill="#4A3A2E"
      />
    </g>
  )
}

/** Small paddled canoe for the open lagoon. Box: 28w × 10h, waterline y = 7.5. */
export function SkyCanoe({ x = 0, y = 0, scale = 1, opacity = 1 }: Props) {
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`} opacity={opacity}>
      {/* paddler */}
      <circle cx="11" cy="1.4" r="1.5" fill="#3A2A20" />
      <path d="M11 2.6 Q10.4 4.4 10.8 5.8 L12.6 5.8 Q12.4 4 11.8 2.8 Z" fill="#4A6E5A" />
      <line
        x1="9.6"
        y1="2.2"
        x2="14.6"
        y2="8.2"
        stroke="#6E5A44"
        strokeWidth="1"
        strokeLinecap="round"
      />
      {/* dugout hull */}
      <path
        d="M0 4 Q2 7.2 8 7.6 L20 7.6 Q26 7.2 28 3.8 Q22 6.2 14 6.2 Q6 6.2 0 4 Z"
        fill="#4A3A2E"
      />
      <path
        d="M2 5.2 Q8 6.6 14 6.6 Q20 6.6 26 5"
        fill="none"
        stroke="#5E4A38"
        strokeWidth="0.6"
        opacity="0.8"
      />
      {/* wake */}
      <path
        d="M-3 8.6 Q4 9.6 12 9.6 M18 9.4 Q24 9.4 30 8.4"
        stroke="#eaf6f3"
        strokeWidth="0.8"
        fill="none"
        opacity="0.5"
      />
    </g>
  )
}
