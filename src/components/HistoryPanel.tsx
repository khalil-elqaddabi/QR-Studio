import { useState } from 'react'
import { ChevronDown, Download, History, RotateCcw, Trash2 } from 'lucide-react'
import type { HistoryItem } from '../features/history/HistoryStore'
import { TYPE_LABEL } from '../lib/meta'
import { type QRType } from '../types/qr'
import { TypeIcon } from './TypeSelector'
import { cn } from '../lib/cn'
import { effectiveErrorCorrection, qrFilename, renderQRToCanvas } from '../lib/qr'
import { downloadPNG } from '../lib/download'
import { useToast } from './Toast'

interface HistoryPanelProps {
  items: HistoryItem[]
  available: boolean
  enabled: boolean
  onRegenerate: (item: HistoryItem) => void
  onRemove: (id: string) => void
  onClear: () => void
}

function relativeTime(timestamp: number): string {
  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000))
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`
  return new Date(timestamp).toLocaleDateString()
}

function payloadSnippet(payload: string): string {
  const flat = payload.replace(/\s+/g, ' ')
  return flat.length > 48 ? `${flat.slice(0, 48).trim()}…` : flat
}

export default function HistoryPanel({
  items,
  available,
  enabled,
  onRegenerate,
  onRemove,
  onClear,
}: HistoryPanelProps) {
  const [open, setOpen] = useState(false)
  const { toast } = useToast()

  const handleDownload = async (item: HistoryItem) => {
    try {
      const type = (item.type as QRType) in TYPE_LABEL ? (item.type as QRType) : 'text'
      const canvas = await renderQRToCanvas({
        payload: item.payload,
        foreground: item.style.foreground,
        background: item.style.background,
        transparent: item.style.transparent,
        errorCorrection: effectiveErrorCorrection(
          item.style.errorCorrection,
          item.style.iconEnabled,
          item.style.logo,
        ),
        margin: item.style.margin,
        style: item.style.style,
        iconType: item.style.logo ? null : item.style.iconEnabled ? type : null,
        iconRatio: item.style.iconSize / 100,
        logo: item.style.logo ?? null,
        size: item.style.size,
      })
      await downloadPNG(canvas, qrFilename(type, { format: 'png' }))
      toast('Downloaded from history')
    } catch {
      toast('Could not download that QR code', 'error')
    }
  }

  return (
    <section
      aria-labelledby="history-heading"
      className="min-w-0 rounded-2xl border border-stroke bg-surface shadow-card"
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls="history-content"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 sm:px-6"
      >
        <span className="flex items-center gap-2.5">
          <History size={16} className="text-ink-3" aria-hidden />
          <span id="history-heading" className="text-sm font-semibold text-ink">
            History
          </span>
          {items.length > 0 && (
            <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-medium tabular-nums text-ink-2">
              {items.length}
            </span>
          )}
        </span>
        <ChevronDown
          size={17}
          aria-hidden
          className={cn('text-ink-3 transition-transform duration-200', open && 'rotate-180')}
        />
      </button>

      <div
        id="history-content"
        role="region"
        aria-label="QR history"
        aria-hidden={!open}
        className={cn(
          'grid transition-[grid-template-rows] duration-200 ease-out',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className={cn('overflow-hidden', !open && 'invisible')}>
          <div className="space-y-3 border-t border-stroke px-5 py-4 sm:px-6">
            {!available ? (
              <p className="rounded-lg bg-surface-2 px-3 py-2.5 text-xs text-ink-3">
                Local history isn’t available in this browser — the app keeps working, codes
                just won’t be stored.
              </p>
            ) : !enabled ? (
              <p className="rounded-lg bg-surface-2 px-3 py-2.5 text-xs text-ink-3">
                History is paused. Turn it back on in Settings to start saving codes again.
              </p>
            ) : items.length === 0 ? (
              <p className="text-xs text-ink-3">
                Nothing here yet — codes you create will be saved automatically on this device.
              </p>
            ) : (
              <>
                <ul className="space-y-2.5">
                  {items.map((item) => {
                    const type = (item.type as QRType) in TYPE_LABEL ? (item.type as QRType) : 'text'
                    return (
                      <li
                        key={item.id}
                        className="flex items-center gap-3 rounded-xl border border-stroke bg-surface-2/60 p-3"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface text-accent shadow-sm">
                          <TypeIcon type={type} size={18} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-medium text-ink">
                            {item.title ?? TYPE_LABEL[type]}
                          </p>
                          <p className="truncate text-xs text-ink-3">
                            {payloadSnippet(item.payload)} · {relativeTime(item.createdAt)}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            aria-label="Regenerate this QR code"
                            title="Regenerate"
                            onClick={() => onRegenerate(item)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-2 transition-colors hover:bg-surface hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                          >
                            <RotateCcw size={14} aria-hidden />
                          </button>
                          <button
                            type="button"
                            aria-label="Download this QR code"
                            title="Download"
                            onClick={() => handleDownload(item)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-2 transition-colors hover:bg-surface hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                          >
                            <Download size={14} aria-hidden />
                          </button>
                          <button
                            type="button"
                            aria-label="Delete from history"
                            title="Delete"
                            onClick={() => onRemove(item.id)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-2 transition-colors hover:bg-surface hover:text-danger focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                          >
                            <Trash2 size={14} aria-hidden />
                          </button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={onClear}
                    className="rounded-lg px-2 py-1 text-xs font-medium text-ink-3 transition-colors hover:text-danger focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                  >
                    Clear all history
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}