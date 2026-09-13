import { describe, expect, it } from 'vitest'
import { buildMatrix, centerIcon, renderQRToSVG } from './render'
import type { QRRenderOptions } from './render'
import { DEFAULT_STYLE } from '../../types/qr'
import type { LogoShape, QRStyle } from '../../types/qr'

const PAYLOAD = 'https://example.com'

function options(style: Partial<QRStyle>, iconType: QRRenderOptions['iconType']): QRRenderOptions {
  const s: QRStyle = { ...DEFAULT_STYLE, ...style }
  return {
    payload: PAYLOAD,
    foreground: s.foreground,
    background: s.background,
    transparent: s.transparent,
    errorCorrection: 'H',
    margin: s.margin,
    style: s.style,
    iconType,
    iconRatio: s.iconSize / 100,
    logo: s.logo ?? null,
    size: 256,
  }
}

const STYLES = ['classic', 'rounded', 'dots'] as const

describe('center icon composition', () => {
  it('renders the automatic center icon for every module style', () => {
    for (const style of STYLES) {
      const svg = renderQRToSVG(options({ style, iconEnabled: true, logo: null }, 'youtube'))
      expect(svg).toContain('<g transform=')
      expect(svg).toContain('stroke=')
      expect(svg).toContain('fill="#ffffff"')
      expect(svg).not.toContain('<image')
    }
  })

  it('derives the center icon independently of module style', () => {
    for (const _style of STYLES) {
      expect(centerIcon({ iconEnabled: true, logo: null }, 'youtube')).toBe('youtube')
      expect(centerIcon({ iconEnabled: false, logo: null }, 'youtube')).toBeNull()
    }
  })

  it('renders a custom logo in the center for every module style', () => {
    const logo = { dataUrl: 'data:image/png;base64,AAAA', size: 25, shape: 'circle' as LogoShape }
    for (const style of STYLES) {
      const svg = renderQRToSVG(options({ style, iconEnabled: false, logo }, null))
      expect(svg).toContain('<image')
      expect(svg).toContain(logo.dataUrl)
      expect(svg).not.toContain('<g transform=')
    }
  })

  it('a custom logo takes precedence over the automatic icon', () => {
    expect(centerIcon({ iconEnabled: true, logo: { dataUrl: 'x', size: 20, shape: 'rounded' } }, 'email')).toBeNull()
  })

  it('renders the modules and no center composition when both icon and logo are off', () => {
    for (const style of STYLES) {
      const svg = renderQRToSVG(options({ style, iconEnabled: false, logo: null }, null))
      expect(svg).not.toContain('<g transform=')
      expect(svg).not.toContain('<image')
      const matrix = buildMatrix(PAYLOAD, 'H', 2)
      expect(matrix.count).toBeGreaterThan(0)
    }
  })
})