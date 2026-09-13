import { describe, expect, it } from 'vitest'
import { createHistoryStore, createHistoryId } from './HistoryStore'
import type { SaveHistoryInput } from './HistoryStore'
import { DEFAULT_STYLE } from '../../types/qr'

function memoryStorage(): import('../../lib/storage/localStore').StorageBackend {
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

function input(partial: Partial<SaveHistoryInput> = {}): SaveHistoryInput {
  return {
    title: 'My site',
    type: 'url',
    payload: 'https://example.com',
    fields: { url: 'https://example.com' },
    style: { ...DEFAULT_STYLE },
    ...partial,
  }
}

describe('createHistoryStore', () => {
  it('starts empty when nothing was saved', () => {
    const store = createHistoryStore(memoryStorage())
    expect(store.load()).toEqual([])
    expect(store.available).toBe(true)
  })

  it('saves and loads items, newest first', () => {
    const store = createHistoryStore(memoryStorage())
    store.save(input({ title: 'first', payload: 'https://a.com', fields: { url: 'https://a.com' } }))
    store.save(input({ title: 'second', payload: 'https://b.com', fields: { url: 'https://b.com' } }))
    const items = store.load()
    expect(items).toHaveLength(2)
    expect(items[0].title).toBe('second')
    expect(items[1].title).toBe('first')
  })

  it('deduplicates identical payload+type+transparent', () => {
    const store = createHistoryStore(memoryStorage())
    store.save(input({ title: 'x' }))
    store.save(input({ title: 'y' }))
    const items = store.load()
    expect(items).toHaveLength(1)
    expect(items[0].title).toBe('y')
  })

  it('removes a single item', () => {
    const store = createHistoryStore(memoryStorage())
    store.save(input({ payload: 'https://a.com' }))
    store.save(input({ payload: 'https://b.com' }))
    const first = store.load()[0].id
    store.remove(first)
    expect(store.load()).toHaveLength(1)
    expect(store.load()[0].payload).toBe('https://a.com')
  })

  it('clears everything', () => {
    const store = createHistoryStore(memoryStorage())
    store.save(input())
    store.clear()
    expect(store.load()).toEqual([])
  })

  it('caps the number of items at 30', () => {
    const store = createHistoryStore(memoryStorage())
    for (let i = 0; i < 40; i++) {
      store.save(input({ title: String(i), payload: `https://a.com/${i}` }))
    }
    expect(store.load().length).toBeLessThanOrEqual(30)
  })

  it('drops the logo when the record would exceed the size budget', () => {
    const store = createHistoryStore(memoryStorage())
    const bigLogo = {
      dataUrl: `data:image/png;base64,${'A'.repeat(150_000)}`,
      size: 20,
      shape: 'rounded' as const,
    }
    const result = store.save(input({ style: { ...DEFAULT_STYLE, logo: bigLogo } }))
    expect(result.droppedLogo).toBe(true)
    expect(store.load()[0].style.logo).toBeNull()
  })

  it('reports unavailable when localStorage is not present', () => {
    const store = createHistoryStore()
    expect(store.available).toBe(false)
    const result = store.save(input())
    expect(result.ok).toBe(false)
    expect(store.load()).toEqual([])
  })
})

describe('createHistoryId', () => {
  it('produces unique ids', () => {
    const ids = new Set(Array.from({ length: 200 }, () => createHistoryId()))
    expect(ids.size).toBe(200)
  })
})