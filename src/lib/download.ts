export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1500)
}

export async function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Could not export the QR code as an image'))
      },
      'image/png',
    )
  })
}

export async function downloadPNG(canvas: HTMLCanvasElement, filename: string): Promise<void> {
  const blob = await canvasToBlob(canvas)
  downloadBlob(blob, filename)
}

export async function downloadSVG(svg: string, filename: string): Promise<void> {
  const blob = new Blob([svg], { type: 'image/svg+xml' })
  downloadBlob(blob, filename)
}

export async function copyImageToClipboard(canvas: HTMLCanvasElement): Promise<boolean> {
  if (
    typeof ClipboardItem === 'undefined' ||
    !navigator.clipboard ||
    !navigator.clipboard.write
  ) {
    return false
  }
  try {
    const blob = await canvasToBlob(canvas)
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
    return true
  } catch {
    return false
  }
}

export async function copyText(text: string): Promise<boolean> {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      /* fall through to legacy path */
    }
  }
  try {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    const ok = document.execCommand('copy')
    textarea.remove()
    return ok
  } catch {
    return false
  }
}

export async function shareQR(
  canvas: HTMLCanvasElement,
  text: string,
  filename: string,
): Promise<'shared' | 'unsupported' | 'cancelled'> {
  if (!navigator.share) return 'unsupported'
  try {
    const blob = await canvasToBlob(canvas)
    const file = new File([blob], filename, { type: 'image/png' })
    const data: ShareData =
      navigator.canShare && navigator.canShare({ files: [file] })
        ? { title: 'QR code', files: [file], text }
        : { title: 'QR code', text }
    await navigator.share(data)
    return 'shared'
  } catch {
    return 'cancelled'
  }
}

export function downloadFileName(type: string): string {
  if (type === 'url' || type === 'text') return 'qr-code'
  return `${type}-qr-code`
}