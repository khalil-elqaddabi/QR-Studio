import type { DotStyle, ErrorCorrection } from '../../types/qr'

export type DefaultDownloadFormat = 'png' | 'svg'

export interface AppSettings {
  historyEnabled: boolean
  defaultStyle: DotStyle
  defaultErrorCorrection: ErrorCorrection
  defaultDownloadFormat: DefaultDownloadFormat
}

export const DEFAULT_SETTINGS: AppSettings = {
  historyEnabled: true,
  defaultStyle: 'rounded',
  defaultErrorCorrection: 'H',
  defaultDownloadFormat: 'png',
}

export const SETTINGS_KEY = 'qr-studio-settings'

export function normalizeSettings(raw: unknown): AppSettings {
  const candidate = (raw ?? {}) as Partial<AppSettings>
  const style = candidate.defaultStyle
  const ec = candidate.defaultErrorCorrection
  return {
    historyEnabled:
      typeof candidate.historyEnabled === 'boolean' ? candidate.historyEnabled : DEFAULT_SETTINGS.historyEnabled,
    defaultStyle:
      style === 'classic' || style === 'dots' ? style : DEFAULT_SETTINGS.defaultStyle,
    defaultErrorCorrection:
      ec === 'L' || ec === 'M' || ec === 'Q' || ec === 'H'
        ? ec
        : DEFAULT_SETTINGS.defaultErrorCorrection,
    defaultDownloadFormat:
      candidate.defaultDownloadFormat === 'svg' ? 'svg' : DEFAULT_SETTINGS.defaultDownloadFormat,
  }
}