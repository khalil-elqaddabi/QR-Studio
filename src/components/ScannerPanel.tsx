import { useCallback, useState } from 'react'
import {
  Check,
  ClipboardCopy,
  FileImage,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  QrCode,
  ScanLine,
  Send,
  X,
} from 'lucide-react'
import { useCameraScanner, type CameraStatus } from '../features/scan/useCameraScanner'
import { classifyScan, type ScanAction } from '../features/scan/actions'
import { copyText } from '../lib/download'
import { openExternalUrl } from '../lib/safeUrl'
import { decodeFile } from '../features/scan/decode'
import { useToast } from './Toast'
import { cn } from '../lib/cn'

interface ScannerPanelProps {
  onUsePayload: (payload: string) => void
  onClose: () => void
}

export default function ScannerPanel({ onUsePayload, onClose }: ScannerPanelProps) {
  const { toast } = useToast()
  const [result, setResult] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const { videoRef, status, start } = useCameraScanner((text) => setResult(text))

  const classified = result ? classifyScan(result) : null

  const clearResult = () => setResult(null)

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    try {
      const text = await decodeFile(file)
      if (text) setResult(text)
      else toast('No QR code found in that image', 'info')
    } catch {
      toast('Could not read that image', 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleAction = async (action: ScanAction) => {
    if (action.kind === 'copy' && action.value) {
      const ok = await copyText(action.value)
      toast(ok ? 'Copied' : 'Copying isn’t supported here', ok ? 'success' : 'error')
      return
    }
    if (action.kind === 'url' && action.value) {
      openExternalUrl(action.value)
      return
    }
    if ((action.kind === 'tel' || action.kind === 'mailto' || action.kind === 'sms') && action.value) {
      window.location.href = action.value
      return
    }
    if (action.kind === 'maps' && action.value) {
      window.location.href = action.value
    }
  }

  const actionIcon = (kind: ScanAction['kind']) => {
    switch (kind) {
      case 'url':
        return <Send size={13} aria-hidden />
      case 'mailto':
        return <Mail size={13} aria-hidden />
      case 'tel':
        return <Phone size={13} aria-hidden />
      case 'sms':
        return <MessageSquare size={13} aria-hidden />
      case 'maps':
        return <MapPin size={13} aria-hidden />
      case 'copy':
        return <ClipboardCopy size={13} aria-hidden />
    }
  }

  const handleUse = useCallback(() => {
    if (!result) return
    onUsePayload(result)
    toast('Loaded into QR Studio')
  }, [result, onUsePayload, toast])

  return (
    <section
      aria-label="Scan a QR code"
      className="min-w-0 rounded-2xl border border-stroke bg-surface shadow-card"
    >
      <div className="flex items-center justify-between gap-3 border-b border-stroke px-5 py-4 sm:px-6">
        <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
          <span className="text-accent">
            <ScanLine size={19} />
          </span>
          Scan a QR code
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Back to creating"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
        >
          <X size={18} aria-hidden />
        </button>
      </div>

      <div className="p-5 sm:p-6">
        {result ? (
          <div className="animate-fade-up space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                <Check size={20} aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wider text-ink-3">
                  {classified?.label}
                </p>
                <p className="truncate text-[15px] font-semibold text-ink">{classified?.title}</p>
              </div>
            </div>
            {classified?.summary && (
              <p className="break-words rounded-lg bg-surface-2 px-3 py-2 text-[13px] text-ink-2">
                {classified.summary}
              </p>
            )}
            {classified?.actions.map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={() => handleAction(action)}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-stroke bg-surface px-4 text-sm font-medium text-ink transition-colors hover:bg-surface-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
              >
                {actionIcon(action.kind)}
                {action.label}
              </button>
            ))}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleUse}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-ink px-4 text-sm font-semibold text-page shadow-sm transition-all hover:opacity-90 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent/40 focus-visible:ring-offset-surface"
              >
                <QrCode size={16} aria-hidden />
                Create a QR for this
              </button>
              <button
                type="button"
                onClick={clearResult}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-stroke bg-surface px-4 text-sm font-semibold text-ink transition-colors hover:bg-surface-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
              >
                Scan another
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <CameraView videoRef={videoRef} status={status} onStart={start} />
            <div className="flex items-center gap-3" aria-hidden="true">
              <span className="h-px flex-1 bg-stroke" />
              <span className="text-[11px] font-medium uppercase tracking-wider text-ink-3">
                or upload an image
              </span>
              <span className="h-px flex-1 bg-stroke" />
            </div>
            <label
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragOver(false)
                const file = e.dataTransfer.files?.[0]
                if (file) void handleFile(file)
              }}
              className={cn(
                'flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-6 text-center transition-colors focus-within:ring-2 focus-within:ring-accent/30',
                dragOver
                  ? 'border-accent bg-accent-soft/60'
                  : 'border-stroke-strong bg-surface-2 hover:border-accent hover:bg-accent-soft/40',
              )}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-ink-2 shadow-sm">
                <FileImage size={17} aria-hidden />
              </span>
              <span className="text-[13px] font-medium text-ink">
                {busy ? 'Reading image…' : 'Drop a QR screenshot here, or click to browse'}
              </span>
              <span className="text-xs text-ink-3">Images are decoded locally — nothing is uploaded.</span>
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={busy}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  e.target.value = ''
                  if (file) void handleFile(file)
                }}
              />
            </label>
          </div>
        )}
      </div>
    </section>
  )
}

function CameraView({
  videoRef,
  status,
  onStart,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>
  status: CameraStatus
  onStart: () => void
}) {
  return (
    <div className="space-y-3">
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-surface-2 sm:mx-auto sm:max-w-sm">
        {status === 'active' ? (
          <>
            <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <span className="h-40 w-40 rounded-2xl border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.25)]" />
            </div>
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 px-6 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface text-ink-3">
              <ScanLine size={22} strokeWidth={1.75} aria-hidden />
            </span>
            <p className="text-[13px] text-ink-3">{statusMessage(status)}</p>
            {(status === 'idle' || status === 'denied' || status === 'error' || status === 'unsupported') && (
              <button
                type="button"
                onClick={onStart}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-ink px-4 text-sm font-semibold text-page shadow-sm transition-all hover:opacity-90 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent/40 focus-visible:ring-offset-surface"
              >
                <ScanLine size={15} aria-hidden />
                Start camera
              </button>
            )}
            {status === 'starting' && (
              <p className="text-xs text-ink-3" role="status">
                Accessing camera…
              </p>
            )}
          </div>
        )}
      </div>
      {status === 'denied' && (
        <p className="text-center text-xs text-ink-3">
          Camera access was blocked. Allow it in your browser settings, or upload an image
          instead.
        </p>
      )}
    </div>
  )
}

function statusMessage(status: CameraStatus): string {
  switch (status) {
    case 'denied':
      return 'Camera permission was denied.'
    case 'unsupported':
      return 'Camera isn’t available in this browser.'
    case 'error':
      return 'Could not access the camera.'
    default:
      return 'Use your camera to scan any QR code instantly.'
  }
}