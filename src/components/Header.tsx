import { Moon, PenLine, ScanLine, Settings, Sun } from 'lucide-react'
import type { Theme } from '../hooks/useTheme'
import type { AppMode } from '../App'
import { cn } from '../lib/cn'

function LogoMark({ className }: { className?: string }) {
  const pattern = [
    [1, 1, 1, 1],
    [1, 0, 0, 1],
    [1, 1, 1, 0],
    [1, 0, 1, 0],
  ]
  return (
    <span
      aria-hidden="true"
      className={cn(
        'grid h-8 w-8 shrink-0 grid-cols-4 gap-[2px] rounded-lg bg-accent p-[6px] text-accent-ink shadow-sm',
        className,
      )}
    >
      {pattern.flat().map((filled, i) => (
        <span
          key={i}
          className={cn('rounded-[2px]', filled ? 'bg-current' : 'bg-transparent')}
        />
      ))}
    </span>
  )
}

interface HeaderProps {
  theme: Theme
  onToggleTheme: () => void
  mode: AppMode
  onModeChange: (mode: AppMode) => void
  onOpenSettings: () => void
}

export default function Header({
  theme,
  onToggleTheme,
  mode,
  onModeChange,
  onOpenSettings,
}: HeaderProps) {
  const isDark = theme === 'dark'
  return (
    <header className="sticky top-0 z-30 border-b border-stroke bg-page/75 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <LogoMark />
          <div className="flex flex-col leading-tight">
            <span className="text-[15px] font-semibold tracking-tight text-ink">
              QR Studio
            </span>
            <span className="hidden text-[11px] text-ink-3 sm:block">
              Beautiful QR codes, in seconds
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5">
          <div
            aria-label="App mode"
            className="flex items-center gap-1 rounded-lg border border-stroke bg-surface-2 p-1"
          >
            <button
              type="button"
              aria-pressed={mode === 'create'}
              onClick={() => onModeChange('create')}
              className={cn(
                'inline-flex h-9 items-center gap-1.5 rounded-md px-2.5 text-[13px] font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 sm:px-3',
                mode === 'create'
                  ? 'bg-surface text-ink shadow-sm'
                  : 'text-ink-2 hover:text-ink',
              )}
            >
              <PenLine size={14} aria-hidden />
              <span className="hidden sm:inline">Create</span>
            </button>
            <button
              type="button"
              aria-pressed={mode === 'scan'}
              onClick={() => onModeChange('scan')}
              className={cn(
                'inline-flex h-9 items-center gap-1.5 rounded-md px-2.5 text-[13px] font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 sm:px-3',
                mode === 'scan'
                  ? 'bg-surface text-ink shadow-sm'
                  : 'text-ink-2 hover:text-ink',
              )}
            >
              <ScanLine size={14} aria-hidden />
              <span className="hidden sm:inline">Scan</span>
            </button>
          </div>
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="Open settings"
            title="Settings"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-stroke bg-surface text-ink-2 transition-colors duration-150 hover:border-stroke-strong hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
          >
            <Settings size={17} />
          </button>
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-stroke bg-surface text-ink-2 transition-colors duration-150 hover:border-stroke-strong hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </div>
    </header>
  )
}