import { LOGO_SIZE_RANGE, type QRLogo } from '../../types/qr'

export type LogoProcessResult =
  | { ok: true; logo: QRLogo }
  | { ok: false; error: string }

export const LOGO_ACCEPT = 'image/png,image/jpeg'

const MAX_LOGO_BASE = 256
const DEFAULT_LOGO_SIZE = 20
const DEFAULT_LOGO_SHAPE = 'rounded'

export function clampLogoSize(size: number): number {
  const rounded = Math.round(size)
  return Math.min(LOGO_SIZE_RANGE.max, Math.max(LOGO_SIZE_RANGE.min, rounded))
}

export function isLogoRisky(size: number): boolean {
  return size > LOGO_SIZE_RANGE.risky
}

function isAllowedType(file: File): boolean {
  return file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'image/jpg'
}

function loadImageObject(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read that image'))
    }
    image.src = url
  })
}

function downscaleToDataUrl(image: HTMLImageElement, maxSide = MAX_LOGO_BASE): string {
  const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight))
  const width = Math.max(1, Math.round(image.naturalWidth * scale))
  const height = Math.max(1, Math.round(image.naturalHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(image, 0, 0, width, height)
  return canvas.toDataURL('image/png')
}

/**
 * Read an uploaded logo strictly from an image element — raster formats only.
 * SVG uploads are rejected because a browser-decoded SVG could carry scripts;
 * there is no safe local sanitizer available, so we refuse them outright.
 */
export async function processLogoFile(file: File): Promise<LogoProcessResult> {
  if (!isAllowedType(file)) {
    return {
      ok: false,
      error: 'Please upload a PNG or JPG logo — other formats are blocked for security.',
    }
  }
  try {
    const image = await loadImageObject(file)
    const dataUrl = downscaleToDataUrl(image)
    if (!dataUrl) return { ok: false, error: 'Could not process that image.' }
    return {
      ok: true,
      logo: { dataUrl, size: DEFAULT_LOGO_SIZE, shape: DEFAULT_LOGO_SHAPE },
    }
  } catch {
    return { ok: false, error: 'Could not read that image file.' }
  }
}

/**
 * Records in history keep a tiny logo preview so storage stays small.
 */
export async function makeLogoThumb(logo: QRLogo): Promise<QRLogo> {
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('logo'))
      img.src = logo.dataUrl
    })
    const dataUrl = downscaleToDataUrl(image, 48)
    if (!dataUrl) return logo
    return { ...logo, dataUrl }
  } catch {
    return logo
  }
}