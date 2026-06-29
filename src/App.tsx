import { useEffect, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Heart, Inbox as InboxIcon, DollarSign, Users, BarChart3, Landmark, Wallet, Zap, Vote } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { STARTING_STATE } from './data/startingState'
import { useGameStore } from './state/gameStore'
import { clearSave } from './state/persistence'
import { MediaRouter } from './ui/MediaRouter'
import { BudgetPanel } from './ui/BudgetPanel'
import { ResearchTree } from './ui/ResearchTree'
import { ProjectsPanel } from './ui/ProjectsPanel'
import { EventCard } from './ui/EventCard'
import { FactionPanel } from './ui/FactionPanel'
import { Inbox } from './ui/Inbox'
import { NPCPanel } from './ui/NPCPanel'
import { LegacyScreen } from './ui/LegacyScreen'
import { HelpReference } from './ui/HelpReference'
import 'driver.js/dist/driver.css'
import { ContextualHint } from './ui/ContextualHint'
import { GuidedTour } from './ui/GuidedTour'
import { ALL_HINTS } from './data/hints'
import { formatGameMonth } from './utils/calendar'
import { getSeasonModifier } from './engine/seasonEngine'
import { CabinetPanel } from './ui/CabinetPanel'
import { DeputyPanel } from './ui/DeputyPanel'
import { buildNewsPrompt, generateNewsText } from './engine/llmNews'
import { DiagnosisBanner } from './ui/game/DiagnosisBanner'
import { StateOfTheState } from './ui/game/StateOfTheState'
import { CampaignTracker } from './ui/CampaignTracker'
import { ElectionWatermark } from './ui/ElectionWatermark'
import { Tab } from './ui/components/Tab'
import { Stat } from './ui/components/Stat'
import { Seal } from './ui/components/Seal'

// ─── Dock destinations ────────────────────────────────────────────────────────
type DockTab = 'inbox' | 'economy' | 'factions' | 'people' | 'state' | 'election'

const DOCK_TABS: { id: DockTab; label: string; Icon: LucideIcon }[] = [
  { id: 'inbox',    label: 'Inbox',    Icon: InboxIcon  },
  { id: 'economy',  label: 'Economy',  Icon: DollarSign },
  { id: 'factions', label: 'Factions', Icon: Landmark   },
  { id: 'people',   label: 'People',   Icon: Users      },
  { id: 'state',    label: 'State',    Icon: BarChart3  },
  { id: 'election', label: 'Election', Icon: Vote       },
]

// ─── Status bar ───────────────────────────────────────────────────────────────
function StatusBar({
  termLabel, monthLabel, seasonLabel, week, onTick, canTick, onResearch, onProjects, onOpenReference,
}: {
  termLabel:   string
  monthLabel:  string
  seasonLabel: string
  week:        number
  onTick:      () => void
  canTick:     boolean
  onResearch:  () => void
  onProjects:  () => void
  onOpenReference: () => void
}) {
  const cashReserve       = useGameStore((s) => s.stats.cashReserve)
  const publicTrust       = useGameStore((s) => s.stats.publicTrust)
  const politicalCapital  = useGameStore((s) => s.stats.politicalCapital)

  const cashWarn  = cashReserve < 15
  const trustWarn = publicTrust < 40
  const pcWarn    = politicalCapital < 25

  return (
    <header
      className="themed status-bar"
      style={{
        display:         'flex',
        alignItems:      'center',
        gap:             'var(--status-bar-gap, 16px)',
        padding:         'var(--status-bar-padding, 8px 16px)',
        background:      'var(--surface)',
        borderBottom:    '1px solid var(--border)',
        boxShadow:       'var(--shadow-sm)',
        zIndex:          30,
        flexShrink:      0,
        transition:      'background-color var(--dur) ease, border-color var(--dur) ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <Seal size={28} />
        <div>
          <div className="font-display" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', lineHeight: 1.2 }}>
            Lagos Governor Sim
          </div>
          <div className="label-caps" style={{ marginTop: '1px', cursor: 'default' }} title={`Week ${week}`}>
            {termLabel} · {monthLabel} · <span style={{ color: 'var(--accent-text)' }}>{seasonLabel}</span>
          </div>
        </div>
      </div>

      <div className="status-bar-spacer" style={{ flex: 1 }} />

      <div className="status-bar-stats" style={{ display: 'flex', gap: 'var(--status-bar-stats-gap, 20px)', alignItems: 'center' }}>
        <Stat label="Treasury"  value={cashReserve}      format="currency" warn={cashWarn}  danger={cashReserve < 8}  title="Weekly revenue minus expenditure. Below 15bn triggers warnings; negative for 3+ weeks = bankruptcy." icon={Wallet} />
        <Stat label="Trust"     value={publicTrust}      format="percent"  warn={trustWarn} danger={publicTrust < 25} title="Public approval rating. Below 25% risks mass uprising if youth tension is high." icon={Heart} />
        <Stat label="Pol. Cap"  value={politicalCapital} warn={pcWarn}     danger={politicalCapital < 10} title="Political capital to spend on bold actions. Earned by wins; spent on hard choices." icon={Zap} />
      </div>

      <div className="status-bar-actions" style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
        <button
          type="button"
          onClick={onOpenReference}
          style={{
            background:   'none',
            border:       'none',
            borderRadius: '2px',
            width:        '24px',
            height:       '24px',
            fontSize:     '14px',
            fontWeight:   700,
            fontFamily:   "'Archivo Narrow', sans-serif",
            color:        'var(--text-secondary)',
            cursor:       'pointer',
            lineHeight:   1,
            display:      'flex',
            alignItems:   'center',
            justifyContent: 'center',
            opacity:      0.6,
          }}
          title="Quick Reference"
        >
          ?
        </button>
        <button
          type="button"
          onClick={onResearch}
          style={{
            background:   'transparent',
            border:       '1px solid var(--accent-solid)',
            borderRadius: '2px',
            padding:      '4px var(--status-bar-action-pad-x, 10px)',
            fontSize:     '11px',
            fontFamily:   "'Archivo Narrow', sans-serif",
            color:        'var(--accent-text)',
            cursor:       'pointer',
            whiteSpace:   'nowrap',
          }}
          title="Commission the Future"
        >
          Research
        </button>
        <button
          type="button"
          onClick={onProjects}
          style={{
            background:   'transparent',
            border:       '1px solid var(--accent-solid)',
            borderRadius: '2px',
            padding:      '4px var(--status-bar-action-pad-x, 10px)',
            fontSize:     '11px',
            fontFamily:   "'Archivo Narrow', sans-serif",
            color:        'var(--accent-text)',
            cursor:       'pointer',
            whiteSpace:   'nowrap',
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
              background:   'var(--accent-solid)',
              color:        'var(--accent-on-solid)',
              border:       'none',
              borderRadius: '2px',
              padding:      '6px var(--status-bar-next-pad-x, 16px)',
              fontSize:     '12px',
              fontWeight:   600,
              fontFamily:   "'Archivo Narrow', sans-serif",
              letterSpacing:'0.03em',
              cursor:       'pointer',
              transition:   'background-color 200ms ease',
              whiteSpace:   'nowrap',
            }}
          >
            Next Week
          </button>
        )}
      </div>
    </header>
  )
}

// ─── Panel overlay ────────────────────────────────────────────────────────────
function PanelOverlay({
  activeTab, onClose,
}: {
  activeTab: DockTab | null
  onClose:   () => void
}) {
  if (!activeTab) return null

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position:   'fixed', inset: 0, zIndex: 40,
          background: 'rgba(0,0,0,.32)',
          animation:  'backdrop-in 200ms ease forwards',
        }}
      />
      <div
        className="themed"
        style={{
          position:     'fixed', bottom: 0, left: 0, right: 0,
          zIndex:       50,
          background:   'var(--surface)',
          borderTop:    '1px solid var(--border)',
          borderRadius: '6px 6px 0 0',
          maxHeight:    'min(80vh, 640px)',
          display:      'flex',
          flexDirection:'column',
          animation:    'panel-up 280ms cubic-bezier(.16,1,.3,1) forwards',
          boxShadow:    'var(--shadow-atm)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 16px 0', flexShrink: 0 }}>
          <div style={{ width: '32px', height: '4px', borderRadius: '2px', background: 'var(--border-strong)' }} />
        </div>

        <div style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          padding:        '8px 16px',
          borderBottom:   '1px solid var(--border)',
          flexShrink:     0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {(() => { const tab = DOCK_TABS.find((t) => t.id === activeTab); return tab ? <tab.Icon size={15} style={{ color: 'var(--accent-solid)' }} /> : null })()}
            <span style={{ fontSize: '13px', fontWeight: 600, fontFamily: "'Archivo Narrow', sans-serif", color: 'var(--text)' }}>
              {DOCK_TABS.find((t) => t.id === activeTab)?.label}
            </span>
          </div>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'var(--text-secondary)', fontSize: '20px', lineHeight: 1, padding: '0 4px',
          }}>×</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {activeTab === 'inbox'    && <div style={{ padding: '12px' }}><Inbox /></div>}
          {activeTab === 'economy'  && <div style={{ padding: '12px' }}><BudgetPanel /></div>}
          {activeTab === 'factions' && <div style={{ padding: '12px' }}><FactionPanel /></div>}
          {activeTab === 'people'   && (
            <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <DeputyPanel />
              <NPCPanel />
              <CabinetPanel />
            </div>
          )}
          {activeTab === 'state' && <StateOfTheState />}
          {activeTab === 'election' && <div style={{ padding: '12px' }}><CampaignTracker /></div>}
        </div>
      </div>
    </>
  )
}

// ─── Game layout (route /game) ────────────────────────────────────────────────
export default function GameApp() {
  const navigate        = useNavigate()
  const tick            = useGameStore((s) => s.tick)
  const isGameOver      = useGameStore((s) => s.isGameOver)
  const week            = useGameStore((s) => s.week)
  const currentTerm     = useGameStore((s) => s.currentTerm)
  const factions        = useGameStore((s) => s.factions)
  const activeGodfatherMessage = useGameStore((s) => s.activeGodfatherMessage)
  const newspaperHeadline     = useGameStore((s) => s.newspaperHeadline)
  const inCampaignMode  = useGameStore((s) => s.inCampaignMode)
  const inbox           = useGameStore((s) => s.inbox)

  const hintQueue       = useGameStore((s) => s.hintQueue)
  const seenHints       = useGameStore((s) => s.seenHints)
  const dismissHint     = useGameStore((s) => s.dismissHint)
  const llmAttempted = useRef(new Set<string>())
  const [showResearch,  setShowResearch]  = useState(false)
  const [showProjects,  setShowProjects]  = useState(false)
  const [showReference, setShowReference] = useState(false)
  const [activePanel,   setActivePanel]   = useState<DockTab | null>(null)
  const [currentHint,   setCurrentHint]   = useState<string | null>(null)

  // Pop next hint from queue when none is showing
  useEffect(() => {
    if (currentHint || hintQueue.length === 0) return
    const nextId = hintQueue[0]
    setCurrentHint(nextId)
  }, [currentHint, hintQueue])

  function handleDismissHint() {
    if (!currentHint) return
    dismissHint(currentHint)
    setCurrentHint(null)
  }

  useEffect(() => {
    if (!newspaperHeadline || newspaperHeadline.llmGenerated || newspaperHeadline.llmPending) return
    if (llmAttempted.current.has(newspaperHeadline.headline)) return
    llmAttempted.current.add(newspaperHeadline.headline)
    useGameStore.setState((s) => ({
      newspaperHeadline: s.newspaperHeadline
        ? { ...s.newspaperHeadline, llmPending: true }
        : undefined,
    }))
    const prompt = buildNewsPrompt(newspaperHeadline, week, inCampaignMode, currentTerm)
    generateNewsText(prompt).then((llmText) => {
      if (llmText) {
        useGameStore.getState().enrichNewspaperHeadline(newspaperHeadline.headline, llmText)
      } else {
        useGameStore.setState((s) => ({
          newspaperHeadline: s.newspaperHeadline
            ? { ...s.newspaperHeadline, llmPending: false }
            : undefined,
        }))
      }
    })
  }, [newspaperHeadline?.headline, newspaperHeadline?.llmGenerated, newspaperHeadline?.llmPending])

  function handleLegacyNewGame() {
    clearSave()
    useGameStore.setState({ ...STARTING_STATE })
    navigate({ to: '/', replace: true })
  }

  const termBaseWeek = currentTerm === 2 ? week - 208 : week
  const year         = Math.ceil(termBaseWeek / 52)
  const YEARS        = ['Year 1', 'Year 2', 'Year 3', 'Year 4'] as const
  const termLabel    = currentTerm === 2
    ? `Second Term · Year ${year + 4}`
    : `First Term · ${YEARS[Math.min(year - 1, YEARS.length - 1)]}`
  const monthLabel   = formatGameMonth(week)
  const seasonLabel  = getSeasonModifier(week).label

  const inboxCount   = inbox.filter((m) => !m.read).length + (activeGodfatherMessage ? 1 : 0)
  const factionAlert = Object.values(factions).some((v) => v <= 25)

  const hintDef = currentHint ? ALL_HINTS.find((h) => h.id === currentHint) : null

  return (
    <>
      {newspaperHeadline && <MediaRouter />}
      {hintDef && <ContextualHint hint={hintDef} onDismiss={handleDismissHint} />}
      <GuidedTour seen={seenHints} onComplete={() => dismissHint('onboarding-tour')} />
      {showResearch && <ResearchTree onClose={() => setShowResearch(false)} />}
      {showProjects && <ProjectsPanel onClose={() => setShowProjects(false)} />}
      {inCampaignMode && <ElectionWatermark />}

      <div
        className="themed"
        style={{
          display:       'flex',
          flexDirection: 'column',
          height:        '100dvh',
          overflow:      'hidden',
          background:    'var(--background)',
          color:         'var(--text)',
        }}
      >
        {showReference && <HelpReference onClose={() => setShowReference(false)} />}
        <StatusBar
          termLabel={termLabel}
          monthLabel={monthLabel}
          seasonLabel={seasonLabel}
          week={week}
          onTick={tick}
          canTick={!isGameOver}
          onResearch={() => setShowResearch(true)}
          onProjects={() => setShowProjects(true)}
          onOpenReference={() => setShowReference(true)}
        />

        <div style={{ height: '2px', background: 'var(--border-subtle)', flexShrink: 0 }}>
          <div style={{
            height:     '100%',
            width:      `${Math.min(((currentTerm === 2 ? week - 208 : week) / 208) * 100, 100)}%`,
            background: 'var(--accent-solid)',
            transition: 'width 600ms ease',
          }} />
        </div>

        <DiagnosisBanner />

        {inCampaignMode && !isGameOver && (
          <div style={{
            textAlign:     'center',
            padding:       '4px 12px',
            fontSize:      '10px',
            fontFamily:    "'Archivo Narrow', sans-serif",
            fontWeight:    600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            background:    'var(--accent-bg-subtle)',
            color:         'var(--accent-text)',
            borderBottom:  '1px solid var(--border)',
            flexShrink:    0,
          }}>
            Election Campaign — Week {week} · Every decision counts
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {isGameOver ? (
            <LegacyScreen onNewGame={handleLegacyNewGame} />
          ) : (
            <div className="event-card-area" style={{
              maxWidth:      '720px',
              margin:        '0 auto',
              padding:       '16px 16px 80px',
              display:       'flex',
              flexDirection: 'column',
              gap:           '12px',
            }}>
              <EventCard />
            </div>
          )}
        </div>

        {!isGameOver && (
          <div
            className="themed"
            style={{
              position:      'fixed',
              bottom:        0,
              left:          0,
              right:         0,
              zIndex:        30,
              display:       'flex',
              background:    'var(--surface)',
              borderTop:     '1px solid var(--border)',
              boxShadow:     '0 -4px 20px rgba(0,0,0,.08)',
              flexShrink:    0,
              paddingBottom: 'env(safe-area-inset-bottom)',
              transition:    'background-color var(--dur) ease, border-color var(--dur) ease',
            }}
          >
            {DOCK_TABS.filter((t) => t.id !== 'election' || inCampaignMode).map(({ id, label, Icon }) => (
              <Tab
                key={id}
                icon={<Icon size={18} />}
                label={label}
                active={activePanel === id}
                dataTour={`dock-${id}`}
                badge={
                  id === 'inbox'    ? inboxCount :
                  id === 'factions' ? (factionAlert ? 1 : 0) : 0
                }
                onClick={() => setActivePanel(activePanel === id ? null : id)}
              />
            ))}
          </div>
        )}

        <PanelOverlay
          activeTab={activePanel}
          onClose={() => setActivePanel(null)}
        />
      </div>
    </>
  )
}
