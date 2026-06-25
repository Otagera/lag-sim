import { describe, it, expect } from 'vitest'
import { STARTING_STATE } from '../../data/startingState'
import type { GameState, NewsArticle } from '../../state/types'
import { selectPublicationForArticle, pickFramingVariant } from '../publicationEngine'
import { PUBLICATIONS } from '../../data/publications'

describe('selectPublicationForArticle', () => {
  it('returns a publication that covers the given category', () => {
    const pub = selectPublicationForArticle(STARTING_STATE as GameState, 'fiscal')
    expect(pub).not.toBeNull()
    expect(pub?.coverage.categories).toContain('fiscal')
  })

  it('returns a publication for categories with limited coverage', () => {
    const pub = selectPublicationForArticle(STARTING_STATE as GameState, 'fiscal')
    expect(pub).not.toBeNull()
    // Only Business Day, Vanguard, Guardian cover fiscal
    expect(['business-day', 'vanguard', 'guardian', 'the-nation', 'daily-trust']).toContain(pub!.id)
  })

  it('falls back to Vanguard when no publication covers a category', () => {
    const pub = selectPublicationForArticle(STARTING_STATE as GameState, 'sports')
    expect(pub).not.toBeNull()
    expect(pub!.id).toBe('vanguard')
  })
})

describe('pickFramingVariant', () => {
  it('returns a caption and editorial note for a known category', () => {
    const pub = PUBLICATIONS[0]
    const framing = pickFramingVariant(pub, 'crisis')
    expect(framing).not.toBeNull()
    expect(framing!.caption).toBeTruthy()
    expect(framing!.editorialNote).toBeTruthy()
  })

  it('returns null for an uncovered category with no fallback', () => {
    const businessDay = PUBLICATIONS.find((p) => p.id === 'business-day')!
    const framing = pickFramingVariant(businessDay, 'political')
    expect(framing).toBeNull()
  })
})
