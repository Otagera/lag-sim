import { type ReactNode, useState } from 'react'

type TabTone = 'neutral' | 'info' | 'warning' | 'danger' | 'success' | 'accent'

type TabBadge =
  | number
  | string
  | {
      value: number | string
      tone?: TabTone
      ariaLabel?: string
    }

interface TabProps {
  icon?: ReactNode
  label: string
  badge?: TabBadge | null
  active?: boolean
  onClick?: () => void
  dataTour?: string
  tone?: TabTone
  ariaLabel?: string
}

const BADGE_COLORS: Record<TabTone, { bg: string; text: string }> = {
  neutral: { bg: 'var(--border-strong)', text: '#fff' },
  info: { bg: 'var(--info-9)', text: '#fff' },
  warning: { bg: 'var(--warning-9)', text: '#1b1b1b' },
  danger: { bg: 'var(--error-9)', text: '#fff' },
  success: { bg: 'var(--success-9)', text: '#fff' },
  accent: { bg: 'var(--accent-solid)', text: 'var(--accent-on-solid)' },
}

function normalizeBadge(badge: TabProps['badge']) {
  if (badge === undefined || badge === null || badge === 0 || badge === '') return null
  if (typeof badge === 'number' || typeof badge === 'string') {
    return {
      value: typeof badge === 'number' && badge > 9 ? '9+' : badge,
      tone: 'danger' as const,
      ariaLabel: typeof badge === 'number' ? `${badge} notifications` : `${badge} status`,
    }
  }

  return {
    value: typeof badge.value === 'number' && badge.value > 9 ? '9+' : badge.value,
    tone: badge.tone ?? 'danger',
    ariaLabel: badge.ariaLabel,
  }
}

export function Tab({ icon, label, badge, active, onClick, dataTour, tone, ariaLabel }: TabProps) {
  const [hover, setHover] = useState(false)
  const normalizedBadge = normalizeBadge(badge)
  const badgeTone = normalizedBadge?.tone ?? tone ?? 'danger'
  const badgeColors = BADGE_COLORS[badgeTone]
  const buttonAriaLabel =
    ariaLabel ??
    (normalizedBadge?.ariaLabel ? `${ariaLabel ?? label}, ${normalizedBadge.ariaLabel}` : label)

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '3px',
        padding: '6px 8px',
        flex: 1,
        background: 'transparent',
        border: 'none',
        borderTop: active ? '2px solid var(--accent-solid)' : '2px solid transparent',
        cursor: 'pointer',
        color: active ? 'var(--accent-solid)' : hover ? 'var(--text)' : 'var(--text-secondary)',
        transition: 'color 150ms ease, border-color 150ms ease',
        position: 'relative',
      }}
      aria-current={active ? 'page' : undefined}
      aria-label={buttonAriaLabel}
      {...(dataTour ? { 'data-tour': dataTour } : {})}
    >
      {icon && <div style={{ fontSize: '18px', lineHeight: 1 }}>{icon}</div>}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
          fontSize: '10px',
          fontFamily: "'Archivo Narrow', sans-serif",
          fontWeight: active ? 600 : 400,
          letterSpacing: '0.04em',
          whiteSpace: 'nowrap',
        }}
      >
        <span>{label}</span>
        {!icon && normalizedBadge && (
          <span
            style={{
              background: badgeColors.bg,
              color: badgeColors.text,
              fontSize: '9px',
              fontWeight: 600,
              fontFamily: "'Archivo Narrow', sans-serif",
              lineHeight: 1,
              padding: '2px 4px',
              borderRadius: '6px',
              minWidth: '14px',
              textAlign: 'center',
            }}
            aria-hidden="true"
            title={normalizedBadge.ariaLabel}
          >
            {normalizedBadge.value}
          </span>
        )}
      </div>
      {icon && normalizedBadge && (
        <span
          style={{
            position: 'absolute',
            top: '4px',
            right: 'calc(50% - 14px)',
            background: badgeColors.bg,
            color: badgeColors.text,
            fontSize: '9px',
            fontWeight: 600,
            fontFamily: "'Archivo Narrow', sans-serif",
            lineHeight: 1,
            padding: '2px 4px',
            borderRadius: '6px',
            minWidth: '14px',
            textAlign: 'center',
          }}
          aria-hidden="true"
          title={normalizedBadge.ariaLabel}
        >
          {normalizedBadge.value}
        </span>
      )}
    </button>
  )
}
