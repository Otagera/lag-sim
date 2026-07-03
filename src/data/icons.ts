import type { LucideIcon } from 'lucide-react'
import {
  AlertTriangle,
  Briefcase,
  Building2,
  Crown,
  Flame,
  Heart,
  Landmark,
  Link,
  MapPin,
  Newspaper,
  Shield,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
  Wallet,
  Zap,
} from 'lucide-react'
import type { FactionKey } from '../state/types'

export const STAT_ICONS: Record<string, { icon: LucideIcon; label: string }> = {
  cashReserve: { icon: Wallet, label: 'Treasury' },
  publicTrust: { icon: Heart, label: 'Trust' },
  politicalCapital: { icon: Zap, label: 'Pol. Cap' },
  infrastructureScore: { icon: Building2, label: 'Infra' },
  securityIndex: { icon: Shield, label: 'Security' },
  corruptionPressure: { icon: AlertTriangle, label: 'Corruption' },
  youthTension: { icon: Flame, label: 'Youth' },
  federalRelationship: { icon: Link, label: 'Fed. Rel.' },
  igr: { icon: TrendingUp, label: 'IGR' },
  expenditure: { icon: TrendingDown, label: 'Expenditure' },
}

export type StatIconKey = keyof typeof STAT_ICONS

export const FACTION_ICONS: Record<FactionKey, { icon: LucideIcon; label: string; color: string }> =
  {
    businessCommunity: { icon: Briefcase, label: 'Business', color: '#2563eb' },
    informalEconomy: { icon: ShoppingBag, label: 'Informal', color: '#0d9488' },
    partyGodfathers: { icon: Crown, label: 'Godfathers', color: '#b91c1c' },
    federalGovt: { icon: Landmark, label: 'Federal', color: '#6b7280' },
    civilSocietyMedia: { icon: Newspaper, label: 'Civil Soc', color: '#7c3aed' },
    lgChairmen: { icon: MapPin, label: 'LG Chairmen', color: '#16a34a' },
  }

export const SEVERITY_GLYPH: Record<string, { glyph: string; label: string; color: string }> = {
  low: { glyph: '•', label: 'Low', color: 'var(--success-11)' },
  medium: { glyph: '▲', label: 'Medium', color: 'var(--warning-11)' },
  high: { glyph: '⚠', label: 'High', color: 'var(--error-11)' },
  critical: { glyph: '❗', label: 'Critical', color: 'var(--error-9)' },
}
