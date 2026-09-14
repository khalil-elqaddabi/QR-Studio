import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { ScanLine, Sparkles } from 'lucide-react'
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
  historyOpen: boolean
  onToggleHistory: () => void
}

function AppWorkspace({
  settings,
  history,
  pendingPayload,
  onPendingUsed,
  historyOpen,
  onToggleHistory,
}: AppWorkspaceProps) {
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
    <div className="mx-auto w-full max-w-[1400px] flex-1 px-3.5 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-5 sm:px-6 sm:pt-8 lg:px-8 lg:pb-12">
      <div className="app-shell">
        <aside className="app-shell-sidebar" aria-label="QR type sidebar">
          <TypeSelector value={type} onChange={setType} />
          <div className="mt-4 hidden rounded-2xl border border-stroke bg-gradient-to-br from-accent-soft to-surface-2 p-4 lg:block">
            <p className="flex items-center gap-2 text-sm font-semibold text-accent">
              <Sparkles size={15} strokeWidth={2} aria-hidden />
              Kind reminder
            </p>
            <p className="mt-1.5 italic leading-relaxed text-[13px] text-ink-2">
              Every code is generated right here on your device — nothing is sent anywhere.
            </p>
          </div>
        </aside>

        <main aria-label="Create workspace" className="app-shell-main">
          <div className="app-shell-intro min-w-0">
            <span className="inline-flex items-center rounded-full border border-accent/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
              QR code generator
            </span>
            <h1 className="mt-3 text-[26px] font-bold leading-tight tracking-tight text-ink sm:text-4xl">
              Create a QR code
            </h1>
            <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-ink-2 sm:text-base">
              Pick a type, drop in your content, and download a crisp, scannable code — all on
              this device.
            </p>
          </div>

          <section
            key={type}
            aria-labelledby="form-heading"
            className="app-shell-form animate-fade-up min-w-0 rounded-2xl border border-stroke bg-surface shadow-card"
          >
            <div className="flex items-start gap-3 border-b border-stroke px-4 py-4 sm:px-5">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                <TypeIcon type={type} size={17} />
              </span>
              <div className="min-w-0">
                <h2 id="form-heading" className="text-base font-semibold tracking-tight text-ink">
                  {meta.title}
                </h2>
                <p className="mt-0.5 text-[13px] leading-relaxed text-ink-2">
                  {meta.description}
                </p>
              </div>
            </div>
            <div className="p-4 sm:p-5">
              <form onSubmit={(e) => e.preventDefault()} noValidate className="space-y-4">
                {renderForm(type, content, update, errors, detectedChip, meta.label, meta.placeholder)}
              </form>
            </div>
          </section>

          <div className="app-shell-custom min-w-0">
            <QRCustomizer style={style} update={updateStyle} />
          </div>

          <section className="app-shell-history min-w-0" id="history-section">
            <HistoryPanel
              items={history.items}
              available={history.available}
              enabled={history.enabled}
              onRegenerate={handleRegenerate}
              onRemove={history.remove}
              onClear={history.clear}
              open={historyOpen}
              onToggleOpen={onToggleHistory}
            />
          </section>

          <aside className="app-shell-preview min-w-0">
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
        </main>
      </div>
    </div>
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
    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-2 text-ink-2 ring-1 ring-stroke">
      <ScanLine size={20} aria-hidden />
    </span>
  )
}

function Footer() {
  const { toast } = useToast()
  return (
    <footer className="px-safe mt-auto border-t border-stroke py-6 pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-8">
      <p className="text-center text-xs text-ink-3">
        QR Studio — free, private and fully client-side.{' '}
        <button
          type="button"
          onClick={() => toast('Everything runs in your browser — nothing is uploaded.')}
          className="font-medium text-ink-2 underline decoration-stroke-strong underline-offset-2 transition-colors hover:text-accent focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
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
  const [historyOpen, setHistoryOpen] = useState(false)
  const [pendingPayload, setPendingPayload] = useState<string | null>(null)

  const handleScanResult = (payload: string) => {
    setPendingPayload(payload)
    setMode('create')
  }

  const openHistory = () => {
    setHistoryOpen(true)
    requestAnimationFrame(() => {
      document.getElementById('history-section')?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      })
    })
  }

  return (
    <ToastProvider>
      <div className="isolate flex min-h-screen flex-col">
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="decor-blob decor-blob-peach -top-24 right-[-6%] h-80 w-80 opacity-80" />
          <div className="decor-blob decor-blob-purple right-[22%] top-28 h-64 w-64 opacity-60" />
          <div className="decor-blob decor-blob-purple -left-24 top-[36rem] h-80 w-80 opacity-40" />
        </div>
        <Header
          theme={theme}
          onToggleTheme={toggle}
          mode={mode}
          onModeChange={setMode}
          onOpenSettings={() => setSettingsOpen(true)}
          historyOpen={historyOpen}
          onOpenHistory={openHistory}
          onCloseHistory={() => setHistoryOpen(false)}
        />
        {mode === 'scan' ? (
          <Suspense
            fallback={
              <div className="mx-auto w-full max-w-[1400px] flex-1 px-3.5 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-5 sm:px-6 sm:pt-8 lg:px-8 lg:pb-12">
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
<div className="mx-auto w-full max-w-[1400px] flex-1 px-3.5 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-5 sm:px-6 sm:pt-8 lg:px-8 lg:pb-12">
              <ScannerPanel
                onUsePayload={handleScanResult}
                onClose={() => setMode('create')}
              />
            </div>
          </Suspense>
        ) : (
          <AppWorkspace
            settings={settings}
            history={history}
            pendingPayload={pendingPayload}
            onPendingUsed={() => setPendingPayload(null)}
            historyOpen={historyOpen}
            onToggleHistory={() => setHistoryOpen((o) => !o)}
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