import { Field, Textarea } from '../ui'
import type { FormProps } from './types'

export default function TextForm({ content, update, errors }: FormProps) {
  const length = content.text.length
  return (
    <div className="space-y-3">
      <Field
        id="field-text"
        label="Message"
        error={errors.text}
        hint={length > 0 ? `${length} character${length === 1 ? '' : 's'}` : undefined}
      >
        <Textarea
          id="field-text"
          rows={6}
          value={content.text}
          invalid={!!errors.text}
          onChange={(e) => update({ text: e.target.value })}
          placeholder="Enter any text you’d like to encode…"
        />
      </Field>
    </div>
  )
}