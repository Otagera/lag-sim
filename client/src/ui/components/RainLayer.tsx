const DROPS = Array.from({ length: 60 }, (_, i) => ({
  id: i,
  left: Math.random() * 115 - 7,
  height: 13 + Math.random() * 24,
  dur: 0.5 + Math.random() * 0.55,
  delay: -(Math.random() * 2.8),
  opacity: 0.15 + Math.random() * 0.18,
  width: Math.random() < 0.2 ? 1.5 : 1,
}))

export function RainLayer() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 15,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {DROPS.map((d) => (
        <div
          key={d.id}
          style={{
            position: 'absolute',
            top: 0,
            left: `${d.left}%`,
            width: `${d.width}px`,
            height: `${d.height}px`,
            background: 'linear-gradient(to bottom, transparent, rgba(110,165,230,.55))',
            borderRadius: '1px',
            opacity: d.opacity,
            animation: `sl-rainfall ${d.dur}s ${d.delay}s linear infinite`,
          }}
        />
      ))}
    </div>
  )
}
