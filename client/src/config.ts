/** Game name and tagline: the single source for every player-facing title. */
export const APP_NAME = 'Excellency'
export const APP_TAGLINE = 'Govern a Nigerian State'

/**
 * Share / distribution config.
 *
 * PLAY_URL is the single source of truth for the "play the game" link that
 * rides along in every share caption.
 */
export const PLAY_URL = 'https://excellency.otagera.xyz'

export const SHARE_HASHTAGS = ['#ExcellencyGame', '#GovernLagos']

/**
 * Analytics ingestion endpoint. Override via VITE_ANALYTICS_URL env var.
 * The telemetry module defaults to localhost:3000 in dev.
 */
export const ANALYTICS_URL = import.meta.env.VITE_ANALYTICS_URL ?? '/api/v1/analytics/event'

export const SERVER_BASE_URL = import.meta.env.VITE_SERVER_URL ?? ''
