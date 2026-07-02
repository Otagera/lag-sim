import { useReducedMotion } from '../design/useReducedMotion'

interface Props {
  x?: number
  y?: number
  scale?: number
  lit?: boolean
}

export function DeskLamp({ x = 0, y = 0, scale = 1, lit = false }: Props) {
  const reduced = useReducedMotion()
  const glowStyle = reduced ? undefined : { animation: 'desk-shim 3.2s ease-in-out infinite' }

  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      {/* Contact shadow */}
      <ellipse cx="16" cy="40" rx="14" ry="3.2" fill="#000" opacity="0.12" />

      {/* Warm light pool cast on the desk when lit */}
      {lit && (
        <path d="M6,18 L26,18 L33,40 L-1,40 Z" fill="#ffe9b0" opacity="0.22" style={glowStyle} />
      )}

      {/* Weighted brass base */}
      <ellipse cx="16" cy="38" rx="13" ry="4" fill="#8a6531" />
      <ellipse cx="16" cy="37" rx="13" ry="4" fill="#b8894a" />
      <ellipse cx="16" cy="36.4" rx="9" ry="2.4" fill="#cda15e" />

      {/* Upright rod */}
      <rect x="14.6" y="17" width="2.8" height="20" fill="#b8894a" />
      <rect x="14.6" y="17" width="1" height="20" fill="#cda15e" />

      {/* Shade interior — glows warm when lit */}
      <ellipse cx="16" cy="18" rx="12" ry="2.4" fill={lit ? '#ffe4a0' : '#20402f'} />

      {/* Banker's dome shade */}
      <path d="M4,18 Q4,7 16,7 Q28,7 28,18 Z" fill="#2f5d43" />
      <path d="M4,18 Q4,7 16,7 Q28,7 28,18 Z" fill="none" stroke="#243f30" strokeWidth="0.8" />
      <path d="M8,16 Q8.5,10 14,8.2" fill="none" stroke="#4a8563" strokeWidth="1.6" strokeLinecap="round" opacity="0.7" />
      {/* Brass trim along the shade lip */}
      <path d="M4,18 Q16,21 28,18" fill="none" stroke="#b8894a" strokeWidth="1.6" />
      {/* Finial */}
      <circle cx="16" cy="6.6" r="1.6" fill="#b8894a" />

      {/* Pull chain */}
      <line x1="27" y1="17.5" x2="27" y2="23" stroke="#b8894a" strokeWidth="0.7" />
      <circle cx="27" cy="24" r="1.3" fill={lit ? '#F5C518' : '#9a8b6a'} />

      {/* Switch indicator on base */}
      <circle cx="10" cy="36.5" r="1.4" fill={lit ? '#ffcf5a' : '#7a5c33'} />
    </g>
  )
}
