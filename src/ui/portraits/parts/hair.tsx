import { shade } from '../palette'
import type { PartProps } from '../types'

/*
 * Hair sits over the cranium (top y≈13, hairline y≈22–24).
 * Silhouette is the primary identity signal at small sizes — each style
 * must read as a distinct shape, not a generic cap.
 */

const HAIR = '#14100C'

/** Skull-hugging low fade with a crisp hairline. */
export function HairLowFade({ skin }: PartProps) {
  return (
    <g>
      <path
        d="M33.8 30 Q32.5 18 40 13.6 Q45 11 50 11 Q55 11 60 13.6 Q67.5 18 66.2 30 Q66 24 62.5 20.5 L62 23.5 Q56.5 20.4 50 20.4 Q43.5 20.4 38 23.5 L37.5 20.5 Q34 24 33.8 30 Z"
        fill={HAIR}
      />
      {/* fade at the temples */}
      <path
        d="M34.2 27 Q34.8 23 37 20.8 L37.4 26.5 Z M65.8 27 Q65.2 23 63 20.8 L62.6 26.5 Z"
        fill={shade(skin, 0.75)}
        opacity="0.5"
      />
      <path
        d="M40 14.8 Q45 12.4 50 12.4 Q55 12.4 60 14.8"
        fill="none"
        stroke="#2E2620"
        strokeWidth="0.7"
        opacity="0.6"
      />
    </g>
  )
}

/** Short crop gone grey at the temples — age and office. */
export function HairGreyTemp({ skin: _skin }: PartProps) {
  return (
    <g>
      <path
        d="M33.5 31 Q32 18 40 13.4 Q45 10.8 50 10.8 Q55 10.8 60 13.4 Q68 18 66.5 31 Q66.2 24 62.5 20.2 L62 24 Q56.5 20.8 50 20.8 Q43.5 20.8 38 24 L37.5 20.2 Q33.8 24 33.5 31 Z"
        fill={HAIR}
      />
      {/* grey temple patches */}
      <path
        d="M34 29.5 Q34.2 23.5 37.6 20.4 L37.9 25.8 Q36 27.5 35.2 30.5 Z"
        fill="#948C82"
        opacity="0.9"
      />
      <path
        d="M66 29.5 Q65.8 23.5 62.4 20.4 L62.1 25.8 Q64 27.5 64.8 30.5 Z"
        fill="#948C82"
        opacity="0.9"
      />
      {/* grey flecks through the crown */}
      <path
        d="M42 15.5 Q45 14 47.5 13.8 M53.5 13.9 Q56.5 14.4 58.8 15.8 M39.5 17.8 Q41 16.6 43 16"
        fill="none"
        stroke="#8D857B"
        strokeWidth="0.6"
        opacity="0.7"
        strokeLinecap="round"
      />
    </g>
  )
}

/** Full natural volume — a proper afro, well past the skull on every side. */
export function HairNaturalVolume({ skin: _skin }: PartProps) {
  return (
    <g>
      <path
        d="M31 33 Q26.5 31 26 24 Q25.6 17 30 12.5 Q33 8.5 38.5 6.5 Q44 4.4 50 4.4 Q56 4.4 61.5 6.5 Q67 8.5 70 12.5 Q74.4 17 74 24 Q73.5 31 69 33 Q70.5 28 69.5 23.5 Q70.8 20 68 16.5 Q66.5 13.5 62.5 11.5 Q57 8.8 50 8.8 Q43 8.8 37.5 11.5 Q33.5 13.5 32 16.5 Q29.2 20 30.5 23.5 Q29.5 28 31 33 Z"
        fill={HAIR}
      />
      {/* inner mass with a slightly warmer edge so the volume reads */}
      <path
        d="M32.5 30 Q30.8 22 34.5 16 Q38 10.8 44 9.2 Q47 8.4 50 8.4 Q53 8.4 56 9.2 Q62 10.8 65.5 16 Q69.2 22 67.5 30 Q66 24 62 20.5 Q56.8 16.6 50 16.6 Q43.2 16.6 38 20.5 Q34 24 32.5 30 Z"
        fill="#1D1712"
      />
      {/* pick-texture arcs */}
      <path
        d="M37 13.5 Q40 11.4 43.5 10.6 M52 10.2 Q56.5 10.8 60 12.8 M31.5 21 Q32.5 17.5 35 14.8 M65 14.8 Q67.5 17.5 68.5 21 M42 12.2 Q45.5 11 49 11"
        fill="none"
        stroke="#332921"
        strokeWidth="0.65"
        opacity="0.75"
        strokeLinecap="round"
      />
    </g>
  )
}

/**
 * Gele head-tie — sculptural pleated fan, fully covering the hair.
 * Uses fabric + accent so it pairs with the wearer's outfit.
 */
export function HairGeleWrap({ fabric: outfit, accent = '#D4AF37' }: PartProps) {
  // The gele is cut from its own rich fabric (the accent), not the outfit —
  // otherwise it reads as hair at a glance.
  const fabric = shade(accent, 0.85)
  const dark = shade(accent, 0.55)
  const light = shade(accent, 1.25)
  const stitch = shade(outfit, 1.6)
  return (
    <g>
      {/* base wrap around the cranium — covers the hair completely */}
      <path
        d="M32.5 32 Q30.5 19 38.5 13 Q44 8.8 50 8.8 Q56 8.8 61.5 13 Q69.5 19 67.5 32 Q66.5 24.5 61.5 20.5 L61 25.5 Q56 22 50 22 Q44 22 39 25.5 L38.5 20.5 Q33.5 24.5 32.5 32 Z"
        fill={fabric}
      />
      {/* rounded tied folds rising above the wrap, leaning right — soft fabric, not spikes */}
      <path
        d="M35 17 Q31.5 9.5 37 5 Q41.5 1.6 46.5 3 Q49 3.8 49.5 6 Q43.5 6.2 40.5 10.5 Q38.5 13.5 38.8 17 Q36.5 16.5 35 17 Z"
        fill={dark}
      />
      <path
        d="M40.5 13.5 Q40.5 5 48.5 2.4 Q54 0.8 58 3.4 Q60 4.8 59.8 7 Q52.5 6.8 48.5 11 Q45.8 14 45.8 17.2 Q42.8 16 40.5 13.5 Z"
        fill={light}
      />
      <path
        d="M48.5 13.5 Q51.5 5.5 59.5 5.4 Q65.5 5.6 67.8 10 Q68.8 12.2 67.8 14.5 Q61.5 12 56.5 15 Q53 17.2 52.2 20.2 Q50 16.8 48.5 13.5 Z"
        fill={fabric}
      />
      {/* side knot where the tie gathers */}
      <path
        d="M62 17 Q67.5 15.5 69.5 19 Q71 22 68.5 25 Q66 27.5 62.5 26 Q64.5 23.5 64 21 Q63.5 18.8 62 17 Z"
        fill={dark}
      />
      {/* soft fold shading */}
      <path
        d="M40.5 10.5 Q38.5 13.5 38.8 17 M48.5 11 Q45.8 14 45.8 17.2 M56.5 15 Q53 17.2 52.2 20.2"
        fill="none"
        stroke={shade(accent, 0.42)}
        strokeWidth="0.7"
        opacity="0.6"
        strokeLinecap="round"
      />
      <path
        d="M37.5 6.5 Q41 3.6 45.5 3.6 M49.5 4 Q54 2.4 57.5 4.2 M58 7 Q63 6.4 66.5 9.5"
        fill="none"
        stroke={shade(accent, 1.45)}
        strokeWidth="0.6"
        opacity="0.5"
        strokeLinecap="round"
      />
      {/* stitching along the brow edge, picked from the outfit color */}
      <path
        d="M34.5 26 Q42 21.5 50 21.5 Q58 21.5 65.5 26"
        fill="none"
        stroke={stitch}
        strokeWidth="0.9"
        strokeDasharray="2.2 1.6"
        opacity="0.8"
      />
    </g>
  )
}

/** Feminine short crop — soft rounded edge, defined baby-hair line. */
export function HairShortCrop({ skin: _skin }: PartProps) {
  return (
    <g>
      <path
        d="M35 31 Q33 18 40.5 13 Q45 10.2 50 10.2 Q55 10.2 59.5 13 Q67 18 65 31 Q64.6 24.5 61 21 L60.4 24.8 Q55.5 21.4 50 21.4 Q44.5 21.4 39.6 24.8 L39 21 Q35.4 24.5 35 31 Z"
        fill={HAIR}
      />
      {/* soft crown highlight + edge control */}
      <path
        d="M42 14.2 Q46 12.2 50 12.2 Q54 12.2 58 14.2"
        fill="none"
        stroke="#332A22"
        strokeWidth="0.8"
        opacity="0.7"
      />
      <path
        d="M39.8 24.4 Q44.5 21.6 50 21.6 Q55.5 21.6 60.2 24.4"
        fill="none"
        stroke={HAIR}
        strokeWidth="0.9"
        opacity="0.9"
      />
    </g>
  )
}
