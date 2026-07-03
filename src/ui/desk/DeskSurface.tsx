type DeskStyle = 'modern' | 'traditional' | 'simple'

interface Props {
  x?: number
  y?: number
  width?: number
  height?: number
  deskStyle?: DeskStyle
}

/** One drawer front with molding, highlight/shadow relief, and a brass pull. */
function Drawer({
  x,
  y,
  w,
  h,
  keyhole,
}: {
  x: number
  y: number
  w: number
  h: number
  keyhole?: boolean
}) {
  const cx = x + w / 2
  const cy = y + h / 2
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={1.5}
        fill="#4a2c15"
        stroke="#2e1a0a"
        strokeWidth="0.8"
      />
      {/* raised-panel relief: light top/left, dark bottom/right */}
      <path
        d={`M ${x + 2} ${y + h - 2} L ${x + 2} ${y + 2} L ${x + w - 2} ${y + 2}`}
        fill="none"
        stroke="#7a5230"
        strokeWidth="0.9"
        opacity="0.8"
      />
      <path
        d={`M ${x + 2} ${y + h - 2} L ${x + w - 2} ${y + h - 2} L ${x + w - 2} ${y + 2}`}
        fill="none"
        stroke="#1f1106"
        strokeWidth="0.9"
        opacity="0.8"
      />
      {/* brass pull */}
      <circle cx={cx} cy={cy} r={3.2} fill="url(#dsk-brass)" stroke="#6e5416" strokeWidth="0.5" />
      <circle cx={cx - 1} cy={cy - 1} r={0.9} fill="#f5e6b8" opacity="0.9" />
      {keyhole && (
        <g fill="#2e1a0a">
          <circle cx={cx} cy={y + h - 5} r={1.1} />
          <path d={`M ${cx - 0.6} ${y + h - 5} l 1.2 0 l 0 3 l -1.2 0 z`} />
        </g>
      )}
    </g>
  )
}

export function DeskSurface({
  x = 0,
  y = 0,
  width = 500,
  height = 200,
  deskStyle = 'modern',
}: Props) {
  const top = y
  const left = x
  const right = x + width
  const bottom = y + height

  if (deskStyle === 'modern') {
    return (
      <g>
        <defs>
          <linearGradient id="dsk-glass" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#eef6f8" />
            <stop offset="50%" stopColor="#dbe9ee" />
            <stop offset="100%" stopColor="#c9dde5" />
          </linearGradient>
          <linearGradient id="dsk-steel" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c8ccd0" />
            <stop offset="45%" stopColor="#9aa1a8" />
            <stop offset="55%" stopColor="#878e95" />
            <stop offset="100%" stopColor="#b3b9bf" />
          </linearGradient>
          <linearGradient id="dsk-frost" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e8eef1" />
            <stop offset="100%" stopColor="#d2dde3" />
          </linearGradient>
        </defs>

        {/* Glass slab top */}
        <rect
          x={left}
          y={top}
          width={width}
          height={12}
          rx={2}
          fill="url(#dsk-glass)"
          stroke="#aebfc7"
          strokeWidth="0.75"
        />
        {/* reflection streaks across the glass */}
        <path
          d={`M ${left + 40} ${top + 1} l 26 0 l -14 10 l -26 0 z`}
          fill="#ffffff"
          opacity="0.5"
        />
        <path
          d={`M ${left + 78} ${top + 1} l 10 0 l -14 10 l -10 0 z`}
          fill="#ffffff"
          opacity="0.35"
        />
        <path
          d={`M ${right - 120} ${top + 1} l 30 0 l -14 10 l -30 0 z`}
          fill="#ffffff"
          opacity="0.4"
        />
        {/* glass edge glow */}
        <line
          x1={left}
          y1={top + 12}
          x2={right}
          y2={top + 12}
          stroke="#8fd8cf"
          strokeWidth="1.2"
          opacity="0.7"
        />

        {/* Steel under-frame rail */}
        <rect
          x={left + 4}
          y={top + 13}
          width={width - 8}
          height={5}
          rx={1.5}
          fill="url(#dsk-steel)"
        />

        {/* Frosted privacy panel */}
        <rect
          x={left + 26}
          y={top + 18}
          width={width - 52}
          height={bottom - top - 40}
          rx={2}
          fill="url(#dsk-frost)"
          opacity="0.9"
        />
        {/* brushed vertical texture */}
        {Array.from({ length: 12 }).map((_, i) => {
          const vx = left + 44 + i * ((width - 88) / 11)
          return (
            <line
              key={`brush-${vx}`}
              x1={vx}
              y1={top + 24}
              x2={vx}
              y2={bottom - 28}
              stroke="#ffffff"
              strokeWidth="0.6"
              opacity="0.35"
            />
          )
        })}
        <rect
          x={left + 26}
          y={top + 18}
          width={width - 52}
          height={bottom - top - 40}
          rx={2}
          fill="none"
          stroke="#b6c4cb"
          strokeWidth="0.75"
        />

        {/* Steel slab legs */}
        <rect
          x={left + 8}
          y={top + 13}
          width={12}
          height={bottom - top + 25}
          rx={2}
          fill="url(#dsk-steel)"
        />
        <rect
          x={right - 20}
          y={top + 13}
          width={12}
          height={bottom - top + 25}
          rx={2}
          fill="url(#dsk-steel)"
        />
        {/* leg highlights */}
        <line
          x1={left + 10.5}
          y1={top + 16}
          x2={left + 10.5}
          y2={bottom + 34}
          stroke="#e6eaed"
          strokeWidth="1"
          opacity="0.8"
        />
        <line
          x1={right - 17.5}
          y1={top + 16}
          x2={right - 17.5}
          y2={bottom + 34}
          stroke="#e6eaed"
          strokeWidth="1"
          opacity="0.8"
        />
        {/* feet */}
        <rect x={left + 4} y={bottom + 36} width={20} height={4} rx={2} fill="#787f86" />
        <rect x={right - 24} y={bottom + 36} width={20} height={4} rx={2} fill="#787f86" />
      </g>
    )
  }

  if (deskStyle === 'traditional') {
    const pedW = 120
    const pedTop = top + 18
    const pedBottom = bottom + 30
    return (
      <g>
        <defs>
          <linearGradient id="dsk-mahogany" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6b4423" />
            <stop offset="45%" stopColor="#54331a" />
            <stop offset="100%" stopColor="#3e2410" />
          </linearGradient>
          <linearGradient id="dsk-topsheen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8a5c31" />
            <stop offset="35%" stopColor="#6e4522" />
            <stop offset="100%" stopColor="#5a3619" />
          </linearGradient>
          <linearGradient id="dsk-kneehole" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#241205" />
            <stop offset="100%" stopColor="#38200e" />
          </linearGradient>
          <radialGradient id="dsk-brass" cx="0.35" cy="0.35" r="0.8">
            <stop offset="0%" stopColor="#e8cf8e" />
            <stop offset="60%" stopColor="#b8860b" />
            <stop offset="100%" stopColor="#8a6508" />
          </radialGradient>
        </defs>

        {/* ── Polished top with beveled edge ── */}
        <rect
          x={left - 6}
          y={top}
          width={width + 12}
          height={10}
          rx={2}
          fill="url(#dsk-topsheen)"
          stroke="#2e1a0a"
          strokeWidth="0.75"
        />
        {/* sheen streak */}
        <path
          d={`M ${left + 30} ${top + 1.5} L ${right - 150} ${top + 1.5} L ${right - 162} ${top + 5} L ${left + 22} ${top + 5} Z`}
          fill="#c99a5b"
          opacity="0.45"
        />
        {/* ogee lip */}
        <rect x={left - 4} y={top + 10} width={width + 8} height={4} fill="#3e2410" />
        <line
          x1={left - 4}
          y1={top + 10.75}
          x2={right + 4}
          y2={top + 10.75}
          stroke="#8a5c31"
          strokeWidth="0.75"
          opacity="0.7"
        />

        {/* ── Body / front face ── */}
        <rect
          x={left}
          y={top + 14}
          width={width}
          height={bottom - top - 14}
          fill="url(#dsk-mahogany)"
        />
        {/* grain */}
        <path
          d={`M ${left + 16} ${top + 34} Q ${left + width * 0.3} ${top + 40} ${left + width * 0.6} ${top + 31} Q ${left + width * 0.82} ${top + 38} ${right - 14} ${top + 33}`}
          fill="none"
          stroke="#7a5230"
          strokeWidth="0.7"
          opacity="0.35"
        />
        <path
          d={`M ${left + 30} ${top + 72} Q ${left + width * 0.42} ${top + 79} ${left + width * 0.7} ${top + 69} Q ${right - 52} ${top + 76} ${right - 24} ${top + 71}`}
          fill="none"
          stroke="#7a5230"
          strokeWidth="0.7"
          opacity="0.3"
        />
        <ellipse
          cx={left + width * 0.36}
          cy={top + 52}
          rx={4.5}
          ry={1.6}
          fill="none"
          stroke="#7a5230"
          strokeWidth="0.6"
          opacity="0.35"
        />
        <ellipse
          cx={left + width * 0.68}
          cy={top + 96}
          rx={3.5}
          ry={1.3}
          fill="none"
          stroke="#7a5230"
          strokeWidth="0.6"
          opacity="0.3"
        />

        {/* ── Kneehole (recessed center) with arched modesty panel ── */}
        <rect
          x={left + pedW + 10}
          y={pedTop}
          width={width - pedW * 2 - 20}
          height={bottom - pedTop}
          fill="url(#dsk-kneehole)"
        />
        <path
          d={`M ${left + pedW + 22} ${bottom} L ${left + pedW + 22} ${pedTop + 40} Q ${left + width / 2} ${pedTop + 18} ${right - pedW - 22} ${pedTop + 40} L ${right - pedW - 22} ${bottom}`}
          fill="#472a12"
          stroke="#2e1a0a"
          strokeWidth="1"
        />
        <path
          d={`M ${left + pedW + 30} ${bottom - 6} L ${left + pedW + 30} ${pedTop + 46} Q ${left + width / 2} ${pedTop + 26} ${right - pedW - 30} ${pedTop + 46} L ${right - pedW - 30} ${bottom - 6}`}
          fill="none"
          stroke="#7a5230"
          strokeWidth="0.8"
          opacity="0.5"
        />

        {/* ── Center drawer over the kneehole ── */}
        <Drawer x={left + pedW + 14} y={pedTop + 2} w={width - pedW * 2 - 28} h={22} keyhole />

        {/* ── Pedestals ── */}
        {[left + 4, right - pedW - 4].map((px) => (
          <g key={`ped-${px}`}>
            <rect
              x={px}
              y={pedTop}
              width={pedW}
              height={pedBottom - pedTop}
              rx={2}
              fill="url(#dsk-mahogany)"
              stroke="#2e1a0a"
              strokeWidth="1"
            />
            {/* frame highlight */}
            <rect
              x={px + 3}
              y={pedTop + 3}
              width={pedW - 6}
              height={pedBottom - pedTop - 6}
              rx={1.5}
              fill="none"
              stroke="#7a5230"
              strokeWidth="0.7"
              opacity="0.55"
            />
            <Drawer x={px + 9} y={pedTop + 9} w={pedW - 18} h={30} keyhole />
            <Drawer x={px + 9} y={pedTop + 45} w={pedW - 18} h={30} />
            <Drawer x={px + 9} y={pedTop + 81} w={pedW - 18} h={44} />
            {/* plinth */}
            <rect x={px - 3} y={pedBottom} width={pedW + 6} height={7} rx={1.5} fill="#2e1a0a" />
            <line
              x1={px - 3}
              y1={pedBottom + 1.2}
              x2={px + pedW + 3}
              y2={pedBottom + 1.2}
              stroke="#7a5230"
              strokeWidth="0.7"
              opacity="0.6"
            />
          </g>
        ))}
      </g>
    )
  }

  /* simple — warm light oak */
  return (
    <g>
      <defs>
        <linearGradient id="dsk-oak" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e3cfa8" />
          <stop offset="100%" stopColor="#cbb182" />
        </linearGradient>
      </defs>
      {/* top with edge */}
      <rect
        x={left - 3}
        y={top}
        width={width + 6}
        height={9}
        rx={2}
        fill="#d9c295"
        stroke="#a98e5f"
        strokeWidth="0.75"
      />
      <line
        x1={left + 10}
        y1={top + 2.5}
        x2={right - 60}
        y2={top + 2.5}
        stroke="#f2e4c4"
        strokeWidth="1.2"
        opacity="0.8"
      />
      {/* apron / front */}
      <rect x={left} y={top + 9} width={width} height={bottom - top - 9} fill="url(#dsk-oak)" />
      {/* grain */}
      <path
        d={`M ${left + 24} ${top + 40} Q ${left + width * 0.35} ${top + 46} ${left + width * 0.62} ${top + 37} Q ${right - 60} ${top + 44} ${right - 20} ${top + 39}`}
        fill="none"
        stroke="#b39763"
        strokeWidth="0.7"
        opacity="0.5"
      />
      <path
        d={`M ${left + 40} ${top + 88} Q ${left + width * 0.45} ${top + 94} ${left + width * 0.72} ${top + 85}`}
        fill="none"
        stroke="#b39763"
        strokeWidth="0.7"
        opacity="0.4"
      />
      <line x1={left} y1={bottom} x2={right} y2={bottom} stroke="#a98e5f" strokeWidth="1.5" />
      {/* tapered legs */}
      <path
        d={`M ${left + 14} ${bottom} L ${left + 26} ${bottom} L ${left + 23} ${bottom + 38} L ${left + 18} ${bottom + 38} Z`}
        fill="#c4a97c"
        stroke="#a98e5f"
        strokeWidth="0.6"
      />
      <path
        d={`M ${right - 26} ${bottom} L ${right - 14} ${bottom} L ${right - 18} ${bottom + 38} L ${right - 23} ${bottom + 38} Z`}
        fill="#c4a97c"
        stroke="#a98e5f"
        strokeWidth="0.6"
      />
    </g>
  )
}
