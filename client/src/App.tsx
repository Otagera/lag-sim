import { useNavigate } from '@tanstack/react-router'
import { lazy, Suspense, useCallback, useEffect, useState } from 'react'

import { STARTING_STATE } from './data/startingState'
import { useGameStore } from './state/gameStore'
import { clearSave } from './state/persistence'
import { EventCard } from './ui/EventCard'
import { HelpReference } from './ui/HelpReference'
import { MediaRouter } from './ui/MediaRouter'
import 'driver.js/dist/driver.css'
import { ALL_HINTS } from './data/hints'
import { getSeasonModifier } from './engine/seasonEngine'
import { ContextualHint } from './ui/ContextualHint'
import { Tab } from './ui/components/Tab'
import { useSituation } from './ui/design/ThemeProvider'
import { DeskScene } from './ui/desk/DeskScene'
import { getDockBadges } from './ui/dock/dockSelectors'
import { DOCK_TABS } from './ui/dock/dockTabs'
import type { DockTab } from './ui/dock/dockTypes'
import { BriefingPanel } from './ui/dock/panels/BriefingPanel'
import { DeliveryPanel } from './ui/dock/panels/DeliveryPanel'
import { LagosPulsePanel } from './ui/dock/panels/LagosPulsePanel'
import { LegacyPanel } from './ui/dock/panels/LegacyPanel'
import { PowerMapPanel } from './ui/dock/panels/PowerMapPanel'
import { TreasuryPanel } from './ui/dock/panels/TreasuryPanel'
import { ElectionWatermark } from './ui/ElectionWatermark'
import { GuidedTour } from './ui/GuidedTour'
import { DiagnosisBanner } from './ui/game/DiagnosisBanner'
import { SituationBar } from './ui/SituationBar'
import { MomentToast } from './ui/share'
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

// ─── Situation bar ────────────────────────────────────────────────────────────
type SituationBarShellProps = {
  termLabel: string
  monthLabel: string
  seasonLabel: string
  week: number
  currentTerm: number
  inCampaignMode: boolean
  onTick: () => void
  canTick: boolean
  onResearch: () => void
  onProjects: () => void
  onOpenReference: () => void
}

// ─── Panel overlay ────────────────────────────────────────────────────────────
function PanelOverlayHeader({
  activeTab,
  onClose,
  titleId,
}: {
  activeTab: DockTab
  onClose: () => void
  titleId: string
}) {
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
        <div
          id={titleId}
          style={{
            fontSize: '13px',
            fontWeight: 600,
            fontFamily: "'Archivo Narrow', sans-serif",
            color: 'var(--text)',
          }}
        >
          {tab?.label}
        </div>
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
        aria-label="Close panel"
      >
        ×
      </button>
    </div>
  )
}

function PanelOverlayContent({
  activeTab,
  onOpenResearch,
  onOpenProjects,
}: {
  activeTab: DockTab
  onOpenResearch: () => void
  onOpenProjects: () => void
}) {
  const content = (() => {
    switch (activeTab) {
      case 'briefing':
        return <BriefingPanel />
      case 'treasury':
        return <TreasuryPanel />
      case 'power':
        return <PowerMapPanel />
      case 'lagos':
        return <LagosPulsePanel />
      case 'delivery':
        return <DeliveryPanel onOpenProjects={onOpenProjects} onOpenResearch={onOpenResearch} />
      case 'legacy':
        return <LegacyPanel />
    }
  })()

  return <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>{content}</div>
}

function PanelOverlay({
  activeTab,
  onClose,
  onOpenResearch,
  onOpenProjects,
}: {
  activeTab: DockTab | null
  onClose: () => void
  onOpenResearch: () => void
  onOpenProjects: () => void
}) {
  useEffect(() => {
    if (!activeTab) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeTab, onClose])

  if (!activeTab) return null

  const titleId = `dock-panel-title-${activeTab}`

  return (
    <>
      <button
        type="button"
        aria-label="Close panel backdrop"
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
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          background: 'var(--surface)',
          borderTop: '1px solid var(--border)',
          borderRadius: '6px 6px 0 0',
          maxHeight: 'min(82vh, 720px)',
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

        <PanelOverlayHeader activeTab={activeTab} onClose={onClose} titleId={titleId} />
        <PanelOverlayContent
          activeTab={activeTab}
          onOpenProjects={onOpenProjects}
          onOpenResearch={onOpenResearch}
        />
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

type GameAppHeaderProps = SituationBarShellProps & {
  isGameOver: boolean
}

type GameSceneProps = {
  isGameOver: boolean
  onLegacyNewGame: () => void
}

type GameDockProps = {
  activePanel: DockTab | null
  onTogglePanel: (id: DockTab) => void
}

type GameAppMainProps = GameSceneProps &
  GameDockProps & {
    onClosePanel: () => void
    onOpenResearch: () => void
    onOpenProjects: () => void
  }

type GameAppFrameProps = GameAppHeaderProps &
  Omit<GameAppMainProps, 'onOpenResearch' | 'onOpenProjects'> & {
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
      <MomentToast />
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
  inCampaignMode,
}: GameAppHeaderProps) {
  return (
    <>
      <SituationBar
        termLabel={termLabel}
        monthLabel={monthLabel}
        seasonLabel={seasonLabel}
        week={week}
        currentTerm={currentTerm}
        inCampaignMode={inCampaignMode}
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

function GameDock({ activePanel, onTogglePanel }: GameDockProps) {
  const state = useGameStore((store) => store)
  const badges = getDockBadges(state)

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
      {DOCK_TABS.map(({ id, label, Icon }) => (
        <Tab
          key={id}
          icon={<Icon size={18} />}
          label={label}
          active={activePanel === id}
          dataTour={`dock-${id}`}
          badge={badges[id]}
          ariaLabel={`Open ${label} panel`}
          onClick={() => onTogglePanel(id)}
        />
      ))}
    </div>
  )
}

function GameAppMain({
  isGameOver,
  onLegacyNewGame,
  activePanel,
  onTogglePanel,
  onClosePanel,
  onOpenResearch,
  onOpenProjects,
}: GameAppMainProps) {
  return (
    <>
      <GameScene isGameOver={isGameOver} onLegacyNewGame={onLegacyNewGame} />
      {!isGameOver && <GameDock activePanel={activePanel} onTogglePanel={onTogglePanel} />}
      <PanelOverlay
        activeTab={activePanel}
        onClose={onClosePanel}
        onOpenProjects={onOpenProjects}
        onOpenResearch={onOpenResearch}
      />
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
        activePanel={props.activePanel}
        onTogglePanel={props.onTogglePanel}
        onClosePanel={props.onClosePanel}
        onOpenResearch={props.onResearch}
        onOpenProjects={props.onProjects}
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
  const newspaperHeadline = useGameStore((s) => s.newspaperHeadline)
  const inCampaignMode = useGameStore((s) => s.inCampaignMode)

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
        onTogglePanel={handleTogglePanel}
        onClosePanel={() => setActivePanel(null)}
      />
    </>
  )
}
