import type { GameState, PendingMoment } from '../../state/types'
import { formatGameDate } from '../../utils/calendar'
import { formatReleaseStamp } from '../../version'
import { administrationLabel } from './buildShareCaption'
import type { CardFlavor } from './cardChrome'

export interface MomentStat {
  label: string
  value: string
}

export interface MomentCardData {
  momentType: PendingMoment['type']
  kicker: string
  headline: string
  subhead: string
  stats: MomentStat[]
  week: number
  tenure: string
  administrationLabel: string
  governorName: string
  flavor: CardFlavor
  gameVersion: string
}

const pct = (n: number) => `${Math.round(n)}%`
const score = (n: number) => `${Math.round(n)}`

function content(
  state: GameState,
  moment: PendingMoment,
): { kicker: string; headline: string; subhead: string; stats: MomentStat[]; flavor: CardFlavor } {
  const s = state.stats
  switch (moment.type) {
    case 're-election':
      return {
        kicker: 'Re-Election',
        headline: 'Returned to Office',
        subhead: moment.label ? `Re-elected on ${moment.label}.` : 'The mandate, renewed.',
        stats: [
          { label: 'Public Trust', value: pct(s.publicTrust) },
          { label: 'Term', value: 'Second' },
        ],
        flavor: 'triumph',
      }
    case 'crisis-survived':
      return {
        kicker: 'Crisis Weathered',
        headline: moment.label ?? 'The Storm Survived',
        subhead: 'The administration held when it could have fallen.',
        stats: [
          { label: 'Public Trust', value: pct(s.publicTrust) },
          { label: 'Security', value: score(s.securityIndex) },
        ],
        flavor: 'storm',
      }
    case 'landmark-delivered':
      return {
        kicker: 'Delivered',
        headline: moment.label ?? 'A Landmark, Delivered',
        subhead: 'Ground broken, concrete poured, a promise kept.',
        stats: [
          { label: 'Infrastructure', value: score(s.infrastructureScore) },
          { label: 'Public Trust', value: pct(s.publicTrust) },
        ],
        flavor: 'teal',
      }
    default:
      return {
        kicker: 'Milestone',
        headline: `${moment.label ?? 'A Year'} Complete`,
        subhead: 'Another year governing the ungovernable.',
        stats: [
          { label: 'Public Trust', value: pct(s.publicTrust) },
          { label: 'Infrastructure', value: score(s.infrastructureScore) },
        ],
        flavor: 'teal',
      }
  }
}

export function buildMomentCardData(state: GameState, moment: PendingMoment): MomentCardData {
  const c = content(state, moment)
  return {
    momentType: moment.type,
    kicker: c.kicker,
    headline: c.headline,
    subhead: c.subhead,
    stats: c.stats,
    week: state.week,
    tenure: formatGameDate(state.week),
    administrationLabel: administrationLabel(state.governorName),
    governorName: state.governorName,
    flavor: c.flavor,
    gameVersion: formatReleaseStamp(state.week),
  }
}
