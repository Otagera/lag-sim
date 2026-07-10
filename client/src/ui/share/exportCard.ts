/**
 * SVG → PNG export pipeline.
 *
 * Font handling: SVGs drawn to <canvas> via <img> ignore external stylesheets
 * and @font-face links, so the card's brand fonts would fall back to generic
 * serif/sans in the exported PNG. We fix this by embedding the WOFF2 faces as
 * base64 data-URIs inside a <style> block in the serialized SVG clone
 * (see loadFontCss). The vendored @fontsource files are imported as URLs and
 * fetched lazily, so they land in a lazy chunk rather than the main bundle.
 *
 * Graceful degradation: if the embed fails (fetch error, or a platform that
 * rejects large data-URI fonts), we skip injection and the card's retained
 * Georgia/system fallbacks reproduce the older plainer output — never a crash.
 *
 * Only the faces the cards actually draw are embedded: Playfair Display
 * 400 / 400-italic / 600 / 700, and Archivo Narrow 400 / 600 / 700. The stamp
 * (drawn at weight 700) is the heaviest Archivo weight @fontsource ships.
 */
import ArchivoRegular from '@fontsource/archivo-narrow/files/archivo-narrow-latin-400-normal.woff2?url'
import ArchivoSemi from '@fontsource/archivo-narrow/files/archivo-narrow-latin-600-normal.woff2?url'
import ArchivoBold from '@fontsource/archivo-narrow/files/archivo-narrow-latin-700-normal.woff2?url'
import PlayfairItalic from '@fontsource/playfair-display/files/playfair-display-latin-400-italic.woff2?url'
import PlayfairRegular from '@fontsource/playfair-display/files/playfair-display-latin-400-normal.woff2?url'
import PlayfairSemi from '@fontsource/playfair-display/files/playfair-display-latin-600-normal.woff2?url'
import PlayfairBold from '@fontsource/playfair-display/files/playfair-display-latin-700-normal.woff2?url'

type FaceSpec = {
  family: 'Playfair Display' | 'Archivo Narrow'
  weight: number
  style: 'normal' | 'italic'
  url: string
}

const FACES: FaceSpec[] = [
  { family: 'Playfair Display', weight: 400, style: 'normal', url: PlayfairRegular },
  { family: 'Playfair Display', weight: 400, style: 'italic', url: PlayfairItalic },
  { family: 'Playfair Display', weight: 600, style: 'normal', url: PlayfairSemi },
  { family: 'Playfair Display', weight: 700, style: 'normal', url: PlayfairBold },
  { family: 'Archivo Narrow', weight: 400, style: 'normal', url: ArchivoRegular },
  { family: 'Archivo Narrow', weight: 600, style: 'normal', url: ArchivoSemi },
  { family: 'Archivo Narrow', weight: 700, style: 'normal', url: ArchivoBold },
]

function bufToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

async function faceToCss(spec: FaceSpec): Promise<string> {
  const res = await fetch(spec.url)
  const b64 = bufToBase64(await res.arrayBuffer())
  return `@font-face{font-family:'${spec.family}';font-style:${spec.style};font-weight:${spec.weight};font-display:block;src:url(data:font/woff2;base64,${b64}) format('woff2');}`
}

// Memoized: the base64 font CSS is fetched/encoded once per session, then
// reused for every subsequent export. On failure the cache is cleared so a
// later export can retry.
let fontCssPromise: Promise<string> | null = null
function loadFontCss(): Promise<string> {
  if (!fontCssPromise) {
    fontCssPromise = Promise.all(FACES.map(faceToCss))
      .then((blocks) => blocks.join(''))
      .catch((err) => {
        fontCssPromise = null
        throw err
      })
  }
  return fontCssPromise
}

export async function exportCard(
  svgElement: SVGElement,
  width = 1080,
  height = 1350,
): Promise<Blob | null> {
  const svgClone = svgElement.cloneNode(true) as SVGElement

  try {
    const style = document.createElementNS('http://www.w3.org/2000/svg', 'style')
    style.textContent = await loadFontCss()
    svgClone.insertBefore(style, svgClone.firstChild)
  } catch (err) {
    // Font embed failed — the card's retained Georgia/system fallbacks apply.
    console.warn('Share card font embed failed; exporting with fallback fonts.', err)
  }

  const serializer = new XMLSerializer()
  const svgString = serializer.serializeToString(svgClone)
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(svgBlob)

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = () => reject(new Error('SVG failed to render to Image'))
      image.src = url
    })

    const canvas = document.createElement('canvas')
    canvas.width = width * 2
    canvas.height = height * 2
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    ctx.scale(2, 2)
    ctx.drawImage(img, 0, 0, width, height)

    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png')
    })
  } finally {
    URL.revokeObjectURL(url)
  }
}

export interface SharePayload {
  filename: string
  title?: string
  /** Recruiting caption. On desktop it is copied to the clipboard. */
  text?: string
  /** Play-the-game link. */
  url?: string
}

export type ShareResult =
  | { method: 'share' }
  | { method: 'cancelled' }
  | { method: 'download'; captionCopied: boolean }

/**
 * Shares the PNG with a caption + link where the platform supports it
 * (native share sheet, mostly mobile), otherwise downloads the file and copies
 * the caption to the clipboard so desktop users still get the recruiting text.
 */
export async function sharePng(blob: Blob, opts: SharePayload): Promise<ShareResult> {
  const file = new File([blob], opts.filename, { type: 'image/png' })

  if (navigator.canShare?.({ files: [file] })) {
    const shareData: ShareData = { files: [file], title: opts.title ?? 'Lagos Governor Sim' }
    if (opts.text) shareData.text = opts.text
    if (opts.url) shareData.url = opts.url
    try {
      await navigator.share(shareData)
      return { method: 'share' }
    } catch (err) {
      // User dismissed the share sheet — treat as a no-op, don't also download.
      if (err instanceof Error && err.name === 'AbortError') return { method: 'cancelled' }
      // Any other share failure falls through to the download path.
    }
  }

  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = opts.filename
  a.click()
  URL.revokeObjectURL(a.href)

  let captionCopied = false
  const clipboardText = [opts.text, opts.url].filter(Boolean).join('\n')
  if (clipboardText) {
    try {
      await navigator.clipboard?.writeText(clipboardText)
      captionCopied = true
    } catch {
      // Clipboard blocked (no gesture / permissions) — download still succeeded.
    }
  }
  return { method: 'download', captionCopied }
}
