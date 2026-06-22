export type StatKey =
  | 'igr'
  | 'cashReserve'
  | 'expenditure'
  | 'infrastructureScore'
  | 'publicTrust'
  | 'politicalCapital'
  | 'federalRelationship'
  | 'securityIndex'
  | 'corruptionPressure'
  | 'youthTension'
  | 'ghostWorkerRate'
  | 'contractorBacklog'
  | 'debtStock'
  | 'weeklyDebtRepayment'
  | 'weeklyDebtInterest'
  | 'landUseChargeEnforcement'
  | 'grantsCompliance'
  | 'civilServiceReformScore'
  | 'baseOverheads'
  | 'subventionCutRate'
  | 'capitalEfficiency'

export type StatDelta = Partial<Record<StatKey, number>>

export type FactionKey =
  | 'businessCommunity'
  | 'informalEconomy'
  | 'partyGodfathers'
  | 'federalGovt'
  | 'civilSocietyMedia'
  | 'lgChairmen'

export type FactionState = Record<FactionKey, number>

export type FactionDelta = Partial<FactionState>

export type ConstituencyKey =
  | 'lagosIsland'
  | 'etiOsa'
  | 'ibejuLekki'
  | 'surulere'
  | 'amuwoOdofin'
  | 'apapa'
  | 'oshodiIsolo'
  | 'mushin'
  | 'shomolu'
  | 'kosofe'
  | 'lagosMainland'
  | 'ikeja'
  | 'alimosho'
  | 'agege'
  | 'ifakoIjaye'
  | 'badagry'
  | 'epe'
  | 'ikorodu'
  | 'ojo'
  | 'ajeromiIfelodun'

export type ConstituencyApproval = Record<ConstituencyKey, number>

export type RevenueBreakdown = {
  paye: number
  mda: number
  luc: number
  other: number
  faac: number
  grants: number
  total: number
}

export type ExpenditureBreakdown = {
  personnel: number
  debtInterest: number
  debtRepayment: number
  overheads: number
  subventions: number
  contractorPayment: number
  total: number
}

export type HiddenDrag = {
  procurementLeakage: number
  ghostRegenRate: number
  overheadCreep: number
  faacVariance: number
}

export type ProjectStatus = 'active' | 'stalled' | 'completed' | 'abandoned'

export type CapitalProject = {
  id: string
  name: string
  location: ConstituencyKey
  totalCost: number
  weeklyDraw: number
  totalSpent: number
  effectiveProgress: number
  contractorId: string
  weeksRemaining: number
  status: ProjectStatus
  stalledReason?: 'backlog' | 'political' | 'flooding' | 'procurement_inquiry'
}

export type LoanSource = 'domestic_bank' | 'world_bank' | 'bond_issuance' | 'federal_govt'

export type LoanTerms = {
  annualRate: number
  tenorYears: number
  negotiationWeeks: number
  conditions?: string[]
}

export type Loan = {
  id: string
  source: LoanSource
  principal: number
  outstanding: number
  weeklyRepayment: number
  weeklyInterest: number
  disbursedOnWeek: number
  conditions: string[]
}

export type DelayedConsequence = {
  weekOffset: number
  delta: StatDelta
  factionImpact?: FactionDelta
  eventText: string
  constituencyImpact?: Partial<ConstituencyApproval>
  followUpEventId?: string
}

export type NPCArchetypeKey =
  | 'journalist'
  | 'youth-organiser'
  | 'insider'
  | 'union-leader'
  | 'opposition-senator'
  | 'diaspora-activist'
  | 'oba-liaison'
  | 'business-mogul'

export type Choice = {
  id: string
  label: string
  description: string
  immediate: StatDelta
  factionImpact: FactionDelta
  constituencyImpact?: Partial<ConstituencyApproval>
  delayed?: DelayedConsequence
  followUpEventId?: string
  politicalCapitalCost?: number
  corruptionTrigger?: boolean
  setFlags?: Record<string, boolean>
  npcImpact?: Partial<Record<NPCArchetypeKey, number>>
  resentmentDelta?: number
  launchInitiative?: {
    id: string
    name: string
    weeksRemaining: number
    totalWeeks: number
    completionEventId: string
  }
  launchProject?: {
    name: string
    location: ConstituencyKey
    totalCost: number
    weeklyDraw: number
    weeksRemaining: number
    contractorId: string
  }
  // Phase 4 extensions
  setSuspensionWeeks?: number  // starts/ends emergency suspension
  setLitigationTimer?: number  // starts/clears judicial litigation arc
  // Deck management
  diminishingReturns?: boolean  // yield scales down on repeat selection; corruption spikes after 2nd use
}

export type EventCard = {
  id: string
  week?: number
  maxWeek?: number  // event expires from pool after this week (complement to `week` minimum)
  triggerCondition?: (state: GameState) => boolean
  title: string
  body: string
  choices: Choice[]
  isRecurring?: boolean
  cooldownWeeks?: number
  maxTotalFirings?: number
  weight?: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  category: 'transport' | 'infrastructure' | 'political' | 'crisis' | 'economy' | 'social' | 'election' | 'riot'
  season?: 'wet' | 'dry'
  npcArchetype?: NPCArchetypeKey
  npcTier?: 'ally' | 'neutral' | 'hostile'
  requiresInitiativeSlot?: boolean
  factionImpact?: FactionDelta
  followUpEventId?: string
}

export type PendingEvent = {
  id: string
  firesOnWeek: number
  consequence: DelayedConsequence
  sourceEventTitle: string
}

export type TimelineEntry = {
  week: number
  type: 'event' | 'delayed-consequence' | 'godfather' | 'milestone'
  title: string
  description: string
  statDelta?: StatDelta
  factionDelta?: FactionDelta
}

// --- Phase 2 Types ---

export type DeputyKey =
  | 'technocrat'
  | 'politician'
  | 'loyalist'
  | 'reformer'
  | 'traditionalist'
  | 'economist'
  | 'security-chief'

export type DeputyState = {
  key: DeputyKey
  resentment: number
  revealed: boolean
}

export type NPCKey = 'npc1' | 'npc2' | 'npc3'

export type NPCState = {
  isActive: boolean
  relationship: number
  pressure: number
  archetypeKey: NPCArchetypeKey
  name: string
  hasBeenInvited?: boolean
  activeWeek?: number
}

export type CommissionerRole = 'works' | 'finance' | 'environment' | 'transport' | 'information'

export type CommissionerState = {
  name: string
  competence: number
  loyalty: number
  isGodfatherChoice: boolean
}

export type PrimaryScenario = 'A' | 'B' | 'C'
export type FashemuPhase = 'dormant' | 'active' | 'warning' | 'break' | 'reconciled' | 'dead'
export type FashemuEndingPath = 'A' | 'B' | 'C' | 'D'

export type RunArchetype = 'technocrat' | 'loyalist' | 'outsider'
export type RunSimStrategy = 'first' | 'random' | 'weighted' | 'winning'

export type RunMeta = {
  archetype: RunArchetype | null
  simStrategy: RunSimStrategy | null
  simSeed: number | null
  simWeeksSkipped: number | null
}

// --- End Phase 2 Types ---

export type GodfatherMessage = {
  id: string
  week: number
  text: string
  ask: GodfatherAsk
}

export type GodfatherAsk = {
  type: 'contract' | 'appointment' | 'suppress' | 'money'
  description: string
  onAccept: StatDelta & { factionImpact?: FactionDelta }
  onRefuse: StatDelta & { factionImpact?: FactionDelta }
}

export type InitiativeState = {
  id: string
  name: string
  weeksRemaining: number
  totalWeeks: number
  completionEventId: string
}

export type GameState = {
  week: number
  stateFlags: Record<string, boolean>
  stats: Record<StatKey, number>
  factions: FactionState
  constituencyApproval: ConstituencyApproval
  activeEvent: EventCard | null
  eventQueue: EventCard[]
  pendingDelayed: PendingEvent[]
  resolvedEvents: string[]
  eventsResolvedThisWeek: number
  consecutiveBankruptWeeks: number
  eventCooldowns: Record<string, number>
  timeline: TimelineEntry[]
  godfatherMessages: GodfatherMessage[]
  godfatherRefusalCount: number
  activeGodfatherMessage: GodfatherMessage | null
  usedGodfatherAskIds: string[]
  lastGodfatherWeek: number
  activeLoans: Loan[]
  capitalProjects: CapitalProject[]
  faacVarianceAccumulated: number
  consecutiveDeficitWeeks: number
  lastWeekRevenue?: RevenueBreakdown
  lastWeekExpenditure?: ExpenditureBreakdown
  lastWeekStatSnapshot?: { cashReserve: number; publicTrust: number; politicalCapital: number }
  godfatherComplianceCount: number
  impeachmentStage: number
  emergencyLoansTaken: number
  highCorruptionWeeks: number
  grantFreezeCount: number
  grantFreezeDuration: number
  riotModeActive: boolean
  activeInitiative: InitiativeState | null
  isGameOver: boolean
  gameOverReason?: string
  mode: 'simple' | 'detailed'
  // Phase 2
  deputy: DeputyState | null
  fashemuRelationship: number
  fashemuPhase: FashemuPhase
  fashemuAskIndex: number
  fashemuEndingPath: FashemuEndingPath | null
  activeNPCs: Record<NPCKey, NPCState>
  commissioners: Partial<Record<CommissionerRole, CommissionerState>>
  lgaElectionResult: number | null
  lgaElectionHeld: boolean
  primaryWon: boolean | null
  primaryScenario: PrimaryScenario | null
  campaignDecisions: string[]
  electionResult: number | null
  reElected: boolean | null
  inCampaignMode: boolean
  offeredDeputies: DeputyKey[]
  // Phase 4
  emergencySuspensionWeeks: number  // 0 = normal play; counts down each tick
  administratorActIndex: number     // which suspension act is next (0–4, cycles)
  litigationActive: boolean         // judicial arc in progress
  litigationTimer: number           // weeks until Supreme Court ruling
  offCycleElection: boolean         // flag set when litigation won
  // Deck management
  choiceUseCounts: Record<string, number>  // key: `${eventId}:${choiceId}` — tracks repeat selections
  // Term tracking
  currentTerm: number  // 1 = first term, 2 = second term after re-election
  // Per-LGA approval sliding window (last 8 weeks)
  approvalHistory: Record<ConstituencyKey, number[]>
  // Run metadata — diagnostic only, no gameplay effect
  runMeta: RunMeta
}
