// Single code source for the current beta batch.
// Pre-v1 release line maps 0.7.0 -> save/schema batch 7.
export const SAVE_VERSION = 7

export const APP_VERSION = `0.${SAVE_VERSION}.0`
export const RELEASE_LABEL = 'Beta'

export function formatReleaseStamp(week?: number): string {
  return week === undefined ? RELEASE_LABEL : `${RELEASE_LABEL} · Week ${week}`
}
