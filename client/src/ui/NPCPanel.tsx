import { useState } from 'react'
import { NPC_ARCHETYPES } from '../data/npcs'
import { REASONS, type ReasonDefinition, renderReasonLine } from '../data/reasons'
import { type OpinionTier, TIER_LABEL, tierOf, topReasons } from '../engine/opinionEngine'
import { useGameStore } from '../state/gameStore'
import type { ActorMoveRecord, NPCKey, OpinionEntry } from '../state/types'
import { useShowNumbers } from './settings/showNumbers'

/**
 * Political Actors — who is for you, who is against you, and why.
 * Two presentations of the same facts (docs/political-actors.md §8):
 *   numbers view   — opinion score, pressure, ledger entries with values
 *   narrative view — tier word, mood, reasons as sentences
 */

const NPC_SLOTS: NPCKey[] = ['npc1', 'npc2', 'npc3']

const TIER_COLOR: Record<OpinionTier, string> = {
  hostile: 'var(--error-11)',
  wary: 'var(--warning-11)',
  cordial: 'var(--info-11)',
  allied: 'var(--success-11)',
}

const DECAY_TAG: Record<OpinionEntry['decay'], string> = {
  fast: 'fading fast',
  slow: 'fading',
  permanent: 'permanent',
}

function moodLine(tier: OpinionTier, pressure: number): string {
  if (tier === 'allied') return 'In your corner.'
  if (tier === 'cordial')
    return pressure >= 40 ? 'Friendly, but wants something.' : 'Willing to work with you.'
  if (pressure >= 70) return 'About to make a move against you.'
  if (pressure >= 40) return 'Building a case against you.'
  if (tier === 'hostile') return 'Watching for an opening.'
  return 'Keeping their distance.'
}

function weeksAgo(week: number, now: number): string {
  const d = now - week
  if (d <= 0) return 'this week'
  if (d === 1) return 'last week'
  if (d < 8) return `${d} weeks ago`
  return `${Math.round(d / 4.33)} months ago`
}

function reasonLabel(reason: string): string {
  return (REASONS as Record<string, ReasonDefinition>)[reason]?.label ?? reason
}

function Bar({
  value,
  min,
  max,
  color,
}: {
  value: number
  min: number
  max: number
  color: string
}) {
  const pct = Math.round(((value - min) / (max - min)) * 100)
  return (
    <div className="h-1.5 w-full overflow-hidden" style={{ backgroundColor: 'var(--neutral-4)' }}>
      <div className="h-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  )
}

function Ledger({
  ledger,
  name,
  week,
  showNumbers,
}: {
  ledger: OpinionEntry[]
  name: string
  week: number
  showNumbers: boolean
}) {
  const entries = topReasons(ledger)
  if (entries.length === 0)
    return (
      <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
        No history with you yet.
      </p>
    )

  if (showNumbers)
    return (
      <table className="w-full text-[10px]" style={{ color: 'var(--text)' }}>
        <tbody>
          {entries.map((e) => (
            <tr key={`${e.reason}-${e.week}-${e.source ?? ''}`} title={e.source}>
              <td className="py-0.5 pr-2">
                {reasonLabel(e.reason)}
                <span style={{ color: 'var(--text-secondary)' }}>
                  {' '}
                  · {DECAY_TAG[e.decay]}
                  {e.source ? ` · ${e.source}` : ''}
                </span>
              </td>
              <td
                className="py-0.5 text-right tabular-nums font-semibold"
                style={{ color: e.value < 0 ? 'var(--error-11)' : 'var(--success-11)' }}
              >
                {e.value > 0 ? '+' : ''}
                {e.value.toFixed(0)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )

  return (
    <ul className="space-y-1 text-[11px] leading-snug" style={{ color: 'var(--text)' }}>
      {entries.map((e) => (
        <li key={`${e.reason}-${e.week}-${e.source ?? ''}`}>
          {renderReasonLine(e.reason, name, e.source)}{' '}
          <span style={{ color: 'var(--text-secondary)' }}>({weeksAgo(e.week, week)})</span>
        </li>
      ))}
    </ul>
  )
}

function MeterRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex justify-between text-[9px] mb-0.5"
      style={{ color: 'var(--text-secondary)' }}
    >
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  )
}

function pressureColor(pressure: number): string {
  if (pressure >= 80) return 'var(--error-9)'
  if (pressure >= 40) return 'var(--warning-9)'
  return 'var(--info-9)'
}

function NumbersSummary({
  relationship,
  range,
  pressure,
  color,
}: {
  relationship: number
  range: [number, number]
  pressure?: number
  color: string
}) {
  const centre = (range[0] + range[1]) / 2
  const opinion = relationship - centre
  return (
    <>
      <div>
        <MeterRow label="Opinion" value={`${opinion > 0 ? '+' : ''}${opinion.toFixed(0)}`} />
        <Bar value={relationship} min={range[0]} max={range[1]} color={color} />
      </div>
      {pressure !== undefined && (
        <div>
          <MeterRow label="Pressure" value={pressure.toFixed(0)} />
          <Bar value={pressure} min={0} max={100} color={pressureColor(pressure)} />
        </div>
      )}
    </>
  )
}

function NarrativeSummary({
  name,
  mood,
  color,
  strongest,
}: {
  name: string
  mood: string
  color: string
  strongest?: OpinionEntry
}) {
  return (
    <>
      <p className="text-[11px] italic" style={{ color }}>
        {mood}
      </p>
      {strongest && (
        <p className="text-[11px] leading-snug" style={{ color: 'var(--text)' }}>
          {renderReasonLine(strongest.reason, name, strongest.source)}
        </p>
      )}
    </>
  )
}

function joinFactors(because: string[]): string {
  if (because.length <= 1) return because[0] ?? ''
  return `${because.slice(0, -1).join(', ')} and ${because[because.length - 1]}`
}

/** "Why now?" — the last move and the situation that triggered it. */
function LastMove({
  move,
  week,
  showNumbers,
}: {
  move: ActorMoveRecord
  week: number
  showNumbers: boolean
}) {
  const when = weeksAgo(move.week, week)
  if (showNumbers)
    return (
      <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
        Last move <span style={{ color: 'var(--text)' }}>{move.title}</span> · wk {move.week} ·
        score <span className="tabular-nums">{move.score.toFixed(2)}</span> vs bar{' '}
        <span className="tabular-nums">{move.threshold.toFixed(2)}</span>
        {move.because.length > 0 && <> · {move.because.join(' · ')}</>}
      </p>
    )
  return (
    <p className="text-[11px] leading-snug" style={{ color: 'var(--text-secondary)' }}>
      {when[0].toUpperCase() + when.slice(1)}:{' '}
      <span style={{ color: 'var(--text)' }}>{move.title}</span>
      {move.because.length > 0
        ? ` — they chose the moment because ${joinFactors(move.because)}.`
        : ' — pressure had been building.'}
    </p>
  )
}

type ActorCardProps = {
  name: string
  roleLabel: string
  motive?: string
  active: boolean
  relationship: number
  relationshipRange: [number, number]
  pressure?: number
  ledger: OpinionEntry[]
  lastMove?: ActorMoveRecord
  week: number
  showNumbers: boolean
}

function ActorCard({
  name,
  roleLabel,
  motive,
  active,
  relationship,
  relationshipRange,
  pressure,
  ledger,
  lastMove,
  week,
  showNumbers,
}: ActorCardProps) {
  const [open, setOpen] = useState(false)
  // Fashemu's 0..100 scale is centred on 50; NPCs' −100..100 on 0
  const centre = (relationshipRange[0] + relationshipRange[1]) / 2
  const tier = tierOf(relationship - centre)
  const color = TIER_COLOR[tier]
  const strongest = topReasons(ledger, 2)

  return (
    <div
      className="p-2 border"
      style={{
        borderColor: active ? 'var(--border)' : 'var(--border-subtle)',
        borderLeft: active ? `3px solid ${color}` : undefined,
        backgroundColor: active ? 'var(--background)' : 'var(--surface)',
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold truncate" style={{ color: 'var(--text)' }}>
            {name || '—'}
          </p>
          <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
            {roleLabel}
          </p>
        </div>
        <span
          className="shrink-0 text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5"
          style={{
            color: active ? color : 'var(--border-strong)',
            backgroundColor: 'var(--surface)',
          }}
        >
          {active ? TIER_LABEL[tier] : 'Dormant'}
        </span>
      </div>

      {!active ? (
        <p className="text-[9px]" style={{ color: 'var(--border-strong)' }}>
          Watching. Not yet active.
        </p>
      ) : (
        <div className="space-y-1.5">
          {motive && (
            <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
              Wants: <span style={{ color: 'var(--text)' }}>{motive}</span>
            </p>
          )}

          {showNumbers ? (
            <NumbersSummary
              relationship={relationship}
              range={relationshipRange}
              pressure={pressure}
              color={color}
            />
          ) : (
            <NarrativeSummary
              name={name}
              mood={moodLine(tier, pressure ?? 0)}
              color={color}
              strongest={open ? undefined : strongest[0]}
            />
          )}

          {lastMove && <LastMove move={lastMove} week={week} showNumbers={showNumbers} />}

          <button
            type="button"
            className="text-[10px] font-semibold underline"
            style={{ color: 'var(--accent-text)' }}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? 'Hide' : `Why? (${ledger.length})`}
          </button>
          {open && <Ledger ledger={ledger} name={name} week={week} showNumbers={showNumbers} />}
        </div>
      )}
    </div>
  )
}

export function NPCPanel() {
  const activeNPCs = useGameStore((s) => s.activeNPCs)
  const week = useGameStore((s) => s.week)
  const fashemuPhase = useGameStore((s) => s.fashemuPhase)
  const fashemuRelationship = useGameStore((s) => s.fashemuRelationship)
  const fashemuLedger = useGameStore((s) => s.fashemuLedger)
  const [showNumbers, setShowNumbers] = useShowNumbers()

  const fashemuVisible = fashemuPhase !== 'dormant' && fashemuPhase !== 'dead'

  return (
    <div
      className="p-2 border"
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
    >
      <div className="flex items-center justify-between mb-2 gap-2">
        <h3 className="label-caps">Political Actors</h3>
        <label
          className="flex items-center gap-1 text-[10px]"
          style={{ color: 'var(--text-secondary)' }}
        >
          <input
            type="checkbox"
            checked={showNumbers}
            onChange={(e) => setShowNumbers(e.target.checked)}
          />
          Show the numbers
        </label>
      </div>
      <div className="space-y-2">
        {fashemuVisible && (
          <ActorCard
            name="Chief Fashemu"
            roleLabel="Party Godfather"
            motive="Contracts, appointments, and the succession"
            active
            relationship={fashemuRelationship}
            relationshipRange={[0, 100]}
            ledger={fashemuLedger}
            week={week}
            showNumbers={showNumbers}
          />
        )}
        {NPC_SLOTS.map((slot) => {
          const npc = activeNPCs[slot]
          const def = NPC_ARCHETYPES[npc.archetypeKey]
          return (
            <ActorCard
              key={slot}
              name={npc.name}
              roleLabel={def?.shortRole ?? npc.archetypeKey}
              motive={def?.goal}
              active={npc.isActive}
              relationship={npc.relationship}
              relationshipRange={[-100, 100]}
              pressure={npc.pressure}
              ledger={npc.ledger}
              lastMove={npc.lastMove}
              week={week}
              showNumbers={showNumbers}
            />
          )
        })}
      </div>
    </div>
  )
}
