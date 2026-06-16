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
  | 'victoriaIsland'
  | 'lekki'
  | 'surulere'
  | 'oshodi'
  | 'alimosho'
  | 'periphery'
  | 'makoko'

export type ConstituencyApproval = Record<ConstituencyKey, number>

export type DelayedConsequence = {
  weekOffset: number
  delta: StatDelta
  factionImpact?: FactionDelta
  eventText: string
  constituencyImpact?: Partial<ConstituencyApproval>
}

export type Choice = {
  id: string
  label: string
  description: string
  immediate: StatDelta
  factionImpact: FactionDelta
  constituencyImpact?: Partial<ConstituencyApproval>
  delayed?: DelayedConsequence
  politicalCapitalCost?: number
  corruptionTrigger?: boolean
}

export type EventCard = {
  id: string
  week?: number
  triggerCondition?: (state: GameState) => boolean
  title: string
  body: string
  choices: Choice[]
  isRecurring?: boolean
  cooldownWeeks?: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  category: 'transport' | 'infrastructure' | 'political' | 'crisis' | 'economy' | 'social'
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
}

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

export type GameState = {
  week: number
  stats: Record<StatKey, number>
  factions: FactionState
  constituencyApproval: ConstituencyApproval
  activeEvent: EventCard | null
  eventQueue: EventCard[]
  pendingDelayed: PendingEvent[]
  resolvedEvents: string[]
  eventsResolvedThisWeek: number
  eventCooldowns: Record<string, number>
  timeline: TimelineEntry[]
  godfatherMessages: GodfatherMessage[]
  godfatherRefusalCount: number
  activeGodfatherMessage: GodfatherMessage | null
  usedGodfatherAskIds: string[]
  lastGodfatherWeek: number
  isGameOver: boolean
  gameOverReason?: string
  mode: 'simple' | 'detailed'
}
