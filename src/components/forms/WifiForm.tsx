import { Field, Input, Select, Switch } from '../ui'
import { WiFiSecurityLabels } from '../../types/qr'
import type { WifiSecurity } from '../../types/qr'
import type { FormProps } from './types'

export default function WifiForm({ content, update, errors }: FormProps) {
  const openNetwork = content.security === 'nopass'
  return (
    <div className="space-y-3">
      <Field id="field-wifi-ssid" label="Network name (SSID)" error={errors.ssid}>
        <Input
          id="field-wifi-ssid"
          value={content.ssid}
          invalid={!!errors.ssid}
          onChange={(e) => update({ ssid: e.target.value })}
          placeholder="Home Network"
          autoCapitalize="none"
          autoCorrect="off"
        />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field id="field-wifi-security" label="Security">
          <Select
            id="field-wifi-security"
            value={content.security}
            onChange={(e) => update({ security: e.target.value as WifiSecurity })}
          >
            {Object.entries(WiFiSecurityLabels).map(([value, labelText]) => (
              <option key={value} value={value}>
                {labelText}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          id="field-wifi-password"
          label="Password"
          optional
          hint={openNetwork ? 'Open network — no password needed.' : undefined}
        >
          <Input
            id="field-wifi-password"
            type="password"
            value={content.password}
            disabled={openNetwork}
            onChange={(e) => update({ password: e.target.value })}
            placeholder={openNetwork ? 'Not required' : '••••••••'}
            autoCapitalize="none"
            autoCorrect="off"
          />
        </Field>
      </div>
      <Switch
        id="field-wifi-hidden"
        checked={content.hidden}
        onChange={(checked) => update({ hidden: checked })}
        label="Hidden network"
        description="Mark the network as hidden if it doesn’t broadcast its name."
      />
    </div>
  )
}