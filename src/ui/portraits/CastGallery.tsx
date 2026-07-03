import { type CSSProperties, type Dispatch, type SetStateAction, useState } from 'react'
import type { CharacterId } from '../../state/types'
import { FIXTURE_INBOX } from '../styleLab/fixtures'
import { BustPortrait } from './BustPortrait'
import { ALL_CAST_ENTRIES } from './specs'
import type { FrameShape } from './types'

const SIZES = [28, 36, 48, 72, 96, 160]
const SHAPES: FrameShape[] = ['square', 'arch']

const GALLERY_STYLE: CSSProperties = {
  padding: '20px 24px',
  maxWidth: '1000px',
  margin: '0 auto',
  width: '100%',
}

const CONTROLS_STYLE: CSSProperties = {
  display: 'flex',
  gap: '16px',
  flexWrap: 'wrap',
  alignItems: 'center',
  marginBottom: '16px',
  fontFamily: "'Archivo Narrow', sans-serif",
  fontSize: '11px',
}

const PANEL_STYLE: CSSProperties = {
  padding: '16px',
  background: '#111',
  borderRadius: '6px',
  border: '1px solid #333',
}

const PANEL_LABEL_STYLE: CSSProperties = {
  color: '#666',
  fontFamily: "'Archivo Narrow', sans-serif",
  fontSize: '10px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  display: 'block',
  marginBottom: '12px',
}

type ShapeSetter = Dispatch<SetStateAction<FrameShape>>
type SizeSetter = Dispatch<SetStateAction<string>>

function getShapeButtonStyle(shape: FrameShape, currentShape: FrameShape): CSSProperties {
  const active = shape === currentShape
  return {
    padding: '6px 12px',
    border: `1px solid ${active ? '#1A9B8E' : '#444'}`,
    background: active ? '#1A9B8E' : '#222',
    color: active ? '#fff' : '#e0e0e0',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: 600,
  }
}

function ShapeSelector({ shape, setShape }: { shape: FrameShape; setShape: ShapeSetter }) {
  return (
    <>
      <span style={{ color: '#999' }}>Frame shape</span>
      {SHAPES.map((nextShape) => (
        <button
          key={nextShape}
          type="button"
          onClick={() => setShape(nextShape)}
          style={getShapeButtonStyle(nextShape, shape)}
        >
          {nextShape}
        </button>
      ))}
    </>
  )
}

function SizeSelector({ size, setSize }: { size: string; setSize: SizeSetter }) {
  return (
    <>
      <span style={{ color: '#666', marginLeft: '8px' }}>|</span>
      <span style={{ color: '#999' }}>Size ladder:</span>
      <select
        value={size}
        onChange={(event) => setSize(event.target.value)}
        style={{
          padding: '4px 8px',
          background: '#222',
          color: '#e0e0e0',
          border: '1px solid #444',
          borderRadius: '4px',
          fontSize: '11px',
        }}
      >
        {ALL_CAST_ENTRIES.map((entry) => (
          <option key={entry.specKey + entry.label} value={entry.specKey}>
            {entry.label}
          </option>
        ))}
      </select>
    </>
  )
}

function CastControls({
  shape,
  setShape,
  size,
  setSize,
}: {
  shape: FrameShape
  setShape: ShapeSetter
  size: string
  setSize: SizeSetter
}) {
  return (
    <div style={CONTROLS_STYLE}>
      <ShapeSelector shape={shape} setShape={setShape} />
      <SizeSelector size={size} setSize={setSize} />
    </div>
  )
}

function SizeLadder({ shape, specKey }: { shape: FrameShape; specKey: string }) {
  return (
    <div
      style={{
        ...PANEL_STYLE,
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-end',
        marginBottom: '24px',
      }}
    >
      {SIZES.map((size) => (
        <div
          key={size}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}
        >
          <BustPortrait charId="fashemu" specKey={specKey} size={size} shape={shape} />
          <span
            style={{ color: '#666', fontFamily: "'Archivo Narrow', sans-serif", fontSize: '9px' }}
          >
            {size}px
          </span>
        </div>
      ))}
    </div>
  )
}

function PortraitCard({
  entry,
  shape,
}: {
  entry: (typeof ALL_CAST_ENTRIES)[number]
  shape: FrameShape
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px',
        padding: '12px 8px',
        background: '#111',
        borderRadius: '6px',
        border: '1px solid #333',
      }}
    >
      <BustPortrait
        charId={entry.id as CharacterId}
        size={96}
        specKey={entry.specKey}
        shape={shape}
      />
      <span
        style={{
          color: '#ccc',
          fontFamily: "'Archivo Narrow', sans-serif",
          fontSize: '10px',
          fontWeight: 600,
          textAlign: 'center',
          lineHeight: '1.3',
        }}
      >
        {entry.label}
      </span>
    </div>
  )
}

function FullCastGrid({ shape }: { shape: FrameShape }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
        gap: '12px',
        marginBottom: '24px',
      }}
    >
      {ALL_CAST_ENTRIES.map((entry) => (
        <PortraitCard key={`${entry.id}-${entry.specKey}`} entry={entry} shape={shape} />
      ))}
    </div>
  )
}

function MockEventCard({ shape }: { shape: FrameShape }) {
  return (
    <div style={{ ...PANEL_STYLE, marginBottom: '24px' }}>
      <span style={PANEL_LABEL_STYLE}>Mock Event Card (80px)</span>
      <div
        style={{
          display: 'flex',
          gap: '16px',
          padding: '16px',
          background: '#1B1512',
          border: '1px solid #3a2e26',
          borderRadius: '6px',
          maxWidth: '560px',
        }}
      >
        <div style={{ flexShrink: 0 }}>
          <BustPortrait charId="fashemu" size={80} shape={shape} />
        </div>
        <div>
          <span
            style={{
              display: 'inline-block',
              padding: '2px 8px',
              background: '#D7322A',
              color: '#fff',
              fontFamily: "'Archivo Narrow', sans-serif",
              fontSize: '9px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              borderRadius: '3px',
              marginBottom: '8px',
            }}
          >
            GODFATHER ASK
          </span>
          <div
            style={{
              color: '#E8DFD6',
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '17px',
              fontWeight: 700,
              marginBottom: '6px',
            }}
          >
            The Abeokuta Street Matter
          </div>
          <div
            style={{
              color: '#9A8D80',
              fontFamily: 'Georgia, serif',
              fontSize: '12px',
              lineHeight: 1.5,
            }}
          >
            My people tell me the Ministry is holding up the building permit for my cousin's
            development on Abeokuta Street. I expect this resolved by Friday.
          </div>
        </div>
      </div>
    </div>
  )
}

function MockInbox({ shape }: { shape: FrameShape }) {
  return (
    <div style={PANEL_STYLE}>
      <span style={PANEL_LABEL_STYLE}>Mock Inbox (28px / 36px)</span>
      {FIXTURE_INBOX.slice(0, 3).map((msg) => (
        <div
          key={msg.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 0',
            borderBottom: '1px solid #2a2a2a',
          }}
        >
          <BustPortrait charId={msg.from} size={28} shape={shape} />
          <div style={{ flex: 1 }}>
            <span
              style={{
                color: '#ccc',
                fontFamily: "'Archivo Narrow', sans-serif",
                fontSize: '11px',
                fontWeight: 600,
              }}
            >
              {msg.fromLabel}
            </span>
            <span
              style={{
                color: '#666',
                fontFamily: "'Archivo Narrow', sans-serif",
                fontSize: '10px',
                marginLeft: '8px',
              }}
            >
              {msg.subject}
            </span>
          </div>
          <BustPortrait charId={msg.from} size={36} shape={shape} />
        </div>
      ))}
    </div>
  )
}

function PortraitGrid({ shape, size }: { shape: FrameShape; size: string }) {
  return (
    <>
      <SizeLadder shape={shape} specKey={size} />
      <FullCastGrid shape={shape} />
      <MockEventCard shape={shape} />
      <MockInbox shape={shape} />
    </>
  )
}

export function CastGallery() {
  const [shape, setShape] = useState<FrameShape>('square')
  const [size, setSize] = useState('fashemu')

  return (
    <div className="sl-tab-section" style={GALLERY_STYLE}>
      <header />
      <CastControls shape={shape} setShape={setShape} size={size} setSize={setSize} />
      <PortraitGrid shape={shape} size={size} />
    </div>
  )
}
