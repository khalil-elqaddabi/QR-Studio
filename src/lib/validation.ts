import type { QRContent, QRType } from '../types/qr'

export function normalizeScheme(raw: string): string {
  const t = raw.trim()
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(t)) return t
  return `https://${t}`
}

export function isValidUrl(raw: string): boolean {
  const t = raw.trim()
  if (!t) return false
  let parsed: URL
  try {
    parsed = new URL(normalizeScheme(t))
  } catch {
    return false
  }
  if (!/^https?:$/.test(parsed.protocol)) return false
  return parsed.hostname.includes('.') || parsed.hostname === 'localhost'
}

export function isValidEmail(raw: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(raw.trim())
}

const MIN_PHONE_DIGITS = 7

export function phoneDigits(raw: string): string {
  return raw.replace(/[^\d+]/g, '')
}

export function isValidPhone(raw: string): boolean {
  const digits = phoneDigits(raw).replace(/^\+/, '')
  return digits.length >= MIN_PHONE_DIGITS
}

export function isValidLatitude(raw: string): boolean {
  const v = Number(raw)
  return Number.isFinite(v) && v >= -90 && v <= 90
}

export function isValidLongitude(raw: string): boolean {
  const v = Number(raw)
  return Number.isFinite(v) && v >= -180 && v <= 180
}

export type FieldErrors = Partial<Record<string, string>>

export function validateType(type: QRType, c: QRContent): FieldErrors {
  const errors: FieldErrors = {}

  switch (type) {
    case 'url':
    case 'youtube':
    case 'instagram':
    case 'facebook':
    case 'x':
    case 'linkedin': {
      if (c.url.trim() && !isValidUrl(c.url)) {
        errors.url = 'That doesn’t look like a valid URL — or switch to Text to encode plain text'
      }
      break
    }
    case 'text':
      break
    case 'email': {
      if (c.email.trim() && !isValidEmail(c.email)) {
        errors.email = 'Enter a valid email address'
      }
      break
    }
    case 'phone':
    case 'sms': {
      if (c.phone.trim() && !isValidPhone(c.phone)) {
        errors.phone = 'Enter a valid phone number'
      }
      break
    }
    case 'whatsapp': {
      if (c.whatsappNumber.trim() && !isValidPhone(c.whatsappNumber)) {
        errors.whatsappNumber = 'Enter a valid number with country code'
      }
      break
    }
    case 'wifi': {
      break
    }
    case 'location': {
      if (c.latitude.trim() && !isValidLatitude(c.latitude)) {
        errors.latitude = 'Latitude must be between -90 and 90'
      }
      if (c.longitude.trim() && !isValidLongitude(c.longitude)) {
        errors.longitude = 'Longitude must be between -180 and 180'
      }
      break
    }
    case 'contact': {
      if (c.contactEmail.trim() && !isValidEmail(c.contactEmail)) {
        errors.contactEmail = 'Enter a valid email address'
      }
      if (c.website.trim() && !isValidUrl(c.website)) {
        errors.website = 'Enter a valid website URL'
      }
      break
    }
  }

  return errors
}