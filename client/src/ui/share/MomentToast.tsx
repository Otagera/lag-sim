import { useState } from 'react'
import { useGameStore } from '../../state/gameStore'
import { buildMomentCardData, type MomentCardData } from './buildMomentCardData'
import { buildMomentCaption } from './buildShareCaption'
import { MomentCard } from './MomentCard'
import { ShareModal } from './ShareModal'

/**
 * Non-spammy CTA for a pending mid-game moment: a small dismissible card above
 * the dock. "Share it" snapshots the moment (so the modal survives the store
 * clearing the pending slot) and opens the reusable ShareModal with a
 * MomentCard; "Not now" retires it. Suppressed while a decision, godfather ask,
 * or game-over screen is up so it never collides with a choice.
 */
export function MomentToast() {
  const pendingMoment = useGameStore((s) => s.pendingMoment)
  const isGameOver = useGameStore((s) => s.isGameOver)
  const activeEvent = useGameStore((s) => s.activeEvent)
  const activeGodfatherMessage = useGameStore((s) => s.activeGodfatherMessage)
  const shareMoment = useGameStore((s) => s.shareMoment)
  const dismissMoment = useGameStore((s) => s.dismissMoment)

  const [active, setActive] = useState<MomentCardData | null>(null)

  // The share sheet holds its own snapshot, so it stays open after the store
  // clears the pending slot.
  if (active) {
    return (
      <ShareModal
        title="Share This Moment"
        card={<MomentCard data={active} />}
        filename={`lagos-moment-${active.momentType}-week${active.week}.png`}
        caption={buildMomentCaption(active)}
        onClose={() => setActive(null)}
      />
    )
  }

  if (!pendingMoment || isGameOver || activeEvent || activeGodfatherMessage) return null

  const data = buildMomentCardData(useGameStore.getState(), pendingMoment)

  function handleShare() {
    setActive(data)
    shareMoment()
  }

  return (
    <div
      className="themed"
      style={{
        position: 'fixed',
        left: '50%',
        transform: 'translateX(-50%)',
        bottom: 'calc(72px + env(safe-area-inset-bottom))',
        zIndex: 40,
        width: 'min(440px, calc(100% - 24px))',
        background: 'var(--surface)',
        border: '1px solid var(--accent-solid)',
        borderRadius: '8px',
        boxShadow: 'var(--shadow-atm)',
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      <div>
        <div className="label-caps" style={{ color: 'var(--accent-text)' }}>
          A moment worth marking
        </div>
        <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginTop: '2px' }}>
          {data.headline}
        </p>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          type="button"
          onClick={handleShare}
          className="text-sm font-semibold"
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: '6px',
            border: 'none',
            background: 'var(--accent-solid)',
            color: 'var(--accent-on-solid)',
            cursor: 'pointer',
          }}
        >
          Share it
        </button>
        <button
          type="button"
          onClick={dismissMoment}
          className="text-sm"
          style={{
            padding: '8px 14px',
            borderRadius: '6px',
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
          }}
        >
          Not now
        </button>
      </div>
    </div>
  )
}
