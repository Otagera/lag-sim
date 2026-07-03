import { useState } from 'react'
import { useGameStore } from '../state/gameStore'
import type {
  ExpenditureBreakdown,
  FactionDelta,
  RevenueBreakdown,
  StatDelta,
} from '../state/types'

const naira = (v: number) => `₦${Math.abs(v).toFixed(1)}bn`

// ── Helpers ──────────────────────────────────────────────────

function biggestBleed(
  exp: ExpenditureBreakdown | undefined,
): { label: string; value: number } | null {
  if (!exp) return null
  const lines: { label: string; value: number }[] = [
    { label: 'Personnel', value: exp.personnel },
    { label: 'Overheads', value: exp.overheads },
    { label: 'Subventions', value: exp.subventions },
    { label: 'Debt interest', value: exp.debtInterest },
    { label: 'Debt repayment', value: exp.debtRepayment },
  ]
  return lines.reduce((a, b) => (a.value > b.value ? a : b))
}

function biggestOpportunity(
  rev: RevenueBreakdown | undefined,
): { label: string; value: number } | null {
  if (!rev) return null
  const lines: { label: string; value: number }[] = [
    { label: 'PAYE', value: rev.paye },
    { label: 'MDA', value: rev.mda },
    { label: 'LUC', value: rev.luc },
    { label: 'Tourism', value: rev.tourism },
    { label: 'FAAC', value: rev.faac },
    { label: 'Grants', value: rev.grants },
  ]
  return lines.reduce((a, b) => (a.value > b.value ? a : b))
}

// ── Initiative definitions ───────────────────────────────────

interface InitiativeDef {
  id: string
  name: string
  totalWeeks: number
  completionEventId: string
  pcCost: number
  factionImpact: FactionDelta
  statDelta: StatDelta
  description: string
  payoff: string
}

const INITIATIVES: Record<string, InitiativeDef> = {
  'paye-enforcement': {
    id: 'paye-enforcement',
    name: 'PAYE Enforcement Drive',
    totalWeeks: 10,
    completionEventId: 'paye-enforcement-result',
    pcCost: 5,
    factionImpact: { businessCommunity: -8, civilSocietyMedia: 3 },
    statDelta: { cashReserve: -2 },
    description: 'Crackdown on PAYE evasion',
    payoff: '₦2bn+/wk IGR boost',
  },
  'luc-audit': {
    id: 'luc-audit',
    name: 'Land Use Charge Audit',
    totalWeeks: 8,
    completionEventId: 'luc-audit-result',
    pcCost: 8,
    factionImpact: { businessCommunity: -6 },
    statDelta: { cashReserve: -1.5 },
    description: 'Full assessment of under-registered properties',
    payoff: 'Up to ₦0.6bn/wk LUC uplift',
  },
  'grants-mobilisation': {
    id: 'grants-mobilisation',
    name: 'World Bank Grant',
    totalWeeks: 6,
    completionEventId: 'world-bank-grant-result',
    pcCost: 5,
    factionImpact: { civilSocietyMedia: 4 },
    statDelta: { cashReserve: -0.5 },
    description: 'Apply for World Bank urban development grant',
    payoff: '₦0.8bn+/wk grant income',
  },
  'civil-service-reform': {
    id: 'civil-service-reform',
    name: 'Civil Service Reform',
    totalWeeks: 14,
    completionEventId: 'civil-service-reform-result',
    pcCost: 10,
    factionImpact: { lgChairmen: -4, civilSocietyMedia: 5 },
    statDelta: { cashReserve: -3, youthTension: 8 },
    description: 'Biometric verification, remove ghost workers',
    payoff: 'Reduces ghostWorkerRate long-term',
  },
}

// ── Loan definitions ─────────────────────────────────────────

interface LoanDef {
  source: 'world_bank' | 'bond_issuance' | 'federal_govt'
  label: string
  apr: string
  term: string
  delay: string
  pcCost: number
  minAmount: number
  amounts: number[]
  note?: string
}

const LOANS: LoanDef[] = [
  {
    source: 'world_bank',
    label: 'World Bank Loan',
    apr: '4%',
    term: '20yr',
    delay: '16wk',
    pcCost: 5,
    minAmount: 10,
    amounts: [10, 25, 50],
    note: 'open_procurement required',
  },
  {
    source: 'bond_issuance',
    label: 'Bond Issuance',
    apr: '16.5%',
    term: '7yr',
    delay: '8wk',
    pcCost: 10,
    minAmount: 10,
    amounts: [10, 25, 50],
  },
  {
    source: 'federal_govt',
    label: 'Federal Loan',
    apr: '0%',
    term: '5yr',
    delay: '4wk',
    pcCost: 15,
    minAmount: 10,
    amounts: [10, 25],
    note: 'FedRel -10',
  },
]

// ── Sub-components ──────────────────────────────────────────

const sectionStyle: React.CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: '2px',
  overflow: 'hidden',
}

const sectionHeaderStyle: React.CSSProperties = {
  padding: '6px 8px',
  fontSize: '9px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  backgroundColor: 'var(--surface)',
  color: 'var(--text-secondary)',
}

function ActionRow({
  label,
  description,
  pcCost,
  cooldownWeeks,
  onCooldown,
  disabledReason,
  onStart,
  confirming,
  onConfirm,
  onCancel,
  children,
}: {
  label: string
  description: string
  pcCost: number
  cooldownWeeks: number
  onCooldown: boolean
  disabledReason?: string
  onStart: () => void
  confirming: boolean
  onConfirm: () => void
  onCancel: () => void
  children?: React.ReactNode
}) {
  const week = useGameStore((s) => s.week)
  const pc = useGameStore((s) => s.stats.politicalCapital)
  const canAfford = pc >= pcCost && !disabledReason && !onCooldown

  return (
    <div
      className="p-1.5 border-b text-[10px]"
      style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--background)' }}
    >
      {!confirming ? (
        <div>
          <button
            type="button"
            onClick={canAfford ? onStart : undefined}
            className="w-full text-left"
            disabled={!canAfford}
            style={{ cursor: canAfford ? 'pointer' : 'default', opacity: canAfford ? 1 : 0.4 }}
          >
            <div className="flex justify-between items-center">
              <span className="font-semibold" style={{ color: 'var(--text)' }}>
                {label}
              </span>
              <span style={{ color: 'var(--text-secondary)' }}>
                PC:{pcCost}
                {onCooldown && ` · ${Math.max(0, cooldownWeeks - week)}w`}
                {disabledReason && ` · ${disabledReason}`}
              </span>
            </div>
            <p className="text-[9px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              {description}
            </p>
          </button>
        </div>
      ) : (
        <div>
          <p className="text-[10px] font-semibold mb-1" style={{ color: 'var(--text)' }}>
            {label} — confirm?
          </p>
          {children}
          <div className="flex gap-1.5 mt-1.5">
            <button
              type="button"
              onClick={onConfirm}
              className="px-2 py-0.5 text-[9px] font-semibold"
              style={{ backgroundColor: 'var(--accent-solid)', color: 'var(--accent-on-solid)' }}
            >
              Confirm
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-2 py-0.5 text-[9px] border"
              style={{
                borderColor: 'var(--border)',
                color: 'var(--text-secondary)',
                backgroundColor: 'var(--surface)',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main component ──────────────────────────────────────────

export function EconomyPanel() {
  const exp = useGameStore((s) => s.lastWeekExpenditure)
  const rev = useGameStore((s) => s.lastWeekRevenue)
  const pc = useGameStore((s) => s.stats.politicalCapital)
  const week = useGameStore((s) => s.week)
  const cooldowns = useGameStore((s) => s.economyCooldowns)
  const activeInitiative = useGameStore((s) => s.activeInitiative)
  const resolvedEvents = useGameStore((s) => s.resolvedEvents)
  const stats = useGameStore((s) => s.stats)

  const cutSubventions = useGameStore((s) => s.economyCutSubventions)
  const reduceOverheads = useGameStore((s) => s.economyReduceOverheads)
  const raiseLuc = useGameStore((s) => s.economyRaiseLuc)
  const launchInitiative = useGameStore((s) => s.economyLaunchInitiative)
  const takeLoan = useGameStore((s) => s.economyTakeLoan)
  const courtGodfathers = useGameStore((s) => s.courtGodfathers)

  const [confirming, setConfirming] = useState<string | null>(null)
  const [loanAmount, setLoanAmount] = useState<number>(0)

  const bleed = biggestBleed(exp)
  const opp = biggestOpportunity(rev)

  function isOnCooldown(key: string): boolean {
    return (cooldowns[key] ?? 0) > week
  }

  function cooldownWeeks(key: string): number {
    return cooldowns[key] ?? 0
  }

  function initiateConfirm(key: string) {
    setConfirming(key)
    setLoanAmount(0)
  }

  function cancelConfirm() {
    setConfirming(null)
    setLoanAmount(0)
  }

  // Revenue levers
  const payeDone = resolvedEvents.includes('paye-enforcement-result')
  const payeActive = activeInitiative?.id === 'paye-enforcement'
  const lucAtMax = stats.landUseChargeEnforcement >= 3
  const grantDone = resolvedEvents.includes('world-bank-grant-result')
  const grantActive = activeInitiative?.id === 'grants-mobilisation'
  const reformDone = stats.civilServiceReformScore >= 100
  const reformActive = activeInitiative?.id === 'civil-service-reform'

  const initiativeSlotBlocked = activeInitiative !== null

  return (
    <div
      className="border"
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
    >
      <div className="p-2">
        <h2 className="label-caps mb-1">Economy</h2>

        {bleed && (
          <p className="text-[9px] mb-2 leading-tight" style={{ color: 'var(--warning-11)' }}>
            Biggest spend: <span className="font-semibold">{bleed.label}</span> (
            {naira(bleed.value)}/wk)
            {opp && ` · Largest revenue: ${opp.label} (${naira(opp.value)}/wk)`}
          </p>
        )}

        {/* ── Revenue Levers ── */}
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>Revenue Levers</div>
          {!payeDone && (
            <ActionRow
              label="PAYE Enforcement Drive"
              description="10-week crackdown · On completion: ₦2bn+/wk IGR boost"
              pcCost={INITIATIVES['paye-enforcement'].pcCost}
              cooldownWeeks={0}
              onCooldown={false}
              disabledReason={
                payeActive
                  ? 'in progress'
                  : initiativeSlotBlocked
                    ? 'initiative slot full'
                    : undefined
              }
              onStart={() => initiateConfirm('paye-enforcement')}
              confirming={confirming === 'paye-enforcement'}
              onConfirm={() => {
                const d = INITIATIVES['paye-enforcement']
                launchInitiative(
                  d.id,
                  d.name,
                  d.totalWeeks,
                  d.completionEventId,
                  d.pcCost,
                  d.factionImpact,
                  d.statDelta,
                )
                cancelConfirm()
              }}
              onCancel={cancelConfirm}
            />
          )}
          {!lucAtMax && (
            <ActionRow
              label="LUC Audit"
              description="8-week assessment · Up to ₦0.6bn/wk LUC uplift"
              pcCost={INITIATIVES['luc-audit'].pcCost}
              cooldownWeeks={0}
              onCooldown={false}
              disabledReason={initiativeSlotBlocked ? 'initiative slot full' : undefined}
              onStart={() => initiateConfirm('luc-audit')}
              confirming={confirming === 'luc-audit'}
              onConfirm={() => {
                const d = INITIATIVES['luc-audit']
                launchInitiative(
                  d.id,
                  d.name,
                  d.totalWeeks,
                  d.completionEventId,
                  d.pcCost,
                  d.factionImpact,
                  d.statDelta,
                )
                cancelConfirm()
              }}
              onCancel={cancelConfirm}
            />
          )}
          {!grantDone && (
            <ActionRow
              label="World Bank Grant"
              description="6-week application · ₦0.8bn+/wk grant income"
              pcCost={INITIATIVES['grants-mobilisation'].pcCost}
              cooldownWeeks={0}
              onCooldown={false}
              disabledReason={
                grantActive
                  ? 'in progress'
                  : stats.grantsCompliance >= 0.9
                    ? 'compliance maxed'
                    : initiativeSlotBlocked
                      ? 'initiative slot full'
                      : undefined
              }
              onStart={() => initiateConfirm('grants-mobilisation')}
              confirming={confirming === 'grants-mobilisation'}
              onConfirm={() => {
                const d = INITIATIVES['grants-mobilisation']
                launchInitiative(
                  d.id,
                  d.name,
                  d.totalWeeks,
                  d.completionEventId,
                  d.pcCost,
                  d.factionImpact,
                  d.statDelta,
                )
                cancelConfirm()
              }}
              onCancel={cancelConfirm}
            />
          )}
          {!reformDone && (
            <ActionRow
              label="Civil Service Reform"
              description="14-week biometric reform · Reduces ghost worker drag"
              pcCost={INITIATIVES['civil-service-reform'].pcCost}
              cooldownWeeks={0}
              onCooldown={false}
              disabledReason={
                reformActive
                  ? 'in progress'
                  : initiativeSlotBlocked
                    ? 'initiative slot full'
                    : undefined
              }
              onStart={() => initiateConfirm('civil-service-reform')}
              confirming={confirming === 'civil-service-reform'}
              onConfirm={() => {
                const d = INITIATIVES['civil-service-reform']
                launchInitiative(
                  d.id,
                  d.name,
                  d.totalWeeks,
                  d.completionEventId,
                  d.pcCost,
                  d.factionImpact,
                  d.statDelta,
                )
                cancelConfirm()
              }}
              onCancel={cancelConfirm}
            />
          )}
          {payeDone && lucAtMax && grantDone && reformDone && (
            <div className="p-2 text-[9px]" style={{ color: 'var(--text-secondary)' }}>
              All revenue levers exhausted.
            </div>
          )}
        </div>

        <div className="h-1.5" />

        {/* ── Spending Cuts ── */}
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>Spending Cuts</div>
          <ActionRow
            label="Cut Subventions"
            description={`${naira(3.9 * 0.2)}/wk savings · −8 Informal, −5 Trust`}
            pcCost={10}
            cooldownWeeks={cooldownWeeks('cut-subventions')}
            onCooldown={isOnCooldown('cut-subventions')}
            disabledReason={stats.subventionCutRate >= 0.4 ? 'max cut reached' : undefined}
            onStart={() => initiateConfirm('cut-subventions')}
            confirming={confirming === 'cut-subventions'}
            onConfirm={() => {
              cutSubventions()
              cancelConfirm()
            }}
            onCancel={cancelConfirm}
          />
          <ActionRow
            label="Reduce Overheads"
            description={`${naira(3)}/wk savings · −6 Godfathers, −5 LG, −15 PC`}
            pcCost={15}
            cooldownWeeks={cooldownWeeks('reduce-overheads')}
            onCooldown={isOnCooldown('reduce-overheads')}
            disabledReason={stats.baseOverheads <= -3 ? 'overheads at floor' : undefined}
            onStart={() => initiateConfirm('reduce-overheads')}
            confirming={confirming === 'reduce-overheads'}
            onConfirm={() => {
              reduceOverheads()
              cancelConfirm()
            }}
            onCancel={cancelConfirm}
          />
          <ActionRow
            label="Raise LUC Enforcement"
            description={`+${naira(0.5 * 0.3)}/wk revenue · −6 Business, −10 PC`}
            pcCost={10}
            cooldownWeeks={cooldownWeeks('raise-luc')}
            onCooldown={isOnCooldown('raise-luc')}
            disabledReason={stats.landUseChargeEnforcement >= 3 ? 'max enforcement' : undefined}
            onStart={() => initiateConfirm('raise-luc')}
            confirming={confirming === 'raise-luc'}
            onConfirm={() => {
              raiseLuc()
              cancelConfirm()
            }}
            onCancel={cancelConfirm}
          />
        </div>

        <div className="h-1.5" />

        {/* ── Political Capital ── */}
        {pc < 25 && (
          <div style={sectionStyle}>
            <div style={sectionHeaderStyle}>Political Capital</div>
            <ActionRow
              label="Mend Fences with Godfathers"
              description="Court the party machine · +10 PC, +5 Godfathers · −3 Trust, +3 Corruption"
              pcCost={0}
              cooldownWeeks={cooldownWeeks('court-godfathers')}
              onCooldown={isOnCooldown('court-godfathers')}
              onStart={() => initiateConfirm('court-godfathers')}
              confirming={confirming === 'court-godfathers'}
              onConfirm={() => {
                courtGodfathers()
                cancelConfirm()
              }}
              onCancel={cancelConfirm}
            />
          </div>
        )}

        {/* ── Financing ── */}
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>Financing</div>
          {LOANS.map((loan) => {
            const key = `loan-${loan.source}`
            const inConfirm = confirming === key
            const selectedAmount = inConfirm ? loanAmount : 0
            const monthlyRepayment =
              selectedAmount > 0 ? selectedAmount / (parseInt(loan.term, 10) * 52) : 0
            const weeklyInterest =
              selectedAmount > 0 ? (selectedAmount * parseFloat(loan.apr)) / 100 / 52 : 0
            const canAfford = pc >= loan.pcCost

            return (
              <div
                key={key}
                className="p-1.5 border-b text-[10px]"
                style={{
                  borderColor: 'var(--border-subtle)',
                  backgroundColor: 'var(--background)',
                }}
              >
                {!inConfirm ? (
                  <button
                    type="button"
                    onClick={canAfford ? () => initiateConfirm(key) : undefined}
                    className="w-full text-left"
                    disabled={!canAfford}
                    style={{
                      cursor: canAfford ? 'pointer' : 'default',
                      opacity: canAfford ? 1 : 0.4,
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-semibold" style={{ color: 'var(--text)' }}>
                        {loan.label}
                      </span>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        PC:{loan.pcCost} · {loan.apr} · {loan.term}
                      </span>
                    </div>
                    <p className="text-[9px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                      {loan.delay} disbursement{loan.note ? ` · ${loan.note}` : ''}
                    </p>
                  </button>
                ) : (
                  <div>
                    <p className="text-[10px] font-semibold mb-1" style={{ color: 'var(--text)' }}>
                      {loan.label} — choose amount
                    </p>
                    <div className="flex gap-1 mb-1">
                      {loan.amounts.map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setLoanAmount(amt)}
                          className="px-2 py-0.5 text-[9px] font-semibold"
                          style={{
                            backgroundColor:
                              loanAmount === amt ? 'var(--accent-solid)' : 'var(--surface)',
                            color: loanAmount === amt ? 'var(--accent-on-solid)' : 'var(--text)',
                            border: '1px solid var(--border)',
                          }}
                        >
                          ₦{amt}bn
                        </button>
                      ))}
                    </div>
                    {selectedAmount > 0 && (
                      <div
                        className="text-[9px] mb-1 leading-tight"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        ₦{selectedAmount}bn now → ₦{(monthlyRepayment + weeklyInterest).toFixed(3)}
                        bn/wk for {loan.term}
                        {parseFloat(loan.apr) > 0 &&
                          ` (₦${weeklyInterest.toFixed(3)}bn/wk interest)`}
                      </div>
                    )}
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        disabled={selectedAmount <= 0}
                        onClick={() => {
                          if (selectedAmount > 0) {
                            takeLoan(selectedAmount, loan.source)
                            cancelConfirm()
                          }
                        }}
                        className="px-2 py-0.5 text-[9px] font-semibold"
                        style={{
                          backgroundColor:
                            selectedAmount > 0 ? 'var(--accent-solid)' : 'var(--surface)',
                          color:
                            selectedAmount > 0 ? 'var(--accent-on-solid)' : 'var(--text-secondary)',
                          opacity: selectedAmount > 0 ? 1 : 0.4,
                        }}
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={cancelConfirm}
                        className="px-2 py-0.5 text-[9px] border"
                        style={{
                          borderColor: 'var(--border)',
                          color: 'var(--text-secondary)',
                          backgroundColor: 'var(--surface)',
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
