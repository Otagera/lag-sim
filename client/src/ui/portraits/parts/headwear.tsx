import { shade } from '../palette'
import type { PartProps } from '../types'

/**
 * Fila (abetí ajá — "like dog's ears") — the tall soft-structured Yoruba cap.
 * Three things make it read: height above the skull, the crown creased and
 * flopping to one side, and the big ear-flap folded down over the right ear.
 */
export function Fila({ fabric, accent = '#D4AF37' }: PartProps) {
  const dark = shade(fabric, 0.6)
  const darker = shade(fabric, 0.45)
  const light = shade(fabric, 1.25)
  return (
    <g>
      {/* right dog-ear flap — covers the ear ON the face, inner edge visible against skin */}
      <path
        d="M58.5 21.5 Q67.5 20.5 71 25.5 Q74 30 73 36 Q71.8 42 66 44.5 Q68.4 38.5 67.4 32.5 Q66.4 26.5 60 24.2 Z"
        fill={fabric}
      />
      {/* fold shadow along the flap's inner edge — separates it from the cheek */}
      <path
        d="M60 24.2 Q66.4 26.5 67.4 32.5 Q68.4 38.5 66 44.5"
        fill="none"
        stroke={darker}
        strokeWidth="1"
        opacity="0.85"
        strokeLinecap="round"
      />
      <path
        d="M58.5 21.5 Q67.5 20.5 71 25.5"
        fill="none"
        stroke={darker}
        strokeWidth="0.7"
        opacity="0.7"
      />
      {/* seam stitching down the flap */}
      <path
        d="M63 26.5 Q68 29 68.8 34.5 Q69.4 38.5 67.8 42"
        fill="none"
        stroke={dark}
        strokeWidth="0.6"
        strokeDasharray="1.6 1.3"
        opacity="0.7"
      />

      {/* tall crown — near-vertical sides, gently rounded top, leaning right */}
      <path
        d="M37 24 Q35.8 14 38.2 6.8 Q40.5 0.2 46.5 -1.4 Q53 -3 58.5 0.2 Q63.2 3 64.8 9.5 Q66.2 15.5 66 23.4 Q59.5 19.7 50.5 19.7 Q43 19.7 37 24 Z"
        fill={fabric}
      />
      {/* diagonal pinch crease from the top-left shoulder down toward the band */}
      <path
        d="M44.5 0.2 Q50.5 5.5 53.8 12.5 Q55.6 16.5 55.9 19.8"
        fill="none"
        stroke={dark}
        strokeWidth="1"
        opacity="0.85"
        strokeLinecap="round"
      />
      {/* right panel falls into shadow past the crease — the two-panel structure */}
      <path
        d="M44.5 0.2 Q52 -2.6 58.5 0.2 Q63.2 3 64.8 9.5 Q66.2 15.5 66 23.4 Q61.2 20.6 55.9 19.9 Q55.6 16.5 53.8 12.5 Q50.5 5.5 44.5 0.2 Z"
        fill={dark}
        opacity="0.45"
      />
      {/* highlight along the front-left panel */}
      <path
        d="M40 4.5 Q38.2 10.5 38.6 18"
        fill="none"
        stroke={light}
        strokeWidth="1"
        opacity="0.4"
        strokeLinecap="round"
      />
      {/* left flap tucked UP against the crown — seam + sliver */}
      <path
        d="M37.2 23.6 Q36.4 16 38.6 9.5 L40.8 11 Q39 16.5 39.4 22.2 Z"
        fill={light}
        opacity="0.35"
      />
      <path
        d="M38.9 10 Q37.2 16 37.6 23.2"
        fill="none"
        stroke={dark}
        strokeWidth="0.8"
        opacity="0.75"
        strokeLinecap="round"
      />

      {/* slim band at the brow */}
      <path
        d="M37 24 Q43 19.8 50.5 19.8 Q59.5 19.8 66 23.5 L66 26.4 Q59.5 22.6 50.5 22.6 Q43 22.6 37 26.9 Z"
        fill={darker}
      />
      {/* embroidery along the band */}
      <path
        d="M38.2 24.9 Q44 21.6 50.5 21.6 Q58 21.6 64.8 24.8"
        fill="none"
        stroke={accent}
        strokeWidth="0.75"
        strokeDasharray="1.8 1.4"
        opacity="0.85"
      />
    </g>
  )
}

/** Kufi — shallow round cap with vertical ribbing. */
export function PlainCap({ fabric }: PartProps) {
  const dark = shade(fabric, 0.6)
  return (
    <g>
      <path
        d="M34.5 26 Q33.5 15.5 41 11.2 Q45.5 8.8 50 8.8 Q54.5 8.8 59 11.2 Q66.5 15.5 65.5 26 Q59 21.8 50 21.8 Q41 21.8 34.5 26 Z"
        fill={fabric}
      />
      {/* band */}
      <path
        d="M34.5 26 Q41 21.8 50 21.8 Q59 21.8 65.5 26 L65.5 28.6 Q59 24.6 50 24.6 Q41 24.6 34.5 28.6 Z"
        fill={dark}
      />
      {/* ribbing */}
      <path
        d="M42 11.5 Q41 16 41.5 21.5 M50 9.4 L50 21.6 M58 11.5 Q59 16 58.5 21.5 M45.8 10 Q45.2 15.5 45.6 21.4 M54.2 10 Q54.8 15.5 54.4 21.4"
        fill="none"
        stroke={dark}
        strokeWidth="0.55"
        opacity="0.7"
      />
    </g>
  )
}
