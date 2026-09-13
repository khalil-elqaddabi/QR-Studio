import { Field, Input, Textarea } from '../ui'
import type { FormProps } from './types'

export default function SmsForm({ content, update, errors }: FormProps) {
  return (
    <div className="space-y-3">
      <Field
        id="field-sms-phone"
        label="Phone number"
        error={errors.phone}
        hint="Include the country code for the best results."
      >
        <Input
          id="field-sms-phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={content.phone}
          invalid={!!errors.phone}
          onChange={(e) => update({ phone: e.target.value })}
          placeholder="+1 555 123 4567"
        />
      </Field>
      <Field id="field-sms-message" label="Message" optional>
        <Textarea
          id="field-sms-message"
          rows={3}
          value={content.smsMessage}
          onChange={(e) => update({ smsMessage: e.target.value })}
          placeholder="Hey! Message pre-filled for the recipient."
        />
      </Field>
    </div>
  )
}