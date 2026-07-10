import { shade } from '../palette'
import type { FaceParams, PartProps } from '../types'

/*
 * Faces align to the shared grid in heads.tsx:
 *   brow y=34 · eye y=39 · nose base y=49 · mouth y=56
 * Features are FILLED shapes, not hairline strokes — they must survive 48px.
 *
 * There are no per-character face components: `Face` renders `FaceParams`
 * data from the character's BustSpec. New face = new params, not new paths.
 * The primitives are exported so bespoke faces stay possible if one is ever
 * needed beyond what the params express.
 */

const INK = '#17100C'

/* ── feature primitives ── */

export function Brow({
  cx,
  y,
  w = 6.5,
  tilt = 0,
  weight = 2.2,
  color = INK,
}: {
  cx: number
  y: number
  w?: number
  tilt?: number
  weight?: number
  color?: string
}) {
  // tilt > 0 raises the outer end (left brow mirrors via negative tilt from caller)
  const x1 = cx - w
  const x2 = cx + w
  return (
    <path
      d={`M${x1} ${y + tilt} Q${cx} ${y - weight * 0.4} ${x2} ${y - tilt} L${x2} ${y - tilt + weight} Q${cx} ${y + weight * 0.7} ${x1} ${y + tilt + weight} Z`}
      fill={color}
    />
  )
}

export function Eye({
  cx,
  cy,
  skin,
  w = 4.6,
  heavy = false,
  wide = false,
  lash = false,
  soft = false,
  iris = '#241610',
}: {
  cx: number
  cy: number
  skin: string
  w?: number
  heavy?: boolean
  wide?: boolean
  lash?: boolean
  soft?: boolean
  iris?: string
}) {
  const socket = shade(skin, 0.72)
  const lidDrop = heavy ? 1.1 : 0
  const open = wide ? 2.6 : 2.1
  return (
    <g>
      {/* socket shading */}
      <ellipse
        cx={cx}
        cy={cy + 0.4}
        rx={w + 1.6}
        ry={3.1}
        fill={socket}
        opacity={soft ? 0.18 : 0.4}
      />
      {/* sclera hint — muted and derived from the skin, never bright white
          (a fixed light grey turns ghostly on dark skin) */}
      <path
        d={`M${cx - w} ${cy} Q${cx} ${cy - open + lidDrop} ${cx + w} ${cy - 0.2} Q${cx} ${cy + 2} ${cx - w} ${cy} Z`}
        fill={shade(skin, 1.75)}
        opacity={wide ? 0.6 : 0.45}
      />
      <circle cx={cx + 0.3} cy={cy - 0.2} r={1.75} fill={iris} />
      <circle cx={cx + 0.9} cy={cy - 0.8} r={0.42} fill="#fff" opacity="0.55" />
      {/* upper lid — the weight of the gaze */}
      <path
        d={`M${cx - w - 0.6} ${cy + 0.2} Q${cx} ${cy - open + lidDrop} ${cx + w + 0.6} ${cy - 0.2}`}
        fill="none"
        stroke={INK}
        strokeWidth={lash ? 1.7 : 1.35}
        strokeLinecap="round"
      />
      {heavy && (
        <path
          d={`M${cx - w} ${cy - 2.6} Q${cx} ${cy - 3.9 + lidDrop} ${cx + w} ${cy - 2.9}`}
          fill="none"
          stroke={shade(skin, 0.6)}
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.8"
        />
      )}
      {/* lower lid */}
      <path
        d={`M${cx - w + 1} ${cy + 1.5} Q${cx} ${cy + 2.3} ${cx + w - 0.6} ${cy + 1.2}`}
        fill="none"
        stroke={shade(skin, 0.62)}
        strokeWidth="0.7"
        opacity="0.7"
      />
    </g>
  )
}

export function Nose({ skin, w = 7.5, y = 49 }: { skin: string; w?: number; y?: number }) {
  const sh = shade(skin, 0.66)
  const dark = shade(skin, 0.45)
  const hw = w / 2
  return (
    <g>
      {/* bridge shadow (light from left → shadow on right of bridge) */}
      <path
        d={'M51.4 38.5 Q52.2 44 51.8 46.5'}
        fill="none"
        stroke={sh}
        strokeWidth="1"
        opacity="0.55"
        strokeLinecap="round"
      />
      {/* wings + base */}
      <path
        d={`M${50 - hw} ${y - 0.5} Q${50 - hw - 0.8} ${y + 1.6} ${50 - hw + 1.6} ${y + 2.2} Q${48} ${y + 3} 50 ${y + 3} Q${52} ${y + 3} ${50 + hw - 1.6} ${y + 2.2} Q${50 + hw + 0.8} ${y + 1.6} ${50 + hw} ${y - 0.5} Q${50 + hw - 1} ${y - 2.2} ${50 + hw - 2.4} ${y - 2.6} Q${50 + hw - 1.2} ${y - 0.4} ${50 + hw - 2.6} ${y + 0.8} Q${50} ${y + 1.8} ${50 - hw + 2.6} ${y + 0.8} Q${50 - hw + 1.2} ${y - 0.4} ${50 - hw + 2.4} ${y - 2.6} Q${50 - hw + 1} ${y - 2.2} ${50 - hw} ${y - 0.5} Z`}
        fill={sh}
        opacity="0.55"
      />
      <ellipse cx={50 - hw + 2.5} cy={y + 1.2} rx="1.1" ry="0.75" fill={dark} opacity="0.85" />
      <ellipse cx={50 + hw - 2.5} cy={y + 1.2} rx="1.1" ry="0.75" fill={dark} opacity="0.85" />
    </g>
  )
}

export function Mouth({
  skin,
  y = 56,
  w = 5.5,
  expr = 'set',
  tinted = false,
}: {
  skin: string
  y?: number
  w?: number
  expr?: 'set' | 'frown' | 'smirk' | 'pressed'
  tinted?: boolean
}) {
  const upper = tinted ? '#6E3A34' : shade(skin, 0.5)
  const lower = tinted ? '#8A4A42' : shade(skin, 0.78)
  const cornerL = expr === 'frown' ? y + 1.4 : y
  const cornerR = expr === 'frown' ? y + 1.4 : expr === 'smirk' ? y - 1.2 : y
  const midUp = expr === 'pressed' ? y - 0.4 : y - 1
  return (
    <g>
      <path
        d={`M${50 - w} ${cornerL} Q${47.5} ${midUp} 50 ${midUp + 0.2} Q${52.5} ${midUp} ${50 + w} ${cornerR} Q${50} ${y + 0.9} ${50 - w} ${cornerL} Z`}
        fill={upper}
      />
      {expr !== 'pressed' && (
        <path
          d={`M${50 - w + 1.4} ${cornerL + 0.4} Q50 ${y + 2.6} ${50 + w - 1.4} ${cornerR + 0.4} Q50 ${y + 3.4} ${50 - w + 1.4} ${cornerL + 0.4} Z`}
          fill={lower}
          opacity="0.9"
        />
      )}
      {/* mouth line */}
      <path
        d={`M${50 - w} ${cornerL} Q50 ${expr === 'frown' ? y - 0.2 : y + 0.4} ${50 + w} ${cornerR}`}
        fill="none"
        stroke={INK}
        strokeWidth="0.9"
        strokeLinecap="round"
        opacity="0.85"
      />
      {/* shadow under lower lip */}
      <path
        d={`M46.5 ${y + 3.6} Q50 ${y + 4.6} 53.5 ${y + 3.6}`}
        fill="none"
        stroke={shade(skin, 0.6)}
        strokeWidth="0.8"
        opacity="0.5"
      />
    </g>
  )
}

/* ── facial hair parts ── */

const GREY = '#8E857C'
const GREY_LIGHT = '#B8AFA4'

/**
 * Walrus moustache hugging the upper lip: rises to just under the nose,
 * drapes past the mouth corners. The inner edge follows the mouth curve so
 * it reads as growing FROM the lip, not floating above it.
 */
function GreyMoustache({ mouthY: y, color = GREY }: { mouthY: number; color?: string }) {
  return (
    <g>
      <path
        d={`M43 ${y - 0.8} Q43.4 ${y - 3.6} 46 ${y - 4.6} Q48 ${y - 5.3} 50 ${y - 5.3} Q52 ${y - 5.3} 54 ${y - 4.6} Q56.6 ${y - 3.6} 57 ${y - 0.8} Q55.2 ${y - 0.2} 53.6 ${y - 1.2} Q51.8 ${y - 2.1} 50 ${y - 2.1} Q48.2 ${y - 2.1} 46.4 ${y - 1.2} Q44.8 ${y - 0.2} 43 ${y - 0.8} Z`}
        fill={color}
      />
      {/* comb texture radiating from the philtrum */}
      <path
        d={`M45 ${y - 3.6} Q44.4 ${y - 2.2} 44 ${y - 1.2} M47.5 ${y - 4.4} Q47 ${y - 3} 46.8 ${y - 1.8} M50 ${y - 4.8} L50 ${y - 2.4} M52.5 ${y - 4.4} Q53 ${y - 3} 53.2 ${y - 1.8} M55 ${y - 3.6} Q55.6 ${y - 2.2} 56 ${y - 1.2}`}
        fill="none"
        stroke={GREY_LIGHT}
        strokeWidth="0.5"
        opacity="0.8"
        strokeLinecap="round"
      />
    </g>
  )
}

/**
 * Goatee as a connected horseshoe: runs from below the mouth corners around
 * the point of the chin, plus a soul patch under the lower lip. Never a
 * floating chin blob.
 */
function GreyGoatee({ mouthY: m, color = GREY }: { mouthY: number; color?: string }) {
  return (
    <g>
      <path
        d={`M44.2 ${m + 0.6} Q43.6 ${m + 4.6} 46.2 ${m + 7.2} Q48 ${m + 8.8} 50 ${m + 8.8} Q52 ${m + 8.8} 53.8 ${m + 7.2} Q56.4 ${m + 4.6} 55.8 ${m + 0.6} Q55 ${m + 4} 53 ${m + 5.6} Q51.5 ${m + 6.6} 50 ${m + 6.6} Q48.5 ${m + 6.6} 47 ${m + 5.6} Q45 ${m + 4} 44.2 ${m + 0.6} Z`}
        fill={color}
      />
      <path
        d={`M48.6 ${m + 2.6} Q50 ${m + 2.2} 51.4 ${m + 2.6} Q51 ${m + 4.6} 50 ${m + 4.9} Q49 ${m + 4.6} 48.6 ${m + 2.6} Z`}
        fill={color}
      />
      <path
        d={`M46 ${m + 3.5} Q46.6 ${m + 5.6} 48 ${m + 6.8} M54 ${m + 3.5} Q53.4 ${m + 5.6} 52 ${m + 6.8} M50 ${m + 6.8} L50 ${m + 8.2}`}
        fill="none"
        stroke={GREY_LIGHT}
        strokeWidth="0.5"
        opacity="0.7"
        strokeLinecap="round"
      />
    </g>
  )
}

/**
 * Full beard as one solid mass: short sideburns connect to the hairline, the
 * mass wraps the jaw and extends slightly past the chin, and the moustache
 * merges into it. The mouth draws on top afterwards.
 *
 * Color: salt-and-pepper reads on dark skin through LIGHT STREAKS over a dark
 * base — a light base fill turns into a pale mask (learned the hard way).
 */
const BEARD_BASE = '#5A5148'
const BEARD_STREAK = '#9A9187'

function FullGreyBeard({ mouthY: m }: { mouthY: number }) {
  return (
    <g>
      {/* short thin sideburns bridging hair to beard */}
      <path
        d="M35.6 41.5 Q35.5 44.5 36.6 47.8 L38.9 46.6 Q38.2 44 38.3 41.8 Z"
        fill={BEARD_BASE}
        opacity="0.9"
      />
      <path
        d="M64.4 41.5 Q64.5 44.5 63.4 47.8 L61.1 46.6 Q61.8 44 61.7 41.8 Z"
        fill={BEARD_BASE}
        opacity="0.9"
      />
      {/* the mass — hugs the jawline, open above the mouth */}
      <path
        d="M36.4 48 Q36 56.5 41.8 62.6 Q45.6 66.8 50 66.9 Q54.4 66.8 58.2 62.6 Q64 56.5 63.6 48 Q61.4 51.2 57.8 52.2 Q53.9 53.2 50 53.2 Q46.1 53.2 42.2 52.2 Q38.6 51.2 36.4 48 Z"
        fill={BEARD_BASE}
      />
      {/* moustache merged into the beard */}
      <path
        d={`M43.2 ${m - 0.6} Q43.6 ${m - 3.6} 46.2 ${m - 4.6} Q48 ${m - 5.2} 50 ${m - 5.2} Q52 ${m - 5.2} 53.8 ${m - 4.6} Q56.4 ${m - 3.6} 56.8 ${m - 0.6} Q55 ${m + 0.2} 53.4 ${m - 1} Q51.8 ${m - 2} 50 ${m - 2} Q48.2 ${m - 2} 46.6 ${m - 1} Q45 ${m + 0.2} 43.2 ${m - 0.6} Z`}
        fill={BEARD_BASE}
      />
      {/* under-chin depth */}
      <path
        d="M41.5 61 Q45.5 64.9 50 65 Q54.5 64.9 58.5 61 Q55.5 65.3 50 65.5 Q44.5 65.3 41.5 61 Z"
        fill="#453D35"
        opacity="0.85"
      />
      {/* sparse grey streaks — enough to say "grey", not scratches */}
      <path
        d="M46 55 Q47 59.5 49 62 M54 55 Q53 59.5 51 62 M42.5 53.5 Q43.5 58 46 61.5"
        fill="none"
        stroke={BEARD_STREAK}
        strokeWidth="0.5"
        opacity="0.55"
        strokeLinecap="round"
      />
    </g>
  )
}

function DarkGoatee({ mouthY }: { mouthY: number }) {
  const y = mouthY - 3.6
  const cy = mouthY + 2.6
  return (
    <path
      d={`M45.5 ${y + 0.4} Q47.8 ${y - 0.4} 50 ${y - 0.3} Q52.2 ${y - 0.4} 54.5 ${y + 0.4} Q54 ${y + 2.2} 52 ${y + 2} Q51 ${y + 1.8} 50 ${y + 1.8} Q49 ${y + 1.8} 48 ${y + 2} Q46 ${y + 2.2} 45.5 ${y + 0.4} Z M46.2 ${cy} Q47.4 ${cy + 3.8} 50 ${cy + 4.1} Q52.6 ${cy + 3.8} 53.8 ${cy} Q54.5 ${cy + 3} 52.6 ${cy + 5} Q51.4 ${cy + 6.1} 50 ${cy + 6.1} Q48.6 ${cy + 6.1} 47.4 ${cy + 5} Q45.5 ${cy + 3} 46.2 ${cy} Z`}
      fill={INK}
      opacity="0.85"
    />
  )
}

function JawStubble() {
  return (
    <path
      d="M39 48 Q38.8 55 44 60.5 Q47 63.4 50 63.4 Q53 63.4 56 60.5 Q61.2 55 61 48 Q60 54.5 55 59 Q52.4 61.2 50 61.2 Q47.6 61.2 45 59 Q40 54.5 39 48 Z"
      fill={INK}
      opacity="0.16"
    />
  )
}

/* ── the parameterized face ── */

function FaceBrows({
  p,
  eyeOffset,
  browY,
  browTilt,
  browW,
  browWeight,
  fold,
}: {
  p: FaceParams
  eyeOffset: number
  browY: number
  browTilt: number
  browW: number
  browWeight: number
  fold: string
}) {
  const browRaise = p.browRaiseRight ?? 0

  return (
    <>
      <Brow
        cx={50 - eyeOffset}
        y={browY}
        w={browW}
        tilt={-browTilt}
        weight={browWeight}
        color={p.browColor}
      />
      <Brow
        cx={50 + eyeOffset}
        y={browY - browRaise}
        w={browW}
        tilt={browTilt}
        weight={browWeight}
        color={p.browColor}
      />
      {p.browKnit && (
        <path
          d="M48.6 34.2 Q50 33.6 51.4 34.2 L51.2 36 Q50 35.5 48.8 36 Z"
          fill={fold}
          opacity="0.7"
        />
      )}
    </>
  )
}

function FaceEyes({
  skin,
  p,
  eyeOffset,
  eyeY,
  eyeW,
}: {
  skin: string
  p: FaceParams
  eyeOffset: number
  eyeY: number
  eyeW: number
}) {
  const eyes = p.eyes ?? 'normal'
  const heavy = eyes === 'heavy'
  const wide = eyes === 'wide'

  return (
    <>
      <Eye
        cx={50 - eyeOffset}
        cy={eyeY}
        skin={skin}
        w={eyeW}
        heavy={heavy}
        wide={wide}
        lash={p.lash}
        soft={p.soft}
      />
      <Eye
        cx={50 + eyeOffset}
        cy={eyeY}
        skin={skin}
        w={eyeW}
        heavy={heavy}
        wide={wide}
        lash={p.lash}
        soft={p.soft}
      />
    </>
  )
}

function FaceNose({ skin, p }: { skin: string; p: FaceParams }) {
  return <Nose skin={skin} w={p.noseW ?? 7.2} y={p.noseY ?? 49} />
}

function FaceMouth({
  skin,
  p,
  mouthExpr,
  mouthW,
  mouthY,
}: {
  skin: string
  p: FaceParams
  mouthExpr: NonNullable<FaceParams['mouth']>
  mouthW: number
  mouthY: number
}) {
  return <Mouth skin={skin} expr={mouthExpr} w={mouthW} y={mouthY} tinted={p.tintedLips} />
}

function FaceHairline() {
  return null
}

function FaceWrinkles({ p, skin, fold }: { p: FaceParams; skin: string; fold: string }) {
  return (
    <>
      {p.foreheadCreases && (
        <path
          d="M41 26.5 Q50 24.8 59 26.5 M42.5 29.8 Q50 28.3 57.5 29.8"
          fill="none"
          stroke={fold}
          strokeWidth="0.75"
          opacity="0.5"
          strokeLinecap="round"
        />
      )}
      {p.underEyePouches && (
        <path
          d="M38.6 43.4 Q42.8 45.4 47 43.6 M53 43.6 Q57.2 45.4 61.4 43.4"
          fill="none"
          stroke={fold}
          strokeWidth="0.85"
          opacity="0.55"
          strokeLinecap="round"
        />
      )}
      {p.nasolabialFolds && (
        <path
          d="M44.5 50.5 Q42.4 54 43.2 58.2 M55.5 50.5 Q57.6 54 56.8 58.2"
          fill="none"
          stroke={fold}
          strokeWidth="1.1"
          opacity="0.6"
          strokeLinecap="round"
        />
      )}
      {p.smileLineRight && (
        <path
          d="M56 50.8 Q58 53.6 57.2 57"
          fill="none"
          stroke={shade(skin, 0.64)}
          strokeWidth="0.9"
          opacity="0.5"
          strokeLinecap="round"
        />
      )}
      {p.cheekLine && (
        <path
          d="M45.5 51.5 Q44.2 53.8 44.6 56.5"
          fill="none"
          stroke={shade(skin, 0.66)}
          strokeWidth="0.8"
          opacity="0.4"
          strokeLinecap="round"
        />
      )}
      {p.chinCrease && (
        <path
          d="M47.5 60 Q50 61 52.5 60"
          fill="none"
          stroke={shade(skin, 0.6)}
          strokeWidth="0.8"
          opacity="0.5"
        />
      )}
    </>
  )
}

function FaceJaw({ p, skin }: { p: FaceParams; skin: string }) {
  if (!p.jawShade) {
    return null
  }

  return (
    <path
      d="M40 50 Q41 56.5 45.5 60.5 M60 50 Q59 56.5 54.5 60.5"
      fill="none"
      stroke={shade(skin, 0.6)}
      strokeWidth="1"
      opacity="0.5"
      strokeLinecap="round"
    />
  )
}

function FaceBeard({
  facialHair,
  mouthY,
  hairFit,
}: {
  facialHair: NonNullable<FaceParams['facialHair']>
  mouthY: number
  hairFit?: string
}) {
  if (facialHair === 'none') {
    return null
  }

  return (
    <g transform={hairFit}>
      {facialHair === 'stubble' && <JawStubble />}
      {facialHair === 'fullGreyBeard' && <FullGreyBeard mouthY={mouthY} />}
      {facialHair === 'darkGoatee' && <DarkGoatee mouthY={mouthY} />}
      {(facialHair === 'greyMoustache' || facialHair === 'greyMoustacheGoatee') && (
        <GreyMoustache mouthY={mouthY} />
      )}
      {facialHair === 'greyMoustacheGoatee' && <GreyGoatee mouthY={mouthY} />}
    </g>
  )
}

function FaceEars() {
  return null
}

function FaceMakeup({ p }: { p: FaceParams }) {
  return p.beautyMark ? <circle cx={59.5} cy={49.5} r="0.55" fill={INK} opacity="0.6" /> : null
}

export function Face({ skin, p, fit = 1 }: { skin: string; p: FaceParams; fit?: number }) {
  const fold = shade(skin, 0.58)
  // Facial hair follows the jaw, which varies with head width; core features
  // (brows/eyes/nose/mouth) stay on the standard grid for every head.
  const hairFit = fit !== 1 ? `translate(50 0) scale(${fit} 1) translate(-50 0)` : undefined

  const browY = p.browY ?? 34.2
  const browTilt = p.browTilt ?? 0.5
  const browW = p.browW ?? 6.4
  const browWeight = p.browWeight ?? 2.1

  const eyes = p.eyes ?? 'normal'
  const eyeOffset = p.eyeOffset ?? (eyes === 'heavy' ? 7.2 : 6.8)
  const eyeY = p.eyeY ?? (p.lash ? 38.8 : eyes === 'heavy' ? 39.4 : 39.2)
  const eyeW = p.eyeW ?? (p.lash ? 4.7 : 4.6)

  const mouthExpr = p.mouth ?? 'set'
  const mouthY = p.mouthY ?? (p.tintedLips ? 55.5 : mouthExpr === 'frown' ? 56.2 : 56)
  const mouthW = p.mouthW ?? 5.2

  const facialHair = p.facialHair ?? 'none'

  return (
    <g>
      <FaceHairline />
      <FaceWrinkles p={p} skin={skin} fold={fold} />
      <FaceBrows
        p={p}
        eyeOffset={eyeOffset}
        browY={browY}
        browTilt={browTilt}
        browW={browW}
        browWeight={browWeight}
        fold={fold}
      />
      <FaceEyes skin={skin} p={p} eyeOffset={eyeOffset} eyeY={eyeY} eyeW={eyeW} />
      <FaceEars />
      <FaceNose skin={skin} p={p} />
      <FaceJaw p={p} skin={skin} />
      <FaceBeard facialHair={facialHair} mouthY={mouthY} hairFit={hairFit} />
      <FaceMouth skin={skin} p={p} mouthExpr={mouthExpr} mouthW={mouthW} mouthY={mouthY} />
      <FaceMakeup p={p} />
    </g>
  )
}

export type { PartProps }
