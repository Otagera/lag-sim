import { PLAY_URL, SHARE_HASHTAGS } from '../../config'
import type { MomentCardData } from './buildMomentCardData'
import type { ShareCardData } from './buildShareCardData'

export interface ShareCaption {
  text: string
  url: string
}

/** "The Adebayo Administration" — or a graceful default when unnamed. */
export function administrationLabel(governorName?: string): string {
  const name = governorName?.trim()
  return name ? `The ${name} Administration` : "The People's Administration"
}

const LEGACY_LINE: Record<
  ShareCardData['endingFlavor'],
  (admin: string, data: ShareCardData) => string
> = {
  triumph: (admin, d) => `${admin} held Lagos and sealed a legacy. ${d.verdictHeadline}`,
  teal: (admin, d) => `${admin} closed the books in week ${d.weekCount}. ${d.verdictHeadline}`,
  storm: (admin, d) =>
    `${admin} was overtaken in week ${d.weekCount}. ${d.verdictHeadline} Could you hold the line?`,
  crisis: (admin, d) =>
    `${admin} fell in week ${d.weekCount}. ${d.verdictHeadline} Think you'd last longer?`,
}

export function buildLegacyCaption(data: ShareCardData, governorName?: string): ShareCaption {
  const admin = administrationLabel(governorName)
  const line = LEGACY_LINE[data.endingFlavor](admin, data)
  return {
    text: `${line}\n\n${SHARE_HASHTAGS.join(' ')}`,
    url: PLAY_URL,
  }
}

export function buildMomentCaption(data: MomentCardData): ShareCaption {
  const line = `${data.administrationLabel} — ${data.headline}. ${data.subhead}`
  return {
    text: `${line}\n\n${SHARE_HASHTAGS.join(' ')}`,
    url: PLAY_URL,
  }
}
