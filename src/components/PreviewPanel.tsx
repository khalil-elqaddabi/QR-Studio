import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { Copy, Download, Link, QrCode, RefreshCcw, Share2, CircleAlert } from 'lucide-react'
import type { QRContent, QRStyle, QRType } from '../types/qr'
import { TYPE_LABEL } from '../lib/meta'
import { TypeIcon } from './TypeSelector'
import { cn } from '../lib/cn'
import {
  copyImageToClipboard,
  copyText,
  downloadPNG,
  downloadSVG,
} from '../lib/download'
import { effectiveErrorCorrection, qrFilename, renderQRToCanvas, renderQRToSVG } from '../lib/qr'
import type { QRRenderOptions } from '../lib/qr'
import type { DownloadFormat } from '../lib/qr'
import { shareQRFile } from '../lib/sharing/share'
import { titleFor } from '../lib/title'
import type { ValidationStatus } from '../features/validate/messages'
import { validationMessage } from '../features/validate/messages'
import { useToast } from './Toast'

const PREVIEW_SIZE = 560

interface PreviewPanelProps {
  type: QRType
  content: QRContent
  style: QRStyle
  payload: string | null
  hasErrors: boolean
  defaultFormat: DownloadFormat
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
  defaultFormat,
  onReset,
}: PreviewPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { toast } = useToast()
  const [renderError, setRenderError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [validation, setValidation] = useState<ValidationStatus>('idle')

  const effectiveErrorCorrectionLevel = effectiveErrorCorrection(style.errorCorrection, style.iconEnabled, style.logo)

  const buildOptions = (size: number): QRRenderOptions => ({
    payload: payload ?? '',
    foreground: style.foreground,
    background: style.background,
    transparent: style.transparent,
    errorCorrection: effectiveErrorCorrectionLevel,
    margin: style.margin,
    style: style.style,
    iconType: style.logo ? null : style.iconEnabled ? type : null,
    iconRatio: style.iconSize / 100,
    logo: style.logo ?? null,
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
  }, [payload, type, hasErrors, style.foreground, style.background, style.transparent, effectiveErrorCorrectionLevel, style.margin, style.style, style.iconEnabled, style.iconSize, style.logo])

  useEffect(() => {
    if (!payload || hasErrors) {
      setValidation('idle')
      return
    }
    let cancelled = false
    setValidation('checking')
    const timer = window.setTimeout(async () => {
      const { validateQr } = await import('../features/validate/validateQr')
      if (cancelled) return
      const status = await validateQr({ payload, style, type })
      if (!cancelled) setValidation(status)
    }, 600)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload, hasErrors, type, style])

  const ready = !!payload && !hasErrors && !renderError
  const caption = payload ? captionFor(type, content) : ''
  const title = payload ? titleFor(type, content) : ''
  const filenames = {
    png: qrFilename(type, { title, format: 'png' }),
    svg: qrFilename(type, { title, format: 'svg' }),
  }
  const validationBadge = validationMessage(validation)

  const makeCanvas = async () => renderQRToCanvas(buildOptions(style.size))

  const handleDownload = async (format: 'png' | 'svg') => {
    if (!payload || hasErrors) return
    setBusy(true)
    try {
      if (format === 'png') {
        const canvas = await makeCanvas()
        await downloadPNG(canvas, filenames.png)
      } else {
        const svg = renderQRToSVG(buildOptions(style.size))
        await downloadSVG(svg, filenames.svg)
      }
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
      const result = await shareQRFile(canvas, payload, filenames.png)
      if (result === 'unsupported') {
        const copied = await copyText(payload)
        toast(
          copied
            ? 'Sharing isn’t supported here — copied the content instead'
            : 'Sharing isn’t supported in this browser',
          'info',
        )
      } else if (result === 'failed') {
        toast('Something went wrong while sharing', 'error')
      }
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
                <p className="mt-3 truncate text-center text-xs text-ink-3" title={caption}>
                  {caption}
                </p>
              )}
              {validationBadge.label && (
                <p
                  role="status"
                  className={cn(
                    'mx-auto mt-2 inline-block rounded-full px-2.5 py-1 text-[11px] font-medium',
                    validationBadge.tone === 'good' && 'bg-emerald-500/10 text-emerald-600',
                    validationBadge.tone === 'warn' && 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
                    validationBadge.tone === 'muted' && 'bg-surface-2 text-ink-3',
                  )}
                >
                  {validationBadge.label}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      <div className="space-y-3 border-t border-stroke p-5 sm:p-6">
        <div className="grid grid-cols-2 gap-2.5">
          <DownloadButton
            label={`PNG ${style.size}px`}
            emphasized={defaultFormat === 'png'}
            disabled={!ready || busy}
            onClick={() => handleDownload('png')}
          />
          <DownloadButton
            label="SVG"
            emphasized={defaultFormat === 'svg'}
            disabled={!ready || busy}
            onClick={() => handleDownload('svg')}
          />
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

function DownloadButton({
  label,
  emphasized,
  disabled,
  onClick,
}: {
  label: string
  emphasized: boolean
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold shadow-sm transition-all duration-150 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent/40 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-40',
        emphasized
          ? 'bg-ink text-page hover:opacity-90'
          : 'border border-stroke bg-surface text-ink hover:bg-surface-2',
      )}
    >
      <Download size={16} aria-hidden />
      {label}
    </button>
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
      className="inline-flex h-10 items-center justify-center rounded-lg border border-stroke bg-surface text-ink-2 transition-colors duration-150 hover:border-stroke-strong hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  )
}