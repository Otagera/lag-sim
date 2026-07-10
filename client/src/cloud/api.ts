const CLOUD_SAVE_URL =
  import.meta.env.VITE_CLOUD_SAVE_URL ?? 'http://localhost:3000/api/v1/saves'

interface CloudSaveEntry {
  device_id: string
  save_data: Record<string, unknown>
  version: number
  updated_at: string
}

interface CloudSaveResponse {
  ok: boolean
  updated_at: string
}

export async function uploadSave(
  deviceId: string,
  saveData: Record<string, unknown>,
  version: number,
): Promise<boolean> {
  try {
    const res = await fetch(CLOUD_SAVE_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_id: deviceId, save_data: saveData, version }),
      keepalive: true,
    })
    if (!res.ok) {
      console.warn('[cloud] upload failed:', res.status)
      return false
    }
    const body: CloudSaveResponse = await res.json()
    return body.ok
  } catch (err) {
    console.warn('[cloud] upload error:', err)
    return false
  }
}

export async function fetchCloudSave(
  deviceId: string,
): Promise<CloudSaveEntry | null> {
  try {
    const res = await fetch(`${CLOUD_SAVE_URL}/${encodeURIComponent(deviceId)}`)
    if (res.status === 404) return null
    if (!res.ok) {
      console.warn('[cloud] fetch failed:', res.status)
      return null
    }
    return await res.json()
  } catch (err) {
    console.warn('[cloud] fetch error:', err)
    return null
  }
}
