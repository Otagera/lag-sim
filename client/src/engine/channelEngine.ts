import type { ChannelMeta, GameState, MediaChannel, NewsArticle } from '../state/types'
import {
  buildPodcastExchange,
  buildTweetReplies,
  buildVideoComments,
  buildWhatsAppThread,
  hashInt,
  pick,
} from './socialContent'

const CREATOR_HANDLES = [
  '@LagosEye',
  '@NaijaSceneDaily',
  '@AbikeReports',
  '@LekkoStar',
  '@IsiomaTV',
  '@OluwafemiLive',
  '@BukkyViewpoint',
  '@LagosUncensored',
]

const TWEET_HANDLES = [
  '@AkinwaleReporter',
  '@OlabisiMedialagi',
  '@LagosWatcher',
  '@NnamdiPolitics',
  '@RCFarukh',
  '@ChidimmaReacts',
]

const HASHTAGS: Record<NewsArticle['category'], string[]> = {
  political: ['#LagosPolitics', '#GovernorWatch', '#OurLagos', '#LagosSpeaks'],
  crisis: ['#LagosAlert', '#LagosEmergency', '#WeAreWatching', '#LagosCrisis'],
  fiscal: ['#LagosFinance', '#OurMoney', '#AccountabilityLagos'],
  milestone: ['#LagosProgress', '#LagosRising', '#LagosWins'],
  background: ['#LagosInsider', '#LagosGist', '#NaijaGovt'],
}

const PODCAST_SHOWS = [
  'State of Play',
  'Lagos Governance Watch',
  'The Alausa Brief',
  'Policy Corner',
  'Nigerian Matters',
]

const PODCAST_HOSTS = ['Tokunbo Adeyemi', 'Ngozi Osei-Eze', 'Femi Badmus', 'Amaka Okafor']

export function selectChannelMeta(article: NewsArticle, state: GameState): ChannelMeta {
  const seed = article.headline.slice(0, 20)
  const channel = pickChannel(article, state)

  switch (channel) {
    case 'shortVideo': {
      const viewBase = 500_000 + (hashInt(`${seed}v`) % 2_000_000)
      return {
        channel,
        views: Math.round(viewBase / 1000) * 1000,
        creatorHandle: pick(CREATOR_HANDLES, `${seed}h`),
        videoComments: buildVideoComments(article, state),
      }
    }
    case 'tweet': {
      const rtBase = 800 + (hashInt(`${seed}rt`) % 12000)
      const likeBase = rtBase * 3 + (hashInt(`${seed}lk`) % 20000)
      return {
        channel,
        handle: pick(TWEET_HANDLES, `${seed}tw`),
        hashtag: pick(HASHTAGS[article.category] ?? HASHTAGS.background, `${seed}ht`),
        retweets: Math.round(rtBase / 100) * 100,
        likes: Math.round(likeBase / 100) * 100,
        tweetReplies: buildTweetReplies(article, state),
      }
    }
    case 'podcast': {
      const minBase = 22 + (hashInt(`${seed}m`) % 38)
      const hostName = pick(PODCAST_HOSTS, `${seed}ho`)
      const { coHostName, podcastExchange } = buildPodcastExchange(article, state, hostName)
      return {
        channel,
        showName: pick(PODCAST_SHOWS, `${seed}sh`),
        hostName,
        duration: `${minBase}:${String(hashInt(`${seed}s`) % 60).padStart(2, '0')}`,
        keyQuote: buildKeyQuote(article),
        coHostName,
        podcastExchange,
      }
    }
    case 'whatsapp': {
      return {
        channel,
        ...buildWhatsAppThread(article, state),
      }
    }
    default:
      return { channel: 'newspaper' }
  }
}

type WeightedChannel = { channel: MediaChannel; weight: number }

// Each category has a primary lean plus alternates. Weighted + seeded so the
// same headline always resolves to the same channel, but channels are no longer
// locked one-to-one to a category.
const CHANNEL_WEIGHTS: Record<NewsArticle['category'], WeightedChannel[]> = {
  crisis: [
    { channel: 'shortVideo', weight: 5 },
    { channel: 'tweet', weight: 3 },
    { channel: 'whatsapp', weight: 2 },
  ],
  political: [
    { channel: 'tweet', weight: 4 },
    { channel: 'newspaper', weight: 3 },
    { channel: 'shortVideo', weight: 2 },
    { channel: 'whatsapp', weight: 1 },
  ],
  fiscal: [
    { channel: 'podcast', weight: 4 },
    { channel: 'newspaper', weight: 3 },
    { channel: 'tweet', weight: 2 },
  ],
  milestone: [
    { channel: 'newspaper', weight: 4 },
    { channel: 'tweet', weight: 2 },
    { channel: 'shortVideo', weight: 2 },
  ],
  background: [
    { channel: 'whatsapp', weight: 5 },
    { channel: 'tweet', weight: 2 },
  ],
}

function pickWeighted(entries: WeightedChannel[], seed: string): MediaChannel {
  const total = entries.reduce((sum, e) => sum + e.weight, 0)
  if (total <= 0) return 'newspaper'
  let r = hashInt(seed) % total
  for (const e of entries) {
    if (r < e.weight) return e.channel
    r -= e.weight
  }
  return entries[entries.length - 1].channel
}

function pickChannel(article: NewsArticle, state: GameState): MediaChannel {
  const seed = article.headline.slice(0, 12)
  const base = CHANNEL_WEIGHTS[article.category] ?? CHANNEL_WEIGHTS.background
  const trust = state.stats.publicTrust
  const corruption = state.stats.corruptionPressure
  const credibilityGap = trust < 45 || corruption > 55

  const entries = base
    .map((e) => {
      let weight = e.weight
      // Podcast (long-form) only from mid-game onward.
      if (e.channel === 'podcast' && state.week <= 8) weight = 0
      // Low trust / high corruption pushes stories onto tweet & WhatsApp.
      if ((e.channel === 'tweet' || e.channel === 'whatsapp') && credibilityGap) weight += 2
      return { channel: e.channel, weight }
    })
    .filter((e) => e.weight > 0)

  if (entries.length === 0) return 'newspaper'
  return pickWeighted(entries, `${seed}chan`)
}

function buildKeyQuote(article: NewsArticle): string {
  const words = article.deck.split(' ')
  const snippet = words.slice(0, 18).join(' ')
  return snippet.endsWith('.') || snippet.endsWith(',') ? snippet : `${snippet}…`
}
