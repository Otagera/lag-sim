/**
 * SVG \u2192 PNG export pipeline.
 *
 * Font pitfall: SVGs drawn to canvas via <img> ignore external stylesheets and
 * @font-face links, so Playfair/Archivo fall back to generic serif/sans in the
 * exported PNG. The ideal fix is embedding WOFF2 subsets as base64 data-URIs
 * inside a <style> block in the serialized SVG. If that proves intractable,
 * the sanctioned fallback is Georgia (serif) / system sans-serif *declared in
 * the card's own styles* so preview and export match.
 *
 * For v1 we use the matching-but-plainer fallback approach (Georgia for display,
 * system-ui for UI), keeping the font-embed seam documented below.
 */

export async function exportCard(
  svgElement: SVGElement,
  width = 1080,
  height = 1350,
): Promise<Blob | null> {
  const svgClone = svgElement.cloneNode(true) as SVGElement

  /* ── Font-embed seam (OTA-26) ──
   * To embed fonts, fetch the WOFF2, readAsDataURL, then inject:
   *   const style = document.createElementNS('http://www.w3.org/2000/svg', 'style')
   *   style.textContent = `
   *     @font-face {
   *       font-family: 'Playfair Display';
   *       src: url(data:font/woff2;base64,${base64}) format('woff2');
   *       font-weight: 600;
   *     }
   *   `
   *   svgClone.prepend(style)
   * Cache the data-URI at module level.
   * For now we skip font embedding and declare Georgia/Archivo in the card's
   * inline styles so preview and export use the same fonts.
   */

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

export async function downloadOrShare(blob: Blob, filename: string) {
  if (navigator.canShare?.({ files: [new File([blob], filename, { type: 'image/png' })] })) {
    await navigator.share({
      files: [new File([blob], filename, { type: 'image/png' })],
      title: 'Lagos Governor Sim \u2014 Legacy',
    })
  } else {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = filename
    a.click()
    URL.revokeObjectURL(a.href)
  }
}
