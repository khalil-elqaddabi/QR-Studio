import type { QRStyle } from '../../types/qr'

export interface QRPreset {
  id: string
  label: string
  description: string
  style: Partial<QRStyle>
}

/**
 * Safe combinations only: icon-including presets keep the icon small and rely
 * on 'H' error correction, margins never pinch the quiet zone, and module
 * styles stay within the readable range we have verified with ZXing.
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
      iconEnabled: false,
    },
  },
  {
    id: 'rounded',
    label: 'Rounded',
    description: 'Soft corners with a small center icon',
    style: {
      style: 'rounded',
      foreground: '#1c1917',
      background: '#ffffff',
      margin: 2,
      errorCorrection: 'H',
      iconEnabled: true,
      iconSize: 20,
    },
  },
  {
    id: 'dots',
    label: 'Dots',
    description: 'Round dot modules, no icon',
    style: {
      style: 'dots',
      foreground: '#1c1917',
      background: '#ffffff',
      margin: 2,
      errorCorrection: 'Q',
      iconEnabled: false,
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
      iconEnabled: false,
    },
  },
  {
    id: 'corporate',
    label: 'Corporate',
    description: 'Navy on white with a small icon',
    style: {
      style: 'rounded',
      foreground: '#0f172a',
      background: '#ffffff',
      margin: 4,
      errorCorrection: 'H',
      iconEnabled: true,
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
      iconEnabled: false,
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
      iconEnabled: false,
    },
  },
]

export function applyPreset(current: QRStyle, preset: QRPreset): QRStyle {
  return {
    ...current,
    ...preset.style,
    size: current.size,
    logo: current.logo,
  }
}