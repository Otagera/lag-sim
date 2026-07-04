import type { LucideIcon } from 'lucide-react'
import { Building2, Scale, TrendingUp, Users, Waves } from 'lucide-react'

// Goals had no category dimension, so 19 mandates rendered as one undifferentiated
// wall. This groups them into five "paths" — a color + emblem per family — so the
// goal step reads as a few chapters instead of an overwhelming list.
export type GoalThemeKey = 'build' | 'economy' | 'people' | 'reform' | 'coast'

export interface GoalTheme {
  key: GoalThemeKey
  label: string
  blurb: string
  color: string
  Icon: LucideIcon
}

export const GOAL_THEMES: Record<GoalThemeKey, GoalTheme> = {
  build: {
    key: 'build',
    label: 'Build Lagos',
    blurb: 'Infrastructure, transport, the hard concrete of the city.',
    color: '#3B9FE0',
    Icon: Building2,
  },
  economy: {
    key: 'economy',
    label: 'Grow the Economy',
    blurb: 'Jobs, revenue, and a Lagos that can fund itself.',
    color: '#C99A2E',
    Icon: TrendingUp,
  },
  people: {
    key: 'people',
    label: 'Serve the People',
    blurb: 'Schools, clinics, food on the table, safety on the street.',
    color: '#C0562A',
    Icon: Users,
  },
  reform: {
    key: 'reform',
    label: 'Reform & Legacy',
    blurb: 'Break the machine and change how Lagos is governed.',
    color: '#7C3AED',
    Icon: Scale,
  },
  coast: {
    key: 'coast',
    label: 'Protect the Coast',
    blurb: 'The lagoon, the waterfront, and the rising water.',
    color: '#2E9E6B',
    Icon: Waves,
  },
}

export const GOAL_THEME_ORDER: GoalThemeKey[] = ['build', 'economy', 'people', 'reform', 'coast']

// Maps each goal id to its path. Kept here (not on the Goal data) so the
// theming stays a UI concern and the goal definitions are untouched.
export const GOAL_THEME_OF: Record<string, GoalThemeKey> = {
  'lights-on': 'build',
  'revive-apapa': 'build',
  'ikeja-corridor': 'build',
  'tame-the-danfo': 'build',
  'move-the-city': 'build',
  'cross-the-water': 'build',
  'self-sufficient-lagos': 'economy',
  'creative-capital': 'economy',
  'tech-hub': 'economy',
  'safe-city': 'people',
  'educate-generation': 'people',
  'healthy-city': 'people',
  'feed-lagos': 'people',
  'break-the-machine': 'reform',
  'make-the-promise-real': 'reform',
  'reclaim-waterfront': 'coast',
  'climate-proof-lagos': 'coast',
}

export function themeForGoal(goalId: string): GoalTheme {
  return GOAL_THEMES[GOAL_THEME_OF[goalId] ?? 'reform']
}
