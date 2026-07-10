import { describe, expect, it } from 'vitest'
import { APP_VERSION, RELEASE_LABEL, SAVE_VERSION, formatReleaseStamp } from './version'

describe('version metadata', () => {
  it('derives the pre-v1 app version from SAVE_VERSION', () => {
    expect(SAVE_VERSION).toBe(7)
    expect(APP_VERSION).toBe('0.7.0')
  })

  it('shows only the beta label to users', () => {
    expect(RELEASE_LABEL).toBe('Beta')
    expect(formatReleaseStamp()).toBe('Beta')
    expect(formatReleaseStamp(27)).toBe('Beta · Week 27')
  })
})