import QRCode from 'qrcode'
import type { DotStyle, ErrorCorrection, QRContent, QRType } from '../types/qr'
import { glyphMarkup, iconDataUrl } from './icons'

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

export interface ModuleMatrix {
  count: number
  margin: number
  size: number
  get: (row: number, col: number) => boolean
}

export function buildMatrix(
  payload: string,
  errorCorrection: ErrorCorrection,
  margin: number,
): ModuleMatrix {
  const qr = QRCode.create(payload, {
    errorCorrectionLevel: errorCorrection,
  })
  const n = qr.modules.size
  const m = Math.max(0, Math.min(4, Math.round(margin)))
  const size = n + m * 2
  return {
    count: n,
    margin: m,
    size,
    get(row, col) {
      const y = row - m
      const x = col - m
      if (y < 0 || x < 0 || y >= n || x >= n) return false
      return !!qr.modules.get(y, x)
    },
  }
}

function isFinderPattern(row: number, col: number, count: number): boolean {
  const top = row <= 6
  const left = col <= 6
  const right = col >= count - 7
  const bottom = row >= count - 7
  return (top && left) || (top && right) || (bottom && left)
}

const ICON_GLYPH_INK = '#1c1917'

function parseHexColor(hex: string): [number, number, number] | null {
  const clean = hex.trim().replace(/^#/, '')
  if (clean.length === 3) {
    const v = clean
      .split('')
      .map((ch) => parseInt(ch + ch, 16))
    return [v[0], v[1], v[2]]
  }
  if ((clean.length === 6 || clean.length === 8) && /^[0-9a-fA-F]+$/.test(clean)) {
    const r = parseInt(clean.slice(0, 2), 16)
    const g = parseInt(clean.slice(2, 4), 16)
    const b = parseInt(clean.slice(4, 6), 16)
    return [r, g, b]
  }
  return null
}

export function glyphColorFor(foreground: string): string {
  const rgb = parseHexColor(foreground)
  if (!rgb) return ICON_GLYPH_INK
  const luminance = 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]
  return luminance < 150 ? foreground : ICON_GLYPH_INK
}

export interface QRRenderOptions {
  payload: string
  foreground: string
  background: string
  transparent: boolean
  errorCorrection: ErrorCorrection
  margin: number
  style: DotStyle
  iconType: QRType | null
  iconRatio: number
  size: number
}

interface PixelCell {
  off: number
  size: number
}

function gridCell(index: number, count: number, span: number): PixelCell {
  const a = Math.floor((index * span) / count)
  const b = Math.floor(((index + 1) * span) / count)
  return { off: a, size: Math.max(1, b - a) }
}

function roundRectPath(x: number, y: number, w: number, r: number): Path2D {
  const p = new Path2D()
  const radius = Math.min(r, w / 2)
  if (radius <= 0) {
    p.rect(x, y, w, w)
    p.closePath()
    return p
  }
  p.moveTo(x + radius, y)
  p.arcTo(x + w, y, x + w, y + w, radius)
  p.arcTo(x + w, y + w, x, y + w, radius)
  p.arcTo(x, y + w, x, y, radius)
  p.arcTo(x, y, x + w, y, radius)
  p.closePath()
  return p
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load icon'))
    img.src = src
  })
}

export async function renderQRToCanvas(opts: QRRenderOptions): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas')
  canvas.width = opts.size
  canvas.height = opts.size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas is not supported in this browser')

  const matrix = buildMatrix(opts.payload, opts.errorCorrection, opts.margin)

  if (!opts.transparent) {
    ctx.fillStyle = opts.background
    ctx.fillRect(0, 0, opts.size, opts.size)
  }

  ctx.fillStyle = opts.foreground

  for (let row = 0; row < matrix.size; row++) {
    const yc = gridCell(row, matrix.size, opts.size)
    for (let col = 0; col < matrix.size; col++) {
      if (!matrix.get(row, col)) continue
      const xc = gridCell(col, matrix.size, opts.size)
      const y = yc.off
      const x = xc.off
      const module = Math.max(xc.size, yc.size)
      if (module <= 0) continue
      const inFinder = isFinderPattern(row - matrix.margin, col - matrix.margin, matrix.count)
      const isDot = opts.style === 'dots' && !inFinder
      const isRounded = opts.style === 'rounded' && !inFinder
      if (isDot) {
        ctx.beginPath()
        ctx.arc(x + module / 2, y + module / 2, module / 2, 0, Math.PI * 2)
        ctx.fill()
      } else if (isRounded) {
        ctx.fill(roundRectPath(x, y, module, module * 0.28))
      } else {
        ctx.fillRect(x, y, module, module)
      }
    }
  }

  if (opts.iconType) {
    const glyphColor = glyphColorFor(opts.foreground)
    const iconUrl = iconDataUrl(opts.iconType, { glyphColor })
    const img = await loadImage(iconUrl)
    const chip = opts.size * opts.iconRatio
    const cx = opts.size / 2
    const cy = opts.size / 2
    ctx.fillStyle = '#ffffff'
    ctx.fill(roundRectPath(Math.round(cx - chip / 2), Math.round(cy - chip / 2), Math.round(chip), Math.round(chip * 0.26)))
    const glyph = chip * 0.64
    ctx.drawImage(img, Math.round(cx - glyph / 2), Math.round(cy - glyph / 2), Math.round(glyph), Math.round(glyph))
  }

  return canvas
}

function modulePath(row: number, col: number, style: DotStyle, inFinder: boolean): string {
  const x = col
  const y = row
  if (style === 'dots' && !inFinder) {
    return `M${x} ${y + 0.5}a0.5 0.5 0 1 0 1 0a0.5 0.5 0 1 0 -1 0Z`
  }
  const r = style === 'rounded' && !inFinder ? 0.28 : 0
  if (r <= 0) {
    return `M${x} ${y}h1v1h-1z`
  }
  return [
    `M${x + r} ${y}`,
    `H${x + 1 - r}`,
    `A${r} ${r} 0 0 1 ${x + 1} ${y + r}`,
    `V${y + 1 - r}`,
    `A${r} ${r} 0 0 1 ${x + 1 - r} ${y + 1}`,
    `H${x + r}`,
    `A${r} ${r} 0 0 1 ${x} ${y + 1 - r}`,
    `V${y + r}`,
    `A${r} ${r} 0 0 1 ${x + r} ${y}`,
    'Z',
  ].join('')
}

export function renderQRToSVG(opts: QRRenderOptions): string {
  const matrix = buildMatrix(opts.payload, opts.errorCorrection, opts.margin)
  const view = matrix.size
  let path = ''

  for (let row = 0; row < matrix.size; row++) {
    for (let col = 0; col < matrix.size; col++) {
      if (!matrix.get(row, col)) continue
      const inFinder = isFinderPattern(row - matrix.margin, col - matrix.margin, matrix.count)
      path += modulePath(row, col, opts.style, inFinder)
    }
  }

  let icon = ''
  if (opts.iconType) {
    const chip = view * opts.iconRatio
    const cx = view / 2
    const cy = view / 2
    const chipRadius = chip * 0.26
    icon += `<rect x="${(cx - chip / 2).toFixed(4)}" y="${(cy - chip / 2).toFixed(4)}" width="${chip.toFixed(4)}" height="${chip.toFixed(4)}" rx="${chipRadius.toFixed(4)}" fill="#ffffff"/>`
    const glyph = chip * 0.64
    const scale = glyph / 24
    const glyphColor = glyphColorFor(opts.foreground)
    icon += `<g transform="translate(${(cx - glyph / 2).toFixed(4)} ${(cy - glyph / 2).toFixed(4)}) scale(${scale.toFixed(4)})" stroke="${glyphColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none">${glyphMarkup(opts.iconType)}</g>`
  }

  const backgroundRect = opts.transparent
    ? ''
    : `<rect width="${view}" height="${view}" fill="${opts.background}"/>`

  const width = opts.size
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${width}" viewBox="0 0 ${view} ${view}">`,
    backgroundRect,
    `<path fill="${opts.foreground}" d="${path}"/>`,
    icon,
    '</svg>',
  ].join('')
}