import type { MediaChannel } from '../state/types'

export interface ChannelConfig {
  id: MediaChannel
  tone: 'authoritative' | 'emotional' | 'fast-emotional' | 'analytical' | 'unverified'
  categories: Array<'fiscal' | 'political' | 'crisis' | 'milestone' | 'background'>
}

export const MEDIA_CHANNELS: Record<MediaChannel, ChannelConfig> = {
  newspaper: {
    id: 'newspaper',
    tone: 'authoritative',
    categories: ['political', 'fiscal', 'milestone'],
  },
  shortVideo: {
    id: 'shortVideo',
    tone: 'emotional',
    categories: ['crisis', 'political'],
  },
  tweet: {
    id: 'tweet',
    tone: 'fast-emotional',
    categories: ['political', 'crisis'],
  },
  podcast: {
    id: 'podcast',
    tone: 'analytical',
    categories: ['fiscal', 'background'],
  },
  whatsapp: {
    id: 'whatsapp',
    tone: 'unverified',
    categories: ['background', 'political'],
  },
}
