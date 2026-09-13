import { describe, expect, it } from 'vitest'
import { createSettingsRepository } from './settingsStore'
import { DEFAULT_SETTINGS, normalizeSettings, SETTINGS_KEY } from './types'

function spyStorage(initial?: Record<string, string>): {
  backend: import('../../lib/storage/localStore').StorageBackend
  snapshot: () => string | null
} {
  const map = new Map(Object.entries(initial ?? {}))
  return {
    backend: {
      getItem: (key) => map.get(key) ?? null,
      setItem: (key, value) => {
        map.set(key, value)
      },
      removeItem: (key) => {
        map.delete(key)
      },
    },
    snapshot: () => map.get(SETTINGS_KEY) ?? null,
  }
}

describe('createSettingsRepository', () => {
  it('loads defaults for a fresh user', () => {
    const { backend } = spyStorage()
    const repo = createSettingsRepository(backend)
    expect(repo.load()).toEqual(DEFAULT_SETTINGS)
  })

  it('persists a settings change', () => {
    const { backend, snapshot } = spyStorage()
    const repo = createSettingsRepository(backend)
    repo.save({ ...DEFAULT_SETTINGS, defaultDownloadFormat: 'svg' })
    expect(JSON.parse(snapshot()!).defaultDownloadFormat).toBe('svg')
  })

  it('normalizes invalid stored values back to defaults', () => {
    const { backend } = spyStorage({
      [SETTINGS_KEY]: JSON.stringify({
        historyEnabled: 'yes',
        defaultStyle: 'hexagon',
        defaultErrorCorrection: 'Z',
      }),
    })
    const repo = createSettingsRepository(backend)
    expect(repo.load()).toEqual(DEFAULT_SETTINGS)
  })

  it('recovers from corrupt JSON', () => {
    const { backend } = spyStorage({ [SETTINGS_KEY]: '{not json' })
    const repo = createSettingsRepository(backend)
    expect(repo.load()).toEqual(DEFAULT_SETTINGS)
  })
})

describe('normalizeSettings', () => {
  it('keeps valid values', () => {
    const out = normalizeSettings({
      historyEnabled: false,
      defaultStyle: 'dots',
      defaultErrorCorrection: 'Q',
      defaultDownloadFormat: 'svg',
    })
    expect(out).toEqual({
      historyEnabled: false,
      defaultStyle: 'dots',
      defaultErrorCorrection: 'Q',
      defaultDownloadFormat: 'svg',
    })
  })

  it('falls back for garbage', () => {
    expect(normalizeSettings(null)).toEqual(DEFAULT_SETTINGS)
    expect(normalizeSettings({ defaultStyle: 'wavy' })).toEqual(DEFAULT_SETTINGS)
  })
})