import type { ReactNode } from 'react'

interface Props {
  children?: ReactNode
  width?: number
  height?: number
}

export function WindowFrame({ children, width = 400, height = 260 }: Props) {
  return (
    <div style={{ position: 'relative', width, height }}>
      {/* Outer frame shadow */}
      <div style={{
        position: 'absolute', inset: '-6px -6px -8px -6px',
        borderRadius: '4px',
        background: 'linear-gradient(180deg, #8d6e4a 0%, #6d4f2e 50%, #5a3e22 100%)',
        boxShadow: '0 4px 12px rgba(0,0,0,.25), inset 0 1px 0 rgba(255,255,255,.1)',
      }} />
      {/* Inner frame */}
      <div style={{
        position: 'absolute', inset: '-4px',
        borderRadius: '3px',
        background: 'linear-gradient(135deg, #a08060, #7a5c3a)',
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,.2)',
      }} />
      {/* Window pane area */}
      <div style={{
        position: 'absolute', inset: '2px',
        borderRadius: '2px',
        overflow: 'hidden',
      }}>
        {children}
      </div>
      {/* Window divider cross (mullions) */}
      <div style={{
        position: 'absolute', inset: '2px',
        pointerEvents: 'none',
      }}>
        {/* Vertical divider */}
        <div style={{
          position: 'absolute', left: '50%', top: 0, bottom: 0, width: '3px',
          background: 'linear-gradient(180deg, #8d6e4a, #6d4f2e)',
          transform: 'translateX(-50%)',
          boxShadow: '0 1px 2px rgba(0,0,0,.15)',
        }} />
        {/* Horizontal divider */}
        <div style={{
          position: 'absolute', top: '50%', left: 0, right: 0, height: '3px',
          background: 'linear-gradient(90deg, #8d6e4a, #6d4f2e)',
          transform: 'translateY(-50%)',
          boxShadow: '1px 0 2px rgba(0,0,0,.15)',
        }} />
      </div>
      {/* Window sill */}
      <div style={{
        position: 'absolute', left: '-8px', right: '-8px', bottom: '-10px', height: '14px',
        background: 'linear-gradient(180deg, #a08060, #7a5c3a)',
        borderRadius: '2px 2px 4px 4px',
        boxShadow: '0 3px 6px rgba(0,0,0,.2), inset 0 1px 0 rgba(255,255,255,.1)',
      }} />
    </div>
  )
}
