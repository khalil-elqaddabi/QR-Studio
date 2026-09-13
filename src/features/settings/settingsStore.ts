import { createStorage, readJson, writeJson } from '../../lib/storage/localStore'
import { DEFAULT_SETTINGS, SETTINGS_KEY, type AppSettings } from './types'

export function createSettingsRepository(storage?: Parameters<typeof createStorage>[0]) {
  const backend = createStorage(storage)

  const load = (): AppSettings => {
    const stored = readJson<AppSettings>(backend, SETTINGS_KEY, DEFAULT_SETTINGS)
    return {
      historyEnabled:
        typeof stored.historyEnabled === 'boolean'
          ? stored.historyEnabled
          : DEFAULT_SETTINGS.historyEnabled,
      defaultStyle:
        stored.defaultStyle === 'classic' || stored.defaultStyle === 'dots'
          ? stored.defaultStyle
          : DEFAULT_SETTINGS.defaultStyle,
      defaultErrorCorrection:
        stored.defaultErrorCorrection === 'L' ||
        stored.defaultErrorCorrection === 'M' ||
        stored.defaultErrorCorrection === 'Q' ||
        stored.defaultErrorCorrection === 'H'
          ? stored.defaultErrorCorrection
          : DEFAULT_SETTINGS.defaultErrorCorrection,
      defaultDownloadFormat:
        stored.defaultDownloadFormat === 'svg' ? 'svg' : DEFAULT_SETTINGS.defaultDownloadFormat,
    }
  }

  const save = (settings: AppSettings): void => {
    writeJson(backend, SETTINGS_KEY, settings)
  }

  return { load, save, available: backend.available }
}

export type SettingsRepository = ReturnType<typeof createSettingsRepository>

export { SETTINGS_KEY }