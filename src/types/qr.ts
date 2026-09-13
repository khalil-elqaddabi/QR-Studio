export type QRType =
  | 'url'
  | 'text'
  | 'email'
  | 'phone'
  | 'sms'
  | 'whatsapp'
  | 'wifi'
  | 'contact'
  | 'location'
  | 'youtube'
  | 'instagram'
  | 'facebook'
  | 'x'
  | 'linkedin'

export type ErrorCorrection = 'L' | 'M' | 'Q' | 'H'

export type WifiSecurity = 'WPA' | 'WPA2' | 'WEP' | 'nopass'

export type DotStyle = 'classic' | 'rounded' | 'dots'

export const WiFiSecurityLabels: Record<WifiSecurity, string> = {
  WPA: 'WPA / WPA2',
  WPA2: 'WPA2',
  WEP: 'WEP',
  nopass: 'None',
}

export interface QRContent {
  url: string
  text: string
  email: string
  subject: string
  body: string
  phone: string
  smsMessage: string
  whatsappNumber: string
  whatsappMessage: string
  ssid: string
  password: string
  security: WifiSecurity
  hidden: boolean
  firstName: string
  lastName: string
  organization: string
  contactPhone: string
  contactEmail: string
  website: string
  address: string
  latitude: string
  longitude: string
}

export interface QRStyle {
  foreground: string
  background: string
  transparent: boolean
  size: number
  errorCorrection: ErrorCorrection
  margin: number
  iconEnabled: boolean
  iconSize: number
  style: DotStyle
}

export const EMPTY_CONTENT: QRContent = {
  url: '',
  text: '',
  email: '',
  subject: '',
  body: '',
  phone: '',
  smsMessage: '',
  whatsappNumber: '',
  whatsappMessage: '',
  ssid: '',
  password: '',
  security: 'WPA',
  hidden: false,
  firstName: '',
  lastName: '',
  organization: '',
  contactPhone: '',
  contactEmail: '',
  website: '',
  address: '',
  latitude: '',
  longitude: '',
}

export const DOWNLOAD_SIZES = [512, 1024, 2048] as const

export const DEFAULT_STYLE: QRStyle = {
  foreground: '#1c1917',
  background: '#ffffff',
  transparent: false,
  size: 1024,
  errorCorrection: 'H',
  margin: 2,
  iconEnabled: true,
  iconSize: 23,
  style: 'rounded',
}