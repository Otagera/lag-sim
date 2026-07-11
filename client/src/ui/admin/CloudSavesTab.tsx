import { useCallback, useState } from 'react'
import { SERVER_BASE_URL } from '../../config'

interface CloudSaveEntry {
  device_id: string
  save_data: Record<string, unknown>
  version: number
  updated_at: string
}

type FetchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: CloudSaveEntry }

function extractMeta(saveData: Record<string, unknown>) {
  const week = typeof saveData.week === 'number' ? saveData.week : null
  const runMeta = saveData.runMeta as Record<string, unknown> | undefined
  const archetype = runMeta && typeof runMeta.archetype === 'string' ? runMeta.archetype : null
  const saveVersion = typeof saveData.version === 'number' ? saveData.version : null
  return { week, archetype, saveVersion }
}

export function CloudSavesTab() {
  const [deviceId, setDeviceId] = useState('')
  const [fetchState, setFetchState] = useState<FetchState>({ status: 'idle' })
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleFetch = useCallback(() => {
    if (!deviceId.trim()) return
    setFetchState({ status: 'loading' })
    setConfirmDelete(false)
    fetch(`${SERVER_BASE_URL}/api/v1/saves/${encodeURIComponent(deviceId.trim())}`)
      .then(async (r) => {
        if (r.status === 404) {
          setFetchState({ status: 'error', message: 'No save found for this device ID' })
          return
        }
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        const data = (await r.json()) as CloudSaveEntry
        setFetchState({ status: 'success', data })
      })
      .catch((e: Error) => setFetchState({ status: 'error', message: e.message }))
  }, [deviceId])

  const handleDelete = useCallback(async () => {
    if (!deviceId.trim() || deleting) return
    setDeleting(true)
    try {
      const r = await fetch(
        `${SERVER_BASE_URL}/api/v1/saves/${encodeURIComponent(deviceId.trim())}`,
        { method: 'DELETE' },
      )
      if (r.status === 204) {
        setFetchState({ status: 'idle' })
        setConfirmDelete(false)
      } else if (r.status === 404) {
        setFetchState({ status: 'error', message: 'Save not found (already deleted)' })
      } else {
        throw new Error(`HTTP ${r.status}`)
      }
    } catch (e: unknown) {
      setFetchState({ status: 'error', message: e instanceof Error ? e.message : 'Delete failed' })
    } finally {
      setDeleting(false)
    }
  }, [deviceId, deleting])

  const handleDownload = useCallback(() => {
    if (fetchState.status !== 'success') return
    const blob = new Blob([JSON.stringify(fetchState.data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cloud-save-${fetchState.data.device_id}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [fetchState])

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={deviceId}
          onChange={(e) => setDeviceId(e.target.value)}
          placeholder="Enter device ID"
          className="flex-1 px-2 py-1 text-[11px] border"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)', color: 'var(--text)' }}
          onKeyDown={(e) => { if (e.key === 'Enter') handleFetch() }}
        />
        <button
          type="button"
          onClick={handleFetch}
          disabled={!deviceId.trim() || fetchState.status === 'loading'}
          className="px-3 py-1 text-[10px] font-medium border"
          style={{
            borderColor: 'var(--border)',
            color: 'var(--text)',
            backgroundColor: 'var(--surface)',
            opacity: !deviceId.trim() || fetchState.status === 'loading' ? 0.5 : 1,
          }}
        >
          {fetchState.status === 'loading' ? 'Loading...' : 'Fetch'}
        </button>
      </div>

      {fetchState.status === 'error' && (
        <p className="text-[11px] mb-2" style={{ color: 'var(--error-11)' }}>{fetchState.message}</p>
      )}

      {fetchState.status === 'success' && (
        <div className="space-y-2">
          <div className="p-2 border text-[11px] space-y-1" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
            <p><span style={{ color: 'var(--text-secondary)' }}>Device ID: </span><span style={{ color: 'var(--text)' }}>{fetchState.data.device_id}</span></p>
            <p><span style={{ color: 'var(--text-secondary)' }}>Updated: </span><span style={{ color: 'var(--text)' }}>{new Date(fetchState.data.updated_at).toLocaleString()}</span></p>
            <p><span style={{ color: 'var(--text-secondary)' }}>Version: </span><span style={{ color: 'var(--text)' }}>{fetchState.data.version}</span></p>
            {(() => {
              const meta = extractMeta(fetchState.data.save_data)
              return (
                <>
                  {meta.saveVersion !== null && (
                    <p><span style={{ color: 'var(--text-secondary)' }}>Save Version: </span><span style={{ color: 'var(--text)' }}>{meta.saveVersion}</span></p>
                  )}
                  {meta.week !== null && (
                    <p><span style={{ color: 'var(--text-secondary)' }}>Week: </span><span style={{ color: 'var(--text)' }}>{meta.week}</span></p>
                  )}
                  {meta.archetype !== null && (
                    <p><span style={{ color: 'var(--text-secondary)' }}>Archetype: </span><span style={{ color: 'var(--text)' }}>{meta.archetype}</span></p>
                  )}
                </>
              )
            })()}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleDownload}
              className="px-3 py-1 text-[10px] font-medium border"
              style={{ borderColor: 'var(--border)', color: 'var(--text)', backgroundColor: 'var(--surface)' }}
            >
              Download JSON
            </button>

            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="px-3 py-1 text-[10px] font-medium border"
                style={{ borderColor: 'var(--error-8)', color: 'var(--error-11)', backgroundColor: 'var(--surface)' }}
              >
                Delete
              </button>
            ) : (
              <div className="flex gap-2 items-center">
                <span className="text-[10px]" style={{ color: 'var(--error-11)' }}>Confirm?</span>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-3 py-1 text-[10px] font-bold border"
                  style={{
                    borderColor: 'var(--error-9)',
                    color: 'white',
                    backgroundColor: 'var(--error-9)',
                    opacity: deleting ? 0.5 : 1,
                  }}
                >
                  {deleting ? 'Deleting...' : 'Yes, delete'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-2 py-1 text-[10px] border"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', backgroundColor: 'var(--surface)' }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {fetchState.status === 'idle' && (
        <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
          Enter a device ID and click Fetch to look up a cloud save.
        </p>
      )}
    </div>
  )
}
