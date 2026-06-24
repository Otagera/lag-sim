import { useGameStore } from '../state/gameStore'
import { ALL_GOALS } from '../data/goals'
import { NPC_ARCHETYPES } from '../data/npcs'
import type { ArchetypeKey } from '../data/archetypes'

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
  const insolventWeeks = stats.expenditure > stats.igr
    ? Math.floor(stats.cashReserve / Math.max(0.1, stats.expenditure - stats.igr))
    : Infinity

  const npcSlots = (['npc1', 'npc2', 'npc3'] as const).map((slot) => {
    const npc = activeNPCs[slot]
    const def = NPC_ARCHETYPES[npc.archetypeKey]
    return { name: npc.name, role: def?.role ?? npc.archetypeKey }
  })

  const stateIssues: { label: string; detail: string; severity: 'high' | 'medium' }[] = []
  if (stats.cashReserve < 20)
    stateIssues.push({ label: 'Thin treasury', detail: `₦${stats.cashReserve.toFixed(0)}bn reserve — ${insolventWeeks === Infinity ? 'deficit spending' : `~${insolventWeeks} weeks of runway`}`, severity: 'high' })
  if (revenueGap > 0)
    stateIssues.push({ label: 'Revenue shortfall', detail: `₦${revenueGap.toFixed(1)}bn/wk gap to fixed costs`, severity: 'high' })
  if (factions.partyGodfathers < 40)
    stateIssues.push({ label: 'Godfather relations', detail: `At ${factions.partyGodfathers} — removal arc may trigger below 10`, severity: 'high' })
  if (stats.corruptionPressure > 45)
    stateIssues.push({ label: 'Corruption pressure', detail: `${stats.corruptionPressure.toFixed(0)}% — grant freeze risk above 75%`, severity: 'medium' })
  if (stats.youthTension > 50)
    stateIssues.push({ label: 'Youth restlessness', detail: `Tension at ${stats.youthTension.toFixed(0)} — riot mode above 70`, severity: 'medium' })
  if (stats.infrastructureScore < 35)
    stateIssues.push({ label: 'Crumbling infrastructure', detail: `Score ${stats.infrastructureScore.toFixed(0)}/100`, severity: 'medium' })
  if (stats.publicTrust < 35)
    stateIssues.push({ label: 'Public trust crisis', detail: `Only ${stats.publicTrust.toFixed(0)}%`, severity: 'high' })

  function handleClose() {
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
            <h2 className="label-caps mb-2" style={{ color: 'var(--error-11)' }}>State of the State — Critical Issues</h2>
            {stateIssues.length > 0 ? (
              <div className="space-y-1.5">
                {stateIssues.map((issue) => (
                  <div
                    key={issue.label}
                    className="flex items-center justify-between px-3 py-2 text-[11px] border"
                    style={{
                      borderColor: issue.severity === 'high' ? 'var(--error-9)' : 'var(--warning-9)',
                      backgroundColor: issue.severity === 'high' ? 'var(--error-3)' : 'var(--warning-3)',
                    }}
                  >
                    <span className="font-semibold" style={{ color: issue.severity === 'high' ? 'var(--error-11)' : 'var(--warning-11)' }}>
                      {issue.label}
                    </span>
                    <span style={{ color: issue.severity === 'high' ? 'var(--error-11)' : 'var(--warning-11)' }}>
                      {issue.detail}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px]" style={{ color: 'var(--success-11)' }}>
                No critical issues flagged — but Lagos always has surprises.
              </p>
            )}
          </section>

          <section>
            <h2 className="label-caps mb-2" style={{ color: 'var(--warning-11)' }}>Fiscal Snapshot</h2>
            <div className="p-3 space-y-1.5 text-[11px] border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-secondary)' }}>Revenue</span>
                <span className="font-medium" style={{ color: 'var(--success-11)' }}>₦{stats.igr.toFixed(1)}bn/wk</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-secondary)' }}>Fixed commitments</span>
                <span className="font-medium" style={{ color: 'var(--error-11)' }}>₦{weeklyFloor.toFixed(1)}bn/wk</span>
              </div>
              <div className="flex justify-between font-semibold pt-1" style={{ borderTop: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text)' }}>Net position</span>
                <span style={{ color: revenueGap > 0 ? 'var(--error-11)' : 'var(--success-11)' }}>
                  {revenueGap > 0 ? `−₦${revenueGap.toFixed(1)}bn` : 'balanced'}
                </span>
              </div>
            </div>
          </section>

          <section>
            <h2 className="label-caps mb-2" style={{ color: 'var(--info-11)' }}>Political Landscape</h2>
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
          </section>

          <section>
            <h2 className="label-caps mb-2" style={{ color: 'var(--accent-text)' }}>Who Is Watching</h2>
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

          <section>
            <h2 className="label-caps mb-2" style={{ color: 'var(--success-11)' }}>What You Could Fight For</h2>
            <p className="text-[11px] mb-2" style={{ color: 'var(--text-secondary)' }}>
              The challenges above will shape your term. Some governors choose a defining mission.
              The next screen will let you choose one — or govern without a fixed goal.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {ALL_GOALS.map((g) => (
                <div key={g.id} className="p-2 border text-[10px]" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
                  <p className="font-semibold" style={{ color: 'var(--text)' }}>{g.title}</p>
                  <p className="mt-0.5 leading-tight" style={{ color: 'var(--text-secondary)' }}>{g.pitch}</p>
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

        <div className="px-6 py-4 flex justify-between items-center" style={{ borderTop: '1px solid var(--border)' }}>
          <p className="text-[10px]" style={{ color: 'var(--border-strong)' }}>
            {stats.cashReserve < 0 ? 'Reserves: NEGATIVE' : `Reserves: ₦${stats.cashReserve.toFixed(0)}bn`}
          </p>
          <button
            type="button"
            onClick={handleClose}
            className="px-6 py-2 text-sm font-semibold transition-colors"
            style={{ backgroundColor: 'var(--accent-solid)', color: 'var(--accent-on-solid)' }}
          >
            Choose Your Mission
          </button>
        </div>
      </div>
    </div>
  )
}
