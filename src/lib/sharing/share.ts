import { canvasToBlob } from '../download'

export type ShareResult = 'shared' | 'cancelled' | 'unsupported' | 'failed'

export function isShareAvailable(): boolean {
  return typeof navigator.share === 'function'
}

export function isFileShareAvailable(): boolean {
  return typeof navigator.canShare === 'function'
}

export async function shareQRFile(
  canvas: HTMLCanvasElement,
  text: string,
  filename: string,
): Promise<ShareResult> {
  if (!isShareAvailable()) return 'unsupported'
  try {
    const blob = await canvasToBlob(canvas)
    const file = new File([blob], filename, { type: 'image/png' })
    const data: ShareData =
      isFileShareAvailable() && navigator.canShare({ files: [file] })
        ? { title: 'QR code', files: [file], text }
        : { title: 'QR code', text }
    await navigator.share(data)
    return 'shared'
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled'
    return 'failed'
  }
}

export async function shareContent(
  text: string,
  opts: { title?: string; url?: string } = {},
): Promise<ShareResult> {
  if (!isShareAvailable()) return 'unsupported'
  const data: ShareData = { text, ...(opts.title ? { title: opts.title } : {}), ...(opts.url ? { url: opts.url } : {}) }
  try {
    await navigator.share(data)
    return 'shared'
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled'
    return 'failed'
  }
}