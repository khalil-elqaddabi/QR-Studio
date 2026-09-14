import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { Copy, Download, Lightbulb, Link, QrCode, RefreshCcw, Share2, CircleAlert } from 'lucide-react'
import type { QRContent, QRStyle, QRType } from '../types/qr'
import { TYPE_LABEL } from '../lib/meta'
import { cn } from '../lib/cn'
import {
  copyImageToClipboard,
  copyText,
  downloadPNG,
  downloadSVG,
} from '../lib/download'
import { effectiveErrorCorrection, centerIcon, qrFilename, renderQRToCanvas, renderQRToSVG } from '../lib/qr'
import type { QRRenderOptions } from '../lib/qr'
import type { DownloadFormat } from '../lib/qr'
import { shareQRFile, isImageCopyAvailable, isShareAvailable } from '../lib/sharing/share'
import { Dialog } from './ui'
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
  const [shareOpen, setShareOpen] = useState(false)
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
    iconType: centerIcon(style, type),
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
  const imageCopyAvailable = isImageCopyAvailable()

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
    if (!isShareAvailable()) {
      setShareOpen(true)
      return
    }
    setBusy(true)
    try {
      const canvas = await makeCanvas()
      const result = await shareQRFile(canvas, payload, filenames.png)
      if (result === 'cancelled' || result === 'shared') return
      toast('Native sharing isn’t available here — use the options below.', 'info')
      setShareOpen(true)
    } catch {
      toast('Could not prepare the QR code for sharing', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <section
        aria-label="QR preview and download"
        className="min-w-0 rounded-2xl border border-stroke bg-surface p-5 shadow-pop sm:p-6"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink">Preview</h2>
          {ready ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-0.5 text-[11px] font-semibold text-success">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Ready
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-0.5 text-[11px] font-medium text-ink-3">
              Waiting
            </span>
          )}
        </div>

        {renderError && !hasErrors ? (
          <div className="mb-5 flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-2xl bg-surface-2 p-6 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-danger/10 text-danger">
              <CircleAlert size={22} aria-hidden />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">Too much content to encode</p>
              <p className="mx-auto mt-1 max-w-60 text-[13px] text-ink-2">
                Shorten the text, or lower the error correction level in Customize.
              </p>
            </div>
          </div>
        ) : !ready ? (
          <div className="mb-5 flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-2xl bg-surface-2 p-6 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl text-ink-3">
              <QrCode size={24} strokeWidth={1.5} aria-hidden />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">No QR code yet</p>
              <p className="mx-auto mt-1 max-w-52 text-[13px] leading-relaxed text-ink-2">
                Fill in the form on the left — your code will appear here.
              </p>
            </div>
          </div>
        ) : (
          <div className="mb-5 flex flex-col items-center">
            <div
              className={cn(
                'w-full max-w-[280px] rounded-2xl p-4 ring-1',
                style.transparent
                  ? 'checkerboard ring-stroke'
                  : 'bg-white ring-stroke shadow-card',
              )}
            >
              <canvas
                ref={canvasRef}
                className="h-auto w-full rounded-xl"
                aria-label={`Generated QR code for ${TYPE_LABEL[type].toLowerCase()}`}
              />
            </div>
            {caption && (
              <p className="mt-3 w-full truncate text-center text-[13px] text-ink-2" title={caption}>
                {caption}
              </p>
            )}
            {validationBadge.label && (
              <p
                role="status"
                className={cn(
                  'mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium',
                  validationBadge.tone === 'good' && 'text-emerald-600 dark:text-emerald-400',
                  validationBadge.tone === 'warn' && 'text-amber-600 dark:text-amber-400',
                  validationBadge.tone === 'muted' && 'text-ink-3',
                )}
              >
                {validationBadge.label}
              </p>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          <div className="grid min-w-0 flex-1 grid-cols-2 gap-2">
            <DownloadButton
              label="PNG"
              meta={`· ${style.size}px`}
              emphasized={defaultFormat === 'png'}
              disabled={!ready || busy}
              onClick={() => handleDownload('png')}
            />
            <DownloadButton
              label="SVG"
              meta="· vector"
              emphasized={defaultFormat === 'svg'}
              disabled={!ready || busy}
              onClick={() => handleDownload('svg')}
            />
          </div>
          <button
            type="button"
            aria-label="Copy QR image"
            title="Copy QR image"
            disabled={!ready || busy}
            onClick={handleCopyImage}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-stroke text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink focus:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Copy size={17} aria-hidden />
          </button>
        </div>

        <div className="mt-3 grid grid-cols-4 gap-1.5">
          <IconAction label="Copy QR image" hint="Copy" onClick={handleCopyImage} disabled={!ready || busy} icon={<Copy size={16} aria-hidden />} text="Copy" />
          <IconAction label="Copy content" hint="Content" onClick={handleCopyLink} disabled={!ready} icon={<Link size={16} aria-hidden />} text="Content" />
          <IconAction label="Share QR code" hint="Share" onClick={handleShare} disabled={!ready || busy} icon={<Share2 size={16} aria-hidden />} text="Share" />
          <IconAction label="Start over" hint="Reset" onClick={onReset} icon={<RefreshCcw size={15} aria-hidden />} text="Reset" />
        </div>

        <div className="mt-4 rounded-xl bg-accent-soft/60 p-4">
          <p className="flex items-center gap-2 text-[13px] font-semibold text-accent">
            <Lightbulb size={14} strokeWidth={2} aria-hidden />
            Private &amp; offline
          </p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-ink-2">
            Every QR code is generated right here on your device — nothing is uploaded.
          </p>
        </div>
      </section>

      <Dialog open={shareOpen} onClose={() => setShareOpen(false)} title="Share QR">
        <div className="space-y-2">
          <p className="pb-1 text-[13px] leading-relaxed text-ink-2">
            Native sharing isn’t supported in this browser. Choose how you’d like to share this QR code.
          </p>
          <button
            type="button"
            onClick={handleCopyLink}
            disabled={!ready}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-medium text-accent-ink transition-colors hover:bg-accent-hover focus:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Copy size={16} aria-hidden />
            Copy content
          </button>
          <button
            type="button"
            onClick={() => handleDownload('png')}
            disabled={!ready || busy}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-stroke bg-surface px-4 text-sm font-medium text-ink transition-colors hover:bg-surface-2 focus:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download size={16} aria-hidden />
            Download PNG
          </button>
          <button
            type="button"
            onClick={() => handleDownload('svg')}
            disabled={!ready || busy}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-stroke bg-surface px-4 text-sm font-medium text-ink transition-colors hover:bg-surface-2 focus:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download size={16} aria-hidden />
            Download SVG
          </button>
          {imageCopyAvailable && (
            <button
              type="button"
              onClick={handleCopyImage}
              disabled={!ready || busy}
className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-stroke bg-surface px-4 text-sm font-medium text-ink transition-colors hover:bg-surface-2 focus:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Copy size={16} aria-hidden />
              Copy image
            </button>
          )}
        </div>
      </Dialog>
    </>
  )
}

function DownloadButton({
  label,
  meta,
  emphasized,
  disabled,
  onClick,
}: {
  label: string
  meta?: string
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
        'inline-flex h-11 min-w-0 items-center justify-center gap-2 rounded-xl px-3 text-[13px] font-semibold transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-40',
        emphasized
          ? 'bg-accent text-accent-ink shadow-card hover:bg-accent-hover'
          : 'border border-stroke bg-surface text-ink hover:bg-surface-2',
      )}
    >
      <Download size={15} aria-hidden />
      <span className="min-w-0 truncate">
        {label}
        {meta && <span className="hidden lg:inline"> {meta}</span>}
      </span>
    </button>
  )
}

function IconAction({
  label,
  hint,
  onClick,
  disabled,
  icon,
  text,
}: {
  label: string
  hint: string
  onClick: () => void
  disabled?: boolean
  icon: ReactNode
  text: string
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={hint}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-12 w-full flex-col items-center justify-center gap-1 rounded-xl border border-stroke text-ink-2 transition-all duration-150 hover:bg-surface-2 hover:text-ink focus:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-40"
    >
      {icon}
      <span className="text-[11px] font-medium">{text}</span>
    </button>
  )
}