import { describe, expect, it } from 'vitest'
import { buildPayload, normalizeUrl, digitOnly } from './payload'
import { EMPTY_CONTENT, type QRContent } from '../../types/qr'

function content(overrides: Partial<QRContent>): QRContent {
  return { ...EMPTY_CONTENT, ...overrides }
}

describe('normalizeUrl', () => {
  it('adds https:// to bare input', () => {
    expect(normalizeUrl('example.com')).toBe('https://example.com')
  })
  it('keeps explicit schemes', () => {
    expect(normalizeUrl('http://a.co')).toBe('http://a.co')
  })
  it('returns empty string for empty input', () => {
    expect(normalizeUrl('   ')).toBe('')
  })
})

describe('digitOnly', () => {
  it('strips non-digits', () => {
    expect(digitOnly('+1 (555) 123-4567')).toBe('15551234567')
  })
})

describe('buildPayload', () => {
  it('builds a URL payload', () => {
    expect(buildPayload('url', content({ url: 'example.com' }))).toBe('https://example.com')
  })

  it('builds an email payload with query params', () => {
    expect(buildPayload('email', content({ email: 'a@b.com', subject: 'Hi there', body: 'Body' }))).toBe(
      'mailto:a@b.com?subject=Hi%20there&body=Body',
    )
  })

  it('builds a phone payload as digits only', () => {
    expect(buildPayload('phone', content({ phone: '+1 555 000' }))).toBe('tel:1555000')
  })

  it('builds an SMSTO payload with message', () => {
    expect(buildPayload('sms', content({ phone: '+123', smsMessage: 'hey' }))).toBe(
      'SMSTO:123:hey',
    )
  })

  it('builds a Wi-Fi payload', () => {
    expect(buildPayload('wifi', content({ ssid: 'Net', password: 'pw', security: 'WPA', hidden: true }))).toBe(
      'WIFI:T:WPA;S:Net;P:pw;H:true;;',
    )
  })

  it('builds a WhatsApp payload', () => {
    expect(buildPayload('whatsapp', content({ whatsappNumber: '1555', whatsappMessage: 'Hello world' }))).toBe(
      'https://wa.me/1555?text=Hello%20world',
    )
  })

  it('builds a contact vCard', () => {
    const payload = buildPayload(
      'contact',
      content({ firstName: 'Ada', lastName: 'Lovelace', organization: 'Engines' }),
    )
    expect(payload).toContain('BEGIN:VCARD')
    expect(payload).toContain('FN:Ada Lovelace')
    expect(payload).toContain('ORG:Engines')
    expect(payload).toContain('END:VCARD')
  })

  it('returns null when nothing meaningful is filled', () => {
    expect(buildPayload('text', content({}))).toBeNull()
    expect(buildPayload('wifi', content({}))).toBeNull()
    expect(buildPayload('location', content({}))).toBeNull()
  })

  it('escapes Wi-Fi special characters', () => {
    const payload = buildPayload('wifi', content({ ssid: 'cafe;1', password: 'p:a' }))
    expect(payload).toBe('WIFI:T:WPA;S:cafe\\;1;P:p\\:a;;')
  })
})