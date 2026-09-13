import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { ScanLine } from 'lucide-react'
import Header from './components/Header'
import TypeSelector, { TypeIcon } from './components/TypeSelector'
import PreviewPanel from './components/PreviewPanel'
import QRCustomizer from './components/QRCustomizer'
import HistoryPanel from './components/HistoryPanel'
import SettingsDialog from './components/SettingsDialog'
import { ToastProvider, useToast } from './components/Toast'
import LinkForm from './components/forms/LinkForm'
import TextForm from './components/forms/TextForm'
import EmailForm from './components/forms/EmailForm'
import PhoneForm from './components/forms/PhoneForm'
import SmsForm from './components/forms/SmsForm'
import WhatsAppForm from './components/forms/WhatsAppForm'
import WifiForm from './components/forms/WifiForm'
import ContactForm from './components/forms/ContactForm'
import LocationForm from './components/forms/LocationForm'
import { DEFAULT_STYLE, EMPTY_CONTENT } from './types/qr'
import type { QRContent, QRStyle, QRType } from './types/qr'
import { buildPayload } from './lib/qr'
import { validateType } from './lib/validation'
import { detect, parseMailtoContent, parseTelContent, parseWifiContent } from './lib/detection'
import { TYPE_LABEL, TYPE_META } from './lib/meta'
import { titleFor, pickContentFields } from './lib/title'
import { useTheme } from './hooks/useTheme'
import { useSettings } from './features/settings/useSettings'
import type { AppSettings } from './features/settings/types'
import { useHistory } from './features/history/useHistory'
import type { HistoryItem } from './features/history/HistoryStore'
import { makeLogoThumb } from './features/logo/processLogo'

export type AppMode = 'create' | 'scan'

const ScannerPanel = lazy(() => import('./components/ScannerPanel'))

const LINK_TYPES: ReadonlySet<QRType> = new Set<QRType>([
  'url',
  'youtube',
  'instagram',
  'facebook',
  'x',
  'linkedin',
  'whatsapp',
])

interface AppWorkspaceProps {
  settings: AppSettings
  history: ReturnType<typeof useHistory>
  pendingPayload: string | null
  onPendingUsed: () => void
}

function AppWorkspace({ settings, history, pendingPayload, onPendingUsed }: AppWorkspaceProps) {
  const [type, setType] = useState<QRType>('url')
  const [content, setContent] = useState<QRContent>(EMPTY_CONTENT)
  const [style, setStyle] = useState<QRStyle>(() => ({
    ...DEFAULT_STYLE,
    style: settings.defaultStyle,
    errorCorrection: settings.defaultErrorCorrection,
  }))
  const [detectedChip, setDetectedChip] = useState<string | null>(null)
  const chipTimer = useRef<number | null>(null)
  const saveTimer = useRef<number | null>(null)

  const typeRef = useRef(type)
  typeRef.current = type

  const payload = useMemo(() => buildPayload(type, content), [type, content])
  const errors = useMemo(() => validateType(type, content), [type, content])
  const hasErrors = Object.keys(errors).length > 0

  // Load a scanned payload into the create workspace.
  useEffect(() => {
    if (!pendingPayload) return
    const result = detect(pendingPayload)
    if (result) {
      setType(result.type)
      const base: QRContent = { ...EMPTY_CONTENT, ...result.content }
      if (result.type === 'text' && !base.text.trim()) base.text = pendingPayload
      setContent(base)
      showChip(result.label)
    } else {
      setType('text')
      setContent({ ...EMPTY_CONTENT, text: pendingPayload })
      clearChip()
    }
    onPendingUsed()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingPayload])

  const clearChip = () => {
    if (chipTimer.current !== null) {
      window.clearTimeout(chipTimer.current)
      chipTimer.current = null
    }
    setDetectedChip(null)
  }

  const showChip = (label: string) => {
    if (chipTimer.current !== null) window.clearTimeout(chipTimer.current)
    setDetectedChip(label)
    chipTimer.current = window.setTimeout(() => {
      setDetectedChip(null)
      chipTimer.current = null
    }, 4500)
  }

  const handleUrlField = (raw: string) => {
    if (!raw.trim()) {
      clearChip()
      return
    }
    const result = detect(raw)
    if (!result) return
    const linkField = LINK_TYPES.has(typeRef.current)
    if (linkField && result.type !== typeRef.current) {
      setType(result.type)
    }
    setContent((prev) => ({ ...prev, ...result.content }))
    showChip(result.label)
  }

  const update = (patch: Partial<QRContent>) => {
    setContent((prev) => ({ ...prev, ...patch }))
    if (typeof patch.url === 'string') {
      handleUrlField(patch.url)
    }
    if (typeof patch.email === 'string' && /^mailto:/i.test(patch.email.trim())) {
      const mailto = patch.email
      setContent((prev) => ({ ...prev, ...parseMailtoContent(mailto) }))
    }
    if (typeof patch.phone === 'string' && /^tel:/i.test(patch.phone.trim())) {
      const tel = patch.phone
      setContent((prev) => ({ ...prev, phone: parseTelContent(tel) }))
    }
    if (typeof patch.ssid === 'string' && /^wifi:/i.test(patch.ssid.trim())) {
      const wifi = patch.ssid
      setContent((prev) => ({ ...prev, ...parseWifiContent(wifi) }))
    }
  }

  const updateStyle = (patch: Partial<QRStyle>) => {
    setStyle((prev) => {
      let next: QRStyle = { ...prev, ...patch }
      if (patch.iconEnabled) next = { ...next, logo: null }
      if (patch.logo) next = { ...next, iconEnabled: false }
      if ('logo' in patch && patch.logo === null && prev.logo) next = { ...next, iconEnabled: true }
      return next
    })
  }

  const handleReset = () => {
    clearChip()
    setContent({ ...EMPTY_CONTENT })
    setType('url')
  }

  // Auto-save debounced history entry whenever a valid code is shown.
  useEffect(() => {
    if (!settings.historyEnabled || !history.available || !payload || hasErrors) return
    if (saveTimer.current !== null) window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(async () => {
      saveTimer.current = null
      const logo = style.logo ? await makeLogoThumb(style.logo) : null
      history.add({
        title: titleFor(type, content),
        type,
        payload,
        fields: pickContentFields(type, content),
        style: { ...style, logo },
      })
    }, 1400)
    return () => {
      if (saveTimer.current !== null) {
        window.clearTimeout(saveTimer.current)
        saveTimer.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload, hasErrors, type, content, style, settings.historyEnabled, history])

  const handleRegenerate = (item: HistoryItem) => {
    const target = (item.type as QRType) in TYPE_LABEL ? (item.type as QRType) : 'text'
    setType(target)
    setContent({ ...EMPTY_CONTENT, ...item.fields } as QRContent)
    setStyle(item.style)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const meta = TYPE_META[type]

  return (
    <>
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-8 sm:px-6 sm:pt-10 lg:px-8">
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-[28px]">
          Create beautiful QR codes in seconds
        </h1>
        <p className="mt-1.5 max-w-xl text-sm text-ink-2">
          Paste a link, type a message, or configure Wi-Fi — then download a crisp, scannable
          QR code. Everything runs privately in your browser.
        </p>

        <div className="mt-8 flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start lg:gap-8">
          <div className="flex min-w-0 flex-col gap-6">
            <TypeSelector value={type} onChange={setType} />

            <section
              key={type}
              aria-labelledby="form-heading"
              className="animate-fade-up min-w-0 rounded-2xl border border-stroke bg-surface shadow-card"
            >
              <div className="border-b border-stroke px-5 py-4 sm:px-6">
                <h2 id="form-heading" className="flex items-center gap-2 text-base font-semibold text-ink">
                  <span className="text-accent">
                    <TypeIcon type={type} size={19} />
                  </span>
                  {meta.title}
                </h2>
                <p className="mt-1 text-[13px] text-ink-2">{meta.description}</p>
              </div>
              <div className="p-5 sm:p-6">
                <form onSubmit={(e) => e.preventDefault()} noValidate className="space-y-3">
                  {renderForm(type, content, update, errors, detectedChip, meta.label, meta.placeholder)}
                </form>
              </div>
            </section>
          </div>

          <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start lg:row-span-2">
            <PreviewPanel
              type={type}
              content={content}
              style={style}
              payload={payload}
              hasErrors={hasErrors}
              defaultFormat={settings.defaultDownloadFormat}
              onReset={handleReset}
            />
          </aside>

          <div className="min-w-0 space-y-6">
            <QRCustomizer style={style} update={updateStyle} />
            <HistoryPanel
              items={history.items}
              available={history.available}
              enabled={history.enabled}
              onRegenerate={handleRegenerate}
              onRemove={history.remove}
              onClear={history.clear}
            />
          </div>
        </div>
      </div>
    </>
  )
}

function renderForm(
  type: QRType,
  content: QRContent,
  update: (patch: Partial<QRContent>) => void,
  errors: ReturnType<typeof validateType>,
  detection: string | null,
  label: string,
  placeholder: string,
) {
  const props = { content, update, errors }
  switch (type) {
    case 'url':
    case 'youtube':
    case 'instagram':
    case 'facebook':
    case 'x':
    case 'linkedin':
      return (
        <LinkForm
          {...props}
          type={type}
          label={label}
          placeholder={placeholder}
          detection={detection}
        />
      )
    case 'text':
      return <TextForm {...props} />
    case 'email':
      return <EmailForm {...props} />
    case 'phone':
      return <PhoneForm {...props} />
    case 'sms':
      return <SmsForm {...props} />
    case 'whatsapp':
      return <WhatsAppForm {...props} />
    case 'wifi':
      return <WifiForm {...props} />
    case 'contact':
      return <ContactForm {...props} />
    case 'location':
      return <LocationForm {...props} />
  }
}

function ScanLoadingIcon() {
  return (
    <span className="flex h-12 w-12 animate-pulse items-center justify-center rounded-2xl bg-surface-2 text-accent">
      <ScanLine size={22} aria-hidden />
    </span>
  )
}

function Footer() {
  const { toast } = useToast()
  return (
    <footer className="border-t border-stroke py-8">
      <p className="text-center text-xs text-ink-3">
        QR Studio — free, private and fully client-side.{' '}
        <button
          type="button"
          onClick={() => toast('Everything runs in your browser — nothing is uploaded.')}
          className="text-ink-2 underline decoration-stroke-strong underline-offset-2 hover:text-ink"
        >
          How it works
        </button>
      </p>
    </footer>
  )
}

export default function App() {
  const { theme, toggle } = useTheme()
  const { settings, update: updateSettings, reset: resetSettings, persisted } = useSettings()
  const history = useHistory(settings.historyEnabled)
  const [mode, setMode] = useState<AppMode>('create')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [pendingPayload, setPendingPayload] = useState<string | null>(null)

  const handleScanResult = (payload: string) => {
    setPendingPayload(payload)
    setMode('create')
  }

  return (
    <ToastProvider>
      <div className="flex min-h-screen flex-col">
        <Header
          theme={theme}
          onToggleTheme={toggle}
          mode={mode}
          onModeChange={setMode}
          onOpenSettings={() => setSettingsOpen(true)}
        />
        {mode === 'scan' ? (
          <Suspense
            fallback={
              <div className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-10 sm:px-6 lg:px-8">
                <div
                  role="status"
                  className="flex min-h-80 flex-col items-center justify-center gap-3 rounded-2xl border border-stroke bg-surface shadow-card"
                >
                  <ScanLoadingIcon />
                  <p className="text-sm text-ink-2">Loading scanner…</p>
                </div>
              </div>
            }
          >
            <ScannerPanel
              onUsePayload={handleScanResult}
              onClose={() => setMode('create')}
            />
          </Suspense>
        ) : (
          <AppWorkspace
            settings={settings}
            history={history}
            pendingPayload={pendingPayload}
            onPendingUsed={() => setPendingPayload(null)}
          />
        )}
        <Footer />
        <SettingsDialog
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          settings={settings}
          update={updateSettings}
          reset={resetSettings}
          persisted={persisted}
        />
      </div>
    </ToastProvider>
  )
}