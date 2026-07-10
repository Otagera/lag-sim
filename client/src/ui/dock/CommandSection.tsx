import { type ReactNode, useId, useState } from 'react'

export function CommandSection({
  title,
  description,
  aside,
  children,
  collapsible = false,
  defaultCollapsed = false,
}: {
  title: string
  description?: string
  aside?: ReactNode
  children: ReactNode
  collapsible?: boolean
  defaultCollapsed?: boolean
}) {
  const contentId = useId()
  const [collapsed, setCollapsed] = useState(defaultCollapsed)

  return (
    <section
      style={{
        border: '1px solid var(--border)',
        background: 'var(--surface)',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '12px',
          alignItems: 'start',
        }}
      >
        {collapsible ? (
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            aria-expanded={!collapsed}
            aria-controls={contentId}
            style={{
              display: 'flex',
              alignItems: 'start',
              justifyContent: 'space-between',
              gap: '12px',
              flex: 1,
              background: 'transparent',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: '13px',
                  fontWeight: 700,
                  color: 'var(--text)',
                  fontFamily: "'Archivo Narrow', sans-serif",
                }}
              >
                {title}
              </h3>
              {description ? (
                <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--text-secondary)' }}>
                  {description}
                </p>
              ) : null}
            </div>
            <span
              className="label-caps"
              style={{ color: 'var(--accent-text)', whiteSpace: 'nowrap' }}
            >
              {collapsed ? 'Expand' : 'Collapse'}
            </span>
          </button>
        ) : (
          <div style={{ flex: 1 }}>
            <h3
              style={{
                margin: 0,
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--text)',
                fontFamily: "'Archivo Narrow', sans-serif",
              }}
            >
              {title}
            </h3>
            {description ? (
              <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--text-secondary)' }}>
                {description}
              </p>
            ) : null}
          </div>
        )}
        {aside ? <div style={{ flexShrink: 0 }}>{aside}</div> : null}
      </div>
      {!collapsed ? <div id={contentId}>{children}</div> : null}
    </section>
  )
}
