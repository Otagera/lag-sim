import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { AnalyticsTab } from './AnalyticsTab'
import { CloudSavesTab } from './CloudSavesTab'

const TABS = [
  { id: 'analytics', label: 'Analytics' },
  { id: 'cloud-saves', label: 'Cloud Saves' },
] as const

type TabId = (typeof TABS)[number]['id']

export function AdminDashboard() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabId>('analytics')

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--background)', color: 'var(--text)' }}
    >
      <header
        className="flex items-center justify-between px-4 py-2"
        style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate({ to: '/game' })}
            className="text-[10px] px-2 py-1 border"
            style={{
              borderColor: 'var(--border)',
              color: 'var(--text-secondary)',
              backgroundColor: 'var(--background)',
            }}
          >
            &larr; Game
          </button>
          <h1 className="text-[11px] font-bold" style={{ color: 'var(--warning-11)' }}>
            DEV DASHBOARD
          </h1>
        </div>
      </header>

      <div
        className="flex gap-0 px-4"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className="px-3 py-1.5 text-[10px] font-medium"
              style={{
                color: isActive ? 'var(--warning-11)' : 'var(--text-secondary)',
                borderBottom: isActive ? '2px solid var(--warning-11)' : '2px solid transparent',
                backgroundColor: 'transparent',
                transition: 'border-color 0.15s',
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      <main className="flex-1 p-4" style={{ maxWidth: 720 }}>
        {activeTab === 'analytics' && <AnalyticsTab />}
        {activeTab === 'cloud-saves' && <CloudSavesTab />}
      </main>
    </div>
  )
}
