import type { QRType } from '../../types/qr'

export type DownloadFormat = 'png' | 'svg'

const TYPE_SLUG: Record<QRType, string> = {
  url: 'website',
  text: 'text',
  email: 'email',
  phone: 'phone',
  sms: 'sms',
  whatsapp: 'whatsapp',
  wifi: 'wifi',
  contact: 'contact',
  location: 'location',
  youtube: 'youtube',
  instagram: 'instagram',
  facebook: 'facebook',
  x: 'x-twitter',
  linkedin: 'linkedin',
}

const MAX_PART_LENGTH = 40

function stripUnsafeCharacters(raw: string): string {
  return raw.replace(/[\\/:*?"<>|]/g, ' ').replace(/\s+/g, ' ').trim()
}

/**
 * Turn arbitrary user text into a safe filename fragment.
 * Keeps letters, digits, spaces, and a few safe separators only.
 */
export function sanitizeFilenamePart(raw: string): string {
  const stripped = stripUnsafeCharacters(raw)
    .replace(/[^\p{L}\p{N}\s._-]/gu, '')
    .replace(/^[.\-_]+|[.\-_]+$/g, '')
  const trimmed = stripped.slice(0, MAX_PART_LENGTH).trim()
  return trimmed || ''
}

export function qrFilename(
  type: QRType,
  opts: { title?: string; format: DownloadFormat } = { format: 'png' },
): string {
  const base = `qr-${TYPE_SLUG[type]}`
  const title = sanitizeFilenamePart(opts.title ?? '')
  const name = title ? `${base}-${title.replace(/\s+/g, '-')}` : base
  return `${name}.${opts.format}`
}