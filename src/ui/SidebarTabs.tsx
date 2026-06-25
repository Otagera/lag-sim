import { useState } from 'react'
import { useGameStore } from '../state/gameStore'
import { BudgetPanel } from './BudgetPanel'
import { CabinetPanel } from './CabinetPanel'
import { DeputyPanel } from './DeputyPanel'
import { FactionPanel } from './FactionPanel'
import { Inbox } from './Inbox'
import { NPCPanel } from './NPCPanel'
import { PollPanel } from './PollPanel'
import { TimelinePanel } from './TimelinePanel'

type Tab = 'inbox' | 'factions' | 'people' | 'finance' | 'history'

interface TabDef {
  id: Tab
  label: string
  alert?: boolean
}

export function SidebarTabs() {
  const [activeTab, setActiveTab] = useState<Tab>('inbox')
  const factions = useGameStore((s) => s.factions)
  const inbox = useGameStore((s) => s.inbox)
  const unreadCount = inbox.filter((m) => !m.read).length
  const hasPendingGodfather = inbox.some((m) => m.isGodfatherAsk && !m.actioned)

  const tabs: TabDef[] = [
    { id: 'inbox', label: `Inbox${unreadCount > 0 ? ` (${unreadCount})` : ''}`, alert: hasPendingGodfather },
    { id: 'factions', label: 'Factions', alert: Object.values(factions).some((v) => v <= 25) },
    { id: 'people', label: 'People' },
    { id: 'finance', label: 'Finance' },
    { id: 'history', label: 'History' },
  ]

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      <div className="shrink-0 flex" style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--background)' }}>
        {tabs.map(({ id, label, alert }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className="relative flex-1 py-1.5 text-[10px] font-semibold uppercase tracking-wide transition-colors"
            style={{
              color: activeTab === id ? 'var(--text)' : 'var(--text-secondary)',
              borderBottom: activeTab === id ? '2px solid var(--accent-solid)' : '2px solid transparent',
            }}
          >
            {label}
            {alert && (
              <span
                className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: id === 'finance' ? 'var(--warning-9)' : 'var(--error-9)' }}
              />
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto min-h-0" style={{ backgroundColor: 'var(--background)' }}>
        {activeTab === 'inbox' && (
          <div className="p-2">
            <Inbox />
          </div>
        )}
        {activeTab === 'factions' && (
          <div className="p-2 space-y-2">
            <FactionPanel />
            <PollPanel />
          </div>
        )}
        {activeTab === 'people' && (
          <div className="p-2 space-y-2">
            <DeputyPanel />
            <NPCPanel />
            <CabinetPanel />
          </div>
        )}
        {activeTab === 'finance' && (
          <div className="p-2 space-y-2">
            <BudgetPanel />
          </div>
        )}
        {activeTab === 'history' && <TimelinePanel />}
      </div>
    </div>
  )
}
