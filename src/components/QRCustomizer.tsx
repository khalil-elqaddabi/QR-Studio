import { useRef, useState } from 'react'
import { Bell, ChevronDown, Image as ImageIcon, SlidersHorizontal, Trash2, Upload } from 'lucide-react'
import type { DotStyle, ErrorCorrection, LogoShape, QRStyle } from '../types/qr'
import { DOWNLOAD_SIZES } from '../types/qr'
import { ColorField, Field, Segmented, Select, Slider, Switch } from './ui'
import { cn } from '../lib/cn'
import { PRESETS, applyPreset, type QRPreset } from '../features/presets/presets'
import {
  LOGO_ACCEPT,
  clampLogoSize,
  isLogoRisky,
  processLogoFile,
} from '../features/logo/processLogo'
import { useToast } from './Toast'

interface QRCustomizerProps {
  style: QRStyle
  update: (patch: Partial<QRStyle>) => void
}

const EC_LABELS: Record<ErrorCorrection, string> = {
  L: 'L — ~7% recovery',
  M: 'M — ~15% recovery',
  Q: 'Q — ~25% recovery',
  H: 'H — ~30% recovery',
}

export default function QRCustomizer({ style, update }: QRCustomizerProps) {
  const [open, setOpen] = useState(false)
  const iconActive = style.iconEnabled
  const logo = style.logo
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const apply = (preset: QRPreset) => {
    update(applyPreset(style, preset))
    toast(`Preset “${preset.label}” applied`)
  }

  const handleLogoFile = async (file: File | undefined) => {
    if (!file) return
    const result = await processLogoFile(file)
    if (result.ok) {
      update({ logo: result.logo, iconEnabled: false })
      toast('Logo added — error correction raised to H')
    } else {
      toast(result.error, 'error')
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <section
      aria-labelledby="customize-heading"
      className="min-w-0 rounded-2xl border border-stroke bg-surface shadow-card"
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls="customize-content"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 sm:px-6"
      >
        <span className="flex items-center gap-2.5">
          <SlidersHorizontal size={16} className="text-ink-3" aria-hidden />
          <span id="customize-heading" className="text-sm font-semibold text-ink">
            Customize
          </span>
        </span>
        <ChevronDown
          size={17}
          aria-hidden
          className={cn('text-ink-3 transition-transform duration-200', open && 'rotate-180')}
        />
      </button>

      <div
        id="customize-content"
        role="region"
        aria-label="QR customization"
        aria-hidden={!open}
        className={cn(
          'grid transition-[grid-template-rows] duration-200 ease-out',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className={cn('overflow-hidden', !open && 'invisible')}>
          <div className="space-y-5 border-t border-stroke px-5 py-5 sm:px-6">
            <div>
              <p className="text-[13px] font-medium text-ink">Presets</p>
              <p className="mt-0.5 text-xs text-ink-3">
                Safe starting combinations — scannability first.
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {PRESETS.map((preset) => {
                  const active = isPresetActive(style, preset)
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      title={preset.description}
                      onClick={() => apply(preset)}
                      aria-pressed={active}
                      className={cn(
                        'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30',
                        active
                          ? 'border-accent bg-accent-soft text-accent'
                          : 'border-stroke bg-surface-2 text-ink-2 hover:border-stroke-strong hover:text-ink',
                      )}
                    >
                      {preset.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <ColorField
                id="customize-foreground"
                label="QR color"
                value={style.foreground}
                onChange={(foreground) => update({ foreground })}
              />
              <ColorField
                id="customize-background"
                label="Background"
                value={style.background}
                onChange={(background) => update({ background })}
              />
            </div>

            <Switch
              id="customize-transparent"
              checked={style.transparent}
              onChange={(transparent) => update({ transparent })}
              label="Transparent background"
              description="Perfect when the code sits on a colored or printed surface."
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="customize-size" label="Export size" hint="Applies to PNG & SVG downloads.">
                <Select
                  id="customize-size"
                  value={style.size}
                  onChange={(e) => update({ size: Number(e.target.value) })}
                >
                  {DOWNLOAD_SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size} × {size} px
                    </option>
                  ))}
                </Select>
              </Field>
              <Field
                id="customize-ec"
                label="Error correction"
                hint={
                  iconActive || logo
                    ? 'Automatic — a center icon or logo needs maximum recovery.'
                    : 'Higher levels survive more damage.'
                }
              >
                <Select
                  id="customize-ec"
                  value={style.errorCorrection}
                  disabled={iconActive || !!logo}
                  onChange={(e) => update({ errorCorrection: e.target.value as ErrorCorrection })}
                >
                  {(Object.keys(EC_LABELS) as ErrorCorrection[]).map((level) => (
                    <option key={level} value={level}>
                      {EC_LABELS[level]}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <Slider
              id="customize-margin"
              label="Quiet zone"
              value={style.margin}
              min={0}
              max={4}
              onChange={(margin) => update({ margin })}
              format={(v) => (v === 0 ? 'None' : `${v} units`)}
            />

            <Segmented<DotStyle>
              ariaLabel="Module style"
              value={style.style}
              onChange={(value) => update({ style: value })}
              options={[
                { value: 'classic', label: 'Classic', title: 'Sharp square modules' },
                { value: 'rounded', label: 'Rounded', title: 'Softly rounded modules' },
                { value: 'dots', label: 'Dots', title: 'Round dot modules' },
              ]}
            />

            <div className="space-y-4 border-t border-stroke pt-5">
              <Switch
                id="customize-icon"
                checked={iconActive}
                onChange={(iconEnabled) => update({ iconEnabled })}
                label="Center icon"
                description="An icon that matches your QR type."
              />
              <Slider
                id="customize-icon-size"
                label="Icon size"
                value={style.iconSize}
                min={15}
                max={35}
                onChange={(iconSize) => update({ iconSize })}
                format={(v) => `${v}%`}
                disabled={!iconActive}
              />
            </div>

            <div className="space-y-4 border-t border-stroke pt-5">
              <div>
                <p className="text-[13px] font-medium text-ink">Custom logo</p>
                <p className="mt-0.5 text-xs text-ink-3">
                  PNG or JPG only, processed on your device. A logo automatically raises error
                  correction to maximum.
                </p>
              </div>
              {!logo ? (
                <label
                  className="flex min-h-20 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-stroke-strong bg-surface-2 px-4 py-4 text-center transition-colors hover:border-accent hover:bg-accent-soft/50 focus-within:ring-2 focus-within:ring-accent/30"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-ink-2">
                    <Upload size={15} aria-hidden />
                  </span>
                  <span className="text-[13px] font-medium text-ink">Upload a logo</span>
                  <span className="text-xs text-ink-3">PNG or JPG · up to 35% of the code</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={LOGO_ACCEPT}
                    aria-label="Upload logo image"
                    className="sr-only"
                    onChange={(e) => handleLogoFile(e.target.files?.[0])}
                  />
                </label>
              ) : (
                <div className="space-y-4 rounded-lg border border-stroke bg-surface-2 p-3.5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface shadow-sm">
                      {logo.dataUrl ? (
                        <img src={logo.dataUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <ImageIcon size={18} className="text-ink-3" aria-hidden />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-ink">Your logo</p>
                      <p className="text-xs text-ink-3">Center overlay</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        update({ logo: null, iconEnabled: true })
                        toast('Logo removed')
                      }}
                      className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-stroke bg-surface px-3 text-xs font-medium text-ink-2 transition-colors hover:border-danger/50 hover:text-danger"
                    >
                      <Trash2 size={14} aria-hidden />
                      Remove
                    </button>
                  </div>
                  <Slider
                    id="customize-logo-size"
                    label="Logo size"
                    value={logo.size}
                    min={10}
                    max={35}
                    onChange={(logoSize) => update({ logo: { ...logo, size: clampLogoSize(logoSize) } })}
                    format={(v) => `${v}%`}
                  />
                  <Segmented<LogoShape>
                    ariaLabel="Logo container shape"
                    value={logo.shape}
                    onChange={(shape) => update({ logo: { ...logo, shape } })}
                    options={[
                      { value: 'rounded', label: 'Rounded', title: 'Soft rounded container' },
                      { value: 'circle', label: 'Circle', title: 'Circular container' },
                    ]}
                  />
                  {isLogoRisky(logo.size) && (
                    <p className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                      <Bell size={13} aria-hidden />
                      Large logos can make scanning harder. Keep it under 30% when possible.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function isPresetActive(style: QRStyle, preset: QRPreset): boolean {
  const active = preset.style
  if (active.style !== undefined && active.style !== style.style) return false
  if (active.iconEnabled !== undefined && active.iconEnabled !== style.iconEnabled) return false
  if (active.margin !== undefined && active.margin !== style.margin) return false
  if (active.errorCorrection !== undefined) {
    const current = iconForced(style) ? 'H' : style.errorCorrection
    if (active.errorCorrection !== current) return false
  }
  return true
}

function iconForced(style: QRStyle): boolean {
  return style.iconEnabled || !!style.logo
}