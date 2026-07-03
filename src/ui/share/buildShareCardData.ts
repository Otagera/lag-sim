import { pickKeyMomentsForLegacy, pickVerdictHeadline } from '../../engine/endingNarrator'
import type { GameOverType, GameState } from '../../state/types'
import { formatGameDate } from '../../utils/calendar'

function grade(value: number, max: number): string {
  const pct = value / max
  if (pct >= 0.9) return 'A'
  if (pct >= 0.75) return 'B'
  if (pct >= 0.6) return 'C'
  if (pct >= 0.4) return 'D'
  return 'F'
}

function gradeColor(g: string): string {
  switch (g) {
    case 'A':
      return '#3AA048'
    case 'B':
      return '#3B9FE0'
    case 'C':
      return '#C08C0C'
    case 'D':
      return '#C08C0C'
    default:
      return '#D7322A'
  }
}

const EXIT_REASONS: Record<string, string> = {
  bankruptcy: 'State Insolvency \u2014 Term Cut Short',
  federalTakeover: 'Federal Takeover \u2014 Term Ended',
  massUprising: 'Mass Uprising \u2014 Government Overwhelmed',
  impeachment: 'Removal by Assembly',
  primaryLoss: 'Primary Defeat \u2014 Re-Election Ended',
  termEndLoss: 'Term Ended \u2014 Not Re-Elected',
  termEndWin: 'Re-Election Victory',
  secondTermEnd: 'Two Terms Complete \u2014 Legacy Sealed',
}

const STAMP_WORDS: Record<string, string> = {
  bankruptcy: 'INSOLVENT',
  federalTakeover: 'SEIZED',
  massUprising: 'OVERRUN',
  impeachment: 'REMOVED',
  primaryLoss: 'REJECTED',
  termEndLoss: 'REJECTED',
  termEndWin: 'RETURNED',
  secondTermEnd: 'LEGACY',
}

export interface ShareCardData {
  exitLabel: string
  /** short rubber-stamp verdict, e.g. INSOLVENT / REMOVED / RETURNED */
  stampWord?: string
  verdictHeadline: string
  tenure: string
  weekCount: number
  decisionCount: number
  keyMoments: { week: number; type: string; title: string; description: string }[]
  grades: { key: string; label: string; value: number; grade: string; color: string }[]
  hasFashemuEnding: boolean
  endingFlavor: 'crisis' | 'storm' | 'teal' | 'triumph'
  gameVersion: string
}

const CRISIS_ENDINGS: GameOverType[] = ['bankruptcy', 'massUprising', 'impeachment']
const STORM_ENDINGS: GameOverType[] = ['federalTakeover']

export function buildShareCardData(state: GameState): ShareCardData {
  const gameOverType = state.gameOverType ?? 'bankruptcy'
  const exitLabel = EXIT_REASONS[gameOverType] ?? 'Game Over'

  const verdictHeadline = pickVerdictHeadline(state, gameOverType)

  const endDate = formatGameDate(state.week)
  const decisionCount = state.resolvedEvents.length
  const keyMoments = pickKeyMomentsForLegacy(state).map((m) => ({
    week: m.week,
    type: m.type,
    title: m.title,
    description: m.description,
  }))

  const statKeys = ['publicTrust', 'infrastructureScore', 'securityIndex', 'youthTension'] as const
  const grades = statKeys.map((key) => {
    const rawVal = state.stats[key]
    const val = key === 'youthTension' ? 100 - rawVal : rawVal
    const g = grade(val, 100)
    const label =
      key === 'publicTrust'
        ? 'Trust'
        : key === 'infrastructureScore'
          ? 'Infra'
          : key === 'securityIndex'
            ? 'Security'
            : 'Youth'
    return { key, label, value: val, grade: g, color: gradeColor(g) }
  })

  const hasFashemuEnding = state.fashemuEndingPath !== null && state.fashemuEndingPath !== undefined

  let endingFlavor: ShareCardData['endingFlavor'] = 'teal'
  if (CRISIS_ENDINGS.includes(gameOverType)) endingFlavor = 'crisis'
  else if (STORM_ENDINGS.includes(gameOverType)) endingFlavor = 'storm'
  else if (gameOverType === 'secondTermEnd' || gameOverType === 'termEndWin')
    endingFlavor = 'triumph'

  return {
    exitLabel,
    stampWord: STAMP_WORDS[gameOverType],
    verdictHeadline,
    tenure: endDate,
    weekCount: state.week,
    decisionCount,
    keyMoments,
    grades,
    hasFashemuEnding,
    endingFlavor,
    gameVersion: `v${import.meta.env.PACKAGE_VERSION ?? '0.0.0'} \u00b7 Week ${state.week}`,
  }
}
