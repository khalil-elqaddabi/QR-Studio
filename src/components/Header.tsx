import { Moon, Sun } from 'lucide-react'
import type { Theme } from '../hooks/useTheme'
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
}

export default function Header({ theme, onToggleTheme }: HeaderProps) {
  const isDark = theme === 'dark'
  return (
    <header className="sticky top-0 z-30 border-b border-stroke bg-page/75 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
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
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-stroke bg-surface text-ink-2 transition-colors duration-150 hover:border-stroke-strong hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
        >
          {isDark ? <Sun size={17} /> : <Moon size={17} />}
        </button>
      </div>
    </header>
  )
}