import { useReducedMotion } from './design/useReducedMotion'
import { SkyDanfo, SkyBRT, SkyTheatre, SkyEyo, SkyTrain, SkyLagRide, SkyAmbulance, SkyFerry, SkyMarinaStation, SkyOkada } from './skyline'

/**
 * LagosSkyline — a layered, parallax Lagos vignette remixed from dedicated
 * reference SVGs (references/). Each vehicle/landmark is sourced from detailed
 * Lagos-themed art — danfo, BRT, National Theatre, Eyo masquerade, Blue Line
 * train, LagRide, LASAMBUS — wrapping them in animated React components.
 *
 * viewBox 0 0 800 340. Key horizontal bands:
 *   sky 0–210 · lagoon 210–286 · promenade 286–306 · road 306–340
 */

const KEYFRAMES = `
@keyframes lsky-drift  { from { transform: translateX(0); }     to { transform: translateX(-280px); } }
@keyframes lsky-drift2 { from { transform: translateX(0); }     to { transform: translateX(-460px); } }
@keyframes lsky-ferry  { from { transform: translateX(-120px); } to { transform: translateX(900px); } }
@keyframes lsky-brt    { from { transform: translateX(-260px); }  to { transform: translateX(760px); } }
@keyframes lsky-danfo  { from { transform: translateX(-160px); } to { transform: translateX(880px); } }
@keyframes lsky-okada  { from { transform: translateX(-80px); }  to { transform: translateX(860px); } }
@keyframes lsky-train  { from { transform: translateX(-280px); }  to { transform: translateX(780px); } }
@keyframes lsky-lagride { from { transform: translateX(-200px); } to { transform: translateX(900px); } }
@keyframes lsky-ambulance { from { transform: translateX(-300px); }  to { transform: translateX(800px); } }
@keyframes lsky-shim   { 0%,100% { opacity: .2; } 50% { opacity: .5; } }
`

export function LagosSkyline({ height = 300 }: { height?: number | string }) {
  const reduced = useReducedMotion()
  const move = (name: string, secs: number, delay = 0) =>
    reduced ? undefined : { animation: `${name} ${secs}s linear infinite`, animationDelay: `${delay}s` }

  return (
    <div style={{ position: 'relative', width: '100%', height, overflow: 'hidden', borderRadius: 6 }}>
      <style>{KEYFRAMES}</style>
      <svg viewBox="0 0 800 340" preserveAspectRatio="xMidYMax slice" style={{ width: '100%', height: '100%', display: 'block' }}>
        <defs>
          <linearGradient id="lsky-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#bfe0ea" />
            <stop offset="62%" stopColor="#e2eef0" />
            <stop offset="100%" stopColor="#ffe9d2" />
          </linearGradient>
          <linearGradient id="lsky-water" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#bfe0dd" />
            <stop offset="100%" stopColor="#8ec0bd" />
          </linearGradient>
          <radialGradient id="lsky-sun" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#ffdca0" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#ffdca0" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* ── Sky ── */}
        <rect x="0" y="0" width="800" height="212" fill="url(#lsky-sky)" />
        <circle cx="626" cy="70" r="90" fill="url(#lsky-sun)" />
        <circle cx="626" cy="70" r="34" fill="#ffe1ad" />

        {/* Clouds (far parallax) */}
        <g style={move('lsky-drift', 95)} opacity="0.9">
          <Cloud x={130} y={54} s={1} /><Cloud x={520} y={92} s={0.7} /><Cloud x={880} y={60} s={0.9} />
        </g>
        <g style={move('lsky-drift2', 64)} opacity="0.55">
          <Cloud x={320} y={36} s={0.55} /><Cloud x={720} y={48} s={0.5} /><Cloud x={1040} y={40} s={0.6} />
        </g>

        {/* ── Far skyline: Eko Atlantic + Marina Station (atmospheric, desaturated) ── */}
        <g opacity={0.55}>
          <SkyMarinaStation x={420} y={130} scale={0.055} />
        </g>
        <g fill="#aac4ca" opacity={0.6}>
          <rect x="600" y="120" width="26" height="92" rx="2" />
          <polygon points="634,212 634,100 660,88 660,212" />
          <rect x="668" y="128" width="20" height="84" rx="2" />
          <rect x="696" y="104" width="30" height="108" rx="2" />
          <rect x="734" y="132" width="22" height="80" rx="2" />
        </g>

        {/* ── Third Mainland Bridge (distant, thin, receding) ── */}
        <g stroke="#9db8bd" strokeWidth="2" opacity="0.8">
          <line x1="0" y1="206" x2="800" y2="206" />
          {[40, 130, 220, 310, 400, 490, 580, 670, 760].map((x) => (
            <line key={x} x1={x} y1="206" x2={x} y2="220" strokeWidth="1.5" />
          ))}
        </g>

        {/* ── National Theatre — the hero landmark ── */}
        <SkyTheatre x={148} y={88} scale={0.38} opacity={0.95} />

        {/* ── Lagoon ── */}
        <rect x="0" y="210" width="800" height="78" fill="url(#lsky-water)" />
        <g stroke="#eaf6f3" strokeWidth="2" strokeLinecap="round" opacity="0.7">
          <line x1="40" y1="234" x2="250" y2="234" style={reduced ? undefined : { animation: 'lsky-shim 5s ease-in-out infinite' }} />
          <line x1="300" y1="248" x2="520" y2="248" style={reduced ? undefined : { animation: 'lsky-shim 6.5s ease-in-out infinite' }} />
          <line x1="540" y1="240" x2="740" y2="240" style={reduced ? undefined : { animation: 'lsky-shim 4.2s ease-in-out infinite' }} />
        </g>
        {/* Ferry drifting across the lagoon */}
        <g style={move('lsky-ferry', 55)}><SkyFerry x={0} y={238} scale={1} /></g>

        {/* ── Promenade ── */}
        <rect x="0" y="286" width="800" height="54" fill="#d6c8ad" />
        <rect x="0" y="286" width="800" height="3" fill="#c7b699" />

        {/* Palms framing the scene (foreground) */}
        <Palm x={78} baseY={306} h={104} flip={false} />
        <Palm x={726} baseY={306} h={92} flip />

        {/* Eyo masquerade standing on the promenade */}
        <SkyEyo x={390} y={260} scale={0.14} />

        {/* ── Blue Line train track (elevated, behind road) ── */}
        <rect x="0" y="295" width="800" height="4" fill="#546E7A" />
        <g style={move('lsky-train', 40)}>
          <SkyTrain x={0} y={273} scale={0.85} />
        </g>

        {/* ── Road ── */}
        <rect x="0" y="308" width="800" height="32" fill="#37494a" />
        <g fill="#e8c94a" opacity="0.7">
          {[20, 110, 200, 290, 380, 470, 560, 650, 740].map((x) => <rect key={x} x={x} y="322" width="28" height="3" />)}
        </g>
        {/* Road traffic: BRT, danfo, LagRide, ambulance, and a faster okada in front */}
        <g style={move('lsky-brt', 30)}><SkyBRT x={0} y={307} scale={0.08} /></g>
        <g style={move('lsky-danfo', 22)}><SkyDanfo x={0} y={310} scale={0.08} /></g>
        <g style={move('lsky-lagride', 26)}><SkyLagRide x={0} y={312} scale={0.06} /></g>
        <g style={move('lsky-ambulance', 18)}><SkyAmbulance x={0} y={313} scale={0.08} /></g>
        <g style={move('lsky-okada', 14)}><SkyOkada x={0} y={318} scale={0.2} /></g>
      </svg>
    </div>
  )
}

/* ── Layer pieces ─────────────────────────────────────────────────────────────── */

function Cloud({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} fill="#ffffff">
      <ellipse cx="0" cy="0" rx="36" ry="15" />
      <ellipse cx="28" cy="6" rx="26" ry="12" />
      <ellipse cx="-26" cy="6" rx="22" ry="11" />
    </g>
  )
}

function Palm({ x, baseY, h, flip }: { x: number; baseY: number; h: number; flip: boolean }) {
  return (
    <g transform={`translate(${x},${baseY}) scale(${flip ? -1 : 1},1)`}>
      <path d={`M0,0 q-6,${-h * 0.55} 2,${-h}`} fill="none" stroke="#6b5334" strokeWidth="6" strokeLinecap="round" />
      <g transform={`translate(2,${-h})`} fill="#3f7d4e">
        <path d="M0,0 Q-34,-6 -52,10 Q-30,-2 0,4 Z" />
        <path d="M0,0 Q-24,-22 -40,-30 Q-18,-14 0,2 Z" />
        <path d="M0,0 Q6,-30 2,-46 Q-4,-24 -2,0 Z" />
        <path d="M0,0 Q30,-20 46,-26 Q22,-10 2,2 Z" />
        <path d="M0,0 Q34,-4 54,10 Q30,0 0,4 Z" />
      </g>
      <circle cx="2" cy={-h + 2} r="3" fill="#6b5334" />
    </g>
  )
}



