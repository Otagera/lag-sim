import type { PartySymbol } from './mockElectionBrandingState'

interface FictionalPartyLogoProps {
  size?: number
  initials: string
  color: string
  symbol: PartySymbol
  opacity?: number
}

// Three invented symbols only — none match a real Nigerian party mark
// (APC's broom, PDP's umbrella, Labour Party's torch).
function PartySymbolGlyph({ symbol, color }: { symbol: PartySymbol; color: string }) {
  switch (symbol) {
    case 'sunrise':
      return (
        <g stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none">
          <line x1="20" y1="60" x2="80" y2="60" />
          <path d="M 30 60 A 20 20 0 0 1 70 60" />
          {Array.from({ length: 5 }).map((_, i) => {
            const angle = Math.PI + (i / 4) * Math.PI
            const x1 = 50 + Math.cos(angle) * 24
            const y1 = 60 + Math.sin(angle) * 24
            const x2 = 50 + Math.cos(angle) * 32
            const y2 = 60 + Math.sin(angle) * 32
            return <line key={`sunray-${angle.toFixed(4)}`} x1={x1} y1={y1} x2={x2} y2={y2} />
          })}
        </g>
      )
    case 'compass':
      return (
        <g fill={color}>
          <path d="M 50 24 L 60 50 L 50 76 L 40 50 Z" opacity="0.9" />
          <path d="M 24 50 L 50 40 L 76 50 L 50 60 Z" opacity="0.6" />
        </g>
      )
    case 'wave':
      return (
        <g stroke={color} strokeWidth="3" strokeLinecap="round" fill="none">
          <path d="M 22 42 Q 32 32 42 42 T 62 42 T 78 42" />
          <path d="M 22 58 Q 32 48 42 58 T 62 58 T 78 58" opacity="0.7" />
        </g>
      )
  }
}

export function FictionalPartyLogo({
  size = 32,
  initials,
  color,
  symbol,
  opacity = 1,
}: FictionalPartyLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      aria-label={`Fictional party mark: ${initials}`}
    >
      <g opacity={opacity}>
        <circle
          cx="50"
          cy="50"
          r="46"
          fill={color}
          fillOpacity="0.15"
          stroke={color}
          strokeWidth="2"
        />
        <PartySymbolGlyph symbol={symbol} color={color} />
        <text
          x="50"
          y="90"
          textAnchor="middle"
          fontFamily="'Archivo Narrow', sans-serif"
          fontSize="14"
          fontWeight="700"
          letterSpacing="1"
          fill={color}
        >
          {initials}
        </text>
      </g>
    </svg>
  )
}
