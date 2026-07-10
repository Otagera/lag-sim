import { shade } from '../palette'
import type { PartProps } from '../types'

/*
 * Torsos: neck exits at x 43–57, trapezius slopes from y≈72 at the neck out to
 * the shoulder points, then falls to the frame bottom (y 120). Base layers are
 * drawn BEHIND the head; the matching *Front components are drawn over the
 * neck to close collars and necklines.
 */

/** Agbada — enormous draped silhouette, the widest shoulders in the cast. */
export function ClothingAgbada({ fabric }: PartProps) {
  const dark = shade(fabric, 0.66)
  const light = shade(fabric, 1.25)
  return (
    <g>
      <path
        d="M43 70 Q30 72 20 78 Q10 84 7.5 96 L6 120 L94 120 L92.5 96 Q90 84 80 78 Q70 72 57 70 Q53.5 73 50 73 Q46.5 73 43 70 Z"
        fill={fabric}
      />
      {/* sleeve drape folds falling from the shoulders */}
      <path d="M22 79 Q16 90 14.5 120 L20 120 Q20.5 92 26 80.5 Z" fill={dark} opacity="0.55" />
      <path d="M78 79 Q84 90 85.5 120 L80 120 Q79.5 92 74 80.5 Z" fill={dark} opacity="0.55" />
      <path
        d="M31 76 Q27 92 26.5 120 M69 76 Q73 92 73.5 120"
        fill="none"
        stroke={dark}
        strokeWidth="1"
        opacity="0.6"
      />
      <path
        d="M36 74.5 Q33.5 92 33.5 120 M64 74.5 Q66.5 92 66.5 120"
        fill="none"
        stroke={light}
        strokeWidth="0.7"
        opacity="0.35"
      />
      {/* inner tunic panel */}
      <path
        d="M40 76 L40 120 L60 120 L60 76 Q55 79.5 50 79.5 Q45 79.5 40 76 Z"
        fill={shade(fabric, 0.82)}
      />
    </g>
  )
}

/** Agbada neckline — layered gold embroidery ring closing over the neck base. */
export function ClothingAgbadaNeckline({ fabric, accent = '#D4AF37' }: PartProps) {
  const dim = shade(accent, 0.7)
  return (
    <g>
      {/* fabric yoke over the neck bottom */}
      <path
        d="M42 73.5 Q46 77.5 50 77.5 Q54 77.5 58 73.5 Q60.5 75.5 60 79 Q55 83 50 83 Q45 83 40 79 Q39.5 75.5 42 73.5 Z"
        fill={shade(fabric, 0.88)}
      />
      {/* concentric embroidery arcs */}
      <path
        d="M41.5 76.5 Q45.5 80.6 50 80.6 Q54.5 80.6 58.5 76.5"
        fill="none"
        stroke={accent}
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      <path
        d="M40.5 78.8 Q45 83.2 50 83.2 Q55 83.2 59.5 78.8"
        fill="none"
        stroke={dim}
        strokeWidth="0.8"
        strokeLinecap="round"
      />
      <path
        d="M42.5 74.6 Q46 78.2 50 78.2 Q54 78.2 57.5 74.6"
        fill="none"
        stroke={dim}
        strokeWidth="0.7"
        strokeLinecap="round"
        opacity="0.8"
      />
      {/* stitch loops */}
      <path
        d="M43.5 81.5 q1 1.6 2.2 0 M47 82.6 q1 1.6 2.2 0 M50.8 82.6 q1 1.6 2.2 0 M54.4 81.5 q1 1.6 2.2 0"
        fill="none"
        stroke={accent}
        strokeWidth="0.6"
        opacity="0.85"
      />
      {/* center medallion slit */}
      <path
        d="M50 83 L50 90 M48.2 84 L48.2 88.5 M51.8 84 L51.8 88.5"
        stroke={accent}
        strokeWidth="0.6"
        opacity="0.6"
      />
    </g>
  )
}

/** Two-piece suit base. */
export function ClothingSuit({ fabric }: PartProps) {
  const dark = shade(fabric, 0.68)
  return (
    <g>
      <path
        d="M43 70 Q33 72.5 26 77.5 Q18.5 83 16.5 94 L15 120 L85 120 L83.5 94 Q81.5 83 74 77.5 Q67 72.5 57 70 Q53.5 73 50 73 Q46.5 73 43 70 Z"
        fill={fabric}
      />
      <path d="M25 79 Q20 90 19 120 L23.5 120 Q24 92 28.5 80.5 Z" fill={dark} opacity="0.5" />
      <path d="M75 79 Q80 90 81 120 L76.5 120 Q76 92 71.5 80.5 Z" fill={dark} opacity="0.5" />
    </g>
  )
}

/** Suit front: shirt V, notch lapels, tie in the wearer's accent color. */
export function ClothingSuitCollar({ fabric, accent = '#1A9B8E' }: PartProps) {
  const dark = shade(fabric, 0.6)
  const shirt = '#E6E1D6'
  return (
    <g>
      {/* shirt triangle */}
      <path d="M43.5 72.5 Q47 76.5 50 76.5 Q53 76.5 56.5 72.5 L54 88 L46 88 Z" fill={shirt} />
      <path
        d="M44.5 73.5 L48.8 78.2 L47 80 Z M55.5 73.5 L51.2 78.2 L53 80 Z"
        fill={shade(shirt, 0.85)}
      />
      {/* tie */}
      <path d="M48.6 78.4 L50 77 L51.4 78.4 L50.8 80.2 L49.2 80.2 Z" fill={shade(accent, 0.75)} />
      <path d="M49.2 80.2 L50.8 80.2 L51.6 92 L50 94.5 L48.4 92 Z" fill={accent} />
      <path
        d="M49.2 80.2 L50.8 80.2 L51.6 92 L50 94.5"
        fill="none"
        stroke={shade(accent, 0.6)}
        strokeWidth="0.4"
        opacity="0.7"
      />
      {/* lapels */}
      <path d="M43.5 71.5 Q40 78 40.5 90 L46.5 84 L45.5 74.5 Z" fill={dark} />
      <path d="M56.5 71.5 Q60 78 59.5 90 L53.5 84 L54.5 74.5 Z" fill={dark} />
      <path
        d="M43.5 71.5 Q40 78 40.5 90 M56.5 71.5 Q60 78 59.5 90"
        fill="none"
        stroke={shade(fabric, 0.5)}
        strokeWidth="0.5"
        opacity="0.7"
      />
    </g>
  )
}

/** Kaftan base — softer shoulders, straight drape. */
export function ClothingKaftan({ fabric }: PartProps) {
  const dark = shade(fabric, 0.72)
  const light = shade(fabric, 1.2)
  return (
    <g>
      <path
        d="M43 70 Q34 72 27.5 77 Q20.5 82.5 18.5 93 L17 120 L83 120 L81.5 93 Q79.5 82.5 72.5 77 Q66 72 57 70 Q53.5 73 50 73 Q46.5 73 43 70 Z"
        fill={fabric}
      />
      <path d="M28 79 Q23 90 22 120 L26 120 Q26.5 92 30.5 80.5 Z" fill={dark} opacity="0.5" />
      <path d="M72 79 Q77 90 78 120 L74 120 Q73.5 92 69.5 80.5 Z" fill={dark} opacity="0.5" />
      <path
        d="M36 75 Q33.5 92 33.5 120 M64 75 Q66.5 92 66.5 120"
        fill="none"
        stroke={light}
        strokeWidth="0.6"
        opacity="0.3"
      />
    </g>
  )
}

/** Kaftan front: mandarin collar + embroidered placket strip. */
export function ClothingKaftanCollar({ fabric, accent = '#D4AF37' }: PartProps) {
  const dark = shade(fabric, 0.7)
  return (
    <g>
      {/* mandarin band around the neck base */}
      <path
        d="M42.5 72 Q46.5 76.2 50 76.2 Q53.5 76.2 57.5 72 L58.5 75.5 Q54 79.8 50 79.8 Q46 79.8 41.5 75.5 Z"
        fill={shade(fabric, 0.9)}
      />
      <path
        d="M42 74.8 Q46.5 79 50 79 Q53.5 79 58 74.8"
        fill="none"
        stroke={dark}
        strokeWidth="0.6"
        opacity="0.8"
      />
      {/* placket with embroidery */}
      <rect x="47.6" y="79.5" width="4.8" height="22" fill={shade(fabric, 0.9)} />
      <path
        d="M47.6 79.5 L47.6 101.5 M52.4 79.5 L52.4 101.5"
        stroke={dark}
        strokeWidth="0.5"
        opacity="0.8"
      />
      <path
        d="M49 82 q1 1.4 2 0 M49 86 q1 1.4 2 0 M49 90 q1 1.4 2 0 M49 94 q1 1.4 2 0 M49 98 q1 1.4 2 0"
        fill="none"
        stroke={accent}
        strokeWidth="0.6"
        opacity="0.85"
      />
    </g>
  )
}

/** Senator suit base — crisp, structured shoulders. */
export function ClothingSenator({ fabric }: PartProps) {
  const dark = shade(fabric, 0.8)
  return (
    <g>
      <path
        d="M43 70 Q34 72 27 77 Q19.5 82.5 17.5 93.5 L16 120 L84 120 L82.5 93.5 Q80.5 82.5 73 77 Q66 72 57 70 Q53.5 73 50 73 Q46.5 73 43 70 Z"
        fill={fabric}
      />
      <path d="M27.5 78.5 Q22 90 21 120 L25.5 120 Q26 92 30.5 80 Z" fill={dark} opacity="0.7" />
      <path d="M72.5 78.5 Q78 90 79 120 L74.5 120 Q74 92 69.5 80 Z" fill={dark} opacity="0.7" />
      {/* chest pocket */}
      <path
        d="M30 92 L38 92 L37.6 96.5 L30.4 96.5 Z"
        fill="none"
        stroke={dark}
        strokeWidth="0.6"
        opacity="0.9"
      />
    </g>
  )
}

/** Senator front: standing band collar + short buttoned placket. */
export function ClothingSenatorCollar({ fabric }: PartProps) {
  const dark = shade(fabric, 0.78)
  return (
    <g>
      <path
        d="M42.5 71.5 Q46.5 75.8 50 75.8 Q53.5 75.8 57.5 71.5 L58.5 75 Q54 79.4 50 79.4 Q46 79.4 41.5 75 Z"
        fill={fabric}
      />
      <path
        d="M42 74.2 Q46.5 78.6 50 78.6 Q53.5 78.6 58 74.2"
        fill="none"
        stroke={dark}
        strokeWidth="0.7"
        opacity="0.9"
      />
      <path
        d="M48.4 79.2 L48.4 98 M51.6 79.2 L51.6 98"
        stroke={dark}
        strokeWidth="0.5"
        opacity="0.8"
      />
      <circle cx="50" cy="83" r="0.8" fill={dark} />
      <circle cx="50" cy="88.5" r="0.8" fill={dark} />
      <circle cx="50" cy="94" r="0.8" fill={dark} />
    </g>
  )
}

/** Tailored blazer base (Neo). */
export function ClothingBlazer({ fabric }: PartProps) {
  const dark = shade(fabric, 0.68)
  return (
    <g>
      <path
        d="M43.5 70.5 Q35 72.5 29 77 Q22 82.5 20 93.5 L18.5 120 L81.5 120 L80 93.5 Q78 82.5 71 77 Q65 72.5 56.5 70.5 Q53.5 73.5 50 73.5 Q46.5 73.5 43.5 70.5 Z"
        fill={fabric}
      />
      <path d="M28.5 79 Q24 90 23 120 L27 120 Q27.5 92 31.5 80.5 Z" fill={dark} opacity="0.5" />
      <path d="M71.5 79 Q76 90 77 120 L73 120 Q72.5 92 68.5 80.5 Z" fill={dark} opacity="0.5" />
    </g>
  )
}

/** Blazer front: shell top in the V, slim notch lapels. */
export function ClothingBlazerFront({ fabric, accent = '#3B9FE0' }: PartProps) {
  const dark = shade(fabric, 0.58)
  const shell = shade(accent, 0.68)
  return (
    <g>
      <path d="M44 72.5 Q47 76.5 50 76.5 Q53 76.5 56 72.5 L55 92 L45 92 Z" fill={shell} />
      <path d="M44 71.5 Q41 79 41.5 93 L47.5 85 L45.8 74.5 Z" fill={dark} />
      <path d="M56 71.5 Q59 79 58.5 93 L52.5 85 L54.2 74.5 Z" fill={dark} />
      <path
        d="M44 71.5 Q41 79 41.5 93 M56 71.5 Q59 79 58.5 93"
        fill="none"
        stroke={shade(fabric, 0.45)}
        strokeWidth="0.5"
        opacity="0.7"
      />
    </g>
  )
}

/** Open jacket over a plain tee (Dayo) — fabric prop colors the jacket. */
export function ClothingTeeUnderJacket({ fabric }: PartProps) {
  const jacket = fabric
  const jacketHi = shade(fabric, 1.35)
  const tee = '#DCD6CA'
  return (
    <g>
      {/* tee */}
      <path
        d="M43.5 70.5 Q36 72.5 31 76.5 Q25 81.5 23.5 92 L22.5 120 L77.5 120 L76.5 92 Q75 81.5 69 76.5 Q64 72.5 56.5 70.5 Q53.5 73.5 50 73.5 Q46.5 73.5 43.5 70.5 Z"
        fill={tee}
      />
      {/* crew neck band */}
      <path
        d="M43.5 71 Q47 75 50 75 Q53 75 56.5 71 L57.3 73.5 Q53.5 77.6 50 77.6 Q46.5 77.6 42.7 73.5 Z"
        fill={shade(tee, 0.8)}
      />
      {/* open jacket panels */}
      <path
        d="M43 70.5 Q33 73 27.5 78 Q21.5 83.5 20 94 L19 120 L36 120 Q35 96 38.5 84 Q40.5 77 43.5 72.5 Z"
        fill={jacket}
      />
      <path
        d="M57 70.5 Q67 73 72.5 78 Q78.5 83.5 80 94 L81 120 L64 120 Q65 96 61.5 84 Q59.5 77 56.5 72.5 Z"
        fill={jacket}
      />
      <path
        d="M43.5 72.5 Q40.5 77 38.5 84 Q35 96 36 120 M56.5 72.5 Q59.5 77 61.5 84 Q65 96 64 120"
        fill="none"
        stroke={jacketHi}
        strokeWidth="0.8"
        opacity="0.8"
      />
      {/* jacket collar */}
      <path
        d="M43 70.5 L39 76.5 L42.5 79 L45.5 73 Z M57 70.5 L61 76.5 L57.5 79 L54.5 73 Z"
        fill={jacketHi}
      />
    </g>
  )
}

/** Service uniform base — epaulettes, breast pockets, button line. */
export function ClothingUniform({ fabric }: PartProps) {
  const dark = shade(fabric, 0.65)
  const gold = '#C9A227'
  return (
    <g>
      <path
        d="M43 70 Q33.5 72 26.5 77 Q19 82.5 17 93.5 L15.5 120 L84.5 120 L83 93.5 Q81 82.5 74 77 Q66.5 72 57 70 Q53.5 73 50 73 Q46.5 73 43 70 Z"
        fill={fabric}
      />
      <path d="M27 78.5 Q21.5 90 20.5 120 L25 120 Q25.5 92 30 80 Z" fill={dark} opacity="0.6" />
      <path d="M73 78.5 Q78.5 90 79.5 120 L75 120 Q74.5 92 70 80 Z" fill={dark} opacity="0.6" />
      {/* epaulettes */}
      <path d="M27 77.5 L40 72.5 L41.5 75.5 L28.5 80.5 Z" fill={dark} />
      <path d="M73 77.5 L60 72.5 L58.5 75.5 L71.5 80.5 Z" fill={dark} />
      <rect
        x="31"
        y="75.2"
        width="3"
        height="2"
        rx="0.4"
        fill={gold}
        transform="rotate(-21 32.5 76.2)"
      />
      <rect
        x="66"
        y="75.2"
        width="3"
        height="2"
        rx="0.4"
        fill={gold}
        transform="rotate(21 67.5 76.2)"
      />
      {/* breast pockets */}
      <path
        d="M29 94 L39 94 L38.5 101 L29.5 101 Z M61 94 L71 94 L70.5 101 L61.5 101 Z"
        fill="none"
        stroke={dark}
        strokeWidth="0.7"
        opacity="0.9"
      />
      <path d="M32.5 94 L35.5 94 L34 97 Z M64.5 94 L67.5 94 L66 97 Z" fill={dark} opacity="0.8" />
    </g>
  )
}

/** Uniform front: collar points + top button. */
export function ClothingUniformCollar({ fabric }: PartProps) {
  const dark = shade(fabric, 0.6)
  const gold = '#C9A227'
  return (
    <g>
      <path
        d="M43.5 71.5 L47.5 77.5 L43 81 L40.5 74.5 Z M56.5 71.5 L52.5 77.5 L57 81 L59.5 74.5 Z"
        fill={dark}
      />
      <path d="M50 78 L50 104" stroke={dark} strokeWidth="0.7" opacity="0.8" />
      <circle cx="50" cy="82" r="0.9" fill={gold} />
      <circle cx="50" cy="89" r="0.9" fill={gold} />
      <circle cx="50" cy="96" r="0.9" fill={gold} />
    </g>
  )
}
