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
  return (
    <section aria-labelledby="type-heading" className="min-w-0">
      <div className="mb-2.5 flex items-baseline justify-between gap-3 pr-1">
        <h2
          id="type-heading"
          className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3"
        >
          QR type
        </h2>
        <span className="hidden text-xs text-ink-3 lg:inline">
          Pick what your code links to
        </span>
      </div>

      {/* Mobile: compact horizontal rail · Desktop: vertical grouped sidebar */}
      <div
        role="radiogroup"
        aria-label="QR type"
        className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-2 lg:block lg:space-y-5 lg:overflow-visible lg:pb-0 lg:mx-0 lg:px-0"
      >
        {GROUPS.map((group) => (
          <div
            key={group.id}
            className="flex shrink-0 items-center gap-2 lg:block lg:shrink lg:space-y-1.5"
          >
            <p className="hidden shrink-0 items-center gap-2 pb-0.5 text-[11px] font-medium uppercase tracking-[0.12em] text-ink-3 lg:flex">
              <span className="h-px w-3 bg-stroke-strong" aria-hidden="true" />
              {group.label}
            </p>
            <div className="flex shrink-0 gap-2 lg:block lg:space-y-1.5">
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
                      'relative flex shrink-0 items-center gap-2 rounded-[10px] border px-2.5 py-2 text-left text-[13px] font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/35 active:scale-[0.98] lg:w-full',
                      active
                        ? 'border-accent/70 bg-accent/10 text-ink'
                        : 'border-stroke bg-surface text-ink-2 hover:border-stroke-strong hover:bg-surface-2 hover:text-ink',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors duration-150',
                        active ? 'bg-accent text-accent-ink' : 'bg-surface-2 text-ink-3',
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