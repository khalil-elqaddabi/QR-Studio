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
      <div className="flex items-center justify-between gap-3 border-b border-stroke px-4 py-3.5 sm:px-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
          <ScanLine size={16} aria-hidden className="text-ink-2" />
          Scan a QR code
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Back to creating"
          className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
        >
          <X size={17} aria-hidden />
        </button>
      </div>

      <div className="p-4 sm:p-5">
        {result ? (
          <div className="animate-fade-up space-y-4">
            <div className="flex items-start gap-3 rounded-xl border border-emerald-600/20 bg-emerald-500/5 p-4 dark:border-emerald-500/20">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600/10 text-emerald-700 dark:text-emerald-400">
                <Check size={16} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">
                  {classified?.label}
                </p>
                <p className="text-[13px] font-semibold text-ink">{classified?.title}</p>
                {classified?.summary && (
                  <p className="mt-1 break-words text-[13px] leading-relaxed text-ink-2">
                    {classified.summary}
                  </p>
                )}
              </div>
            </div>

            {classified?.actions.map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={() => handleAction(action)}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-stroke bg-surface px-4 text-sm font-medium text-ink transition-colors hover:bg-surface-2 focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
              >
                {actionIcon(action.kind)}
                {action.label}
              </button>
            ))}

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleUse}
                className="inline-flex h-10 min-w-0 items-center justify-center gap-2 rounded-xl bg-accent px-3 text-sm font-medium text-accent-ink transition-colors hover:bg-accent-hover focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
              >
                <QrCode size={15} className="shrink-0" aria-hidden />
                <span className="min-w-0 truncate">
                  <span className="sm:hidden">Use it</span>
                  <span className="hidden sm:inline">Create a QR for this</span>
                </span>
              </button>
              <button
                type="button"
                onClick={clearResult}
                className="inline-flex h-10 min-w-0 items-center justify-center gap-2 rounded-xl border border-stroke bg-surface px-3 text-sm font-medium text-ink transition-colors hover:bg-surface-2 focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
              >
                <ScanLine size={15} className="shrink-0" aria-hidden />
                <span className="min-w-0 truncate">
                  <span className="sm:hidden">Scan again</span>
                  <span className="hidden sm:inline">Scan another</span>
                </span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <CameraView videoRef={videoRef} status={status} onStart={start} />
            <div className="flex items-center gap-3" aria-hidden="true">
              <span className="h-px flex-1 bg-stroke" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">
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
                'group flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-8 text-center transition-colors focus-within:ring-1 focus-within:ring-accent',
                dragOver
                  ? 'border-accent bg-accent-soft'
                  : 'border-stroke-strong bg-surface-2/40 hover:border-accent/50 hover:bg-surface-2',
              )}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface text-ink-2 ring-1 ring-stroke">
                <FileImage size={16} aria-hidden />
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
      <div className="bg-surface-2 relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-stroke shadow-card sm:mx-auto sm:max-w-sm">
        {status === 'active' ? (
          <>
            <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <span className="relative block h-48 w-48 shadow-[0_0_0_9999px_rgba(33,27,21,0.35)]">
                <span className="absolute inset-0 rounded-xl border-2 border-white/70" />
                <span className="absolute -left-0.5 -top-0.5 h-6 w-6 rounded-tl-md border-l-4 border-t-4 border-white" />
                <span className="absolute -right-0.5 -top-0.5 h-6 w-6 rounded-tr-md border-r-4 border-t-4 border-white" />
                <span className="absolute -bottom-0.5 -left-0.5 h-6 w-6 rounded-bl-md border-b-4 border-l-4 border-white" />
                <span className="absolute -bottom-0.5 -right-0.5 h-6 w-6 rounded-br-md border-b-4 border-r-4 border-white" />
              </span>
            </div>
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 px-6 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface text-ink-2 ring-1 ring-stroke">
              <ScanLine size={20} strokeWidth={1.75} aria-hidden />
            </span>
            <p className="max-w-[200px] text-[13px] text-ink-3">{statusMessage(status)}</p>
            {(status === 'idle' || status === 'denied' || status === 'error' || status === 'unsupported') && (
              <button
                type="button"
                onClick={onStart}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-medium text-accent-ink transition-colors hover:bg-accent-hover focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
              >
                <ScanLine size={15} aria-hidden />
                Start camera
              </button>
            )}
            {status === 'starting' && (
              <p className="animate-pulse-soft text-xs text-ink-3" role="status">
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