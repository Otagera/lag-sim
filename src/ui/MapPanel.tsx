import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useGameStore } from '../state/gameStore'
import { type MapLayer, LAYER_CONFIG, BASE_W, BASE_H, DISTRICTS, interpolateColor, borderColor, getLayerValue, projectToIso } from './mapData'
import { generateCityScene } from '../data/cityScene'
import { drawCity } from '../engine/cityRenderer'

export function MapPanel() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const constituencyApproval = useGameStore((s) => s.constituencyApproval)
  const infraScore = useGameStore((s) => s.stats.infrastructureScore)
  const securityIndex = useGameStore((s) => s.stats.securityIndex)
  const youthTension = useGameStore((s) => s.stats.youthTension)
  const seed = useGameStore((s) => s.runMeta.simSeed ?? 42)

  const [layer, setLayer] = useState<MapLayer | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)

  const scene = useMemo(() => generateCityScene(seed), [seed])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const rect = container.getBoundingClientRect()
    if (rect.width === 0) return

    const dpr = window.devicePixelRatio || 1
    const w = rect.width
    const h = Math.round(w * BASE_H / BASE_W)

    canvas.width = w * dpr
    canvas.height = h * dpr
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.scale(dpr, dpr)

    const scale = w / BASE_W

    // Draw full city illustration
    drawCity(ctx, w, h, scale, 0, 0, scene)

    // Data layer overlay
    if (layer) {
      const cfg = LAYER_CONFIG[layer]
      const drawOrder = [
        'periphery', 'alimosho', 'oshodi', 'surulere',
        'lagosIsland', 'makoko', 'victoriaIsland', 'lekki',
      ] as const
      for (const key of drawOrder) {
        const d = DISTRICTS.find(x => x.key === key)
        if (!d) continue
        const scaled = d.points.map(([x, y]) => projectToIso(x, y, scale, 0, 0))
        const layerVal = getLayerValue(
          layer, d.key,
          constituencyApproval, infraScore, securityIndex, youthTension,
        )
        const isHovered = hovered === d.key
        const [r, g, b, a] = interpolateColor(layerVal, cfg.inverted)
        const bCol = borderColor(layerVal, cfg.inverted)

        ctx.beginPath()
        ctx.moveTo(scaled[0][0], scaled[0][1])
        for (let i = 1; i < scaled.length; i++) ctx.lineTo(scaled[i][0], scaled[i][1])
        ctx.closePath()
        ctx.fillStyle = `rgba(${r},${g},${b},${a})`
        ctx.fill()
        ctx.strokeStyle = isHovered ? '#FFFFFF' : bCol
        ctx.lineWidth = isHovered ? 2.5 * scale : 1.5 * scale
        ctx.stroke()

        // Pin with value
        if (isHovered) {
          const [cx, cy] = projectToIso(d.centroid[0], d.centroid[1], scale, 0, 0)
          const bounce = Math.sin(performance.now() * 0.004 + (d.centroid[0] + d.centroid[1]) * 0.04) * 3 * scale
          const labelY = cy - 10 * scale + bounce

          // Shadow beneath label
          ctx.fillStyle = 'rgba(0,0,0,0.10)'
          ctx.beginPath()
          ctx.ellipse(cx, cy, 18 * scale, 6 * scale, 0, 0, Math.PI * 2)
          ctx.fill()

          ctx.fillStyle = 'rgba(255,255,255,0.92)'
          const text = `${cfg.inverted ? 100 - layerVal : layerVal}%`
          ctx.font = `bold ${Math.round(10 * scale)}px "Archivo Narrow", sans-serif`
          const tw = ctx.measureText(text).width
          const pad = 6 * scale
          const bx = cx - tw / 2 - pad
          const by2 = labelY - 9 * scale
          const bw = tw + pad * 2
          const bh = 18 * scale
          ctx.beginPath()
          ctx.roundRect(bx, by2, bw, bh, 3)
          ctx.fill()
          ctx.fillStyle = '#333'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(text, cx, by2 + bh / 2)
        }
      }
    }
  }, [scene, layer, hovered, constituencyApproval, infraScore, securityIndex, youthTension])

  const drawRef = useRef(draw)
  drawRef.current = draw

  useEffect(() => {
    let frameId: number
    const loop = () => {
      drawRef.current()
      frameId = requestAnimationFrame(loop)
    }
    frameId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frameId)
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const ro = new ResizeObserver(() => draw())
    ro.observe(container)
    return () => ro.disconnect()
  }, [draw])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const scale2 = rect.width / BASE_W
    let found: string | null = null
    for (const d of DISTRICTS) {
      const scaled = d.points.map(([x, y]) => projectToIso(x, y, scale2, 0, 0))
      let inside = false
      for (let i = 0, j = scaled.length - 1; i < scaled.length; j = i++) {
        const xi = scaled[i][0], yi = scaled[i][1]
        const xj = scaled[j][0], yj = scaled[j][1]
        if ((yi > my) !== (yj > my) && mx < ((xj - xi) * (my - yi)) / (yj - yi) + xi) inside = !inside
      }
      if (inside) { found = d.key; break }
    }
    setHovered(found)
  }, [])

  const handleMouseLeave = useCallback(() => setHovered(null), [])

  const layers = Object.entries(LAYER_CONFIG) as [MapLayer, typeof LAYER_CONFIG[MapLayer]][]

  return (
    <div style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
      <div className="flex items-center gap-2 p-2" style={{ borderBottom: '1px solid var(--border)' }}>
        <button
          type="button"
          onClick={() => setLayer(null)}
          className="px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide transition-colors"
          style={{
            color: layer === null ? 'var(--text)' : 'var(--text-secondary)',
            borderBottom: layer === null ? '2px solid var(--accent-solid)' : '2px solid transparent',
          }}
        >
          Map
        </button>
        {layers.map(([key, cfg]) => (
          <button
            key={key}
            type="button"
            onClick={() => setLayer(key === layer ? null : key)}
            className="px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide transition-colors"
            style={{
              color: layer === key ? 'var(--text)' : 'var(--text-secondary)',
              borderBottom: layer === key ? '2px solid var(--accent-solid)' : '2px solid transparent',
            }}
          >
            {cfg.label}
          </button>
        ))}
      </div>
      <div ref={containerRef}>
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ display: 'block', width: '100%', cursor: layer ? 'pointer' : 'default' }}
        />
      </div>
    </div>
  )
}
