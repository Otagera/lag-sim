import { type CSSProperties, type ReactNode, useState } from 'react'

type Variant = 'primary' | 'choice' | 'danger' | 'ghost'

interface ButtonProps {
  children: ReactNode
  variant?: Variant
  disabled?: boolean
  onClick?: () => void
  fullWidth?: boolean
  style?: CSSProperties
}

const BASE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  padding: '9px 18px',
  borderRadius: '2px',
  border: '1px solid transparent',
  fontFamily: "'Archivo Narrow', sans-serif",
  fontSize: '13px',
  fontWeight: 500,
  letterSpacing: '0.01em',
  cursor: 'pointer',
  transition:
    'background-color 200ms ease, color 200ms ease, border-color 200ms ease, transform 120ms ease, opacity 150ms ease',
  userSelect: 'none',
  lineHeight: 1.3,
}

function transformForVariant(v: Variant, active: boolean, hover: boolean): string {
  if (active) return 'scale(.97)'
  if (v === 'danger') return 'none'
  return hover ? 'translateY(-1px)' : 'none'
}

function variantStyle(v: Variant, hover: boolean, active: boolean): CSSProperties {
  switch (v) {
    case 'primary':
      return {
        background: hover ? 'var(--accent-solid-hover)' : 'var(--accent-solid)',
        color: 'var(--accent-on-solid)',
        borderColor: 'transparent',
        transform: transformForVariant(v, active, hover),
      }
    case 'choice':
      return {
        background: hover ? 'var(--surface-hover)' : 'var(--surface)',
        color: 'var(--text)',
        borderColor: hover ? 'var(--border-strong)' : 'var(--border)',
        transform: transformForVariant(v, active, hover),
        textAlign: 'left',
      }
    case 'danger':
      return {
        background: hover ? 'var(--error-9)' : 'var(--error-3)',
        color: hover ? '#fff' : 'var(--error-11)',
        borderColor: hover ? 'var(--error-9)' : 'transparent',
        transform: transformForVariant(v, active, hover),
      }
    case 'ghost':
      return {
        background: hover ? 'var(--surface-hover)' : 'transparent',
        color: 'var(--text-secondary)',
        borderColor: 'transparent',
      }
  }
}

export function Button({
  children,
  variant = 'primary',
  disabled,
  onClick,
  fullWidth,
  style,
}: ButtonProps) {
  const [hover, setHover] = useState(false)
  const [active, setActive] = useState(false)

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => {
        setHover(false)
        setActive(false)
      }}
      onMouseDown={() => setActive(true)}
      onMouseUp={() => setActive(false)}
      style={{
        ...BASE,
        ...variantStyle(variant, hover, active),
        width: fullWidth ? '100%' : undefined,
        opacity: disabled ? 0.45 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        ...style,
      }}
    >
      {children}
    </button>
  )
}
