import type { FieldErrors } from '../../lib/validation'
import type { QRContent } from '../../types/qr'

export interface FormProps {
  content: QRContent
  update: (patch: Partial<QRContent>) => void
  errors: FieldErrors
}