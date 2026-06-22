import 'maplibre-gl/dist/maplibre-gl.css'
import maplibregl from 'maplibre-gl'
import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../state/gameStore'
import type { ConstituencyKey } from '../state/types'
import { type MapLayer, LAYER_CONFIG } from './mapData'
import { LAGOS_ILLUSTRATED_STYLE } from './lagosMapStyle'
import {
  SHAPE_TO_LGA,
  LGA_TO_SHAPE,
  buildFillExpression,
  buildProjectsGeoJSON,
} from './lagosGeoJSON'
import { CONSTITUENCIES } from '../data/constituencies'

// Hex values matching tokens.css — Maplibre can't consume CSS vars
const STATUS_FILL   = { stable: '#84cc86', warning: '#ceb47e', crisis: '#c56c65' }

function approvalStatus(v: number): 'stable' | 'warning' | 'crisis' {
  return v >= 60 ? 'stable' : v >= 40 ? 'warning' : 'crisis'
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null
  const W = 60, H = 16
  const xStep = W / (values.length - 1)
  const pts = values.map((v, i) => `${i * xStep},${H - (v / 100) * H}`).join(' ')
  return (
    <svg width={W} height={H} style={{ display: 'block' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5}
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function MapPanel() {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef          = useRef<maplibregl.Map | null>(null)

  const constituencyApproval = useGameStore((s) => s.constituencyApproval)
  const approvalHistory  = useGameStore((s) => s.approvalHistory)
  const infraScore       = useGameStore((s) => s.stats.infrastructureScore)
  const securityIndex    = useGameStore((s) => s.stats.securityIndex)
  const youthTension     = useGameStore((s) => s.stats.youthTension)
  const capitalProjects  = useGameStore((s) => s.capitalProjects)

  const [layer, setLayer]         = useState<MapLayer | null>(null)
  const [selected, setSelected]   = useState<ConstituencyKey | null>(null)
  const [mapReady, setMapReady]   = useState(false)
  const [hoveredLGA, setHoveredLGA] = useState<ConstituencyKey | null>(null)
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null)

  // Initialize Maplibre once on mount
  useEffect(() => {
    if (!mapContainerRef.current) return

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: LAGOS_ILLUSTRATED_STYLE,
      center: [3.38, 6.52],
      zoom: 9.8,
      // Dashboard mode: no navigation, but clicks are active
      scrollZoom: false,
      boxZoom: false,
      dragRotate: false,
      dragPan: false,
      keyboard: false,
      doubleClickZoom: false,
      touchZoomRotate: false,
      attributionControl: false,
    })

    map.on('load', () => {
      // ── LGA source (real Lagos administrative boundaries) ──────────────
      map.addSource('lagos-lgas', {
        type: 'geojson',
        data: '/data/lagos-lgas.geojson',
      })

      // ── LCDA source (OSM subdivision lines — may be empty if not fetched) ──
      map.addSource('lagos-lcdas', {
        type: 'geojson',
        data: '/data/lagos-lcdas.geojson',
      })

      // 1. LGA fill — constituency status color
      map.addLayer({
        id: 'lga-fill',
        type: 'fill',
        source: 'lagos-lgas',
        paint: {
          'fill-color': buildFillExpression(
            constituencyApproval, null, infraScore, securityIndex, youthTension,
          ) as maplibregl.DataDrivenPropertyValueSpecification<string>,
          'fill-opacity': 0.40,
        },
      })

      // 2. LGA borders — white lines showing LGA boundaries
      map.addLayer({
        id: 'lga-border',
        type: 'line',
        source: 'lagos-lgas',
        paint: {
          'line-color': '#ffffff',
          'line-width': 0.8,
          'line-opacity': 0.6,
        },
      })

      // 3. LCDA subdivision lines — thin dashed, shows finer administrative detail
      map.addLayer({
        id: 'lcda-border',
        type: 'line',
        source: 'lagos-lcdas',
        paint: {
          'line-color': '#ffffff',
          'line-width': 0.4,
          'line-opacity': 0.35,
          'line-dasharray': [3, 2],
        },
      })

      // 4. Selected constituency highlight — dark border on all LGAs in selected constituency
      map.addLayer({
        id: 'lga-selected',
        type: 'line',
        source: 'lagos-lgas',
        filter: ['in', ['get', 'shapeName'], ['literal', []]],
        paint: {
          'line-color': '#1a1a1a',
          'line-width': 2.2,
        },
      })

      // 5. Capital project markers
      map.addSource('capital-projects', {
        type: 'geojson',
        data: buildProjectsGeoJSON([]),
      })

      // Outer glow ring — stalled=red, active=amber
      map.addLayer({
        id: 'project-ring',
        type: 'circle',
        source: 'capital-projects',
        paint: {
          'circle-radius': 11,
          'circle-color': ['match', ['get', 'status'], 'stalled', '#c56c65', '#ceb47e'],
          'circle-opacity': 0.28,
          'circle-stroke-width': 0,
        },
      })

      // Inner solid dot
      map.addLayer({
        id: 'project-dot',
        type: 'circle',
        source: 'capital-projects',
        paint: {
          'circle-radius': 5,
          'circle-color': ['match', ['get', 'status'], 'stalled', '#c56c65', '#e8a040'],
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 1.5,
        },
      })

      // Click on any LGA → select it directly
      map.on('click', 'lga-fill', (e) => {
        const lgaName = e.features?.[0]?.properties?.shapeName as string | undefined
        if (!lgaName) return
        const lgaKey = SHAPE_TO_LGA[lgaName]
        if (lgaKey) setSelected((prev) => (prev === lgaKey ? null : lgaKey))
      })
      map.on('mouseenter', 'lga-fill', () => { map.getCanvas().style.cursor = 'pointer' })

      // Hover tooltip: track LGA under cursor
      map.on('mousemove', 'lga-fill', (e) => {
        const lgaName = e.features?.[0]?.properties?.shapeName as string | undefined
        if (!lgaName || !mapContainerRef.current) return
        const lgaKey = SHAPE_TO_LGA[lgaName]
        if (!lgaKey) return
        setHoveredLGA(lgaKey)
        const rect = mapContainerRef.current.getBoundingClientRect()
        setTooltipPos({ x: e.originalEvent.clientX - rect.left, y: e.originalEvent.clientY - rect.top })
      })

      map.on('mouseleave', 'lga-fill', () => {
        map.getCanvas().style.cursor = ''
        setHoveredLGA(null)
        setTooltipPos(null)
      })

      setMapReady(true)
    })

    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Reactively update LGA fill colors, selected highlight, and project markers
  useEffect(() => {
    if (!mapReady || !mapRef.current) return
    const map = mapRef.current

    // Update fill colors via setPaintProperty (efficient — no GeoJSON re-upload)
    map.setPaintProperty(
      'lga-fill',
      'fill-color',
      buildFillExpression(
        constituencyApproval, layer, infraScore, securityIndex, youthTension,
      ) as maplibregl.DataDrivenPropertyValueSpecification<string>,
    )

    // Highlight the selected LGA
    const shapeToHighlight = selected ? [LGA_TO_SHAPE[selected]] : []
    map.setFilter('lga-selected', ['in', ['get', 'shapeName'], ['literal', shapeToHighlight]])

    // Update capital project marker positions
    const src = map.getSource('capital-projects') as maplibregl.GeoJSONSource | undefined
    src?.setData(buildProjectsGeoJSON(capitalProjects))
  }, [mapReady, constituencyApproval, layer, selected, infraScore, securityIndex, youthTension, capitalProjects])

  const layers = Object.entries(LAYER_CONFIG) as [MapLayer, typeof LAYER_CONFIG[MapLayer]][]

  const selectedInfo    = selected ? CONSTITUENCIES.find((c) => c.key === selected) : null
  const selectedApproval = selected ? (constituencyApproval[selected] ?? 50) : 50
  const status          = approvalStatus(selectedApproval)
  const dossierColors   = {
    stable:  { bg: 'var(--success-3)', text: 'var(--success-11)' },
    warning: { bg: 'var(--warning-3)', text: 'var(--warning-11)' },
    crisis:  { bg: 'var(--error-3)',   text: 'var(--error-11)' },
  }[status]
  const selectedShapeName = selected ? LGA_TO_SHAPE[selected] : null

  return (
    <div style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)', position: 'relative' }}>
      {/* Header: layer tabs */}
      <div
        style={{
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '4px 8px',
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          onClick={() => setLayer(null)}
          className="px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide transition-colors"
          style={{
            color: layer === null ? 'var(--text)' : 'var(--text-secondary)',
            borderBottom: layer === null ? '2px solid var(--accent-solid)' : '2px solid transparent',
          }}
        >
          Approval
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

      {/* Maplibre container */}
      <div ref={mapContainerRef} style={{ width: '100%', height: 340 }} />

      {/* Hover tooltip — suppressed when LGA is selected (dossier shows full detail) */}
      {hoveredLGA && hoveredLGA !== selected && tooltipPos && (() => {
        const lgaInfo = CONSTITUENCIES.find((c) => c.key === hoveredLGA)
        if (!lgaInfo) return null
        const appr = constituencyApproval[hoveredLGA] ?? 50
        const hist = approvalHistory[hoveredLGA] ?? []
        const st = approvalStatus(appr)
        const clr = STATUS_FILL[st]

        let trend = '\u2192'
        if (hist.length >= 4) {
          const half = Math.floor(hist.length / 2)
          const firstHalf = hist.slice(0, half).reduce((a, b) => a + b, 0) / half
          const secondHalf = hist.slice(half).reduce((a, b) => a + b, 0) / (hist.length - half)
          trend = secondHalf > firstHalf + 0.5 ? '\u2191' : secondHalf < firstHalf - 0.5 ? '\u2193' : '\u2192'
        }

        const flipLeft = tooltipPos.x > 240

        return (
          <div
            style={{
              position: 'absolute',
              top: tooltipPos.y - 20,
              left: flipLeft ? undefined : tooltipPos.x + 12,
              right: flipLeft ? 8 : undefined,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              padding: '6px 10px',
              pointerEvents: 'none',
              zIndex: 50,
              minWidth: 120,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)' }}>{lgaInfo.label}</span>
              <span style={{ fontVariantNumeric: 'tabular-nums', fontSize: 11, fontWeight: 600, color: clr }}>
                {appr.toFixed(0)}% {trend}
              </span>
            </div>
            {hist.length < 2 ? (
              <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>history building\u2026</span>
            ) : (
              <Sparkline values={hist} color={clr} />
            )}
          </div>
        )
      })()}

      {/* Status legend */}
      <div
        style={{
          borderTop: '1px solid var(--border)',
          padding: '4px 12px',
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          background: 'var(--background)',
        }}
      >
        <span className="label-caps" style={{ marginRight: 4 }}>
          {layer ? LAYER_CONFIG[layer].label : 'Approval'}
        </span>
        {([
          { color: STATUS_FILL.stable,  label: '≥60%' },
          { color: STATUS_FILL.warning, label: '40–59%' },
          { color: STATUS_FILL.crisis,  label: '<40%' },
        ] as const).map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
            <span className="label-caps">{label}</span>
          </div>
        ))}
      </div>

      {/* District dossier */}
      {selectedInfo && (
        <div
          style={{
            borderTop: '1px solid var(--border)',
            padding: '12px 16px',
            background: 'var(--background)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 8,
            }}
          >
            <div>
              <p
                className="font-display"
                style={{ fontSize: 20, fontWeight: 600, margin: 0, color: 'var(--text)' }}
              >
                {selectedInfo.label}
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: 0 }}>
                {selectedInfo.description}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelected(null)}
              style={{
                color: 'var(--text-secondary)',
                fontSize: 18,
                lineHeight: 1,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              ×
            </button>
          </div>

          {/* Approval badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: dossierColors.bg,
              color: dossierColors.text,
              padding: '2px 8px',
              marginBottom: 12,
            }}
          >
            <span className="label-caps">Approval</span>
            <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
              {selectedApproval.toFixed(0)}%
            </span>
          </div>

          {/* Stat rows */}
          {[
            { label: 'Infrastructure', value: `${infraScore.toFixed(0)} / 100` },
            { label: 'Security',       value: `${securityIndex.toFixed(0)} / 100` },
            { label: 'Youth Tension',  value: `${youthTension.toFixed(0)}%` },
          ].map(({ label, value }) => (
            <div
              key={label}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '4px 0',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{label}</span>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{value}</span>
            </div>
          ))}

          {/* Capital project cards */}
          {(() => {
            const lgaProjects = capitalProjects.filter(
              (p) => p.location === selected && (p.status === 'active' || p.status === 'stalled'),
            )
            if (lgaProjects.length === 0) return null
            return (
              <div style={{ marginTop: 12 }}>
                <p className="label-caps" style={{ marginBottom: 6, color: 'var(--text-secondary)' }}>
                  Active Works
                </p>
                {lgaProjects.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      marginBottom: 8,
                      padding: '6px 8px',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)' }}>
                        {p.name}
                      </span>
                      <span
                        className="label-caps"
                        style={{
                          color: p.status === 'stalled' ? 'var(--error-11)' : 'var(--warning-11)',
                        }}
                      >
                        {p.status === 'stalled' ? 'Stalled' : `${p.weeksRemaining}w left`}
                      </span>
                    </div>
                    <div
                      style={{ height: 4, background: 'var(--neutral-4)', borderRadius: 2, overflow: 'hidden' }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${p.effectiveProgress}%`,
                          background: p.status === 'stalled'
                            ? 'var(--error-9)'
                            : 'var(--accent-solid)',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                    <p style={{ fontSize: 10, color: 'var(--text-secondary)', margin: '3px 0 0' }}>
                      {p.effectiveProgress.toFixed(0)}% complete · ₦{p.weeklyDraw.toFixed(2)}bn/wk draw
                    </p>
                  </div>
                ))}
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}
