import { describe, expect, it } from 'vitest'
import { PLAY_URL, SHARE_HASHTAGS } from '../../config'
import type { MomentCardData } from './buildMomentCardData'
import { administrationLabel, buildLegacyCaption, buildMomentCaption } from './buildShareCaption'
import type { ShareCardData } from './buildShareCardData'

const legacyData = (over: Partial<ShareCardData> = {}): ShareCardData => ({
  exitLabel: 'State Insolvency',
  verdictHeadline: 'The Governor Who Ran Out of Road',
  tenure: '5 July, 2027',
  weekCount: 27,
  decisionCount: 30,
  keyMoments: [],
  grades: [],
  hasFashemuEnding: false,
  endingFlavor: 'crisis',
  gameVersion: 'Beta · Week 27',
  ...over,
})

const momentData = (over: Partial<MomentCardData> = {}): MomentCardData => ({
  momentType: 're-election',
  kicker: 'Re-Election',
  headline: 'Returned to Office',
  subhead: 'The mandate, renewed.',
  stats: [],
  week: 210,
  tenure: '15 May, 2031',
  administrationLabel: 'The Adebayo Administration',
  governorName: 'Adebayo',
  flavor: 'triumph',
  gameVersion: 'Beta · Week 210',
  ...over,
})

describe('administrationLabel', () => {
  it('uses the governor name when present', () => {
    expect(administrationLabel('Adebayo')).toBe('The Adebayo Administration')
  })
  it('falls back gracefully when blank or whitespace', () => {
    expect(administrationLabel('')).toBe("The People's Administration")
    expect(administrationLabel('   ')).toBe("The People's Administration")
    expect(administrationLabel(undefined)).toBe("The People's Administration")
  })
})

describe('buildLegacyCaption', () => {
  it('includes the administration label, hashtags, and play URL', () => {
    const cap = buildLegacyCaption(legacyData(), 'Adebayo')
    expect(cap.url).toBe(PLAY_URL)
    expect(cap.text).toContain('The Adebayo Administration')
    for (const tag of SHARE_HASHTAGS) expect(cap.text).toContain(tag)
  })
  it('uses the People’s fallback when unnamed', () => {
    expect(buildLegacyCaption(legacyData()).text).toContain("The People's Administration")
  })
  it('varies the line by ending flavor', () => {
    expect(buildLegacyCaption(legacyData({ endingFlavor: 'triumph' })).text).toContain('sealed a legacy')
    expect(buildLegacyCaption(legacyData({ endingFlavor: 'crisis' })).text).toContain('fell in week 27')
  })
})

describe('buildMomentCaption', () => {
  it('includes the headline, subhead, hashtags, and play URL', () => {
    const cap = buildMomentCaption(momentData())
    expect(cap.url).toBe(PLAY_URL)
    expect(cap.text).toContain('The Adebayo Administration')
    expect(cap.text).toContain('Returned to Office')
    expect(cap.text).toContain(SHARE_HASHTAGS[0])
  })
})
