import { useGameStore } from '../state/gameStore'
import { ALL_GOALS } from '../data/goals'
import { NPC_ARCHETYPES } from '../data/npcs'
import { ARCHETYPES } from '../data/archetypes'
import type { ArchetypeKey } from '../data/archetypes'

const ARCHETYPE_COS_NOTE: Record<ArchetypeKey, string> = {
  technocrat:
    'Your reputation is built on delivery, sir. But the godfathers will test you in the first eight weeks. Every project award is a signal. Choose contractors carefully — or they will choose for you.',
  loyalist:
    'The party put you here, and the party expects returns. My job is to help you manage those expectations without losing the public entirely. We have room to manoeuvre, but corruption pressure is already high. Do not ignore it.',
  outsider:
    'The people are with you, but goodwill is not a budget line. Your treasury is thin and your party allies are zero. Every decision in the first three months will define whether this administration is a movement or a moment.',
}

const FACTION_LABELS: Record<string, string> = {
  businessCommunity: 'Business Community',
  informalEconomy:   'Informal Economy',
  partyGodfathers:   'Party Godfathers',
  federalGovt:       'Federal Government',
  civilSocietyMedia: 'Civil Society & Media',
  lgChairmen:        'LG Chairmen',
}

function factionColor(val: number): string {
  if (val >= 60) return 'var(--success-11)'
  if (val >= 35) return 'var(--warning-11)'
  return 'var(--error-11)'
}

function FactionBar({ label, value }: { label: string; value: number }) {
  const color = factionColor(value)
  const danger = value < 35
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px 12px', alignItems: 'center' }}>
      <div style={{ fontSize: '12px', fontFamily: 'Georgia, serif', color: danger ? 'var(--error-11)' : 'var(--text-secondary)' }}>
        {label}
      </div>
      <div style={{ fontSize: '12px', fontWeight: 600, fontFamily: "'Archivo Narrow', sans-serif", color, minWidth: '28px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
        {Math.round(value)}
      </div>
      <div style={{ gridColumn: '1 / -1', height: '3px', background: 'var(--border-subtle)', borderRadius: '2px' }}>
        <div style={{
          height: '100%',
          width: `${Math.max(0, Math.min(100, value))}%`,
          background: color,
          borderRadius: '2px',
          transition: 'width 600ms ease',
        }} />
      </div>
    </div>
  )
}

type Props = {
  onClose: () => void
  archetypeKey: ArchetypeKey
}

export function HandoverNotesModal({ onClose, archetypeKey }: Props) {
  const stats     = useGameStore((s) => s.stats)
  const factions  = useGameStore((s) => s.factions)
  const activeNPCs = useGameStore((s) => s.activeNPCs)

  const archetype     = ARCHETYPES[archetypeKey]
  const weeklyFloor   = 30.1
  const revenueGap    = weeklyFloor - stats.igr
  const net           = stats.igr - stats.expenditure
  const insolventWeeks = net < 0
    ? Math.floor(stats.cashReserve / Math.max(0.1, Math.abs(net)))
    : null

  const npcSlots = (['npc1', 'npc2', 'npc3'] as const).map((slot) => {
    const npc = activeNPCs[slot]
    const def = NPC_ARCHETYPES[npc.archetypeKey]
    return { name: npc.name, role: def?.role ?? npc.archetypeKey, relationship: npc.relationship }
  })

  const stateIssues: { label: string; detail: string; severity: 'critical' | 'elevated' }[] = []
  if (stats.cashReserve < 20)
    stateIssues.push({ label: 'Treasury at risk', detail: `₦${stats.cashReserve.toFixed(0)}bn — ${insolventWeeks != null ? `~${insolventWeeks} weeks runway` : 'deficit spending'}`, severity: 'critical' })
  if (revenueGap > 0)
    stateIssues.push({ label: 'Revenue shortfall', detail: `₦${revenueGap.toFixed(1)}bn/wk below fixed commitments`, severity: 'critical' })
  if (factions.partyGodfathers < 40)
    stateIssues.push({ label: 'Godfather relations', detail: `At ${Math.round(factions.partyGodfathers)} — removal arc triggers below 10`, severity: 'critical' })
  if (stats.corruptionPressure > 45)
    stateIssues.push({ label: 'Corruption pressure', detail: `${stats.corruptionPressure.toFixed(0)}% — grant freeze risk above 75%`, severity: 'elevated' })
  if (stats.youthTension > 50)
    stateIssues.push({ label: 'Youth restlessness', detail: `Tension at ${stats.youthTension.toFixed(0)} — riot mode above 70`, severity: 'elevated' })
  if (stats.infrastructureScore < 35)
    stateIssues.push({ label: 'Crumbling infrastructure', detail: `Score ${stats.infrastructureScore.toFixed(0)}/100`, severity: 'elevated' })
  if (stats.publicTrust < 35)
    stateIssues.push({ label: 'Public trust crisis', detail: `${stats.publicTrust.toFixed(0)}% — erosion already in progress`, severity: 'critical' })

  return (
    <div
      style={{
        position:   'fixed',
        inset:      0,
        zIndex:     50,
        background: 'var(--background)',
        overflowY:  'auto',
        display:    'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ maxWidth: '680px', width: '100%', margin: '0 auto', padding: '32px 24px 80px' }}>

        {/* ── Document header ─────────────────────────────────────────── */}
        <div style={{ marginBottom: '32px' }}>
          <div className="label-caps" style={{ color: 'var(--error-11)', letterSpacing: '0.12em', marginBottom: '12px' }}>
            Government of Lagos State · Restricted
          </div>

          {/* Signature rule */}
          <div style={{
            height: '1px',
            background: 'linear-gradient(to right, transparent, var(--accent-solid) 30%, transparent)',
            marginBottom: '14px',
          }} />

          <h1 className="font-display" style={{ fontSize: '28px', fontWeight: 600, lineHeight: 1.2, color: 'var(--text)', margin: 0 }}>
            Handover Notes
          </h1>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '15px', color: 'var(--text-secondary)', marginTop: '6px', marginBottom: 0 }}>
            Prepared for {archetype.name} · Chief of Staff, Government House Alausa
          </p>
        </div>

        {/* ── COS opening ─────────────────────────────────────────────── */}
        <div style={{
          borderLeft:  '3px solid var(--accent-solid)',
          paddingLeft: '16px',
          marginBottom:'32px',
        }}>
          <p style={{
            fontFamily:  'Georgia, serif',
            fontSize:    '15px',
            lineHeight:  1.75,
            color:       'var(--text)',
            fontStyle:   'italic',
            margin:      0,
          }}>
            "{ARCHETYPE_COS_NOTE[archetypeKey]}"
          </p>
          <p className="label-caps" style={{ marginTop: '8px', color: 'var(--accent-text)' }}>
            Chief of Staff — Week 1 Brief
          </p>
        </div>

        {/* ── Critical issues ─────────────────────────────────────────── */}
        {stateIssues.length > 0 && (
          <section style={{ marginBottom: '32px' }}>
            <SectionHeader label="Critical Issues" color="var(--error-11)" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {stateIssues.map((issue) => (
                <div
                  key={issue.label}
                  style={{
                    display:         'flex',
                    alignItems:      'baseline',
                    justifyContent:  'space-between',
                    gap:             '12px',
                    padding:         '9px 12px',
                    background:      issue.severity === 'critical' ? 'var(--error-3)' : 'var(--warning-3)',
                    borderLeft:      `3px solid ${issue.severity === 'critical' ? 'var(--error-9)' : 'var(--warning-9)'}`,
                    borderRadius:    '0 2px 2px 0',
                  }}
                >
                  <span style={{
                    fontFamily: "'Archivo Narrow', sans-serif",
                    fontSize:   '13px',
                    fontWeight: 600,
                    color:      issue.severity === 'critical' ? 'var(--error-11)' : 'var(--warning-11)',
                    whiteSpace: 'nowrap',
                  }}>{issue.label}</span>
                  <span style={{
                    fontFamily:  'Georgia, serif',
                    fontSize:    '12px',
                    color:       issue.severity === 'critical' ? 'var(--error-11)' : 'var(--warning-11)',
                    textAlign:   'right',
                  }}>{issue.detail}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Fiscal position ─────────────────────────────────────────── */}
        <section style={{ marginBottom: '32px' }}>
          <SectionHeader label="Fiscal Position" color="var(--accent-text)" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
            <FiscalStat label="Cash Reserve"      value={`₦${stats.cashReserve.toFixed(1)}bn`}  color={stats.cashReserve < 20 ? 'var(--error-11)' : 'var(--text)'} />
            <FiscalStat label="Weekly Revenue"    value={`₦${stats.igr.toFixed(1)}bn`}           color="var(--success-11)" />
            <FiscalStat label="Weekly Outgoings"  value={`₦${stats.expenditure.toFixed(1)}bn`}   color={net < 0 ? 'var(--error-11)' : 'var(--text)'} />
          </div>
          <div style={{
            padding:    '10px 12px',
            background: 'var(--surface)',
            border:     '1px solid var(--border)',
            borderRadius: '2px',
            display:    'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
          }}>
            <span style={{ fontFamily: "'Archivo Narrow', sans-serif", fontSize: '12px', color: 'var(--text-secondary)' }}>
              Net weekly position
            </span>
            <span style={{
              fontFamily: "'Archivo Narrow', sans-serif",
              fontSize:   '15px',
              fontWeight: 600,
              color:      net >= 0 ? 'var(--success-11)' : 'var(--error-11)',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {net >= 0 ? `+₦${net.toFixed(1)}bn` : `−₦${Math.abs(net).toFixed(1)}bn`}
              {insolventWeeks != null && (
                <span style={{ fontSize: '11px', fontWeight: 400, marginLeft: '8px', color: 'var(--error-9)' }}>
                  (~{insolventWeeks}w runway)
                </span>
              )}
            </span>
          </div>
        </section>

        {/* ── Political landscape ─────────────────────────────────────── */}
        <section style={{ marginBottom: '32px' }}>
          <SectionHeader label="Political Landscape" color="var(--warning-11)" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Object.entries(factions).map(([key, val]) => (
              <FactionBar key={key} label={FACTION_LABELS[key] ?? key} value={val as number} />
            ))}
          </div>
        </section>

        {/* ── Who is watching ─────────────────────────────────────────── */}
        <section style={{ marginBottom: '32px' }}>
          <SectionHeader label="Who Is Watching" color="var(--text-secondary)" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {npcSlots.map(({ name, role, relationship }) => (
              <div key={name} style={{
                display:    'flex',
                alignItems: 'center',
                gap:        '12px',
                padding:    '10px 12px',
                background: 'var(--surface)',
                border:     '1px solid var(--border)',
                borderRadius: '2px',
              }}>
                <div style={{
                  width:       '6px',
                  height:      '6px',
                  borderRadius:'50%',
                  flexShrink:  0,
                  background:  relationship >= 60 ? 'var(--success-9)' : relationship <= 30 ? 'var(--error-9)' : 'var(--border-strong)',
                }} />
                <div>
                  <span style={{ fontFamily: "'Archivo Narrow', sans-serif", fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                    {name}
                  </span>
                  <span style={{ fontFamily: 'Georgia, serif', fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '8px' }}>
                    — {role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Goals preview ───────────────────────────────────────────── */}
        <section style={{ marginBottom: '40px' }}>
          <SectionHeader label="What You Could Fight For" color="var(--success-11)" />
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '14px', lineHeight: 1.7, color: 'var(--text-secondary)', marginBottom: '14px' }}>
            Some governors define their term by a single mission. You can choose one on the next screen — or govern without a fixed goal.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
            {ALL_GOALS.map((g) => (
              <div key={g.id} style={{
                padding:    '10px 12px',
                background: 'var(--surface)',
                border:     '1px solid var(--border)',
                borderRadius: '2px',
              }}>
                <p style={{ fontFamily: "'Archivo Narrow', sans-serif", fontSize: '12px', fontWeight: 600, color: 'var(--text)', margin: '0 0 3px' }}>
                  {g.title}
                </p>
                <p style={{ fontFamily: 'Georgia, serif', fontSize: '11px', lineHeight: 1.5, color: 'var(--text-secondary)', margin: 0 }}>
                  {g.pitch}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Footer action ───────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'stretch' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              width:        '100%',
              padding:      '14px 24px',
              background:   'var(--accent-solid)',
              color:        'var(--accent-on-solid)',
              border:       'none',
              borderRadius: '2px',
              fontFamily:   "'Archivo Narrow', sans-serif",
              fontSize:     '15px',
              fontWeight:   600,
              letterSpacing:'0.03em',
              cursor:       'pointer',
            }}
          >
            Choose Your Mission →
          </button>
          <p className="label-caps" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
            Week 1 · Lagos State Government House · Alausa, Ikeja
          </p>
        </div>

      </div>
    </div>
  )
}

// ─── local helpers ────────────────────────────────────────────────────────────

function SectionHeader({ label, color }: { label: string; color: string }) {
  return (
    <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div className="label-caps" style={{ color, letterSpacing: '0.09em' }}>{label}</div>
      <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
    </div>
  )
}

function FiscalStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{
      padding:    '10px 12px',
      background: 'var(--surface)',
      border:     '1px solid var(--border)',
      borderRadius: '2px',
    }}>
      <div className="label-caps" style={{ marginBottom: '4px' }}>{label}</div>
      <div style={{
        fontFamily: "'Archivo Narrow', sans-serif",
        fontSize:   '16px',
        fontWeight: 600,
        color,
        fontVariantNumeric: 'tabular-nums',
      }}>{value}</div>
    </div>
  )
}
