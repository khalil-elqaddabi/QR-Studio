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
      <div className="mb-2 flex items-baseline justify-between gap-3 pr-1 lg:px-1">
        <h2
          id="type-heading"
          className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3"
        >
          QR type
        </h2>
        <span className="hidden text-xs text-ink-3 lg:inline">1 of the following</span>
      </div>

      {/* Mobile: horizontal scroll · Desktop: tight vertical list */}
      <div
        role="radiogroup"
        aria-label="QR type"
        className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 lg:mx-0 lg:block lg:space-y-3 lg:overflow-visible lg:px-0 lg:pb-0"
      >
        {GROUPS.map((group) => (
          <div key={group.id} className="flex shrink-0 items-center gap-1.5 lg:block">
            <p className="sr-only lg:not-sr-only lg:mb-1 lg:flex lg:px-2 lg:text-[11px] lg:font-semibold lg:uppercase lg:tracking-[0.12em] lg:text-ink-3">
              {group.label}
            </p>
            <div className="flex shrink-0 gap-1.5 lg:block lg:space-y-0.5">
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
                      'relative flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-left text-[13px] font-medium transition-all duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-accent',
                      'lg:w-full lg:border-transparent lg:px-3 lg:py-2.5 lg:focus-visible:ring-2',
                      active
                        ? 'border-accent bg-accent-soft text-ink font-semibold shadow-card'
                        : 'border-stroke bg-surface text-ink-2 hover:bg-surface-2 hover:text-ink lg:border-transparent lg:bg-transparent lg:hover:bg-surface-2',
                    )}
                  >
                    {active && (
                      <span
                        aria-hidden="true"
                        className="absolute inset-y-1.5 left-0 hidden w-[3px] rounded-full bg-accent lg:block"
                      />
                    )}
                    <span
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
                        active
                          ? 'bg-accent text-accent-ink'
                          : 'bg-surface-2 text-ink-3 lg:bg-transparent',
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