import type { ErrorCorrection, QRContent, QRType } from '../../types/qr'

export function normalizeUrl(raw: string): string {
  const t = raw.trim()
  if (!t) return t
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(t)) return t
  return `https://${t}`
}

export function digitOnly(raw: string): string {
  return raw.replace(/[^\d]/g, '')
}

function vcardEscape(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

function wifiEscape(value: string): string {
  return value.replace(/([\\;,:"])/g, '\\$1')
}

export function buildPayload(type: QRType, c: QRContent): string | null {
  switch (type) {
    case 'url':
    case 'youtube':
    case 'instagram':
    case 'facebook':
    case 'x':
    case 'linkedin': {
      const url = normalizeUrl(c.url)
      return url || null
    }
    case 'text':
      return c.text.trim() || null
    case 'email': {
      const email = c.email.trim()
      if (!email) return null
      const params: string[] = []
      if (c.subject.trim()) params.push(`subject=${encodeURIComponent(c.subject.trim())}`)
      if (c.body.trim()) params.push(`body=${encodeURIComponent(c.body.trim())}`)
      return `mailto:${email}${params.length ? `?${params.join('&')}` : ''}`
    }
    case 'phone': {
      const num = digitOnly(c.phone)
      return num ? `tel:${num}` : null
    }
    case 'sms': {
      const num = digitOnly(c.phone)
      if (!num) return null
      const msg = c.smsMessage.trim()
      return msg ? `SMSTO:${num}:${msg}` : `SMSTO:${num}`
    }
    case 'whatsapp': {
      const num = digitOnly(c.whatsappNumber)
      if (!num) return null
      const msg = c.whatsappMessage.trim()
      return msg
        ? `https://wa.me/${num}?text=${encodeURIComponent(msg)}`
        : `https://wa.me/${num}`
    }
    case 'wifi': {
      const ssid = c.ssid.trim()
      if (!ssid) return null
      const parts: string[] = [`T:${c.security === 'nopass' ? 'nopass' : c.security}`]
      parts.push(`S:${wifiEscape(ssid)}`)
      if (c.security !== 'nopass' && c.password) parts.push(`P:${wifiEscape(c.password)}`)
      if (c.hidden) parts.push('H:true')
      return `WIFI:${parts.join(';')};;`
    }
    case 'contact': {
      const hasAnything =
        c.firstName.trim() ||
        c.lastName.trim() ||
        c.organization.trim() ||
        c.contactPhone.trim() ||
        c.contactEmail.trim() ||
        c.website.trim() ||
        c.address.trim()
      if (!hasAnything) return null
      const lines: string[] = ['BEGIN:VCARD', 'VERSION:3.0']
      const first = c.firstName.trim()
      const last = c.lastName.trim()
      if (first || last) {
        lines.push(`N:${vcardEscape(last)};${vcardEscape(first)};;;`)
        lines.push(`FN:${vcardEscape(`${first} ${last}`.trim())}`)
      }
      if (c.organization.trim()) lines.push(`ORG:${vcardEscape(c.organization.trim())}`)
      if (c.contactPhone.trim()) lines.push(`TEL;TYPE=CELL:${c.contactPhone.trim()}`)
      if (c.contactEmail.trim()) lines.push(`EMAIL:${c.contactEmail.trim()}`)
      if (c.website.trim()) lines.push(`URL:${normalizeUrl(c.website)}`)
      if (c.address.trim()) lines.push(`ADR;TYPE=HOME:;;${vcardEscape(c.address.trim())};;;;`)
      lines.push('END:VCARD')
      return lines.join('\r\n')
    }
    case 'location': {
      const lat = c.latitude.trim()
      const lng = c.longitude.trim()
      if (!lat || !lng) return null
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`
    }
  }
}

export const EC_LEVELS: ErrorCorrection[] = ['L', 'M', 'Q', 'H']