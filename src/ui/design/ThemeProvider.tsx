/**
 * ThemeProvider — connects Zustand game state to CSS custom properties.
 * Sets html[data-situation] which triggers CSS state overrides in index.css.
 * Also renders the RainLayer on storm and an ambient shimmer on calm.
 * ONE place owns mood switching; every component transitions for free.
 */
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useGameStore } from '../../state/gameStore'
import { deriveSituation, type Situation } from './tokens'

// ─── Context ──────────────────────────────────────────────────────────────────
export const SituationCtx = createContext<Situation>('calm')
export const useSituation = () => useContext(SituationCtx)

// ─── Rain drops (generated once) ─────────────────────────────────────────────
const DROPS = Array.from({ length: 60 }, (_, i) => ({
  id: i,
  left:    Math.random() * 115 - 7,
  height:  13 + Math.random() * 24,
  dur:     0.50 + Math.random() * 0.55,
  delay:   -(Math.random() * 2.8),
  opacity: 0.15 + Math.random() * 0.18,
  width:   Math.random() < 0.2 ? 1.5 : 1,
}))

function RainLayer() {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 15,
      pointerEvents: 'none', overflow: 'hidden',
    }}>
      {DROPS.map(d => (
        <div key={d.id} style={{
          position: 'absolute', top: 0,
          left: `${d.left}%`,
          width: `${d.width}px`,
          height: `${d.height}px`,
          background: 'linear-gradient(to bottom, transparent, rgba(110,165,230,.55))',
          borderRadius: '1px',
          opacity: d.opacity,
          animation: `sl-rainfall ${d.dur}s ${d.delay}s linear infinite`,
        }}/>
      ))}
    </div>
  )
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const gameState   = useGameStore((s) => s)
  const [situation, setSituation] = useState<Situation>('calm')
  const [showFlash, setShowFlash] = useState(false)
  const prevSituation = useRef<Situation>('calm')

  useEffect(() => {
    const next = deriveSituation(gameState)
    if (next === prevSituation.current) return

    const wasStorm = prevSituation.current === 'storm'
    const goingStorm = next === 'storm'

    // Blackout flash: on storm onset or leaving storm
    if (goingStorm || wasStorm) {
      setShowFlash(true)
      setTimeout(() => setShowFlash(false), 230)
    }

    setSituation(next)
    document.documentElement.dataset.situation = next
    prevSituation.current = next
  }, [
    gameState.riotModeActive,
    gameState.consecutiveBankruptWeeks,
    gameState.stats.cashReserve,
    gameState.stats.publicTrust,
    gameState.stats.politicalCapital,
    gameState.factions,
  ])

  // Sync on mount
  useEffect(() => {
    const s = deriveSituation(gameState)
    document.documentElement.dataset.situation = s
    setSituation(s)
    prevSituation.current = s
    return () => { delete document.documentElement.dataset.situation }
  }, [])

  return (
    <SituationCtx.Provider value={situation}>
      {/* Blackout flash */}
      {showFlash && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 60,
          background: '#05090F', pointerEvents: 'none',
          animation: 'tp-blackout .22s ease forwards',
        }}/>
      )}

      {/* Storm rain */}
      {situation === 'storm' && <RainLayer />}

      {/* Calm ambient shimmer (very faint radial) */}
      {situation === 'calm' && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse at 65% 20%, rgba(26,155,142,.04) 0%, transparent 55%)',
          animation: 'tp-shimmer 7s ease-in-out infinite',
        }}/>
      )}

      {children}
    </SituationCtx.Provider>
  )
}
