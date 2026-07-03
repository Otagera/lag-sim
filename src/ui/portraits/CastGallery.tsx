import { useState } from 'react'
import type { CharacterId } from '../../state/types'
import { FIXTURE_INBOX } from '../styleLab/fixtures'
import { BustPortrait } from './BustPortrait'
import { ALL_CAST_ENTRIES } from './specs'
import type { FrameShape } from './types'

const SIZES = [28, 36, 48, 72, 96, 160]

export function CastGallery() {
  const [shape, setShape] = useState<FrameShape>('square')
  const [selectedSpec, setSelectedSpec] = useState<string>('fashemu')

  return (
    <div
      className="sl-tab-section"
      style={{ padding: '20px 24px', maxWidth: '1000px', margin: '0 auto', width: '100%' }}
    >
      {/* Controls */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap',
          alignItems: 'center',
          marginBottom: '16px',
          fontFamily: "'Archivo Narrow', sans-serif",
          fontSize: '11px',
        }}
      >
        <span style={{ color: '#999' }}>Frame shape</span>
        {(['square', 'arch'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setShape(s)}
            style={{
              padding: '6px 12px',
              border: `1px solid ${shape === s ? '#1A9B8E' : '#444'}`,
              background: shape === s ? '#1A9B8E' : '#222',
              color: shape === s ? '#fff' : '#e0e0e0',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 600,
            }}
          >
            {s}
          </button>
        ))}
        <span style={{ color: '#666', marginLeft: '8px' }}>|</span>
        <span style={{ color: '#999' }}>Size ladder:</span>
        <select
          value={selectedSpec}
          onChange={(e) => setSelectedSpec(e.target.value)}
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
      </div>

      {/* Size ladder */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-end',
          marginBottom: '24px',
          padding: '16px',
          background: '#111',
          borderRadius: '6px',
          border: '1px solid #333',
        }}
      >
        {SIZES.map((s) => (
          <div
            key={s}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}
          >
            <BustPortrait charId={'fashemu'} specKey={selectedSpec} size={s} shape={shape} />
            <span
              style={{ color: '#666', fontFamily: "'Archivo Narrow', sans-serif", fontSize: '9px' }}
            >
              {s}px
            </span>
          </div>
        ))}
      </div>

      {/* Full cast grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
          gap: '12px',
          marginBottom: '24px',
        }}
      >
        {ALL_CAST_ENTRIES.map((entry) => (
          <div
            key={`${entry.id}-${entry.specKey}`}
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
        ))}
      </div>

      {/* Mock event-card context — where the 72–96px tier will actually live */}
      <div
        style={{
          padding: '16px',
          background: '#111',
          borderRadius: '6px',
          border: '1px solid #333',
          marginBottom: '24px',
        }}
      >
        <span
          style={{
            color: '#666',
            fontFamily: "'Archivo Narrow', sans-serif",
            fontSize: '10px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            display: 'block',
            marginBottom: '12px',
          }}
        >
          Mock Event Card (80px)
        </span>
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

      {/* Mock inbox context */}
      <div
        style={{
          padding: '16px',
          background: '#111',
          borderRadius: '6px',
          border: '1px solid #333',
        }}
      >
        <span
          style={{
            color: '#666',
            fontFamily: "'Archivo Narrow', sans-serif",
            fontSize: '10px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            display: 'block',
            marginBottom: '12px',
          }}
        >
          Mock Inbox (28px / 36px)
        </span>
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
    </div>
  )
}
