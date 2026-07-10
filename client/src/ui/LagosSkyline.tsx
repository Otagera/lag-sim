import { useReducedMotion } from './design/useReducedMotion'
import {
  SkyAmbulance,
  SkyBRT,
  SkyCanoe,
  SkyDanfo,
  SkyEgrets,
  SkyEyo,
  SkyFerry,
  SkyHawker,
  SkyKeke,
  SkyLagRide,
  SkyLastma,
  SkyLekkiBridge,
  SkyMakoko,
  SkyMarinaStation,
  SkyOkada,
  SkyStalls,
  SkyTanker,
  SkyTheatre,
  SkyTrain,
} from './skyline'

/**
 * LagosSkyline — a layered, parallax Lagos vignette. Hand-drawn and adapted
 * elements: National Theatre, Lekki-Ikoyi Link Bridge, Makoko stilt houses,
 * Eyo procession, Blue Line train, ferry + canoe on the lagoon, and a road
 * full of danfo/BRT/keke/okada/LagRide/LASAMBUS/tanker traffic.
 *
 * viewBox 0 0 800 340. Key horizontal bands:
 *   sky 0–210 · lagoon 210–286 · promenade 286–306 · road 306–340
 */

const KEYFRAMES = `
@keyframes lsky-drift  { from { transform: translateX(0); }     to { transform: translateX(-280px); } }
@keyframes lsky-drift2 { from { transform: translateX(0); }     to { transform: translateX(-460px); } }
@keyframes lsky-ferry  { from { transform: translateX(-120px); } to { transform: translateX(900px); } }
@keyframes lsky-canoe  { from { transform: translateX(880px); }  to { transform: translateX(-80px); } }
@keyframes lsky-brt    { from { transform: translateX(-260px); }  to { transform: translateX(760px); } }
@keyframes lsky-danfo  { from { transform: translateX(-160px); } to { transform: translateX(880px); } }
@keyframes lsky-okada  { from { transform: translateX(-80px); }  to { transform: translateX(860px); } }
@keyframes lsky-keke   { from { transform: translateX(-110px); } to { transform: translateX(870px); } }
@keyframes lsky-tanker { from { transform: translateX(860px); }  to { transform: translateX(-120px); } }
@keyframes lsky-train  { from { transform: translateX(-280px); }  to { transform: translateX(780px); } }
@keyframes lsky-lagride { from { transform: translateX(-200px); } to { transform: translateX(900px); } }
@keyframes lsky-ambulance { from { transform: translateX(-300px); }  to { transform: translateX(800px); } }
@keyframes lsky-egrets { from { transform: translateX(0); }      to { transform: translateX(-1060px); } }
@keyframes lsky-tmb    { from { transform: translateX(0); }      to { transform: translateX(-180px); } }
@keyframes lsky-shim   { 0%,100% { opacity: .2; } 50% { opacity: .5; } }
`

export function LagosSkyline({ height = 300 }: { height?: number | string }) {
  const reduced = useReducedMotion()
  // Animated groups sweep via keyframes; under reduced motion each freezes at
  // a hand-picked static offset so the still frame is fully composed.
  const move = (name: string, secs: number, staticX = 0, delay = 0) =>
    reduced
      ? staticX !== 0
        ? { transform: `translateX(${staticX}px)` }
        : undefined
      : { animation: `${name} ${secs}s linear infinite`, animationDelay: `${delay}s` }

  return (
    <div
      style={{ position: 'relative', width: '100%', height, overflow: 'hidden', borderRadius: 6 }}
    >
      <style>{KEYFRAMES}</style>
      <svg
        viewBox="0 0 800 340"
        preserveAspectRatio="xMidYMax slice"
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <title>Lagos skyline</title>
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
          <Cloud x={130} y={54} s={1} />
          <Cloud x={520} y={92} s={0.7} />
          <Cloud x={880} y={60} s={0.9} />
        </g>
        <g style={move('lsky-drift2', 64)} opacity="0.55">
          <Cloud x={320} y={36} s={0.55} />
          <Cloud x={720} y={48} s={0.5} />
          <Cloud x={1040} y={40} s={0.6} />
        </g>

        {/* Egrets crossing the sky */}
        <g style={move('lsky-egrets', 110, -560)}>
          <SkyEgrets x={860} y={62} />
        </g>
        <g style={move('lsky-egrets', 150, -880)} opacity="0.7">
          <SkyEgrets x={1010} y={104} scale={0.6} />
        </g>

        {/* ── Far skyline: Eko Atlantic towers (atmospheric, desaturated) ── */}
        <g fill="#aac4ca" opacity={0.6}>
          <rect x="600" y="120" width="26" height="92" rx="2" />
          <polygon points="634,212 634,100 660,88 660,212" />
          <rect x="668" y="128" width="20" height="84" rx="2" />
          <rect x="696" y="104" width="30" height="108" rx="2" />
          <rect x="734" y="132" width="22" height="80" rx="2" />
        </g>
        {/* Marina Station on the far bank, legible scale */}
        <g opacity={0.6}>
          <SkyMarinaStation x={455} y={176} scale={0.13} />
        </g>

        {/* ── Third Mainland Bridge (distant, left half — the Lekki bridge owns the right) ── */}
        <g opacity="0.8">
          <path d="M0 204 L470 204 L470 206.5 L0 206.5 Z" fill="#9db8bd" />
          <path d="M0 208 L470 208" stroke="#9db8bd" strokeWidth="1" />
          {[30, 90, 150, 210, 270, 330, 390, 450].map((px) => (
            <g key={px}>
              <rect x={px - 1} y={208} width="2" height="11" fill="#9db8bd" />
              <path
                d={`M${px - 1.5} 222 L${px + 1.5} 222`}
                stroke="#9db8bd"
                strokeWidth="1.2"
                opacity="0.35"
              />
            </g>
          ))}
          {/* crawling traffic dashes on the deck */}
          <g style={move('lsky-tmb', 26)} fill="#7fa0a6">
            {[0, 90, 180, 270, 360, 450, 540].map((px) => (
              <rect key={px} x={px} y={201.4} width="7" height="2" rx="1" />
            ))}
          </g>
        </g>

        {/* ── Lekki-Ikoyi Link Bridge (mid-ground right) ── */}
        <SkyLekkiBridge x={498} y={146} opacity={0.9} />

        {/* ── Far bank + National Theatre (grounded, the hero landmark) ── */}
        <path
          d="M84 214 Q150 199 232 200.5 Q300 202 330 214 L330 219 Q230 209 84 219 Z"
          fill="#cfc2a4"
        />
        <path
          d="M92 212.5 Q160 200.5 232 202 Q296 203.5 322 212.5"
          fill="none"
          stroke="#9cb98f"
          strokeWidth="2.4"
          opacity="0.8"
        />
        <SkyTheatre x={148} y={86} scale={0.38} opacity={0.95} />

        {/* ── Lagoon ── */}
        <rect x="0" y="210" width="800" height="78" fill="url(#lsky-water)" />
        {/* Makoko stilt houses at the water's edge */}
        <SkyMakoko x={2} y={174} opacity={0.95} />
        <g stroke="#eaf6f3" strokeWidth="2" strokeLinecap="round" opacity="0.7">
          <line
            x1="40"
            y1="234"
            x2="250"
            y2="234"
            style={reduced ? undefined : { animation: 'lsky-shim 5s ease-in-out infinite' }}
          />
          <line
            x1="300"
            y1="248"
            x2="520"
            y2="248"
            style={reduced ? undefined : { animation: 'lsky-shim 6.5s ease-in-out infinite' }}
          />
          <line
            x1="540"
            y1="240"
            x2="740"
            y2="240"
            style={reduced ? undefined : { animation: 'lsky-shim 4.2s ease-in-out infinite' }}
          />
        </g>
        {/* Ferry and canoe crossing the lagoon in opposite directions */}
        <g style={move('lsky-ferry', 55, 300)}>
          <SkyFerry x={0} y={238} scale={1} />
        </g>
        <g style={move('lsky-canoe', 85, 645)}>
          <SkyCanoe x={0} y={258} />
        </g>

        {/* ── Promenade ── */}
        <rect x="0" y="286" width="800" height="54" fill="#d6c8ad" />
        <rect x="0" y="286" width="800" height="3" fill="#c7b699" />

        {/* Palms framing the scene (foreground) */}
        <Palm x={78} baseY={306} h={104} flip={false} />
        <Palm x={726} baseY={306} h={92} flip />

        {/* Street life: market stalls, hawker, Eyo procession */}
        <SkyStalls x={520} y={268} />
        <SkyHawker x={604} y={280} />
        <SkyEyo x={368} y={248} />
        <SkyLastma x={676} y={288} />

        {/* ── Blue Line train track (elevated, behind road) ── */}
        <rect x="0" y="295" width="800" height="4" fill="#546E7A" />
        <g style={move('lsky-train', 40, -60)}>
          <SkyTrain x={0} y={273} scale={0.85} />
        </g>

        {/* ── Road ── */}
        <rect x="0" y="308" width="800" height="32" fill="#37494a" />
        <g fill="#e8c94a" opacity="0.7">
          {[20, 110, 200, 290, 380, 470, 560, 650, 740].map((x) => (
            <rect key={x} x={x} y="322" width="28" height="3" />
          ))}
        </g>
        {/* Road traffic: tanker crawls against the flow; BRT, danfo, LagRide,
            ambulance, keke, and a faster okada in front */}
        <g style={move('lsky-tanker', 78, 350)}>
          <SkyTanker x={0} y={312} />
        </g>
        <g style={move('lsky-brt', 30, 280)}>
          <SkyBRT x={0} y={307} scale={0.08} />
        </g>
        <g style={move('lsky-danfo', 22, 470)}>
          <SkyDanfo x={0} y={310} scale={0.08} />
        </g>
        <g style={move('lsky-lagride', 26, 120)}>
          <SkyLagRide x={0} y={312} scale={0.06} />
        </g>
        <g style={move('lsky-ambulance', 18, 620)}>
          <SkyAmbulance x={0} y={313} scale={0.08} />
        </g>
        <g style={move('lsky-keke', 16, 190)}>
          <SkyKeke x={0} y={317} />
        </g>
        <g style={move('lsky-okada', 14, 540)}>
          <SkyOkada x={0} y={318} scale={0.2} />
        </g>
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
      <path
        d={`M0,0 q-6,${-h * 0.55} 2,${-h}`}
        fill="none"
        stroke="#6b5334"
        strokeWidth="6"
        strokeLinecap="round"
      />
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
