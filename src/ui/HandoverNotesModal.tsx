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

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center px-4 py-8 overflow-y-auto">
      <div className="w-full max-w-2xl bg-gray-900 border border-gray-700 rounded-xl shadow-2xl">
        {/* Header */}
        <div className="border-b border-gray-700 px-6 py-4">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-0.5">
            Government of Lagos State — Restricted
          </p>
          <h1 className="text-lg font-bold text-white">Handover Notes</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Prepared by the Chief of Staff, Government House Alausa
          </p>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Fiscal situation */}
          <section>
            <h2 className="text-xs font-semibold text-amber-400 uppercase tracking-wide mb-2">
              1. Fiscal Situation
            </h2>
            <div className="rounded bg-gray-800 p-3 space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-gray-400">Current weekly revenue</span>
                <span className="text-green-400 font-medium">₦{stats.igr.toFixed(1)}bn</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Fixed commitments (floor)</span>
                <span className="text-red-400 font-medium">₦{weeklyFloor.toFixed(1)}bn</span>
              </div>
              <div className="border-t border-gray-700 pt-1 flex justify-between font-semibold">
                <span className="text-gray-300">Weekly shortfall</span>
                <span className="text-red-400">₦{revenueGap.toFixed(1)}bn</span>
              </div>
            </div>
            <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
              The fixed cost floor — civil servant salaries, overhead, subventions — is ₦30bn per week.
              Revenue must reach at least ₦35bn before this administration can invest freely.
              Priority levers: PAYE enforcement, Land Use Charge compliance, and reducing overhead drag
              through civil service reform.
            </p>
          </section>

          {/* Political landscape */}
          <section>
            <h2 className="text-xs font-semibold text-blue-400 uppercase tracking-wide mb-2">
              2. Political Landscape
            </h2>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {Object.entries(factions).map(([key, val]) => {
                const label = key.replace(/([A-Z])/g, ' $1').trim()
                const color = val >= 60 ? 'text-green-400' : val >= 40 ? 'text-yellow-400' : 'text-red-400'
                return (
                  <div key={key} className="flex justify-between rounded bg-gray-800 px-2 py-1">
                    <span className="text-gray-400 capitalize">{label}</span>
                    <span className={`font-medium ${color}`}>{val}</span>
                  </div>
                )
              })}
            </div>
            {factions.partyGodfathers < 50 && (
              <p className="text-[11px] text-red-400 mt-2">
                ⚠ Party Godfathers are already below 50. Expect early pressure from the machine.
              </p>
            )}
            {factions.civilSocietyMedia < 40 && (
              <p className="text-[11px] text-amber-400 mt-2">
                ⚠ Civil Society and media are lukewarm. You will not get the benefit of the doubt on early scandals.
              </p>
            )}
          </section>

          {/* Known actors */}
          <section>
            <h2 className="text-xs font-semibold text-purple-400 uppercase tracking-wide mb-2">
              3. Known Political Actors
            </h2>
            <p className="text-[11px] text-gray-400 mb-2">
              Intelligence has identified three individuals who will react to your decisions.
              They are dormant now — but watching.
            </p>
            <div className="space-y-1.5">
              {npcSlots.map(({ name, role }) => (
                <div key={name} className="flex items-start gap-2 rounded bg-gray-800 px-3 py-2">
                  <div className="shrink-0 w-1.5 h-1.5 rounded-full bg-gray-500 mt-1.5" />
                  <div>
                    <span className="text-[11px] font-medium text-white">{name}</span>
                    <span className="text-[10px] text-gray-500 ml-2">— {role}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* CoS advice */}
          <section className="border-t border-gray-700 pt-4">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Chief of Staff</p>
            <p className="text-[12px] text-gray-300 leading-relaxed italic">
              "{ARCHETYPE_COS_NOTE[archetypeKey]}"
            </p>
          </section>
        </div>

        <div className="border-t border-gray-700 px-6 py-4 flex justify-end">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg bg-blue-700 hover:bg-blue-600 px-6 py-2 text-sm font-semibold text-white transition-colors"
          >
            Begin Governing
          </button>
        </div>
      </div>
    </div>
  )
}
