import { RotateCcw, ShieldCheck } from 'lucide-react'
import type { AppSettings, DefaultDownloadFormat } from '../features/settings/types'
import type { DotStyle, ErrorCorrection } from '../types/qr'
import { Dialog, Field, Segmented, Select, Switch } from './ui'

interface SettingsDialogProps {
  open: boolean
  onClose: () => void
  settings: AppSettings
  update: (patch: Partial<AppSettings>) => void
  reset: () => void
  persisted: boolean
}

const EC_SHORT: Record<ErrorCorrection, string> = {
  L: 'L — highest capacity',
  M: 'M — balanced',
  Q: 'Q — good recovery',
  H: 'H — maximum recovery (default)',
}

export default function SettingsDialog({
  open,
  onClose,
  settings,
  update,
  reset,
  persisted,
}: SettingsDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title="Settings">
      <div className="max-h-[calc(85dvh-4rem)] space-y-5 overflow-y-auto pr-1">
        <SettingGroup title="History">
          <Switch
            id="settings-history"
            checked={settings.historyEnabled}
            onChange={(historyEnabled) => update({ historyEnabled })}
            label="Save QR history"
            description="Keep the last codes on this device so you can redownload or reuse them."
          />
        </SettingGroup>

        <SettingGroup title="Appearance">
          <Field id="settings-style" label="Default module style" hint="Used for new QR codes.">
            <Segmented<DotStyle>
              ariaLabel="Default module style"
              value={settings.defaultStyle}
              onChange={(defaultStyle) => update({ defaultStyle })}
              options={[
                { value: 'classic', label: 'Classic', title: 'Sharp square modules' },
                { value: 'rounded', label: 'Rounded', title: 'Softly rounded modules' },
                { value: 'dots', label: 'Dots', title: 'Round dot modules' },
              ]}
            />
          </Field>
          <Field id="settings-ec" label="Default error correction" hint="Used for new QR codes.">
            <Select
              id="settings-ec"
              value={settings.defaultErrorCorrection}
              onChange={(e) => update({ defaultErrorCorrection: e.target.value as ErrorCorrection })}
            >
              {(Object.keys(EC_SHORT) as ErrorCorrection[]).map((level) => (
                <option key={level} value={level}>
                  {EC_SHORT[level]}
                </option>
              ))}
            </Select>
          </Field>
        </SettingGroup>

        <SettingGroup title="Downloads">
          <Field id="settings-format" label="Default download format">
            <Segmented<DefaultDownloadFormat>
              ariaLabel="Default download format"
              value={settings.defaultDownloadFormat}
              onChange={(defaultDownloadFormat) => update({ defaultDownloadFormat })}
              options={[
                { value: 'png', label: 'PNG', title: 'Raster image, great for print' },
                { value: 'svg', label: 'SVG', title: 'Scalable vector, great for design work' },
              ]}
            />
          </Field>
        </SettingGroup>

        <SettingGroup title="Privacy" hint="Built for trust">
          <div className="rounded-[10px] border border-stroke bg-surface-2/60 p-3.5">
            <p className="flex items-center gap-2 text-[13px] font-semibold text-ink">
              <ShieldCheck size={15} className="shrink-0 text-accent" aria-hidden />
              Private by design
            </p>
            <p className="mt-1 text-xs leading-relaxed text-ink-3">
              QR Studio runs entirely in your browser. Your content, history, settings and
              uploads never leave this device and are never uploaded anywhere.
            </p>
          </div>
        </SettingGroup>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stroke pt-4">
          <p className="text-xs text-ink-3">{persisted ? 'Preferences saved on this device.' : 'Preferences can’t be saved in this browser.'}</p>
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-stroke bg-surface px-3 text-xs font-medium text-ink-2 transition-colors hover:border-stroke-strong hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 active:scale-95"
          >
            <RotateCcw size={13} aria-hidden />
            Reset defaults
          </button>
        </div>
      </div>
    </Dialog>
  )
}

function SettingGroup({
  title,
  hint,
  children,
}: {
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-3 rounded-[10px] border border-stroke bg-surface-2/40 p-4">
      <div>
        <h3 className="text-[13px] font-semibold text-ink">{title}</h3>
        {hint && <p className="text-[11px] text-ink-3">{hint}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  )
}