import { detect, parseSms, parseVCard, parseWifiContent } from '../../lib/detection'
import { safeExternalUrl } from '../../lib/safeUrl'

export interface ScanClassified {
  label: string
  title: string
  summary?: string
  actions: ScanAction[]
}

export interface ScanAction {
  id: string
  label: string
  kind: 'url' | 'mailto' | 'tel' | 'sms' | 'copy' | 'maps'
  value?: string
}

function urlActions(payload: string, title: string, label: string): ScanClassified {
  const url = safeExternalUrl(payload)
  const actions: ScanAction[] = []
  if (url) actions.push({ id: 'open', label: 'Open link', kind: 'url', value: url })
  actions.push({ id: 'copy', label: 'Copy', kind: 'copy', value: payload })
  return { label, title, summary: payload, actions }
}

export function classifyScan(payload: string): ScanClassified {
  const trimmed = payload.trim()
  const result = detect(trimmed)

  if (result && result.type === 'wifi') {
    const wifi = parseWifiContent(trimmed)
    const security =
      wifi.security === 'nopass' ? 'Open network' : `${wifi.security ?? 'WPA2'} secured`
    return {
      label: 'Wi-Fi',
      title: wifi.ssid ? `Network “${wifi.ssid}”` : 'Wi-Fi network',
      summary: `${security}${wifi.hidden ? ' · hidden' : ''}`,
      actions: [{ id: 'copy', label: 'Copy Wi-Fi details', kind: 'copy', value: trimmed }],
    }
  }

  if (result && result.type === 'contact') {
    const vcard = parseVCard(trimmed)
    const name = [vcard.firstName, vcard.lastName].filter(Boolean).join(' ') || 'Contact card'
    return {
      label: 'Contact',
      title: name,
      summary: [vcard.organization, vcard.contactEmail].filter(Boolean).join(' · '),
      actions: [{ id: 'copy', label: 'Copy card', kind: 'copy', value: trimmed }],
    }
  }

  if (result) {
    switch (result.type) {
      case 'url':
      case 'youtube':
      case 'instagram':
      case 'facebook':
      case 'linkedin':
      case 'x':
        return urlActions(trimmed, result.label, result.label)
      case 'whatsapp':
        return urlActions(trimmed, 'WhatsApp message', 'WhatsApp')
      case 'location':
        return urlActions(trimmed, 'Location on Google Maps', 'Location')
      case 'email': {
        const actions: ScanAction[] = []
        if (trimmed.includes('@') || /^mailto:/i.test(trimmed)) {
          actions.push({ id: 'open', label: 'Open email', kind: 'mailto', value: trimmed })
        }
        actions.push({ id: 'copy', label: 'Copy', kind: 'copy', value: trimmed })
        return { label: 'Email', title: 'Email address', summary: trimmed, actions }
      }
      case 'phone': {
        const tel = `tel:${trimmed.replace(/^tel:/i, '')}`
        return {
          label: 'Phone',
          title: 'Phone number',
          summary: trimmed,
          actions: [
            { id: 'call', label: 'Call', kind: 'tel', value: tel },
            { id: 'copy', label: 'Copy', kind: 'copy', value: trimmed },
          ],
        }
      }
      case 'sms': {
        const sms = parseSms(trimmed)
        return {
          label: 'SMS',
          title: 'SMS message',
          summary: sms.phone ? `To ${sms.phone}` : trimmed,
          actions: [
            { id: 'copy', label: 'Copy message', kind: 'copy', value: trimmed } as ScanAction,
            ...(sms.phone
              ? [{ id: 'open', label: 'Compose SMS', kind: 'sms', value: sms.phone } as ScanAction]
              : []),
          ],
        }
      }
      case 'text':
        break
      default:
        return urlActions(trimmed, result.label, result.label)
    }
  }

  // Plain text or unrecognizable payload.
  const url = safeExternalUrl(trimmed)
  const actions: ScanAction[] = []
  if (url) actions.push({ id: 'open', label: 'Open link', kind: 'url', value: url })
  actions.push({ id: 'copy', label: 'Copy', kind: 'copy', value: trimmed })
  return { label: 'Text', title: 'Text content', summary: trimmed, actions }
}

export function scanTypeLabel(payload: string): string {
  return classifyScan(payload).label
}