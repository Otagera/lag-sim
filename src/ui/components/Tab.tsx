import { useState, type ReactNode } from 'react'

interface TabProps {
  icon?:     ReactNode
  label:     string
  badge?:    number
  active?:   boolean
  onClick?:  () => void
  dataTour?: string
}

export function Tab({ icon, label, badge, active, onClick, dataTour }: TabProps) {
  const [hover, setHover] = useState(false)

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        gap:            '3px',
        padding:        '6px 8px',
        flex:           1,
        background:     'transparent',
        border:         'none',
        borderTop:      active
                          ? '2px solid var(--accent-solid)'
                          : '2px solid transparent',
        cursor:         'pointer',
        color:          active ? 'var(--accent-solid)'
                               : hover ? 'var(--text)' : 'var(--text-secondary)',
        transition:     'color 150ms ease, border-color 150ms ease',
        position:       'relative',
      }}
      aria-current={active ? 'page' : undefined}
      {...(dataTour ? { 'data-tour': dataTour } : {})}
    >
      {icon && (
        <div style={{ fontSize: '18px', lineHeight: 1 }}>{icon}</div>
      )}
      <div style={{
        display:        'inline-flex',
        alignItems:     'center',
        justifyContent: 'center',
        gap:            '4px',
        fontSize:       '10px',
        fontFamily:     "'Archivo Narrow', sans-serif",
        fontWeight:     active ? 600 : 400,
        letterSpacing:  '0.04em',
        whiteSpace:     'nowrap',
      }}>
        <span>{label}</span>
        {!icon && !!badge && badge > 0 && (
          <span style={{
            background:  'var(--error-9)',
            color:       '#fff',
            fontSize:    '9px',
            fontWeight:  600,
            fontFamily:  "'Archivo Narrow', sans-serif",
            lineHeight:  1,
            padding:     '2px 4px',
            borderRadius:'6px',
            minWidth:    '14px',
            textAlign:   'center',
          }}>
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </div>
      {icon && !!badge && badge > 0 && (
        <span style={{
          position:    'absolute',
          top:         '4px',
          right:       'calc(50% - 14px)',
          background:  'var(--error-9)',
          color:       '#fff',
          fontSize:    '9px',
          fontWeight:  600,
          fontFamily:  "'Archivo Narrow', sans-serif",
          lineHeight:  1,
          padding:     '2px 4px',
          borderRadius:'6px',
          minWidth:    '14px',
          textAlign:   'center',
        }}>
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  )
}
