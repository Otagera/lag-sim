import { useGameStore } from '../state/gameStore'
import { NPC_ARCHETYPES } from '../data/npcs'
import type { NPCKey, NPCState } from '../state/types'

const NPC_SLOTS: NPCKey[] = ['npc1', 'npc2', 'npc3']

function relationshipTier(rel: number): { label: string; color: string } {
  if (rel >= 65) return { label: 'Ally', color: 'text-green-400' }
  if (rel >= 30) return { label: 'Neutral', color: 'text-yellow-400' }
  return { label: 'Hostile', color: 'text-red-400' }
}

function RelationshipBar({ value }: { value: number }) {
  // value: -100 to 100; display as 0-100%
  const pct = Math.round(((value + 100) / 200) * 100)
  const color =
    value >= 65 ? 'bg-green-500' : value >= 30 ? 'bg-yellow-500' : value >= 0 ? 'bg-orange-500' : 'bg-red-600'
  return (
    <div className="h-1.5 w-full bg-gray-700 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
    </div>
  )
}

function PressureBar({ value }: { value: number }) {
  const pct = Math.min(100, value)
  const color = value >= 80 ? 'bg-red-500' : value >= 40 ? 'bg-orange-500' : 'bg-blue-500'
  return (
    <div className="h-1.5 w-full bg-gray-700 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
    </div>
  )
}

function NPCCard({ npc }: { npc: NPCState }) {
  const def = NPC_ARCHETYPES[npc.archetypeKey]
  const tier = relationshipTier(npc.relationship)

  return (
    <div className={`rounded-lg border p-2 ${npc.isActive ? 'border-gray-600 bg-gray-800/50' : 'border-gray-700 bg-gray-800/20'}`}>
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-white truncate">{npc.name || '—'}</p>
          <p className="text-[10px] text-gray-400">{def?.shortRole ?? npc.archetypeKey}</p>
        </div>
        <span
          className={`shrink-0 text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ${
            npc.isActive ? `${tier.color} bg-gray-700` : 'text-gray-600 bg-gray-800'
          }`}
        >
          {npc.isActive ? tier.label : 'Dormant'}
        </span>
      </div>

      {npc.isActive ? (
        <div className="space-y-1.5">
          <div>
            <div className="flex justify-between text-[9px] text-gray-500 mb-0.5">
              <span>Relationship</span>
              <span>{npc.relationship > 0 ? '+' : ''}{npc.relationship.toFixed(0)}</span>
            </div>
            <RelationshipBar value={npc.relationship} />
          </div>
          <div>
            <div className="flex justify-between text-[9px] text-gray-500 mb-0.5">
              <span>Pressure</span>
              <span>{npc.pressure.toFixed(0)}</span>
            </div>
            <PressureBar value={npc.pressure} />
          </div>
        </div>
      ) : (
        <p className="text-[9px] text-gray-600">Watching. Not yet active.</p>
      )}
    </div>
  )
}

export function NPCPanel() {
  const activeNPCs = useGameStore((s) => s.activeNPCs)

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 p-3">
      <h3 className="text-xs font-bold text-gray-200 mb-2">Political Actors</h3>
      <div className="space-y-2">
        {NPC_SLOTS.map((slot) => (
          <NPCCard key={slot} npc={activeNPCs[slot]} />
        ))}
      </div>
    </div>
  )
}
