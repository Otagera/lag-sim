import type { CSSProperties, ReactNode } from 'react'

interface KickerProps {
  children: ReactNode
  accent?: boolean
}
export function Kicker({ children, accent }: KickerProps) {
  return (
    <div className="label-caps" style={{ color: accent ? 'var(--accent-text)' : undefined }}>
      {children}
    </div>
  )
}

interface HeadingProps {
  level?: 1 | 2 | 3 | 4
  children: ReactNode
  style?: CSSProperties
  display?: boolean
}
export function Heading({ level = 2, children, style, display }: HeadingProps) {
  const sizes: Record<number, string> = { 1: '30px', 2: '26px', 3: '20px', 4: '16px' }
  const Tag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4'

  return (
    <Tag
      className={display ? 'font-display' : ''}
      style={{
        margin:     0,
        fontFamily: display ? undefined : "'Archivo Narrow', sans-serif",
        fontSize:   sizes[level],
        fontWeight: 600,
        lineHeight: 1.25,
        color:      'var(--text)',
        ...style,
      }}
    >
      {children}
    </Tag>
  )
}

interface ProseProps {
  children: ReactNode
  style?: CSSProperties
}
export function Prose({ children, style }: ProseProps) {
  return (
    <p
      className="prose"
      style={{
        margin: 0,
        color:  'var(--text-secondary)',
        ...style,
      }}
    >
      {children}
    </p>
  )
}
