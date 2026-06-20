import { useState } from 'react'
import { COMMISSIONER_CANDIDATES } from '../data/commissionerCandidates'
import { useGameStore } from '../state/gameStore'
import type { CommissionerRole, CommissionerState } from '../state/types'

const ROLE_LABELS: Record<CommissionerRole, string> = {
  works: 'Works & Infra',
  finance: 'Finance',
  environment: 'Environment',
  transport: 'Transport',
  information: 'Information',
}

const ALL_ROLES: CommissionerRole[] = ['works', 'finance', 'environment', 'transport', 'information']
const APPOINT_PC_COST = 8

function StatBar({ value, barColor }: { value: number; barColor: string }) {
  return (
    <div className="h-1 w-full overflow-hidden" style={{ backgroundColor: 'var(--neutral-4)' }}>
      <div className="h-full" style={{ width: `${value}%`, backgroundColor: barColor }} />
    </div>
  )
}

function CommissionerCard({ commissioner }: { role: CommissionerRole; commissioner: CommissionerState }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold truncate" style={{ color: 'var(--text)' }}>{commissioner.name}</p>
        {commissioner.isGodfatherChoice && (
          <span className="shrink-0 text-[8px] px-1 py-0.5 ml-1 border" style={{ color: 'var(--warning-11)', borderColor: 'var(--warning-9)', backgroundColor: 'var(--warning-3)' }}>
            GF Pick
          </span>
        )}
      </div>
      <div>
        <div className="flex justify-between text-[9px] mb-0.5" style={{ color: 'var(--text-secondary)' }}>
          <span>Competence</span><span>{commissioner.competence}</span>
        </div>
        <StatBar value={commissioner.competence} barColor="var(--info-9)" />
      </div>
      <div>
        <div className="flex justify-between text-[9px] mb-0.5" style={{ color: 'var(--text-secondary)' }}>
          <span>Loyalty</span><span>{commissioner.loyalty}</span>
        </div>
        <StatBar value={commissioner.loyalty} barColor={commissioner.loyalty >= 60 ? 'var(--success-9)' : 'var(--warning-9)'} />
      </div>
    </div>
  )
}

function RoleRow({ role }: { role: CommissionerRole }) {
  const commissioner = useGameStore((s) => s.commissioners[role])
  const politicalCapital = useGameStore((s) => s.stats.politicalCapital)
  const appointCommissioner = useGameStore((s) => s.appointCommissioner)
  const [selecting, setSelecting] = useState(false)

  const canAfford = politicalCapital >= APPOINT_PC_COST
  const candidates = COMMISSIONER_CANDIDATES[role]

  function handleAppoint(candidate: (typeof candidates)[number]) {
    const commState: CommissionerState = {
      name: candidate.name,
      competence: candidate.competence,
      loyalty: candidate.loyalty,
      isGodfatherChoice: false,
    }
    appointCommissioner(role, commState)
    setSelecting(false)
  }

  return (
    <div className="border p-2" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)' }}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="label-caps">{ROLE_LABELS[role]}</span>
        {!selecting && (
          <button
            type="button"
            onClick={() => setSelecting(true)}
            className="text-[9px] px-1.5 py-0.5 border transition-colors"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', backgroundColor: 'var(--surface)' }}
          >
            {commissioner ? 'Replace' : 'Appoint'}
          </button>
        )}
        {selecting && (
          <button
            type="button"
            onClick={() => setSelecting(false)}
            className="text-[9px] px-1.5 py-0.5 border"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', backgroundColor: 'var(--surface)' }}
          >
            Cancel
          </button>
        )}
      </div>

      {!selecting && commissioner && <CommissionerCard role={role} commissioner={commissioner} />}
      {!selecting && !commissioner && (
        <p className="text-[9px] italic" style={{ color: 'var(--border-strong)' }}>Vacant — no commissioner appointed</p>
      )}

      {selecting && (
        <div className="space-y-1.5">
          {!canAfford && (
            <p className="text-[9px]" style={{ color: 'var(--warning-11)' }}>Insufficient Pol. Capital (need {APPOINT_PC_COST})</p>
          )}
          {candidates.map((c) => (
            <button
              key={c.name}
              type="button"
              disabled={!canAfford}
              onClick={() => handleAppoint(c)}
              className="w-full text-left border p-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
              onMouseEnter={(e) => { if (canAfford) e.currentTarget.style.backgroundColor = 'var(--surface-hover)' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--surface)' }}
            >
              <div className="flex items-start justify-between gap-1">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold truncate" style={{ color: 'var(--text)' }}>{c.name}</p>
                  <p className="text-[9px] leading-tight" style={{ color: 'var(--text-secondary)' }}>{c.background}</p>
                </div>
                <div className="shrink-0 text-right text-[9px]" style={{ color: 'var(--text-secondary)' }}>
                  <div>C: {c.competence}</div>
                  <div>L: {c.loyalty}</div>
                </div>
              </div>
            </button>
          ))}
          <p className="text-[9px]" style={{ color: 'var(--text-secondary)' }}>Cost: {APPOINT_PC_COST} Pol. Capital</p>
        </div>
      )}
    </div>
  )
}

export function CabinetPanel() {
  const [open, setOpen] = useState(false)

  return (
    <div className="border p-2" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between"
      >
        <h3 className="label-caps">Cabinet</h3>
        <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="mt-2 space-y-2">
          {ALL_ROLES.map((role) => (
            <RoleRow key={role} role={role} />
          ))}
        </div>
      )}
    </div>
  )
}
