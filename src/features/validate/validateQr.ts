import { effectiveErrorCorrection, renderQRToCanvas } from '../../lib/qr'
import type { QRType, QRStyle } from '../../types/qr'
import { decodeCanvas } from '../scan/decode'
import type { ValidationStatus } from './messages'

export interface ValidationInput {
  payload: string
  style: QRStyle
  type: QRType
}

/**
 * Renders the final configuration and decodes it locally with ZXing.
 * Validation is informational and never blocks downloads.
 */
export async function validateQr(input: ValidationInput): Promise<ValidationStatus> {
  if (!input.payload) return 'idle'
  try {
    const canvas = await renderQRToCanvas({
      payload: input.payload,
      foreground: input.style.foreground,
      background: '#ffffff',
      transparent: false,
      errorCorrection: effectiveErrorCorrection(
        input.style.errorCorrection,
        input.style.iconEnabled,
        input.style.logo,
      ),
      margin: input.style.margin,
      style: input.style.style,
      iconType: input.style.logo ? null : input.style.iconEnabled ? (input.type as QRType) : null,
      iconRatio: input.style.iconSize / 100,
      logo: input.style.logo ?? null,
      size: 560,
    })
    const text = decodeCanvas(canvas)
    return text === input.payload ? 'verified' : 'needs-adjustment'
  } catch {
    return 'idle'
  }
}