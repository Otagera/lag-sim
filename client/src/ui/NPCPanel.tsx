import { NPC_ARCHETYPES } from '../data/npcs'
import { useGameStore } from '../state/gameStore'
import type { NPCKey, NPCState } from '../state/types'

const NPC_SLOTS: NPCKey[] = ['npc1', 'npc2', 'npc3']

function relationshipTier(rel: number): { label: string; color: string } {
  if (rel >= 65) return { label: 'Ally', color: 'var(--success-11)' }
  if (rel >= 30) return { label: 'Neutral', color: 'var(--warning-11)' }
  return { label: 'Hostile', color: 'var(--error-11)' }
}

function RelationshipBar({ value }: { value: number }) {
  const pct = Math.round(((value + 100) / 200) * 100)
  const color =
    value >= 65
      ? 'var(--success-9)'
      : value >= 30
        ? 'var(--warning-9)'
        : value >= 0
          ? 'var(--warning-11)'
          : 'var(--error-9)'
  return (
    <div className="h-1.5 w-full overflow-hidden" style={{ backgroundColor: 'var(--neutral-4)' }}>
      <div className="h-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  )
}

function PressureBar({ value }: { value: number }) {
  const pct = Math.min(100, value)
  const color = value >= 80 ? 'var(--error-9)' : value >= 40 ? 'var(--warning-9)' : 'var(--info-9)'
  return (
    <div className="h-1.5 w-full overflow-hidden" style={{ backgroundColor: 'var(--neutral-4)' }}>
      <div className="h-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  )
}

function NPCCard({ npc }: { npc: NPCState }) {
  const def = NPC_ARCHETYPES[npc.archetypeKey]
  const tier = relationshipTier(npc.relationship)

  return (
    <div
      className="p-2 border"
      style={{
        borderColor: npc.isActive ? 'var(--border)' : 'var(--border-subtle)',
        backgroundColor: npc.isActive ? 'var(--background)' : 'var(--surface)',
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold truncate" style={{ color: 'var(--text)' }}>
            {npc.name || '—'}
          </p>
          <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
            {def?.shortRole ?? npc.archetypeKey}
          </p>
        </div>
        <span
          className="shrink-0 text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5"
          style={{
            color: npc.isActive ? tier.color : 'var(--border-strong)',
            backgroundColor: 'var(--surface)',
          }}
        >
          {npc.isActive ? tier.label : 'Dormant'}
        </span>
      </div>

      {npc.isActive ? (
        <div className="space-y-1.5">
          {def?.goal && (
            <p className="text-[9px]" style={{ color: 'var(--text-secondary)' }}>
              Goal: <span style={{ color: 'var(--text)' }}>{def.goal}</span>
            </p>
          )}
          <div>
            <div
              className="flex justify-between text-[9px] mb-0.5"
              style={{ color: 'var(--text-secondary)' }}
            >
              <span>Relationship</span>
              <span>
                {npc.relationship > 0 ? '+' : ''}
                {npc.relationship.toFixed(0)}
              </span>
            </div>
            <RelationshipBar value={npc.relationship} />
          </div>
          <div>
            <div
              className="flex justify-between text-[9px] mb-0.5"
              style={{ color: 'var(--text-secondary)' }}
            >
              <span>Pressure</span>
              <span>{npc.pressure.toFixed(0)}</span>
            </div>
            <PressureBar value={npc.pressure} />
          </div>
        </div>
      ) : (
        <p className="text-[9px]" style={{ color: 'var(--border-strong)' }}>
          Watching. Not yet active.
        </p>
      )}
    </div>
  )
}

export function NPCPanel() {
  const activeNPCs = useGameStore((s) => s.activeNPCs)

  return (
    <div
      className="p-2 border"
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
    >
      <h3 className="label-caps mb-2">Political Actors</h3>
      <div className="space-y-2">
        {NPC_SLOTS.map((slot) => (
          <NPCCard key={slot} npc={activeNPCs[slot]} />
        ))}
      </div>
    </div>
  )
}
