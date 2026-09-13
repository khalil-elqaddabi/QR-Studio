export interface StorageResult {
  ok: boolean
  reason?: 'unavailable' | 'quota' | 'corrupt'
}

export interface SafeStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): StorageResult
  removeItem(key: string): void
  available: boolean
}

export type StorageBackend = {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
}

const memory = new Map<string, string>()

function detectBackend(storage?: StorageBackend): { backend: StorageBackend | null } {
  if (storage) return { backend: storage }
  if (typeof window === 'undefined') return { backend: null }
  try {
    const probe = '__qr_studio_probe__'
    window.localStorage.setItem(probe, '1')
    window.localStorage.removeItem(probe)
    return { backend: window.localStorage }
  } catch {
    return { backend: null }
  }
}

/**
 * localStorage wrapper that never throws. When storage is unavailable
 * (private mode, blocked, quota full) it falls back to an in-memory store
 * so the app keeps working — history just won't persist across reloads.
 */
export function createStorage(storage?: StorageBackend): SafeStorage {
  const { backend } = detectBackend(storage)

  return {
    available: !!backend,
    getItem(key: string): string | null {
      if (backend) {
        try {
          return backend.getItem(key)
        } catch {
          return memory.get(key) ?? null
        }
      }
      return memory.get(key) ?? null
    },
    setItem(key: string, value: string): StorageResult {
      if (backend) {
        try {
          backend.setItem(key, value)
          return { ok: true }
        } catch (error) {
          if (error instanceof DOMException && error.name === 'QuotaExceededError') {
            return { ok: false, reason: 'quota' }
          }
          // Fall back to memory rather than crashing.
          memory.set(key, value)
          return { ok: true }
        }
      }
      memory.set(key, value)
      return { ok: true }
    },
    removeItem(key: string): void {
      if (backend) {
        try {
          backend.removeItem(key)
        } catch {
          memory.delete(key)
        }
      } else {
        memory.delete(key)
      }
    },
  }
}

export function readJson<T>(storage: SafeStorage, key: string, fallback: T): T {
  const raw = storage.getItem(key)
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    storage.removeItem(key)
    return fallback
  }
}

export function writeJson<T>(storage: SafeStorage, key: string, value: T): StorageResult {
  try {
    return storage.setItem(key, JSON.stringify(value))
  } catch {
    return { ok: false, reason: 'corrupt' }
  }
}

export function estimateJsonSize(value: unknown): number {
  try {
    return JSON.stringify(value).length
  } catch {
    return 0
  }
}