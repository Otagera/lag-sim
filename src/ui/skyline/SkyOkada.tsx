interface Props {
  x?: number
  y?: number
  scale?: number
  opacity?: number
}

export function SkyOkada({ x = 0, y = 0, scale = 1, opacity = 1 }: Props) {
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`} opacity={opacity}>
      {/* Rear wheel */}
      <circle cx="28" cy="88" r="22" fill="#1a1a1a" />
      <circle cx="28" cy="88" r="15" fill="#b0b0b0" />
      <line x1="28" y1="73" x2="28" y2="103" stroke="#888" strokeWidth="1.5" />
      <line x1="13" y1="88" x2="43" y2="88" stroke="#888" strokeWidth="1.5" />
      <line x1="17" y1="77" x2="39" y2="99" stroke="#888" strokeWidth="1.5" />
      <line x1="39" y1="77" x2="17" y2="99" stroke="#888" strokeWidth="1.5" />
      <circle cx="28" cy="88" r="4" fill="#555" />
      {/* Rear tire tread */}
      <circle cx="28" cy="88" r="22" fill="none" stroke="#333" strokeWidth="3" />

      {/* Front wheel */}
      <circle cx="114" cy="88" r="22" fill="#1a1a1a" />
      <circle cx="114" cy="88" r="15" fill="#b0b0b0" />
      <line x1="114" y1="73" x2="114" y2="103" stroke="#888" strokeWidth="1.5" />
      <line x1="99" y1="88" x2="129" y2="88" stroke="#888" strokeWidth="1.5" />
      <line x1="103" y1="77" x2="125" y2="99" stroke="#888" strokeWidth="1.5" />
      <line x1="125" y1="77" x2="103" y2="99" stroke="#888" strokeWidth="1.5" />
      <circle cx="114" cy="88" r="4" fill="#555" />
      <circle cx="114" cy="88" r="22" fill="none" stroke="#333" strokeWidth="3" />

      {/* Frame — main spine from rear axle through seat to steering neck */}
      <path
        d="M28,88 L45,50 L82,44"
        fill="none"
        stroke="#c8c8c8"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Down tube from steering neck to engine area */}
      <path d="M45,50 L62,88" fill="none" stroke="#c8c8c8" strokeWidth="4" strokeLinecap="round" />
      {/* Swingarm */}
      <line x1="28" y1="88" x2="52" y2="84" stroke="#aaa" strokeWidth="3" strokeLinecap="round" />
      {/* Front fork */}
      <line x1="82" y1="44" x2="114" y2="88" stroke="#bbb" strokeWidth="4" strokeLinecap="round" />

      {/* Engine block */}
      <rect x="48" y="64" width="24" height="24" rx="3" fill="#3a3a3a" />
      {/* Cooling fins */}
      <line x1="50" y1="68" x2="70" y2="68" stroke="#555" strokeWidth="1.5" />
      <line x1="50" y1="72" x2="70" y2="72" stroke="#555" strokeWidth="1.5" />
      <line x1="50" y1="76" x2="70" y2="76" stroke="#555" strokeWidth="1.5" />
      <line x1="50" y1="80" x2="70" y2="80" stroke="#555" strokeWidth="1.5" />
      <line x1="50" y1="84" x2="70" y2="84" stroke="#555" strokeWidth="1.5" />

      {/* Exhaust pipe */}
      <path
        d="M48,78 L36,88 L36,100 L28,100"
        fill="none"
        stroke="#666"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Seat */}
      <path d="M48,44 Q55,38 74,40 Q82,42 84,44 L84,50 Q74,48 52,50 Z" fill="#2a1810" />

      {/* Fuel tank */}
      <path d="M80,42 Q92,36 106,42 Q110,44 112,50 L108,54 Q94,50 82,50 Z" fill="#1a6b3c" />
      {/* Lagos gold stripe on tank */}
      <path d="M80,46 Q92,42 106,46" fill="none" stroke="#f5c842" strokeWidth="1.8" />

      {/* Rider — legs */}
      <path
        d="M58,48 L56,84 L60,90"
        fill="none"
        stroke="#1a1a2e"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M52,48 L50,84" fill="none" stroke="#1a1a2e" strokeWidth="4" strokeLinecap="round" />

      {/* Rider — torso */}
      <path
        d="M56,46 Q54,32 57,18"
        fill="none"
        stroke="#1a1a2e"
        strokeWidth="8"
        strokeLinecap="round"
      />

      {/* Rider — arms to handlebars */}
      <path
        d="M58,28 Q70,26 86,32"
        fill="none"
        stroke="#2a1a0a"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M60,24 Q74,22 88,28"
        fill="none"
        stroke="#2a1a0a"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Handlebar */}
      <line x1="82" y1="40" x2="90" y2="30" stroke="#555" strokeWidth="3" strokeLinecap="round" />
      <path
        d="M86,30 Q90,26 96,32"
        fill="none"
        stroke="#555"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Rider — helmet */}
      <circle cx="60" cy="12" r="11" fill="#c0392b" />
      <path d="M52,14 Q60,4 68,14" fill="none" stroke="#a93226" strokeWidth="2" />
      {/* Helmet visor */}
      <path
        d="M54,12 Q60,8 66,12"
        fill="none"
        stroke="#222"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Helmet strap */}
      <path d="M54,18 Q60,20 66,18" fill="none" stroke="#c0392b" strokeWidth="2" />

      {/* Reflective vest — Lagos okada style */}
      <path d="M52,36 Q56,34 60,36 L59,46 L53,46 Z" fill="#f1c40f" opacity="0.85" />
      <line x1="54" y1="38" x2="58" y2="38" stroke="#e67e22" strokeWidth="1" />
      <line x1="53" y1="42" x2="59" y2="42" stroke="#e67e22" strokeWidth="1" />

      {/* Rear fender */}
      <path
        d="M16,70 Q28,60 40,70"
        fill="none"
        stroke="#444"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Front fender */}
      <path
        d="M102,70 Q114,60 126,70"
        fill="none"
        stroke="#444"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Side mirror */}
      <circle cx="98" cy="28" r="3" fill="#bbb" stroke="#888" strokeWidth="0.5" />
      <line x1="90" y1="30" x2="98" y2="28" stroke="#888" strokeWidth="1.5" />
    </g>
  )
}
