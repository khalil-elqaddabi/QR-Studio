import QRCode from 'qrcode'
import type { DotStyle, ErrorCorrection, QRLogo, QRType } from '../../types/qr'
import { glyphMarkup, iconDataUrl } from '../icons'

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

/**
 * A center icon or custom logo masks part of the data area, so the highest
 * error correction level is required to keep the code readable.
 */
export function effectiveErrorCorrection(
  errorCorrection: ErrorCorrection,
  iconEnabled: boolean,
  logo: QRLogo | null,
): ErrorCorrection {
  return iconEnabled || logo ? 'H' : errorCorrection
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
  logo?: QRLogo | null
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
    img.onerror = () => reject(new Error('Failed to load image'))
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

  if (opts.logo) {
    const img = await loadImage(opts.logo.dataUrl)
    const chip = opts.size * (opts.logo.size / 100)
    const cx = opts.size / 2
    const cy = opts.size / 2
    const left = Math.round(cx - chip / 2)
    const top = Math.round(cy - chip / 2)
    const chipInt = Math.round(chip)
    ctx.save()
    if (opts.logo.shape === 'circle') {
      ctx.beginPath()
      ctx.arc(cx, cy, chipInt / 2, 0, Math.PI * 2)
      ctx.clip()
    } else {
      ctx.beginPath()
      ctx.roundRect(left, top, chipInt, chipInt, Math.min(chipInt * 0.22, 24))
      ctx.clip()
    }
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(left, top, chipInt, chipInt)
    drawCover(ctx, img, left, top, chipInt, chipInt)
    ctx.restore()
  } else if (opts.iconType) {
    const glyphColor = glyphColorFor(opts.foreground)
    const iconUrl = iconDataUrl(opts.iconType, { glyphColor })
    const img = await loadImage(iconUrl)
    const chip = opts.size * opts.iconRatio
    const cx = opts.size / 2
    const cy = opts.size / 2
    ctx.fillStyle = '#ffffff'
    ctx.fill(roundRectPath(Math.round(cx - chip / 2), Math.round(cy - chip / 2), Math.round(chip), Math.round(chip) * 0.26))
    const glyph = chip * 0.64
    ctx.drawImage(img, Math.round(cx - glyph / 2), Math.round(cy - glyph / 2), Math.round(glyph), Math.round(glyph))
  }

  return canvas
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight)
  const dw = img.naturalWidth * scale
  const dh = img.naturalHeight * scale
  ctx.drawImage(img, x - (dw - w) / 2, y - (dh - h) / 2, dw, dh)
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

  let center = ''
  if (opts.logo) {
    const chip = view * (opts.logo.size / 100)
    const cx = view / 2
    const cy = view / 2
    const left = cx - chip / 2
    const top = cy - chip / 2
    const rounded = opts.logo.shape === 'circle'
    const clipId = rounded ? 'qr-logo-circle' : 'qr-logo-round'
    const clipPath = rounded
      ? `<circle cx="${cx}" cy="${cy}" r="${chip / 2}"/>`
      : `<rect x="${left}" y="${top}" width="${chip}" height="${chip}" rx="${Math.min(chip * 0.22, 24)}"/>`
    const imageHref = opts.logo.dataUrl.replace(/&/g, '&amp;')
    center += `<defs><clipPath id="${clipId}">${clipPath}</clipPath></defs>`
    center += `<g clip-path="url(#${clipId})">`
    center += `<rect x="${left}" y="${top}" width="${chip}" height="${chip}" fill="#ffffff"/>`
    center += `<image href="${imageHref}" x="${left}" y="${top}" width="${chip}" height="${chip}" preserveAspectRatio="xMidYMid slice"/>`
    center += `</g>`
  } else if (opts.iconType) {
    const chip = view * opts.iconRatio
    const cx = view / 2
    const cy = view / 2
    const chipRadius = chip * 0.26
    center += `<rect x="${(cx - chip / 2).toFixed(4)}" y="${(cy - chip / 2).toFixed(4)}" width="${chip.toFixed(4)}" height="${chip.toFixed(4)}" rx="${chipRadius.toFixed(4)}" fill="#ffffff"/>`
    const glyph = chip * 0.64
    const scale = glyph / 24
    const glyphColor = glyphColorFor(opts.foreground)
    center += `<g transform="translate(${(cx - glyph / 2).toFixed(4)} ${(cy - glyph / 2).toFixed(4)}) scale(${scale.toFixed(4)})" stroke="${glyphColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none">${glyphMarkup(opts.iconType)}</g>`
  }

  const backgroundRect = opts.transparent
    ? ''
    : `<rect width="${view}" height="${view}" fill="${opts.background}"/>`

  const width = opts.size
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${width}" viewBox="0 0 ${view} ${view}">`,
    backgroundRect,
    `<path fill="${opts.foreground}" d="${path}"/>`,
    center,
    '</svg>',
  ].join('')
}