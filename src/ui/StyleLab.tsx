/**
 * /style-lab v2 — Situational UI Art Direction Sandbox
 * A bright coastal Lagos that the game's events wash with color and weather.
 * 4 states × 3 variants × 5 components + motion + sound stubs.
 * Throwaway eyeball code — feel over architecture.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ArchetypeKey } from '../data/archetypes'
import { ALL_GOALS } from '../data/goals'
import { STARTING_STATE } from '../data/startingState'
import { useGameStore } from '../state/gameStore'
import { ArchetypeSelectionScreen } from './ArchetypeSelectionScreen'
import { playCue, setAmbient, setMuted, stopAll } from './audio/audioBus'
import { CampaignTracker } from './CampaignTracker'
import { Badge } from './components/Badge'
import { Banner } from './components/Banner'
// Atoms
import { Button } from './components/Button'
import { Pill } from './components/Pill'
import { RainLayer } from './components/RainLayer'
import { Stat } from './components/Stat'
import { Surface } from './components/Surface'
import { Tab } from './components/Tab'
import { Heading, Kicker, Prose } from './components/Typography'
import { DeputySelectionScreen } from './DeputySelectionScreen'
import { SituationCtx } from './design/ThemeProvider'
import type { Situation } from './design/tokens'
import { useReducedMotion } from './design/useReducedMotion'
import { DeskScene } from './desk/DeskScene'
import { ElectionWatermark } from './ElectionWatermark'
import { GoalSelectionScreen } from './GoalSelectionScreen'
import { GoalTracker } from './GoalTracker'
import { DiagnosisBanner as GameDiagnosisBanner } from './game/DiagnosisBanner'
import { StateOfTheState as GameStateOfTheState } from './game/StateOfTheState'
import { GoalJourneyTab } from './goals/GoalJourneyTab'
import { HandoverNotesModal } from './HandoverNotesModal'
// Overlays
import { HelpReference } from './HelpReference'
import { Inbox } from './Inbox'
import { LagosHerald } from './LagosHerald'
import { LagosSkyline } from './LagosSkyline'
import { PodcastCard } from './PodcastCard'
import { ProjectsPanel } from './ProjectsPanel'
import { CastGallery } from './portraits/CastGallery'
import { ResearchTree } from './ResearchTree'
import { ResearchTab } from './research/ResearchTab'
import { SocialPost } from './SocialPost'
import { SealsTab } from './seals/SealsTab'
import { ShareLabPanel } from './share/ShareLabPanel'
// ─── Tab sections ───────────────────────────────────────────────────────────
import { FIXTURE_ARTICLES, FIXTURE_INBOX } from './styleLab/fixtures'
// Media formats
import { ViralClip } from './ViralClip'
import { WelcomeModal } from './WelcomeModal'
// Onboarding screens
import { WelcomeScreen } from './WelcomeScreen'
import { WhatsAppChain } from './WhatsAppChain'

// ─── CSS overrides for fixed-position components in non-Core tabs ────────────
const FIXED_OVERRIDE_CSS = `
.sl-tab-section .fixed { position: relative !important; inset: auto !important; z-index: auto !important; }
.sl-tab-section .z-50 { z-index: auto !important; }
.sl-tab-section .z-100 { z-index: auto !important; }
.sl-tab-section [style*="position: fixed"] { position: relative !important; }
.sl-tab-section [style*="zIndex: 50"] { z-index: auto !important; }
.sl-tab-section [style*="zIndex: 100"] { z-index: auto !important; }
.sl-tab-section [style*="zIndex: 200"] { z-index: auto !important; }
`

// ─── Types ────────────────────────────────────────────────────────────────────
type GameState = 'calm' | 'election' | 'crisis' | 'storm'
type Variant = 'clean' | 'bold' | 'atmospheric'
type TabId = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

interface Theme {
  bg: string
  bgGrad: string
  bgCard: string
  surface: string
  surface2: string
  accent: string
  accent2: string
  accentMuted: string
  text: string
  text2: string
  textFaint: string
  border: string
  borderStrong: string
  danger: string
  dangerMuted: string
  warning: string
  warningMuted: string
  success: string
  isDark: boolean
  dur: string
  // variant
  radius: string
  shadow: string
  shadowHover: string
  fontHead: string
  fontBody: string
  fontUI: string
  pad: string
  bw: string
}

// ─── Injected CSS (keyframes, helpers) ───────────────────────────────────────
const SL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Space+Grotesk:wght@400;500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

/* Rain */
@keyframes rainfall{
  0%  {transform:translateY(-80px) translateX(0);opacity:0}
  8%  {opacity:1}
  92% {opacity:.65}
  100%{transform:translateY(110vh) translateX(-110px);opacity:0}
}
.sl-rain{position:fixed;inset:0;z-index:15;pointer-events:none;overflow:hidden}
.sl-drop{position:absolute;top:0;background:linear-gradient(to bottom,transparent,rgba(110,165,230,.5));border-radius:1px;animation:rainfall linear infinite}

/* Blackout flash */
@keyframes bko{0%{opacity:.9}100%{opacity:0}}
.sl-bko{position:fixed;inset:0;z-index:60;pointer-events:none;background:#050810;animation:bko .2s ease forwards}

/* Diagnosis banner */
@keyframes banner-in{0%{transform:translateY(-110%);opacity:0}100%{transform:translateY(0);opacity:1}}
.sl-banner-enter{animation:banner-in .5s cubic-bezier(.16,1,.3,1) forwards}

/* Choice commit */
@keyframes commit{0%{transform:scale(1)}35%{transform:scale(.96)}100%{transform:scale(1)}}
.sl-commit{animation:commit .28s cubic-bezier(.4,0,.2,1) forwards}

/* Consequence appear */
@keyframes cq-in{0%{opacity:0;transform:translateY(8px)}100%{opacity:1;transform:translateY(0)}}
.sl-cq{animation:cq-in .3s .26s ease both}

/* Stat warning pulse */
@keyframes st-warn{0%,100%{opacity:1}50%{opacity:.38}}
.sl-warn{animation:st-warn 1s ease-in-out 3}

/* Ambient shimmer for calm (very subtle) */
@keyframes shimmer{0%,100%{opacity:0}50%{opacity:1}}
.sl-shimmer{pointer-events:none;animation:shimmer 6s ease-in-out infinite}

/* Campaign heat — election border-top pulse */
@keyframes campaign{0%{border-top-color:rgba(200,32,32,.5)}50%{border-top-color:rgba(26,122,60,.5)}100%{border-top-color:rgba(200,32,32,.5)}}
.sl-campaign{animation:campaign 3.5s ease-in-out infinite}

/* Grain for atmospheric variant */
.sl-grain{position:relative;isolation:isolate}
.sl-grain>*{position:relative;z-index:1}
.sl-grain::before{
  content:'';position:absolute;inset:0;border-radius:inherit;z-index:0;pointer-events:none;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.65' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
  background-size:200px 200px;mix-blend-mode:soft-light;opacity:.055;
}

/* Choice hover */
.sl-choice{cursor:pointer;transition:transform .15s ease,box-shadow .15s ease}
.sl-choice:hover{transform:translateY(-2px)}

/* Scrollbar */
.sl-scroll::-webkit-scrollbar{width:5px}
.sl-scroll::-webkit-scrollbar-track{background:transparent}
.sl-scroll::-webkit-scrollbar-thumb{background:rgba(128,128,128,.22);border-radius:3px}
`

// ─── Palette: 4 states ────────────────────────────────────────────────────────
type PC = Omit<
  Theme,
  'radius' | 'shadow' | 'shadowHover' | 'fontHead' | 'fontBody' | 'fontUI' | 'pad' | 'bw'
>
const P: Record<GameState, PC> = {
  calm: {
    bg: '#EDF5F8',
    bgGrad: 'linear-gradient(158deg,#EBF5F8 0%,#E4F2EA 100%)',
    bgCard: 'radial-gradient(ellipse at 18% 0%,rgba(26,155,142,.07) 0%,transparent 55%)',
    surface: '#FFFFFF',
    surface2: '#F1F8FC',
    accent: '#1A9B8E',
    accent2: '#3B9FE0',
    accentMuted: 'rgba(26,155,142,.12)',
    text: '#13201E',
    text2: '#456064',
    textFaint: '#88A4AE',
    border: 'rgba(26,155,142,.18)',
    borderStrong: 'rgba(26,155,142,.42)',
    danger: '#C4301A',
    dangerMuted: 'rgba(196,48,26,.1)',
    warning: '#C08C0C',
    warningMuted: 'rgba(192,140,12,.12)',
    success: '#3AA048',
    isDark: false,
    dur: '900ms',
  },
  election: {
    bg: '#F6EDFD',
    bgGrad: 'linear-gradient(158deg,#F6EDFD 0%,#FBF0EF 100%)',
    bgCard: 'radial-gradient(ellipse at 18% 0%,rgba(200,32,32,.06) 0%,transparent 50%)',
    surface: '#FFFEF5',
    surface2: '#F2E8FC',
    accent: '#C82020',
    accent2: '#1A7A3C',
    accentMuted: 'rgba(200,32,32,.11)',
    text: '#190820',
    text2: '#583060',
    textFaint: '#9068A8',
    border: 'rgba(200,32,32,.2)',
    borderStrong: 'rgba(200,32,32,.48)',
    danger: '#C82020',
    dangerMuted: 'rgba(200,32,32,.1)',
    warning: '#C08C0C',
    warningMuted: 'rgba(192,140,12,.12)',
    success: '#1A7A3C',
    isDark: false,
    dur: '900ms',
  },
  crisis: {
    bg: '#FFF2EE',
    bgGrad: 'linear-gradient(158deg,#FFF2EE 0%,#FFFCE8 100%)',
    bgCard: 'radial-gradient(ellipse at 18% 0%,rgba(215,50,42,.08) 0%,transparent 50%)',
    surface: '#FFFFFF',
    surface2: '#FFECE6',
    accent: '#D7322A',
    accent2: '#E8B800',
    accentMuted: 'rgba(215,50,42,.1)',
    text: '#1C0808',
    text2: '#683830',
    textFaint: '#A86C60',
    border: 'rgba(215,50,42,.2)',
    borderStrong: 'rgba(215,50,42,.5)',
    danger: '#D7322A',
    dangerMuted: 'rgba(215,50,42,.1)',
    warning: '#E8B800',
    warningMuted: 'rgba(232,184,0,.15)',
    success: '#3AA048',
    isDark: false,
    dur: '900ms',
  },
  storm: {
    bg: '#0C1720',
    bgGrad: 'linear-gradient(158deg,#0C1720 0%,#091428 100%)',
    bgCard: 'radial-gradient(ellipse at 30% 0%,rgba(80,130,180,.14) 0%,transparent 55%)',
    surface: '#101C28',
    surface2: '#162333',
    accent: '#5899D2',
    accent2: '#3A6EA0',
    accentMuted: 'rgba(88,153,210,.15)',
    text: '#BDD0E0',
    text2: '#7490A0',
    textFaint: '#456070',
    border: 'rgba(88,153,210,.22)',
    borderStrong: 'rgba(88,153,210,.48)',
    danger: '#E06050',
    dangerMuted: 'rgba(224,96,80,.15)',
    warning: '#D4A820',
    warningMuted: 'rgba(212,168,32,.15)',
    success: '#4A9E58',
    isDark: true,
    dur: '240ms',
  },
}

// ─── Variant styles: 3 executions ────────────────────────────────────────────
type VC = Pick<
  Theme,
  'radius' | 'shadow' | 'shadowHover' | 'fontHead' | 'fontBody' | 'fontUI' | 'pad' | 'bw'
>
const V: Record<Variant, VC> = {
  clean: {
    radius: '8px',
    shadow: '0 1px 3px rgba(0,0,0,.05),0 4px 18px rgba(0,0,0,.05)',
    shadowHover: '0 6px 28px rgba(0,0,0,.09)',
    fontHead: "'Playfair Display',Georgia,'Times New Roman',serif",
    fontBody: "Georgia,'Times New Roman',serif",
    fontUI: "'Archivo Narrow','Helvetica Neue',Arial,sans-serif",
    pad: '28px',
    bw: '1px',
  },
  bold: {
    radius: '2px',
    shadow: '0 1px 4px rgba(0,0,0,.1)',
    shadowHover: '0 3px 10px rgba(0,0,0,.14)',
    fontHead: "'Space Grotesk','Helvetica Neue',Arial,sans-serif",
    fontBody: "'Archivo Narrow','Helvetica Neue',Arial,sans-serif",
    fontUI: "'Archivo Narrow','Helvetica Neue',Arial,sans-serif",
    pad: '18px',
    bw: '2px',
  },
  atmospheric: {
    radius: '6px',
    shadow: '0 1px 2px rgba(0,0,0,.04),0 4px 14px rgba(0,0,0,.06),0 14px 52px rgba(0,0,0,.07)',
    shadowHover: '0 6px 24px rgba(0,0,0,.1),0 24px 72px rgba(0,0,0,.09)',
    fontHead: "'Playfair Display',Georgia,'Times New Roman',serif",
    fontBody: "Georgia,'Times New Roman',serif",
    fontUI: "'Archivo Narrow','Helvetica Neue',Arial,sans-serif",
    pad: '32px',
    bw: '1px',
  },
}

function mkTheme(s: GameState, v: Variant): Theme {
  return { ...P[s], ...V[v] }
}

// ─── Stats per state ──────────────────────────────────────────────────────────
const STATS: Record<GameState, [number, number, number, number]> = {
  calm: [24.8, 67, 45, 51],
  election: [21.4, 58, 32, 47],
  crisis: [17.8, 40, 22, 33],
  storm: [13.2, 35, 16, 28],
}

// Sound is owned by the shared audioBus module (Web Audio, no libs). Style Lab is
// where we prototype and tune it before wiring into the game — playCue for stings,
// setAmbient for the per-situation bed, setMuted driven by the sound toggle.

// ─── Number count-up hook ────────────────────────────────────────────────────
function useCountTo(target: number, dur = 750) {
  const [v, setV] = useState(target)
  const prev = useRef(target)
  const raf = useRef(0)
  useEffect(() => {
    if (prev.current === target) return
    const from = prev.current
    const t0 = performance.now()
    function step(t: number) {
      const p = Math.min((t - t0) / dur, 1)
      const e = 1 - (1 - p) ** 3
      setV(from + (target - from) * e)
      if (p < 1) raf.current = requestAnimationFrame(step)
      else {
        prev.current = target
        setV(target)
      }
    }
    raf.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf.current)
  }, [target, dur])
  return v
}

// ─── Rain ─────────────────────────────────────────────────────────────────────
const DROPS = Array.from({ length: 65 }, (_, i) => ({
  id: i,
  left: Math.random() * 115 - 8,
  height: 13 + Math.random() * 24,
  dur: 0.5 + Math.random() * 0.55,
  delay: -(Math.random() * 2.8),
  opacity: 0.2 + Math.random() * 0.45,
  width: Math.random() < 0.2 ? 1.5 : 1,
}))
function Rain() {
  return (
    <div className="sl-rain">
      {DROPS.map((d) => (
        <div
          key={d.id}
          className="sl-drop"
          style={{
            left: `${d.left}%`,
            height: `${d.height}px`,
            width: `${d.width}px`,
            opacity: d.opacity,
            animationDuration: `${d.dur}s`,
            animationDelay: `${d.delay}s`,
          }}
        />
      ))}
    </div>
  )
}

// ─── Transition shorthand ─────────────────────────────────────────────────────
function tr(t: Theme) {
  return `background-color ${t.dur} ease,color ${t.dur} ease,border-color ${t.dur} ease,box-shadow ${t.dur} ease,opacity ${t.dur} ease`
}

// ─── Grain class helper ───────────────────────────────────────────────────────
function gr(v: Variant) {
  return v === 'atmospheric' ? 'sl-grain' : ''
}

// ─── Card surface helper (atmospheric gets gradient) ──────────────────────────
function cardSurface(t: Theme, v: Variant): string {
  return v === 'atmospheric' ? `${t.bgCard}, ${t.surface}` : t.surface
}

// ─── 1. STATUS BAR ───────────────────────────────────────────────────────────
function StatusBar({
  theme,
  variant,
  state,
}: {
  theme: Theme
  variant: Variant
  state: GameState
}) {
  const [tr0, tr1, tr2, tr3] = STATS[state]
  const treasury = useCountTo(tr0)
  const trust = useCountTo(tr1)
  const pc = useCountTo(tr2)
  const approval = useCountTo(tr3)

  const warnTreasury = tr0 < 20
  const warnPC = tr2 < 28
  const warnTrust = tr1 < 45
  const warnApproval = tr3 < 38

  const labelStyle: React.CSSProperties = {
    fontFamily: theme.fontUI,
    fontSize: '9px',
    textTransform: 'uppercase',
    letterSpacing: '0.13em',
    color: theme.textFaint,
    marginBottom: '2px',
    transition: tr(theme),
  }

  const statBlock = (
    label: string,
    _raw: number,
    display: string,
    warn: boolean,
    _decimals = 0,
  ) => (
    <div key={label} style={{ textAlign: 'right' }}>
      <div style={labelStyle}>{label}</div>
      <div
        className={warn ? 'sl-warn' : ''}
        style={{
          fontFamily: variant === 'bold' ? theme.fontHead : theme.fontUI,
          fontSize: variant === 'bold' ? '24px' : '22px',
          fontWeight: variant === 'bold' ? 700 : 600,
          lineHeight: 1,
          color: warn ? theme.danger : theme.text,
          transition: tr(theme),
          letterSpacing: variant === 'bold' ? '.01em' : '0',
        }}
      >
        {display}
      </div>
      {warn && (
        <div
          style={{
            fontFamily: theme.fontUI,
            fontSize: '9px',
            color: theme.danger,
            marginTop: '1px',
            transition: tr(theme),
          }}
        >
          ⚠ low
        </div>
      )}
    </div>
  )

  return (
    <div
      className={`${gr(variant)} ${state === 'election' ? 'sl-campaign' : ''}`}
      style={{
        background:
          variant === 'atmospheric'
            ? `linear-gradient(180deg, ${theme.surface2} 0%, ${theme.surface} 100%)`
            : theme.surface,
        borderBottom: `${theme.bw} solid ${theme.border}`,
        borderTop: `3px solid ${theme.accent}`,
        padding: `10px ${theme.pad}`,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '24px',
        boxShadow: variant === 'atmospheric' ? `0 1px 12px rgba(0,0,0,.07)` : theme.shadow,
        position: 'relative',
        transition: tr(theme),
      }}
    >
      {/* Calm shimmer */}
      {variant === 'atmospheric' && state === 'calm' && (
        <div
          className="sl-shimmer"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            background:
              'linear-gradient(90deg, transparent 0%, rgba(26,155,142,.04) 50%, transparent 100%)',
            pointerEvents: 'none',
          }}
        />
      )}

      <div style={{ marginRight: 'auto' }}>
        <div
          style={{
            fontFamily: theme.fontUI,
            fontSize: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            color: theme.textFaint,
            transition: tr(theme),
          }}
        >
          Year II · Week 34 · Term I
        </div>
        <div
          style={{
            fontFamily: theme.fontHead,
            fontSize: variant === 'bold' ? '13px' : '12px',
            color: theme.text2,
            marginTop: '2px',
            fontWeight: variant === 'bold' ? 600 : 400,
            transition: tr(theme),
          }}
        >
          Lagos State Government
        </div>
      </div>

      {statBlock('Treasury', tr0, `₦${treasury.toFixed(1)}B`, warnTreasury)}
      {statBlock('Public Trust', tr1, `${Math.round(trust)}%`, warnTrust)}
      {statBlock('Pol. Capital', tr2, `${Math.round(pc)}`, warnPC)}
      {statBlock('Approval', tr3, `${Math.round(approval)}%`, warnApproval)}
    </div>
  )
}

// ─── 2. DIAGNOSIS BANNER (lab mock) ──────────────────────────────────────────
function DiagnosisBanner({ theme, variant }: { theme: Theme; variant: Variant }) {
  return (
    <div
      className={`sl-banner-enter ${gr(variant)}`}
      style={{
        background: variant === 'bold' ? theme.dangerMuted : `${theme.dangerMuted}`,
        borderLeft: `${parseInt(theme.bw, 10) > 1 ? '4px' : '3px'} solid ${theme.danger}`,
        borderBottom: `${theme.bw} solid rgba(${theme.isDark ? '224,96,80' : '215,50,42'},.18)`,
        padding: `12px ${theme.pad}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '20px',
        transition: tr(theme),
      }}
    >
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontFamily: theme.fontUI,
            fontSize: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            color: theme.danger,
            marginBottom: '5px',
            fontWeight: 600,
            transition: tr(theme),
          }}
        >
          ⚠&nbsp;&nbsp;Fiscal Crisis — Week 27 Alert
        </div>
        <p
          style={{
            fontFamily: variant === 'bold' ? theme.fontBody : theme.fontBody,
            fontSize: variant === 'bold' ? '13px' : '14px',
            fontStyle: variant === 'bold' ? 'normal' : 'italic',
            lineHeight: 1.55,
            color: theme.text,
            transition: tr(theme),
          }}
        >
          Overheads are bleeding you — ₦19.5B/week, 57% of spend, uncontrolled. At this rate, the
          treasury hits zero in 6 weeks. Intervention required now.
        </p>
      </div>
      <button
        type="button"
        style={{
          fontFamily: theme.fontUI,
          fontSize: '10px',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          fontWeight: 600,
          color: theme.danger,
          background: `rgba(${theme.isDark ? '224,96,80' : '215,50,42'},.1)`,
          border: `${theme.bw} solid rgba(${theme.isDark ? '224,96,80' : '215,50,42'},.35)`,
          borderRadius: theme.radius,
          padding: '8px 14px',
          cursor: 'pointer',
          flexShrink: 0,
          whiteSpace: 'nowrap',
          transition: tr(theme),
        }}
      >
        Review Budget →
      </button>
    </div>
  )
}

// ─── 3. EVENT CARD ───────────────────────────────────────────────────────────
const CHOICES = [
  {
    id: 'address',
    label: 'Address the protesters in person',
    fx: '+Trust +15 · −PC 5',
    fxC: 'success',
  },
  {
    id: 'delegate',
    label: 'Delegate response to Deputy Governor',
    fx: '+Trust 3 · −PC 2',
    fxC: 'neutral',
  },
  { id: 'disperse', label: 'Order security dispersal', fx: '−Trust 20 · ⚠ unrest', fxC: 'danger' },
]

function EventCard({
  theme,
  variant,
  onCommit,
}: {
  theme: Theme
  variant: Variant
  onCommit: () => void
}) {
  const [committed, setCommitted] = useState<number | null>(null)
  const [showCq, setShowCq] = useState(false)

  function handleChoice(i: number) {
    if (committed !== null) return
    setCommitted(i)
    playCue('commit')
    setTimeout(() => setShowCq(true), 300)
    setTimeout(() => {
      setCommitted(null)
      setShowCq(false)
      onCommit()
    }, 2800)
  }

  const titleSize = variant === 'bold' ? '26px' : variant === 'clean' ? '30px' : '29px'
  const titleWeight = variant === 'bold' ? 700 : 400

  return (
    <div
      className={gr(variant)}
      style={{
        background: cardSurface(theme, variant),
        borderRadius: theme.radius,
        border: `${theme.bw} solid ${theme.border}`,
        boxShadow: theme.shadow,
        padding: theme.pad,
        position: 'relative',
        overflow: 'hidden',
        transition: tr(theme),
      }}
    >
      {/* Accent rule at top (the Federal Gazette signature move, adapted) */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: theme.accent,
          transition: tr(theme),
        }}
      />

      {/* Atmospheric: faint light-leak top-right */}
      {variant === 'atmospheric' && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '40%',
            height: '60%',
            background: `radial-gradient(ellipse at 100% 0%, ${theme.accentMuted} 0%, transparent 70%)`,
            pointerEvents: 'none',
            transition: tr(theme),
          }}
        />
      )}

      {/* Kicker */}
      <p
        style={{
          fontFamily: theme.fontUI,
          fontSize: '10px',
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
          color: theme.textFaint,
          marginBottom: '10px',
          transition: tr(theme),
        }}
      >
        Infrastructure Crisis · Week 34
      </p>

      {/* Title */}
      <h2
        style={{
          fontFamily: theme.fontHead,
          fontSize: titleSize,
          fontWeight: titleWeight,
          lineHeight: variant === 'bold' ? 1.12 : 1.28,
          color: theme.text,
          marginBottom: '16px',
          transition: tr(theme),
          letterSpacing: variant === 'bold' ? '.01em' : '0',
        }}
      >
        Eko Bridge Protesters Block Morning Traffic
      </h2>

      {/* Divider — atmospheric gets ornamental rule */}
      {variant === 'atmospheric' ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '16px',
            color: theme.textFaint,
          }}
        >
          <div
            style={{
              flex: 1,
              height: '1px',
              background: `linear-gradient(90deg, transparent, ${theme.border})`,
            }}
          />
          <span style={{ fontSize: '10px', letterSpacing: '0.2em' }}>✦</span>
          <div
            style={{
              flex: 1,
              height: '1px',
              background: `linear-gradient(90deg, ${theme.border}, transparent)`,
            }}
          />
        </div>
      ) : (
        <div
          style={{
            height: '1px',
            background: theme.border,
            marginBottom: '16px',
            transition: tr(theme),
          }}
        />
      )}

      {/* Body */}
      <p
        style={{
          fontFamily: theme.fontBody,
          fontSize: variant === 'bold' ? '14px' : '15px',
          lineHeight: variant === 'bold' ? 1.55 : 1.78,
          color: theme.text2,
          marginBottom: '24px',
          fontStyle: variant === 'bold' ? 'normal' : 'italic',
          transition: tr(theme),
        }}
      >
        Several hundred residents have blockaded the Carter Bridge approach since dawn, demanding
        immediate structural repairs. The LASEMA estimates repair cost at ₦4.2B over eighteen
        months. Your Deputy Chief of Staff notes that an election is eighteen months away and urges
        visible, decisive action before public opinion hardens.
      </p>

      {/* Consequence overlay */}
      {showCq && (
        <div
          className="sl-cq"
          style={{
            background: theme.accentMuted,
            border: `${theme.bw} solid ${theme.accent}`,
            borderRadius: theme.radius,
            padding: '14px 18px',
            marginBottom: '16px',
            fontFamily: theme.fontUI,
            fontSize: '12px',
            color: theme.text,
            transition: tr(theme),
          }}
        >
          <span style={{ color: theme.accent, fontWeight: 600 }}>Choice registered.</span>{' '}
          Consequence resolved next week. The city is watching.
        </div>
      )}

      {/* Choices */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {CHOICES.map((c, i) => {
          const isChosen = committed === i
          const isOther = committed !== null && committed !== i
          const fxColor =
            c.fxC === 'success' ? theme.success : c.fxC === 'danger' ? theme.danger : theme.text2
          return (
            <button
              type="button"
              key={c.id}
              className={`sl-choice ${isChosen ? 'sl-commit' : ''}`}
              onClick={() => handleChoice(i)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: variant === 'bold' ? '11px 14px' : '12px 16px',
                borderRadius: theme.radius,
                border: `${theme.bw} solid ${isChosen ? theme.accent : i === 0 ? theme.borderStrong : theme.border}`,
                background: isChosen
                  ? theme.accentMuted
                  : variant === 'atmospheric' && i === 0
                    ? `${theme.accentMuted}`
                    : 'transparent',
                opacity: isOther ? 0.42 : 1,
                gap: '16px',
                transition:
                  'transform .15s ease,box-shadow .15s ease,opacity .25s ease,background-color .15s ease,border-color .15s ease',
                cursor: committed !== null ? 'default' : 'pointer',
              }}
            >
              <span
                style={{
                  fontFamily: variant === 'bold' ? theme.fontHead : theme.fontBody,
                  fontSize: '14px',
                  fontWeight: variant === 'bold' ? 600 : 400,
                  color: i === 0 ? theme.text : theme.text2,
                  lineHeight: 1.3,
                  fontStyle: variant === 'bold' ? 'normal' : i > 0 ? 'italic' : 'normal',
                  transition: tr(theme),
                }}
              >
                {c.label}
              </span>
              <span
                style={{
                  fontFamily: theme.fontUI,
                  fontSize: '10px',
                  color: fxColor,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  transition: tr(theme),
                }}
              >
                {c.fx}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── 4. NAVIGATION DOCK ──────────────────────────────────────────────────────
const DOCK = [
  { id: 'inbox', label: 'Inbox', badge: 3 },
  { id: 'economy', label: 'Economy' },
  { id: 'research', label: 'Research' },
  { id: 'factions', label: 'Factions' },
  { id: 'reports', label: 'Reports' },
]

function NavDock({ theme, variant, state }: { theme: Theme; variant: Variant; state: GameState }) {
  const [active, setActive] = useState('inbox')

  return (
    <div
      className={gr(variant)}
      style={{
        background:
          variant === 'atmospheric'
            ? `linear-gradient(180deg, ${theme.surface} 0%, ${theme.surface2} 100%)`
            : theme.surface,
        borderTop: `${theme.bw} solid ${theme.border}`,
        boxShadow:
          variant === 'atmospheric' ? `0 -2px 20px rgba(0,0,0,.08)` : `0 -1px 4px rgba(0,0,0,.06)`,
        display: 'flex',
        transition: tr(theme),
      }}
    >
      {DOCK.map((tab, i) => {
        const isActive = active === tab.id
        return (
          <button
            type="button"
            key={tab.id}
            onClick={() => setActive(tab.id)}
            style={{
              flex: 1,
              padding: '12px 8px',
              border: 'none',
              borderRight: i < DOCK.length - 1 ? `1px solid ${theme.border}` : 'none',
              borderTop: isActive ? `2px solid ${theme.accent}` : `2px solid transparent`,
              background: isActive ? theme.accentMuted : 'transparent',
              cursor: 'pointer',
              position: 'relative',
              fontFamily: theme.fontUI,
              fontSize: variant === 'bold' ? '11px' : '10px',
              fontWeight: variant === 'bold' ? 600 : 400,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: isActive ? theme.accent : theme.text2,
              transition: `background-color .2s ease, color .2s ease, border-top-color .2s ease`,
            }}
          >
            {tab.label}
            {tab.badge != null && (
              <span
                style={{
                  position: 'absolute',
                  top: '7px',
                  right: i === 0 ? '12px' : '8px',
                  background: state === 'storm' ? theme.warning : theme.danger,
                  color: theme.isDark ? '#111' : '#fff',
                  fontFamily: 'sans-serif',
                  fontSize: '8px',
                  fontWeight: 700,
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: tr(theme),
                }}
              >
                {tab.badge}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ─── 5. STATE SEAL ───────────────────────────────────────────────────────────
function StateSeal({ theme, variant }: { theme: Theme; variant: Variant }) {
  const size = variant === 'atmospheric' ? 160 : 140
  const glow =
    variant === 'atmospheric'
      ? `0 0 0 6px ${theme.accentMuted}, 0 0 0 9px rgba(0,0,0,.04), 0 8px 32px rgba(0,0,0,.12)`
      : theme.shadow

  return (
    <div
      style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '32px 0' }}
    >
      <div
        className={gr(variant)}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          border: `${parseInt(theme.bw, 10) > 1 ? '3px' : '2px'} solid ${theme.borderStrong}`,
          boxShadow: glow,
          background:
            variant === 'atmospheric'
              ? `radial-gradient(circle at 50% 35%, ${theme.accentMuted} 0%, transparent 65%), ${theme.surface}`
              : theme.surface,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: '4px',
          padding: '20px',
          transition: tr(theme),
        }}
      >
        <div
          style={{
            fontSize: '9px',
            color: theme.borderStrong,
            letterSpacing: '0.22em',
            lineHeight: 1,
            transition: tr(theme),
          }}
        >
          ✦&nbsp;&nbsp;✦&nbsp;&nbsp;✦
        </div>
        <div
          style={{
            width: '65%',
            height: '1px',
            background: `linear-gradient(90deg, transparent, ${theme.borderStrong}, transparent)`,
            transition: tr(theme),
          }}
        />
        <div
          style={{
            fontFamily: theme.fontUI,
            fontSize: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            color: theme.textFaint,
            lineHeight: 1.4,
            transition: tr(theme),
          }}
        >
          Government of
        </div>
        <div
          style={{
            fontFamily: theme.fontHead,
            fontSize: variant === 'bold' ? '15px' : '14px',
            fontWeight: variant === 'bold' ? 700 : 600,
            color: theme.accent,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            lineHeight: 1.1,
            transition: tr(theme),
          }}
        >
          Lagos State
        </div>
        <div
          style={{
            fontSize: variant === 'atmospheric' ? '24px' : '20px',
            color: theme.accent,
            lineHeight: 1,
            filter:
              variant === 'atmospheric' ? `drop-shadow(0 0 5px ${theme.accentMuted})` : 'none',
            transition: tr(theme),
          }}
        >
          ⚜
        </div>
        <div
          style={{
            fontFamily: theme.fontUI,
            fontSize: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            color: theme.textFaint,
            fontStyle: 'italic',
            transition: tr(theme),
          }}
        >
          Est. MCMLXVII
        </div>
        <div
          style={{
            width: '65%',
            height: '1px',
            background: `linear-gradient(90deg, transparent, ${theme.borderStrong}, transparent)`,
            transition: tr(theme),
          }}
        />
        <div
          style={{
            fontSize: '9px',
            color: theme.borderStrong,
            letterSpacing: '0.22em',
            lineHeight: 1,
            transition: tr(theme),
          }}
        >
          ✦&nbsp;&nbsp;✦&nbsp;&nbsp;✦
        </div>
      </div>
    </div>
  )
}

// ─── Lab Chrome (header + switchers) ─────────────────────────────────────────
const STATE_META: Record<GameState, { label: string; sub: string; color: string }> = {
  calm: { label: 'Calm', sub: 'Coastal ordinary — lagoon-teal & sky', color: '#1A9B8E' },
  election: {
    label: 'Election',
    sub: 'Campaign heat — political energy charges air',
    color: '#C82020',
  },
  crisis: {
    label: 'Crisis',
    sub: 'Danfo-yellow & blood-red — city under pressure',
    color: '#D7322A',
  },
  storm: { label: 'Storm', sub: 'Blackout + flood — the earned dark moment', color: '#5899D2' },
}
const VARIANT_META: Record<Variant, { label: string; sub: string }> = {
  clean: { label: 'Clean', sub: 'Light, restrained, legible' },
  bold: { label: 'Bold', sub: 'Stronger type, saturated, confident' },
  atmospheric: { label: 'Atmospheric', sub: 'Depth, gradient light, grain' },
}

function LabChrome({
  gameState,
  variant,
  soundOn,
  onState,
  onVariant,
  onSound,
}: {
  gameState: GameState
  variant: Variant
  soundOn: boolean
  onState: (s: GameState) => void
  onVariant: (v: Variant) => void
  onSound: (b: boolean) => void
}) {
  const chromeBg = gameState === 'storm' ? '#0A1220' : '#FFFFFF'
  const chromeText = gameState === 'storm' ? 'rgba(200,220,240,.6)' : 'rgba(15,32,30,.45)'
  const chromeBorder = gameState === 'storm' ? 'rgba(88,153,210,.15)' : 'rgba(0,0,0,.1)'

  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        background: chromeBg,
        borderBottom: `1px solid ${chromeBorder}`,
        padding: '10px 20px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'center',
        transition: `background-color 600ms ease, border-color 600ms ease`,
      }}
    >
      {/* Title */}
      <div style={{ marginRight: 'auto' }}>
        <div
          style={{
            fontFamily: "'Archivo Narrow', sans-serif",
            fontSize: '9px',
            textTransform: 'uppercase',
            letterSpacing: '0.18em',
            color: chromeText,
            transition: 'color 600ms ease',
          }}
        >
          Lagos Governor Sim
        </div>
        <div
          style={{
            fontFamily: "'Archivo Narrow', sans-serif",
            fontSize: '12px',
            fontWeight: 600,
            color: gameState === 'storm' ? 'rgba(200,220,240,.8)' : 'rgba(15,32,30,.7)',
            transition: 'color 600ms ease',
          }}
        >
          Style Lab — Art Direction Sandbox
        </div>
      </div>

      {/* State switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span
          style={{
            fontFamily: "'Archivo Narrow', sans-serif",
            fontSize: '9px',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: chromeText,
            marginRight: '2px',
            transition: 'color 600ms ease',
          }}
        >
          Mood
        </span>
        {(['calm', 'election', 'crisis', 'storm'] as GameState[]).map((s) => {
          const m = STATE_META[s]
          const isActive = gameState === s
          return (
            <button
              type="button"
              key={s}
              onClick={() => onState(s)}
              style={{
                padding: '5px 12px',
                fontFamily: "'Archivo Narrow', sans-serif",
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                border: `1px solid ${isActive ? m.color : 'rgba(128,128,128,.25)'}`,
                borderRadius: '3px',
                background: isActive ? `${m.color}15` : 'transparent',
                color: isActive ? m.color : chromeText,
                cursor: 'pointer',
                transition: 'all .2s ease',
              }}
            >
              {m.label}
            </button>
          )
        })}
      </div>

      <div style={{ width: '1px', height: '24px', background: chromeBorder }} />

      {/* Variant switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span
          style={{
            fontFamily: "'Archivo Narrow', sans-serif",
            fontSize: '9px',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: chromeText,
            marginRight: '2px',
            transition: 'color 600ms ease',
          }}
        >
          Style
        </span>
        {(['clean', 'bold', 'atmospheric'] as Variant[]).map((v) => {
          const isActive = variant === v
          return (
            <button
              type="button"
              key={v}
              onClick={() => onVariant(v)}
              style={{
                padding: '5px 10px',
                fontFamily: "'Archivo Narrow', sans-serif",
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                border: `1px solid ${isActive ? (gameState === 'storm' ? '#5899D2' : '#1A9B8E') : 'rgba(128,128,128,.25)'}`,
                borderRadius: '3px',
                background: isActive
                  ? gameState === 'storm'
                    ? 'rgba(88,153,210,.12)'
                    : 'rgba(26,155,142,.1)'
                  : 'transparent',
                color: isActive ? (gameState === 'storm' ? '#5899D2' : '#1A9B8E') : chromeText,
                cursor: 'pointer',
                transition: 'all .2s ease',
              }}
            >
              {VARIANT_META[v].label}
            </button>
          )
        })}
      </div>

      <div style={{ width: '1px', height: '24px', background: chromeBorder }} />

      {/* Sound toggle */}
      <button
        type="button"
        onClick={() => onSound(!soundOn)}
        style={{
          padding: '5px 10px',
          fontFamily: "'Archivo Narrow', sans-serif",
          fontSize: '10px',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          border: `1px solid ${soundOn ? '#1A9B8E' : 'rgba(128,128,128,.3)'}`,
          borderRadius: '3px',
          background: soundOn ? 'rgba(26,155,142,.1)' : 'transparent',
          color: soundOn ? '#1A9B8E' : chromeText,
          cursor: 'pointer',
          transition: 'all .2s ease',
        }}
      >
        {soundOn ? '🔊 Sound' : '🔇 Sound'}
      </button>

      {/* State description */}
      <div
        style={{
          width: '100%',
          fontFamily: "'Archivo Narrow', sans-serif",
          fontSize: '10px',
          color: chromeText,
          paddingTop: '2px',
          borderTop: `1px solid ${chromeBorder}`,
          transition: 'color 600ms ease, border-color 600ms ease',
        }}
      >
        <span style={{ color: STATE_META[gameState].color, fontWeight: 600, marginRight: '4px' }}>
          {STATE_META[gameState].label}:
        </span>
        {STATE_META[gameState].sub}
        <span style={{ marginLeft: '16px', opacity: 0.6 }}>
          · Variant: {VARIANT_META[variant].sub}
        </span>
      </div>
    </div>
  )
}

// ─── Tab Bar ──────────────────────────────────────────────────────────────────
const TABS: { id: TabId; label: string }[] = [
  { id: 0, label: 'Core' },
  { id: 1, label: 'Media' },
  { id: 2, label: 'Onboarding' },
  { id: 3, label: 'Overlays' },
  { id: 4, label: 'Atoms' },
  { id: 5, label: 'Desk' },
  { id: 6, label: 'Research' },
  { id: 7, label: 'Goals' },
  { id: 8, label: 'Seals' },
  { id: 9, label: 'Cast' },
  { id: 10, label: 'Share' },
]

function TabBar({ activeTab, onChange }: { activeTab: TabId; onChange: (id: TabId) => void }) {
  return (
    <div
      style={{
        display: 'flex',
        borderBottom: '1px solid var(--border, rgba(0,0,0,.1))',
        background: 'var(--surface, #fff)',
        position: 'sticky',
        top: 0,
        zIndex: 29,
      }}
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id
        return (
          <button
            type="button"
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              flex: 1,
              padding: '10px 16px',
              border: 'none',
              borderBottom: isActive
                ? '2px solid var(--accent-solid, #1A9B8E)'
                : '2px solid transparent',
              background: isActive ? 'rgba(26,155,142,.06)' : 'transparent',
              cursor: 'pointer',
              fontFamily: "'Archivo Narrow', sans-serif",
              fontSize: '11px',
              fontWeight: isActive ? 700 : 500,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: isActive ? '#1A9B8E' : 'rgba(15,32,30,.5)',
              transition: 'all .15s ease',
            }}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

// ─── Tab 1: Media ────────────────────────────────────────────────────────────
type ArticleCategory = 'fiscal' | 'political' | 'crisis' | 'milestone'

const CATEGORY_META: Record<ArticleCategory, { label: string; color: string }> = {
  fiscal: { label: 'Fiscal', color: '#1A9B8E' },
  political: { label: 'Political', color: '#7C3AED' },
  crisis: { label: 'Crisis', color: '#D7322A' },
  milestone: { label: 'Milestone', color: '#3AA048' },
}

function MediaTab({ theme }: { theme: Theme }) {
  const [category, setCategory] = useState<ArticleCategory>('fiscal')
  const article = FIXTURE_ARTICLES[category]
  const headline = useGameStore((s) => s.newspaperHeadline)

  // Hydrate store with article — re-apply if dismissed via close handler
  useEffect(() => {
    useGameStore.setState({
      ...STARTING_STATE,
      newspaperHeadline: article,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [article])

  useEffect(() => {
    if (!headline && article) {
      useGameStore.setState({ newspaperHeadline: article })
    }
  }, [headline, article])

  // Reset store on unmount
  useEffect(() => {
    return () => {
      useGameStore.setState(STARTING_STATE)
    }
  }, [])

  return (
    <div
      className="sl-tab-section"
      style={{ padding: '20px 24px', maxWidth: '900px', margin: '0 auto', width: '100%' }}
    >
      {/* Category picker */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {(['fiscal', 'political', 'crisis', 'milestone'] as ArticleCategory[]).map((cat) => {
          const isActive = category === cat
          const m = CATEGORY_META[cat]
          return (
            <button
              type="button"
              key={cat}
              onClick={() => setCategory(cat)}
              style={{
                padding: '5px 14px',
                fontFamily: "'Archivo Narrow', sans-serif",
                fontSize: '10px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                border: `1px solid ${isActive ? m.color : 'rgba(128,128,128,.25)'}`,
                borderRadius: '3px',
                background: isActive ? `${m.color}18` : 'transparent',
                color: isActive ? m.color : 'rgba(15,32,30,.55)',
                cursor: 'pointer',
                transition: 'all .15s ease',
              }}
            >
              {m.label}
            </button>
          )
        })}
      </div>

      {/* Format components — stacked vertically */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <div>
          <div
            className="label-caps"
            style={{ fontSize: '9px', color: theme.textFaint, marginBottom: '8px' }}
          >
            LagosHerald · {article.channelMeta?.channel}
          </div>
          <LagosHerald />
        </div>
        <div>
          <div
            className="label-caps"
            style={{ fontSize: '9px', color: theme.textFaint, marginBottom: '8px' }}
          >
            ViralClip · shortVideo
          </div>
          <ViralClip
            article={{
              ...article,
              channelMeta: { channel: 'shortVideo', views: 1400000, creatorHandle: '@Lagospedia' },
            }}
          />
        </div>
        <div>
          <div
            className="label-caps"
            style={{ fontSize: '9px', color: theme.textFaint, marginBottom: '8px' }}
          >
            SocialPost · tweet
          </div>
          <SocialPost
            article={{
              ...article,
              channelMeta: {
                channel: 'tweet',
                handle: '@LagosPunch',
                hashtag: '#LagosReports',
                retweets: 2340,
                likes: 8700,
              },
            }}
          />
        </div>
        <div>
          <div
            className="label-caps"
            style={{ fontSize: '9px', color: theme.textFaint, marginBottom: '8px' }}
          >
            PodcastCard · podcast
          </div>
          <PodcastCard
            article={{
              ...article,
              channelMeta: {
                channel: 'podcast',
                showName: 'Lagos Minute',
                hostName: 'Yetunde Bello',
                duration: '12:34',
                keyQuote: 'This changes everything for the lagoon economy.',
              },
            }}
          />
        </div>
        <div>
          <div
            className="label-caps"
            style={{ fontSize: '9px', color: theme.textFaint, marginBottom: '8px' }}
          >
            WhatsAppChain · whatsapp
          </div>
          <WhatsAppChain
            article={{
              ...article,
              channelMeta: {
                channel: 'whatsapp',
                forwardCount: 8400,
                isRumor: category === 'crisis',
              },
            }}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Tab 2: Onboarding ────────────────────────────────────────────────────────
function OnboardingTab() {
  const [archetype, setArchetype] = useState<ArchetypeKey>('technocrat')

  // Reset store on mount
  useEffect(() => {
    useGameStore.setState(STARTING_STATE)
    return () => {
      useGameStore.setState(STARTING_STATE)
    }
  }, [])

  return (
    <div
      className="sl-tab-section"
      style={{ padding: '20px 24px', maxWidth: '800px', margin: '0 auto', width: '100%' }}
    >
      {/* Archetype picker */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {(['technocrat', 'loyalist', 'outsider'] as ArchetypeKey[]).map((a) => {
          const isActive = archetype === a
          return (
            <button
              type="button"
              key={a}
              onClick={() => setArchetype(a)}
              style={{
                padding: '5px 14px',
                fontFamily: "'Archivo Narrow', sans-serif",
                fontSize: '10px',
                fontWeight: 600,
                textTransform: 'capitalize',
                letterSpacing: '0.08em',
                border: `1px solid ${isActive ? '#1A9B8E' : 'rgba(128,128,128,.25)'}`,
                borderRadius: '3px',
                background: isActive ? 'rgba(26,155,142,.12)' : 'transparent',
                color: isActive ? '#1A9B8E' : 'rgba(15,32,30,.55)',
                cursor: 'pointer',
                transition: 'all .15s ease',
              }}
            >
              {a}
            </button>
          )
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* 1. WelcomeScreen */}
        <div>
          <div
            className="label-caps"
            style={{
              fontSize: '9px',
              color: 'var(--text-tertiary, rgba(0,0,0,.35))',
              marginBottom: '6px',
            }}
          >
            WelcomeScreen · onNewGame/onContinue stubbed
          </div>
          <div
            style={{
              border: '1px dashed rgba(0,0,0,.15)',
              borderRadius: '4px',
              overflow: 'hidden',
            }}
          >
            <WelcomeScreen onNewGame={() => {}} onContinue={() => {}} canContinue={true} />
          </div>
        </div>

        {/* 2. WelcomeModal */}
        <div>
          <div
            className="label-caps"
            style={{
              fontSize: '9px',
              color: 'var(--text-tertiary, rgba(0,0,0,.35))',
              marginBottom: '6px',
            }}
          >
            WelcomeModal · CTA navigates away — use browser back
          </div>
          <div
            style={{
              border: '1px dashed rgba(0,0,0,.15)',
              borderRadius: '4px',
              overflow: 'hidden',
              minHeight: '400px',
            }}
          >
            <WelcomeModal onStart={() => {}} />
          </div>
        </div>

        {/* 3. ArchetypeSelectionScreen */}
        <div>
          <div
            className="label-caps"
            style={{
              fontSize: '9px',
              color: 'var(--text-tertiary, rgba(0,0,0,.35))',
              marginBottom: '6px',
            }}
          >
            ArchetypeSelectionScreen · CTA navigates away
          </div>
          <div
            style={{
              border: '1px dashed rgba(0,0,0,.15)',
              borderRadius: '4px',
              overflow: 'hidden',
              minHeight: '400px',
            }}
          >
            <ArchetypeSelectionScreen onSelect={() => {}} />
          </div>
        </div>

        {/* 4. DeputySelectionScreen */}
        <div>
          <div
            className="label-caps"
            style={{
              fontSize: '9px',
              color: 'var(--text-tertiary, rgba(0,0,0,.35))',
              marginBottom: '6px',
            }}
          >
            DeputySelectionScreen · CTA navigates away
          </div>
          <div
            style={{
              border: '1px dashed rgba(0,0,0,.15)',
              borderRadius: '4px',
              overflow: 'hidden',
              minHeight: '400px',
            }}
          >
            <DeputySelectionScreen onSelect={() => {}} archetypeKey={archetype} />
          </div>
        </div>

        {/* 5. HandoverNotesModal */}
        <div>
          <div
            className="label-caps"
            style={{
              fontSize: '9px',
              color: 'var(--text-tertiary, rgba(0,0,0,.35))',
              marginBottom: '6px',
            }}
          >
            HandoverNotesModal · onClose stubbed
          </div>
          <div
            style={{
              border: '1px dashed rgba(0,0,0,.15)',
              borderRadius: '4px',
              overflow: 'hidden',
              minHeight: '400px',
            }}
          >
            <HandoverNotesModal onClose={() => {}} archetypeKey={archetype} />
          </div>
        </div>

        {/* 6. GoalSelectionScreen */}
        <div>
          <div
            className="label-caps"
            style={{
              fontSize: '9px',
              color: 'var(--text-tertiary, rgba(0,0,0,.35))',
              marginBottom: '6px',
            }}
          >
            GoalSelectionScreen · CTA navigates away
          </div>
          <div
            style={{
              border: '1px dashed rgba(0,0,0,.15)',
              borderRadius: '4px',
              overflow: 'hidden',
              minHeight: '400px',
            }}
          >
            <GoalSelectionScreen onSelect={() => {}} context="new-game" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Tab 3: Overlays ──────────────────────────────────────────────────────────
const FAKE_SITUATION_CTX_VALUE: Situation = 'crisis'

function OverlaysTab({ theme }: { theme: Theme }) {
  // Hydrate store
  useEffect(() => {
    useGameStore.setState({
      ...STARTING_STATE,
      week: 200,
      inCampaignMode: true,
      campaignDecisions: [
        'rally-alimosho',
        'promise-education',
        'go-positive',
        'release-full-audit',
        'counter-rally-mainland',
      ],
      lgaElectionResult: 62,
      inbox: FIXTURE_INBOX,
      selectedGoalId: ALL_GOALS[0]?.id ?? 'break-the-machine',
    })
    return () => {
      useGameStore.setState(STARTING_STATE)
    }
  }, [])

  return (
    <SituationCtx.Provider value={FAKE_SITUATION_CTX_VALUE}>
      <div
        className="sl-tab-section"
        style={{ padding: '20px 24px', maxWidth: '800px', margin: '0 auto', width: '100%' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* HelpReference */}
          <div>
            <div
              className="label-caps"
              style={{ fontSize: '9px', color: theme.textFaint, marginBottom: '6px' }}
            >
              HelpReference · onClose stubbed
            </div>
            <HelpReference onClose={() => {}} />
          </div>

          {/* Inbox */}
          <div>
            <div
              className="label-caps"
              style={{ fontSize: '9px', color: theme.textFaint, marginBottom: '6px' }}
            >
              Inbox · reads from Zustand (fixture data injected)
            </div>
            <Inbox />
          </div>

          {/* ContextualHint — replaced ToastHint (renders via Driver.js, not shown in StyleLab) */}

          {/* GoalTracker */}
          <div>
            <div
              className="label-caps"
              style={{ fontSize: '9px', color: theme.textFaint, marginBottom: '6px' }}
            >
              GoalTracker · reads selectedGoalId from store
            </div>
            <GoalTracker />
          </div>

          {/* DiagnosisBanner (game) */}
          <div>
            <div
              className="label-caps"
              style={{ fontSize: '9px', color: theme.textFaint, marginBottom: '6px' }}
            >
              GameDiagnosisBanner · wrapped in fake SituationCtx (crisis)
            </div>
            <GameDiagnosisBanner />
          </div>

          {/* StateOfTheState */}
          <div>
            <div
              className="label-caps"
              style={{ fontSize: '9px', color: theme.textFaint, marginBottom: '6px' }}
            >
              StateOfTheState · reads stats/factions from store
            </div>
            <div
              style={{
                maxHeight: '500px',
                overflowY: 'auto',
                border: '1px solid rgba(0,0,0,.1)',
                borderRadius: '4px',
              }}
            >
              <GameStateOfTheState />
            </div>
          </div>

          {/* ProjectsPanel */}
          <div>
            <div
              className="label-caps"
              style={{ fontSize: '9px', color: theme.textFaint, marginBottom: '6px' }}
            >
              ProjectsPanel · reads projects from store, onClose stubbed
            </div>
            <div
              style={{
                maxHeight: '500px',
                overflowY: 'auto',
                border: '1px solid rgba(0,0,0,.1)',
                borderRadius: '4px',
              }}
            >
              <ProjectsPanel onClose={() => {}} />
            </div>
          </div>

          {/* ResearchTree */}
          <div>
            <div
              className="label-caps"
              style={{ fontSize: '9px', color: theme.textFaint, marginBottom: '6px' }}
            >
              ResearchTree · reads research from store, onClose stubbed
            </div>
            <div
              style={{
                maxHeight: '500px',
                overflowY: 'auto',
                border: '1px solid rgba(0,0,0,.1)',
                borderRadius: '4px',
              }}
            >
              <ResearchTree onClose={() => {}} />
            </div>
          </div>

          {/* ElectionWatermark */}
          <div>
            <div
              className="label-caps"
              style={{ fontSize: '9px', color: theme.textFaint, marginBottom: '6px' }}
            >
              ElectionWatermark · renders when inCampaignMode (toggle via dirty-mock)
            </div>
            <div
              style={{
                position: 'relative',
                height: '120px',
                border: '1px solid rgba(0,0,0,.1)',
                borderRadius: '4px',
                overflow: 'hidden',
                background: 'var(--surface, #fff)',
              }}
            >
              <ElectionWatermark />
            </div>
          </div>

          {/* CampaignTracker */}
          <div>
            <div
              className="label-caps"
              style={{ fontSize: '9px', color: theme.textFaint, marginBottom: '6px' }}
            >
              CampaignTracker · reads campaignDecisions/voteShare from store
            </div>
            <div
              style={{
                maxHeight: '500px',
                overflowY: 'auto',
                border: '1px solid rgba(0,0,0,.1)',
                borderRadius: '4px',
              }}
            >
              <CampaignTracker />
            </div>
          </div>
        </div>
      </div>
    </SituationCtx.Provider>
  )
}

// ─── Tab 4: Atoms ─────────────────────────────────────────────────────────────
function AtomsTab() {
  return (
    <div
      className="sl-tab-section"
      style={{ padding: '20px 24px', maxWidth: '900px', margin: '0 auto', width: '100%' }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
        {/* Button */}
        <section>
          <Kicker accent>Button</Kicker>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '12px',
              marginTop: '8px',
            }}
          >
            {(['primary', 'choice', 'danger', 'ghost'] as const).map((v) => (
              <div
                key={v}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  alignItems: 'center',
                }}
              >
                <Button variant={v}>{v}</Button>
                <Button variant={v} disabled>
                  {v} disabled
                </Button>
              </div>
            ))}
          </div>
        </section>

        {/* Surface */}
        <section>
          <Kicker accent>Surface</Kicker>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
              marginTop: '8px',
            }}
          >
            {(['flat', 'raised', 'atm'] as const).map((elev) =>
              (['default', 'surface2', 'ghost'] as const).map((vari) => (
                <Surface key={`${elev}-${vari}`} elevation={elev} variant={vari} padding="16px">
                  <div
                    style={{
                      fontFamily: "'Archivo Narrow', sans-serif",
                      fontSize: '11px',
                      textAlign: 'center',
                    }}
                  >
                    {elev} · {vari}
                  </div>
                </Surface>
              )),
            )}
          </div>
        </section>

        {/* Stat */}
        <section>
          <Kicker accent>Stat</Kicker>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '8px' }}>
            <Stat label="Revenue" value={24.8} format="currency" />
            <Stat label="Trust" value={67} format="percent" />
            <Stat label="Pol. Cap" value={45} />
            <Stat label="Cash" value={8.2} format="currency" warn danger />
          </div>
        </section>

        {/* Pill */}
        <section>
          <Kicker accent>Pill</Kicker>
          <div
            style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
              alignItems: 'center',
              marginTop: '8px',
            }}
          >
            <Pill text="+3 Trust" isGood />
            <Pill text="−5 Corruption" isGood={false} />
            <Pill text="+12 Business" isGood size="md" />
            <Pill text="−3 Cash" isGood={false} size="md" />
            <Pill text="With icon" isGood icon={undefined} />
          </div>
        </section>

        {/* Banner */}
        <section>
          <Kicker accent>Banner</Kicker>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
            <Banner tone="warning">Warning banner — your treasury is low</Banner>
            <Banner tone="danger">Danger banner — riot declared in three LGAs</Banner>
            <Banner tone="info">Info banner — weekly report ready</Banner>
            <Banner tone="success">Success banner — infrastructure milestone reached</Banner>
          </div>
        </section>

        {/* Badge */}
        <section>
          <Kicker accent>Badge</Kicker>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center', marginTop: '8px' }}>
            <Badge count={1} />
            <Badge count={5} />
            <Badge count={12} />
            <Badge count={99} max={9} />
            <Badge count={100} max={99} />
          </div>
        </section>

        {/* Tab */}
        <section>
          <Kicker accent>Tab</Kicker>
          <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
            <Tab label="All" active />
            <Tab label="Unread" badge={3} />
            <Tab label="Archived" />
            <Tab label="Flagged" badge={12} />
          </div>
        </section>

        {/* Typography */}
        <section>
          <Kicker accent>Typography</Kicker>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
            <Kicker>Kicker — Section kicker</Kicker>
            <Heading level={1}>Heading 1 — Display Title</Heading>
            <Heading level={2}>Heading 2 — Section Title</Heading>
            <Heading level={3}>Heading 3 — Card Title</Heading>
            <Prose>
              Prose — Body text with the standard leading and measure used throughout the game
              interface.
            </Prose>
          </div>
        </section>

        {/* RainLayer */}
        <section>
          <Kicker accent>RainLayer</Kicker>
          <div style={{ marginTop: '8px' }}>
            <div
              style={{
                width: '200px',
                height: '200px',
                border: '1px solid rgba(0,0,0,.1)',
                borderRadius: '4px',
                overflow: 'hidden',
                position: 'relative',
                background: '#0C1720',
              }}
            >
              <RainLayer />
            </div>
          </div>
        </section>

        {/* Lagos skyline vignette — layered-parallax technique proof for the SVG desk (OTA-46) */}
        <section>
          <Kicker accent>Lagos Skyline (OTA-46 technique proof)</Kicker>
          <div
            className="label-caps"
            style={{
              fontSize: '9px',
              color: 'var(--text-tertiary, rgba(0,0,0,.35))',
              margin: '6px 0',
            }}
          >
            Layered inline-SVG: clouds + ferry + danfo move; skyline/landmarks static. Motion
            respects prefers-reduced-motion.
          </div>
          <div
            style={{
              marginTop: '8px',
              maxWidth: '640px',
              border: '1px solid rgba(0,0,0,.1)',
              borderRadius: '6px',
              overflow: 'hidden',
            }}
          >
            <LagosSkyline height={260} />
          </div>
        </section>
      </div>
    </div>
  )
}

// ─── Tab 5: Desk ──────────────────────────────────────────────────────────────
function DeskTab({
  theme,
  variant,
  gameState,
}: {
  theme: Theme
  variant: Variant
  gameState: GameState
}) {
  const [deskStyle, setDeskStyle] = useState<'modern' | 'traditional' | 'simple'>('modern')
  const [showWindow, setShowWindow] = useState(true)
  const [showProps, setShowProps] = useState(true)

  return (
    <div
      className="sl-tab-section"
      style={{ padding: '20px 24px', maxWidth: '960px', margin: '0 auto', width: '100%' }}
    >
      {/* Controls */}
      <div
        style={{
          display: 'flex',
          gap: '24px',
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: '20px',
          fontFamily: "'Archivo Narrow', sans-serif",
          fontSize: '12px',
        }}
      >
        {/* Desk style */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span
            style={{
              color: theme.text2,
              fontWeight: 600,
              letterSpacing: '.03em',
              textTransform: 'uppercase',
              fontSize: '10px',
            }}
          >
            Desk
          </span>
          {(['modern', 'traditional', 'simple'] as const).map((s) => (
            <button
              type="button"
              key={s}
              onClick={() => setDeskStyle(s)}
              style={{
                padding: '4px 12px',
                border: `1px solid ${deskStyle === s ? theme.accent : theme.border}`,
                background: deskStyle === s ? theme.accent : 'transparent',
                color: deskStyle === s ? '#fff' : theme.text,
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 600,
                transition: 'all .2s ease',
              }}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Toggles */}
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            color: theme.text2,
          }}
        >
          <input type="checkbox" checked={showWindow} onChange={() => setShowWindow((v) => !v)} />
          Window
        </label>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            color: theme.text2,
          }}
        >
          <input type="checkbox" checked={showProps} onChange={() => setShowProps((v) => !v)} />
          Props
        </label>
      </div>

      {/* Desk Scene */}
      <DeskScene
        situation={gameState}
        deskStyle={deskStyle}
        showWindow={showWindow}
        showProps={showProps}
      >
        <div style={{ width: '100%', position: 'relative' }}>
          <EventCard theme={theme} variant={variant} onCommit={() => {}} />
        </div>
        <div
          style={{
            display: 'flex',
            gap: '12px',
            width: '100%',
            justifyContent: 'center',
            marginTop: '4px',
          }}
        >
          <div style={{ flex: 1, maxWidth: '140px' }}>
            <Stat label="Revenue" value={24.8} format="currency" />
          </div>
          <div style={{ flex: 1, maxWidth: '140px' }}>
            <Stat label="Trust" value={67} format="percent" />
          </div>
          <div style={{ flex: 1, maxWidth: '140px' }}>
            <Stat label="Pol. Cap" value={45} />
          </div>
        </div>
      </DeskScene>
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export function StyleLab() {
  const [gameState, setGameState] = useState<GameState>('calm')
  const [variant, setVariant] = useState<Variant>('atmospheric')
  const [soundOn, setSoundOn] = useState(false)
  const [showBlackout, setShowBlackout] = useState(false)
  const [showDiagnosis, setShowDiagnosis] = useState(false)
  const [diagKey, setDiagKey] = useState(0) // force re-mount for re-animation
  const [activeTab, setActiveTab] = useState<TabId>(0)
  const theme = useMemo(() => mkTheme(gameState, variant), [gameState, variant])
  const reduced = useReducedMotion()

  // Silence the ambient bed when leaving the lab
  useEffect(
    () => () => {
      stopAll()
    },
    [],
  )

  function changeState(next: GameState) {
    // Transition stings + cross-fade the ambient bed to the new situation
    if (next === 'storm') playCue('blackout')
    if (next === 'crisis') playCue('crisis')
    setAmbient(next)

    // Blackout flash for storm transition
    if (next === 'storm' || gameState === 'storm') {
      setShowBlackout(true)
      setTimeout(() => setShowBlackout(false), 250)
    }

    // Diagnosis banner: show in crisis/storm
    const willShow = next === 'crisis' || next === 'storm'
    if (willShow && !showDiagnosis) {
      setShowDiagnosis(true)
      setDiagKey((k) => k + 1)
    } else if (!willShow) {
      setShowDiagnosis(false)
    }

    setGameState(next)
  }

  return (
    <>
      <style>{SL_CSS}</style>
      <style>{FIXED_OVERRIDE_CSS}</style>

      {/* ── Atmospheric overlays (skipped when the OS asks for reduced motion) ── */}
      {showBlackout && <div className="sl-bko" />}
      {gameState === 'storm' && !reduced && <Rain />}

      {/* Reduced-motion indicator (verifies the accessibility gate in the lab) */}
      {reduced && (
        <div
          style={{
            position: 'fixed',
            bottom: 12,
            left: 12,
            zIndex: 70,
            padding: '4px 8px',
            fontSize: '10px',
            fontWeight: 600,
            fontFamily: "'Archivo Narrow', sans-serif",
            letterSpacing: '.04em',
            color: '#8a6d1a',
            background: 'rgba(240,220,140,.18)',
            border: '1px solid rgba(180,150,40,.4)',
            pointerEvents: 'none',
          }}
        >
          ⏸ REDUCED MOTION — rain/shimmer off
        </div>
      )}

      <div
        className="sl-scroll"
        style={{
          minHeight: '100vh',
          background: theme.bgGrad,
          display: 'flex',
          flexDirection: 'column',
          transition: `background ${theme.dur} ease`,
          overflowY: 'auto',
          position: 'relative',
        }}
      >
        {/* Calm: very faint ambient shimmer on the page background */}
        {gameState === 'calm' && variant === 'atmospheric' && !reduced && (
          <div
            className="sl-shimmer"
            style={{
              position: 'fixed',
              inset: 0,
              pointerEvents: 'none',
              zIndex: 0,
              background:
                'radial-gradient(ellipse at 60% 20%, rgba(26,155,142,.04) 0%, transparent 55%)',
            }}
          />
        )}

        {/* Election: subtle political-heat tint at the very top of the page */}
        {gameState === 'election' && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: 'linear-gradient(90deg, #C82020, #1A7A3C, #C82020)',
              backgroundSize: '200% 100%',
              animation: 'campaign 3.5s ease-in-out infinite',
              zIndex: 25,
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Lab chrome — sticky */}
        <LabChrome
          gameState={gameState}
          variant={variant}
          soundOn={soundOn}
          onState={changeState}
          onVariant={setVariant}
          onSound={(on) => {
            setSoundOn(on)
            setMuted(!on) // resumes the AudioContext (this is the user gesture)
            if (on) setAmbient(gameState) // start the bed for the current situation
          }}
        />

        {/* Tab bar — sticky below chrome */}
        <TabBar activeTab={activeTab} onChange={setActiveTab} />

        {/* ── Tab Content ── */}
        {activeTab === 0 && (
          /* ════════ CORE (existing content — unchanged) ════════ */
          <div
            style={{
              position: 'relative',
              zIndex: 10,
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Status Bar */}
            <StatusBar theme={theme} variant={variant} state={gameState} />

            {/* Diagnosis Banner — crisis + storm only */}
            {showDiagnosis && <DiagnosisBanner key={diagKey} theme={theme} variant={variant} />}

            {/* Main content */}
            <div
              style={{
                flex: 1,
                padding: `20px ${variant === 'atmospheric' ? '24px' : '20px'}`,
                maxWidth: '720px',
                margin: '0 auto',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: '0',
              }}
            >
              {/* Event Card — the hero */}
              <EventCard theme={theme} variant={variant} onCommit={() => {}} />

              {/* State Seal */}
              <StateSeal theme={theme} variant={variant} />

              {/* Sandbox note */}
              <div
                style={{
                  textAlign: 'center',
                  paddingBottom: '24px',
                  fontFamily: "'Archivo Narrow', sans-serif",
                  fontSize: '9px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.14em',
                  color: theme.textFaint,
                  transition: tr(theme),
                }}
              >
                /style-lab · throwaway · flip the mood switcher to see the system
              </div>
            </div>

            {/* Nav Dock — pinned at bottom */}
            <div style={{ position: 'sticky', bottom: 0, zIndex: 20 }}>
              <NavDock theme={theme} variant={variant} state={gameState} />
            </div>
          </div>
        )}

        {activeTab === 1 && <MediaTab theme={theme} />}
        {activeTab === 2 && <OnboardingTab />}
        {activeTab === 3 && <OverlaysTab theme={theme} />}
        {activeTab === 4 && <AtomsTab />}
        {activeTab === 5 && <DeskTab theme={theme} variant={variant} gameState={gameState} />}
        {activeTab === 6 && <ResearchTab />}
        {activeTab === 7 && <GoalJourneyTab />}
        {activeTab === 8 && <SealsTab />}
        {activeTab === 9 && <CastGallery />}
        {activeTab === 10 && <ShareLabPanel />}
      </div>
    </>
  )
}
