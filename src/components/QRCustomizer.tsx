import { useState } from 'react'
import { ChevronDown, SlidersHorizontal } from 'lucide-react'
import type { DotStyle, ErrorCorrection, QRStyle } from '../types/qr'
import { DOWNLOAD_SIZES } from '../types/qr'
import { ColorField, Field, Segmented, Select, Slider, Switch } from './ui'
import { cn } from '../lib/cn'

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
          className={cn(
            'text-ink-3 transition-transform duration-200',
            open && 'rotate-180',
          )}
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
                  iconActive
                    ? 'Automatic — a center icon needs maximum recovery.'
                    : 'Higher levels survive more damage.'
                }
              >
                <Select
                  id="customize-ec"
                  value={style.errorCorrection}
                  disabled={iconActive}
                  onChange={(e) =>
                    update({ errorCorrection: e.target.value as ErrorCorrection })
                  }
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
          </div>
        </div>
      </div>
    </section>
  )
}