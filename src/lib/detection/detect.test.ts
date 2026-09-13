import { describe, expect, it } from 'vitest'
import { detect, parseSms, parseVCard, parseWifiContent } from './detect'

describe('detect', () => {
  it('detects a plain website URL', () => {
    const result = detect('https://example.com/path')
    expect(result?.type).toBe('url')
    expect(result?.content.url).toBe('https://example.com/path')
  })

  it('detects a bare host and adds https://', () => {
    const result = detect('example.com')
    expect(result?.type).toBe('url')
    expect(result?.content.url).toBe('https://example.com')
  })

  it('detects YouTube', () => {
    const result = detect('https://youtube.com/watch?v=abc123')
    expect(result?.type).toBe('youtube')
    expect(result?.label).toBe('YouTube')
  })

  it('detects a mailto with subject and body', () => {
    const result = detect('mailto:ada@example.com?subject=Hello&body=Hi')
    expect(result?.type).toBe('email')
    expect(result?.content.email).toBe('ada@example.com')
    expect(result?.content.subject).toBe('Hello')
  })

  it('detects a tel link', () => {
    const result = detect('tel:+15551234567')
    expect(result?.type).toBe('phone')
    expect(result?.content.phone).toBe('+15551234567')
  })

  it('detects a Wi-Fi payload', () => {
    const result = detect('WIFI:T:WPA;S:MyNet;P:s3cret;;')
    expect(result?.type).toBe('wifi')
    expect(result?.content.ssid).toBe('MyNet')
    expect(result?.content.password).toBe('s3cret')
    expect(result?.content.security).toBe('WPA')
  })

  it('detects an SMSTO payload', () => {
    const result = detect('SMSTO:+15551234567:Call me')
    expect(result?.type).toBe('sms')
    expect(result?.content.phone).toBe('+15551234567')
    expect(result?.content.smsMessage).toBe('Call me')
  })

  it('detects a vCard payload', () => {
    const vcard = 'BEGIN:VCARD\nVERSION:3.0\nFN:Ada Lovelace\nORG:Analytical Engine\nEND:VCARD'
    const result = detect(vcard)
    expect(result?.type).toBe('contact')
    expect(result?.content.firstName).toBe('Ada')
    expect(result?.content.lastName).toBe('Lovelace')
  })

  it('returns null for non-conclusive input', () => {
    expect(detect('just some words')).toBeNull()
    expect(detect('')).toBeNull()
  })
})

describe('parseSms', () => {
  it('parses phone and message', () => {
    const parsed = parseSms('SMSTO:+123:hi')
    expect(parsed.phone).toBe('+123')
    expect(parsed.smsMessage).toBe('hi')
  })
})

describe('parseVCard', () => {
  it('parses structured fields', () => {
    const parsed = parseVCard('FN:Ada Lovelace\nEMAIL:ada@example.com')
    expect(parsed.firstName).toBe('Ada')
    expect(parsed.lastName).toBe('Lovelace')
    expect(parsed.contactEmail).toBe('ada@example.com')
  })
})

describe('parseWifiContent', () => {
  it('handles escaped separators and nopass', () => {
    const parsed = parseWifiContent('WIFI:T:nopass;S:Cafe\\;Corner;H:true;;')
    expect(parsed.ssid).toBe('Cafe;Corner')
    expect(parsed.security).toBe('nopass')
    expect(parsed.hidden).toBe(true)
  })
})