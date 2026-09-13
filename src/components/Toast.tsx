import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react'
import { CheckCircle2, CircleAlert, Info } from 'lucide-react'
import type { ReactNode } from 'react'

type Tone = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  message: string
  tone: Tone
}

const ToastContext = createContext<{
  toast: (message: string, tone?: Tone) => void
} | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

const TONE_ICON: Record<Tone, ReactNode> = {
  success: <CheckCircle2 size={16} className="shrink-0 text-emerald-500" aria-hidden />,
  error: <CircleAlert size={16} className="shrink-0 text-danger" aria-hidden />,
  info: <Info size={16} className="shrink-0 text-accent" aria-hidden />,
}

function ToastItem({ message, tone }: Omit<ToastItem, 'id'>) {
  return (
    <div
      role="status"
      className="animate-toast-in pointer-events-auto flex items-center gap-2.5 rounded-xl border border-stroke bg-surface/95 px-3.5 py-2.5 text-sm font-medium text-ink shadow-pop backdrop-blur-sm"
    >
      {TONE_ICON[tone]}
      <span className="max-w-[16rem] truncate sm:max-w-sm">{message}</span>
    </div>
  )
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const idRef = useRef(0)

  const toast = useCallback((message: string, tone: Tone = 'success') => {
    const id = ++idRef.current
    setToasts((prev) => [...prev.slice(-2), { id, message, tone }])
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 2600)
  }, [])

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-50 flex flex-col items-center gap-2 px-4 sm:bottom-6"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} message={t.message} tone={t.tone} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}