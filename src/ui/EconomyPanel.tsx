import type { CSSProperties, ReactNode } from 'react'
import { useState } from 'react'
import { useGameStore } from '../state/gameStore'
import type {
  ExpenditureBreakdown,
  FactionDelta,
  GameState,
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

type ConfirmKey = string | null

type LaunchInitiativeAction = (
  id: string,
  name: string,
  totalWeeks: number,
  completionEventId: string,
  pcCost: number,
  factionImpact: FactionDelta,
  statDelta: StatDelta,
) => void

type TakeLoanAction = (amount: number, source: LoanDef['source']) => void

const sectionStyle: CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: '2px',
  overflow: 'hidden',
}

const sectionHeaderStyle: CSSProperties = {
  padding: '6px 8px',
  fontSize: '9px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  backgroundColor: 'var(--surface)',
  color: 'var(--text-secondary)',
}

function isOnCooldown(cooldowns: GameState['economyCooldowns'], week: number, key: string) {
  return (cooldowns[key] ?? 0) > week
}

function cooldownWeeks(cooldowns: GameState['economyCooldowns'], key: string) {
  return cooldowns[key] ?? 0
}

function launchEconomyInitiative(
  def: InitiativeDef,
  launchInitiative: LaunchInitiativeAction,
  cancelConfirm: () => void,
) {
  launchInitiative(
    def.id,
    def.name,
    def.totalWeeks,
    def.completionEventId,
    def.pcCost,
    def.factionImpact,
    def.statDelta,
  )
  cancelConfirm()
}

function loanRepaymentSummary(amount: number, loan: LoanDef) {
  const principalRepayment = amount > 0 ? amount / (parseInt(loan.term, 10) * 52) : 0
  const weeklyInterest = amount > 0 ? (amount * parseFloat(loan.apr)) / 100 / 52 : 0

  return {
    weeklyInterest,
    totalWeeklyRepayment: principalRepayment + weeklyInterest,
  }
}

function PanelSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={sectionStyle}>
      <div style={sectionHeaderStyle}>{title}</div>
      {children}
    </div>
  )
}

function ActionRowSummary({
  label,
  description,
  pcCost,
  cooldownWeeks,
  onCooldown,
  disabledReason,
  canAfford,
  onStart,
}: {
  label: string
  description: string
  pcCost: number
  cooldownWeeks: number
  onCooldown: boolean
  disabledReason?: string
  canAfford: boolean
  onStart: () => void
}) {
  const week = useGameStore((s) => s.week)

  return (
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
  )
}

function ActionRowConfirmation({
  label,
  onConfirm,
  onCancel,
  children,
}: {
  label: string
  onConfirm: () => void
  onCancel: () => void
  children?: ReactNode
}) {
  return (
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
  )
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
  children?: ReactNode
}) {
  const pc = useGameStore((s) => s.stats.politicalCapital)
  const canAfford = pc >= pcCost && !disabledReason && !onCooldown

  return (
    <div
      className="p-1.5 border-b text-[10px]"
      style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--background)' }}
    >
      {!confirming ? (
        <ActionRowSummary
          label={label}
          description={description}
          pcCost={pcCost}
          cooldownWeeks={cooldownWeeks}
          onCooldown={onCooldown}
          disabledReason={disabledReason}
          canAfford={canAfford}
          onStart={onStart}
        />
      ) : (
        <ActionRowConfirmation label={label} onConfirm={onConfirm} onCancel={onCancel}>
          {children}
        </ActionRowConfirmation>
      )}
    </div>
  )
}

type RevenueInitiativeKey = keyof typeof INITIATIVES

type RevenueLeverRow = {
  key: RevenueInitiativeKey
  label: string
  description: string
  hidden: boolean
  disabledReason?: string
}

function getRevenueLeverRows(
  activeInitiative: GameState['activeInitiative'],
  resolvedEvents: GameState['resolvedEvents'],
  stats: GameState['stats'],
): RevenueLeverRow[] {
  const payeDone = resolvedEvents.includes('paye-enforcement-result')
  const grantDone = resolvedEvents.includes('world-bank-grant-result')
  const lucAtMax = stats.landUseChargeEnforcement >= 3
  const reformDone = stats.civilServiceReformScore >= 100
  const initiativeSlotBlocked = activeInitiative !== null

  return [
    {
      key: 'paye-enforcement',
      label: 'PAYE Enforcement Drive',
      description: '10-week crackdown · On completion: ₦2bn+/wk IGR boost',
      hidden: payeDone,
      disabledReason:
        activeInitiative?.id === 'paye-enforcement'
          ? 'in progress'
          : initiativeSlotBlocked
            ? 'initiative slot full'
            : undefined,
    },
    {
      key: 'luc-audit',
      label: 'LUC Audit',
      description: '8-week assessment · Up to ₦0.6bn/wk LUC uplift',
      hidden: lucAtMax,
      disabledReason: initiativeSlotBlocked ? 'initiative slot full' : undefined,
    },
    {
      key: 'grants-mobilisation',
      label: 'World Bank Grant',
      description: '6-week application · ₦0.8bn+/wk grant income',
      hidden: grantDone,
      disabledReason:
        activeInitiative?.id === 'grants-mobilisation'
          ? 'in progress'
          : stats.grantsCompliance >= 0.9
            ? 'compliance maxed'
            : initiativeSlotBlocked
              ? 'initiative slot full'
              : undefined,
    },
    {
      key: 'civil-service-reform',
      label: 'Civil Service Reform',
      description: '14-week biometric reform · Reduces ghost worker drag',
      hidden: reformDone,
      disabledReason:
        activeInitiative?.id === 'civil-service-reform'
          ? 'in progress'
          : initiativeSlotBlocked
            ? 'initiative slot full'
            : undefined,
    },
  ]
}

function RevenueLeversSection({
  activeInitiative,
  resolvedEvents,
  stats,
  confirming,
  initiateConfirm,
  cancelConfirm,
  launchInitiative,
}: {
  activeInitiative: GameState['activeInitiative']
  resolvedEvents: GameState['resolvedEvents']
  stats: GameState['stats']
  confirming: ConfirmKey
  initiateConfirm: (key: string) => void
  cancelConfirm: () => void
  launchInitiative: LaunchInitiativeAction
}) {
  const visibleRows = getRevenueLeverRows(activeInitiative, resolvedEvents, stats).filter(
    (row) => !row.hidden,
  )

  return (
    <PanelSection title="Revenue Levers">
      {visibleRows.map((row) => (
        <ActionRow
          key={row.key}
          label={row.label}
          description={row.description}
          pcCost={INITIATIVES[row.key].pcCost}
          cooldownWeeks={0}
          onCooldown={false}
          disabledReason={row.disabledReason}
          onStart={() => initiateConfirm(row.key)}
          confirming={confirming === row.key}
          onConfirm={() =>
            launchEconomyInitiative(INITIATIVES[row.key], launchInitiative, cancelConfirm)
          }
          onCancel={cancelConfirm}
        />
      ))}
      {visibleRows.length === 0 && (
        <div className="p-2 text-[9px]" style={{ color: 'var(--text-secondary)' }}>
          All revenue levers exhausted.
        </div>
      )}
    </PanelSection>
  )
}

function SpendingCutsSection({
  stats,
  week,
  cooldowns,
  confirming,
  initiateConfirm,
  cancelConfirm,
  cutSubventions,
  reduceOverheads,
  raiseLuc,
}: {
  stats: GameState['stats']
  week: number
  cooldowns: GameState['economyCooldowns']
  confirming: ConfirmKey
  initiateConfirm: (key: string) => void
  cancelConfirm: () => void
  cutSubventions: () => void
  reduceOverheads: () => void
  raiseLuc: () => void
}) {
  return (
    <PanelSection title="Spending Cuts">
      <ActionRow
        label="Cut Subventions"
        description={`${naira(3.9 * 0.2)}/wk savings · −8 Informal, −5 Trust`}
        pcCost={10}
        cooldownWeeks={cooldownWeeks(cooldowns, 'cut-subventions')}
        onCooldown={isOnCooldown(cooldowns, week, 'cut-subventions')}
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
        cooldownWeeks={cooldownWeeks(cooldowns, 'reduce-overheads')}
        onCooldown={isOnCooldown(cooldowns, week, 'reduce-overheads')}
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
        cooldownWeeks={cooldownWeeks(cooldowns, 'raise-luc')}
        onCooldown={isOnCooldown(cooldowns, week, 'raise-luc')}
        disabledReason={stats.landUseChargeEnforcement >= 3 ? 'max enforcement' : undefined}
        onStart={() => initiateConfirm('raise-luc')}
        confirming={confirming === 'raise-luc'}
        onConfirm={() => {
          raiseLuc()
          cancelConfirm()
        }}
        onCancel={cancelConfirm}
      />
    </PanelSection>
  )
}

function PoliticalCapitalSection({
  pc,
  week,
  cooldowns,
  confirming,
  initiateConfirm,
  cancelConfirm,
  courtGodfathers,
}: {
  pc: number
  week: number
  cooldowns: GameState['economyCooldowns']
  confirming: ConfirmKey
  initiateConfirm: (key: string) => void
  cancelConfirm: () => void
  courtGodfathers: () => void
}) {
  if (pc >= 25) return null

  return (
    <PanelSection title="Political Capital">
      <ActionRow
        label="Mend Fences with Godfathers"
        description="Court the party machine · +10 PC, +5 Godfathers · −3 Trust, +3 Corruption"
        pcCost={0}
        cooldownWeeks={cooldownWeeks(cooldowns, 'court-godfathers')}
        onCooldown={isOnCooldown(cooldowns, week, 'court-godfathers')}
        onStart={() => initiateConfirm('court-godfathers')}
        confirming={confirming === 'court-godfathers'}
        onConfirm={() => {
          courtGodfathers()
          cancelConfirm()
        }}
        onCancel={cancelConfirm}
      />
    </PanelSection>
  )
}

function LoanAmountSelector({
  amounts,
  loanAmount,
  setLoanAmount,
}: {
  amounts: number[]
  loanAmount: number
  setLoanAmount: (amount: number) => void
}) {
  return (
    <div className="flex gap-1 mb-1">
      {amounts.map((amt) => (
        <button
          key={amt}
          type="button"
          onClick={() => setLoanAmount(amt)}
          className="px-2 py-0.5 text-[9px] font-semibold"
          style={{
            backgroundColor: loanAmount === amt ? 'var(--accent-solid)' : 'var(--surface)',
            color: loanAmount === amt ? 'var(--accent-on-solid)' : 'var(--text)',
            border: '1px solid var(--border)',
          }}
        >
          ₦{amt}bn
        </button>
      ))}
    </div>
  )
}

function LoanSummaryButton({
  loan,
  canAfford,
  onStart,
}: {
  loan: LoanDef
  canAfford: boolean
  onStart: () => void
}) {
  return (
    <button
      type="button"
      onClick={canAfford ? onStart : undefined}
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
  )
}

function LoanConfirmation({
  loan,
  selectedAmount,
  loanAmount,
  setLoanAmount,
  onCancel,
  takeLoan,
}: {
  loan: LoanDef
  selectedAmount: number
  loanAmount: number
  setLoanAmount: (amount: number) => void
  onCancel: () => void
  takeLoan: TakeLoanAction
}) {
  const { weeklyInterest, totalWeeklyRepayment } = loanRepaymentSummary(selectedAmount, loan)

  return (
    <div>
      <p className="text-[10px] font-semibold mb-1" style={{ color: 'var(--text)' }}>
        {loan.label} — choose amount
      </p>
      <LoanAmountSelector
        amounts={loan.amounts}
        loanAmount={loanAmount}
        setLoanAmount={setLoanAmount}
      />
      {selectedAmount > 0 && (
        <div className="text-[9px] mb-1 leading-tight" style={{ color: 'var(--text-secondary)' }}>
          ₦{selectedAmount}bn now → ₦{totalWeeklyRepayment.toFixed(3)}bn/wk for {loan.term}
          {parseFloat(loan.apr) > 0 && ` (₦${weeklyInterest.toFixed(3)}bn/wk interest)`}
        </div>
      )}
      <div className="flex gap-1.5">
        <button
          type="button"
          disabled={selectedAmount <= 0}
          onClick={() => {
            if (selectedAmount > 0) {
              takeLoan(selectedAmount, loan.source)
              onCancel()
            }
          }}
          className="px-2 py-0.5 text-[9px] font-semibold"
          style={{
            backgroundColor: selectedAmount > 0 ? 'var(--accent-solid)' : 'var(--surface)',
            color: selectedAmount > 0 ? 'var(--accent-on-solid)' : 'var(--text-secondary)',
            opacity: selectedAmount > 0 ? 1 : 0.4,
          }}
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
  )
}

function LoanRow({
  loan,
  pc,
  isConfirming,
  loanAmount,
  onStart,
  onCancel,
  setLoanAmount,
  takeLoan,
}: {
  loan: LoanDef
  pc: number
  isConfirming: boolean
  loanAmount: number
  onStart: () => void
  onCancel: () => void
  setLoanAmount: (amount: number) => void
  takeLoan: TakeLoanAction
}) {
  const selectedAmount = isConfirming ? loanAmount : 0
  const canAfford = pc >= loan.pcCost

  return (
    <div
      className="p-1.5 border-b text-[10px]"
      style={{
        borderColor: 'var(--border-subtle)',
        backgroundColor: 'var(--background)',
      }}
    >
      {!isConfirming ? (
        <LoanSummaryButton loan={loan} canAfford={canAfford} onStart={onStart} />
      ) : (
        <LoanConfirmation
          loan={loan}
          selectedAmount={selectedAmount}
          loanAmount={loanAmount}
          setLoanAmount={setLoanAmount}
          onCancel={onCancel}
          takeLoan={takeLoan}
        />
      )}
    </div>
  )
}

function FinancingSection({
  pc,
  confirming,
  loanAmount,
  initiateConfirm,
  cancelConfirm,
  setLoanAmount,
  takeLoan,
}: {
  pc: number
  confirming: ConfirmKey
  loanAmount: number
  initiateConfirm: (key: string) => void
  cancelConfirm: () => void
  setLoanAmount: (amount: number) => void
  takeLoan: TakeLoanAction
}) {
  return (
    <PanelSection title="Financing">
      {LOANS.map((loan) => {
        const key = `loan-${loan.source}`

        return (
          <LoanRow
            key={key}
            loan={loan}
            pc={pc}
            isConfirming={confirming === key}
            loanAmount={loanAmount}
            onStart={() => initiateConfirm(key)}
            onCancel={cancelConfirm}
            setLoanAmount={setLoanAmount}
            takeLoan={takeLoan}
          />
        )
      })}
    </PanelSection>
  )
}

function useEconomyPanelState() {
  const exp = useGameStore((s) => s.lastWeekExpenditure)
  const rev = useGameStore((s) => s.lastWeekRevenue)
  const pc = useGameStore((s) => s.stats.politicalCapital)
  const week = useGameStore((s) => s.week)
  const cooldowns = useGameStore((s) => s.economyCooldowns)
  const activeInitiative = useGameStore((s) => s.activeInitiative)
  const resolvedEvents = useGameStore((s) => s.resolvedEvents)
  const stats = useGameStore((s) => s.stats)

  return { exp, rev, pc, week, cooldowns, activeInitiative, resolvedEvents, stats }
}

function useEconomyPanelActions() {
  const cutSubventions = useGameStore((s) => s.economyCutSubventions)
  const reduceOverheads = useGameStore((s) => s.economyReduceOverheads)
  const raiseLuc = useGameStore((s) => s.economyRaiseLuc)
  const launchInitiative = useGameStore((s) => s.economyLaunchInitiative)
  const takeLoan = useGameStore((s) => s.economyTakeLoan)
  const courtGodfathers = useGameStore((s) => s.courtGodfathers)

  return {
    cutSubventions,
    reduceOverheads,
    raiseLuc,
    launchInitiative,
    takeLoan,
    courtGodfathers,
  }
}

function useEconomyPanelConfirmation() {
  const [confirming, setConfirming] = useState<ConfirmKey>(null)
  const [loanAmount, setLoanAmount] = useState<number>(0)

  const initiateConfirm = (key: string) => {
    setConfirming(key)
    setLoanAmount(0)
  }

  const cancelConfirm = () => {
    setConfirming(null)
    setLoanAmount(0)
  }

  return {
    confirming,
    loanAmount,
    setLoanAmount,
    initiateConfirm,
    cancelConfirm,
  }
}

// ── Main component ──────────────────────────────────────────

export function EconomyPanel() {
  const { exp, rev, pc, week, cooldowns, activeInitiative, resolvedEvents, stats } =
    useEconomyPanelState()
  const { cutSubventions, reduceOverheads, raiseLuc, launchInitiative, takeLoan, courtGodfathers } =
    useEconomyPanelActions()
  const { confirming, loanAmount, setLoanAmount, initiateConfirm, cancelConfirm } =
    useEconomyPanelConfirmation()

  const bleed = biggestBleed(exp)
  const opp = biggestOpportunity(rev)

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

        <RevenueLeversSection
          activeInitiative={activeInitiative}
          resolvedEvents={resolvedEvents}
          stats={stats}
          confirming={confirming}
          initiateConfirm={initiateConfirm}
          cancelConfirm={cancelConfirm}
          launchInitiative={launchInitiative}
        />
        <div className="h-1.5" />
        <SpendingCutsSection
          stats={stats}
          week={week}
          cooldowns={cooldowns}
          confirming={confirming}
          initiateConfirm={initiateConfirm}
          cancelConfirm={cancelConfirm}
          cutSubventions={cutSubventions}
          reduceOverheads={reduceOverheads}
          raiseLuc={raiseLuc}
        />
        <div className="h-1.5" />
        <PoliticalCapitalSection
          pc={pc}
          week={week}
          cooldowns={cooldowns}
          confirming={confirming}
          initiateConfirm={initiateConfirm}
          cancelConfirm={cancelConfirm}
          courtGodfathers={courtGodfathers}
        />
        <FinancingSection
          pc={pc}
          confirming={confirming}
          loanAmount={loanAmount}
          initiateConfirm={initiateConfirm}
          cancelConfirm={cancelConfirm}
          setLoanAmount={setLoanAmount}
          takeLoan={takeLoan}
        />
      </div>
    </div>
  )
}
