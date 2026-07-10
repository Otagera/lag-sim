import type { DriveStep } from 'driver.js'
import { driver } from 'driver.js'
import { useEffect, useRef } from 'react'
import type { HintDef } from '../data/hints'

type Props = {
  hint: HintDef
  onDismiss: () => void
}

export function ContextualHint({ hint, onDismiss }: Props) {
  const driverRef = useRef<ReturnType<typeof driver> | null>(null)

  useEffect(() => {
    const el = resolveElement(hint.element)
    const step: DriveStep = {
      element: el ?? undefined,
      popover: {
        title: hint.title ?? 'Hint',
        description: hint.text,
        side: hint.side,
        align: hint.align ?? 'center',
        showButtons: [],
        onCloseClick: () => {
          d.destroy()
          onDismiss()
        },
      },
    }

    const d = driver({
      animate: false,
      overlayColor: 'transparent',
      allowClose: true,
      stagePadding: 4,
      stageRadius: 3,
      popoverClass: 'tour-popover contextual',
      onDestroyed: () => {
        driverRef.current = null
      },
    })

    driverRef.current = d
    d.highlight(step)

    return () => {
      try {
        d.destroy()
      } catch {
        /* already destroyed */
      }
      driverRef.current = null
    }
  }, [hint, onDismiss])

  return null
}

function resolveElement(element?: string | (() => Element | null)): Element | null {
  if (!element) return null
  if (typeof element === 'function') return element()
  try {
    return document.querySelector(element)
  } catch {
    return null
  }
}
