import { FACTION_ICONS, STAT_ICONS } from '../../data/icons'
import { useGameStore } from '../../state/gameStore'
import { Stat } from '../components/Stat'
import { Surface } from '../components/Surface'
import { Kicker } from '../components/Typography'

const FACTION_LABELS: Record<string, string> = {
  businessCommunity: 'Business Community',
  informalEconomy: 'Informal Economy',
  partyGodfathers: 'Party Godfathers',
  federalGovt: 'Federal Govt',
  civilSocietyMedia: 'Civil Society/Media',
  lgChairmen: 'LG Chairmen',
}

function FactionBar({
  label,
  value,
  factionKey,
}: {
  label: string
  value: number
  factionKey?: string
}) {
  const danger = value <= 20
  const warn = value <= 35
  const color = danger ? 'var(--error-9)' : warn ? 'var(--warning-9)' : 'var(--accent-solid)'
  const FcIcon = factionKey
    ? FACTION_ICONS[factionKey as keyof typeof FACTION_ICONS]?.icon
    : undefined

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '11px',
          fontFamily: "'Archivo Narrow', sans-serif",
          color: danger ? 'var(--error-11)' : 'var(--text-secondary)',
          fontWeight: danger ? 600 : 400,
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
          {FcIcon && <FcIcon size={10} style={{ flexShrink: 0 }} />}
          {label}
        </span>
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{Math.round(value)}</span>
      </div>
      <div
        style={{
          height: '4px',
          background: 'var(--border-subtle)',
          borderRadius: '2px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${Math.max(0, Math.min(100, value))}%`,
            background: color,
            borderRadius: '2px',
            transition: 'width 700ms ease, background 300ms ease',
          }}
        />
      </div>
    </div>
  )
}

type GameStoreState = ReturnType<typeof useGameStore.getState>
type GameStats = GameStoreState['stats']
type RevenueBreakdown = GameStoreState['lastWeekRevenue']
type Factions = GameStoreState['factions']
type SecondaryFactions = GameStoreState['secondaryFactions']
type StatConfig = Parameters<typeof Stat>[0]
type GovernanceSectionProps = {
  stats: GameStats
  cashWarn: boolean
  trustWarn: boolean
  pcWarn: boolean
  corrDanger: boolean
}

const THREE_COLUMN_GRID_STYLE = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '8px',
  marginTop: '8px',
} as const

const REVENUE_BREAKDOWN_STYLE = {
  marginTop: '8px',
  padding: '6px 10px',
  display: 'flex',
  gap: '12px',
  flexWrap: 'wrap',
  background: 'var(--surface)',
  borderRadius: '2px',
  border: '1px solid var(--border)',
  color: 'var(--text-secondary)',
  fontSize: '10px',
} as const

const REVENUE_ITEMS = [
  { label: 'PAYE', key: 'paye' },
  { label: 'MDA', key: 'mda' },
  { label: 'LUC', key: 'luc' },
  { label: 'Tourism', key: 'tourism' },
  { label: 'FAAC', key: 'faac' },
  { label: 'Grants', key: 'grants' },
] as const

const FACTIONS_SURFACE_STYLE = {
  marginTop: '8px',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
} as const

const SECONDARY_FACTION_ITEMS = [
  { key: 'creativeEconomy', label: 'Creative Economy' },
  { key: 'techSector', label: 'Tech Sector' },
  { key: 'medicalAssociation', label: 'Health Professionals' },
  { key: 'agrarianSector', label: 'Agriculture' },
] as const

function StatCard(props: StatConfig) {
  return (
    <Surface elevation="flat" padding="10px">
      <Stat {...props} />
    </Surface>
  )
}

function EconomySection({ stats, revenue }: { stats: GameStats; revenue: RevenueBreakdown }) {
  const cashWarn = stats.cashReserve < 15
  const corrDanger = stats.corruptionPressure > 70

  return (
    <section>
      <Kicker accent>Economy</Kicker>
      <div style={THREE_COLUMN_GRID_STYLE}>
        <StatCard
          label="Cash Reserve"
          value={stats.cashReserve}
          format="currency"
          warn={cashWarn && !corrDanger}
          danger={stats.cashReserve < 8}
          title="Available funds. Negative for 3+ consecutive weeks = bankruptcy game over."
          icon={STAT_ICONS.cashReserve.icon}
        />
        <StatCard
          label="IGR"
          value={stats.igr}
          format="currency"
          title="Weekly internally generated revenue (taxes, levies, fines)."
          icon={STAT_ICONS.igr.icon}
        />
        <StatCard
          label="Expenditure"
          value={stats.expenditure}
          format="currency"
          title="Weekly spending commitments (salaries, overhead, debt servicing)."
          icon={STAT_ICONS.expenditure.icon}
        />
      </div>
      <div className="label-caps" style={REVENUE_BREAKDOWN_STYLE}>
        {!revenue ? (
          <span>Revenue data pending…</span>
        ) : (
          REVENUE_ITEMS.map((item) => (
            <span key={item.label} style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
              <span>{item.label}:</span>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                ₦{revenue[item.key].toFixed(2)}bn
              </span>
            </span>
          ))
        )}
      </div>
    </section>
  )
}

function getGovernanceStats({
  stats,
  trustWarn,
  pcWarn,
  corrDanger,
}: Omit<GovernanceSectionProps, 'cashWarn'>): StatConfig[] {
  const foodSecurityIndex = stats.foodSecurityIndex ?? 40
  const floodResilienceScore = stats.floodResilienceScore ?? 35

  return [
    {
      label: 'Public Trust',
      value: stats.publicTrust,
      format: 'percent',
      warn: trustWarn,
      danger: stats.publicTrust < 25,
      title: 'Public approval. Below 15% + youth tension > 85 = mass uprising game over.',
      icon: STAT_ICONS.publicTrust.icon,
    },
    {
      label: 'Political Capital',
      value: stats.politicalCapital,
      warn: pcWarn,
      danger: stats.politicalCapital < 10,
      title: 'Political influence to spend on bold actions. Earned by delivering wins.',
      icon: STAT_ICONS.politicalCapital.icon,
    },
    {
      label: 'Infrastructure',
      value: stats.infrastructureScore,
      title:
        'State of roads, power, water. Decays 0.5/wk; below 25 + fed rel < -40 = federal takeover.',
      icon: STAT_ICONS.infrastructureScore.icon,
    },
    {
      label: 'Security',
      value: stats.securityIndex,
      warn: stats.securityIndex < 30,
      title: 'Public safety index. Below 30 triggers warnings.',
      icon: STAT_ICONS.securityIndex.icon,
    },
    {
      label: 'Corruption',
      value: stats.corruptionPressure,
      danger: corrDanger,
      warn: stats.corruptionPressure > 55,
      title: 'Preasure from rent-seeking networks. Above 75 risks federal grant freeze.',
      icon: STAT_ICONS.corruptionPressure.icon,
    },
    {
      label: 'Youth Tension',
      value: stats.youthTension,
      warn: stats.youthTension > 60,
      danger: stats.youthTension > 80,
      title: 'Youth unrest level. Rises 0.4/wk naturally. Above 85 + trust < 15 = mass uprising.',
      icon: STAT_ICONS.youthTension.icon,
    },
    {
      label: 'Food Security',
      value: foodSecurityIndex,
      warn: foodSecurityIndex < 40,
      title:
        'Food supply chain resilience. Decays 0.15/wk (0.30 in Harmattan). Raise it via food-market events and the Feed Lagos research track. Below 40 = food price warnings.',
    },
    {
      label: 'Flood Resilience',
      value: floodResilienceScore,
      warn: floodResilienceScore < 40,
      title:
        'Flood prevention infrastructure. Decays 0.10/wk (0.35 in wet season). Raise it via drainage/wetland events and the Climate-Proof research track. Below 40 = flood crisis risk.',
    },
  ]
}

function GovernanceSection({ stats, trustWarn, pcWarn, corrDanger }: GovernanceSectionProps) {
  const governanceStats = getGovernanceStats({ stats, trustWarn, pcWarn, corrDanger })

  return (
    <section>
      <Kicker accent>Governance</Kicker>
      <div style={THREE_COLUMN_GRID_STYLE}>
        {governanceStats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>
    </section>
  )
}

function FactionsSection({ factions }: { factions: Factions }) {
  return (
    <section>
      <Kicker accent>Factions</Kicker>
      <Surface elevation="flat" padding="12px" style={FACTIONS_SURFACE_STYLE}>
        {Object.entries(factions).map(([key, value]) => (
          <FactionBar key={key} label={FACTION_LABELS[key] ?? key} value={value} factionKey={key} />
        ))}
      </Surface>
    </section>
  )
}

function SectorStakeholdersSection({
  secondaryFactions,
}: {
  secondaryFactions: SecondaryFactions
}) {
  return (
    <section>
      <Kicker accent>Sector Stakeholders</Kicker>
      <div
        style={{ marginTop: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}
      >
        {SECONDARY_FACTION_ITEMS.map(({ key, label }) => {
          const val = (secondaryFactions[key] as number) ?? 50
          const danger = val <= 25
          const warn = val <= 40
          const color = danger
            ? 'var(--error-9)'
            : warn
              ? 'var(--warning-9)'
              : 'var(--accent-solid)'
          return (
            <div
              key={key}
              style={{
                padding: '8px 10px',
                background: 'var(--surface)',
                borderRadius: '2px',
                border: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  fontSize: '10px',
                  color: danger ? 'var(--error-11)' : 'var(--text-secondary)',
                  fontWeight: danger ? 600 : 400,
                }}
              >
                {label}
              </span>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {Math.round(val)}
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function FederalRelationshipSection({ stats }: { stats: GameStats }) {
  return (
    <section>
      <Kicker accent>Federal Relationship</Kicker>
      <Surface elevation="flat" padding="10px" style={{ marginTop: '8px' }}>
        <Stat
          label="Fed. Relationship"
          value={stats.federalRelationship}
          warn={stats.federalRelationship < 30}
          title="Relationship with the Federal Government. Below -40 + infra < 25 = federal takeover game over."
          icon={STAT_ICONS.federalRelationship.icon}
        />
      </Surface>
    </section>
  )
}

export function StateOfTheState() {
  const s = useGameStore((state) => state)
  const stats = s.stats

  const cashWarn = stats.cashReserve < 15
  const trustWarn = stats.publicTrust < 40
  const pcWarn = stats.politicalCapital < 25
  const corrDanger = stats.corruptionPressure > 70

  return (
    <div
      style={{
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        overflowY: 'auto',
      }}
    >
      <EconomySection stats={stats} revenue={s.lastWeekRevenue} />
      <GovernanceSection
        stats={stats}
        cashWarn={cashWarn}
        trustWarn={trustWarn}
        pcWarn={pcWarn}
        corrDanger={corrDanger}
      />
      <FactionsSection factions={s.factions} />
      <SectorStakeholdersSection secondaryFactions={s.secondaryFactions} />
      <FederalRelationshipSection stats={stats} />
    </div>
  )
}
