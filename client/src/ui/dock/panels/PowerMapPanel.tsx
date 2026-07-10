import { useGameStore } from '../../../state/gameStore'
import { CabinetPanel } from '../../CabinetPanel'
import { DeputyPanel } from '../../DeputyPanel'
import { FactionPanel } from '../../FactionPanel'
import { NPCPanel } from '../../NPCPanel'
import { CommandPanel } from '../CommandPanel'
import { CommandSection } from '../CommandSection'

const TOTAL_COMMISSIONER_ROLES = 5

function SignalCard({
  label,
  value,
  detail,
}: {
  label: string
  value: string | number
  detail: string
}) {
  return (
    <div
      style={{
        border: '1px solid var(--border)',
        padding: '12px',
        background: 'var(--background)',
      }}
    >
      <div className="label-caps" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </div>
      <div style={{ marginTop: '6px', fontSize: '24px', fontWeight: 700, color: 'var(--text)' }}>
        {value}
      </div>
      <p style={{ margin: '6px 0 0', fontSize: '11px', color: 'var(--text-secondary)' }}>
        {detail}
      </p>
    </div>
  )
}

export function PowerMapPanel() {
  const factions = useGameStore((state) => state.factions)
  const activeNPCs = useGameStore((state) => state.activeNPCs)
  const deputy = useGameStore((state) => state.deputy)
  const commissioners = useGameStore((state) => state.commissioners)
  const federalRelationship = useGameStore((state) => state.stats.federalRelationship)

  const angryFactions = Object.values(factions).filter((value) => value <= 25).length
  const hostileActors = Object.values(activeNPCs).filter(
    (npc) => npc.isActive && (npc.pressure >= 70 || npc.relationship < 30),
  ).length
  const vacancies = Math.max(0, TOTAL_COMMISSIONER_ROLES - Object.keys(commissioners).length)

  return (
    <CommandPanel
      question="Who's with me, and who's against me?"
      summary="Read the full power map — your deputy and cabinet, the blocs, and the actors applying pressure — before you move."
      statusItems={[
        {
          label: 'Angry factions',
          value: angryFactions,
          tone: angryFactions > 0 ? 'danger' : 'neutral',
        },
        {
          label: 'Active pressure actors',
          value: hostileActors,
          tone: hostileActors > 0 ? 'danger' : 'neutral',
        },
        {
          label: 'Cabinet vacancies',
          value: vacancies,
          tone: vacancies > 0 ? 'warning' : 'neutral',
        },
      ]}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px',
        }}
      >
        <SignalCard
          label="Federal relationship"
          value={federalRelationship.toFixed(0)}
          detail="A cold Abuja relationship turns routine governance into a veto point."
        />
        <SignalCard
          label="Deputy risk"
          value={deputy ? deputy.resentment.toFixed(0) : '—'}
          detail={
            deputy
              ? 'Track resentment before it spills into open sabotage.'
              : 'No deputy issue is active.'
          }
        />
        <SignalCard
          label="Commissioners seated"
          value={`${Object.keys(commissioners).length}/${TOTAL_COMMISSIONER_ROLES}`}
          detail="Vacancies weaken delivery and invite godfather interference."
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '16px',
        }}
      >
        <CommandSection title="Factions" description="Blocs whose support you need to govern.">
          <FactionPanel />
        </CommandSection>
        <CommandSection
          title="Political actors"
          description="Individuals applying pressure behind the scenes."
        >
          <NPCPanel />
        </CommandSection>
        <CommandSection
          title="Deputy governor"
          description="Watch for brewing resentment before it becomes an event."
        >
          {deputy ? (
            <DeputyPanel />
          ) : (
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
              No deputy profile has been installed in the current save.
            </p>
          )}
        </CommandSection>
        <CommandSection
          title="Cabinet and patronage"
          description="Appointments, vacancies, and godfather fingerprints."
        >
          <CabinetPanel />
        </CommandSection>
      </div>
    </CommandPanel>
  )
}
