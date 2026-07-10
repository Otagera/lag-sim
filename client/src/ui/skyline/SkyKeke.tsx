interface Props {
  x?: number
  y?: number
  scale?: number
  opacity?: number
}

/**
 * Keke Marwa — the yellow tricycle. Rounded yellow cab, dark tarp roof,
 * open sides, Lagos green stripe. Box: 26w × 18h, wheels on y = 18.
 */
export function SkyKeke({ x = 0, y = 0, scale = 1, opacity = 1 }: Props) {
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`} opacity={opacity}>
      {/* body */}
      <rect x="2" y="5" width="20" height="9.5" rx="3" fill="#E5B63A" />
      {/* tarp roof */}
      <path d="M2.5 6.4 Q12.5 1.2 22.5 6.4 L22.5 8.2 Q12.5 3.2 2.5 8.2 Z" fill="#2E2A26" />
      {/* open passenger side */}
      <rect x="8" y="6.8" width="8.5" height="6" rx="1.6" fill="#3A342C" />
      {/* passenger hint */}
      <circle cx="12.5" cy="9" r="1.5" fill="#5C3A2B" />
      <path d="M10.8 10.4 Q12.5 9.6 14.2 10.4 L14.2 12.8 L10.8 12.8 Z" fill="#3D6A8A" />
      {/* windshield */}
      <path d="M19 6.6 L23.4 8 L23.4 12 L19 12 Z" fill="#BFD5DA" opacity="0.85" />
      {/* driver */}
      <circle cx="19.6" cy="8.6" r="1.3" fill="#4A2E20" />
      {/* green stripe */}
      <rect x="2" y="11.4" width="20" height="1.5" fill="#3A7D44" />
      {/* wheels */}
      <circle cx="6" cy="16" r="2.4" fill="#1E1A16" />
      <circle cx="6" cy="16" r="0.8" fill="#8A8A86" />
      <circle cx="21" cy="16" r="2.4" fill="#1E1A16" />
      <circle cx="21" cy="16" r="0.8" fill="#8A8A86" />
    </g>
  )
}
