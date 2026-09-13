import { describe, expect, it } from 'vitest'
import { PRESETS, applyPreset } from './presets'
import { DEFAULT_STYLE } from '../../types/qr'

describe('presets', () => {
  it('offers all the expected presets', () => {
    const labels = PRESETS.map((p) => p.id).sort()
    expect(labels).toEqual(['bold', 'classic', 'corporate', 'dots', 'minimal', 'rounded', 'soft'].sort())
  })

  it('every preset keeps the export size and logo', () => {
    const base = { ...DEFAULT_STYLE, size: 2048, logo: null }
    for (const preset of PRESETS) {
      const next = applyPreset(base, preset)
      expect(next.size).toBe(2048)
      expect(next.logo).toBeNull()
      expect(next.style).toBe(preset.style.style!)
    }
  })

  it('presets are internally consistent', () => {
    for (const preset of PRESETS) {
      if (preset.style.iconEnabled) {
        expect(preset.style.errorCorrection).toBe('H')
        expect(preset.style.iconSize ?? 20).toBeLessThanOrEqual(20)
      }
      expect(preset.style.margin ?? 2).toBeGreaterThanOrEqual(2)
    }
  })
})