import { useNavigate } from '@tanstack/react-router'
import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  DollarSign,
  GanttChartSquare,
  Heart,
  Inbox as InboxIcon,
  Landmark,
  Users,
  Vote,
  Wallet,
  Zap,
} from 'lucide-react'
import { lazy, Suspense, useCallback, useEffect, useState } from 'react'

import { STARTING_STATE } from './data/startingState'
import { useGameStore } from './state/gameStore'
import { clearSave } from './state/persistence'
import { BudgetPanel } from './ui/BudgetPanel'
import { EventCard } from './ui/EventCard'
import { FactionPanel } from './ui/FactionPanel'
import { HelpReference } from './ui/HelpReference'
import { Inbox } from './ui/Inbox'
import { MediaRouter } from './ui/MediaRouter'
import { NPCPanel } from './ui/NPCPanel'
import { PollPanel } from './ui/PollPanel'
import 'driver.js/dist/driver.css'
import { ALL_HINTS } from './data/hints'
import { getSeasonModifier } from './engine/seasonEngine'
import { CabinetPanel } from './ui/CabinetPanel'
import { ContextualHint } from './ui/ContextualHint'
import { Seal } from './ui/components/Seal'
import { Stat } from './ui/components/Stat'
import { Tab } from './ui/components/Tab'
import { DeputyPanel } from './ui/DeputyPanel'
import { useSituation } from './ui/design/ThemeProvider'
import { DeskScene } from './ui/desk/DeskScene'
import { ElectionWatermark } from './ui/ElectionWatermark'
import { GuidedTour } from './ui/GuidedTour'
import { DiagnosisBanner } from './ui/game/DiagnosisBanner'
import { StateOfTheState } from './ui/game/StateOfTheState'
import { formatGameMonth } from './utils/calendar'

const LazyLegacyScreen = lazy(() =>
  import('./ui/LegacyScreen').then((m) => ({ default: m.LegacyScreen })),
)
const LazyResearchTree = lazy(() =>
  import('./ui/ResearchTree').then((m) => ({ default: m.ResearchTree })),
)
const LazyProjectsPanel = lazy(() =>
  import('./ui/ProjectsPanel').then((m) => ({ default: m.ProjectsPanel })),
)
const LazyCampaignTracker = lazy(() =>
  import('./ui/CampaignTracker').then((m) => ({ default: m.CampaignTracker })),
)
const LazyStrategicDashboard = lazy(() =>
  import('./ui/StrategicDashboard').then((m) => ({ default: m.StrategicDashboard })),
)

// ─── Dock destinations ────────────────────────────────────────────────────────
type DockTab = 'inbox' | 'economy' | 'factions' | 'people' | 'state' | 'strategy' | 'election'

const DOCK_TABS: { id: DockTab; label: string; Icon: LucideIcon }[] = [
  { id: 'inbox', label: 'Inbox', Icon: InboxIcon },
  { id: 'economy', label: 'Economy', Icon: DollarSign },
  { id: 'factions', label: 'Factions', Icon: Landmark },
  { id: 'people', label: 'People', Icon: Users },
  { id: 'state', label: 'State', Icon: BarChart3 },
  { id: 'strategy', label: 'Strategy', Icon: GanttChartSquare },
  { id: 'election', label: 'Election', Icon: Vote },
]

// ─── Status bar ───────────────────────────────────────────────────────────────
type StatusBarProps = {
  termLabel: string
  monthLabel: string
  seasonLabel: string
  week: number
  onTick: () => void
  canTick: boolean
  onResearch: () => void
  onProjects: () => void
  onOpenReference: () => void
}

function StatusBarStats() {
  const cashReserve = useGameStore((s) => s.stats.cashReserve)
  const publicTrust = useGameStore((s) => s.stats.publicTrust)
  const politicalCapital = useGameStore((s) => s.stats.politicalCapital)

  const cashWarn = cashReserve < 15
  const trustWarn = publicTrust < 40
  const pcWarn = politicalCapital < 25

  return (
    <div
      className="status-bar-stats"
      style={{ display: 'flex', gap: 'var(--status-bar-stats-gap, 20px)', alignItems: 'center' }}
    >
      <Stat
        label="Treasury"
        value={cashReserve}
        format="currency"
        warn={cashWarn}
        danger={cashReserve < 8}
        title="Weekly revenue minus expenditure. Below 15bn triggers warnings; negative for 3+ weeks = bankruptcy."
        icon={Wallet}
      />
      <Stat
        label="Trust"
        value={publicTrust}
        format="percent"
        warn={trustWarn}
        danger={publicTrust < 25}
        title="Public approval rating. Below 25% risks mass uprising if youth tension is high."
        icon={Heart}
      />
      <Stat
        label="Pol. Cap"
        value={politicalCapital}
        warn={pcWarn}
        danger={politicalCapital < 10}
        title="Political capital to spend on bold actions. Earned by wins; spent on hard choices."
        icon={Zap}
      />
    </div>
  )
}

function StatusBarActions({
  onTick,
  canTick,
  onResearch,
  onProjects,
  onOpenReference,
}: {
  onTick: () => void
  canTick: boolean
  onResearch: () => void
  onProjects: () => void
  onOpenReference: () => void
}) {
  return (
    <div
      className="status-bar-actions"
      style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}
    >
      <button
        type="button"
        onClick={onOpenReference}
        style={{
          background: 'none',
          border: 'none',
          borderRadius: '2px',
          width: '24px',
          height: '24px',
          fontSize: '14px',
          fontWeight: 700,
          fontFamily: "'Archivo Narrow', sans-serif",
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          lineHeight: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.6,
        }}
        title="Quick Reference"
      >
        ?
      </button>
      <button
        type="button"
        onClick={onResearch}
        style={{
          background: 'transparent',
          border: '1px solid var(--accent-solid)',
          borderRadius: '2px',
          padding: '4px var(--status-bar-action-pad-x, 10px)',
          fontSize: '11px',
          fontFamily: "'Archivo Narrow', sans-serif",
          color: 'var(--accent-text)',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
        title="Commission the Future"
      >
        Research
      </button>
      <button
        type="button"
        onClick={onProjects}
        style={{
          background: 'transparent',
          border: '1px solid var(--accent-solid)',
          borderRadius: '2px',
          padding: '4px var(--status-bar-action-pad-x, 10px)',
          fontSize: '11px',
          fontFamily: "'Archivo Narrow', sans-serif",
          color: 'var(--accent-text)',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
        title="Build / Govern"
      >
        Projects
      </button>
      {canTick && (
        <button
          type="button"
          onClick={onTick}
          data-tour="next-week"
          style={{
            background: 'var(--accent-solid)',
            color: 'var(--accent-on-solid)',
            border: 'none',
            borderRadius: '2px',
            padding: '6px var(--status-bar-next-pad-x, 16px)',
            fontSize: '12px',
            fontWeight: 600,
            fontFamily: "'Archivo Narrow', sans-serif",
            letterSpacing: '0.03em',
            cursor: 'pointer',
            transition: 'background-color 200ms ease',
            whiteSpace: 'nowrap',
          }}
        >
          Next Week
        </button>
      )}
    </div>
  )
}

function StatusBar({
  termLabel,
  monthLabel,
  seasonLabel,
  week,
  onTick,
  canTick,
  onResearch,
  onProjects,
  onOpenReference,
}: StatusBarProps) {
  return (
    <header
      className="themed status-bar"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--status-bar-gap, 16px)',
        padding: 'var(--status-bar-padding, 8px 16px)',
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
        zIndex: 30,
        flexShrink: 0,
        transition: 'background-color var(--dur) ease, border-color var(--dur) ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <Seal size={28} />
        <div>
          <div
            className="font-display"
            style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', lineHeight: 1.2 }}
          >
            Lagos Governor Sim
          </div>
          <div
            className="label-caps"
            style={{ marginTop: '1px', cursor: 'default' }}
            title={`Week ${week}`}
          >
            {termLabel} · {monthLabel} ·{' '}
            <span style={{ color: 'var(--accent-text)' }}>{seasonLabel}</span>
          </div>
        </div>
      </div>

      <div className="status-bar-spacer" style={{ flex: 1 }} />

      <StatusBarStats />
      <StatusBarActions
        onTick={onTick}
        canTick={canTick}
        onResearch={onResearch}
        onProjects={onProjects}
        onOpenReference={onOpenReference}
      />
    </header>
  )
}

// ─── Panel overlay ────────────────────────────────────────────────────────────
function PanelOverlayHeader({ activeTab, onClose }: { activeTab: DockTab; onClose: () => void }) {
  const tab = DOCK_TABS.find((t) => t.id === activeTab)

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 16px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {tab ? <tab.Icon size={15} style={{ color: 'var(--accent-solid)' }} /> : null}
        <span
          style={{
            fontSize: '13px',
            fontWeight: 600,
            fontFamily: "'Archivo Narrow', sans-serif",
            color: 'var(--text)',
          }}
        >
          {tab?.label}
        </span>
      </div>
      <button
        type="button"
        onClick={onClose}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-secondary)',
          fontSize: '20px',
          lineHeight: 1,
          padding: '0 4px',
        }}
      >
        ×
      </button>
    </div>
  )
}

function PanelOverlayContent({ activeTab }: { activeTab: DockTab }) {
  const content = (() => {
    switch (activeTab) {
      case 'inbox':
        return (
          <div style={{ padding: '12px' }}>
            <Inbox />
          </div>
        )
      case 'economy':
        return (
          <div style={{ padding: '12px' }}>
            <BudgetPanel />
          </div>
        )
      case 'factions':
        return (
          <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <FactionPanel />
            <PollPanel />
          </div>
        )
      case 'people':
        return (
          <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <DeputyPanel />
            <NPCPanel />
            <CabinetPanel />
          </div>
        )
      case 'state':
        return <StateOfTheState />
      case 'strategy':
        return (
          <div style={{ padding: '12px' }}>
            <Suspense fallback={null}>
              <LazyStrategicDashboard />
            </Suspense>
          </div>
        )
      case 'election':
        return (
          <div style={{ padding: '12px' }}>
            <Suspense fallback={null}>
              <LazyCampaignTracker />
            </Suspense>
          </div>
        )
    }
  })()

  return <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>{content}</div>
}

function PanelOverlay({ activeTab, onClose }: { activeTab: DockTab | null; onClose: () => void }) {
  if (!activeTab) return null

  return (
    <>
      <button
        type="button"
        aria-label="Close panel"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 40,
          background: 'rgba(0,0,0,.32)',
          animation: 'backdrop-in 200ms ease forwards',
          border: 'none',
          padding: 0,
          margin: 0,
          cursor: 'pointer',
        }}
      />
      <div
        className="themed"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          background: 'var(--surface)',
          borderTop: '1px solid var(--border)',
          borderRadius: '6px 6px 0 0',
          maxHeight: 'min(80vh, 640px)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'panel-up 280ms cubic-bezier(.16,1,.3,1) forwards',
          boxShadow: 'var(--shadow-atm)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '10px 16px 0',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: '32px',
              height: '4px',
              borderRadius: '2px',
              background: 'var(--border-strong)',
            }}
          />
        </div>

        <PanelOverlayHeader activeTab={activeTab} onClose={onClose} />
        <PanelOverlayContent activeTab={activeTab} />
      </div>
    </>
  )
}

// ─── Game layout (route /game) ────────────────────────────────────────────────
type GameAppOverlaysProps = {
  hasNewspaperHeadline: boolean
  hintDef: (typeof ALL_HINTS)[number] | null
  showResearch: boolean
  showProjects: boolean
  inCampaignMode: boolean
  onDismissHint: () => void
  onCloseResearch: () => void
  onCloseProjects: () => void
}

type GameAppHeaderProps = StatusBarProps & {
  currentTerm: number
  isGameOver: boolean
  inCampaignMode: boolean
}

type GameSceneProps = {
  isGameOver: boolean
  onLegacyNewGame: () => void
}

type GameDockProps = {
  inCampaignMode: boolean
  activePanel: DockTab | null
  inboxCount: number
  factionAlert: boolean
  onTogglePanel: (id: DockTab) => void
}

type GameAppMainProps = GameSceneProps &
  GameDockProps & {
    onClosePanel: () => void
  }

type GameAppFrameProps = GameAppHeaderProps &
  GameAppMainProps & {
    showReference: boolean
    onCloseReference: () => void
  }

function useActiveHint() {
  const hintQueue = useGameStore((s) => s.hintQueue)
  const dismissHint = useGameStore((s) => s.dismissHint)
  const [currentHint, setCurrentHint] = useState<string | null>(null)

  useEffect(() => {
    if (currentHint || hintQueue.length === 0) return
    const nextId = hintQueue[0]
    setCurrentHint(nextId)
  }, [currentHint, hintQueue])

  // Memoized: ContextualHint's effect depends on this callback's identity,
  // and re-runs it on every change — an unmemoized function here recreated
  // a new driver.js popover on every unrelated App re-render (of which there
  // are many, from frequent store updates elsewhere), which read as the
  // hint tooltip "flashing" or reappearing on its own.
  const handleDismissHint = useCallback(() => {
    if (!currentHint) return
    dismissHint(currentHint)
    setCurrentHint(null)
  }, [currentHint, dismissHint])

  const hintDef = currentHint ? (ALL_HINTS.find((h) => h.id === currentHint) ?? null) : null

  return { hintDef, handleDismissHint }
}

function getTermLabel(currentTerm: number, week: number) {
  const termBaseWeek = currentTerm === 2 ? week - 208 : week
  const year = Math.ceil(termBaseWeek / 52)
  const YEARS = ['Year 1', 'Year 2', 'Year 3', 'Year 4'] as const

  return currentTerm === 2
    ? `Second Term · Year ${year + 4}`
    : `First Term · ${YEARS[Math.min(year - 1, YEARS.length - 1)]}`
}

function GameAppOverlays({
  hasNewspaperHeadline,
  hintDef,
  showResearch,
  showProjects,
  inCampaignMode,
  onDismissHint,
  onCloseResearch,
  onCloseProjects,
}: GameAppOverlaysProps) {
  return (
    <>
      {hasNewspaperHeadline && <MediaRouter />}
      {hintDef && <ContextualHint hint={hintDef} onDismiss={onDismissHint} />}
      <GuidedTour />
      {showResearch && (
        <Suspense fallback={null}>
          <LazyResearchTree onClose={onCloseResearch} />
        </Suspense>
      )}
      {showProjects && (
        <Suspense fallback={null}>
          <LazyProjectsPanel onClose={onCloseProjects} />
        </Suspense>
      )}
      {inCampaignMode && <ElectionWatermark />}
    </>
  )
}

function GameAppHeader({
  termLabel,
  monthLabel,
  seasonLabel,
  week,
  currentTerm,
  onTick,
  canTick,
  onResearch,
  onProjects,
  onOpenReference,
  isGameOver,
  inCampaignMode,
}: GameAppHeaderProps) {
  return (
    <>
      <StatusBar
        termLabel={termLabel}
        monthLabel={monthLabel}
        seasonLabel={seasonLabel}
        week={week}
        onTick={onTick}
        canTick={canTick}
        onResearch={onResearch}
        onProjects={onProjects}
        onOpenReference={onOpenReference}
      />

      <div style={{ height: '2px', background: 'var(--border-subtle)', flexShrink: 0 }}>
        <div
          style={{
            height: '100%',
            width: `${Math.min(((currentTerm === 2 ? week - 208 : week) / 208) * 100, 100)}%`,
            background: 'var(--accent-solid)',
            transition: 'width 600ms ease',
          }}
        />
      </div>

      <DiagnosisBanner />

      {inCampaignMode && !isGameOver && (
        <div
          style={{
            textAlign: 'center',
            padding: '4px 12px',
            fontSize: '10px',
            fontFamily: "'Archivo Narrow', sans-serif",
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            background: 'var(--accent-bg-subtle)',
            color: 'var(--accent-text)',
            borderBottom: '1px solid var(--border)',
            flexShrink: 0,
          }}
        >
          Election Campaign — Week {week} · Every decision counts
        </div>
      )}
    </>
  )
}

function GameScene({ isGameOver, onLegacyNewGame }: GameSceneProps) {
  const situation = useSituation()
  const inCampaignMode = useGameStore((s) => s.inCampaignMode)
  const deskSituation = inCampaignMode && situation === 'calm' ? 'election' : situation

  // Game over bypasses the desk entirely — LegacyScreen is its own dense,
  // full-width scrollable report, not a single document that fits on the
  // kraft-paper mat DeskScene builds for EventCard.
  if (isGameOver) {
    return (
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        <Suspense fallback={null}>
          <LazyLegacyScreen onNewGame={onLegacyNewGame} />
        </Suspense>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
      <div
        className="event-card-area"
        style={{
          maxWidth: '860px',
          margin: '0 auto',
          // Bottom padding clears the fixed GameDock (~47px tall) plus the
          // device safe-area inset, so a tall event's last choice is always
          // scrollable into view rather than hidden behind the dock.
          padding: '16px 16px calc(88px + env(safe-area-inset-bottom))',
        }}
      >
        <DeskScene situation={deskSituation} deskStyle="modern">
          <EventCard />
        </DeskScene>
      </div>
    </div>
  )
}

function GameDock({
  inCampaignMode,
  activePanel,
  inboxCount,
  factionAlert,
  onTogglePanel,
}: GameDockProps) {
  return (
    <div
      className="themed"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 30,
        display: 'flex',
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        boxShadow: '0 -4px 20px rgba(0,0,0,.08)',
        flexShrink: 0,
        paddingBottom: 'env(safe-area-inset-bottom)',
        transition: 'background-color var(--dur) ease, border-color var(--dur) ease',
      }}
    >
      {DOCK_TABS.filter((t) => t.id !== 'election' || inCampaignMode).map(({ id, label, Icon }) => (
        <Tab
          key={id}
          icon={<Icon size={18} />}
          label={label}
          active={activePanel === id}
          dataTour={`dock-${id}`}
          badge={id === 'inbox' ? inboxCount : id === 'factions' ? (factionAlert ? 1 : 0) : 0}
          onClick={() => onTogglePanel(id)}
        />
      ))}
    </div>
  )
}

function GameAppMain({
  isGameOver,
  onLegacyNewGame,
  inCampaignMode,
  activePanel,
  inboxCount,
  factionAlert,
  onTogglePanel,
  onClosePanel,
}: GameAppMainProps) {
  return (
    <>
      <GameScene isGameOver={isGameOver} onLegacyNewGame={onLegacyNewGame} />
      {!isGameOver && (
        <GameDock
          inCampaignMode={inCampaignMode}
          activePanel={activePanel}
          inboxCount={inboxCount}
          factionAlert={factionAlert}
          onTogglePanel={onTogglePanel}
        />
      )}
      <PanelOverlay activeTab={activePanel} onClose={onClosePanel} />
    </>
  )
}

function GameAppFrame(props: GameAppFrameProps) {
  return (
    <div
      className="themed"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        overflow: 'hidden',
        background: 'var(--background)',
        color: 'var(--text)',
      }}
    >
      {props.showReference && <HelpReference onClose={props.onCloseReference} />}
      <GameAppHeader
        termLabel={props.termLabel}
        monthLabel={props.monthLabel}
        seasonLabel={props.seasonLabel}
        week={props.week}
        currentTerm={props.currentTerm}
        onTick={props.onTick}
        canTick={props.canTick}
        onResearch={props.onResearch}
        onProjects={props.onProjects}
        onOpenReference={props.onOpenReference}
        isGameOver={props.isGameOver}
        inCampaignMode={props.inCampaignMode}
      />
      <GameAppMain
        isGameOver={props.isGameOver}
        onLegacyNewGame={props.onLegacyNewGame}
        inCampaignMode={props.inCampaignMode}
        activePanel={props.activePanel}
        inboxCount={props.inboxCount}
        factionAlert={props.factionAlert}
        onTogglePanel={props.onTogglePanel}
        onClosePanel={props.onClosePanel}
      />
    </div>
  )
}

export default function GameApp() {
  const navigate = useNavigate()
  const tick = useGameStore((s) => s.tick)
  const isGameOver = useGameStore((s) => s.isGameOver)
  const week = useGameStore((s) => s.week)
  const currentTerm = useGameStore((s) => s.currentTerm)
  const factions = useGameStore((s) => s.factions)
  const activeGodfatherMessage = useGameStore((s) => s.activeGodfatherMessage)
  const newspaperHeadline = useGameStore((s) => s.newspaperHeadline)
  const inCampaignMode = useGameStore((s) => s.inCampaignMode)
  const inbox = useGameStore((s) => s.inbox)

  const [showResearch, setShowResearch] = useState(false)
  const [showProjects, setShowProjects] = useState(false)
  const [showReference, setShowReference] = useState(false)
  const [activePanel, setActivePanel] = useState<DockTab | null>(null)
  const { hintDef, handleDismissHint } = useActiveHint()

  function handleLegacyNewGame() {
    clearSave()
    useGameStore.setState({ ...STARTING_STATE })
    navigate({ to: '/', replace: true })
  }

  function handleTogglePanel(id: DockTab) {
    setActivePanel(activePanel === id ? null : id)
  }

  const termLabel = getTermLabel(currentTerm, week)
  const monthLabel = formatGameMonth(week)
  const seasonLabel = getSeasonModifier(week).label

  const inboxCount = inbox.filter((m) => !m.read).length + (activeGodfatherMessage ? 1 : 0)
  const factionAlert = Object.values(factions).some((v) => v <= 25)

  return (
    <>
      <GameAppOverlays
        hasNewspaperHeadline={Boolean(newspaperHeadline)}
        hintDef={hintDef}
        showResearch={showResearch}
        showProjects={showProjects}
        inCampaignMode={inCampaignMode}
        onDismissHint={handleDismissHint}
        onCloseResearch={() => setShowResearch(false)}
        onCloseProjects={() => setShowProjects(false)}
      />

      <GameAppFrame
        showReference={showReference}
        onCloseReference={() => setShowReference(false)}
        termLabel={termLabel}
        monthLabel={monthLabel}
        seasonLabel={seasonLabel}
        week={week}
        currentTerm={currentTerm}
        onTick={tick}
        canTick={!isGameOver}
        onResearch={() => setShowResearch(true)}
        onProjects={() => setShowProjects(true)}
        onOpenReference={() => setShowReference(true)}
        isGameOver={isGameOver}
        inCampaignMode={inCampaignMode}
        onLegacyNewGame={handleLegacyNewGame}
        activePanel={activePanel}
        inboxCount={inboxCount}
        factionAlert={factionAlert}
        onTogglePanel={handleTogglePanel}
        onClosePanel={() => setActivePanel(null)}
      />
    </>
  )
}
