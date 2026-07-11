import 'maplibre-gl/dist/maplibre-gl.css'
import maplibregl from 'maplibre-gl'
import { useEffect, useRef, useState } from 'react'
import { CONSTITUENCIES } from '../data/constituencies'
import { useGameStore } from '../state/gameStore'
import type { MapLens } from '../state/mapSelectors'
import type { CapitalProject, ConstituencyKey } from '../state/types'
import { DistrictCanvas } from './DistrictCanvas'
import {
  buildFillExpression,
  buildProjectsGeoJSON,
  LGA_TO_SHAPE,
  SHAPE_TO_LGA,
} from './lagosGeoJSON'
import { LAGOS_ILLUSTRATED_STYLE } from './lagosMapStyle'
import { NightMapCanvas } from './map/NightMapCanvas'
import { LAYER_CONFIG, type MapLayer } from './mapData'

const STATUS_FILL = { stable: '#84cc86', warning: '#ceb47e', crisis: '#c56c65' }

function approvalStatus(v: number): 'stable' | 'warning' | 'crisis' {
  return v >= 60 ? 'stable' : v >= 40 ? 'warning' : 'crisis'
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null
  const W = 60,
    H = 16
  const xStep = W / (values.length - 1)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = Math.max(max - min, 10)
  const pts = values.map((v, i) => `${i * xStep},${H - ((v - min) / range) * H}`).join(' ')
  return (
    <svg width={W} height={H} style={{ display: 'block' }}>
      <title>Approval trend</title>
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ── Map layer setup helpers ──────────────────────────────────────────────────

function addMapSources(map: maplibregl.Map) {
  map.addSource('lagos-lgas', { type: 'geojson', data: '/data/lagos-lgas.geojson' })
  map.addSource('lagos-lcdas', { type: 'geojson', data: '/data/lagos-lcdas.geojson' })
}

function addMapLayers(map: maplibregl.Map) {
  const { constituencyApproval, stats } = useGameStore.getState()
  const { infrastructureScore: infraScore, securityIndex, youthTension } = stats
  map.addLayer({
    id: 'lga-fill',
    type: 'fill',
    source: 'lagos-lgas',
    paint: {
      'fill-color': buildFillExpression(
        constituencyApproval,
        null,
        infraScore,
        securityIndex,
        youthTension,
      ) as maplibregl.DataDrivenPropertyValueSpecification<string>,
      'fill-opacity': 0.4,
    },
  })
  map.addLayer({
    id: 'lga-border',
    type: 'line',
    source: 'lagos-lgas',
    paint: { 'line-color': '#ffffff', 'line-width': 0.8, 'line-opacity': 0.6 },
  })
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
  map.addLayer({
    id: 'lga-selected',
    type: 'line',
    source: 'lagos-lgas',
    filter: ['in', ['get', 'shapeName'], ['literal', []]],
    paint: { 'line-color': '#1a1a1a', 'line-width': 2.2 },
  })
}

function addProjectLayers(map: maplibregl.Map) {
  map.addSource('capital-projects', { type: 'geojson', data: buildProjectsGeoJSON([]) })
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
}

function bindMapEvents(
  map: maplibregl.Map,
  setSelected: (k: ConstituencyKey | null) => void,
  setMapMode: (m: 'overview' | 'district' | 'night') => void,
  setHoveredLGA: (k: ConstituencyKey | null) => void,
  setTooltipPos: (p: { x: number; y: number } | null) => void,
  mapContainerRef: React.RefObject<HTMLDivElement | null>,
) {
  map.on('click', 'lga-fill', (e) => {
    const lgaName = e.features?.[0]?.properties?.shapeName as string | undefined
    if (!lgaName) return
    const lgaKey = SHAPE_TO_LGA[lgaName]
    if (!lgaKey) return
    setSelected(lgaKey)
    setMapMode('district')
  })
  map.on('mouseenter', 'lga-fill', () => {
    map.getCanvas().style.cursor = 'pointer'
  })
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
}

function handleMapLoad(
  map: maplibregl.Map,
  mapContainerRef: React.RefObject<HTMLDivElement | null>,
  setSelected: (k: ConstituencyKey | null) => void,
  setMapMode: (m: 'overview' | 'district' | 'night') => void,
  setHoveredLGA: (k: ConstituencyKey | null) => void,
  setTooltipPos: (p: { x: number; y: number } | null) => void,
  setMapReady: (r: boolean) => void,
) {
  addMapSources(map)
  addMapLayers(map)
  addProjectLayers(map)
  bindMapEvents(map, setSelected, setMapMode, setHoveredLGA, setTooltipPos, mapContainerRef)
  setMapReady(true)
}

// ── Extracted view components ────────────────────────────────────────────────

const DOSSIER_CLOSE_BTN = {
  color: 'var(--text-secondary)',
  fontSize: 18,
  lineHeight: 1,
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
}
const PIN_SLOTS = [
  { x: 22, y: 38 },
  { x: 58, y: 28 },
  { x: 72, y: 52 },
  { x: 38, y: 62 },
  { x: 50, y: 42 },
  { x: 18, y: 65 },
]

function DistrictView({
  selected,
  capitalProjects,
  constituencyApproval,
  infraScore,
  youthTension,
  returnToOverview,
}: {
  selected: ConstituencyKey
  capitalProjects: CapitalProject[]
  constituencyApproval: Record<string, number>
  infraScore: number
  youthTension: number
  returnToOverview: () => void
}) {
  const lgaProjects = capitalProjects.filter(
    (p) => p.location === selected && (p.status === 'active' || p.status === 'stalled'),
  )
  const info = CONSTITUENCIES.find((c) => c.key === selected)
  const approval = constituencyApproval[selected] ?? 50

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <DistrictCanvas
        lgaKey={selected}
        approval={approval}
        infraScore={infraScore}
        youthTension={youthTension}
        activeProjects={lgaProjects}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, transparent 40%)',
          pointerEvents: 'none',
        }}
      />
      <div style={{ position: 'absolute', top: 10, left: 48, zIndex: 10 }}>
        <p
          style={{
            margin: 0,
            fontSize: 15,
            fontWeight: 700,
            color: '#fff',
            lineHeight: 1.1,
            textShadow: '0 1px 3px rgba(0,0,0,0.6)',
          }}
        >
          {info?.label ?? selected}
        </p>
        <span
          style={{
            display: 'inline-block',
            marginTop: 3,
            padding: '1px 6px',
            fontSize: 10,
            fontWeight: 600,
            backgroundColor: STATUS_FILL[approvalStatus(approval)],
            color: '#fff',
          }}
        >
          {approval.toFixed(0)}% approval
        </span>
      </div>
      {lgaProjects.map((p, i) => {
        const slot = PIN_SLOTS[i % PIN_SLOTS.length]
        const pinColor = p.status === 'stalled' ? '#c56c65' : '#e8a040'
        return (
          <div
            key={p.id}
            title={`${p.name} — ${p.status === 'stalled' ? 'Stalled' : `${p.weeksRemaining}w left`}`}
            style={{
              position: 'absolute',
              left: `${slot.x}%`,
              top: `${slot.y}%`,
              transform: 'translate(-50%, -100%)',
              zIndex: 10,
              cursor: 'default',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
            }}
          >
            <svg width="26" height="34" viewBox="0 0 26 34" fill="none">
              <title>{p.name}</title>
              <path
                d="M13 0C5.82 0 0 5.82 0 13C0 22.75 13 34 13 34C13 34 26 22.75 26 13C26 5.82 20.18 0 13 0Z"
                fill={pinColor}
              />
              <circle cx="13" cy="13" r="6" fill="white" opacity="0.92" />
            </svg>
          </div>
        )
      })}
      <button
        type="button"
        onClick={returnToOverview}
        style={{
          position: 'absolute',
          top: 8,
          left: 8,
          zIndex: 10,
          padding: '3px 10px',
          fontSize: 10,
          fontWeight: 600,
          backgroundColor: 'rgba(0,0,0,0.55)',
          border: '1px solid rgba(255,255,255,0.25)',
          color: '#fff',
          cursor: 'pointer',
          letterSpacing: '0.05em',
          backdropFilter: 'blur(4px)',
        }}
      >
        ← Overview
      </button>
    </div>
  )
}



function LGATooltip({
  hoveredLGA,
  tooltipPos,
  constituencyApproval,
  approvalHistory,
}: {
  hoveredLGA: ConstituencyKey
  tooltipPos: { x: number; y: number }
  constituencyApproval: Record<string, number>
  approvalHistory: Record<string, number[]>
}) {
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
    trend =
      secondHalf > firstHalf + 0.5 ? '\u2191' : secondHalf < firstHalf - 0.5 ? '\u2193' : '\u2192'
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
      <div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}
      >
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)' }}>{lgaInfo.label}</span>
        <span
          style={{ fontVariantNumeric: 'tabular-nums', fontSize: 11, fontWeight: 600, color: clr }}
        >
          {appr.toFixed(0)}% {trend}
        </span>
      </div>
      {hist.length < 2 ? (
        <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
          history building&hellip;
        </span>
      ) : (
        <Sparkline values={hist} color={clr} />
      )}
    </div>
  )
}

function DistrictDossier({
  selectedInfo,
  selectedApproval,
  infraScore,
  securityIndex,
  youthTension,
  capitalProjects,
  setSelected,
  selected,
}: {
  selectedInfo: { key: ConstituencyKey; label: string; description: string }
  selectedApproval: number
  infraScore: number
  securityIndex: number
  youthTension: number
  capitalProjects: CapitalProject[]
  setSelected: (k: ConstituencyKey | null) => void
  selected: ConstituencyKey
}) {
  const st = approvalStatus(selectedApproval)
  const dossierColors = {
    stable: { bg: 'var(--success-3)', text: 'var(--success-11)' },
    warning: { bg: 'var(--warning-3)', text: 'var(--warning-11)' },
    crisis: { bg: 'var(--error-3)', text: 'var(--error-11)' },
  }[st]
  const lgaProjects = capitalProjects.filter(
    (p) => p.location === selected && (p.status === 'active' || p.status === 'stalled'),
  )

  return (
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
        <button type="button" onClick={() => setSelected(null)} style={DOSSIER_CLOSE_BTN}>
          &times;
        </button>
      </div>
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
      {[
        { label: 'Infrastructure', value: `${infraScore.toFixed(0)} / 100` },
        { label: 'Security', value: `${securityIndex.toFixed(0)} / 100` },
        { label: 'Youth Tension', value: `${youthTension.toFixed(0)}%` },
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
      {lgaProjects.length > 0 && (
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
                style={{
                  height: 4,
                  background: 'var(--neutral-4)',
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${p.effectiveProgress}%`,
                    background: p.status === 'stalled' ? 'var(--error-9)' : 'var(--accent-solid)',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
              <p style={{ fontSize: 10, color: 'var(--text-secondary)', margin: '3px 0 0' }}>
                {p.effectiveProgress.toFixed(0)}% complete &middot; &#8358;{p.weeklyDraw.toFixed(2)}
                bn/wk draw
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function MapHeader({
  layer,
  setLayer,
  mapMode,
  setMapMode,
}: {
  layer: MapLayer | null
  setLayer: (l: MapLayer | null) => void
  mapMode: 'overview' | 'district' | 'night'
  setMapMode: (m: 'overview' | 'district' | 'night') => void
}) {
  const layers = Object.entries(LAYER_CONFIG) as [MapLayer, (typeof LAYER_CONFIG)[MapLayer]][]
  return (
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
      <div style={{ marginLeft: 'auto' }}>
        <button
          type="button"
          onClick={() => setMapMode(mapMode === 'night' ? 'overview' : 'night')}
          className="px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide transition-colors"
          style={{
            color: mapMode === 'night' ? 'var(--text)' : 'var(--text-secondary)',
            borderBottom: mapMode === 'night' ? '2px solid #3a6fa8' : '2px solid transparent',
          }}
        >
          Night City
        </button>
      </div>
    </div>
  )
}

function MapLegend({ layer }: { layer: MapLayer | null }) {
  return (
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
      {(
        [
          { color: STATUS_FILL.stable, label: '\u226560%' },
          { color: STATUS_FILL.warning, label: '40\u201359%' },
          { color: STATUS_FILL.crisis, label: '<40%' },
        ] as const
      ).map(({ color, label }) => (
        <div key={label} style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
          <span className="label-caps">{label}</span>
        </div>
      ))}
    </div>
  )
}

function createMap(container: HTMLDivElement) {
  return new maplibregl.Map({
    container,
    style: LAGOS_ILLUSTRATED_STYLE,
    center: [3.38, 6.52],
    zoom: 9.8,
    scrollZoom: false,
    boxZoom: false,
    dragRotate: false,
    dragPan: false,
    keyboard: false,
    doubleClickZoom: false,
    touchZoomRotate: false,
    attributionControl: false,
  })
}

function MapViewport({
  mapContainerRef,
  mapMode,
  layer,
  selected,
  capitalProjects,
  constituencyApproval,
  infraScore,
  youthTension,
  returnToOverview,
}: {
  mapContainerRef: React.RefObject<HTMLDivElement | null>
  mapMode: 'overview' | 'district' | 'night'
  layer: MapLayer | null
  selected: ConstituencyKey | null
  capitalProjects: CapitalProject[]
  constituencyApproval: Record<string, number>
  infraScore: number
  youthTension: number
  returnToOverview: () => void
}) {
  return (
    <div style={{ position: 'relative', width: '100%', height: 340, overflow: 'hidden' }}>
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: '100%',
          display: mapMode === 'overview' ? 'block' : 'none',
        }}
      />
      {mapMode === 'night' && (
        <div style={{ position: 'absolute', inset: 0 }}>
          <NightMapCanvas
            lens={(layer === 'youthTension' ? 'youth' : (layer ?? 'approval')) as MapLens}
          />
        </div>
      )}
      {mapMode === 'district' && selected && (
        <DistrictView
          selected={selected}
          capitalProjects={capitalProjects}
          constituencyApproval={constituencyApproval}
          infraScore={infraScore}
          youthTension={youthTension}
          returnToOverview={returnToOverview}
        />
      )}
    </div>
  )
}

function useMapInit(
  mapContainerRef: React.RefObject<HTMLDivElement | null>,
  mapRef: React.MutableRefObject<maplibregl.Map | null>,
  setSelected: (k: ConstituencyKey | null) => void,
  setMapMode: (m: 'overview' | 'district' | 'night') => void,
  setHoveredLGA: (k: ConstituencyKey | null) => void,
  setTooltipPos: (p: { x: number; y: number } | null) => void,
  setMapReady: (r: boolean) => void,
) {
  useEffect(() => {
    if (!mapContainerRef.current) return
    const map = createMap(mapContainerRef.current)
    map.on('load', () =>
      handleMapLoad(
        map,
        mapContainerRef,
        setSelected,
        setMapMode,
        setHoveredLGA,
        setTooltipPos,
        setMapReady,
      ),
    )
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [mapContainerRef, mapRef, setSelected, setMapMode, setHoveredLGA, setTooltipPos, setMapReady])
}

function useReactiveMap(
  mapRef: React.MutableRefObject<maplibregl.Map | null>,
  mapReady: boolean,
  constituencyApproval: Record<string, number>,
  layer: MapLayer | null,
  infraScore: number,
  securityIndex: number,
  youthTension: number,
  selected: ConstituencyKey | null,
  capitalProjects: CapitalProject[],
) {
  useEffect(() => {
    if (!mapReady || !mapRef.current) return
    const map = mapRef.current
    const fillExpr = buildFillExpression(
      constituencyApproval,
      layer,
      infraScore,
      securityIndex,
      youthTension,
    ) as maplibregl.DataDrivenPropertyValueSpecification<string>
    map.setPaintProperty('lga-fill', 'fill-color', fillExpr)
    const shapeToHighlight = selected ? [LGA_TO_SHAPE[selected]] : []
    map.setFilter('lga-selected', ['in', ['get', 'shapeName'], ['literal', shapeToHighlight]])
    const src = map.getSource('capital-projects') as maplibregl.GeoJSONSource | undefined
    src?.setData(buildProjectsGeoJSON(capitalProjects))
  }, [
    mapReady,
    constituencyApproval,
    layer,
    selected,
    infraScore,
    securityIndex,
    youthTension,
    capitalProjects,
    mapRef.current,
  ])
}

// ── Main component ───────────────────────────────────────────────────────────

export function MapPanel() {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const constituencyApproval = useGameStore((s) => s.constituencyApproval)
  const approvalHistory = useGameStore((s) => s.approvalHistory)
  const infraScore = useGameStore((s) => s.stats.infrastructureScore)
  const securityIndex = useGameStore((s) => s.stats.securityIndex)
  const youthTension = useGameStore((s) => s.stats.youthTension)
  const capitalProjects = useGameStore((s) => s.capitalProjects)
  const [layer, setLayer] = useState<MapLayer | null>(null)
  const [selected, setSelected] = useState<ConstituencyKey | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [hoveredLGA, setHoveredLGA] = useState<ConstituencyKey | null>(null)
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null)
  const [mapMode, setMapMode] = useState<'overview' | 'district' | 'night'>('overview')

  useMapInit(
    mapContainerRef,
    mapRef,
    setSelected,
    setMapMode,
    setHoveredLGA,
    setTooltipPos,
    setMapReady,
  )
  useReactiveMap(
    mapRef,
    mapReady,
    constituencyApproval,
    layer,
    infraScore,
    securityIndex,
    youthTension,
    selected,
    capitalProjects,
  )

  function returnToOverview() {
    setMapMode('overview')
    setSelected(null)
  }

  const selectedInfo = selected ? CONSTITUENCIES.find((c) => c.key === selected) : null
  const selectedApproval = selected ? (constituencyApproval[selected] ?? 50) : 50

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        backgroundColor: 'var(--surface)',
        position: 'relative',
      }}
    >
      <MapHeader layer={layer} setLayer={setLayer} mapMode={mapMode} setMapMode={setMapMode} />
      <MapViewport
        mapContainerRef={mapContainerRef}
        mapMode={mapMode}
        layer={layer}
        selected={selected}
        capitalProjects={capitalProjects}
        constituencyApproval={constituencyApproval}
        infraScore={infraScore}
        youthTension={youthTension}
        returnToOverview={returnToOverview}
      />
      {hoveredLGA && hoveredLGA !== selected && tooltipPos && (
        <LGATooltip
          hoveredLGA={hoveredLGA}
          tooltipPos={tooltipPos}
          constituencyApproval={constituencyApproval}
          approvalHistory={approvalHistory}
        />
      )}
      <MapLegend layer={layer} />
      {selectedInfo && (
        <DistrictDossier
          selectedInfo={selectedInfo}
          selectedApproval={selectedApproval}
          infraScore={infraScore}
          securityIndex={securityIndex}
          youthTension={youthTension}
          capitalProjects={capitalProjects}
          setSelected={setSelected}
          selected={selected as ConstituencyKey}
        />
      )}
    </div>
  )
}
