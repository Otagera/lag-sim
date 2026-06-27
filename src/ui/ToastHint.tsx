import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

type Props = {
  text: string
  onDismiss: () => void
}

export function ToastHint({ text, onDismiss }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  function handleDismiss() {
    setVisible(false)
    setTimeout(onDismiss, 300)
  }

  return (
    <div
      style={{
        position:   'fixed',
        top:        visible ? '12px' : '-80px',
        left:       '50%',
        transform:   'translateX(-50%)',
        zIndex:     200,
        maxWidth:   '480px',
        width:      'calc(100% - 32px)',
        background: 'var(--surface)',
        border:     '1px solid var(--border)',
        borderRadius: '4px',
        boxShadow:  'var(--shadow-atm)',
        padding:    '12px 36px 12px 14px',
        transition: 'top 300ms ease',
        display:    'flex',
        alignItems: 'flex-start',
        gap:        '8px',
      }}
    >
      <span style={{
        fontFamily: 'Georgia, serif',
        fontSize:   '13px',
        lineHeight: 1.5,
        color:      'var(--text)',
        flex:       1,
      }}>
        {text}
      </span>
      <button
        type="button"
        onClick={handleDismiss}
        style={{
          position:   'absolute',
          top:        '8px',
          right:      '8px',
          background: 'none',
          border:     'none',
          cursor:     'pointer',
          color:      'var(--text-secondary)',
          padding:    '2px',
          lineHeight: 0,
        }}
        aria-label="Dismiss hint"
      >
        <X size={14} />
      </button>
    </div>
  )
}
