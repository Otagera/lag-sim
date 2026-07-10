import { useGameStore } from '../state/gameStore'
import type { EmojiTally, NewsArticle, WhatsAppMsg } from '../state/types'

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K`
  return String(n)
}

const SENDER_COLORS = ['#e542a3', '#1f9be0', '#c78a00', '#7c4dff', '#00a884', '#f4511e', '#3949ab']

function senderColor(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = ((h << 5) - h + name.charCodeAt(i)) | 0
  return SENDER_COLORS[Math.abs(h) % SENDER_COLORS.length]
}

// The news arriving in the chat: a white, left-aligned bubble (optionally tagged "Forwarded").
function NewsBubble({
  article,
  messageText,
  isRumor,
  forwarded,
}: {
  article: NewsArticle
  messageText: string
  isRumor: boolean
  forwarded: boolean
}) {
  return (
    <div style={{ display: 'flex', marginBottom: 8 }}>
      <div
        style={{
          maxWidth: '86%',
          background: '#fff',
          borderRadius: '0 10px 10px 10px',
          padding: '6px 10px 4px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
        }}
      >
        {isRumor && (
          <div style={{ color: '#e53935', fontSize: 10, fontWeight: 700, marginBottom: 3 }}>
            ⚠ UNVERIFIED
          </div>
        )}
        {forwarded && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 3 }}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="rgba(0,0,0,0.28)">
              <title>Forward</title>
              <path d="M14.5 4l-1.41 1.41 4.58 4.59H3v2h14.67l-4.58 4.59L14.5 20l8-8-8-8z" />
            </svg>
            <span style={{ color: 'rgba(0,0,0,0.28)', fontSize: 10, fontStyle: 'italic' }}>
              Forwarded
            </span>
          </div>
        )}
        <p style={{ color: '#1a1a1a', fontSize: 13, lineHeight: 1.4, margin: 0, fontWeight: 600 }}>
          {article.headline}
        </p>
        <p style={{ color: '#444', fontSize: 12, lineHeight: 1.4, margin: '4px 0 0' }}>
          {messageText}
        </p>
        <div style={{ textAlign: 'right', marginTop: 3, fontSize: 10, color: '#999' }}>
          12:39 PM
        </div>
      </div>
    </div>
  )
}

// A group member's reply: white, left-aligned bubble with a coloured sender name.
function GroupMessage({ msg, isLast }: { msg: WhatsAppMsg; isLast: boolean }) {
  return (
    <div style={{ display: 'flex', marginBottom: isLast ? 0 : 6 }}>
      <div
        style={{
          maxWidth: '82%',
          background: '#fff',
          borderRadius: '0 10px 10px 10px',
          padding: '5px 10px 4px',
          boxShadow: '0 1px 1px rgba(0,0,0,0.08)',
        }}
      >
        <div
          style={{ color: senderColor(msg.sender), fontSize: 11, fontWeight: 700, marginBottom: 2 }}
        >
          {msg.sender}
        </div>
        <p style={{ color: '#1a1a1a', fontSize: 13, lineHeight: 1.4, margin: 0 }}>{msg.text}</p>
        <div style={{ textAlign: 'right', marginTop: 2, fontSize: 10, color: '#999' }}>
          {msg.time}
        </div>
      </div>
    </div>
  )
}

// Broadcast-channel reaction tally: emoji chips + aggregate view/forward counts.
function EmojiTallyRow({ tallies, forwardCount }: { tallies: EmojiTally[]; forwardCount: number }) {
  const views = tallies.reduce((s, t) => s + t.count, 0) * 7
  return (
    <div style={{ padding: '4px 6px 2px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
        {tallies.map((t) => (
          <div
            key={t.emoji}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: '#fff',
              borderRadius: 12,
              padding: '3px 9px',
              boxShadow: '0 1px 1px rgba(0,0,0,0.08)',
              fontSize: 12,
              color: '#333',
            }}
          >
            <span style={{ fontSize: 14 }}>{t.emoji}</span>
            {formatCount(t.count)}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11, color: '#5b6b62', paddingLeft: 2 }}>
        👁 {formatCount(views)} views · Forwarded {formatCount(forwardCount)}+ times
      </div>
    </div>
  )
}

function VerifiedTick() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#4fc3f7" style={{ flexShrink: 0 }}>
      <title>Verified</title>
      <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91-1.01-1-2.52-1.27-3.91-.81-.67-1.31-1.9-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.19-3.92.81-1 1.01-1.27 2.52-.8 3.91C3.38 9.33 2.5 10.57 2.5 12s.88 2.67 2.19 3.34c-.46 1.39-.2 2.9.81 3.91 1.01 1 2.52 1.27 3.91.81.67 1.31 1.9 2.19 3.34 2.19s2.67-.88 3.33-2.19c1.4.46 2.91.19 3.92-.81 1-1.01 1.27-2.52.8-3.91 1.31-.67 2.19-1.9 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z" />
    </svg>
  )
}

// Header adapts to the mode: group/forward show members, channel shows a verified broadcast.
function ModeHeader({
  name,
  subtitle,
  verified,
}: {
  name: string
  subtitle: string
  verified?: boolean
}) {
  return (
    <div
      style={{
        background: '#075E54',
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.18)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16,
        }}
      >
        {verified ? '📢' : '👥'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            color: '#fff',
            fontWeight: 700,
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {name}
          </span>
          {verified && <VerifiedTick />}
        </div>
        <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11 }}>{subtitle}</div>
      </div>
    </div>
  )
}

export function WhatsAppChain({ article }: { article: NewsArticle }) {
  const clearNewspaperHeadline = useGameStore((s) => s.clearNewspaperHeadline)
  const meta = article.channelMeta
  const mode = meta?.whatsappMode ?? 'forward'
  const forwardCount = meta?.forwardCount ?? 18
  const isRumor = meta?.isRumor ?? false
  const messages = meta?.whatsappMessages ?? []
  const emojiTallies = meta?.emojiTallies ?? []
  const dataPoint = article.dataPoints[0]
  const messageText = article.deck.length > 130 ? `${article.deck.slice(0, 130)}…` : article.deck

  const isChannel = mode === 'channel'
  const headerName = meta?.groupName ?? (isChannel ? 'Lagos Alert' : 'Lagos Residents 🇳🇬')
  const headerSubtitle = isChannel
    ? `${(meta?.followerCount ?? 24_000).toLocaleString()} followers`
    : `${(meta?.memberCount ?? 2_847).toLocaleString()} members`

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(3px)',
      }}
    >
      <BackdropButton onClose={clearNewspaperHeadline} />
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: 360,
          maxWidth: 'calc(100vw - 32px)',
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
        }}
      >
        <ModeHeader name={headerName} subtitle={headerSubtitle} verified={isChannel} />
        {mode === 'forward' && <ForwardedWarning />}
        <div style={{ background: '#e5ddd5', padding: '10px 10px', minHeight: 180 }}>
          <NewsBubble
            article={article}
            messageText={messageText}
            isRumor={isRumor}
            forwarded={!isChannel}
          />
          {isChannel ? (
            <EmojiTallyRow tallies={emojiTallies} forwardCount={forwardCount} />
          ) : (
            messages.map((msg, i) => (
              <GroupMessage
                key={`${msg.sender}-${msg.time}-${msg.text.slice(0, 12)}`}
                msg={msg}
                isLast={i === messages.length - 1}
              />
            ))
          )}
        </div>
        <DataPointStrip dataPoint={dataPoint} />
        <WhatsAppCTA onClose={clearNewspaperHeadline} />
      </div>
    </div>
  )
}

function BackdropButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      aria-label="Close WhatsApp chain"
      onClick={onClose}
      style={{
        position: 'absolute',
        inset: 0,
        cursor: 'pointer',
        border: 'none',
        padding: 0,
        background: 'transparent',
      }}
    />
  )
}

function ForwardedWarning() {
  return (
    <div
      style={{
        background: '#fdf6e3',
        padding: '5px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        borderBottom: '1px solid #e0d5c0',
      }}
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="#8b7355">
        <title>Forward</title>
        <path d="M14.5 4l-1.41 1.41 4.58 4.59H3v2h14.67l-4.58 4.59L14.5 20l8-8-8-8z" />
      </svg>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="#8b7355" style={{ marginLeft: -7 }}>
        <title>Forward</title>
        <path d="M14.5 4l-1.41 1.41 4.58 4.59H3v2h14.67l-4.58 4.59L14.5 20l8-8-8-8z" />
      </svg>
      <span style={{ fontSize: 11, color: '#6b5940', fontStyle: 'italic' }}>
        Forwarded many times
      </span>
    </div>
  )
}

function DataPointStrip({
  dataPoint,
}: {
  dataPoint: NewsArticle['dataPoints'][number] | undefined
}) {
  if (!dataPoint) return null

  return (
    <div
      style={{
        background: '#dcf8c6',
        padding: '7px 14px',
        borderTop: '1px solid rgba(0,0,0,0.08)',
        fontSize: 12,
        color: '#1a3a1a',
      }}
    >
      <strong>{dataPoint.label}:</strong> {dataPoint.value}
      {dataPoint.delta && (
        <span
          style={{
            marginLeft: 6,
            color: dataPoint.positive ? '#2e7d32' : '#c62828',
            fontWeight: 600,
          }}
        >
          ({dataPoint.delta})
        </span>
      )}
    </div>
  )
}

function WhatsAppCTA({ onClose }: { onClose: () => void }) {
  return (
    <div
      style={{
        background: '#075E54',
        padding: '10px 14px',
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      <button
        type="button"
        onClick={onClose}
        style={{
          background: '#25d366',
          color: '#000',
          border: 'none',
          borderRadius: 6,
          padding: '8px 18px',
          fontSize: 13,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        Continue Governing &rarr;
      </button>
    </div>
  )
}
