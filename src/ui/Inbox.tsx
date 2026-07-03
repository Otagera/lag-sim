import { useState } from 'react'
import { useGameStore } from '../state/gameStore'
import type { InboxMessage } from '../state/types'
import { AvatarMonogram } from './AvatarMonogram'
import { Tab } from './components'

const TONE_COLORS: Record<string, string> = {
  warm: 'var(--success-9)',
  cold: 'var(--info-11)',
  threatening: 'var(--error-9)',
  neutral: 'var(--border)',
  urgent: 'var(--warning-9)',
}

const TONE_LABELS: Record<string, string> = {
  warm: 'Good',
  cold: 'Cold',
  threatening: 'Threatening',
  neutral: 'Neutral',
  urgent: 'Urgent',
}

function MessageRow({
  msg,
  selected,
  onClick,
}: {
  msg: InboxMessage
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left"
      style={{
        backgroundColor: selected ? 'var(--accent-bg-subtle)' : 'transparent',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <div className="flex items-start gap-2 p-2">
        <AvatarMonogram charId={msg.from} size={28} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-semibold truncate" style={{ color: 'var(--text)' }}>
              {msg.fromLabel}
            </span>
            <span className="text-[8px] shrink-0" style={{ color: 'var(--text-secondary)' }}>
              Wk {msg.week}
            </span>
          </div>
          <p
            className="text-[9px] mt-0.5 truncate"
            style={{
              color: msg.read ? 'var(--text-secondary)' : 'var(--text)',
              fontWeight: msg.read ? 400 : 600,
            }}
          >
            {msg.subject}
          </p>
        </div>
        {!msg.read && (
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0 mt-1"
            style={{ backgroundColor: TONE_COLORS[msg.tone] ?? 'var(--accent-solid)' }}
          />
        )}
        {msg.isGodfatherAsk && !msg.actioned && (
          <span
            className="text-[9px] font-semibold shrink-0 mt-0.5"
            style={{ color: 'var(--error-9)' }}
          >
            ⚠
          </span>
        )}
      </div>
    </button>
  )
}

function MessageDetail({ msg, onBack }: { msg: InboxMessage; onBack: () => void }) {
  const borderColor = TONE_COLORS[msg.tone] ?? 'var(--border)'

  return (
    <div className="flex flex-col h-full">
      <button
        type="button"
        onClick={onBack}
        className="px-2 py-1.5 text-[10px] font-semibold text-left"
        style={{ color: 'var(--accent-text)', borderBottom: '1px solid var(--border-subtle)' }}
      >
        ← Back to inbox
      </button>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          <AvatarMonogram charId={msg.from} size={36} />
          <div className="flex-1 min-w-0">
            <h3 className="text-[12px] font-semibold" style={{ color: 'var(--text)' }}>
              {msg.fromLabel}
            </h3>
            <p className="text-[10px] font-medium mt-0.5" style={{ color: 'var(--text)' }}>
              {msg.subject}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[8px]" style={{ color: 'var(--text-secondary)' }}>
                Week {msg.week}
              </span>
              <span
                className="text-[8px] px-1 py-[1px] rounded-sm font-medium"
                style={{
                  backgroundColor: borderColor,
                  color: 'white',
                  opacity: 0.8,
                }}
              >
                {TONE_LABELS[msg.tone] ?? msg.tone}
              </span>
              {!msg.read && (
                <span className="text-[8px] font-semibold" style={{ color: 'var(--accent-solid)' }}>
                  New
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div
          className="p-2.5 rounded-sm text-[11px] leading-relaxed"
          style={{
            backgroundColor: 'var(--surface)',
            borderLeft: `3px solid ${borderColor}`,
          }}
        >
          {msg.body}
        </div>

        {/* Linked event — Respond button */}
        {msg.linkedEventId && (
          <div>
            <button
              type="button"
              onClick={onBack}
              className="w-full px-3 py-1.5 text-[11px] font-semibold transition-colors text-center"
              style={{ backgroundColor: 'var(--accent-solid)', color: 'var(--accent-on-solid)' }}
            >
              Respond
            </button>
          </div>
        )}

        {/* Pure presence — Mark Read */}
        {!msg.isGodfatherAsk && !msg.linkedEventId && msg.read === false && (
          <p className="text-[9px]" style={{ color: 'var(--text-secondary)' }}>
            This is an information-only message.
          </p>
        )}
      </div>
    </div>
  )
}

export function Inbox() {
  const inbox = useGameStore((s) => s.inbox)
  const inboxMarkRead = useGameStore((s) => s.inboxMarkRead)
  const inboxMarkAllRead = useGameStore((s) => s.inboxMarkAllRead)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')

  const sorted = [...inbox].sort((a, b) => b.week - a.week)
  const unreadCount = inbox.filter((m) => !m.read).length
  const selected = selectedId ? (inbox.find((m) => m.id === selectedId) ?? null) : null

  const filtered = sorted.filter((m) => {
    if (filter === 'unread') return !m.read
    if (filter === 'read') return m.read
    return true
  })

  function handleSelect(msg: InboxMessage) {
    setSelectedId(msg.id)
    if (!msg.read) {
      inboxMarkRead(msg.id)
    }
  }

  return (
    <div
      className="border flex flex-col"
      style={{
        borderColor: 'var(--border)',
        backgroundColor: 'var(--background)',
        minHeight: 200,
        maxHeight: 480,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-2 py-1.5 shrink-0"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <h2
          className="text-[10px] font-semibold uppercase tracking-wide"
          style={{ color: 'var(--text)' }}
        >
          Inbox
        </h2>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={inboxMarkAllRead}
            className="text-[8px] font-medium"
            style={{ color: 'var(--text-secondary)' }}
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <Tab label="All" active={filter === 'all'} onClick={() => setFilter('all')} />
        <Tab
          label="Unread"
          badge={unreadCount}
          active={filter === 'unread'}
          onClick={() => setFilter('unread')}
        />
        <Tab label="Read" active={filter === 'read'} onClick={() => setFilter('read')} />
      </div>

      {/* Content — selected takes priority so marking-read doesn't lose the view */}
      {selected ? (
        <MessageDetail msg={selected} onBack={() => setSelectedId(null)} />
      ) : filtered.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
            {filter === 'unread'
              ? 'No unread messages.'
              : filter === 'read'
                ? 'No read messages.'
                : 'No messages yet.'}
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {filtered.map((msg) => (
            <MessageRow key={msg.id} msg={msg} selected={false} onClick={() => handleSelect(msg)} />
          ))}
        </div>
      )}
    </div>
  )
}
