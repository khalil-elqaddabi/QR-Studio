import { describe, expect, it } from 'vitest'
import { classifyScan, scanTypeLabel } from './actions'

describe('classifyScan', () => {
  it('classifies a URL with an open action', () => {
    const out = classifyScan('https://example.com')
    expect(out.label).toBe('Website')
    expect(out.actions[0]).toMatchObject({ kind: 'url', id: 'open' })
    expect(out.actions[0].value).toBe('https://example.com/')
  })

  it('never exposes a dangerous scheme for URLs', () => {
    const out = classifyScan('javascript:alert(1)')
    expect(out.actions.filter((a) => a.kind === 'url')).toHaveLength(0)
  })

  it('classifies Wi-Fi payloads', () => {
    const out = classifyScan('WIFI:T:WPA;S:Home;P:secret;;')
    expect(out.label).toBe('Wi-Fi')
    expect(out.title).toBe('Network “Home”')
  })

  it('classifies vCards', () => {
    const out = classifyScan('BEGIN:VCARD\nFN:Ada Lovelace\nORG:Lovely\nEND:VCARD')
    expect(out.label).toBe('Contact')
    expect(out.title).toContain('Ada Lovelace')
  })

  it('classifies SMSTO', () => {
    const out = classifyScan('SMSTO:+123:hello')
    expect(out.label).toBe('SMS')
    expect(out.actions.some((a) => a.kind === 'sms')).toBe(true)
  })

  it('classifies plain text with a copy action', () => {
    const out = classifyScan('just text')
    expect(out.label).toBe('Text')
    expect(out.actions.some((a) => a.kind === 'copy')).toBe(true)
  })
})

describe('scanTypeLabel', () => {
  it('returns the label string', () => {
    expect(scanTypeLabel('https://example.com')).toBe('Website')
    expect(scanTypeLabel('hello')).toBe('Text')
  })
})