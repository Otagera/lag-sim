import type { NewsArticle, GameState, ChannelMeta, MediaChannel } from '../state/types'

function hashInt(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

function pick<T>(arr: T[], seed: string): T {
  return arr[hashInt(seed) % arr.length]
}

const CREATOR_HANDLES = [
  '@LagosEye', '@NaijaSceneDaily', '@AbikeReports', '@LekkoStar',
  '@IsiomaTV', '@OluwafemiLive', '@BukkyViewpoint', '@LagosUncensored',
]

const TWEET_HANDLES = [
  '@AkinwaleReporter', '@OlabisiMedialagi', '@LagosWatcher',
  '@NnamdiPolitics', '@RCFarukh', '@ChidimmaReacts',
]

const HASHTAGS: Record<NewsArticle['category'], string[]> = {
  political: ['#LagosPolitics', '#GovernorWatch', '#OurLagos', '#LagosSpeaks'],
  crisis: ['#LagosAlert', '#LagosEmergency', '#WeAreWatching', '#LagosCrisis'],
  fiscal: ['#LagosFinance', '#OurMoney', '#AccountabilityLagos'],
  milestone: ['#LagosProgress', '#LagosRising', '#LagosWins'],
  background: ['#LagosInsider', '#LagosGist', '#NaijaGovt'],
}

const PODCAST_SHOWS = [
  'State of Play', 'Lagos Governance Watch', 'The Alausa Brief',
  'Policy Corner', 'Nigerian Matters',
]

const PODCAST_HOSTS = [
  'Tokunbo Adeyemi', 'Ngozi Osei-Eze', 'Femi Badmus', 'Amaka Okafor',
]

export function selectChannelMeta(
  article: NewsArticle,
  state: GameState,
): ChannelMeta {
  const seed = article.headline.slice(0, 20)
  const channel = pickChannel(article, state)

  switch (channel) {
    case 'shortVideo': {
      const viewBase = 500_000 + hashInt(seed + 'v') % 2_000_000
      return {
        channel,
        views: Math.round(viewBase / 1000) * 1000,
        creatorHandle: pick(CREATOR_HANDLES, seed + 'h'),
      }
    }
    case 'tweet': {
      const rtBase = 800 + hashInt(seed + 'rt') % 12000
      const likeBase = rtBase * 3 + hashInt(seed + 'lk') % 20000
      return {
        channel,
        handle: pick(TWEET_HANDLES, seed + 'tw'),
        hashtag: pick(HASHTAGS[article.category] ?? HASHTAGS.background, seed + 'ht'),
        retweets: Math.round(rtBase / 100) * 100,
        likes: Math.round(likeBase / 100) * 100,
      }
    }
    case 'podcast': {
      const minBase = 22 + hashInt(seed + 'm') % 38
      return {
        channel,
        showName: pick(PODCAST_SHOWS, seed + 'sh'),
        hostName: pick(PODCAST_HOSTS, seed + 'ho'),
        duration: `${minBase}:${String(hashInt(seed + 's') % 60).padStart(2, '0')}`,
        keyQuote: buildKeyQuote(article),
      }
    }
    case 'whatsapp': {
      const fwd = 3 + hashInt(seed + 'f') % 47
      return {
        channel,
        forwardCount: fwd,
        isRumor: article.category === 'background',
      }
    }
    default:
      return { channel: 'newspaper' }
  }
}

function pickChannel(article: NewsArticle, state: GameState): MediaChannel {
  const { category } = article
  const trust = state.stats.publicTrust
  const week = state.week
  const seed = article.headline.slice(0, 12)

  // Crisis → short video (viral anger/shock spreads fastest on short-form)
  if (category === 'crisis') return 'shortVideo'

  // Political with any credibility gap → tweet thread
  if (category === 'political' && (trust < 60 || state.stats.corruptionPressure > 40)) return 'tweet'

  // Background / rumour → WhatsApp (unverified info travels via forwarded messages)
  if (category === 'background') return 'whatsapp'

  // Fiscal → podcast (budget analysis belongs to the long-form commentary genre)
  // Use week > 8 so it can appear from mid-game onward
  if (category === 'fiscal' && week > 8) return 'podcast'

  // Milestone achievements → newspaper (formal record of achievement)
  if (category === 'milestone') return 'newspaper'

  // Remaining political stories (high trust / low corruption) → rotate through channels
  // Use a stable hash so the same article always gets the same channel
  if (category === 'political') {
    const channels: MediaChannel[] = ['newspaper', 'tweet', 'newspaper']
    return pick(channels, seed + 'r')
  }

  return 'newspaper'
}

function buildKeyQuote(article: NewsArticle): string {
  const words = article.deck.split(' ')
  const snippet = words.slice(0, 18).join(' ')
  return snippet.endsWith('.') || snippet.endsWith(',')
    ? snippet
    : snippet + '…'
}
