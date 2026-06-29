import { useEffect, useRef } from 'react'
import { driver } from 'driver.js'
import { ONBOARDING_TOUR_STEPS } from '../data/onboardingTour'

type Props = {
  seen: string[]
  onComplete: () => void
}

export function GuidedTour({ seen, onComplete }: Props) {
  const firedRef = useRef(false)

  useEffect(() => {
    if (firedRef.current) return
    if (seen.includes('onboarding-tour')) return

    // Wait a tick for the DOM to be fully mounted
    const id = requestAnimationFrame(() => {
      firedRef.current = true

      // Verify at least the first few elements exist before launching
      const firstEl = resolveTourElement(ONBOARDING_TOUR_STEPS[0].element)
      if (!firstEl) {
        // DOM not ready — retry on next frame
        firedRef.current = false
        return
      }

      const d = driver({
        animate: true,
        overlayColor: 'rgba(0,0,0,0.55)',
        allowClose: false,
        showProgress: true,
        progressText: '{{current}} of {{total}}',
        doneBtnText: 'Begin',
        nextBtnText: 'Next',
        prevBtnText: 'Back',
        popoverClass: 'tour-popover guided',
        stagePadding: 6,
        stageRadius: 4,
        steps: ONBOARDING_TOUR_STEPS,
        onDestroyed: () => {
          onComplete()
        },
      })

      d.drive()
    })

    return () => cancelAnimationFrame(id)
  }, [seen])

  return null
}

function resolveTourElement(element?: string | (() => Element | null) | Element): Element | null {
  if (!element) return null
  if (element instanceof Element) return element
  if (typeof element === 'function') return element()
  try {
    return document.querySelector(element)
  } catch {
    return null
  }
}
