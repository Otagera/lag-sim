import { useRef, useState } from 'react'
import type { ShareCardData } from './buildShareCardData'
import { downloadOrShare, exportCard } from './exportCard'
import { ShareCard } from './ShareCard'

const FIXTURES: ShareCardData[] = [
  {
    exitLabel: 'State Insolvency \u2014 Term Cut Short',
    verdictHeadline: 'The Governor Who Ran Out of Road',
    tenure: 'WEEK 27 \u2014 JULY 2027',
    weekCount: 27,
    decisionCount: 34,
    keyMoments: [
      {
        week: 8,
        type: 'event',
        title: 'Makoko Market Fire \u2014 200 Shops Destroyed',
        description: 'A pre-dawn fire swept through Makoko.',
      },
      {
        week: 14,
        type: 'event',
        title: 'FAAC Shortfall Triggers Treasury Crisis',
        description: 'Federation allocation cut by 22%.',
      },
      {
        week: 22,
        type: 'godfather',
        title: 'Fashemu Demands Building Permit Fast-Track',
        description: 'The godfather applied pressure.',
      },
    ],
    grades: [
      { key: 'publicTrust', label: 'Trust', value: 18, grade: 'F', color: '#D7322A' },
      { key: 'infrastructureScore', label: 'Infra', value: 34, grade: 'F', color: '#D7322A' },
      { key: 'securityIndex', label: 'Security', value: 52, grade: 'D', color: '#C08C0C' },
      { key: 'youthTension', label: 'Youth', value: 30, grade: 'F', color: '#D7322A' },
    ],
    hasFashemuEnding: true,
    endingFlavor: 'crisis',
    gameVersion: 'v0.0.0 \u00b7 Week 27',
  },
  {
    exitLabel: 'Removal by Assembly',
    verdictHeadline: 'The Machine Strikes Back',
    tenure: 'WEEK 88 \u2014 FEBRUARY 2029',
    weekCount: 88,
    decisionCount: 112,
    keyMoments: [
      {
        week: 34,
        type: 'event',
        title: 'LAHA Speaker Challenges Executive Bill 47',
        description: '23 lawmakers blocked the second reading.',
      },
      {
        week: 67,
        type: 'milestone',
        title: 'Fourth Mainland Bridge Phase One Opens',
        description: 'Travel time to Ikorodu halved.',
      },
    ],
    grades: [
      { key: 'publicTrust', label: 'Trust', value: 42, grade: 'D', color: '#C08C0C' },
      { key: 'infrastructureScore', label: 'Infra', value: 68, grade: 'C', color: '#C08C0C' },
      { key: 'securityIndex', label: 'Security', value: 71, grade: 'C', color: '#C08C0C' },
      { key: 'youthTension', label: 'Youth', value: 55, grade: 'D', color: '#C08C0C' },
    ],
    hasFashemuEnding: false,
    endingFlavor: 'teal',
    gameVersion: 'v0.0.0 \u00b7 Week 88',
  },
  {
    exitLabel: 'Mass Uprising \u2014 Government Overwhelmed',
    verdictHeadline: 'The Governor the Streets Rejected',
    tenure: 'WEEK 52 \u2014 JANUARY 2028',
    weekCount: 52,
    decisionCount: 67,
    keyMoments: [
      {
        week: 12,
        type: 'event',
        title: 'Youth Council Rally Mobilises 6,000',
        description: 'Dayo Afolabi led the march.',
      },
      {
        week: 38,
        type: 'event',
        title: 'Flooding Displaces 12,000 in Ajegunle',
        description: 'Emergency declared.',
      },
      {
        week: 48,
        type: 'delayed-consequence',
        title: 'Public Trust Collapses After Austerity',
        description: 'Approval dropped below 15%.',
      },
    ],
    grades: [
      { key: 'publicTrust', label: 'Trust', value: 11, grade: 'F', color: '#D7322A' },
      { key: 'infrastructureScore', label: 'Infra', value: 42, grade: 'D', color: '#C08C0C' },
      { key: 'securityIndex', label: 'Security', value: 35, grade: 'F', color: '#D7322A' },
      { key: 'youthTension', label: 'Youth', value: 8, grade: 'F', color: '#D7322A' },
    ],
    hasFashemuEnding: false,
    endingFlavor: 'crisis',
    gameVersion: 'v0.0.0 \u00b7 Week 52',
  },
  {
    exitLabel: 'Two Terms Complete \u2014 Legacy Sealed',
    verdictHeadline: 'Eight Years in the Hardest Job',
    tenure: 'WEEK 416 \u2014 MAY 2034',
    weekCount: 416,
    decisionCount: 384,
    keyMoments: [
      {
        week: 112,
        type: 'milestone',
        title: 'Fourth Mainland Bridge Fully Completed',
        description: 'The signature infrastructure achievement.',
      },
      {
        week: 260,
        type: 'milestone',
        title: 'Lagos IGR Surpasses FAAC Forever',
        description: 'Financial independence achieved.',
      },
    ],
    grades: [
      { key: 'publicTrust', label: 'Trust', value: 73, grade: 'C', color: '#C08C0C' },
      { key: 'infrastructureScore', label: 'Infra', value: 88, grade: 'B', color: '#3B9FE0' },
      { key: 'securityIndex', label: 'Security', value: 81, grade: 'B', color: '#3B9FE0' },
      { key: 'youthTension', label: 'Youth', value: 65, grade: 'C', color: '#C08C0C' },
    ],
    hasFashemuEnding: false,
    endingFlavor: 'triumph',
    gameVersion: 'v0.0.0 \u00b7 Week 416',
  },
]

export function ShareLabPanel() {
  const [selectedFixture, setSelectedFixture] = useState(0)
  const [exporting, setExporting] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  async function handleExport() {
    const svgEl = containerRef.current?.querySelector('svg')
    if (!svgEl) return
    setExporting(true)
    try {
      const blob = await exportCard(svgEl)
      if (blob) {
        await downloadOrShare(blob, `lagos-legacy-week${FIXTURES[selectedFixture].weekCount}.png`)
      }
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div
      className="sl-tab-section"
      style={{ padding: '20px 24px', maxWidth: '1000px', margin: '0 auto', width: '100%' }}
    >
      {/* Controls */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          alignItems: 'center',
          marginBottom: '16px',
          fontFamily: "'Archivo Narrow', sans-serif",
          fontSize: '11px',
        }}
      >
        <span style={{ color: '#999' }}>Share card preview</span>
        <select
          value={selectedFixture}
          onChange={(e) => setSelectedFixture(Number(e.target.value))}
          style={{
            padding: '6px 12px',
            background: '#222',
            color: '#e0e0e0',
            border: '1px solid #444',
            borderRadius: '4px',
            fontSize: '11px',
          }}
        >
          {FIXTURES.map((f, i) => (
            <option key={f.exitLabel} value={i}>
              {f.exitLabel}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          style={{
            padding: '8px 16px',
            border: '1px solid #1A9B8E',
            background: exporting ? '#1a3a34' : '#1A9B8E',
            color: '#fff',
            borderRadius: '4px',
            cursor: exporting ? 'not-allowed' : 'pointer',
            fontSize: '11px',
            fontWeight: 600,
          }}
        >
          {exporting ? 'Exporting...' : 'Export PNG'}
        </button>
      </div>

      {/* Card preview at display scale */}
      <div
        style={{
          width: '540px',
          maxWidth: '100%',
          margin: '0 auto',
          borderRadius: '6px',
          overflow: 'hidden',
          border: '1px solid #333',
          lineHeight: '0',
        }}
      >
        <div ref={containerRef} style={{ width: '100%', height: 'auto' }}>
          <ShareCard data={FIXTURES[selectedFixture]} />
        </div>
      </div>
    </div>
  )
}
