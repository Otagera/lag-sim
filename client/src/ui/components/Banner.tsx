import type { ReactNode } from 'react'

type Tone = 'warning' | 'danger' | 'info' | 'success'

interface BannerProps {
  tone?: Tone
  children: ReactNode
  onDismiss?: () => void
  enter?: boolean
}

const toneStyles: Record<Tone, { bg: string; border: string; color: string }> = {
  warning: {
    bg: 'var(--warning-3, #FFF6E0)',
    border: 'var(--warning-9)',
    color: 'var(--warning-11)',
  },
  danger: { bg: 'var(--error-3)', border: 'var(--error-9)', color: 'var(--error-11)' },
  info: { bg: 'var(--info-3, #E4F2FB)', border: 'var(--info-9)', color: 'var(--info-11)' },
  success: { bg: 'var(--success-3)', border: 'var(--success-9)', color: 'var(--success-11)' },
}

export function Banner({ tone = 'warning', children, onDismiss, enter = true }: BannerProps) {
  const s = toneStyles[tone]

  return (
    <div
      className={enter ? 'banner-enter' : ''}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        padding: '10px 16px',
        background: s.bg,
        borderBottom: `2px solid ${s.border}`,
        color: s.color,
        fontFamily: "'Archivo Narrow', sans-serif",
        fontSize: '13px',
        lineHeight: 1.5,
        overflow: 'hidden',
      }}
    >
      <div style={{ flex: 1 }}>{children}</div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: s.color,
            opacity: 0.6,
            fontSize: '16px',
            lineHeight: 1,
            padding: '0 2px',
            flexShrink: 0,
          }}
          aria-label="Dismiss"
        >
          ×
        </button>
      )}
    </div>
  )
}
