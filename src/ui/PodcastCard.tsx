import { useGameStore } from '../state/gameStore'
import type { NewsArticle } from '../state/types'
import { formatGameDate } from '../utils/calendar'

function avatarInitial(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function Waveform() {
  const heights = [
    4, 12, 8, 20, 14, 28, 18, 32, 22, 16, 30, 24, 36, 20, 28, 14, 22, 32, 18, 12, 26, 20, 16, 8, 14,
  ]
  const bars = heights.map((h, i) => ({ h, x: i * 8 + 2, accent: i < 10 }))
  return (
    <svg
      width="100%"
      height="48"
      viewBox={`0 0 ${heights.length * 8} 48`}
      preserveAspectRatio="none"
    >
      <title>Audio waveform</title>
      {bars.map((bar) => (
        <rect
          key={`bar-${bar.x}-${bar.h}`}
          x={bar.x}
          y={(48 - bar.h) / 2}
          width={4}
          height={bar.h}
          rx={2}
          fill={bar.accent ? 'var(--accent-solid)' : 'rgba(255,255,255,0.15)'}
        />
      ))}
    </svg>
  )
}

export function PodcastCard({ article }: { article: NewsArticle }) {
  const clearNewspaperHeadline = useGameStore((s) => s.clearNewspaperHeadline)
  const week = useGameStore((s) => s.week)
  const meta = article.channelMeta

  const showName = meta?.showName ?? 'State of Play'
  const hostName = meta?.hostName ?? 'Tokunbo Adeyemi'
  const duration = meta?.duration ?? '34:12'
  const keyQuote = meta?.keyQuote ?? `${article.deck.slice(0, 90)}…`

  const episodeNum = Math.max(1, Math.round(week / 6))

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: 'rgba(12, 8, 4, 0.88)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(6px)',
      }}
    >
      <button
        type="button"
        aria-label="Close podcast"
        onClick={clearNewspaperHeadline}
        style={{
          position: 'absolute',
          inset: 0,
          cursor: 'pointer',
          border: 'none',
          padding: 0,
          background: 'transparent',
        }}
      />
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: 440,
          maxWidth: 'calc(100vw - 32px)',
          borderRadius: 16,
          overflow: 'hidden',
          background: 'linear-gradient(160deg, #1a1208 0%, #0d0c0a 100%)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.8)',
          border: '1px solid rgba(255,200,80,0.12)',
        }}
      >
        {/* Show header */}
        <div
          style={{
            padding: '16px 20px 12px',
            borderBottom: '1px solid rgba(255,200,80,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          {/* Podcast art */}
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #b8860b 0%, #8b6914 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="rgba(255,240,180,0.9)">
              <title>Podcast</title>
              <path d="M12 1a9 9 0 0 1 9 9c0 4.17-2.84 7.67-6.71 8.67L14 20h-4l.71-1.33C6.84 17.67 4 14.17 4 10A9 9 0 0 1 12 1zm0 2a7 7 0 0 0-7 7c0 3.09 1.99 5.75 4.84 6.73L10.5 18h3l.66-1.27C17.01 15.75 19 13.09 19 10a7 7 0 0 0-7-7zm0 2a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                color: '#c8a84b',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.06em',
                marginBottom: 2,
              }}
            >
              {showName.toUpperCase()} · EP.{episodeNum}
            </div>
            <div
              style={{
                color: 'rgba(255,240,180,0.9)',
                fontSize: 14,
                fontWeight: 600,
                lineHeight: 1.3,
              }}
            >
              {article.headline}
            </div>
          </div>
          <div style={{ color: 'rgba(200,168,75,0.6)', fontSize: 12, flexShrink: 0 }}>
            {duration}
          </div>
        </div>

        {/* Waveform + controls */}
        <div style={{ padding: '16px 20px 12px' }}>
          <Waveform />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 10,
            }}
          >
            {/* Play button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                type="button"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: '#c8a84b',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'default',
                  flexShrink: 0,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#0d0c0a">
                  <title>Play podcast</title>
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
              {/* Progress bar */}
              <div style={{ flex: 1, width: 200 }}>
                <div
                  style={{
                    height: 4,
                    borderRadius: 2,
                    background: 'rgba(255,255,255,0.1)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: '38%',
                      background: '#c8a84b',
                      borderRadius: 2,
                    }}
                  />
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: 4,
                    fontSize: 10,
                    color: 'rgba(200,168,75,0.5)',
                  }}
                >
                  <span>13:06</span>
                  <span>{duration}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key quote */}
        <div
          style={{
            margin: '0 20px 14px',
            padding: '12px 14px',
            background: 'rgba(200,168,75,0.06)',
            borderRadius: 8,
            borderLeft: '3px solid rgba(200,168,75,0.4)',
          }}
        >
          <div
            style={{
              color: 'rgba(200,168,75,0.55)',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.08em',
              marginBottom: 6,
            }}
          >
            HOST'S TAKE
          </div>
          <p
            style={{
              color: 'rgba(255,240,180,0.75)',
              fontSize: 13,
              lineHeight: 1.55,
              margin: 0,
              fontStyle: 'italic',
            }}
          >
            &ldquo;{keyQuote}&rdquo;
          </p>
        </div>

        {/* Host row + data */}
        <div
          style={{
            padding: '12px 20px',
            background: 'rgba(0,0,0,0.3)',
            borderTop: '1px solid rgba(255,200,80,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'rgba(200,168,75,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                fontWeight: 700,
                color: '#c8a84b',
              }}
            >
              {avatarInitial(hostName)}
            </div>
            <div>
              <div style={{ color: 'rgba(255,240,180,0.7)', fontSize: 12, fontWeight: 600 }}>
                {hostName}
              </div>
              <div style={{ color: 'rgba(200,168,75,0.4)', fontSize: 10 }}>
                {formatGameDate(week)}
              </div>
            </div>
          </div>
          {article.dataPoints.length > 0 && (
            <div style={{ fontSize: 11, color: 'rgba(200,168,75,0.5)' }}>
              {article.dataPoints[0].label}:{' '}
              <strong style={{ color: '#c8a84b' }}>{article.dataPoints[0].value}</strong>
            </div>
          )}
        </div>

        {/* CTA */}
        <div style={{ padding: '10px 20px 14px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={clearNewspaperHeadline}
            style={{
              background: '#c8a84b',
              color: '#0d0c0a',
              border: 'none',
              borderRadius: 6,
              padding: '8px 20px',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Continue Governing &rarr;
          </button>
        </div>
      </div>
    </div>
  )
}
