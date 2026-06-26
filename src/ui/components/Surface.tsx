import type { CSSProperties, ReactNode } from 'react'

type Elevation = 'flat' | 'raised' | 'atm'
type Variant   = 'default' | 'surface2' | 'ghost'

const elevationShadow: Record<Elevation, string> = {
  flat:   'none',
  raised: 'var(--shadow-sm)',
  atm:    'var(--shadow-atm)',
}

interface SurfaceProps {
  children: ReactNode
  elevation?: Elevation
  variant?: Variant
  radius?: number | string
  padding?: number | string
  className?: string
  style?: CSSProperties
  grain?: boolean
  onClick?: () => void
}

export function Surface({
  children,
  elevation = 'raised',
  variant   = 'default',
  radius    = 6,
  padding,
  className = '',
  style,
  grain     = false,
  onClick,
}: SurfaceProps) {
  const bg = variant === 'surface2' ? 'var(--surface-2)' :
             variant === 'ghost'    ? 'transparent'       : 'var(--surface)'

  return (
    <div
      className={`themed ${grain ? 'atm-grain' : ''} ${className}`}
      onClick={onClick}
      style={{
        background:   bg,
        border:       variant === 'ghost' ? 'none' : '1px solid var(--border)',
        borderRadius: typeof radius === 'number' ? `${radius}px` : radius,
        padding,
        boxShadow:    elevationShadow[elevation],
        transition:   'background-color var(--dur) ease, border-color var(--dur) ease, box-shadow var(--dur) ease',
        ...style,
      }}
    >
      {children}
    </div>
  )
}
