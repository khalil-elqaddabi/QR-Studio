import { useEffect, useRef } from 'react'
import { ICON_MAP } from '../lib/icons'
import { TYPE_LABEL } from '../lib/meta'
import type { QRType } from '../types/qr'
import { cn } from '../lib/cn'

export function TypeIcon({
  type,
  size = 17,
}: {
  type: QRType
  size?: number
}) {
  const spec = ICON_MAP[type]
  if (spec.mode === 'brand' && spec.brandBody) {
    return (
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="currentColor"
        aria-hidden="true"
        focusable="false"
        dangerouslySetInnerHTML={{ __html: spec.brandBody }}
      />
    )
  }
  const Icon = spec.lucideComponent
  if (!Icon) return null
  return <Icon size={size} strokeWidth={2} aria-hidden="true" focusable="false" />
}

interface TypeSelectorProps {
  value: QRType
  onChange: (type: QRType) => void
}

const GROUPS: Array<{ id: string; label: string; types: QRType[] }> = [
  {
    id: 'popular',
    label: 'Popular',
    types: ['url', 'text', 'email', 'wifi'],
  },
  {
    id: 'social',
    label: 'Social',
    types: ['youtube', 'instagram', 'whatsapp', 'facebook', 'linkedin', 'x'],
  },
  {
    id: 'utilities',
    label: 'Utilities',
    types: ['phone', 'sms', 'contact', 'location'],
  },
]

export default function TypeSelector({ value, onChange }: TypeSelectorProps) {
  const skipFirstScroll = useRef(true)

  // When the type changes (chip tap, scanned code, history item, reset…), keep
  // the active chip in view on the mobile rails.
  useEffect(() => {
    if (skipFirstScroll.current) {
      skipFirstScroll.current = false
      return
    }
    const el = document.querySelector<HTMLElement>(`[data-type-chip="${value}"]`)
    // The mobile rails are display:none on desktop, so offsetParent is null there.
    if (el && el.offsetParent !== null) {
      el.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
    }
  }, [value])

  return (
    <section aria-labelledby="type-heading" className="min-w-0">
      <div className="mb-2 flex items-baseline justify-between gap-3 pr-1 lg:px-1">
        <h2
          id="type-heading"
          className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3"
        >
          QR type
        </h2>
        <span className="hidden text-xs text-ink-3 lg:inline">1 of the following</span>
      </div>

      {/* Mobile/tablet: grouped horizontal rails */}
      <div className="space-y-2 lg:hidden">
        {GROUPS.map((group) => (
          <div key={group.id}>
            <p className="mb-1.5 px-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-3">
              {group.label}
            </p>
            <div
              role="radiogroup"
              aria-label={`QR type — ${group.label}`}
              className="no-scrollbar -mx-1.5 flex gap-1.5 overflow-x-auto px-1.5 pb-1"
            >
              {group.types.map((type) => {
                const active = value === type
                return (
                  <button
                    key={type}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    data-type-chip={type}
                    onClick={() => onChange(type)}
                    className={cn(
                      'relative flex shrink-0 items-center gap-2 rounded-full border py-2 pl-1.5 pr-3.5 text-[13px] font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
                      active
                        ? 'border-accent bg-accent-soft text-ink font-semibold'
                        : 'border-stroke bg-surface text-ink-2 hover:bg-surface-2 hover:text-ink',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors',
                        active ? 'bg-accent text-accent-ink' : 'bg-surface-2 text-ink-3',
                      )}
                    >
                      <TypeIcon type={type} size={15} />
                    </span>
                    <span className="whitespace-nowrap">{TYPE_LABEL[type]}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: tight vertical list */}
      <div role="radiogroup" aria-label="QR type" className="hidden lg:block">
        {GROUPS.map((group) => (
          <div key={group.id} className="mb-3 last:mb-0">
            <p className="mb-1 flex px-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-3">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.types.map((type) => {
                const active = value === type
                return (
                  <button
                    key={type}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => onChange(type)}
                    className={cn(
                      'relative flex w-full items-center gap-2 rounded-xl border border-transparent px-3 py-2.5 text-left text-[13px] font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                      active
                        ? 'bg-accent-soft text-ink font-semibold shadow-card'
                        : 'text-ink-2 hover:bg-surface-2 hover:text-ink',
                    )}
                  >
                    {active && (
                      <span
                        aria-hidden="true"
                        className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-accent"
                      />
                    )}
                    <span
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
                        active ? 'bg-accent text-accent-ink' : 'bg-transparent text-ink-3',
                      )}
                    >
                      <TypeIcon type={type} size={15} />
                    </span>
                    <span className="truncate">{TYPE_LABEL[type]}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}