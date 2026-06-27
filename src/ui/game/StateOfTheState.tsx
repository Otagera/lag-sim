import { useGameStore } from '../../state/gameStore'
import { Surface } from '../components/Surface'
import { Stat } from '../components/Stat'
import { Kicker } from '../components/Typography'
import { STAT_ICONS, FACTION_ICONS } from '../../data/icons'

const FACTION_LABELS: Record<string, string> = {
  businessCommunity: 'Business Community',
  informalEconomy:   'Informal Economy',
  partyGodfathers:   'Party Godfathers',
  federalGovt:       'Federal Govt',
  civilSocietyMedia: 'Civil Society/Media',
  lgChairmen:        'LG Chairmen',
}

function FactionBar({ label, value, factionKey }: { label: string; value: number; factionKey?: string }) {
  const danger = value <= 20
  const warn   = value <= 35
  const color  = danger ? 'var(--error-9)' : warn ? 'var(--warning-9)' : 'var(--accent-solid)'
  const FcIcon = factionKey ? FACTION_ICONS[factionKey as keyof typeof FACTION_ICONS]?.icon : undefined

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
      <div style={{
        display:       'flex',
        justifyContent:'space-between',
        fontSize:      '11px',
        fontFamily:    "'Archivo Narrow', sans-serif",
        color:         danger ? 'var(--error-11)' : 'var(--text-secondary)',
        fontWeight:    danger ? 600 : 400,
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
          {FcIcon && <FcIcon size={10} style={{ flexShrink: 0 }} />}
          {label}
        </span>
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{Math.round(value)}</span>
      </div>
      <div style={{ height: '4px', background: 'var(--border-subtle)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{
          height:          '100%',
          width:           `${Math.max(0, Math.min(100, value))}%`,
          background:      color,
          borderRadius:    '2px',
          transition:      'width 700ms ease, background 300ms ease',
        }} />
      </div>
    </div>
  )
}

export function StateOfTheState() {
  const s = useGameStore((state) => state)
  const stats = s.stats

  const cashWarn   = stats.cashReserve < 15
  const trustWarn  = stats.publicTrust < 40
  const pcWarn     = stats.politicalCapital < 25
  const corrDanger = stats.corruptionPressure > 70

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>

      {/* Economy */}
      <section>
        <Kicker accent>Economy</Kicker>
        <div style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap:                 '8px',
          marginTop:           '8px',
        }}>
          <Surface elevation="flat" padding="10px">
            <Stat label="Cash Reserve" value={stats.cashReserve} format="currency" warn={cashWarn && !corrDanger} danger={stats.cashReserve < 8} title="Available funds. Negative for 3+ consecutive weeks = bankruptcy game over." icon={STAT_ICONS.cashReserve.icon} />
          </Surface>
          <Surface elevation="flat" padding="10px">
            <Stat label="IGR"          value={stats.igr}         format="currency" title="Weekly internally generated revenue (taxes, levies, fines)." icon={STAT_ICONS.igr.icon} />
          </Surface>
          <Surface elevation="flat" padding="10px">
            <Stat label="Expenditure"  value={stats.expenditure} format="currency" title="Weekly spending commitments (salaries, overhead, debt servicing)." icon={STAT_ICONS.expenditure.icon} />
          </Surface>
        </div>
      </section>

      {/* Governance */}
      <section>
        <Kicker accent>Governance</Kicker>
        <div style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap:                 '8px',
          marginTop:           '8px',
        }}>
          <Surface elevation="flat" padding="10px">
            <Stat label="Public Trust"       value={stats.publicTrust}       format="percent" warn={trustWarn} danger={stats.publicTrust < 25} title="Public approval. Below 15% + youth tension > 85 = mass uprising game over." icon={STAT_ICONS.publicTrust.icon} />
          </Surface>
          <Surface elevation="flat" padding="10px">
            <Stat label="Political Capital"  value={stats.politicalCapital}  warn={pcWarn}   danger={stats.politicalCapital < 10} title="Political influence to spend on bold actions. Earned by delivering wins." icon={STAT_ICONS.politicalCapital.icon} />
          </Surface>
          <Surface elevation="flat" padding="10px">
            <Stat label="Infrastructure"     value={stats.infrastructureScore} title="State of roads, power, water. Decays 0.5/wk; below 25 + fed rel < -40 = federal takeover." icon={STAT_ICONS.infrastructureScore.icon} />
          </Surface>
          <Surface elevation="flat" padding="10px">
            <Stat label="Security"           value={stats.securityIndex}     warn={stats.securityIndex < 30} title="Public safety index. Below 30 triggers warnings." icon={STAT_ICONS.securityIndex.icon} />
          </Surface>
          <Surface elevation="flat" padding="10px">
            <Stat label="Corruption"         value={stats.corruptionPressure} danger={corrDanger} warn={stats.corruptionPressure > 55} title="Preasure from rent-seeking networks. Above 75 risks federal grant freeze." icon={STAT_ICONS.corruptionPressure.icon} />
          </Surface>
          <Surface elevation="flat" padding="10px">
            <Stat label="Youth Tension"      value={stats.youthTension}      warn={stats.youthTension > 60} danger={stats.youthTension > 80} title="Youth unrest level. Rises 0.4/wk naturally. Above 85 + trust < 15 = mass uprising." icon={STAT_ICONS.youthTension.icon} />
          </Surface>
        </div>
      </section>

      {/* Factions */}
      <section>
        <Kicker accent>Factions</Kicker>
        <Surface elevation="flat" padding="12px" style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {Object.entries(s.factions).map(([key, value]) => (
            <FactionBar key={key} label={FACTION_LABELS[key] ?? key} value={value as number} factionKey={key} />
          ))}
        </Surface>
      </section>

      {/* Federal */}
      <section>
        <Kicker accent>Federal Relationship</Kicker>
        <Surface elevation="flat" padding="10px" style={{ marginTop: '8px' }}>
          <Stat label="Fed. Relationship" value={stats.federalRelationship} warn={stats.federalRelationship < 30} title="Relationship with the Federal Government. Below -40 + infra < 25 = federal takeover game over." icon={STAT_ICONS.federalRelationship.icon} />
        </Surface>
      </section>

    </div>
  )
}
