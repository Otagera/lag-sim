export const SKIN_TONES: Record<string, string> = {
  ebony: '#4C2E20',
  dark: '#5C3A2B',
  mediumDark: '#7A4E3E',
  medium: '#9E6B55',
  olive: '#B88770',
} as const

export const FABRIC_COLORS: Record<string, string> = {
  agbadaTeal: '#0D5E56',
  agbadaBurgundy: '#6A1B2A',
  agbadaNavy: '#1B2A4A',
  suitCharcoal: '#2E3538',
  suitNavy: '#1C2E4A',
  kaftanCream: '#F0E6D3',
  kaftanBlue: '#3A6B8C',
  kaftanTan: '#C4A882',
  senatorWhite: '#E8E4DE',
  blazerDark: '#2A3A48',
  blazerKhaki: '#8B7D6B',
  teeWhite: '#E8E8E8',
  uniformGreen: '#3A5A3A',
} as const

export const BG_TINTS: Record<string, string> = {
  fashemu: '#1A0E0A',
  chiefOfStaff: '#0F1A24',
  neo: '#1A1428',
  dayo: '#1A2814',
  smj: '#1E1A10',
  commissioner: '#141E1E',
  deputy: '#181C20',
} as const

export function getFabricColor(name: string): string {
  return FABRIC_COLORS[name] ?? name
}

/**
 * Scale a hex color toward black (f < 1) or white (f > 1).
 * Used to derive shadow/fold/highlight tones from a base skin or fabric color
 * so every part shades consistently without hand-picking per-color variants.
 */
export function shade(hex: string, f: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex)
  if (!m) return hex
  const n = Number.parseInt(m[1], 16)
  const ch = (v: number) => {
    const scaled = f <= 1 ? v * f : v + (255 - v) * Math.min(f - 1, 1)
    return Math.round(Math.max(0, Math.min(255, scaled)))
  }
  const r = ch((n >> 16) & 0xff)
  const g = ch((n >> 8) & 0xff)
  const b = ch(n & 0xff)
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}
