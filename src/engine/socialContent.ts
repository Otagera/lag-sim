import { CONSTITUENCIES } from '../data/constituencies'
import {
  type Archetype,
  CHAT_TIMES,
  COMMENT_TEMPLATES,
  EMOJI_BY_TONE,
  type Persona,
  PERSONAS,
  PODCAST_CO_HOSTS,
  PODCAST_TEMPLATES,
  WHATSAPP_CHANNELS,
  WHATSAPP_GROUPS,
} from '../data/socialTemplates'
import type {
  ConstituencyKey,
  EmojiTally,
  GameState,
  NewsArticle,
  PodcastLine,
  SocialReply,
  SocialTone,
  WhatsAppMsg,
} from '../state/types'

// ── Shared seeded helpers (reused by channelEngine) ──────────────
export function hashInt(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function pick<T>(arr: T[], seed: string): T {
  return arr[hashInt(seed) % arr.length]
}

// Distinct, seeded selection of up to `n` items.
export function pickN<T>(arr: T[], n: number, seed: string): T[] {
  const pool = [...arr]
  const out: T[] = []
  let i = 0
  while (out.length < n && pool.length > 0) {
    const idx = hashInt(`${seed}:${i}`) % pool.length
    out.push(pool.splice(idx, 1)[0])
    i++
  }
  return out
}

const LGA_LABEL = new Map(CONSTITUENCIES.map((c) => [c.key, c.label]))

const CAT_WORD: Record<NewsArticle['category'], string> = {
  fiscal: 'budget',
  political: 'political',
  crisis: 'emergency',
  milestone: 'progress',
  background: 'gist',
}

export interface SocialContext {
  lga: string
  stat: string
  value: string
  delta: string
  dir: string
  cat: string
}

export function deriveContext(article: NewsArticle): SocialContext {
  const primary = article.dataPoints[0]
  const lgaPoint = article.dataPoints.find((dp) => LGA_LABEL.has(dp.label as ConstituencyKey))
  const lga = lgaPoint
    ? (LGA_LABEL.get(lgaPoint.label as ConstituencyKey) as string)
    : pick(CONSTITUENCIES, `${article.headline}lga`).label
  const statRaw = primary?.label ?? ''
  const stat = LGA_LABEL.has(statRaw as ConstituencyKey)
    ? (LGA_LABEL.get(statRaw as ConstituencyKey) as string)
    : statRaw || 'the situation'
  const value = primary?.value ?? 'these numbers'
  const delta = primary?.delta ?? 'this move'
  const dir =
    primary?.positive === true ? 'rising' : primary?.positive === false ? 'falling' : 'moving'
  return { lga, stat, value, delta, dir, cat: CAT_WORD[article.category] }
}

export function deriveTone(article: NewsArticle, state: GameState): SocialTone {
  const primary = article.dataPoints[0]
  if (article.channelMeta?.isRumor || article.category === 'background') return 'rumor'
  if (article.category === 'milestone' || primary?.positive === true) return 'positive'
  if (article.category === 'crisis' || primary?.positive === false) return 'negative'
  const { publicTrust, corruptionPressure, youthTension } = state.stats
  if (publicTrust < 40 || corruptionPressure > 55 || youthTension > 70) return 'negative'
  return 'neutral'
}

function fill(template: string, ctx: SocialContext): string {
  return template
    .replace(/\{lga\}/g, ctx.lga)
    .replace(/\{stat\}/g, ctx.stat)
    .replace(/\{value\}/g, ctx.value)
    .replace(/\{delta\}/g, ctx.delta)
    .replace(/\{dir\}/g, ctx.dir)
    .replace(/\{cat\}/g, ctx.cat)
}

const TONE_ARCHETYPES: Record<SocialTone, Archetype[]> = {
  negative: ['alarmist', 'skeptic', 'cynic', 'partisan', 'personal'],
  positive: ['amplifier', 'personal', 'partisan', 'cynic', 'skeptic'],
  rumor: ['amplifier', 'skeptic', 'alarmist', 'cynic'],
  neutral: ['skeptic', 'personal', 'cynic', 'partisan', 'amplifier'],
}

function selectPersonas(tone: SocialTone, count: number, seed: string): Persona[] {
  const wanted = new Set(TONE_ARCHETYPES[tone])
  const eligible = PERSONAS.filter((p) => wanted.has(p.archetype))
  const base = eligible.length >= count ? eligible : PERSONAS
  return pickN(base, count, seed)
}

function lineFor(persona: Persona, tone: SocialTone, ctx: SocialContext, seed: string): string {
  const pools = COMMENT_TEMPLATES[persona.archetype]
  const pool = pools[tone] ?? pools.neutral ?? Object.values(pools)[0] ?? []
  const template = pool.length > 0 ? pick(pool, seed) : '{stat} is now {value}.'
  return fill(template, ctx)
}

// ── Builders ─────────────────────────────────────────────────────
export function buildTweetReplies(article: NewsArticle, state: GameState): SocialReply[] {
  const ctx = deriveContext(article)
  const tone = deriveTone(article, state)
  const seed = article.headline
  const count = 3 + (hashInt(`${seed}#tw`) % 2)
  return selectPersonas(tone, count, `${seed}tw`).map((p, i) => ({
    author: p.name,
    handle: p.handle,
    text: lineFor(p, tone, ctx, `${seed}tw${i}`),
    likes: 8 + (hashInt(`${seed}tl${i}`) % 900),
  }))
}

export function buildVideoComments(article: NewsArticle, state: GameState): SocialReply[] {
  const ctx = deriveContext(article)
  const tone = deriveTone(article, state)
  const seed = article.headline
  const count = 3 + (hashInt(`${seed}#vd`) % 2)
  return selectPersonas(tone, count, `${seed}vd`).map((p, i) => ({
    author: p.name,
    handle: p.handle,
    text: lineFor(p, tone, ctx, `${seed}vd${i}`),
    likes: 20 + (hashInt(`${seed}vl${i}`) % 4000),
  }))
}

export function buildPodcastExchange(
  article: NewsArticle,
  state: GameState,
  hostName: string,
): { coHostName: string; podcastExchange: PodcastLine[] } {
  const ctx = deriveContext(article)
  const tone = deriveTone(article, state)
  const seed = article.headline
  const coHostName = pick(PODCAST_CO_HOSTS, `${seed}co`)
  const t = PODCAST_TEMPLATES[tone]
  const hostLines = pickN(t.host, 2, `${seed}ph`)
  const coLines = pickN(t.coHost, 2, `${seed}pc`)
  const podcastExchange: PodcastLine[] = [
    { speaker: hostName, text: fill(hostLines[0] ?? '', ctx) },
    { speaker: coHostName, text: fill(coLines[0] ?? '', ctx) },
    { speaker: hostName, text: fill(hostLines[1] ?? hostLines[0] ?? '', ctx) },
  ]
  if (hashInt(`${seed}p4`) % 2 === 0 && coLines[1]) {
    podcastExchange.push({ speaker: coHostName, text: fill(coLines[1], ctx) })
  }
  return { coHostName, podcastExchange }
}

export interface WhatsAppThread {
  whatsappMode: 'group' | 'channel' | 'forward'
  groupName: string
  memberCount?: number
  followerCount?: number
  whatsappMessages?: WhatsAppMsg[]
  emojiTallies?: EmojiTally[]
  forwardCount: number
  isRumor: boolean
}

export function buildWhatsAppThread(article: NewsArticle, state: GameState): WhatsAppThread {
  const ctx = deriveContext(article)
  const tone = deriveTone(article, state)
  const seed = article.headline
  const forwardCount = 3 + (hashInt(`${seed}f`) % 47)
  const isRumor = tone === 'rumor'
  const modeEven = hashInt(`${seed}mode`) % 2 === 0
  const whatsappMode: WhatsAppThread['whatsappMode'] =
    tone === 'rumor' ? (modeEven ? 'channel' : 'forward') : modeEven ? 'group' : 'forward'

  if (whatsappMode === 'channel') {
    const groupName = pick(WHATSAPP_CHANNELS, `${seed}ch`)
    const followerCount = 12_000 + (hashInt(`${seed}fol`) % 90_000)
    const emojiTallies: EmojiTally[] = EMOJI_BY_TONE[tone].map((emoji, i) => ({
      emoji,
      count: 40 + (hashInt(`${seed}em${i}`) % 4000),
    }))
    return { whatsappMode, groupName, followerCount, emojiTallies, forwardCount, isRumor }
  }

  const groupName = pick(WHATSAPP_GROUPS, `${seed}gp`)
  const memberCount = 180 + (hashInt(`${seed}mem`) % 4000)
  const count = 3 + (hashInt(`${seed}#wa`) % 2)
  const personas = selectPersonas(tone, count, `${seed}wa`)
  const times = pickN(CHAT_TIMES, count, `${seed}tm`)
  const whatsappMessages: WhatsAppMsg[] = personas.map((p, i) => ({
    sender: p.name,
    time: times[i] ?? CHAT_TIMES[i % CHAT_TIMES.length],
    text: lineFor(p, tone, ctx, `${seed}wa${i}`),
    outgoing: false,
  }))
  return { whatsappMode, groupName, memberCount, whatsappMessages, forwardCount, isRumor }
}
