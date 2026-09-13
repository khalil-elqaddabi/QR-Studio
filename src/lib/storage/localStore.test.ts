import { describe, expect, it } from 'vitest'
import { createStorage, estimateJsonSize, readJson, writeJson } from './localStore'

function memoryBackend(): import('./localStore').StorageBackend {
  const map = new Map<string, string>()
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value)
    },
    removeItem: (key) => {
      map.delete(key)
    },
  }
}

describe('createStorage', () => {
  it('reads and writes through the backend', () => {
    const storage = createStorage(memoryBackend())
    expect(storage.available).toBe(true)
    expect(storage.setItem('a', '1').ok).toBe(true)
    expect(storage.getItem('a')).toBe('1')
    storage.removeItem('a')
    expect(storage.getItem('a')).toBeNull()
  })

  it('keeps working (in memory) when the backend throws', () => {
    const flaky = {
      getItem: () => {
        throw new Error('fail')
      },
      setItem: () => {
        throw new Error('fail')
      },
      removeItem: () => {
        throw new Error('fail')
      },
    }
    const storage = createStorage(flaky)
    storage.setItem('key', 'value')
    expect(storage.getItem('key')).toBe('value')
  })

  it('flags quota errors without crashing', () => {
    const quota = {
      getItem: () => null,
      setItem: () => {
        throw new DOMException('quota', 'QuotaExceededError')
      },
      removeItem: () => {},
    }
    const storage = createStorage(quota)
    expect(storage.setItem('big', 'x').reason).toBe('quota')
  })

  it('is unavailable without window and without an injected backend', () => {
    const storage = createStorage()
    expect(storage.available).toBe(false)
    storage.setItem('k', 'v')
    expect(storage.getItem('k')).toBe('v')
  })
})

describe('readJson / writeJson', () => {
  it('round-trips structured data', () => {
    const storage = createStorage(memoryBackend())
    writeJson(storage, 'k', { n: 1, s: 'x', list: [1, 2] })
    expect(readJson(storage, 'k', null)).toEqual({ n: 1, s: 'x', list: [1, 2] })
  })

  it('falls back and clears corrupt data', () => {
    const backend = memoryBackend()
    backend.setItem('k', '{broken')
    const storage = createStorage(backend)
    expect(readJson(storage, 'k', { fallback: true })).toEqual({ fallback: true })
    expect(backend.getItem('k')).toBeNull()
  })
})

describe('estimateJsonSize', () => {
  it('approximates serialized size', () => {
    expect(estimateJsonSize({ a: 'hello' })).toBe(JSON.stringify({ a: 'hello' }).length)
  })
})