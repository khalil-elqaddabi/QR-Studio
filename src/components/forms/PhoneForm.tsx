import { Field, Input } from '../ui'
import type { FormProps } from './types'

export default function PhoneForm({ content, update, errors }: FormProps) {
  return (
    <Field
      id="field-phone"
      label="Phone number"
      error={errors.phone}
      hint="Include the country code for the best results."
    >
      <Input
        id="field-phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        value={content.phone}
        invalid={!!errors.phone}
        onChange={(e) => update({ phone: e.target.value })}
        placeholder="+1 555 123 4567"
      />
    </Field>
  )
}