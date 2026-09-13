import type { QRStyle } from '../../types/qr'

export interface QRPreset {
  id: string
  label: string
  description: string
  style: Partial<QRStyle>
}

/**
 * Safe visual-only presets: module shape, colors, margins and error correction.
 * Presets never touch `iconEnabled`, `logo`, or `iconType` — those are
 * independent composition concerns managed outside of visual presets.
 */
export const PRESETS: QRPreset[] = [
  {
    id: 'classic',
    label: 'Classic',
    description: 'Sharp square modules, bold contrast',
    style: {
      style: 'classic',
      foreground: '#1c1917',
      background: '#ffffff',
      margin: 2,
      errorCorrection: 'M',
    },
  },
  {
    id: 'rounded',
    label: 'Rounded',
    description: 'Soft round modules with a compact icon slot',
    style: {
      style: 'rounded',
      foreground: '#1c1917',
      background: '#ffffff',
      margin: 2,
      errorCorrection: 'H',
      iconSize: 20,
    },
  },
  {
    id: 'dots',
    label: 'Dots',
    description: 'Round dot modules',
    style: {
      style: 'dots',
      foreground: '#1c1917',
      background: '#ffffff',
      margin: 2,
      errorCorrection: 'Q',
    },
  },
  {
    id: 'minimal',
    label: 'Minimal',
    description: 'Plenty of quiet zone, calm ink',
    style: {
      style: 'classic',
      foreground: '#0a0a0a',
      background: '#ffffff',
      margin: 4,
      errorCorrection: 'M',
    },
  },
  {
    id: 'corporate',
    label: 'Corporate',
    description: 'Navy on white with a tight icon slot',
    style: {
      style: 'rounded',
      foreground: '#0f172a',
      background: '#ffffff',
      margin: 4,
      errorCorrection: 'H',
      iconSize: 18,
    },
  },
  {
    id: 'soft',
    label: 'Soft',
    description: 'Warm, gentle dots for quiet designs',
    style: {
      style: 'dots',
      foreground: '#44403c',
      background: '#f5f4f0',
      margin: 2,
      errorCorrection: 'H',
    },
  },
  {
    id: 'bold',
    label: 'Bold',
    description: 'High-impact pure black on white',
    style: {
      style: 'classic',
      foreground: '#000000',
      background: '#ffffff',
      margin: 2,
      errorCorrection: 'M',
    },
  },
]

export function applyPreset(current: QRStyle, preset: QRPreset): QRStyle {
  return {
    ...current,
    ...preset.style,
    size: current.size,
    logo: current.logo,
    iconEnabled: current.iconEnabled,
  }
}
