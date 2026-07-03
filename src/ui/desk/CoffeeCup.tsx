import { useReducedMotion } from '../design/useReducedMotion'

interface Props {
  x?: number
  y?: number
  scale?: number
  steaming?: boolean
}

export function CoffeeCup({ x = 0, y = 0, scale = 1, steaming = true }: Props) {
  const reduced = useReducedMotion()
  const steam = (secs: number, delay = 0) =>
    reduced
      ? undefined
      : { animation: `desk-shim ${secs}s ease-in-out infinite`, animationDelay: `${delay}s` }

  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      {/* Contact shadow */}
      <ellipse cx="20" cy="35" rx="18" ry="3.4" fill="#000" opacity="0.12" />

      {/* Saucer */}
      <ellipse cx="20" cy="34" rx="18" ry="4.4" fill="#efe8da" />
      <ellipse cx="20" cy="34" rx="18" ry="4.4" fill="none" stroke="#cdbfa2" strokeWidth="0.8" />
      <ellipse cx="20" cy="33.4" rx="10" ry="2.3" fill="#e0d5c0" />

      {/* Handle (behind body so it reads as attached) */}
      <path
        d="M29,16 Q38,15 37.5,21 Q37,27 28.5,26"
        fill="none"
        stroke="#e6ddcc"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M29,16 Q38,15 37.5,21 Q37,27 28.5,26"
        fill="none"
        stroke="#cdbfa2"
        strokeWidth="1"
        strokeLinecap="round"
      />

      {/* Cup body */}
      <path d="M10.5,13 Q10,25 13,29 Q16,32 20,32 Q24,32 27,29 Q30,25 29.5,13 Z" fill="#f4efe4" />
      {/* Soft shade on the right side */}
      <path d="M23,14 Q25,24 21.5,31 Q25,31 27,29 Q30,25 29.5,14 Z" fill="#e6ddcc" opacity="0.7" />
      {/* Lagoon-teal accent band */}
      <path d="M11,16.5 Q20,19 29,16.5" fill="none" stroke="#1A9B8E" strokeWidth="1.3" />

      {/* Rim */}
      <ellipse cx="20" cy="13" rx="9.6" ry="3" fill="#faf6ee" />
      <ellipse cx="20" cy="13" rx="9.6" ry="3" fill="none" stroke="#cdbfa2" strokeWidth="0.9" />
      {/* Coffee surface */}
      <ellipse cx="20" cy="13.2" rx="7.6" ry="2.1" fill="#3f2817" />
      <ellipse cx="18.5" cy="12.6" rx="3" ry="0.9" fill="#5a3a20" opacity="0.7" />
      {/* Rim highlight */}
      <path
        d="M12,12 Q11.6,17 13.5,24"
        fill="none"
        stroke="#fff"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.45"
      />

      {/* Steam */}
      {steaming && (
        <g opacity="0.55" stroke="#d8d2c6" strokeWidth="1.5" strokeLinecap="round" fill="none">
          <path d="M15,8 Q17,3 15,-2 Q13,-6 15,-10" style={steam(2.6)} />
          <path d="M20,7 Q22,2 20,-3 Q18,-8 20,-12" style={steam(3.3, 0.4)} />
          <path d="M25,8 Q27,3 25,-2 Q23,-6 25,-10" style={steam(2.9, 0.8)} />
        </g>
      )}

      {/* Spilled coffee — faint on a calm desk, pronounced in crisis (when steam is off) */}
      <g opacity={steaming ? 0.28 : 0.72}>
        <ellipse cx="7" cy="39" rx="5.5" ry="2.2" fill="#3f2817" />
        <ellipse cx="3.4" cy="41.4" rx="1.6" ry="1" fill="#3f2817" />
        <ellipse cx="10.6" cy="41" rx="1.1" ry="0.7" fill="#3f2817" />
      </g>
    </g>
  )
}
