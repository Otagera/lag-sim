import { shade } from '../palette'
import type { PartProps } from '../types'

/*
 * Shared facial geometry all parts align to (viewBox 0 0 100 120):
 *   brow line y=34 · eye line y=39 · nose base y=49 · mouth y=56
 *   hairline y≈22 · ears y 36–48 · neck x 43–57 · shoulder line y≈78
 * Each head draws: neck (behind chin) → skull → side shadow → rim light → ears.
 */

function Neck({ skin }: { skin: string }) {
  return (
    <g>
      <path
        d="M43.5 54 L43.5 73 Q43.5 76.5 47 77.5 L53 77.5 Q56.5 76.5 56.5 73 L56.5 54 Z"
        fill={skin}
      />
      {/* under-jaw shadow cast onto the neck */}
      <path
        d="M43.5 56 Q46 63 50 63.8 Q54 63 56.5 56 L56.5 67 Q50 69.5 43.5 67 Z"
        fill={shade(skin, 0.62)}
        opacity="0.65"
      />
    </g>
  )
}

function Ears({ skin, lx, rx, y = 37 }: { skin: string; lx: number; rx: number; y?: number }) {
  const sh = shade(skin, 0.68)
  return (
    <g>
      <path
        d={`M${lx + 1.6} ${y} Q${lx - 2.2} ${y - 1} ${lx - 2.4} ${y + 4.5} Q${lx - 2.5} ${y + 9.5} ${lx + 1.4} ${y + 10.2} Q${lx + 0.4} ${y + 5} ${lx + 1.6} ${y} Z`}
        fill={skin}
      />
      <path
        d={`M${lx - 0.6} ${y + 2} Q${lx - 1.4} ${y + 5} ${lx - 0.2} ${y + 8}`}
        fill="none"
        stroke={sh}
        strokeWidth="0.7"
        opacity="0.7"
      />
      <path
        d={`M${rx - 1.6} ${y} Q${rx + 2.2} ${y - 1} ${rx + 2.4} ${y + 4.5} Q${rx + 2.5} ${y + 9.5} ${rx - 1.4} ${y + 10.2} Q${rx - 0.4} ${y + 5} ${rx - 1.6} ${y} Z`}
        fill={skin}
      />
      <path
        d={`M${rx + 0.6} ${y + 2} Q${rx + 1.4} ${y + 5} ${rx + 0.2} ${y + 8}`}
        fill="none"
        stroke={sh}
        strokeWidth="0.7"
        opacity="0.7"
      />
    </g>
  )
}

/** Broad, heavyset head with jowls — Fashemu, elder commissioners. Chin at y≈66. */
export function HeadBroad({ skin }: PartProps) {
  return (
    <g>
      <Neck skin={skin} />
      <path
        d="M50 12.5 Q65.5 12.5 69 26 Q71 37 69.5 47 Q68 58 59.5 63.5 Q54 66.3 50 66.3 Q46 66.3 40.5 63.5 Q32 58 30.5 47 Q29 37 31 26 Q34.5 12.5 50 12.5 Z"
        fill={skin}
      />
      {/* light from the left: shadow crescent down the right side */}
      <path
        d="M59 15 Q68 22 69.3 35 Q70 46 66.5 54.5 Q63.5 61 58 64 Q63 55 64.5 45 Q66.5 29 59 15 Z"
        fill="#000"
        opacity="0.11"
      />
      {/* jowl weight */}
      <path
        d="M38 55 Q40 61 45 63.5 M62 55 Q60 61 55 63.5"
        fill="none"
        stroke={shade(skin, 0.7)}
        strokeWidth="0.9"
        opacity="0.5"
      />
      <path
        d="M41 15 Q34 20 32.5 30"
        fill="none"
        stroke="#fff"
        strokeWidth="1"
        opacity="0.06"
        strokeLinecap="round"
      />
      <Ears skin={skin} lx={31.5} rx={68.5} />
    </g>
  )
}

/** Balanced oval head — Chief of Staff, SMJ, deputies. Chin at y≈64. */
export function HeadOval({ skin }: PartProps) {
  return (
    <g>
      <Neck skin={skin} />
      <path
        d="M50 13 Q63 13 66.5 27 Q68 37 65.5 46 Q63 56 56.5 61.5 Q53 64.3 50 64.3 Q47 64.3 43.5 61.5 Q37 56 34.5 46 Q32 37 33.5 27 Q37 13 50 13 Z"
        fill={skin}
      />
      <path
        d="M58 15.5 Q66 22 66.8 34 Q67.2 44 63.5 52.5 Q61 58.5 56 61.8 Q60.5 53.5 61.8 44 Q63.5 28.5 58 15.5 Z"
        fill="#000"
        opacity="0.1"
      />
      <path
        d="M42 15.5 Q36 20.5 34.5 29"
        fill="none"
        stroke="#fff"
        strokeWidth="1"
        opacity="0.06"
        strokeLinecap="round"
      />
      <Ears skin={skin} lx={34.5} rx={65.5} />
    </g>
  )
}

/** Angular, tapered head — Dayo, younger men. Chin at y≈63. */
export function HeadAngular({ skin }: PartProps) {
  return (
    <g>
      <Neck skin={skin} />
      <path
        d="M50 13.5 Q62.5 13.5 65 26.5 Q66.5 35.5 64.5 44 Q62 53.5 55.5 59.5 Q52.5 62.8 50 62.8 Q47.5 62.8 44.5 59.5 Q38 53.5 35.5 44 Q33.5 35.5 35 26.5 Q37.5 13.5 50 13.5 Z"
        fill={skin}
      />
      <path
        d="M57 16 Q64.5 22 65.2 33 Q65.7 42 62.5 50.5 Q60 56.5 55.5 60 Q59.5 52 60.7 43 Q62.3 28 57 16 Z"
        fill="#000"
        opacity="0.1"
      />
      {/* cheekbone definition */}
      <path
        d="M38.5 42 Q40 46 43 48.5 M61.5 42 Q60 46 57 48.5"
        fill="none"
        stroke={shade(skin, 0.72)}
        strokeWidth="0.8"
        opacity="0.45"
      />
      <path
        d="M42.5 16 Q37.5 21 36 29"
        fill="none"
        stroke="#fff"
        strokeWidth="1"
        opacity="0.06"
        strokeLinecap="round"
      />
      <Ears skin={skin} lx={35.8} rx={64.2} />
    </g>
  )
}

/** Slimmer feminine head with a softer taper — Neo, gele commissioner. Chin at y≈63. */
export function HeadSlim({ skin }: PartProps) {
  return (
    <g>
      <Neck skin={skin} />
      <path
        d="M50 14 Q61 14 63.5 27 Q65 36 63.5 44.5 Q61.5 54 55 60 Q52.5 62.8 50 62.8 Q47.5 62.8 45 60 Q38.5 54 36.5 44.5 Q35 36 36.5 27 Q39 14 50 14 Z"
        fill={skin}
      />
      <path
        d="M56 16.5 Q63 22.5 63.6 33.5 Q64 42.5 61 50.5 Q58.8 56.5 55 59.8 Q58.5 52 59.6 43 Q61 28.5 56 16.5 Z"
        fill="#000"
        opacity="0.09"
      />
      <path
        d="M43.5 16.5 Q39 21 37.8 28.5"
        fill="none"
        stroke="#fff"
        strokeWidth="1"
        opacity="0.07"
        strokeLinecap="round"
      />
      <Ears skin={skin} lx={36.8} rx={63.2} y={38} />
    </g>
  )
}
