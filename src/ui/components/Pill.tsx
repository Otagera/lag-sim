import type { LucideIcon } from 'lucide-react'

interface PillProps {
  text:   string
  isGood: boolean
  size?:  'sm' | 'md'
  icon?:  LucideIcon
  color?: string  // overrides default success/error color
}

export function Pill({ text, isGood, size = 'sm', icon: Icon, color }: PillProps) {
  const pillColor = color ?? (isGood ? 'var(--success-11)' : 'var(--error-11)')
  return (
    <span style={{
      display:         'inline-flex',
      alignItems:      'center',
      gap:             '3px',
      padding:         size === 'sm' ? '2px 7px' : '4px 10px',
      borderRadius:    '2px',
      fontSize:        size === 'sm' ? '11px' : '13px',
      fontWeight:      500,
      fontFamily:      "'Archivo Narrow', sans-serif",
      letterSpacing:   '0.01em',
      whiteSpace:      'nowrap',
      background:      isGood ? 'var(--success-3, rgba(58,160,72,.12))' : 'var(--error-3, rgba(215,50,42,.10))',
      color:           pillColor,
    }}>
      {Icon && <Icon size={10} style={{ flexShrink: 0 }} />}
      {text}
    </span>
  )
}

export type { PillProps }
