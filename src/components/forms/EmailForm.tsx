import { Field, Input, Textarea } from '../ui'
import type { FormProps } from './types'

export default function EmailForm({ content, update, errors }: FormProps) {
  return (
    <div className="space-y-3">
      <Field id="field-email" label="Email address" error={errors.email}>
        <Input
          id="field-email"
          type="email"
          inputMode="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={content.email}
          invalid={!!errors.email}
          onChange={(e) => update({ email: e.target.value })}
          placeholder="you@example.com"
        />
      </Field>
      <Field id="field-subject" label="Subject" optional>
        <Input
          id="field-subject"
          value={content.subject}
          onChange={(e) => update({ subject: e.target.value })}
          placeholder="What’s this about?"
        />
      </Field>
      <Field id="field-email-body" label="Message" optional>
        <Textarea
          id="field-email-body"
          rows={3}
          value={content.body}
          onChange={(e) => update({ body: e.target.value })}
          placeholder="Your message…"
        />
      </Field>
    </div>
  )
}