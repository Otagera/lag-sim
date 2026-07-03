import { type CSSProperties, useEffect, useState } from 'react'
import { RESEARCH_TREE } from '../../data/researchTree'
import { STARTING_STATE } from '../../data/startingState'
import {
  commissionMockNode,
  type MockResearchOverride,
  resolveMockStatus,
} from './mockResearchState'
import { ResearchGraphPrototype } from './ResearchGraphPrototype'

const buttonStyle: CSSProperties = {
  padding: '6px 12px',
  border: '1px solid #444',
  background: '#222',
  color: '#e0e0e0',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '11px',
  fontWeight: 600,
}

const labelStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  cursor: 'pointer',
  color: '#aaa',
  fontSize: '11px',
}

export function ResearchTab() {
  const [overrides, setOverrides] = useState<Record<string, MockResearchOverride>>({})
  const [currentWeek, setCurrentWeek] = useState(0)
  const [autoPlay, setAutoPlay] = useState(false)
  const [forceReducedMotion, setForceReducedMotion] = useState(false)

  // Auto-play: advance the mock clock while enabled.
  useEffect(() => {
    if (!autoPlay) return
    const id = setInterval(() => setCurrentWeek((w) => w + 1), 400)
    return () => clearInterval(id)
  }, [autoPlay])

  // Promote commissioned overrides to completed once their mock week is due
  // (mirrors tickResearchNodes()'s due-check, kept local to this prototype).
  useEffect(() => {
    setOverrides((prev) => {
      let changed = false
      const next = { ...prev }
      for (const [nodeId, o] of Object.entries(prev)) {
        if (o.status === 'commissioned' && currentWeek >= o.completionWeek) {
          next[nodeId] = { ...o, status: 'completed' }
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [currentWeek])

  function commission(nodeId: string) {
    const override = commissionMockNode(nodeId, currentWeek)
    if (override) setOverrides((prev) => ({ ...prev, [nodeId]: override }))
  }

  function handleCommissionRandom() {
    const available = RESEARCH_TREE.map((n) => n.id).filter(
      (id) => resolveMockStatus(id, overrides, STARTING_STATE) === 'available',
    )
    if (available.length === 0) return
    commission(available[Math.floor(Math.random() * available.length)])
  }

  function handleReset() {
    setOverrides({})
    setCurrentWeek(0)
    setAutoPlay(false)
  }

  return (
    <div
      className="sl-tab-section"
      style={{ padding: '20px 24px', maxWidth: '1100px', margin: '0 auto', width: '100%' }}
    >
      <div
        style={{
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: '16px',
          fontFamily: "'Archivo Narrow', sans-serif",
          fontSize: '12px',
        }}
      >
        <button type="button" onClick={handleCommissionRandom} style={buttonStyle}>
          Commission random available node
        </button>
        <button type="button" onClick={() => setCurrentWeek((w) => w + 1)} style={buttonStyle}>
          Advance time (+1 week)
        </button>
        <label style={labelStyle}>
          <input type="checkbox" checked={autoPlay} onChange={() => setAutoPlay((v) => !v)} />
          Auto-play
        </label>
        <label style={labelStyle}>
          <input
            type="checkbox"
            checked={forceReducedMotion}
            onChange={() => setForceReducedMotion((v) => !v)}
          />
          Force reduced motion
        </label>
        <button type="button" onClick={handleReset} style={buttonStyle}>
          Reset
        </button>
        <span style={{ color: '#888', fontSize: '11px' }}>Week: {currentWeek}</span>
      </div>

      <ResearchGraphPrototype
        overrides={overrides}
        currentWeek={currentWeek}
        baseState={STARTING_STATE}
        forceReducedMotion={forceReducedMotion}
        onNodeClick={(nodeId) => {
          const status = resolveMockStatus(nodeId, overrides, STARTING_STATE)
          if (status === 'available') commission(nodeId)
        }}
      />
    </div>
  )
}
