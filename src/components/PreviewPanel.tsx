import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import {
  Copy,
  Download,
  Link,
  QrCode,
  RefreshCcw,
  Share2,
  CircleAlert,
} from 'lucide-react'
import type { QRContent, QRStyle, QRType } from '../types/qr'
import { TYPE_LABEL } from '../lib/meta'
import { TypeIcon } from './TypeSelector'
import { cn } from '../lib/cn'
import {
  copyImageToClipboard,
  copyText,
  downloadFileName,
  downloadPNG,
  downloadSVG,
  shareQR,
} from '../lib/download'
import { renderQRToCanvas, renderQRToSVG } from '../lib/qr'
import type { QRRenderOptions } from '../lib/qr'
import { useToast } from './Toast'

const PREVIEW_SIZE = 560

interface PreviewPanelProps {
  type: QRType
  content: QRContent
  style: QRStyle
  payload: string | null
  hasErrors: boolean
  onReset: () => void
}

function captionFor(type: QRType, content: QRContent): string {
  const limit = (value: string) =>
    value.length > 46 ? `${value.slice(0, 46).trim()}…` : value
  switch (type) {
    case 'url':
    case 'youtube':
    case 'instagram':
    case 'facebook':
    case 'x':
    case 'linkedin':
      return limit(content.url)
    case 'text':
      return content.text.trim() ? `“${limit(content.text.trim())}”` : ''
    case 'email':
      return limit(content.email)
    case 'phone':
      return limit(content.phone)
    case 'sms':
      return `SMS to ${limit(content.phone)}`
    case 'whatsapp':
      return `WhatsApp — ${limit(content.whatsappNumber)}`
    case 'wifi': {
      const secure = content.security === 'nopass' ? 'open network' : 'secure network'
      return content.ssid.trim()
        ? `Network “${limit(content.ssid)}” · ${secure}`
        : ''
    }
    case 'contact': {
      const name = [content.firstName, content.lastName].filter(Boolean).join(' ')
      return name ? `Contact — ${limit(name)}` : content.organization.trim() ? `Contact — ${limit(content.organization)}` : ''
    }
    case 'location':
      return `Maps — ${layout(content.latitude)}, ${layout(content.longitude)}`
  }
}

function layout(value: string): string {
  const v = value.trim()
  return v.length > 12 ? `${v.slice(0, 12)}…` : v
}

export default function PreviewPanel({
  type,
  content,
  style,
  payload,
  hasErrors,
  onReset,
}: PreviewPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { toast } = useToast()
  const [renderError, setRenderError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const effectiveErrorCorrection = style.iconEnabled ? 'H' : style.errorCorrection

  const buildOptions = (size: number): QRRenderOptions => ({
    payload: payload ?? '',
    foreground: style.foreground,
    background: style.background,
    transparent: style.transparent,
    errorCorrection: effectiveErrorCorrection,
    margin: style.margin,
    style: style.style,
    iconType: style.iconEnabled ? type : null,
    iconRatio: style.iconSize / 100,
    size,
  })

  useEffect(() => {
    if (!payload || hasErrors) {
      canvasRef.current?.getContext('2d')?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      return
    }
    let cancelled = false
    const timer = window.setTimeout(async () => {
      try {
        const canvas = await renderQRToCanvas(buildOptions(PREVIEW_SIZE))
        if (cancelled) return
        const node = canvasRef.current
        if (!node) return
        node.width = canvas.width
        node.height = canvas.height
        node.getContext('2d')?.drawImage(canvas, 0, 0)
        setRenderError(null)
      } catch (error) {
        if (!cancelled) {
          setRenderError(error instanceof Error ? error.message : 'Could not render the QR code')
        }
      }
    }, 90)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload, type, hasErrors, style.foreground, style.background, style.transparent, effectiveErrorCorrection, style.margin, style.style, style.iconEnabled, style.iconSize])

  const ready = !!payload && !hasErrors && !renderError
  const caption = payload ? captionFor(type, content) : ''

  const makeCanvas = async () => renderQRToCanvas(buildOptions(style.size))

  const handleDownloadPNG = async () => {
    if (!payload || hasErrors) return
    setBusy(true)
    try {
      const canvas = await makeCanvas()
      await downloadPNG(canvas, `${downloadFileName(type)}.png`)
      toast('Downloaded successfully')
    } catch {
      toast('Could not download the QR code', 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleDownloadSVG = async () => {
    if (!payload || hasErrors) return
    setBusy(true)
    try {
      const svg = renderQRToSVG(buildOptions(style.size))
      await downloadSVG(svg, `${downloadFileName(type)}.svg`)
      toast('Downloaded successfully')
    } catch {
      toast('Could not download the QR code', 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleCopyImage = async () => {
    if (!payload || hasErrors) return
    setBusy(true)
    try {
      const canvas = await makeCanvas()
      const ok = await copyImageToClipboard(canvas)
      if (ok) toast('QR code copied')
      else {
        const copied = await copyText(payload)
        toast(
          copied
            ? 'Image copy isn’t supported here — copied the content instead'
            : 'Copying isn’t supported in this browser',
          'info',
        )
      }
    } catch {
      toast('Copying isn’t supported in this browser', 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleCopyLink = async () => {
    if (!payload || hasErrors) return
    const ok = await copyText(payload)
    toast(ok ? 'Content copied' : 'Copying isn’t supported in this browser', ok ? 'success' : 'error')
  }

  const handleShare = async () => {
    if (!payload || hasErrors) return
    setBusy(true)
    try {
      const canvas = await makeCanvas()
      const result = await shareQR(canvas, payload, `${downloadFileName(type)}.png`)
      if (result === 'unsupported') toast('Sharing isn’t supported in this browser', 'info')
    } catch {
      toast('Something went wrong while sharing', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section
      aria-label="QR preview and download"
      className="min-w-0 rounded-2xl border border-stroke bg-surface shadow-card"
    >
      <div className="p-5 sm:p-6">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-3">
            Preview
          </h2>
          <span className="hidden items-center gap-1.5 rounded-full border border-stroke bg-surface-2 px-2 py-0.5 text-[11px] text-ink-3 sm:inline-flex">
            <TypeIcon type={type} size={12} />
            {TYPE_LABEL[type]}
            <span aria-hidden>·</span>
            {style.size}px export
          </span>
        </div>

        <div className="mt-4">
          {renderError && !hasErrors ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3 px-4 py-10 text-center">
              <CircleAlert size={26} className="text-danger" aria-hidden />
              <div>
                <p className="text-sm font-semibold text-ink">Too much content to encode</p>
                <p className="mx-auto mt-1 max-w-60 text-[13px] text-ink-2">
                  Shorten the text, or lower the error correction level in Customize.
                </p>
              </div>
            </div>
          ) : !ready ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3.5 px-4 py-10 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-2 text-ink-3">
                <QrCode size={26} strokeWidth={1.75} aria-hidden />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">Your QR code will appear here</p>
                <p className="mx-auto mt-1 max-w-56 text-[13px] text-ink-2">
                  Enter your content on the left to generate a live preview.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div
                className={cn(
                  'flex justify-center rounded-2xl p-3 sm:p-4',
                  style.transparent && 'checkerboard',
                )}
              >
                <canvas
                  ref={canvasRef}
                  className="h-auto w-full max-w-[320px] rounded-xl shadow-card"
                  aria-label={`Generated QR code for ${TYPE_LABEL[type].toLowerCase()}`}
                />
              </div>
              {caption && (
                <p
                  className="mt-3 truncate text-center text-xs text-ink-3"
                  title={caption}
                >
                  {caption}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      <div className="space-y-3 border-t border-stroke p-5 sm:p-6">
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            disabled={!ready || busy}
            onClick={handleDownloadPNG}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-ink px-4 text-sm font-semibold text-page shadow-sm transition-all duration-150 hover:opacity-90 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent/40 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download size={16} aria-hidden />
            <span>
              PNG
              <span className="ml-1 font-normal opacity-70">{style.size}px</span>
            </span>
          </button>
          <button
            type="button"
            disabled={!ready || busy}
            onClick={handleDownloadSVG}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-stroke bg-surface px-4 text-sm font-semibold text-ink transition-colors duration-150 hover:bg-surface-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent/40 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download size={16} aria-hidden />
            SVG
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <IconAction
            label="Copy QR image"
            hint="Copy QR image"
            onClick={handleCopyImage}
            disabled={!ready || busy}
          >
            <Copy size={16} aria-hidden />
          </IconAction>
          <IconAction
            label="Copy content"
            hint="Copy content"
            onClick={handleCopyLink}
            disabled={!ready}
          >
            <Link size={16} aria-hidden />
          </IconAction>
          <IconAction
            label="Share QR code"
            hint="Share"
            onClick={handleShare}
            disabled={!ready || busy}
          >
            <Share2 size={16} aria-hidden />
          </IconAction>
          <IconAction label="Start over" hint="Start over" onClick={onReset}>
            <RefreshCcw size={15} aria-hidden />
          </IconAction>
        </div>
      </div>
    </section>
  )
}

function IconAction({
  label,
  hint,
  onClick,
  disabled,
  children,
}: {
  label: string
  hint: string
  onClick: () => void
  disabled?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={hint}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-9 items-center justify-center rounded-lg border border-stroke bg-surface text-ink-2 transition-colors duration-150 hover:border-stroke-strong hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  )
}