import { LagosSealMark } from '../seals/LagosSealMark'

/** Danfo-yellow — the constant brand accent across every flavor. */
export const DANFO = '#F5C518'

export const FLAVOR_COLORS = {
  crisis: { bg: '#1A0808', text: '#EDD6D4', accent: '#D7322A', subdue: '#7A4A40' },
  storm: { bg: '#0C1720', text: '#C4D6E4', accent: '#5899D2', subdue: '#4A5A68' },
  teal: { bg: '#0A1A18', text: '#CDE4E0', accent: '#1A9B8E', subdue: '#3A6A64' },
  triumph: { bg: '#0A1810', text: '#CDE4D4', accent: '#3AA048', subdue: '#3A5A44' },
} as const

export type CardFlavor = keyof typeof FLAVOR_COLORS
export type FlavorPalette = (typeof FLAVOR_COLORS)[CardFlavor]

export const STAMP_FALLBACK: Record<CardFlavor, string> = {
  crisis: 'FALLEN',
  storm: 'SEIZED',
  teal: 'ENDED',
  triumph: 'RETURNED',
}

const SERIF = "'Playfair Display', Georgia, 'Times New Roman', serif"
const SANS = "'Archivo Narrow', system-ui, -apple-system, sans-serif"

export const CardDefs = ({ flavor }: { flavor: FlavorPalette }) => (
  <defs>
    <filter id="share-grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="4" result="noise" />
      <feColorMatrix type="saturate" values="0" in="noise" result="grayNoise" />
      <feComponentTransfer in="grayNoise">
        <feFuncA type="linear" slope="0.035" />
      </feComponentTransfer>
    </filter>
    <linearGradient id="card-bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={flavor.bg} />
      <stop offset="72%" stopColor="#070707" />
      <stop offset="100%" stopColor="#050505" />
    </linearGradient>
  </defs>
)

export const CardBackground = () => (
  <>
    <rect width="1080" height="1350" fill="url(#card-bg)" />
    <rect width="1080" height="1350" fill="url(#share-grain)" />
  </>
)

/**
 * Newspaper masthead: Danfo-yellow bar, "LAGOS GOVERNOR SIM" nameplate, a
 * right-aligned subline (the administration label), and a double rule.
 */
export const CardMasthead = ({
  administrationLabel,
  flavor,
}: {
  administrationLabel: string
  flavor: FlavorPalette
}) => (
  <>
    <rect x="0" y="0" width="1080" height="10" fill={DANFO} />
    <text
      x="90"
      y="94"
      fontFamily={SERIF}
      fontSize="29"
      fontWeight="700"
      fill={flavor.text}
      letterSpacing="0.07em"
    >
      LAGOS GOVERNOR SIM
    </text>
    <text
      x="990"
      y="92"
      textAnchor="end"
      fontFamily={SANS}
      fontSize="13"
      fill={flavor.subdue}
      letterSpacing="0.16em"
      fontWeight="700"
    >
      {administrationLabel.toUpperCase()}
    </text>
    <line
      x1="90"
      y1="122"
      x2="990"
      y2="122"
      stroke={flavor.subdue}
      strokeWidth="1.5"
      opacity="0.6"
    />
    <line
      x1="90"
      y1="127"
      x2="990"
      y2="127"
      stroke={flavor.subdue}
      strokeWidth="0.6"
      opacity="0.4"
    />
  </>
)

/** Footer band: Danfo rule, version stamp, centred seal, wordmark. */
export const CardFooter = ({
  versionStamp,
  flavor,
}: {
  versionStamp: string
  flavor: FlavorPalette
}) => (
  <>
    <rect x="0" y="1252" width="1080" height="98" fill={flavor.accent} opacity="0.1" />
    <rect x="0" y="1252" width="1080" height="3" fill={DANFO} opacity="0.9" />
    <text
      x="90"
      y="1310"
      fontFamily={SANS}
      fontSize="15"
      fill={flavor.subdue}
      letterSpacing="0.06em"
    >
      {versionStamp}
    </text>
    <g transform="translate(518 1274)">
      <LagosSealMark size={54} tone="accent" />
    </g>
    <text
      x="990"
      y="1310"
      textAnchor="end"
      fontFamily={SERIF}
      fontSize="22"
      fill={flavor.text}
      opacity="0.9"
      letterSpacing="0.14em"
      fontWeight="700"
    >
      LAGOS GOVERNOR SIM
    </text>
  </>
)
