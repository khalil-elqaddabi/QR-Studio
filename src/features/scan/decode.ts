import {
  BarcodeFormat,
  BinaryBitmap,
  DecodeHintType,
  HybridBinarizer,
  MultiFormatReader,
  RGBLuminanceSource,
} from '@zxing/library'

function luminance(data: Uint8ClampedArray | ArrayLike<number>, width: number, height: number): Uint8ClampedArray {
  const out = new Uint8ClampedArray(width * height)
  for (let i = 0, j = 0; i < data.length && j < out.length; i += 4, j++) {
    out[j] = (data[i] + data[i + 1] + data[i + 2]) / 3
  }
  return out
}

function attempt(lumArray: Uint8ClampedArray, width: number, height: number): string | null {
  const source = new RGBLuminanceSource(lumArray, width, height)
  const bitmap = new BinaryBitmap(new HybridBinarizer(source))
  const reader = new MultiFormatReader()
  const hints = new Map<DecodeHintType, any>([
    [DecodeHintType.TRY_HARDER, true],
    [DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]],
  ])
  reader.setHints(hints)
  try {
    return reader.decode(bitmap).getText()
  } catch {
    return null
  }
}

/** Decode raw RGBA pixels. Tries normal polarity, then inverted (light modules). */
export function decodeImageData(
  data: Uint8ClampedArray | ArrayLike<number>,
  width: number,
  height: number,
): string | null {
  if (width <= 0 || height <= 0) return null
  const lum = luminance(data, width, height)
  const direct = attempt(lum, width, height)
  if (direct) return direct
  const inverted = new Uint8ClampedArray(lum.length)
  for (let i = 0; i < lum.length; i++) inverted[i] = 255 - lum[i]
  return attempt(inverted, width, height)
}

export function decodeCanvas(canvas: HTMLCanvasElement): string | null {
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  let image
  try {
    image = ctx.getImageData(0, 0, canvas.width, canvas.height)
  } catch {
    return null
  }
  return decodeImageData(image.data, canvas.width, canvas.height)
}

const MAX_SCAN_SIDE = 1920

function drawToCanvas(source: ImageBitmap | HTMLImageElement): HTMLCanvasElement | null {
  const width = source instanceof ImageBitmap ? source.width : source.naturalWidth
  const height = source instanceof ImageBitmap ? source.height : source.naturalHeight
  if (!width || !height) return null
  const scale = Math.min(1, MAX_SCAN_SIDE / Math.max(width, height))
  const w = Math.max(1, Math.round(width * scale))
  const h = Math.max(1, Math.round(height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.drawImage(source, 0, 0, w, h)
  return canvas
}

/**
 * Decode a QR code from an uploaded image file, fully in the browser.
 */
export async function decodeFile(file: Blob): Promise<string | null> {
  try {
    if (typeof createImageBitmap === 'function') {
      const bitmap = await createImageBitmap(file)
      try {
        const canvas = drawToCanvas(bitmap)
        return canvas ? decodeCanvas(canvas) : null
      } finally {
        bitmap.close()
      }
    }
  } catch {
    /* fall through to <img> path */
  }
  try {
    const url = URL.createObjectURL(file)
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('image'))
      img.src = url
    })
    URL.revokeObjectURL(url)
    const canvas = drawToCanvas(image)
    return canvas ? decodeCanvas(canvas) : null
  } catch {
    return null
  }
}