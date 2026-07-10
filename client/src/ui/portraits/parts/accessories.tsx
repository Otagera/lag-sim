import { shade } from '../palette'
import type { PartProps } from '../types'

/* Accessories align to the eye line (y=39) and neck base (y≈78). */

export function RoundGlasses(_: PartProps) {
  const wire = '#C9A227'
  return (
    <g>
      <circle cx={43.2} cy={39.8} r="4.6" fill="#fff" opacity="0.05" />
      <circle cx={56.8} cy={39.8} r="4.6" fill="#fff" opacity="0.05" />
      <circle cx={43.2} cy={39.8} r="4.6" fill="none" stroke={wire} strokeWidth="0.9" />
      <circle cx={56.8} cy={39.8} r="4.6" fill="none" stroke={wire} strokeWidth="0.9" />
      <path d="M47.8 39 Q50 37.8 52.2 39" fill="none" stroke={wire} strokeWidth="0.8" />
      <path d="M38.6 39 L35.4 38 M61.4 39 L64.6 38" fill="none" stroke={wire} strokeWidth="0.7" />
    </g>
  )
}

export function HeavyGlasses(_: PartProps) {
  const frame = '#1B1713'
  return (
    <g>
      <rect x="36.2" y="34.6" width="13" height="9.2" rx="2.6" fill="#fff" opacity="0.05" />
      <rect x="50.8" y="34.6" width="13" height="9.2" rx="2.6" fill="#fff" opacity="0.05" />
      <rect
        x="36.2"
        y="34.6"
        width="13"
        height="9.2"
        rx="2.6"
        fill="none"
        stroke={frame}
        strokeWidth="1.6"
      />
      <rect
        x="50.8"
        y="34.6"
        width="13"
        height="9.2"
        rx="2.6"
        fill="none"
        stroke={frame}
        strokeWidth="1.6"
      />
      <path d="M49.2 38 L50.8 38" fill="none" stroke={frame} strokeWidth="1.4" />
      <path
        d="M36.2 38.5 L34.4 37.5 M63.8 38.5 L65.6 37.5"
        fill="none"
        stroke={frame}
        strokeWidth="1.1"
      />
      {/* lens glint */}
      <path
        d="M38.5 36.6 L41.5 41.8 M40.5 36.6 L43 41"
        stroke="#fff"
        strokeWidth="0.5"
        opacity="0.14"
      />
    </g>
  )
}

/** Chunky coral bead necklace at the collar — chieftaincy, not decoration. */
export function CoralBeads(_: PartProps) {
  const coral = '#C2452D'
  const coralHi = '#D96B4A'
  const beads: [number, number][] = [
    [40.5, 79.5],
    [44, 82],
    [47.8, 83.4],
    [52.2, 83.4],
    [56, 82],
    [59.5, 79.5],
  ]
  return (
    <g>
      <path
        d="M39.5 78 Q44 84.6 50 84.8 Q56 84.6 60.5 78"
        fill="none"
        stroke={shade(coral, 0.5)}
        strokeWidth="0.7"
        opacity="0.8"
      />
      {beads.map(([x, y], i) => (
        <g key={`bead-${x}`}>
          <circle cx={x} cy={y} r="2.3" fill={i % 2 === 0 ? coral : coralHi} />
          <circle cx={x} cy={y} r="2.3" fill="none" stroke={shade(coral, 0.55)} strokeWidth="0.4" />
          <circle cx={x - 0.7} cy={y - 0.7} r="0.55" fill="#fff" opacity="0.35" />
        </g>
      ))}
      {/* second inner strand */}
      {[
        [43.5, 78.2],
        [47, 79.6],
        [50, 80],
        [53, 79.6],
        [56.5, 78.2],
      ].map(([x, y]) => (
        <circle key={`bead2-${x}`} cx={x} cy={y} r="1.5" fill={shade(coral, 0.8)} />
      ))}
    </g>
  )
}

export function LapelPin({ accent = '#D4AF37' }: PartProps) {
  return (
    <g>
      <circle cx="61" cy="86" r="1.7" fill={accent} />
      <circle cx="61" cy="86" r="1.7" fill="none" stroke={shade(accent, 0.6)} strokeWidth="0.4" />
      <circle cx="60.4" cy="85.4" r="0.5" fill="#fff" opacity="0.5" />
    </g>
  )
}

/** Gold hoops at the ear lobes. */
export function Earrings({ accent = '#D4AF37' }: PartProps) {
  return (
    <g>
      <circle cx="35.4" cy="49.5" r="1.9" fill="none" stroke={accent} strokeWidth="1" />
      <circle cx="64.6" cy="49.5" r="1.9" fill="none" stroke={accent} strokeWidth="1" />
      <circle cx="34.8" cy="48.6" r="0.45" fill="#fff" opacity="0.6" />
      <circle cx="64" cy="48.6" r="0.45" fill="#fff" opacity="0.6" />
    </g>
  )
}
