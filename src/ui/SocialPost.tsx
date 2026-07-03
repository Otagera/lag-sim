import { useGameStore } from '../state/gameStore'
import type { NewsArticle } from '../state/types'
import { formatGameDate } from '../utils/calendar'

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

function avatarInitial(handle: string): string {
  return handle.replace('@', '').charAt(0).toUpperCase()
}

const AVATAR_COLORS = ['#1a8cff', '#e53935', '#43a047', '#fb8c00', '#8e24aa', '#00897b']

function avatarColor(handle: string): string {
  let h = 0
  for (let i = 0; i < handle.length; i++) h = ((h << 5) - h + handle.charCodeAt(i)) | 0
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

const CATEGORY_LABEL: Record<string, string> = {
  fiscal: 'FISCAL WATCH',
  political: 'POLITICS',
  crisis: 'BREAKING',
  milestone: 'DEVELOPMENT',
  background: 'INSIDE STORY',
}

export function SocialPost({ article }: { article: NewsArticle }) {
  const clearNewspaperHeadline = useGameStore((s) => s.clearNewspaperHeadline)
  const week = useGameStore((s) => s.week)
  const trust = useGameStore((s) => s.stats.publicTrust)
  const snapshot = useGameStore((s) => s.lastWeekStatSnapshot)
  const meta = article.channelMeta

  const handle = meta?.handle ?? '@LagosWatcher'
  const hashtag = meta?.hashtag ?? '#LagosPolitics'
  const retweets = meta?.retweets ?? 2400
  const likes = meta?.likes ?? 7100
  const replies = Math.round(retweets * 0.3)
  const views = likes * 12

  const trustDelta = snapshot ? trust - snapshot.publicTrust : 0

  // Build tweet text: headline + hashtag
  const tweetText = `${article.headline} ${hashtag}`

  const displayName = handle
    .replace('@', '')
    .replace(/([A-Z])/g, ' $1')
    .trim()

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(4px)',
      }}
    >
      <button
        type="button"
        aria-label="Close social post"
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
          width: 520,
          maxWidth: 'calc(100vw - 32px)',
          borderRadius: 16,
          overflow: 'hidden',
          background: '#15202b',
          boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {/* Trending context */}
        <div
          style={{
            padding: '10px 16px 8px',
            background: 'rgba(255,255,255,0.04)',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'rgba(255,255,255,0.4)',
              letterSpacing: '0.08em',
            }}
          >
            TRENDING IN LAGOS
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#1da1f2',
              background: 'rgba(29,161,242,0.12)',
              borderRadius: 4,
              padding: '2px 8px',
            }}
          >
            {CATEGORY_LABEL[article.category] ?? 'NEWS'}
          </span>
        </div>

        {/* Tweet body */}
        <div style={{ padding: '16px 16px 0' }}>
          {/* Author row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: avatarColor(handle),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                fontWeight: 700,
                color: '#fff',
                flexShrink: 0,
              }}
            >
              {avatarInitial(handle)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  color: '#e7e9ea',
                  fontWeight: 700,
                  fontSize: 15,
                  lineHeight: 1.2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                {displayName}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="#1da1f2"
                  style={{ flexShrink: 0 }}
                >
                  <title>Verified</title>
                  <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91-1.01-1-2.52-1.27-3.91-.81-.67-1.31-1.9-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.19-3.92.81-1 1.01-1.27 2.52-.8 3.91C3.38 9.33 2.5 10.57 2.5 12s.88 2.67 2.19 3.34c-.46 1.39-.2 2.9.81 3.91 1.01 1 2.52 1.27 3.91.81.67 1.31 1.9 2.19 3.34 2.19s2.67-.88 3.33-2.19c1.4.46 2.91.19 3.92-.81 1-1.01 1.27-2.52.8-3.91 1.31-.67 2.19-1.9 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z" />
                </svg>
              </div>
              <div style={{ color: 'rgba(231,233,234,0.5)', fontSize: 13, lineHeight: 1 }}>
                {handle}
              </div>
            </div>
            <div style={{ color: 'rgba(231,233,234,0.35)', fontSize: 12, flexShrink: 0 }}>
              {Math.max(1, Math.round(week / 4))}h
            </div>
          </div>

          {/* Tweet text */}
          <p
            style={{
              color: '#e7e9ea',
              fontSize: 15,
              lineHeight: 1.55,
              margin: '0 0 12px',
            }}
          >
            {tweetText
              .split(/(#\w+)/g)
              .map((part, index) => ({ id: `${part}-${index}`, part }))
              .map((entry) =>
                entry.part.startsWith('#') ? (
                  <span key={entry.id} style={{ color: '#1da1f2' }}>
                    {entry.part}
                  </span>
                ) : (
                  <span key={entry.id}>{entry.part}</span>
                ),
              )}
          </p>

          {/* Deck / body */}
          <p
            style={{
              color: 'rgba(231,233,234,0.6)',
              fontSize: 13,
              lineHeight: 1.5,
              margin: '0 0 14px',
              padding: '10px 12px',
              background: 'rgba(255,255,255,0.04)',
              borderRadius: 8,
              borderLeft: '2px solid rgba(29,161,242,0.4)',
            }}
          >
            {article.deck}
          </p>

          {/* Metrics row */}
          <div
            style={{
              display: 'flex',
              gap: 20,
              paddingTop: 10,
              borderTop: '1px solid rgba(255,255,255,0.08)',
              paddingBottom: 14,
            }}
          >
            {[
              { icon: '💬', val: formatCount(replies), label: 'Replies' },
              { icon: '↻', val: formatCount(retweets), label: 'Reposts' },
              { icon: '♥', val: formatCount(likes), label: 'Likes' },
              { icon: '👁', val: formatCount(views), label: 'Views' },
            ].map(({ icon, val, label: lbl }) => (
              <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 14, color: 'rgba(231,233,234,0.4)' }}>{icon}</span>
                <span style={{ fontSize: 13, color: 'rgba(231,233,234,0.5)', fontWeight: 500 }}>
                  {val}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats context bar */}
        <div
          style={{
            padding: '10px 16px',
            background: 'rgba(255,255,255,0.03)',
            borderTop: '1px solid rgba(255,255,255,0.07)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontSize: 12, color: 'rgba(231,233,234,0.4)' }}>{formatGameDate(week)}</div>
          <div style={{ fontSize: 12, color: 'rgba(231,233,234,0.4)' }}>
            Public Trust&nbsp;
            <span
              style={{
                fontWeight: 600,
                color: trustDelta >= 0 ? '#43a047' : '#e53935',
              }}
            >
              {trust.toFixed(0)}%{' '}
              {trustDelta !== 0 &&
                (trustDelta > 0 ? `+${trustDelta.toFixed(0)}` : trustDelta.toFixed(0))}
            </span>
          </div>
        </div>

        {/* CTA */}
        <div
          style={{
            padding: '12px 16px',
            display: 'flex',
            justifyContent: 'flex-end',
            borderTop: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <button
            type="button"
            onClick={clearNewspaperHeadline}
            style={{
              background: '#1da1f2',
              color: '#fff',
              border: 'none',
              borderRadius: 20,
              padding: '8px 20px',
              fontSize: 14,
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
