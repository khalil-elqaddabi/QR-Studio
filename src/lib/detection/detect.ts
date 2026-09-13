import type { QRContent, QRType } from '../../types/qr'

export interface DetectionResult {
  type: QRType
  label: string
  content: Partial<QRContent>
}

export function parseMailtoContent(raw: string): Partial<QRContent> {
  try {
    const url = new URL(raw)
    return {
      email: url.pathname,
      subject: url.searchParams.get('subject') ?? '',
      body: url.searchParams.get('body') ?? '',
    }
  } catch {
    return { email: raw.replace(/^mailto:/i, '').split('?')[0] }
  }
}

export function parseTelContent(raw: string): string {
  return raw.replace(/^tel:/i, '').split('?')[0]
}

function splitEscaped(input: string, delimiter: string): string[] {
  const parts: string[] = []
  let current = ''
  for (let i = 0; i < input.length; i++) {
    const ch = input[i]
    if (ch === '\\' && i + 1 < input.length) {
      current += ch + input[i + 1]
      i++
      continue
    }
    if (ch === delimiter) {
      parts.push(current)
      current = ''
      continue
    }
    current += ch
  }
  parts.push(current)
  return parts
}

export function parseWifiContent(raw: string): Partial<QRContent> {
  const content: Partial<QRContent> = {
    security: 'WPA',
    hidden: false,
  }
  const body = raw.replace(/^wifi:/i, '')
  for (const token of splitEscaped(body, ';')) {
    const index = token.indexOf(':')
    if (index === -1) continue
    const key = token.slice(0, index)
    let value = token.slice(index + 1)
    for (const ch of ['\\', ';', ',', ':', '"']) {
      value = value.split(`\\${ch}`).join(ch)
    }
    switch (key) {
      case 'S': content.ssid = value; break
      case 'P': content.password = value; break
      case 'T': {
        if (value.toLowerCase() === 'nopass') content.security = 'nopass'
        else if (value.toUpperCase() === 'WEP') content.security = 'WEP'
        else if (value.toUpperCase() === 'WPA') content.security = 'WPA'
        else content.security = 'WPA2'
        break
      }
      case 'H': content.hidden = value.toLowerCase() === 'true'
    }
  }
  return content
}

function normalizeHost(raw: string): string {
  try {
    return new URL(raw).hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return ''
  }
}

function socialTypeForHost(host: string): DetectionResult | null {
  if (host.includes('youtube.com') || host.includes('youtu.be') || host.includes('youtube-nocookie.com')) {
    return { type: 'youtube', label: 'YouTube', content: {} }
  }
  if (host.includes('instagram.com')) {
    return { type: 'instagram', label: 'Instagram', content: {} }
  }
  if (host.includes('facebook.com') || host.includes('fb.me') || host.includes('fb.com')) {
    return { type: 'facebook', label: 'Facebook', content: {} }
  }
  if (host.includes('linkedin.com') || host.includes('lnkd.in')) {
    return { type: 'linkedin', label: 'LinkedIn', content: {} }
  }
  if (host.includes('x.com') || host.includes('twitter.com')) {
    return { type: 'x', label: 'X (Twitter)', content: {} }
  }
  if (host.includes('wa.me') || host.includes('whatsapp.com')) {
    return { type: 'whatsapp', label: 'WhatsApp', content: {} }
  }
  if (host.includes('t.me') || host.includes('telegram.me')) {
    return { type: 'text', label: 'Telegram link', content: {} }
  }
  return null
}

function parseWhatsAppUrl(raw: string, host: string): DetectionResult {
  let number = ''
  let message = ''
  try {
    const url = new URL(raw)
    if (host.includes('wa.me')) {
      number = url.pathname.replace(/^\//, '').split('?')[0]
    }
    message = url.searchParams.get('text') ?? ''
  } catch {
    /* ignore malformed input */
  }
  return {
    type: 'whatsapp',
    label: 'WhatsApp',
    content: {
      whatsappNumber: number,
      whatsappMessage: message,
      url: raw,
    },
  }
}

export function parseVCard(raw: string): Partial<QRContent> {
  const content: Partial<QRContent> = {}
  const lines = raw.split(/\r?\n/)
  for (const line of lines) {
    const match = /^(FN|ORG|TEL|EMAIL|URL):(.+)$/.exec(line.trim())
    if (!match) continue
    const [, key, value] = match
    switch (key) {
      case 'FN': {
        const parts = value.split(' ')
        content.firstName = parts.shift() ?? ''
        content.lastName = parts.join(' ')
        break
      }
      case 'ORG': content.organization = value; break
      case 'TEL': content.contactPhone = value; break
      case 'EMAIL': content.contactEmail = value; break
      case 'URL': content.website = value; break
    }
  }
  return content
}

export function parseSms(raw: string): Partial<QRContent> {
  const match = /^SMSTO:([^:]+):?(.*)$/.exec(raw.trim())
  if (!match) return {}
  return { phone: match[1], smsMessage: match[2] ?? '' }
}

/**
 * Detect a strong, well-known QR payload from a pasted value.
 * Returns null when nothing conclusive was found.
 */
export function detect(raw: string): DetectionResult | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  if (/^mailto:/i.test(trimmed)) {
    return { type: 'email', label: 'Email', content: parseMailtoContent(trimmed) }
  }
  if (/^tel:/i.test(trimmed)) {
    return {
      type: 'phone',
      label: 'Phone',
      content: { phone: parseTelContent(trimmed) },
    }
  }
  if (/^wifi:/i.test(trimmed)) {
    return { type: 'wifi', label: 'Wi-Fi', content: parseWifiContent(trimmed) }
  }
  if (/^whatsapp:/i.test(trimmed)) {
    return parseWhatsAppUrl(trimmed, 'whatsapp.com')
  }
  if (/^SMSTO:/i.test(trimmed)) {
    return { type: 'sms', label: 'SMS', content: parseSms(trimmed) }
  }
  if (/^BEGIN:VCARD/i.test(trimmed)) {
    return { type: 'contact', label: 'Contact card', content: parseVCard(trimmed) }
  }

  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    try {
      const prot = new URL(trimmed).protocol
      if (/^https?:$/.test(prot)) {
        const host = normalizeHost(trimmed)
        const social = socialTypeForHost(host)
        if (social) {
          if (social.type === 'whatsapp') return parseWhatsAppUrl(trimmed, host)
          return { ...social, content: { url: trimmed } }
        }
        return { type: 'url', label: 'Website', content: { url: trimmed } }
      }
    } catch {
      return null
    }
    return null
  }

  // Bare host, e.g. "youtube.com/watch?v=.."
  const host = normalizeHost(`https://${trimmed}`)
  if (host) {
    const social = socialTypeForHost(host)
    if (social) {
      const normalized = /^https?:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`
      if (social.type === 'whatsapp') return parseWhatsAppUrl(normalized, host)
      return { ...social, content: { url: normalized } }
    }
    if (host.includes('.')) {
      return {
        type: 'url',
        label: 'Website',
        content: { url: /^https?:\/\//.test(trimmed) ? trimmed : `https://${trimmed}` },
      }
    }
  }

  return null
}