interface Props {
  x?: number
  y?: number
  scale?: number
}

export function Notebook({ x = 0, y = 0, scale = 1 }: Props) {
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      {/* Contact shadow */}
      <ellipse cx="20" cy="37" rx="21" ry="3.2" fill="#000" opacity="0.12" />

      {/* Page fore-edge block (peeks below the cover) */}
      <path d="M5,5 L39,5 Q40,5 40,6 L40,35 Q40,36 39,36 L5,36 Z" fill="#e7ddc7" />
      <line x1="7" y1="9" x2="40" y2="9" stroke="#d3c7ab" strokeWidth="0.5" />
      <line x1="7" y1="33" x2="40" y2="33" stroke="#d3c7ab" strokeWidth="0.5" />

      {/* Leather cover */}
      <path d="M3,4 Q3,2 5,2 L35,2 Q37,2 37,4 L37,32 Q37,34 35,34 L5,34 Q3,34 3,32 Z" fill="#7a3b30" />
      <path d="M3,4 Q3,2 5,2 L35,2 Q37,2 37,4 L37,32 Q37,34 35,34 L5,34 Q3,34 3,32 Z" fill="none" stroke="#5f2c24" strokeWidth="1" />
      {/* Debossed border rule */}
      <rect x="6" y="5" width="28" height="24" rx="1.5" fill="none" stroke="#5f2c24" strokeWidth="0.7" opacity="0.7" />
      <rect x="6.6" y="5.6" width="28" height="24" rx="1.5" fill="none" stroke="#96574a" strokeWidth="0.4" opacity="0.55" />
      {/* Brass monogram lines */}
      <line x1="12" y1="12" x2="26" y2="12" stroke="#b8894a" strokeWidth="1.1" />
      <line x1="15" y1="15" x2="23" y2="15" stroke="#b8894a" strokeWidth="0.8" opacity="0.7" />

      {/* Elastic band */}
      <rect x="29" y="2" width="3.2" height="32" fill="#2f2b26" opacity="0.92" />
      <rect x="29" y="2" width="1" height="32" fill="#4a453d" opacity="0.7" />

      {/* Ribbon bookmark — danfo yellow */}
      <path d="M9,34 L12.4,34 L11.4,39.4 L10.7,37.4 L10,39.4 Z" fill="#E9B62B" />

      {/* Fountain pen resting diagonally */}
      <g transform="rotate(-32 20 20)">
        <rect x="6" y="18.4" width="20" height="3.2" rx="1.6" fill="#211e19" />
        <rect x="6" y="18.4" width="8" height="3.2" rx="1.6" fill="#161310" />
        <rect x="13" y="18.4" width="1.6" height="3.2" fill="#b8894a" />
        <rect x="8" y="17" width="4.5" height="1" rx="0.5" fill="#b8894a" />
        <rect x="26" y="18.9" width="3" height="2.2" rx="1" fill="#2c2925" />
        <path d="M29,20 L33,19.4 L33,20.6 Z" fill="#cda15e" />
        <line x1="29.6" y1="20" x2="32.6" y2="20" stroke="#8a6531" strokeWidth="0.3" />
      </g>
    </g>
  )
}
