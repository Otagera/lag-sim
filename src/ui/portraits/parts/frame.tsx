import type { FrameShape } from '../types'

export function FrameBackground({ tint, shape }: { tint: string; shape: FrameShape }) {
  if (shape === 'arch') {
    return (
      <g>
        <path d="M8 120 L8 40 Q8 8 50 8 Q92 8 92 40 L92 120 Z" fill={tint} />
      </g>
    )
  }
  return <rect x="4" y="4" width="92" height="116" rx="6" fill={tint} />
}

export function FrameKeyline({ shape }: { shape: FrameShape }) {
  if (shape === 'arch') {
    return (
      <path
        d="M8 120 L8 40 Q8 8 50 8 Q92 8 92 40 L92 120"
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="0.8"
      />
    )
  }
  return (
    <rect
      x="4"
      y="4"
      width="92"
      height="116"
      rx="6"
      fill="none"
      stroke="rgba(255,255,255,0.06)"
      strokeWidth="0.8"
    />
  )
}

export function FrameGrain() {
  return (
    <g opacity="0.03" pointerEvents="none">
      <rect x="4" y="4" width="92" height="116" rx="6" fill="url(#grain)" />
    </g>
  )
}
