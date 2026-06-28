import { useGameStore } from '../state/gameStore'
import { LagosHerald } from './LagosHerald'
import { ViralClip } from './ViralClip'
import { SocialPost } from './SocialPost'
import { PodcastCard } from './PodcastCard'
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
    case 'newspaper':
    default:
      return <LagosHerald />
  }
}
