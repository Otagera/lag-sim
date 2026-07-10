import { useGameStore } from '../state/gameStore'
import { LagosHerald } from './LagosHerald'
import { PodcastCard } from './PodcastCard'
import { SocialPost } from './SocialPost'
import { ViralClip } from './ViralClip'
import { WhatsAppChain } from './WhatsAppChain'

export function MediaRouter() {
  const article = useGameStore((s) => s.newspaperHeadline)

  if (!article) return null

  const channel = article.channelMeta?.channel ?? 'newspaper'

  switch (channel) {
    case 'shortVideo':
      return <ViralClip article={article} />
    case 'tweet':
      return <SocialPost article={article} />
    case 'podcast':
      return <PodcastCard article={article} />
    case 'whatsapp':
      return <WhatsAppChain article={article} />
    default:
      return <LagosHerald />
  }
}
