import { describe, expect, it } from 'vitest'
import { PRESETS, applyPreset } from './presets'
import { DEFAULT_STYLE } from '../../types/qr'

describe('presets', () => {
  it('offers all the expected presets', () => {
    const labels = PRESETS.map((p) => p.id).sort()
    expect(labels).toEqual(['bold', 'classic', 'corporate', 'dots', 'minimal', 'rounded', 'soft'].sort())
  })

  it('presets never declare an icon state — icons are an independent concern', () => {
    for (const preset of PRESETS) {
      expect(preset.style, `${preset.id} must not toggle iconEnabled`).not.toHaveProperty('iconEnabled')
      expect(preset.style.logo, `${preset.id} must not define a logo`).toBeUndefined()
    }
  })

  it('every preset keeps export size, logo and icon state', () => {
    for (const iconEnabled of [false, true]) {
      const base = { ...DEFAULT_STYLE, size: 2048, iconSize: 30, logo: null, iconEnabled }
      for (const preset of PRESETS) {
        const next = applyPreset(base, preset)
        expect(next.size).toBe(2048)
        expect(next.logo).toBeNull()
        expect(next.style).toBe(preset.style.style!)
        expect(next.iconEnabled).toBe(iconEnabled)
      }
    }
  })

  it('switching between presets preserves the selected icon state and logo', () => {
    const logo = { dataUrl: 'data:image/png;base64,AAAA', size: 25, shape: 'circle' as const }
    const withLogo = { ...DEFAULT_STYLE, logo, iconEnabled: false }
    const withIcon = { ...DEFAULT_STYLE, logo: null, iconEnabled: true }

    for (const preset of PRESETS) {
      const fromLogo = applyPreset(withLogo, preset)
      expect(fromLogo.iconEnabled, `${preset.id} must not remove the logo`).toBe(false)
      expect(fromLogo.logo).toBe(logo)

      const fromIcon = applyPreset(withIcon, preset)
      expect(fromIcon.iconEnabled, `${preset.id} must keep the automatic icon`).toBe(true)
      expect(fromIcon.logo).toBeNull()
    }
  })

  it('presets are internally consistent', () => {
    for (const preset of PRESETS) {
      expect(preset.style.margin ?? 2).toBeGreaterThanOrEqual(2)
      if (preset.style.iconSize !== undefined) {
        expect(preset.style.iconSize).toBeLessThanOrEqual(20)
      }
    }
  })
})