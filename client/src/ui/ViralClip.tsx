import { useGameStore } from '../state/gameStore'
import type { NewsArticle, SocialReply } from '../state/types'

const GRADIENT_BY_CATEGORY: Record<string, string> = {
  crisis: 'linear-gradient(160deg, #1a0a00 0%, #3d1a00 40%, #0d0d0d 100%)',
  political: 'linear-gradient(160deg, #050a1a 0%, #0f1f3d 40%, #0a0a0a 100%)',
  fiscal: 'linear-gradient(160deg, #001a0d 0%, #003320 40%, #0a0a0a 100%)',
  milestone: 'linear-gradient(160deg, #0a0a1a 0%, #1a1a3d 40%, #0a0a0a 100%)',
  background: 'linear-gradient(160deg, #0a0a0a 0%, #1a1a1a 100%)',
}

function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

function buildClipTag(headline: string): string {
  const hashWord = headline.split(' ').find((w) => w.length > 5) ?? 'Lagos'
  return `#${hashWord.replace(/[^a-zA-Z]/g, '')}`
}

function ClipTopBar({ handle, views }: { handle: string; views: number }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 16,
        left: 16,
        right: 16,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        zIndex: 2,
      }}
    >
      <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{handle}</span>
      <div style={{ textAlign: 'right' }}>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, lineHeight: 1 }}>VIEWS</div>
        <div style={{ color: '#fff', fontSize: 15, fontWeight: 700 }}>{formatViews(views)}</div>
      </div>
    </div>
  )
}

function PlayButton() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.15)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1.5px solid rgba(255,255,255,0.3)',
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
          <title>Play</title>
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
    </div>
  )
}

function ActionSidebar({ views }: { views: number }) {
  const actions = [
    { icon: '♥', count: formatViews(Math.round(views * 0.08)) },
    { icon: '💬', count: formatViews(Math.round(views * 0.012)) },
    { icon: '↗', count: formatViews(Math.round(views * 0.04)) },
  ]

  return (
    <div
      style={{
        position: 'absolute',
        right: 14,
        bottom: 120,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 20,
        zIndex: 2,
      }}
    >
      {actions.map(({ icon, count }) => (
        <div key={icon} style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 24, lineHeight: 1 }}>{icon}</div>
          <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, marginTop: 2 }}>{count}</div>
        </div>
      ))}
    </div>
  )
}

function TopComments({ comments }: { comments: SocialReply[] }) {
  if (comments.length === 0) return null
  return (
    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {comments.slice(0, 3).map((c) => {
        const handle = c.handle ?? `@${c.author.replace(/\s+/g, '')}`
        return (
          <div
            key={`${c.author}-${c.text.slice(0, 20)}`}
            style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 700,
                color: '#fff',
                flexShrink: 0,
              }}
            >
              {handle.replace('@', '').charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 600 }}>
                {handle}
              </div>
              <div style={{ color: '#fff', fontSize: 12, lineHeight: 1.35 }}>{c.text}</div>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, flexShrink: 0 }}>
              ♥ {formatViews(c.likes ?? 0)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ClipCaption({
  article,
  tag,
  comments,
}: {
  article: NewsArticle
  tag: string
  comments: SocialReply[]
}) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '40px 16px 20px',
        background: 'linear-gradient(0deg, rgba(0,0,0,0.85) 0%, transparent 100%)',
        zIndex: 2,
      }}
    >
      <div style={{ color: '#4ade80', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{tag}</div>
      <h2
        style={{
          color: '#fff',
          fontSize: 15,
          fontWeight: 700,
          lineHeight: 1.35,
          margin: '0 0 6px',
          textShadow: '0 1px 4px rgba(0,0,0,0.6)',
        }}
      >
        {article.headline}
      </h2>
      <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, margin: 0, lineHeight: 1.4 }}>
        {article.deck.slice(0, 100)}
        {article.deck.length > 100 ? '…' : ''}
      </p>
      <TopComments comments={comments} />
      <div
        style={{
          marginTop: 12,
          fontSize: 10,
          color: 'rgba(255,255,255,0.35)',
          letterSpacing: '0.08em',
        }}
      >
        via LagosClips
      </div>
    </div>
  )
}

function NoiseTexture() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
        opacity: 0.4,
        pointerEvents: 'none',
      }}
    />
  )
}

function ClipCard({
  article,
  gradient,
  handle,
  tag,
  views,
  comments,
}: {
  article: NewsArticle
  gradient: string
  handle: string
  tag: string
  views: number
  comments: SocialReply[]
}) {
  return (
    <div
      style={{
        position: 'relative',
        zIndex: 1,
        width: 360,
        height: 640,
        borderRadius: 12,
        overflow: 'hidden',
        background: gradient,
        boxShadow: '0 24px 80px rgba(0,0,0,0.8)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <NoiseTexture />
      <ClipTopBar handle={handle} views={views} />
      <PlayButton />
      <ActionSidebar views={views} />
      <ClipCaption article={article} tag={tag} comments={comments} />
    </div>
  )
}

function ContinueButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        position: 'absolute',
        zIndex: 1,
        bottom: 32,
        right: 32,
        background: 'rgba(255,255,255,0.12)',
        border: '1px solid rgba(255,255,255,0.25)',
        color: '#fff',
        padding: '8px 20px',
        fontSize: 13,
        fontWeight: 600,
        borderRadius: 6,
        cursor: 'pointer',
        backdropFilter: 'blur(8px)',
      }}
    >
      Continue Governing &rarr;
    </button>
  )
}

export function ViralClip({ article }: { article: NewsArticle }) {
  const clearNewspaperHeadline = useGameStore((s) => s.clearNewspaperHeadline)
  const meta = article.channelMeta

  const views = meta?.views ?? 1_400_000
  const handle = meta?.creatorHandle ?? '@LagosEye'
  const comments = meta?.videoComments ?? []

  const tag = buildClipTag(article.headline)

  const gradient = GRADIENT_BY_CATEGORY[article.category] ?? GRADIENT_BY_CATEGORY.background

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <button
        type="button"
        aria-label="Close viral clip"
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
      <ClipCard
        article={article}
        gradient={gradient}
        handle={handle}
        tag={tag}
        views={views}
        comments={comments}
      />
      <ContinueButton onClick={clearNewspaperHeadline} />
    </div>
  )
}
