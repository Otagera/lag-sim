import { useReducedMotion } from '../design/useReducedMotion'

interface Props {
  x?: number
  y?: number
  scale?: number
  ringing?: boolean
}

export function DeskPhone({ x = 0, y = 0, scale = 1, ringing = false }: Props) {
  const reduced = useReducedMotion()
  const blinkStyle = reduced ? undefined : { animation: 'desk-shim 0.9s ease-in-out infinite' }

  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      {/* Contact shadow */}
      <ellipse cx="20" cy="41" rx="20" ry="3.2" fill="#000" opacity="0.12" />

      {/* Body — rounded bakelite housing */}
      <path d="M6,40 Q3,40 3,36 L4,24 Q4.5,20 9,20 L31,20 Q35.5,20 36,24 L37,36 Q37,40 34,40 Z" fill="#2c2925" />
      <path d="M6,40 Q3,40 3,36 L4,24 Q4.5,20 9,20 L31,20 Q35.5,20 36,24 L37,36 Q37,40 34,40 Z" fill="none" stroke="#45403a" strokeWidth="0.8" />
      <path d="M9,21.5 L31,21.5" stroke="#4a453d" strokeWidth="1" strokeLinecap="round" opacity="0.7" />

      {/* Rotary dial */}
      <circle cx="20" cy="30" r="8.4" fill="#38332d" />
      <circle cx="20" cy="30" r="8.4" fill="none" stroke="#b8894a" strokeWidth="1.4" />
      {/* Finger holes (gap left for the finger-stop) */}
      <g fill="#d7cdb8">
        <circle cx="20" cy="24.7" r="0.95" />
        <circle cx="17.35" cy="25.4" r="0.95" />
        <circle cx="15.4" cy="27.3" r="0.95" />
        <circle cx="14.7" cy="30" r="0.95" />
        <circle cx="15.4" cy="32.7" r="0.95" />
        <circle cx="17.35" cy="34.6" r="0.95" />
        <circle cx="20" cy="35.3" r="0.95" />
        <circle cx="22.65" cy="34.6" r="0.95" />
        <circle cx="24.6" cy="32.7" r="0.95" />
      </g>
      {/* Finger stop */}
      <path d="M25.4,26 L27.6,27.9" stroke="#b8894a" strokeWidth="1.6" strokeLinecap="round" />
      {/* Dial hub */}
      <circle cx="20" cy="30" r="2.2" fill="#b8894a" />
      <circle cx="20" cy="30" r="2.2" fill="none" stroke="#8a6531" strokeWidth="0.6" />

      {/* Cradle hooks */}
      <rect x="6.5" y="16.5" width="4" height="3.5" rx="1" fill="#242019" />
      <rect x="29.5" y="16.5" width="4" height="3.5" rx="1" fill="#242019" />

      {/* Cord — coiled */}
      <path d="M33,15 Q37,16 35,18 Q33,20 35,22 Q37,24 35,26 Q33.5,27.5 34,29" fill="none" stroke="#3a352d" strokeWidth="1.3" strokeLinecap="round" />

      {/* Handset resting on the cradle */}
      <path d="M9,13 Q20,7 31,13" fill="none" stroke="#211e19" strokeWidth="3.4" strokeLinecap="round" />
      <ellipse cx="8.5" cy="13.5" rx="3.2" ry="3.4" fill="#211e19" />
      <ellipse cx="31.5" cy="13.5" rx="3.2" ry="3.4" fill="#211e19" />
      <ellipse cx="8.5" cy="13.5" rx="1.3" ry="1.5" fill="#000" opacity="0.45" />
      <ellipse cx="31.5" cy="13.5" rx="1.3" ry="1.5" fill="#000" opacity="0.45" />
      <path d="M11,11 Q20,8 29,11" fill="none" stroke="#3a352d" strokeWidth="0.7" opacity="0.6" />

      {/* Status light — blood red, blinks while ringing */}
      <circle cx="9" cy="36" r="1.8" fill={ringing ? '#D7322A' : '#4a453d'} style={ringing ? blinkStyle : undefined} />
    </g>
  )
}
