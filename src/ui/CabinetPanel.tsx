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

function StatBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-1 w-full bg-gray-700 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full`} style={{ width: `${value}%` }} />
    </div>
  )
}

function CommissionerCard({ role, commissioner }: { role: CommissionerRole; commissioner: CommissionerState }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold text-white truncate">{commissioner.name}</p>
        {commissioner.isGodfatherChoice && (
          <span className="shrink-0 text-[8px] bg-yellow-900/60 text-yellow-400 border border-yellow-700/50 px-1 py-0.5 rounded ml-1">
            GF Pick
          </span>
        )}
      </div>
      <div>
        <div className="flex justify-between text-[9px] text-gray-500 mb-0.5">
          <span>Competence</span><span>{commissioner.competence}</span>
        </div>
        <StatBar value={commissioner.competence} color="bg-blue-500" />
      </div>
      <div>
        <div className="flex justify-between text-[9px] text-gray-500 mb-0.5">
          <span>Loyalty</span><span>{commissioner.loyalty}</span>
        </div>
        <StatBar value={commissioner.loyalty} color={commissioner.loyalty >= 60 ? 'bg-green-500' : 'bg-orange-500'} />
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
    <div className="rounded border border-gray-700 bg-gray-800/40 p-2">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-semibold text-gray-300 uppercase tracking-wide">
          {ROLE_LABELS[role]}
        </span>
        {!selecting && (
          <button
            type="button"
            onClick={() => setSelecting(true)}
            className="text-[9px] px-1.5 py-0.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
          >
            {commissioner ? 'Replace' : 'Appoint'}
          </button>
        )}
        {selecting && (
          <button
            type="button"
            onClick={() => setSelecting(false)}
            className="text-[9px] px-1.5 py-0.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-400 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>

      {!selecting && commissioner && <CommissionerCard role={role} commissioner={commissioner} />}
      {!selecting && !commissioner && (
        <p className="text-[9px] text-gray-600 italic">Vacant — no commissioner appointed</p>
      )}

      {selecting && (
        <div className="space-y-1.5">
          {!canAfford && (
            <p className="text-[9px] text-orange-400">Insufficient Pol. Capital (need {APPOINT_PC_COST})</p>
          )}
          {candidates.map((c) => (
            <button
              key={c.name}
              type="button"
              disabled={!canAfford}
              onClick={() => handleAppoint(c)}
              className="w-full text-left rounded border border-gray-600 bg-gray-700/50 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed p-1.5 transition-colors"
            >
              <div className="flex items-start justify-between gap-1">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold text-white truncate">{c.name}</p>
                  <p className="text-[9px] text-gray-400 leading-tight">{c.background}</p>
                </div>
                <div className="shrink-0 text-right text-[9px] text-gray-400">
                  <div>C: {c.competence}</div>
                  <div>L: {c.loyalty}</div>
                </div>
              </div>
            </button>
          ))}
          <p className="text-[9px] text-gray-600">Cost: {APPOINT_PC_COST} Pol. Capital</p>
        </div>
      )}
    </div>
  )
}

export function CabinetPanel() {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 p-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between"
      >
        <h3 className="text-xs font-bold text-gray-200">Cabinet</h3>
        <span className="text-[10px] text-gray-500">{open ? '▲' : '▼'}</span>
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
