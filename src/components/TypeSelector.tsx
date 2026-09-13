import { ICON_MAP } from '../lib/icons'
import { TYPE_LABEL, TYPE_ORDER } from '../lib/meta'
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

export default function TypeSelector({ value, onChange }: TypeSelectorProps) {
  return (
    <section aria-labelledby="type-heading" className="min-w-0">
      <h2
        id="type-heading"
        className="text-xs font-semibold uppercase tracking-wider text-ink-3"
      >
        QR type
      </h2>
      <div
        role="radiogroup"
        aria-label="QR type"
        className="mt-2.5 grid grid-cols-2 gap-1.5 sm:grid-cols-3 xl:grid-cols-4"
      >
        {TYPE_ORDER.map((type) => {
          const active = value === type
          return (
            <button
              key={type}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(type)}
              className={cn(
                'flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-[13px] font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30',
                active
                  ? 'border-accent bg-accent-soft text-accent'
                  : 'border-stroke bg-surface text-ink-2 hover:border-stroke-strong hover:text-ink',
              )}
            >
              <span
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-md',
                  active ? 'text-accent' : 'text-ink-3',
                )}
              >
                <TypeIcon type={type} size={15} />
              </span>
              <span className="truncate">{TYPE_LABEL[type]}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}