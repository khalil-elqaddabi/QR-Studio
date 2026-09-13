import { ExternalLink } from 'lucide-react'
import { Field, Input } from '../ui'
import type { FormProps } from './types'

export default function LocationForm({ content, update, errors }: FormProps) {
  const lat = content.latitude.trim()
  const lng = content.longitude.trim()
  const hasCoords =
    lat && lng && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng))
  const mapHref = hasCoords
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`
    : null

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          id="field-latitude"
          label="Latitude"
          error={errors.latitude}
          hint="Between -90 and 90"
        >
          <Input
            id="field-latitude"
            inputMode="decimal"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={content.latitude}
            invalid={!!errors.latitude}
            onChange={(e) => update({ latitude: e.target.value })}
            placeholder="51.5074"
          />
        </Field>
        <Field
          id="field-longitude"
          label="Longitude"
          error={errors.longitude}
          hint="Between -180 and 180"
        >
          <Input
            id="field-longitude"
            inputMode="decimal"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={content.longitude}
            invalid={!!errors.longitude}
            onChange={(e) => update({ longitude: e.target.value })}
            placeholder="-0.1278"
          />
        </Field>
      </div>
      {mapHref && (
        <a
          href={mapHref}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
        >
          Check the location on Google Maps
          <ExternalLink aria-hidden size={14} />
        </a>
      )}
    </div>
  )
}