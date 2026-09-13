import { Sparkles } from 'lucide-react'
import { Field, Input } from '../ui'
import type { QRType } from '../../types/qr'
import type { FormProps } from './types'

interface LinkFormProps extends FormProps {
  type: QRType
  label: string
  placeholder: string
  detection?: string | null
}

export default function LinkForm({
  type,
  label,
  placeholder,
  detection,
  content,
  update,
  errors,
}: LinkFormProps) {
  return (
    <div className="space-y-3">
      <Field id={`field-${type}`} label={`${label} link`} error={errors.url}>
        <Input
          id={`field-${type}`}
          type="url"
          inputMode="url"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          value={content.url}
          invalid={!!errors.url}
          onChange={(e) => update({ url: e.target.value })}
          placeholder={placeholder}
        />
      </Field>
      <div className="flex min-h-5 items-center">
        {detection && (
          <span className="animate-chip-in inline-flex items-center gap-1.5 rounded-full border border-stroke bg-surface-2 px-2 py-0.5 text-xs font-medium text-ink-2">
            <Sparkles aria-hidden size={12} className="text-accent" />
            Detected: {detection}
          </span>
        )}
      </div>
    </div>
  )
}