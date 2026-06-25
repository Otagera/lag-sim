import type { CharacterId } from '../state/types'

const CHAR_AVATARS: Record<CharacterId, { initials: string; color: string }> = {
  fashemu: { initials: 'CF', color: '#8B4513' },
  'chief-of-staff': { initials: 'CoS', color: '#2563EB' },
  neo: { initials: 'NEO', color: '#DC2626' },
  dayo: { initials: 'DA', color: '#16A34A' },
  smj: { initials: 'SMJ', color: '#9333EA' },
  commissioner: { initials: 'Cm', color: '#6B7280' },
  deputy: { initials: 'DP', color: '#F59E0B' },
}

export function AvatarMonogram({
  charId,
  size = 28,
}: {
  charId: CharacterId
  size?: number
}) {
  const def = CHAR_AVATARS[charId] ?? { initials: '?', color: '#6B7280' }
  const r = size / 2
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-label={def.initials}
    >
      <circle cx={r} cy={r} r={r} fill={def.color} opacity={0.85} />
      <text
        x={r}
        y={r}
        textAnchor="middle"
        dominantBaseline="central"
        fill="white"
        fontSize={size * 0.38}
        fontWeight={700}
        fontFamily="system-ui, sans-serif"
      >
        {def.initials}
      </text>
    </svg>
  )
}
