import type { CharacterId, CommissionerRole, DeputyKey } from '../../state/types'
import type { BustSpec } from './types'

export const CAST_SPECS: Record<string, BustSpec> = {
  /* ── Named characters ── */
  fashemu: {
    skinTone: 'dark',
    headShape: 'broad',
    face: {
      // the godfather: low knit brows, heavy lids, deep folds, grey goatee
      browY: 34.4,
      browTilt: 1.6,
      browW: 6.8,
      browWeight: 2.6,
      browKnit: true,
      eyes: 'heavy',
      noseW: 9,
      mouth: 'frown',
      facialHair: 'greyMoustacheGoatee',
      foreheadCreases: true,
      underEyePouches: true,
      nasolabialFolds: true,
    },
    hair: 'greyTemp',
    headwear: 'fila',
    clothing: 'agbada',
    accessories: ['coralBeads'],
    fabricColor: '#0D5E56',
    accentColor: '#D4AF37',
    bgTint: '#1A0E0A',
  },
  'chief-of-staff': {
    skinTone: 'mediumDark',
    headShape: 'oval',
    face: {
      // composed, unreadable
      browTilt: 0.3,
      mouth: 'pressed',
      mouthW: 5,
      cheekLine: true,
    },
    hair: 'lowFade',
    clothing: 'senator',
    accessories: ['heavyGlasses'],
    fabricColor: '#E8E4DE',
    accentColor: '#8A7D6B',
    bgTint: '#0F1A24',
  },
  neo: {
    skinTone: 'medium',
    headShape: 'slim',
    face: {
      // journalist: arched brows, one raised, direct unintimidated gaze
      browY: 33.4,
      browTilt: 1.1,
      browW: 6,
      browWeight: 1.7,
      browRaiseRight: 1.2,
      eyes: 'wide',
      lash: true,
      soft: true,
      eyeW: 4.8,
      noseW: 6.4,
      noseY: 48.5,
      tintedLips: true,
      beautyMark: true,
    },
    hair: 'shortCrop',
    clothing: 'blazer',
    accessories: ['earrings'],
    fabricColor: '#2A3A48',
    accentColor: '#3B9FE0',
    bgTint: '#1A1428',
  },
  dayo: {
    skinTone: 'mediumDark',
    headShape: 'angular',
    face: {
      // youth organiser: knit brows, wide alert eyes, jaw stubble
      browY: 34.6,
      browTilt: 2,
      browWeight: 2.3,
      eyes: 'wide',
      noseW: 7,
      mouth: 'pressed',
      mouthW: 5.4,
      facialHair: 'stubble',
      chinCrease: true,
    },
    hair: 'naturalVolume',
    clothing: 'teeUnderJacket',
    accessories: [],
    fabricColor: '#3B4A38',
    accentColor: '#3AA048',
    bgTint: '#1A2814',
  },
  smj: {
    skinTone: 'olive',
    headShape: 'oval',
    face: {
      // party insider: one brow up, half-smirk — the friendly warning
      browTilt: 0.8,
      browWeight: 2,
      browRaiseRight: 1.4,
      eyes: 'heavy',
      noseW: 7.4,
      mouth: 'smirk',
      mouthW: 5.4,
      smileLineRight: true,
    },
    hair: 'lowFade',
    clothing: 'kaftan',
    accessories: ['roundGlasses'],
    fabricColor: '#C4A882',
    accentColor: '#D4AF37',
    bgTint: '#1E1A10',
  },

  /* ── Commissioner variants ── */
  'commissioner-v0': {
    skinTone: 'medium',
    headShape: 'slim',
    face: {
      // senior woman in gele: composed, level
      browY: 33.4,
      browTilt: 1.2,
      browW: 5.4,
      browWeight: 1.35,
      lash: true,
      soft: true,
      noseW: 6.6,
      noseY: 48.5,
      mouthW: 5,
      tintedLips: true,
    },
    hair: 'geleWrap',
    clothing: 'blazer',
    accessories: ['earrings', 'lapelPin'],
    fabricColor: '#2A3A48',
    accentColor: '#D4AF37',
    bgTint: '#141E1E',
  },
  'commissioner-v1': {
    skinTone: 'ebony',
    headShape: 'broad',
    face: {
      // elder statesman: bushy grey brows, full grey beard
      browY: 34,
      browTilt: 1,
      browW: 6.8,
      browWeight: 2.7,
      browColor: '#4E453C',
      eyes: 'heavy',
      noseW: 8.2,
      mouthW: 4.6,
      mouthY: 55.8,
      facialHair: 'fullGreyBeard',
      foreheadCreases: true,
    },
    hair: 'greyTemp',
    clothing: 'agbada',
    accessories: ['coralBeads'],
    fabricColor: '#1B2A4A',
    accentColor: '#D4AF37',
    bgTint: '#141E1E',
  },
  'commissioner-v2': {
    skinTone: 'mediumDark',
    headShape: 'angular',
    face: {
      // younger technocrat: dark goatee
      browTilt: 0.8,
      noseW: 7,
      mouth: 'pressed',
      mouthW: 4.8,
      facialHair: 'darkGoatee',
    },
    hair: 'lowFade',
    clothing: 'suit',
    accessories: ['lapelPin'],
    fabricColor: '#2E3538',
    accentColor: '#1A9B8E',
    bgTint: '#141E1E',
  },

  /* ── Deputy variants ── */
  'deputy-v0': {
    skinTone: 'medium',
    headShape: 'oval',
    face: {
      // the professional: focused mild frown of concentration
      browTilt: 1,
      browW: 6,
      browWeight: 1.9,
      noseW: 6.8,
      mouthW: 4.8,
    },
    hair: 'lowFade',
    clothing: 'suit',
    accessories: ['roundGlasses'],
    fabricColor: '#1C2E4A',
    accentColor: '#3B9FE0',
    bgTint: '#181C20',
  },
  'deputy-v1': {
    skinTone: 'dark',
    headShape: 'broad',
    face: {
      // establishment elder: grey moustache, tired heavy lids
      browTilt: 0.6,
      browW: 6.4,
      browWeight: 2.3,
      browColor: '#4E463E',
      eyes: 'heavy',
      noseW: 7.8,
      mouth: 'frown',
      mouthW: 4.8,
      mouthY: 56.4,
      facialHair: 'greyMoustache',
      foreheadCreases: true,
      underEyePouches: true,
    },
    hair: 'greyTemp',
    headwear: 'plainCap',
    clothing: 'kaftan',
    accessories: [],
    fabricColor: '#6A1B2A',
    accentColor: '#D4AF37',
    bgTint: '#181C20',
  },
  'deputy-v2': {
    skinTone: 'ebony',
    headShape: 'angular',
    face: {
      // security chief: hard level stare, narrow lids, thin firm mouth
      browY: 34.8,
      browTilt: 1.8,
      browW: 6.6,
      browWeight: 2.5,
      eyes: 'heavy',
      eyeW: 4.2,
      noseW: 7.2,
      mouth: 'pressed',
      mouthY: 56.2,
      jawShade: true,
    },
    hair: 'lowFade',
    clothing: 'uniform',
    accessories: ['lapelPin'],
    fabricColor: '#3A5A3A',
    accentColor: '#D4AF37',
    bgTint: '#181C20',
  },
}

export const COMMISSIONER_VARIANTS: Record<CommissionerRole, string> = {
  works: 'commissioner-v0',
  finance: 'commissioner-v1',
  environment: 'commissioner-v2',
  transport: 'commissioner-v0',
  information: 'commissioner-v1',
}

export const DEPUTY_VARIANTS: Record<DeputyKey, string> = {
  technocrat: 'deputy-v0',
  politician: 'deputy-v1',
  loyalist: 'deputy-v1',
  reformer: 'deputy-v0',
  traditionalist: 'deputy-v1',
  economist: 'deputy-v0',
  'security-chief': 'deputy-v2',
}

export function getSpec(
  charId: CharacterId,
  variantKey?: string,
  specKey?: string,
): BustSpec | null {
  if (specKey) return CAST_SPECS[specKey] ?? null
  if (charId === 'commissioner') {
    const key = variantKey
      ? (COMMISSIONER_VARIANTS[variantKey as CommissionerRole] ?? 'commissioner-v0')
      : 'commissioner-v0'
    return CAST_SPECS[key] ?? null
  }
  if (charId === 'deputy') {
    const key = variantKey ? (DEPUTY_VARIANTS[variantKey as DeputyKey] ?? 'deputy-v0') : 'deputy-v0'
    return CAST_SPECS[key] ?? null
  }
  return CAST_SPECS[charId] ?? null
}

export const ALL_CAST_ENTRIES: { id: string; label: string; specKey: string }[] = [
  { id: 'fashemu', label: 'Chief B.O.A. Fashemu', specKey: 'fashemu' },
  { id: 'chief-of-staff', label: 'Chief of Staff', specKey: 'chief-of-staff' },
  { id: 'neo', label: 'Nneoma "Neo" Okonkwo', specKey: 'neo' },
  { id: 'dayo', label: 'Comrade Dayo Afolabi', specKey: 'dayo' },
  { id: 'smj', label: 'Hon. Seun Majekodunmi', specKey: 'smj' },
  { id: 'commissioner', label: 'Commissioner for Works', specKey: 'commissioner-v0' },
  { id: 'commissioner', label: 'Commissioner for Finance', specKey: 'commissioner-v1' },
  { id: 'commissioner', label: 'Commissioner for Transport', specKey: 'commissioner-v0' },
  { id: 'commissioner', label: 'Commissioner for Information', specKey: 'commissioner-v1' },
  { id: 'commissioner', label: 'Commissioner for Environment', specKey: 'commissioner-v2' },
  { id: 'deputy', label: 'Deputy Gov. (Technocrat)', specKey: 'deputy-v0' },
  { id: 'deputy', label: 'Deputy Gov. (Politician)', specKey: 'deputy-v1' },
  { id: 'deputy', label: 'Deputy Gov. (Security Chief)', specKey: 'deputy-v2' },
]
