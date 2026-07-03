import { useGameStore } from '../state/gameStore'
import type { NewsArticle } from '../state/types'

// ── Realistic reactions by story category ───────────────────────
const REACTIONS: Record<string, string[][]> = {
  crisis: [
    ['Tunde B.', '12:41 PM', 'Chai. Did you people see this?? 😱'],
    ['Aunty Ngozi', '12:44 PM', 'This one is serious o. God help Lagos 🙏🙏'],
    ['Lagos Bus Group 🚌', '12:51 PM', 'They are not showing this on NTA. Share everywhere'],
    ['Alimosho Residents', '1:03 PM', 'I said it! Something was bound to happen. Nobody listened'],
  ],
  political: [
    ['Kemi A.', '2:14 PM', "So this is what is happening? 😒 They think we don't know"],
    ['Dr. Rotimi', '2:19 PM', 'Una see am? I knew from day one. Nothing will change'],
    ['Naija Matters 🇳🇬', '2:27 PM', 'Forward this to every Lagos person in your contact 🔁'],
    ['Bayo Esq.', '2:33 PM', 'They will come and be doing press conference. Rubbish'],
  ],
  fiscal: [
    ['Emeka L.', '9:04 AM', 'Where exactly is this money going? Someone should explain'],
    ['Ifeoma', '9:11 AM', 'This thing will affect all of us by end of month 😔'],
    ['Concerned Citizens 📢', '9:18 AM', "Please share. Our children's future is at stake"],
    ['Tunde B.', '9:24 AM', 'My own question is — who approved this? Accountability!'],
  ],
  milestone: [
    ['Amaka O.', '3:52 PM', 'Finally!! Something positive for once 🙌🙌'],
    ['Yemi F.', '3:58 PM', 'This is good news sha. About time they do something right'],
    ['Lagos Pride 🟢', '4:05 PM', 'Forward this! Good things deserve to spread too 🙏'],
    ['Bayo Esq.', '4:09 PM', "Let's see if they will maintain it. I hope they don't mess it up"],
  ],
  background: [
    ['Shade M.', '7:30 PM', 'I heard this since last week. My cousin confirmed it'],
    ['Emeka L.', '7:35 PM', "Hmm. Not everything you hear is true sha. Let's wait"],
    ['Naija Matters 🇳🇬', '7:41 PM', "Spread this. They don't want us to know 👀"],
    ['Ifeoma', '7:48 PM', 'True true. This has been going on for long'],
  ],
}

const DEFAULT_REACTIONS = REACTIONS.background

function hashInt(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

function ForwardBubble({
  sender,
  time,
  message,
  isLast,
}: {
  sender: string
  time: string
  message: string
  isLast: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        marginBottom: isLast ? 0 : 6,
      }}
    >
      <div
        style={{
          maxWidth: '82%',
          background: '#005c4b',
          borderRadius: '10px 0px 10px 10px',
          padding: '6px 10px 4px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            marginBottom: 3,
          }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="rgba(255,255,255,0.4)">
            <title>Forward</title>
            <path d="M14.5 4l-1.41 1.41L18.67 11H3v2h15.67l-5.58 5.59L14.5 20l8-8z" />
          </svg>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontStyle: 'italic' }}>
            Forwarded
          </span>
        </div>
        <div style={{ color: '#80cbc4', fontSize: 11, fontWeight: 600, marginBottom: 2 }}>
          {sender}
        </div>
        <p style={{ color: 'rgba(255,255,255,0.92)', fontSize: 13, lineHeight: 1.4, margin: 0 }}>
          {message}
        </p>
        <div
          style={{ textAlign: 'right', marginTop: 3, fontSize: 10, color: 'rgba(255,255,255,0.3)' }}
        >
          {time} ✓✓
        </div>
      </div>
    </div>
  )
}

export function buildWhatsAppReactions(article: NewsArticle): {
  messageText: string
  reactions: string[][]
} {
  const forwardCount = article.channelMeta?.forwardCount ?? 18
  const messageText = article.deck.length > 130 ? `${article.deck.slice(0, 130)}…` : article.deck
  const pool = REACTIONS[article.category] ?? DEFAULT_REACTIONS
  const offset = hashInt(article.headline.slice(0, 8)) % pool.length
  const visibleCount = Math.min(3, Math.ceil(forwardCount / 12) + 1)
  const reactions = Array.from({ length: visibleCount }, (_, i) => pool[(offset + i) % pool.length])

  return { messageText, reactions }
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

function WhatsAppHeader({ forwardCount }: { forwardCount: number }) {
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
        📲
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>Lagos Alert</div>
        <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11 }}>
          Forwarded {forwardCount}+ times
        </div>
      </div>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="rgba(255,255,255,0.45)">
        <title>Profile</title>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
      </svg>
    </div>
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

function IncomingMessage({ article, messageText }: { article: NewsArticle; messageText: string }) {
  const isRumor = article.channelMeta?.isRumor ?? false

  return (
    <div style={{ display: 'flex', marginBottom: 8 }}>
      <div
        style={{
          maxWidth: '82%',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 3 }}>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="rgba(0,0,0,0.28)">
            <title>Forward</title>
            <path d="M14.5 4l-1.41 1.41 4.58 4.59H3v2h14.67l-4.58 4.59L14.5 20l8-8-8-8z" />
          </svg>
          <span style={{ color: 'rgba(0,0,0,0.28)', fontSize: 10, fontStyle: 'italic' }}>
            Forwarded
          </span>
        </div>
        <p
          style={{
            color: '#1a1a1a',
            fontSize: 13,
            lineHeight: 1.4,
            margin: 0,
            fontWeight: 600,
          }}
        >
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

export function WhatsAppChain({ article }: { article: NewsArticle }) {
  const clearNewspaperHeadline = useGameStore((s) => s.clearNewspaperHeadline)
  const forwardCount = article.channelMeta?.forwardCount ?? 18
  const { messageText, reactions } = buildWhatsAppReactions(article)
  const dataPoint = article.dataPoints[0]

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
        <WhatsAppHeader forwardCount={forwardCount} />
        <ForwardedWarning />
        <div
          style={{
            background: '#e5ddd5',
            padding: '10px 10px',
            minHeight: 180,
          }}
        >
          <IncomingMessage article={article} messageText={messageText} />
          {reactions.map(([sender, time, message], i) => (
            <ForwardBubble
              key={`${sender}-${time}-${message.slice(0, 12)}`}
              sender={sender}
              time={time}
              message={message}
              isLast={i === reactions.length - 1}
            />
          ))}
        </div>
        <DataPointStrip dataPoint={dataPoint} />
        <WhatsAppCTA onClose={clearNewspaperHeadline} />
      </div>
    </div>
  )
}
