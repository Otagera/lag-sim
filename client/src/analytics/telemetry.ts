import { ANALYTICS_URL } from '../config'

const DEVICE_ID_KEY = 'lag-sim-device-id'

const BATCH_FLUSH_INTERVAL = 30_000
const BATCH_MAX_SIZE = 10

let deviceId: string | null = null

function loadOrCreateDeviceId(): string {
  try {
    const existing = localStorage.getItem(DEVICE_ID_KEY)
    if (existing) return existing
    const id = crypto.randomUUID()
    localStorage.setItem(DEVICE_ID_KEY, id)
    return id
  } catch {
    return crypto.randomUUID()
  }
}

export function getDeviceId(): string {
  if (!deviceId) deviceId = loadOrCreateDeviceId()
  return deviceId
}

export interface AnalyticsEvent {
  session_id: string
  device_id_hash: string
  event_type: string
  week: number
  archetype: string | null
  event_data: Record<string, unknown>
}

let batch: AnalyticsEvent[] = []
let flushTimer: ReturnType<typeof setTimeout> | null = null

function scheduleFlush() {
  if (flushTimer) return
  flushTimer = setTimeout(() => {
    flushTimer = null
    flush()
  }, BATCH_FLUSH_INTERVAL)
}

async function flush() {
  if (batch.length === 0) return
  const payload = batch.splice(0)
  try {
    await fetch(ANALYTICS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    })
  } catch (err) {
    console.warn('[analytics] flush failed:', err)
  }
}

export function sendEvent(event: AnalyticsEvent) {
  batch.push(event)
  scheduleFlush()
  if (batch.length >= BATCH_MAX_SIZE) flush()
}

export function flushAnalytics() {
  if (flushTimer) {
    clearTimeout(flushTimer)
    flushTimer = null
  }
  flush()
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (batch.length > 0) {
      try {
        navigator.sendBeacon(ANALYTICS_URL, JSON.stringify(batch))
      } catch { /* silent */ }
    }
  })
}
