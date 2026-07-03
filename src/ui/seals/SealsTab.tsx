import { type CSSProperties, useState } from 'react'
import { ElectoralMark } from './ElectoralMark'
import { FictionalPartyLogo } from './FictionalPartyLogo'
import { LagosSealMark } from './LagosSealMark'
import { MOCK_PARTIES, type Situation } from './mockElectionBrandingState'
import { WatermarkLayer } from './WatermarkLayer'

const SITUATION_BG: Record<Situation, string> = {
  calm: '#EDF5F8',
  crisis: '#FFF2EE',
  storm: '#0C1720',
}

const buttonStyle = (active: boolean): CSSProperties => ({
  padding: '6px 12px',
  border: `1px solid ${active ? '#1A9B8E' : '#444'}`,
  background: active ? '#1A9B8E' : '#222',
  color: active ? '#fff' : '#e0e0e0',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '11px',
  fontWeight: 600,
})

const labelStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  color: '#aaa',
  fontSize: '11px',
}

export function SealsTab() {
  const [situation, setSituation] = useState<Situation>('calm')
  const [electionActive, setElectionActive] = useState(true)
  const [playerPartyId, setPlayerPartyId] = useState(MOCK_PARTIES[0].id)
  const [rivalPartyId, setRivalPartyId] = useState(MOCK_PARTIES[1].id)
  const [sealOpacity, setSealOpacity] = useState(5)
  const [markRotation, setMarkRotation] = useState(0)

  const playerParty = MOCK_PARTIES.find((p) => p.id === playerPartyId) ?? MOCK_PARTIES[0]
  const rivalParty = MOCK_PARTIES.find((p) => p.id === rivalPartyId) ?? MOCK_PARTIES[1]

  return (
    <div
      className="sl-tab-section"
      style={{ padding: '20px 24px', maxWidth: '1000px', margin: '0 auto', width: '100%' }}
    >
      <div
        style={{
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap',
          alignItems: 'center',
          marginBottom: '12px',
          fontFamily: "'Archivo Narrow', sans-serif",
          fontSize: '11px',
        }}
      >
        <span style={{ color: '#999' }}>Situation</span>
        {(['calm', 'crisis', 'storm'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSituation(s)}
            style={buttonStyle(situation === s)}
          >
            {s}
          </button>
        ))}
        <label style={labelStyle}>
          <input
            type="checkbox"
            checked={electionActive}
            onChange={() => setElectionActive((v) => !v)}
          />
          Election active
        </label>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '20px',
          flexWrap: 'wrap',
          alignItems: 'center',
          marginBottom: '12px',
          fontFamily: "'Archivo Narrow', sans-serif",
          fontSize: '11px',
        }}
      >
        <label style={labelStyle}>
          Player party
          <select value={playerPartyId} onChange={(e) => setPlayerPartyId(e.target.value)}>
            {MOCK_PARTIES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.initials})
              </option>
            ))}
          </select>
        </label>
        <label style={labelStyle}>
          Rival party
          <select value={rivalPartyId} onChange={(e) => setRivalPartyId(e.target.value)}>
            {MOCK_PARTIES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.initials})
              </option>
            ))}
          </select>
        </label>
        <label style={labelStyle}>
          Seal opacity ({sealOpacity}%)
          <input
            type="range"
            min={1}
            max={20}
            value={sealOpacity}
            onChange={(e) => setSealOpacity(Number(e.target.value))}
          />
        </label>
        <label style={labelStyle}>
          Mark rotation ({markRotation}°)
          <input
            type="range"
            min={-45}
            max={45}
            value={markRotation}
            onChange={(e) => setMarkRotation(Number(e.target.value))}
          />
        </label>
      </div>

      <div
        style={{
          position: 'relative',
          height: '480px',
          borderRadius: '4px',
          overflow: 'hidden',
          border: '1px solid #333',
          background: SITUATION_BG[situation],
          transition: 'background 0.4s ease',
        }}
      >
        {/* Always-on seal watermark, independent of election state */}
        <WatermarkLayer opacity={sealOpacity / 100} rotationDeg={markRotation}>
          <LagosSealMark size={600} tone={situation === 'storm' ? 'ink' : 'accent'} />
        </WatermarkLayer>

        {electionActive && (
          <>
            {/* Electoral mark — a smaller corner stamp, not a second centered
                seal (two centered marks superimpose into one illegible jumble) */}
            <WatermarkLayer opacity={0.09} rotationDeg={-8} placement="bottom-right" zIndex={2}>
              <ElectoralMark size={220} />
            </WatermarkLayer>
            {/* Party logos ring the seal — player takes the top arc of tile
                cells, rival the bottom arc, neither crosses the center */}
            <WatermarkLayer
              opacity={0.06}
              rotationDeg={markRotation}
              tile
              tileCount={3}
              startCell={0}
              zIndex={3}
            >
              <FictionalPartyLogo
                size={120}
                initials={playerParty.initials}
                color={playerParty.color}
                symbol={playerParty.symbol}
              />
            </WatermarkLayer>
            <WatermarkLayer
              opacity={0.06}
              rotationDeg={markRotation}
              tile
              tileCount={3}
              startCell={4}
              zIndex={3}
            >
              <FictionalPartyLogo
                size={120}
                initials={rivalParty.initials}
                color={rivalParty.color}
                symbol={rivalParty.symbol}
              />
            </WatermarkLayer>
          </>
        )}

        {/* Foreground content chips — proves the marks sit beneath content, not on top */}
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            padding: '16px',
            fontFamily: "'Archivo Narrow', sans-serif",
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              background: 'rgba(20,20,20,0.85)',
              borderRadius: '4px',
              color: '#eee',
            }}
          >
            <LagosSealMark size={28} />
            <span style={{ fontSize: '12px', fontWeight: 700 }}>Lagos Governor Sim</span>
          </div>
          {electionActive && (
            <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 10px',
                  background: 'rgba(20,20,20,0.85)',
                  borderRadius: '4px',
                }}
              >
                <FictionalPartyLogo
                  size={22}
                  initials={playerParty.initials}
                  color={playerParty.color}
                  symbol={playerParty.symbol}
                />
                <span style={{ fontSize: '11px', color: '#eee' }}>{playerParty.name}</span>
              </div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 10px',
                  background: 'rgba(20,20,20,0.85)',
                  borderRadius: '4px',
                }}
              >
                <FictionalPartyLogo
                  size={22}
                  initials={rivalParty.initials}
                  color={rivalParty.color}
                  symbol={rivalParty.symbol}
                />
                <span style={{ fontSize: '11px', color: '#eee' }}>{rivalParty.name}</span>
              </div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 10px',
                  background: 'rgba(20,20,20,0.85)',
                  borderRadius: '4px',
                }}
              >
                <ElectoralMark size={22} />
                <span style={{ fontSize: '11px', color: '#eee' }}>
                  Lagos Ballot Integrity Council
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
