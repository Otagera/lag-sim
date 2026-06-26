import { useGameStore } from '../../state/gameStore'
import { Surface } from '../components/Surface'
import { Stat } from '../components/Stat'
import { Kicker } from '../components/Typography'

const FACTION_LABELS: Record<string, string> = {
  businessCommunity: 'Business Community',
  informalEconomy:   'Informal Economy',
  partyGodfathers:   'Party Godfathers',
  federalGovt:       'Federal Govt',
  civilSocietyMedia: 'Civil Society/Media',
  lgChairmen:        'LG Chairmen',
}

function FactionBar({ label, value }: { label: string; value: number }) {
  const danger = value <= 20
  const warn   = value <= 35
  const color  = danger ? 'var(--error-9)' : warn ? 'var(--warning-9)' : 'var(--accent-solid)'

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
        <span>{label}</span>
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
            <Stat label="Cash Reserve" value={stats.cashReserve} format="currency" warn={cashWarn && !corrDanger} danger={stats.cashReserve < 8} />
          </Surface>
          <Surface elevation="flat" padding="10px">
            <Stat label="IGR"          value={stats.igr}         format="currency" />
          </Surface>
          <Surface elevation="flat" padding="10px">
            <Stat label="Expenditure"  value={stats.expenditure} format="currency" />
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
            <Stat label="Public Trust"       value={stats.publicTrust}       format="percent" warn={trustWarn} danger={stats.publicTrust < 25} />
          </Surface>
          <Surface elevation="flat" padding="10px">
            <Stat label="Political Capital"  value={stats.politicalCapital}  warn={pcWarn}   danger={stats.politicalCapital < 10} />
          </Surface>
          <Surface elevation="flat" padding="10px">
            <Stat label="Infrastructure"     value={stats.infrastructureScore} />
          </Surface>
          <Surface elevation="flat" padding="10px">
            <Stat label="Security"           value={stats.securityIndex}     warn={stats.securityIndex < 30} />
          </Surface>
          <Surface elevation="flat" padding="10px">
            <Stat label="Corruption"         value={stats.corruptionPressure} danger={corrDanger} warn={stats.corruptionPressure > 55} />
          </Surface>
          <Surface elevation="flat" padding="10px">
            <Stat label="Youth Tension"      value={stats.youthTension}      warn={stats.youthTension > 60} danger={stats.youthTension > 80} />
          </Surface>
        </div>
      </section>

      {/* Factions */}
      <section>
        <Kicker accent>Factions</Kicker>
        <Surface elevation="flat" padding="12px" style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {Object.entries(s.factions).map(([key, value]) => (
            <FactionBar key={key} label={FACTION_LABELS[key] ?? key} value={value as number} />
          ))}
        </Surface>
      </section>

      {/* Federal */}
      <section>
        <Kicker accent>Federal Relationship</Kicker>
        <Surface elevation="flat" padding="10px" style={{ marginTop: '8px' }}>
          <Stat label="Fed. Relationship" value={stats.federalRelationship} warn={stats.federalRelationship < 30} />
        </Surface>
      </section>

    </div>
  )
}
