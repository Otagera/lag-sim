import { type ReactNode, useEffect, useRef, useState } from 'react'
import type { ShareCaption } from './buildShareCaption'
import { exportCard, sharePng } from './exportCard'

/** Capability probe: can this platform share a PNG file via the native sheet? */
function probeFileShare(): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.canShare !== 'function') return false
  try {
    return navigator.canShare({
      files: [new File([new Uint8Array()], 'probe.png', { type: 'image/png' })],
    })
  } catch {
    return false
  }
}

/**
 * Reusable share sheet: renders any SVG card, exports it to PNG, and shares it
 * with a caption + link (native share sheet) or downloads it and copies the
 * caption to the clipboard (desktop). Used for both the end-game legacy card
 * and mid-game moment cards.
 */
export function ShareModal({
  title,
  card,
  filename,
  caption,
  onClose,
}: {
  title: string
  card: ReactNode
  filename: string
  caption: ShareCaption
  onClose: () => void
}) {
  const [exporting, setExporting] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [canShare, setCanShare] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => setCanShare(probeFileShare()), [])

  async function handleExport() {
    const svgEl = containerRef.current?.querySelector('svg')
    if (!svgEl) return
    setExporting(true)
    setStatus(null)
    try {
      const blob = await exportCard(svgEl)
      if (!blob) throw new Error('export produced no image')
      const result = await sharePng(blob, {
        filename,
        title,
        text: caption.text,
        url: caption.url,
      })
      if (result.method === 'download') {
        setStatus(result.captionCopied ? 'Saved — caption copied to clipboard.' : 'Image saved.')
      }
    } catch (err) {
      console.error('Share card export failed:', err)
      setStatus('Sorry — something went wrong exporting the card.')
    } finally {
      setExporting(false)
    }
  }

  const actionLabel = exporting ? 'Preparing…' : canShare ? 'Share' : 'Download PNG'

  return (
    <div
      className="fixed inset-0 flex items-start justify-center overflow-y-auto py-8 px-4"
      style={{ backgroundColor: 'rgba(19, 32, 30, 0.7)', zIndex: 100 }}
    >
      <div
        className="w-full space-y-4"
        style={{ maxWidth: '560px', backgroundColor: 'var(--surface)', padding: '20px' }}
      >
        <div className="flex items-center justify-between">
          <h2 className="label-caps" style={{ color: 'var(--text)' }}>
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            Close
          </button>
        </div>
        <div style={{ lineHeight: 0 }} ref={containerRef}>
          {card}
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="w-full px-6 py-3 text-sm font-semibold transition-colors"
          style={{
            backgroundColor: exporting ? 'var(--accent-4)' : 'var(--accent-solid)',
            color: 'var(--accent-on-solid)',
            cursor: exporting ? 'not-allowed' : 'pointer',
          }}
        >
          {actionLabel}
        </button>
        {status ? (
          <p className="text-center" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            {status}
          </p>
        ) : null}
      </div>
    </div>
  )
}
