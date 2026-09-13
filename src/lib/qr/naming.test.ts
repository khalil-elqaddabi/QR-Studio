import { describe, expect, it } from 'vitest'
import { qrFilename, sanitizeFilenamePart } from './naming'

describe('sanitizeFilenamePart', () => {
  it('strips unsafe characters', () => {
    expect(sanitizeFilenamePart('a/b\\c:d')).toBe('a b c d')
  })
  it('truncates long titles', () => {
    const out = sanitizeFilenamePart('x'.repeat(200))
    expect(out.length).toBeLessThanOrEqual(40)
  })
  it('removes leading/trailing separators', () => {
    expect(sanitizeFilenamePart('...hello...')).toBe('hello')
  })
  it('returns empty for only unsupported characters', () => {
    expect(sanitizeFilenamePart('***')).toBe('')
  })
})

describe('qrFilename', () => {
  it('includes the type slug', () => {
    expect(qrFilename('url', { format: 'png' })).toBe('qr-website.png')
    expect(qrFilename('wifi', { format: 'svg' })).toBe('qr-wifi.svg')
  })
  it('appends a sanitized title', () => {
    expect(qrFilename('url', { title: '  My Site / page ', format: 'png' })).toBe(
      'qr-website-My-Site-page.png',
    )
  })
  it('falls back when the title is empty', () => {
    expect(qrFilename('text', { title: '   ', format: 'png' })).toBe('qr-text.png')
  })
})