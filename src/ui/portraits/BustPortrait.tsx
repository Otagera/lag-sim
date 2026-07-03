import type React from 'react'
import { useId } from 'react'
import type { CharacterId, CommissionerRole, DeputyKey } from '../../state/types'
import { AvatarMonogram } from '../AvatarMonogram'
import { getFabricColor, SKIN_TONES, shade } from './palette'
import { CoralBeads, Earrings, HeavyGlasses, LapelPin, RoundGlasses } from './parts/accessories'
import {
  ClothingAgbada,
  ClothingAgbadaNeckline,
  ClothingBlazer,
  ClothingBlazerFront,
  ClothingKaftan,
  ClothingKaftanCollar,
  ClothingSenator,
  ClothingSenatorCollar,
  ClothingSuit,
  ClothingSuitCollar,
  ClothingTeeUnderJacket,
  ClothingUniform,
  ClothingUniformCollar,
} from './parts/clothing'
import { Face } from './parts/faces'
import { FrameBackground, FrameKeyline } from './parts/frame'
import {
  HairGeleWrap,
  HairGreyTemp,
  HairLowFade,
  HairNaturalVolume,
  HairShortCrop,
} from './parts/hair'
import { HeadAngular, HeadBroad, HeadOval, HeadSlim } from './parts/heads'
import { Fila, PlainCap } from './parts/headwear'
import { getSpec } from './specs'
import type { BustSpec, FrameShape, PartProps } from './types'

type ComponentMap = Record<string, (props: PartProps) => React.JSX.Element>

const HEAD_COMPONENTS: ComponentMap = {
  broad: HeadBroad,
  oval: HeadOval,
  angular: HeadAngular,
  slim: HeadSlim,
}

const HAIR_COMPONENTS: ComponentMap = {
  lowFade: HairLowFade,
  greyTemp: HairGreyTemp,
  naturalVolume: HairNaturalVolume,
  geleWrap: HairGeleWrap,
  shortCrop: HairShortCrop,
}

const HEADWEAR_COMPONENTS: ComponentMap = {
  fila: Fila,
  plainCap: PlainCap,
}

const CLOTHING_COMPONENTS: ComponentMap = {
  agbada: ClothingAgbada,
  suit: ClothingSuit,
  kaftan: ClothingKaftan,
  senator: ClothingSenator,
  blazer: ClothingBlazer,
  teeUnderJacket: ClothingTeeUnderJacket,
  uniform: ClothingUniform,
}

// Front layers close collars/necklines over the neck, so they draw after the head.
const CLOTHING_FRONT_COMPONENTS: ComponentMap = {
  agbada: ClothingAgbadaNeckline,
  suit: ClothingSuitCollar,
  kaftan: ClothingKaftanCollar,
  senator: ClothingSenatorCollar,
  blazer: ClothingBlazerFront,
  uniform: ClothingUniformCollar,
}

const ACCESSORY_COMPONENTS: ComponentMap = {
  roundGlasses: RoundGlasses,
  heavyGlasses: HeavyGlasses,
  coralBeads: CoralBeads,
  lapelPin: LapelPin,
  earrings: Earrings,
}

/**
 * Hair, headwear and facial hair are authored on the oval head; each skull is
 * a different width, so head-hugging parts get scaled horizontally to fit.
 */
const HEAD_FIT: Record<string, number> = {
  broad: 1.12,
  oval: 1,
  angular: 0.96,
  slim: 0.92,
}

interface BustPortraitProps {
  charId: CharacterId
  size?: number
  variantKey?: CommissionerRole | DeputyKey
  /** Direct spec lookup, bypassing charId→variant resolution (Style Lab). */
  specKey?: string
  shape?: FrameShape
}

export function BustPortrait({
  charId,
  size = 48,
  variantKey,
  specKey,
  shape = 'square',
}: BustPortraitProps) {
  const uid = useId()
  const spec = getSpec(charId, variantKey, specKey)

  if (!spec) {
    return <AvatarMonogram charId={charId} size={size} />
  }

  const skin = SKIN_TONES[spec.skinTone] ?? '#5C3A2B'
  const fabric = getFabricColor(spec.fabricColor)
  const partProps: PartProps = { skin, fabric, accent: spec.accentColor }

  if (size < 48) {
    return (
      <CompactBust
        spec={spec}
        skin={skin}
        fabric={fabric}
        size={size}
        shape={shape}
        label={charId}
      />
    )
  }

  const HeadComponent = HEAD_COMPONENTS[spec.headShape] ?? HeadOval
  const HairComponent = spec.hair ? HAIR_COMPONENTS[spec.hair] : null
  const HeadwearComponent =
    spec.headwear && spec.headwear !== 'none' ? HEADWEAR_COMPONENTS[spec.headwear] : null
  const ClothingComponent = CLOTHING_COMPONENTS[spec.clothing]
  const ClothingFrontComponent = CLOTHING_FRONT_COMPONENTS[spec.clothing]
  if (!ClothingComponent) {
    return <AvatarMonogram charId={charId} size={size} />
  }

  const grainId = `bust-grain-${uid}`
  const fit = HEAD_FIT[spec.headShape] ?? 1
  // Hair, headwear and facial hair are authored against the oval head width;
  // scale them horizontally around the face center so they fit every skull.
  const fitTransform = fit !== 1 ? `translate(50 0) scale(${fit} 1) translate(-50 0)` : undefined

  return (
    <svg
      width={size}
      height={size * 1.2}
      viewBox="0 0 100 120"
      aria-label={charId}
      style={{ display: 'block' }}
    >
      <defs>
        <filter id={grainId}>
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" result="noise" />
          <feColorMatrix type="saturate" values="0" in="noise" result="grayNoise" />
          <feComponentTransfer in="grayNoise">
            <feFuncA type="linear" slope="0.05" />
          </feComponentTransfer>
        </filter>
      </defs>

      <FrameBackground tint={spec.bgTint} shape={shape} />
      <ClothingComponent {...partProps} />
      <HeadComponent {...partProps} />
      {HairComponent && (
        <g transform={fitTransform}>
          <HairComponent {...partProps} />
        </g>
      )}
      <Face skin={skin} p={spec.face} fit={fit} />
      {HeadwearComponent && (
        <g transform={fitTransform}>
          <HeadwearComponent {...partProps} />
        </g>
      )}
      {ClothingFrontComponent && <ClothingFrontComponent {...partProps} />}
      {spec.accessories.map((acc) => {
        const AccComponent = ACCESSORY_COMPONENTS[acc]
        return AccComponent ? <AccComponent key={acc} {...partProps} /> : null
      })}
      <FrameKeyline shape={shape} />
      <rect
        x="4"
        y="4"
        width="92"
        height="116"
        rx="6"
        fill={`url(#${grainId})`}
        pointerEvents="none"
      />
    </svg>
  )
}

/**
 * Purpose-built small tier (< 48px): a square head-and-shoulders mark, not a
 * scaled-down illustration. Identity at this size comes from silhouette
 * (headwear/hair), skin, background tint, and one signature accessory, drawn
 * with strokes thick enough to survive 28px. Expression flags derive from the
 * same FaceParams data that drives the full tier.
 */
function CompactBust({
  spec,
  skin,
  fabric,
  size,
  shape,
  label,
}: {
  spec: BustSpec
  skin: string
  fabric: string
  size: number
  shape: FrameShape
  label: string
}) {
  const accent = spec.accentColor ?? '#D4AF37'
  const ink = '#17100C'
  const skinShade = shade(skin, 0.66)
  const face = spec.face
  const isFrown = face.mouth === 'frown'
  const isSmirk = face.mouth === 'smirk'
  const isStern = !isFrown && (face.browTilt ?? 0) >= 1.8
  const heavyLids = face.eyes === 'heavy'
  const fem = !!face.lash

  const browY = isStern ? 26.4 : 25.8
  const browTilt = isFrown || isStern ? 1.3 : fem ? -0.7 : 0

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-label={label}
      style={{ display: 'block' }}
    >
      {shape === 'arch' ? (
        <path d="M3 64 L3 24 Q3 3 32 3 Q61 3 61 24 L61 64 Z" fill={spec.bgTint} />
      ) : (
        <rect x="2" y="2" width="60" height="60" rx="5" fill={spec.bgTint} />
      )}

      {/* shoulders */}
      <path d="M8 64 Q10 50 22 46.5 Q27 45 32 45 Q37 45 42 46.5 Q54 50 56 64 Z" fill={fabric} />
      <path
        d="M8 64 Q10 50 22 46.5 Q27 45 32 45 Q37 45 42 46.5 Q54 50 56 64"
        fill="none"
        stroke={shade(fabric, 0.65)}
        strokeWidth="1"
        opacity="0.5"
      />

      {/* neck */}
      <rect x="27.5" y="38" width="9" height="10" fill={skin} />
      <path
        d="M27.5 39.5 Q32 43.5 36.5 39.5 L36.5 45 Q32 47 27.5 45 Z"
        fill={shade(skin, 0.6)}
        opacity="0.6"
      />

      {/* head */}
      <path
        d={
          fem
            ? 'M32 9.5 Q41.5 9.5 43.5 19 Q44.8 26 42.5 32 Q40 39.5 34 42.3 Q32 43 32 43 Q32 43 30 42.3 Q24 39.5 21.5 32 Q19.2 26 20.5 19 Q22.5 9.5 32 9.5 Z'
            : 'M32 9 Q42.5 9 44.5 18.5 Q46 26 43.5 32.5 Q41 40 34.5 42.6 Q32 43.4 32 43.4 Q32 43.4 29.5 42.6 Q23 40 20.5 32.5 Q18 26 19.5 18.5 Q21.5 9 32 9 Z'
        }
        fill={skin}
      />
      <path
        d="M38 11 Q44 15 44 25 Q44 34 39 40 Q42.5 32 42.5 24 Q42.5 15.5 38 11 Z"
        fill="#000"
        opacity="0.1"
      />

      {/* hair / headwear silhouettes */}
      {spec.headwear === 'fila' && (
        <g>
          {/* dog-ear flap — hangs outside the head edge */}
          <path
            d="M41 15.5 Q47.5 14.5 49.8 18.5 Q51.8 22 50.8 26.5 Q49.8 31 45.5 33 Q47.3 28 46.5 23.5 Q45.8 19.5 41.8 17.8 Z"
            fill={fabric}
          />
          <path
            d="M42.8 17.2 Q46.8 19 47.6 23.5 Q48.3 27.5 46.8 31.2"
            fill="none"
            stroke={shade(fabric, 0.55)}
            strokeWidth="0.8"
            opacity="0.8"
            strokeLinecap="round"
          />
          {/* tall leaning crown with pinch crease */}
          <path
            d="M21 20 Q20.2 12.5 21.8 6.5 Q23.5 1 28.5 -0.3 Q33.8 -1.6 38 1 Q41.5 3.2 42.6 8.5 Q43.6 13 43.4 18.8 Q38.5 15.2 32 15.2 Q25.5 15.2 21 20 Z"
            fill={fabric}
          />
          <path
            d="M27 0.2 Q31.5 4.5 33.8 10 Q35 13 35.2 15.4"
            fill="none"
            stroke={shade(fabric, 0.55)}
            strokeWidth="0.9"
            strokeLinecap="round"
            opacity="0.85"
          />
          <path
            d="M27 0.2 Q33 -2 38 1 Q41.5 3.2 42.6 8.5 Q43.6 13 43.4 18.8 Q39.8 16.2 35.2 15.5 Q35 13 33.8 10 Q31.5 4.5 27 0.2 Z"
            fill={shade(fabric, 0.55)}
            opacity="0.45"
          />
          {/* band */}
          <path
            d="M21 20 Q25.5 15.4 32 15.4 Q38.5 15.4 43.4 18.9 L43.4 21.6 Q38.5 18.2 32 18.2 Q25.5 18.2 21 23 Z"
            fill={shade(fabric, 0.45)}
          />
        </g>
      )}
      {spec.headwear === 'plainCap' && (
        <g>
          <path
            d="M20.5 20 Q19.8 11.5 26 8 Q29 6.4 32 6.4 Q35 6.4 38 8 Q44.2 11.5 43.5 20 Q38.5 16.5 32 16.5 Q25.5 16.5 20.5 20 Z"
            fill={fabric}
          />
          <path
            d="M20.5 20 Q25.5 16.7 32 16.7 Q38.5 16.7 43.5 20 L43.5 22.5 Q38.5 19.2 32 19.2 Q25.5 19.2 20.5 22.5 Z"
            fill={shade(fabric, 0.6)}
          />
        </g>
      )}
      {!spec.headwear || spec.headwear === 'none' ? (
        <>
          {spec.hair === 'naturalVolume' && (
            <path
              d="M18.5 25 Q13.5 22 13.8 14.5 Q14 8 20 4.5 Q25.5 1.2 32 1.2 Q38.5 1.2 44 4.5 Q50 8 50.2 14.5 Q50.5 22 45.5 25 Q46.5 19 44 14.5 Q42 10.5 37.5 8.5 Q34.8 7.4 32 7.4 Q29.2 7.4 26.5 8.5 Q22 10.5 20 14.5 Q17.5 19 18.5 25 Z"
              fill={ink}
            />
          )}
          {spec.hair === 'geleWrap' && (
            <g>
              <path
                d="M20 22 Q18.5 12.5 25.5 8 Q29 5.8 32 5.8 Q35 5.8 38.5 8 Q45.5 12.5 44 22 Q38.5 17.5 32 17.5 Q25.5 17.5 20 22 Z"
                fill={shade(accent, 0.85)}
              />
              <path
                d="M22 12 Q19.5 6 24.5 2.8 Q28.5 0.4 32.5 2 Q28 3.2 26 7 Q24.8 9.4 25 12 Q23.2 11.6 22 12 Z"
                fill={shade(accent, 0.55)}
              />
              <path
                d="M26.5 9.5 Q27 2.5 34 1 Q38.5 0.2 41.5 2.6 Q36 3.4 33.2 7 Q31.4 9.4 31.5 12 Q28.6 11 26.5 9.5 Z"
                fill={shade(accent, 1.25)}
              />
              <path
                d="M33.5 9.5 Q36.5 3 42.5 3.4 Q47 3.8 48.5 7.5 Q44 6.6 40.5 9.2 Q38 11.2 37.5 13.8 Q35.2 11.8 33.5 9.5 Z"
                fill={shade(accent, 0.85)}
              />
              <path
                d="M42 12 Q46.5 10.8 48 13.5 Q49.2 16 47 18 Q44.8 19.6 42.5 18.4 Q43.8 16.4 43.4 14.6 Q43 13 42 12 Z"
                fill={shade(accent, 0.55)}
              />
            </g>
          )}
          {(spec.hair === 'lowFade' || spec.hair === 'shortCrop' || spec.hair === 'greyTemp') && (
            <g>
              <path
                d="M20.5 21.5 Q19.5 11 26.5 7.2 Q29.5 5.6 32 5.6 Q34.5 5.6 37.5 7.2 Q44.5 11 43.5 21.5 Q42.8 15.5 39.5 12.8 L39 15.8 Q35.8 13.8 32 13.8 Q28.2 13.8 25 15.8 L24.5 12.8 Q21.2 15.5 20.5 21.5 Z"
                fill={ink}
              />
              {spec.hair === 'greyTemp' && (
                <path
                  d="M20.8 20.5 Q21.2 15.5 23.8 12.8 L24.2 16.8 Q22.2 18 21.5 21.5 Z M43.2 20.5 Q42.8 15.5 40.2 12.8 L39.8 16.8 Q41.8 18 42.5 21.5 Z"
                  fill="#948C82"
                />
              )}
            </g>
          )}
        </>
      ) : null}

      {/* brows */}
      <path
        d={`M23.5 ${browY + browTilt} Q26.5 ${browY - 1} 29.5 ${browY - browTilt * 0.2} L29.5 ${browY + 1.8 - browTilt * 0.2} Q26.5 ${browY + 1} 23.5 ${browY + 1.8 + browTilt} Z`}
        fill={ink}
      />
      <path
        d={`M34.5 ${browY - browTilt * 0.2} Q37.5 ${browY - 1} 40.5 ${browY + browTilt} L40.5 ${browY + 1.8 + browTilt} Q37.5 ${browY + 1} 34.5 ${browY + 1.8 - browTilt * 0.2} Z`}
        fill={ink}
      />

      {/* eyes */}
      <circle cx="26.5" cy={browY + 5} r="1.7" fill={ink} />
      <circle cx="37.5" cy={browY + 5} r="1.7" fill={ink} />
      {(isFrown || isSmirk || heavyLids) && (
        <path
          d={`M24.5 ${browY + 3.6} L28.5 ${browY + 3.6} M35.5 ${browY + 3.6} L39.5 ${browY + 3.6}`}
          stroke={skinShade}
          strokeWidth="1.1"
          strokeLinecap="round"
        />
      )}

      {/* nose hint */}
      <path
        d={`M31 ${browY + 10} Q32 ${browY + 11} 33 ${browY + 10}`}
        fill="none"
        stroke={skinShade}
        strokeWidth="1.1"
        strokeLinecap="round"
      />

      {/* mouth */}
      {isFrown ? (
        <path
          d="M28.5 38.6 Q32 37 35.5 38.6"
          fill="none"
          stroke={ink}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      ) : isSmirk ? (
        <path
          d="M28.5 37.6 Q32 38.8 35.5 36.9"
          fill="none"
          stroke={ink}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      ) : (
        <path d="M28.7 37.8 L35.3 37.8" stroke={ink} strokeWidth="1.5" strokeLinecap="round" />
      )}

      {/* facial hair — derived from the same FaceParams as the full tier */}
      {face.facialHair === 'greyMoustacheGoatee' && (
        <g>
          <path
            d="M27.2 36.6 Q27.5 34.4 29.6 33.8 Q30.8 33.4 32 33.4 Q33.2 33.4 34.4 33.8 Q36.5 34.4 36.8 36.6 Q35.4 37 34.2 36.4 Q33.1 35.9 32 35.9 Q30.9 35.9 29.8 36.4 Q28.6 37 27.2 36.6 Z"
            fill="#8E857C"
          />
          <path
            d="M28.6 38.2 Q28.2 41.2 30 43.2 Q31 44.2 32 44.2 Q33 44.2 34 43.2 Q35.8 41.2 35.4 38.2 Q34.8 40.6 33.4 41.6 Q32.7 42.1 32 42.1 Q31.3 42.1 30.6 41.6 Q29.2 40.6 28.6 38.2 Z"
            fill="#8E857C"
          />
        </g>
      )}
      {face.facialHair === 'greyMoustache' && (
        <path
          d="M27.2 36.6 Q27.5 34.4 29.6 33.8 Q30.8 33.4 32 33.4 Q33.2 33.4 34.4 33.8 Q36.5 34.4 36.8 36.6 Q35.4 37 34.2 36.4 Q33.1 35.9 32 35.9 Q30.9 35.9 29.8 36.4 Q28.6 37 27.2 36.6 Z"
          fill="#8E857C"
        />
      )}
      {face.facialHair === 'fullGreyBeard' && (
        <g>
          <path
            d="M22.5 31 Q22.2 38.5 26.5 42.8 Q29 45.2 32 45.2 Q35 45.2 37.5 42.8 Q41.8 38.5 41.5 31 Q40 34.5 37 35.6 Q34.5 36.4 32 36.4 Q29.5 36.4 27 35.6 Q24 34.5 22.5 31 Z"
            fill="#655C53"
          />
          <path
            d="M26 35 Q26.5 39.5 29 42.5 M38 35 Q37.5 39.5 35 42.5 M32 37 L32 42.5"
            fill="none"
            stroke="#A39A8F"
            strokeWidth="0.6"
            opacity="0.8"
            strokeLinecap="round"
          />
        </g>
      )}
      {face.facialHair === 'darkGoatee' && (
        <path
          d="M28.5 40 Q30 42.6 32 42.8 Q34 42.6 35.5 40 Q35.8 43 33.8 44.4 Q32.9 45 32 45 Q31.1 45 30.2 44.4 Q28.2 43 28.5 40 Z"
          fill={ink}
          opacity="0.85"
        />
      )}

      {/* signature accessory */}
      {spec.accessories.includes('heavyGlasses') && (
        <g>
          <rect
            x="21.5"
            y={browY + 1.6}
            width="9.6"
            height="7"
            rx="2"
            fill="none"
            stroke={ink}
            strokeWidth="1.5"
          />
          <rect
            x="32.9"
            y={browY + 1.6}
            width="9.6"
            height="7"
            rx="2"
            fill="none"
            stroke={ink}
            strokeWidth="1.5"
          />
          <path d={`M31.1 ${browY + 4.4} L32.9 ${browY + 4.4}`} stroke={ink} strokeWidth="1.3" />
        </g>
      )}
      {spec.accessories.includes('roundGlasses') && (
        <g>
          <circle
            cx="26.5"
            cy={browY + 4.6}
            r="4.4"
            fill="none"
            stroke="#C9A227"
            strokeWidth="1.2"
          />
          <circle
            cx="37.5"
            cy={browY + 4.6}
            r="4.4"
            fill="none"
            stroke="#C9A227"
            strokeWidth="1.2"
          />
          <path
            d={`M30.9 ${browY + 3.8} L33.1 ${browY + 3.8}`}
            stroke="#C9A227"
            strokeWidth="1.1"
          />
        </g>
      )}
      {spec.accessories.includes('coralBeads') && (
        <g>
          {[
            [24, 49.5],
            [28, 51.5],
            [32, 52.2],
            [36, 51.5],
            [40, 49.5],
          ].map(([x, y], i) => (
            <circle
              key={`cb-${x}`}
              cx={x}
              cy={y}
              r="1.9"
              fill={i % 2 === 0 ? '#C2452D' : '#D96B4A'}
            />
          ))}
        </g>
      )}
      {spec.accessories.includes('earrings') && (
        <g>
          <circle cx="20.5" cy="33.5" r="1.6" fill="none" stroke={accent} strokeWidth="1" />
          <circle cx="43.5" cy="33.5" r="1.6" fill="none" stroke={accent} strokeWidth="1" />
        </g>
      )}

      {shape === 'arch' ? (
        <path
          d="M3 64 L3 24 Q3 3 32 3 Q61 3 61 24 L61 64"
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth="1"
        />
      ) : (
        <rect
          x="2"
          y="2"
          width="60"
          height="60"
          rx="5"
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth="1"
        />
      )}
    </svg>
  )
}
