import { describe, expect, it } from 'vitest'
import { clampLogoSize, isLogoRisky, LOGO_ACCEPT } from './processLogo'

describe('logo constraints', () => {
  it('clamps the size within the safe range', () => {
    expect(clampLogoSize(0)).toBe(10)
    expect(clampLogoSize(5)).toBe(10)
    expect(clampLogoSize(10)).toBe(10)
    expect(clampLogoSize(22.4)).toBe(22)
    expect(clampLogoSize(35)).toBe(35)
    expect(clampLogoSize(99)).toBe(35)
  })

  it('flags sizes above the risky threshold', () => {
    expect(isLogoRisky(30)).toBe(false)
    expect(isLogoRisky(31)).toBe(true)
  })

  it('only accepts raster image types', () => {
    expect(LOGO_ACCEPT).toBe('image/png,image/jpeg')
  })
})