interface BadgeProps {
  count: number
  max?: number
}

export function Badge({ count, max = 9 }: BadgeProps) {
  if (!count) return null
  const label = count > max ? `${max}+` : String(count)

  return (
    <span style={{
      display:        'inline-flex',
      alignItems:     'center',
      justifyContent: 'center',
      minWidth:       '16px',
      height:         '16px',
      padding:        '0 4px',
      borderRadius:   '8px',
      background:     'var(--error-9)',
      color:          '#fff',
      fontSize:       '10px',
      fontFamily:     "'Archivo Narrow', sans-serif",
      fontWeight:     600,
      lineHeight:     1,
    }}>
      {label}
    </span>
  )
}
