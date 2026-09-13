import type { QRType } from '../types/qr'

export interface TypeMeta {
  label: string
  title: string
  description: string
  placeholder: string
}

export const TYPE_META: Record<QRType, TypeMeta> = {
  url: {
    label: 'Website',
    title: 'Website link',
    description: 'Paste your link — https:// is added automatically when it’s missing.',
    placeholder: 'https://example.com',
  },
  text: {
    label: 'Text',
    title: 'Plain text',
    description: 'Any text you want people to read when they scan the code.',
    placeholder: 'Hello! Scan me anywhere.',
  },
  email: {
    label: 'Email',
    title: 'Email',
    description: 'Scans pre-fill the recipient, subject and message.',
    placeholder: 'you@example.com',
  },
  phone: {
    label: 'Phone',
    title: 'Phone number',
    description: 'Opens the dialer with the number ready to call.',
    placeholder: '+1 555 123 4567',
  },
  sms: {
    label: 'SMS',
    title: 'Text message',
    description: 'Opens the messaging app with a pre-filled message.',
    placeholder: '+1 555 123 4567',
  },
  whatsapp: {
    label: 'WhatsApp',
    title: 'WhatsApp message',
    description: 'Opens a WhatsApp chat with the number.',
    placeholder: '+1 555 123 4567',
  },
  wifi: {
    label: 'Wi-Fi',
    title: 'Wi-Fi network',
    description: 'Scan, tap, and connect — no typing the password.',
    placeholder: 'Home Network',
  },
  contact: {
    label: 'Contact',
    title: 'Contact card',
    description: 'Saves a complete vCard straight to a phone.',
    placeholder: 'Ada',
  },
  location: {
    label: 'Location',
    title: 'Location',
    description: 'Opens the coordinates in Google Maps.',
    placeholder: '-33.8688',
  },
  youtube: {
    label: 'YouTube',
    title: 'YouTube link',
    description: 'Opens the video in YouTube or the app.',
    placeholder: 'https://youtube.com/watch?v=VideoID',
  },
  instagram: {
    label: 'Instagram',
    title: 'Instagram link',
    description: 'Opens a profile or post in Instagram.',
    placeholder: 'https://instagram.com/yourhandle',
  },
  facebook: {
    label: 'Facebook',
    title: 'Facebook link',
    description: 'Opens a profile or page in Facebook.',
    placeholder: 'https://facebook.com/yourpage',
  },
  x: {
    label: 'X / Twitter',
    title: 'X / Twitter link',
    description: 'Opens a profile, post or list in X.',
    placeholder: 'https://x.com/yourhandle',
  },
  linkedin: {
    label: 'LinkedIn',
    title: 'LinkedIn link',
    description: 'Opens a profile or company page in LinkedIn.',
    placeholder: 'https://linkedin.com/in/yourname',
  },
}

export const TYPE_ORDER: QRType[] = [
  'url',
  'text',
  'email',
  'phone',
  'sms',
  'whatsapp',
  'wifi',
  'contact',
  'location',
  'youtube',
  'instagram',
  'facebook',
  'x',
  'linkedin',
]

export const TYPE_LABEL: Record<QRType, string> = Object.fromEntries(
  TYPE_ORDER.map((t) => [t, TYPE_META[t].label]),
) as Record<QRType, string>