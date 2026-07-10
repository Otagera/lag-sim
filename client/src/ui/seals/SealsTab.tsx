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

type MockParty = (typeof MOCK_PARTIES)[number]

const controlRowStyle: CSSProperties = {
  display: 'flex',
  gap: '16px',
  flexWrap: 'wrap',
  alignItems: 'center',
  marginBottom: '12px',
  fontFamily: "'Archivo Narrow', sans-serif",
  fontSize: '11px',
}

function SituationControls({
  situation,
  setSituation,
  electionActive,
  setElectionActive,
}: {
  situation: Situation
  setSituation: (situation: Situation) => void
  electionActive: boolean
  setElectionActive: (updater: (value: boolean) => boolean) => void
}) {
  return (
    <div style={controlRowStyle}>
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
  )
}

function BrandingControls({
  playerPartyId,
  setPlayerPartyId,
  rivalPartyId,
  setRivalPartyId,
  sealOpacity,
  setSealOpacity,
  markRotation,
  setMarkRotation,
}: {
  playerPartyId: string
  setPlayerPartyId: (id: string) => void
  rivalPartyId: string
  setRivalPartyId: (id: string) => void
  sealOpacity: number
  setSealOpacity: (opacity: number) => void
  markRotation: number
  setMarkRotation: (rotation: number) => void
}) {
  return (
    <div style={{ ...controlRowStyle, gap: '20px' }}>
      <PartySelect label="Player party" value={playerPartyId} onChange={setPlayerPartyId} />
      <PartySelect label="Rival party" value={rivalPartyId} onChange={setRivalPartyId} />
      <RangeControl
        label="Seal opacity"
        value={sealOpacity}
        suffix="%"
        min={1}
        max={20}
        onChange={setSealOpacity}
      />
      <RangeControl
        label="Mark rotation"
        value={markRotation}
        suffix="°"
        min={-45}
        max={45}
        onChange={setMarkRotation}
      />
    </div>
  )
}

function PartySelect({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (id: string) => void
}) {
  return (
    <label style={labelStyle}>
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {MOCK_PARTIES.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} ({p.initials})
          </option>
        ))}
      </select>
    </label>
  )
}

function RangeControl({
  label,
  value,
  suffix,
  min,
  max,
  onChange,
}: {
  label: string
  value: number
  suffix: string
  min: number
  max: number
  onChange: (value: number) => void
}) {
  return (
    <label style={labelStyle}>
      {label} ({value}
      {suffix})
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  )
}

function SealPreviewStage({
  situation,
  electionActive,
  sealOpacity,
  markRotation,
  playerParty,
  rivalParty,
}: {
  situation: Situation
  electionActive: boolean
  sealOpacity: number
  markRotation: number
  playerParty: MockParty
  rivalParty: MockParty
}) {
  return (
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
      <WatermarkLayer opacity={sealOpacity / 100} rotationDeg={markRotation}>
        <LagosSealMark size={600} tone={situation === 'storm' ? 'ink' : 'accent'} />
      </WatermarkLayer>
      {electionActive && (
        <ElectionWatermarks
          markRotation={markRotation}
          playerParty={playerParty}
          rivalParty={rivalParty}
        />
      )}
      <ForegroundChips
        electionActive={electionActive}
        playerParty={playerParty}
        rivalParty={rivalParty}
      />
    </div>
  )
}

function ElectionWatermarks({
  markRotation,
  playerParty,
  rivalParty,
}: {
  markRotation: number
  playerParty: MockParty
  rivalParty: MockParty
}) {
  return (
    <>
      <WatermarkLayer opacity={0.09} rotationDeg={-8} placement="bottom-right" zIndex={2}>
        <ElectoralMark size={220} />
      </WatermarkLayer>
      <PartyWatermark party={playerParty} markRotation={markRotation} startCell={0} />
      <PartyWatermark party={rivalParty} markRotation={markRotation} startCell={4} />
    </>
  )
}

function PartyWatermark({
  party,
  markRotation,
  startCell,
}: {
  party: MockParty
  markRotation: number
  startCell: number
}) {
  return (
    <WatermarkLayer
      opacity={0.06}
      rotationDeg={markRotation}
      tile
      tileCount={3}
      startCell={startCell}
      zIndex={3}
    >
      <FictionalPartyLogo
        size={120}
        initials={party.initials}
        color={party.color}
        symbol={party.symbol}
      />
    </WatermarkLayer>
  )
}

function ForegroundChips({
  electionActive,
  playerParty,
  rivalParty,
}: {
  electionActive: boolean
  playerParty: MockParty
  rivalParty: MockParty
}) {
  return (
    <div
      style={{
        position: 'relative',
        zIndex: 10,
        padding: '16px',
        fontFamily: "'Archivo Narrow', sans-serif",
      }}
    >
      <div style={chipStyle}>
        <LagosSealMark size={28} />
        <span style={{ fontSize: '12px', fontWeight: 700 }}>Lagos Governor Sim</span>
      </div>
      {electionActive && (
        <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
          <PartyChip party={playerParty} />
          <PartyChip party={rivalParty} />
          <ElectoralChip />
        </div>
      )}
    </div>
  )
}

const chipStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 12px',
  background: 'rgba(20,20,20,0.85)',
  borderRadius: '4px',
  color: '#eee',
}

const smallChipStyle: CSSProperties = { ...chipStyle, gap: '6px', padding: '6px 10px' }

function PartyChip({ party }: { party: MockParty }) {
  return (
    <div style={smallChipStyle}>
      <FictionalPartyLogo
        size={22}
        initials={party.initials}
        color={party.color}
        symbol={party.symbol}
      />
      <span style={{ fontSize: '11px', color: '#eee' }}>{party.name}</span>
    </div>
  )
}

function ElectoralChip() {
  return (
    <div style={smallChipStyle}>
      <ElectoralMark size={22} />
      <span style={{ fontSize: '11px', color: '#eee' }}>Lagos Ballot Integrity Council</span>
    </div>
  )
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
      <SituationControls
        situation={situation}
        setSituation={setSituation}
        electionActive={electionActive}
        setElectionActive={setElectionActive}
      />
      <BrandingControls
        playerPartyId={playerPartyId}
        setPlayerPartyId={setPlayerPartyId}
        rivalPartyId={rivalPartyId}
        setRivalPartyId={setRivalPartyId}
        sealOpacity={sealOpacity}
        setSealOpacity={setSealOpacity}
        markRotation={markRotation}
        setMarkRotation={setMarkRotation}
      />
      <SealPreviewStage
        situation={situation}
        electionActive={electionActive}
        sealOpacity={sealOpacity}
        markRotation={markRotation}
        playerParty={playerParty}
        rivalParty={rivalParty}
      />
    </div>
  )
}
