import type { QRContent, QRType } from '../types/qr'

/**
 * A short, human-readable title for a QR payload — used for history entries
 * and smart download filenames. Falls back to '' when nothing is filled in.
 */
export function titleFor(type: QRType, content: QRContent): string {
  switch (type) {
    case 'url':
    case 'youtube':
    case 'instagram':
    case 'facebook':
    case 'x':
    case 'linkedin':
      return content.url.trim()
    case 'text':
      return content.text.trim()
    case 'email':
      return content.email.trim()
    case 'phone':
      return content.phone.trim()
    case 'sms':
      return content.phone.trim()
    case 'whatsapp':
      return content.whatsappNumber.trim()
    case 'wifi':
      return content.ssid.trim()
    case 'contact':
      return (
        [content.firstName, content.lastName].filter(Boolean).join(' ').trim() ||
        content.organization.trim()
      )
    case 'location':
      return `${content.latitude.trim()},${content.longitude.trim()}`
  }
}

const TYPE_FIELDS: Record<QRType, (keyof QRContent)[]> = {
  url: ['url'],
  text: ['text'],
  email: ['email', 'subject', 'body'],
  phone: ['phone'],
  sms: ['phone', 'smsMessage'],
  whatsapp: ['whatsappNumber', 'whatsappMessage'],
  wifi: ['ssid', 'password', 'security', 'hidden'],
  contact: [
    'firstName',
    'lastName',
    'organization',
    'contactPhone',
    'contactEmail',
    'website',
    'address',
  ],
  location: ['latitude', 'longitude'],
  youtube: ['url'],
  instagram: ['url'],
  facebook: ['url'],
  x: ['url'],
  linkedin: ['url'],
}

/**
 * Only the fields the given type actually uses, so history stays small.
 */
export function pickContentFields(type: QRType, content: QRContent): Record<string, unknown> {
  const fields: Record<string, unknown> = {}
  for (const key of TYPE_FIELDS[type]) {
    fields[key] = content[key]
  }
  return fields
}