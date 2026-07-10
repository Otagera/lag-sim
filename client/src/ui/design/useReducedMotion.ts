import { useEffect, useState } from 'react'

/**
 * Tracks the OS-level `prefers-reduced-motion` accessibility setting, reactively.
 *
 * Motion in this game (rain, shimmer, blackout flash, number count-ups) is
 * decorative — for players who ask for reduced motion we soften or stop it.
 * Use the returned boolean to skip JS-driven animation (e.g. render rain/shimmer
 * conditionally, or jump a count-up straight to its target). CSS-only animation
 * is handled separately by the `@media (prefers-reduced-motion: reduce)` block
 * in index.css.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(prefersReducedMotion)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(mq.matches)
    // addEventListener is the modern API; older Safari only has addListener.
    if (mq.addEventListener) mq.addEventListener('change', onChange)
    else mq.addListener(onChange)
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', onChange)
      else mq.removeListener(onChange)
    }
  }, [])

  return reduced
}
