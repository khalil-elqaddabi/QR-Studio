import { Field, Input, Textarea } from '../ui'
import type { FormProps } from './types'

export default function ContactForm({ content, update, errors }: FormProps) {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field id="field-contact-first" label="First name" error={errors.firstName}>
          <Input
            id="field-contact-first"
            autoComplete="given-name"
            value={content.firstName}
            invalid={!!errors.firstName}
            onChange={(e) => update({ firstName: e.target.value })}
            placeholder="Ada"
          />
        </Field>
        <Field id="field-contact-last" label="Last name" optional>
          <Input
            id="field-contact-last"
            autoComplete="family-name"
            value={content.lastName}
            onChange={(e) => update({ lastName: e.target.value })}
            placeholder="Lovelace"
          />
        </Field>
      </div>
      <Field id="field-contact-org" label="Organization" optional>
        <Input
          id="field-contact-org"
          autoComplete="organization"
          value={content.organization}
          onChange={(e) => update({ organization: e.target.value })}
          placeholder="Analytical Engine Co."
        />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field id="field-contact-phone" label="Phone" optional error={errors.contactPhone}>
          <Input
            id="field-contact-phone"
            type="tel"
            inputMode="tel"
            value={content.contactPhone}
            onChange={(e) => update({ contactPhone: e.target.value })}
            placeholder="+1 555 123 4567"
          />
        </Field>
        <Field id="field-contact-email" label="Email" optional error={errors.contactEmail}>
          <Input
            id="field-contact-email"
            type="email"
            inputMode="email"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            value={content.contactEmail}
            onChange={(e) => update({ contactEmail: e.target.value })}
            placeholder="ada@example.com"
          />
        </Field>
      </div>
      <Field id="field-contact-website" label="Website" optional error={errors.website}>
        <Input
          id="field-contact-website"
          type="url"
          inputMode="url"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          value={content.website}
          onChange={(e) => update({ website: e.target.value })}
          placeholder="https://example.com"
        />
      </Field>
      <Field id="field-contact-address" label="Address" optional>
        <Textarea
          id="field-contact-address"
          rows={2}
          value={content.address}
          onChange={(e) => update({ address: e.target.value })}
          placeholder="1 Example Street, City"
        />
      </Field>
    </div>
  )
}