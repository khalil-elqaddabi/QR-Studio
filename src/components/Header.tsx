import {
  Clock3,
  Moon,
  PenLine,
  ScanLine,
  Settings,
  Sun,
} from 'lucide-react'
import type { Theme } from '../hooks/useTheme'
import type { AppMode } from '../App'
import { cn } from '../lib/cn'

/* ------------------------- Brand mark — indigo tile ------------------------ */
/* A solid brand tile holding a white QR finder pattern: three full frames,
/* one leader cell and one softened pixel. Every code the app mints carries
/* the same disciplined, ink-and-indigo identity.                             */

export function BrandMark({ className }: { className?: string }) {
  const cells = [
    '11100',
    '10100',
    '11110',
    '00101',
    '01010',
  ]
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
      className={cn('h-8 w-8 shrink-0', className)}
    >
      {cells.flatMap((row, y) =>
        row.split('').map((bit, x) => {
          if (bit !== '1') return null
          const accent = y === 2 && x === 3
          return (
            <rect
              key={`${x}-${y}`}
              x={0.75 + x * 6.5}
              y={0.75 + y * 6.5}
              width={5}
              height={5}
              rx={1.2}
              className={accent ? 'fill-accent-ink/70' : 'fill-accent-ink'}
            />
          )
        }),
      )}
    </svg>
  )
}

interface HeaderProps {
  theme: Theme
  onToggleTheme: () => void
  mode: AppMode
  onModeChange: (mode: AppMode) => void
  onOpenSettings: () => void
  historyOpen?: boolean
  onOpenHistory?: () => void
  onCloseHistory?: () => void
}

export default function Header({
  theme,
  onToggleTheme,
  mode,
  onModeChange,
  onOpenSettings,
  historyOpen = false,
  onOpenHistory = () => {},
  onCloseHistory = () => {},
}: HeaderProps) {
  const isDark = theme === 'dark'

  const railItem = (
    active: boolean,
    label: string,
    icon: React.ReactNode,
    onClick: () => void,
  ) => (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[10px] px-3 text-[13px] font-semibold transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 active:scale-[0.97]',
        active
          ? 'bg-accent text-accent-ink shadow-[0_1px_2px_rgb(15_21_45_/_0.22)]'
          : 'text-ink-2 hover:bg-surface-2 hover:text-ink',
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  )

  const historyActive = historyOpen && mode !== 'scan'

  const handlePickCreate = () => {
    onCloseHistory()
    onModeChange('create')
  }

  const handlePickScan = () => {
    onCloseHistory()
    onModeChange('scan')
  }

  const handlePickHistory = () => {
    if (historyOpen) {
      onCloseHistory()
    } else {
      onModeChange('create')
      onOpenHistory()
    }
  }

  const nav = (
    <div role="group" aria-label="App mode">
      {railItem(
        mode === 'create' && !historyOpen,
        'Create',
        <PenLine size={14} aria-hidden />,
        handlePickCreate,
      )}
      {railItem(
        mode === 'scan',
        'Scan',
        <ScanLine size={14} aria-hidden />,
        handlePickScan,
      )}
      {railItem(
        historyActive,
        'History',
        <Clock3 size={14} aria-hidden />,
        handlePickHistory,
      )}
    </div>
  )

  return (
    <header className="sticky top-0 z-30 border-b border-stroke bg-page/85 backdrop-blur-md supports-[backdrop-filter]:bg-page/80">
      <div className="relative mx-auto grid h-14 max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-3 sm:h-16 sm:px-6 lg:px-8 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-accent text-accent-ink shadow-[0_1px_2px_rgb(15_21_45_/_0.18)]">
            <BrandMark className="h-6 w-6" />
          </span>
          <div className="hidden min-w-0 items-baseline gap-2 sm:flex">
            <span className="truncate text-[15px] font-semibold tracking-tight text-ink">
              QR Studio
            </span>
            <span className="hidden text-[11px] text-ink-3 lg:inline">
              Free · private · offline-ready
            </span>
          </div>
        </div>

        <div className="hidden justify-self-center md:block">
          <div className="flex items-center gap-0.5 rounded-[12px] border border-stroke bg-surface p-1 shadow-[0_8px_28px_-16px_rgb(15_21_45_/_0.2)]">
            {nav}
          </div>
        </div>

        <div className="flex items-center gap-2 justify-self-end">
          <IconButton label="Open settings" onClick={onOpenSettings}>
            <Settings size={17} />
          </IconButton>
          <IconButton
            label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            onClick={onToggleTheme}
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </IconButton>
        </div>
      </div>

      <div className="border-t border-stroke/80 md:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-1.5 px-3 py-2">
          {nav}
        </div>
      </div>
    </header>
  )
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-stroke bg-surface text-ink-2 transition-colors hover:border-stroke-strong hover:bg-surface-2 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 active:scale-95 sm:h-10 sm:w-10"
    >
      {children}
    </button>
  )
}