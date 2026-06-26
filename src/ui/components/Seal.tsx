interface SealProps {
  size?: number
}

export function Seal({ size = 40 }: SealProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Lagos State Seal"
    >
      <circle cx="20" cy="20" r="19" stroke="var(--accent-solid)" strokeWidth="1.5" fill="var(--accent-bg-subtle)" />
      <circle cx="20" cy="20" r="14" stroke="var(--accent-solid)" strokeWidth="0.75" fill="none" opacity="0.4" />
      <text
        x="20" y="23"
        textAnchor="middle"
        fontFamily="'Playfair Display', Georgia, serif"
        fontSize="10"
        fontWeight="600"
        fill="var(--accent-solid)"
        letterSpacing="0.5"
      >
        LGS
      </text>
    </svg>
  )
}
