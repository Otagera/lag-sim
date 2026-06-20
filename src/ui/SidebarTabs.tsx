import { useState } from 'react'
import { useGameStore } from '../state/gameStore'
import { BudgetPanel } from './BudgetPanel'
import { CabinetPanel } from './CabinetPanel'
import { DeputyPanel } from './DeputyPanel'
import { FactionPanel } from './FactionPanel'
import { GodfatherInbox } from './GodfatherInbox'
import { NPCPanel } from './NPCPanel'
import { PollPanel } from './PollPanel'
import { TimelinePanel } from './TimelinePanel'

type Tab = 'factions' | 'people' | 'finance' | 'history'

interface TabDef {
  id: Tab
  label: string
  alert?: boolean
}

export function SidebarTabs() {
  const [activeTab, setActiveTab] = useState<Tab>('factions')
  const factions = useGameStore((s) => s.factions)
  const activeGodfatherMessage = useGameStore((s) => s.activeGodfatherMessage)

  const tabs: TabDef[] = [
    { id: 'factions', label: 'Factions', alert: Object.values(factions).some((v) => v <= 25) },
    { id: 'people', label: 'People' },
    { id: 'finance', label: 'Finance', alert: activeGodfatherMessage !== null },
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

      <div className="flex-1 overflow-y-auto min-h-0 p-2 space-y-2" style={{ backgroundColor: 'var(--background)' }}>
        {activeTab === 'factions' && (
          <>
            <FactionPanel />
            <PollPanel />
          </>
        )}
        {activeTab === 'people' && (
          <>
            <DeputyPanel />
            <NPCPanel />
            <CabinetPanel />
          </>
        )}
        {activeTab === 'finance' && (
          <>
            <GodfatherInbox />
            <BudgetPanel />
          </>
        )}
        {activeTab === 'history' && <TimelinePanel />}
      </div>
    </div>
  )
}
