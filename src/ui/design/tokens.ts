/**
 * Design tokens — the locked art direction as TypeScript constants.
 * CSS custom properties are generated from these in index.css.
 * ThemeProvider swaps the situational overrides via html[data-situation].
 * ONE source of truth. Changing a value here + index.css restyles the whole game.
 */

// ─── Base palette (calm coastal Lagos) ───────────────────────────────────────
export const COLOR = {
  // Sea-light scale — the coastal base
  bg:          '#EDF5F8',
  bgGrad:      'linear-gradient(158deg, #EDF5F8 0%, #E8F4EE 100%)',
  surface:     '#FFFFFF',
  surface2:    '#F1F8FC',
  surfaceHover:'#F4FAFB',

  // Text — deep near-black ink on light
  ink:         '#13201E',
  inkSecondary:'#456064',
  inkTertiary: '#88A4AE',

  // Borders
  border:      'rgba(26,155,142,0.18)',
  borderStrong:'rgba(26,155,142,0.42)',

  // Accent scale — lagoon teal
  accent:      '#1A9B8E',
  accent2:     '#3B9FE0',
  accentMuted: 'rgba(26,155,142,0.12)',

  // Semantic
  danger:      '#D7322A',
  dangerMuted: 'rgba(215,50,42,0.10)',
  warning:     '#C08C0C',
  warningMuted:'rgba(192,140,12,0.12)',
  success:     '#3AA048',
  successMuted:'rgba(58,160,72,0.12)',

  // Lagos palette (for situational use)
  lagoonTeal:      '#1A9B8E',
  skyBlue:         '#3B9FE0',
  danfoYellow:     '#F5C518',
  bloodRed:        '#D7322A',
  generatorBlue:   '#5899D2',
  bulbWhite:       '#FFFBEA',
  sweeperGreen:    '#3AA048',
} as const

// ─── Situational state palettes ───────────────────────────────────────────────
export type Situation = 'calm' | 'crisis' | 'storm'

export const SITUATION_OVERRIDES: Record<Situation, Partial<Record<string, string>>> = {
  calm: {}, // base is calm — no overrides needed
  crisis: {
    '--background':        '#FFF2EE',
    '--surface-2':         '#FFECE6',
    '--accent-solid':      '#D7322A',
    '--accent-on-solid':   '#FFFFFF',
    '--accent-text':       '#A01A14',
    '--accent-bg-subtle':  'rgba(215,50,42,0.1)',
    '--border':            'rgba(215,50,42,0.2)',
    '--border-strong':     'rgba(215,50,42,0.5)',
    '--text':              '#1C0808',
    '--text-secondary':    '#6A3A30',
    '--dur':               '900ms',
  },
  storm: {
    '--background':        '#0C1720',
    '--surface':           '#101C28',
    '--surface-2':         '#172433',
    '--surface-hover':     '#1E2E3E',
    '--accent-solid':      '#5899D2',
    '--accent-on-solid':   '#081424',
    '--accent-text':       '#8ABDE0',
    '--accent-bg-subtle':  'rgba(88,153,210,0.15)',
    '--border':            'rgba(88,153,210,0.22)',
    '--border-strong':     'rgba(88,153,210,0.48)',
    '--text':              '#BDD0E0',
    '--text-secondary':    '#7490A0',
    '--error-9':           '#E06050',
    '--error-11':          '#F09888',
    '--warning-9':         '#D4A820',
    '--warning-11':        '#E8C860',
    '--success-9':         '#4A9E58',
    '--success-11':        '#7ACE88',
    '--dur':               '240ms',   // sharp: storm HITS
  },
}

// ─── Typography ───────────────────────────────────────────────────────────────
export const TYPE = {
  fontDisplay: "'Playfair Display', Georgia, 'Times New Roman', serif",
  fontBody:    "Georgia, 'Times New Roman', serif",
  fontUI:      "'Archivo Narrow', 'Helvetica Neue', Arial, sans-serif",

  scaleXxs:  '10px',
  scaleXs:   '11px',
  scaleSm:   '13px',
  scaleBase: '16px',
  scaleLg:   '20px',
  scaleXl:   '26px',
  scale2xl:  '30px',
} as const

// ─── Spacing ─────────────────────────────────────────────────────────────────
export const SPACE = {
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  6: '24px',
  8: '32px',
  12: '48px',
} as const

// ─── Shape ────────────────────────────────────────────────────────────────────
export const SHAPE = {
  radiusCard:   '6px',
  radiusButton: '2px',
  radiusNone:   '0',
} as const

// ─── Elevation ────────────────────────────────────────────────────────────────
export const SHADOW = {
  sm:   '0 1px 3px rgba(0,0,0,.05), 0 4px 16px rgba(0,0,0,.05)',
  md:   '0 4px 20px rgba(0,0,0,.09)',
  atm:  '0 1px 2px rgba(0,0,0,.04), 0 4px 14px rgba(0,0,0,.06), 0 16px 56px rgba(0,0,0,.07)',
} as const

// ─── Motion ───────────────────────────────────────────────────────────────────
export const MOTION = {
  fast:    '200ms',
  normal:  '300ms',
  atm:     '900ms',  // atmospheric mood shifts
  shock:   '240ms',  // storm onset
  easeOut: 'cubic-bezier(0, 0, .4, 1)',
  spring:  'cubic-bezier(.16, 1, .3, 1)',
} as const

// ─── Situation derivation (reads game state, returns situation key) ────────────
import type { GameState } from '../../state/types'

export function deriveSituation(s: GameState): Situation {
  if (s.riotModeActive || s.consecutiveBankruptWeeks >= 2) return 'storm'
  if (
    s.stats.cashReserve < 15 ||
    s.stats.publicTrust < 40 ||
    s.stats.politicalCapital < 20 ||
    Object.values(s.factions).some((v) => v <= 20)
  ) return 'crisis'
  return 'calm'
}
