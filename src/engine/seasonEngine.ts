import { isDettyDecember, isHarmattan, isSallahPeriod, seasonOf, weekToDate } from '../utils/calendar'

export type SeasonModifier = {
  label: string
  season: 'wet' | 'dry'
  isWetSeason: boolean
  isFederalElectionYear: boolean
  isBudgetCrunch: boolean
  isHarmattan: boolean
  isDettyDecember: boolean
  isSallahPeriod: boolean
  faacVarianceScale: number          // wet season: 1.5 (wider FAAC swings)
  faacBasePenalty: number            // 0–1 fraction of FAAC lost (budget crunch / election noise)
  politicalCapitalCostScale: number  // federal election year: 1.2 (everything costs more)
  federalRelationshipWeeklyDrift: number  // negative = downward drift per week
  floodEventWeightMultiplier: number // wet-season events: 3.0 in wet season
}

// Year 1 (weeks 1–52) and year 4 (weeks 157–208) are federal election years.
// Nigerian presidential cycle: 2023 → 2027 → 2031. Both the start and end
// of the governor's term coincide with national campaigns, making FAAC
// politically volatile and politicalCapital more expensive to spend.
function isFederalElectionYear(week: number): boolean {
  return week <= 52 || week >= 157
}

// December–January: Lagos appropriations bill not yet signed, FAAC transfers
// are often withheld pending new-year confirmation from Abuja.
function isBudgetCrunch(week: number): boolean {
  const month = weekToDate(week).getMonth() + 1
  return month === 12 || month === 1
}

export function getSeasonModifier(week: number): SeasonModifier {
  const season = seasonOf(week)
  const isWetSeason = season === 'wet'
  const fedElection = isFederalElectionYear(week)
  const budgetCrunch = isBudgetCrunch(week)
  const harmattan = isHarmattan(week)
  const dettyDec = isDettyDecember(week)
  const sallah = isSallahPeriod(week)

  const labels: string[] = []
  if (isWetSeason) labels.push('Rainy Season')
  if (fedElection) labels.push('Federal Election Year')
  if (budgetCrunch) labels.push('Budget Crunch')
  if (harmattan) labels.push('Harmattan')
  if (dettyDec) labels.push('Detty December')
  if (sallah) labels.push('Sallah')
  const label = labels.length > 0 ? labels.join(' · ') : 'Normal'

  return {
    label,
    season,
    isWetSeason,
    isFederalElectionYear: fedElection,
    isBudgetCrunch: budgetCrunch,
    isHarmattan: harmattan,
    isDettyDecember: dettyDec,
    isSallahPeriod: sallah,
    faacVarianceScale: isWetSeason ? 1.5 : 1.0,
    faacBasePenalty: budgetCrunch ? 0.2 : fedElection ? 0.1 : 0,
    politicalCapitalCostScale: fedElection ? 1.2 : 1.0,
    federalRelationshipWeeklyDrift: fedElection ? -0.3 : 0,
    floodEventWeightMultiplier: isWetSeason ? 3.0 : 1.0,
  }
}
