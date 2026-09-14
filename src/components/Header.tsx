import { Clock3, Moon, PenLine, ScanLine, Sun } from 'lucide-react'
import type { Theme } from '../hooks/useTheme'
import type { AppMode } from '../App'
import { cn } from '../lib/cn'

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

const NAV_ITEMS: { mode: AppMode; key: 'create' | 'scan' | 'history'; label: string; icon: React.ReactNode }[] = [
  { mode: 'create', key: 'create', label: 'Create', icon: <PenLine size={15} aria-hidden /> },
  { mode: 'scan', key: 'scan', label: 'Scan', icon: <ScanLine size={15} aria-hidden /> },
  { mode: 'create', key: 'history', label: 'History', icon: <Clock3 size={15} aria-hidden /> },
]

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
  const historyActive = historyOpen && mode !== 'scan'

  const handlePickCreate = () => { onCloseHistory(); onModeChange('create') }
  const handlePickScan = () => { onCloseHistory(); onModeChange('scan') }
  const handlePickHistory = () => {
    if (historyOpen) { onCloseHistory() } else { onModeChange('create'); onOpenHistory() }
  }

  const isActive = (key: 'create' | 'scan' | 'history') => {
    if (key === 'history') return historyActive
    if (key === 'scan') return mode === 'scan'
    return mode === 'create' && !historyOpen
  }

  const getAction = (key: 'create' | 'scan' | 'history') => {
    if (key === 'history') return handlePickHistory
    if (key === 'scan') return handlePickScan
    return handlePickCreate
  }

  const desktopNav = (
    <nav aria-label="App mode" className="hidden items-center gap-1 self-stretch lg:flex">
      {NAV_ITEMS.map((item) => {
        const active = isActive(item.key)
        return (
          <button
            key={item.key}
            type="button"
            aria-pressed={active}
            onClick={getAction(item.key)}
            className={cn(
              'relative inline-flex items-center gap-2 self-stretch px-4 text-[13.5px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-page',
              active
                ? 'font-semibold text-accent'
                : 'text-ink-2 hover:text-ink',
            )}
          >
            {item.icon}
            {item.label}
            {active && (
              <span
                aria-hidden="true"
                className="absolute inset-x-2 -bottom-px h-[2px] rounded-full bg-accent"
              />
            )}
          </button>
        )
      })}
    </nav>
  )

  const mobileNav = (
    <nav aria-label="App mode" className="grid grid-cols-3 gap-1">
      {NAV_ITEMS.map((item) => {
        const active = isActive(item.key)
        return (
          <button
            key={item.key}
            type="button"
            aria-pressed={active}
            onClick={getAction(item.key)}
            className={cn(
              'relative flex h-[3.75rem] flex-col items-center justify-center gap-1 rounded-2xl text-[10.5px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
              active ? 'bg-accent-soft/80 text-accent' : 'text-ink-3 hover:text-ink-2',
            )}
          >
            {item.icon}
            {item.label}
          </button>
        )
      })}
    </nav>
  )

  return (
    <>
      <header className="pt-safe sticky top-0 z-30 border-b border-stroke bg-surface/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-4 px-4 sm:h-[4.5rem] sm:px-6 lg:px-8">
          {/* Left — logo + app name */}
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink text-page">
              <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false" className="h-5 w-5">
                {[
                  '11100', '10100', '11110', '00101', '01110',
                ].flatMap((row, y) =>
                  row.split('').map((bit, x) => {
                    if (bit !== '1') return null
                    return (
                      <rect
                        key={`${x}-${y}`}
                        x={0.75 + x * 6.5}
                        y={0.75 + y * 6.5}
                        width={5}
                        height={5}
                        rx={1.2}
                        fill="currentColor"
                      />
                    )
                  }),
                )}
              </svg>
            </span>
            <span className="hidden text-lg font-bold tracking-tight text-ink sm:block">
              QR Studio
            </span>
          </div>

          {/* Center — tabs */}
          {desktopNav}

          {/* Right — theme toggle + avatar */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-page"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              type="button"
              onClick={onOpenSettings}
              aria-label="Open settings"
              title="Settings"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-avatar text-[13px] font-bold text-white transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-page"
            >
              QS
            </button>
          </div>
        </div>
      </header>

      <div className="fixed inset-x-3 bottom-3 z-40 lg:hidden">
        <div className="rounded-2xl border border-stroke bg-surface/95 px-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] pt-1.5 shadow-pop backdrop-blur-md">
          {mobileNav}
        </div>
      </div>
    </>
  )
}
