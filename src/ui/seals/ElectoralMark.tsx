import { useReducedMotion } from '../design/useReducedMotion'

interface ElectoralMarkProps {
  size?: number
  opacity?: number
  ink?: string
}

const SPIN_KEYFRAMES = `
@keyframes electoral-mark-spin { to { transform: rotate(360deg); } }
`

// Invented commission — "Lagos Ballot Integrity Council" (LBIC). Checked
// against and distinct from INEC (national) and the real Lagos State
// electoral body's actual LASIEC/LSIEC naming pattern.
export function ElectoralMark({ size = 400, opacity = 1, ink = '#3A3F44' }: ElectoralMarkProps) {
  const reduced = useReducedMotion()

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      aria-label="Lagos Ballot Integrity Council mark"
    >
      <style>{SPIN_KEYFRAMES}</style>
      <g opacity={opacity}>
        <g
          style={
            reduced
              ? undefined
              : {
                  animation: 'electoral-mark-spin 120s linear infinite',
                  transformOrigin: '100px 100px',
                }
          }
        >
          <circle cx="100" cy="100" r="94" stroke={ink} strokeWidth="2" strokeDasharray="4 6" />
        </g>
        <circle cx="100" cy="100" r="82" stroke={ink} strokeWidth="1.5" opacity="0.6" />

        <path id="lbic-motto-arc" d="M 35 100 A 65 65 0 0 1 165 100" fill="none" />
        <text
          fontFamily="'Archivo Narrow', sans-serif"
          fontSize="9"
          fontWeight="700"
          letterSpacing="2.5"
          fill={ink}
        >
          <textPath href="#lbic-motto-arc" startOffset="50%" textAnchor="middle">
            LAGOS BALLOT INTEGRITY COUNCIL
          </textPath>
        </text>

        {/* Ballot box */}
        <path
          d="M 60 115 L 140 115 L 132 155 L 68 155 Z"
          fill="none"
          stroke={ink}
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <rect x="85" y="108" width="30" height="7" rx="1.5" fill={ink} />

        {/* Checkmark-in-circle */}
        <circle cx="100" cy="95" r="22" fill="none" stroke={ink} strokeWidth="3" />
        <path
          d="M 90 96 L 97 103 L 112 86"
          fill="none"
          stroke={ink}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <text
          x="100"
          y="180"
          textAnchor="middle"
          fontFamily="'Archivo Narrow', sans-serif"
          fontSize="14"
          fontWeight="700"
          letterSpacing="2"
          fill={ink}
        >
          LBIC
        </text>
      </g>
    </svg>
  )
}
