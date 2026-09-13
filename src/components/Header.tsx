import { Moon, PenLine, ScanLine, Settings, Sun } from 'lucide-react'
import type { Theme } from '../hooks/useTheme'
import type { AppMode } from '../App'
import { cn } from '../lib/cn'

/* ---------- Brand mark — a compact QR motif with one signature accent ------- */

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
              className={accent ? 'fill-accent' : 'fill-ink'}
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
    <header className="pt-safe sticky top-0 z-30 border-b border-stroke bg-page/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-3 sm:h-16 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] border border-stroke bg-surface shadow-card">
            <BrandMark className="h-6 w-6" />
          </span>
          <div className="hidden min-w-0 items-baseline gap-2 sm:flex">
            <span className="truncate text-[15px] font-semibold tracking-tight text-ink">
              QR Studio
            </span>
            <span className="hidden text-[11px] text-ink-3 md:inline">
              Free · private · offline-ready
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <div
            aria-label="App mode"
            className="flex shrink-0 items-center gap-1 rounded-[10px] border border-stroke bg-surface-2 p-1"
          >
            <button
              type="button"
              aria-pressed={mode === 'create'}
              onClick={() => onModeChange('create')}
              className={cn(
                'inline-flex h-9 items-center gap-1 rounded-lg px-2 text-[13px] font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 sm:gap-1.5 sm:px-3',
                mode === 'create'
                  ? 'bg-surface text-ink shadow-[0_1px_2px_rgb(28_25_23_/_0.12)]'
                  : 'text-ink-2 hover:text-ink',
              )}
            >
              <PenLine size={14} aria-hidden />
              <span>Create</span>
            </button>
            <button
              type="button"
              aria-pressed={mode === 'scan'}
              onClick={() => onModeChange('scan')}
              className={cn(
                'inline-flex h-9 items-center gap-1 rounded-lg px-2 text-[13px] font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 sm:gap-1.5 sm:px-3',
                mode === 'scan'
                  ? 'bg-surface text-ink shadow-[0_1px_2px_rgb(28_25_23_/_0.12)]'
                  : 'text-ink-2 hover:text-ink',
              )}
            >
              <ScanLine size={14} aria-hidden />
              <span>Scan</span>
            </button>
          </div>

          <IconButton
            label="Open settings"
            onClick={onOpenSettings}
          >
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
      className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-stroke bg-surface text-ink-2 transition-colors duration-150 hover:border-stroke-strong hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 active:scale-95 sm:h-10 sm:w-10"
    >
      {children}
    </button>
  )
}