// Single code source for the current beta batch.
// Pre-v1 release line maps 0.8.0 -> save/schema batch 8.
// v8 (Political Actors, opinion ledgers) is a breaking change: older saves are discarded.
export const SAVE_VERSION = 8
/** Oldest save version that can still be loaded. */
export const MIN_LOADABLE_SAVE_VERSION = 8

export const APP_VERSION = `0.${SAVE_VERSION}.0`
export const RELEASE_LABEL = 'Beta'

export function formatReleaseStamp(week?: number): string {
  return week === undefined ? RELEASE_LABEL : `${RELEASE_LABEL} · Week ${week}`
}
