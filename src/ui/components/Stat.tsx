import { useEffect, useRef, useState } from 'react'

interface StatProps {
  label:      string
  value:      number
  format?:    'number' | 'currency' | 'percent'
  warn?:      boolean  // threshold breach — triggers pulse
  danger?:    boolean
  suffix?:    string
  decimals?:  number
  title?:     string   // native tooltip on hover
}

function useCountTo(target: number, dur = 700) {
  const [display, setDisplay] = useState(target)
  const prev = useRef(target)
  const raf  = useRef<number>(0)

  useEffect(() => {
    if (prev.current === target) return
    const start = prev.current
    const delta = target - start
    const t0    = performance.now()

    cancelAnimationFrame(raf.current)
    raf.current = requestAnimationFrame(function tick(now) {
      const p = Math.min((now - t0) / dur, 1)
      setDisplay(start + delta * p)
      if (p < 1) raf.current = requestAnimationFrame(tick)
      else        prev.current = target
    })
    return () => cancelAnimationFrame(raf.current)
  }, [target, dur])

  return display
}

function fmt(v: number, format: StatProps['format'], decimals = 0, suffix = '') {
  switch (format) {
    case 'currency': return `₦${v.toFixed(1)}bn${suffix}`
    case 'percent':  return `${Math.round(v)}%${suffix}`
    default:         return `${decimals > 0 ? v.toFixed(decimals) : Math.round(v)}${suffix}`
  }
}

export function Stat({ label, value, format = 'number', warn, danger, suffix, decimals, title }: StatProps) {
  const display = useCountTo(value)

  const color = danger ? 'var(--error-9)' :
                warn   ? 'var(--warning-9)' :
                'var(--text)'

  return (
    <div title={title} style={{ display: 'flex', flexDirection: 'column', gap: '1px', minWidth: 0 }}>
      <div className="label-caps" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {label}
      </div>
      <div
        className={warn ? 'stat-warn' : ''}
        style={{
          fontFamily:     "'Archivo Narrow', sans-serif",
          fontSize:       '16px',
          fontWeight:     600,
          color,
          lineHeight:     1.2,
          fontVariantNumeric: 'tabular-nums',
          transition:     'color 300ms ease',
        }}
      >
        {fmt(display, format, decimals, suffix)}
      </div>
    </div>
  )
}
