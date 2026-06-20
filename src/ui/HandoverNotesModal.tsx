import { useGameStore } from '../state/gameStore'
import { NPC_ARCHETYPES } from '../data/npcs'
import type { ArchetypeKey } from '../data/archetypes'

const SEEN_KEY = 'lagos_handover_seen'

export function hasSeenHandover(): boolean {
  return localStorage.getItem(SEEN_KEY) === 'true'
}

function markHandoverSeen() {
  localStorage.setItem(SEEN_KEY, 'true')
}

const ARCHETYPE_COS_NOTE: Record<ArchetypeKey, string> = {
  technocrat:
    'Your reputation is built on delivery, sir. But the godfathers will test you in the first eight weeks. Every project award is a signal. Choose contractors carefully — or they will choose for you.',
  loyalist:
    'The party put you here, and the party expects returns. My job is to help you manage those expectations without losing the public entirely. We have room to manoeuvre, but corruption pressure is already high. Do not ignore it.',
  outsider:
    'The people are with you, but goodwill is not a budget line. Your treasury is thin and your party allies are zero. Every decision in the first three months will define whether this administration is a movement or a moment.',
}

type Props = {
  onClose: () => void
  archetypeKey: ArchetypeKey
}

export function HandoverNotesModal({ onClose, archetypeKey }: Props) {
  const stats = useGameStore((s) => s.stats)
  const factions = useGameStore((s) => s.factions)
  const activeNPCs = useGameStore((s) => s.activeNPCs)

  const weeklyFloor = 30.1
  const revenueGap = weeklyFloor - stats.igr

  const npcSlots = (['npc1', 'npc2', 'npc3'] as const).map((slot) => {
    const npc = activeNPCs[slot]
    const def = NPC_ARCHETYPES[npc.archetypeKey]
    return { name: npc.name, role: def?.role ?? npc.archetypeKey }
  })

  function handleClose() {
    markHandoverSeen()
    onClose()
  }

  function factionColor(val: number): string {
    if (val >= 60) return 'var(--success-11)'
    if (val >= 40) return 'var(--warning-11)'
    return 'var(--error-11)'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8 overflow-y-auto" style={{ backgroundColor: 'rgba(43,47,44,0.85)' }}>
      <div className="w-full max-w-2xl border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)' }}>
        <div
          className="px-6 py-4"
          style={{ borderBottom: '2px solid var(--accent-solid)' }}
        >
          <p className="label-caps">Government of Lagos State — Restricted</p>
          <h1 className="font-display text-lg font-semibold mt-1" style={{ color: 'var(--text)' }}>Handover Notes</h1>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Prepared by the Chief of Staff, Government House Alausa
          </p>
        </div>

        <div className="px-6 py-5 space-y-5">
          <section>
            <h2 className="label-caps mb-2" style={{ color: 'var(--warning-11)' }}>1. Fiscal Situation</h2>
            <div className="p-3 space-y-1.5 text-[11px] border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-secondary)' }}>Current weekly revenue</span>
                <span className="font-medium" style={{ color: 'var(--success-11)' }}>₦{stats.igr.toFixed(1)}bn</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-secondary)' }}>Fixed commitments (floor)</span>
                <span className="font-medium" style={{ color: 'var(--error-11)' }}>₦{weeklyFloor.toFixed(1)}bn</span>
              </div>
              <div className="flex justify-between font-semibold pt-1" style={{ borderTop: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text)' }}>Weekly shortfall</span>
                <span style={{ color: 'var(--error-11)' }}>₦{revenueGap.toFixed(1)}bn</span>
              </div>
            </div>
            <p className="text-[11px] mt-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              The fixed cost floor — civil servant salaries, overhead, subventions — is ₦30bn per week.
              Revenue must reach at least ₦35bn before this administration can invest freely.
              Priority levers: PAYE enforcement, Land Use Charge compliance, and reducing overhead drag
              through civil service reform.
            </p>
          </section>

          <section>
            <h2 className="label-caps mb-2" style={{ color: 'var(--info-11)' }}>2. Political Landscape</h2>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {Object.entries(factions).map(([key, val]) => {
                const label = key.replace(/([A-Z])/g, ' $1').trim()
                return (
                  <div key={key} className="flex justify-between px-2 py-1 border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
                    <span className="capitalize" style={{ color: 'var(--text-secondary)' }}>{label}</span>
                    <span className="font-medium" style={{ color: factionColor(val) }}>{val}</span>
                  </div>
                )
              })}
            </div>
            {factions.partyGodfathers < 50 && (
              <p className="text-[11px] mt-2" style={{ color: 'var(--error-11)' }}>
                ⚠ Party Godfathers are already below 50. Expect early pressure from the machine.
              </p>
            )}
            {factions.civilSocietyMedia < 40 && (
              <p className="text-[11px] mt-2" style={{ color: 'var(--warning-11)' }}>
                ⚠ Civil Society and media are lukewarm. You will not get the benefit of the doubt on early scandals.
              </p>
            )}
          </section>

          <section>
            <h2 className="label-caps mb-2" style={{ color: 'var(--accent-text)' }}>3. Known Political Actors</h2>
            <p className="text-[11px] mb-2" style={{ color: 'var(--text-secondary)' }}>
              Intelligence has identified three individuals who will react to your decisions.
              They are dormant now — but watching.
            </p>
            <div className="space-y-1.5">
              {npcSlots.map(({ name, role }) => (
                <div key={name} className="flex items-start gap-2 px-3 py-2 border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
                  <div className="shrink-0 w-1.5 h-1.5 rounded-full mt-1.5" style={{ backgroundColor: 'var(--border-strong)' }} />
                  <div>
                    <span className="text-[11px] font-medium" style={{ color: 'var(--text)' }}>{name}</span>
                    <span className="text-[10px] ml-2" style={{ color: 'var(--text-secondary)' }}>— {role}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
            <p className="label-caps mb-1">Chief of Staff</p>
            <p className="text-[12px] leading-relaxed italic" style={{ color: 'var(--text)' }}>
              "{ARCHETYPE_COS_NOTE[archetypeKey]}"
            </p>
          </section>
        </div>

        <div className="px-6 py-4 flex justify-end" style={{ borderTop: '1px solid var(--border)' }}>
          <button
            type="button"
            onClick={handleClose}
            className="px-6 py-2 text-sm font-semibold transition-colors"
            style={{ backgroundColor: 'var(--accent-solid)', color: 'var(--accent-on-solid)' }}
          >
            Begin Governing
          </button>
        </div>
      </div>
    </div>
  )
}
