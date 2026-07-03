export type SkinTone = 'ebony' | 'dark' | 'mediumDark' | 'medium' | 'olive'

export type HeadShape = 'broad' | 'oval' | 'angular' | 'slim'

export type HairStyle = 'lowFade' | 'greyTemp' | 'naturalVolume' | 'geleWrap' | 'shortCrop'

export type HeadwearStyle = 'fila' | 'plainCap' | 'none'

export type EyeMode = 'normal' | 'heavy' | 'wide'

export type MouthExpr = 'set' | 'frown' | 'smirk' | 'pressed'

export type FacialHair =
  | 'none'
  | 'greyMoustache'
  | 'greyMoustacheGoatee'
  | 'fullGreyBeard'
  | 'darkGoatee'
  | 'stubble'

/**
 * A face is pure data — the single parameterized Face part renders it.
 * Add a new character by writing params, not drawing code.
 */
export interface FaceParams {
  /** brow geometry: tilt > 0 angles the inner ends down (stern/knit) */
  browY?: number
  browTilt?: number
  browW?: number
  browWeight?: number
  browColor?: string
  /** raises the right brow only — the skeptic/insider asymmetry */
  browRaiseRight?: number
  /** shadow wedge between knit brows */
  browKnit?: boolean

  eyes?: EyeMode
  /** thicker upper lid, reads as lashes */
  lash?: boolean
  /** lighter eye-socket shading (softer, feminine) */
  soft?: boolean
  eyeW?: number
  eyeY?: number
  /** horizontal distance of each eye from face center */
  eyeOffset?: number

  noseW?: number
  noseY?: number

  mouth?: MouthExpr
  mouthW?: number
  mouthY?: number
  tintedLips?: boolean

  facialHair?: FacialHair

  /** age & character marks */
  foreheadCreases?: boolean
  underEyePouches?: boolean
  nasolabialFolds?: boolean
  smileLineRight?: boolean
  cheekLine?: boolean
  jawShade?: boolean
  chinCrease?: boolean
  beautyMark?: boolean
}

export type ClothingStyle =
  | 'agbada'
  | 'suit'
  | 'kaftan'
  | 'senator'
  | 'blazer'
  | 'teeUnderJacket'
  | 'uniform'

export type AccessoryStyle =
  | 'roundGlasses'
  | 'heavyGlasses'
  | 'coralBeads'
  | 'lapelPin'
  | 'earrings'
  | 'none'

export type FrameShape = 'square' | 'arch'

export interface BustSpec {
  skinTone: SkinTone
  headShape: HeadShape
  face: FaceParams
  hair?: HairStyle
  headwear?: HeadwearStyle
  clothing: ClothingStyle
  accessories: AccessoryStyle[]
  fabricColor: string
  accentColor: string
  bgTint: string
}

export interface PartProps {
  skin: string
  fabric: string
  accent?: string
}

export interface VariantTableEntry {
  specKey: string
  spec: BustSpec
}

import type { CharacterId, CommissionerRole, DeputyKey } from '../../state/types'

export type { CharacterId, CommissionerRole, DeputyKey }
