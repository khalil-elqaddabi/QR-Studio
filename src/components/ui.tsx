import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'
import { useEffect } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { cn } from '../lib/cn'

/* ---------------------------------- Field --------------------------------- */

interface FieldProps {
  id: string
  label: string
  htmlFor?: string
  hint?: string
  error?: string
  optional?: boolean
  children: ReactNode
  className?: string
}

export function Field({
  id,
  label,
  htmlFor,
  hint,
  error,
  optional,
  children,
  className,
}: FieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-baseline justify-between gap-2">
        <label
          htmlFor={htmlFor ?? id}
          className="text-[13px] font-medium text-ink"
        >
          {label}
        </label>
        {optional && (
          <span className="shrink-0 text-[11px] text-ink-3">Optional</span>
        )}
      </div>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-xs font-medium text-danger">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs leading-relaxed text-ink-3">{hint}</p>
      ) : null}
    </div>
  )
}

/* --------------------------------- Inputs --------------------------------- */

const controlBase =
  'w-full rounded-xl border border-stroke bg-surface px-3 py-2 text-[15px] text-ink placeholder:text-ink-3 transition-all duration-150 hover:border-stroke-strong focus:border-accent focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent/20 focus:shadow-card aria-invalid:border-danger aria-invalid:focus:border-danger aria-invalid:focus:ring-danger/20 disabled:cursor-not-allowed disabled:opacity-55 sm:text-sm'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean
}

export function Input({ invalid, className, ...props }: InputProps) {
  return (
    <input
      {...props}
      aria-invalid={invalid || undefined}
      className={cn(controlBase, className)}
    />
  )
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean
}

export function Textarea({ invalid, className, ...props }: TextareaProps) {
  return (
    <textarea
      {...props}
      aria-invalid={invalid || undefined}
      className={cn(controlBase, 'resize-none', className)}
    />
  )
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean
}

export function Select({ invalid, className, children, ...props }: SelectProps) {
  return (
    <div className="relative">
      <select
        {...props}
        aria-invalid={invalid || undefined}
        className={cn(
          controlBase,
          'cursor-pointer appearance-none pr-9 disabled:cursor-not-allowed disabled:opacity-55',
          className,
        )}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden
        size={16}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-3"
      />
    </div>
  )
}

/* --------------------------------- Switch --------------------------------- */

interface SwitchProps {
  id: string
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  description?: string
}

export function Switch({ id, checked, onChange, label, description }: SwitchProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-0.5 pt-0.5">
        <p className="text-[13px] font-medium leading-snug text-ink">{label}</p>
        {description && <p className="text-xs leading-relaxed text-ink-3">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        id={id}
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-accent',
          checked ? 'bg-accent' : 'bg-stroke-strong',
        )}
      >
        <span
          className={cn(
            'absolute left-[3px] top-[3px] h-[18px] w-[18px] rounded-full bg-white transition-transform duration-200',
            checked && 'translate-x-5',
          )}
        />
      </button>
    </div>
  )
}

/* ------------------------------- ColorField ------------------------------- */

interface ColorFieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  hint?: string
}

export function ColorField({ id, label, value, onChange, hint }: ColorFieldProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-[13px] font-medium text-ink">
          {label}
        </label>
        <span className="rounded border border-stroke bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] leading-4 text-ink-2">
          {value.toUpperCase()}
        </span>
      </div>
      <div className="flex items-center gap-2.5">
        <input
          id={id}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={`${label} color picker`}
          className="qr-color-input h-10 w-11 shrink-0 cursor-pointer rounded-xl border border-stroke"
          style={{ backgroundColor: value, color: '#00000000' }}
        />
        <div
          aria-hidden="true"
          className="h-10 flex-1 rounded-xl border border-stroke"
          style={{ backgroundColor: value }}
        />
      </div>
      {hint && <p className="text-xs leading-relaxed text-ink-3">{hint}</p>}
    </div>
  )
}

/* --------------------------------- Slider --------------------------------- */

interface SliderProps {
  id: string
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
  format?: (value: number) => string
  disabled?: boolean
}

export function Slider({
  id,
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format,
  disabled,
}: SliderProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-[13px] font-medium text-ink">
          {label}
        </label>
        <span className="text-xs tabular-nums text-ink-3">
          {format ? format(value) : value}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="qr-range w-full cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
      />
    </div>
  )
}

/* -------------------------------- Segmented ------------------------------- */

interface SegmentedProps<T extends string> {
  value: T
  onChange: (value: T) => void
  options: Array<{ value: T; label: ReactNode; title?: string }>
  ariaLabel: string
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
}: SegmentedProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="grid auto-cols-fr grid-flow-col gap-1 rounded-xl border border-stroke bg-surface-2 p-1"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          title={option.title}
          onClick={() => onChange(option.value)}
          className={cn(
            'min-h-8 rounded-lg px-2 py-1.5 text-[13px] font-medium transition-all focus:outline-none focus-visible:ring-1 focus-visible:ring-accent sm:px-3',
            value === option.value
              ? 'bg-surface text-ink shadow-card'
              : 'text-ink-2 hover:text-ink hover:bg-surface-2/70',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

/* --------------------------------- Dialog --------------------------------- */

interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export function Dialog({ open, onClose, title, children }: DialogProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6"
    >
      <div className="absolute inset-0 bg-overlay" onClick={onClose} aria-hidden="true" />
      <div className="animate-fade-up relative max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-stroke bg-surface p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-pop sm:max-h-[85vh] sm:rounded-2xl sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-[15px] font-semibold tracking-tight text-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
          >
            <X size={17} aria-hidden />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}