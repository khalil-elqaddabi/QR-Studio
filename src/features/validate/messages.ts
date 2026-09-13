export type ValidationStatus = 'idle' | 'checking' | 'verified' | 'needs-adjustment'

/**
 * Status text shown next to the preview. Plain language, never blocks work.
 */
export function validationMessage(status: ValidationStatus): {
  label: string
  tone: 'good' | 'warn' | 'muted'
} {
  switch (status) {
    case 'verified':
      return { label: 'Verified — QR code is readable', tone: 'good' }
    case 'needs-adjustment':
      return {
        label: 'Needs adjustment — try a larger quiet zone or smaller icon/logo',
        tone: 'warn',
      }
    case 'checking':
      return { label: 'Checking readability…', tone: 'muted' }
    case 'idle':
      return { label: '', tone: 'muted' }
  }
}