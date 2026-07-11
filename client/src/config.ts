/**
 * Share / distribution config.
 *
 * PLAY_URL is the single source of truth for the "play the game" link that
 * rides along in every share caption. It is intentionally a placeholder until
 * the game has a real deployed home — replace the value below with the live URL.
 */
export const PLAY_URL = 'https://lagos-governor-sim.example'

export const SHARE_HASHTAGS = ['#LagosGovernorSim', '#GovernLagos']

/**
 * Analytics ingestion endpoint. Override via VITE_ANALYTICS_URL env var.
 * The telemetry module defaults to localhost:3000 in dev.
 */
export const ANALYTICS_URL =
  import.meta.env.VITE_ANALYTICS_URL ?? '/api/v1/analytics/event'

export const SERVER_BASE_URL =
  import.meta.env.VITE_SERVER_URL ?? ''
