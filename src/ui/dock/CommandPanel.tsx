import type { ReactNode } from 'react'

import type { DockBadgeTone } from './dockTypes'

type StatusItem = {
  label: string
  value: string | number
  tone?: DockBadgeTone
}

const TONE_STYLES: Record<DockBadgeTone, { bg: string; text: string }> = {
  neutral: { bg: 'var(--surface)', text: 'var(--text-secondary)' },
  info: { bg: 'var(--info-3)', text: 'var(--info-11)' },
  warning: { bg: 'var(--warning-3)', text: 'var(--warning-11)' },
  danger: { bg: 'var(--error-3)', text: 'var(--error-11)' },
  success: { bg: 'var(--success-3)', text: 'var(--success-11)' },
  accent: { bg: 'var(--accent-bg-subtle)', text: 'var(--accent-text)' },
}

export function CommandPanel({
  title,
  question,
  summary,
  statusItems = [],
  children,
}: {
  // title/question are optional: inside the dock, the bottom-sheet header
  // (PanelOverlayHeader, sourced from dockTabs) already shows the tab label and
  // question, so the panels omit them here to avoid a duplicated heading.
  title?: string
  question?: string
  summary?: string
  statusItems?: StatusItem[]
  children: ReactNode
}) {
  const hasHeading = Boolean(title || question || summary)
  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {hasHeading ? (
        <div>
          {title ? (
            <div
              className="label-caps"
              style={{ marginBottom: '6px', color: 'var(--accent-text)', letterSpacing: '0.08em' }}
            >
              {title}
            </div>
          ) : null}
          {question ? (
            <h2
              style={{
                margin: 0,
                fontSize: '20px',
                lineHeight: 1.15,
                fontWeight: 700,
                color: 'var(--text)',
                fontFamily: "'Archivo Narrow', sans-serif",
              }}
            >
              {question}
            </h2>
          ) : null}
          {summary ? (
            <p
              style={{
                margin: question ? '8px 0 0' : 0,
                fontSize: '12px',
                color: 'var(--text-secondary)',
              }}
            >
              {summary}
            </p>
          ) : null}
        </div>
      ) : null}

      {statusItems.length > 0 ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {statusItems.map((item) => {
            const tone = item.tone ?? 'neutral'
            const colors = TONE_STYLES[tone]
            return (
              <div
                key={item.label}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 10px',
                  border: '1px solid var(--border)',
                  background: colors.bg,
                  color: colors.text,
                }}
              >
                <span className="label-caps" style={{ color: 'var(--text-secondary)' }}>
                  {item.label}
                </span>
                <span style={{ fontWeight: 700 }}>{item.value}</span>
              </div>
            )
          })}
        </div>
      ) : null}

      {children}
    </div>
  )
}
