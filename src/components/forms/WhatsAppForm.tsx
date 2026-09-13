import { Field, Input, Textarea } from '../ui'
import type { FormProps } from './types'

export default function WhatsAppForm({ content, update, errors }: FormProps) {
  return (
    <div className="space-y-3">
      <Field
        id="field-whatsapp-number"
        label="Phone number"
        error={errors.whatsappNumber}
        hint="Include the country code — spaces and symbols are removed automatically."
      >
        <Input
          id="field-whatsapp-number"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={content.whatsappNumber}
          invalid={!!errors.whatsappNumber}
          onChange={(e) => update({ whatsappNumber: e.target.value })}
          placeholder="+1 555 123 4567"
        />
      </Field>
      <Field id="field-whatsapp-message" label="Message" optional>
        <Textarea
          id="field-whatsapp-message"
          rows={3}
          value={content.whatsappMessage}
          onChange={(e) => update({ whatsappMessage: e.target.value })}
          placeholder="Optional pre-filled message…"
        />
      </Field>
    </div>
  )
}