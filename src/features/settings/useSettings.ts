import { useCallback, useMemo, useRef, useState } from 'react'
import { createSettingsRepository, type SettingsRepository } from './settingsStore'
import { DEFAULT_SETTINGS, type AppSettings } from './types'

export function useSettings() {
  const repoRef = useRef<SettingsRepository | null>(null)
  if (!repoRef.current) repoRef.current = createSettingsRepository()
  const repo = repoRef.current

  const [settings, setSettings] = useState<AppSettings>(() => repo.load())

  const update = useCallback(
    (patch: Partial<AppSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...patch }
        repo.save(next)
        return next
      })
    },
    [repo],
  )

  const reset = useCallback(() => {
    setSettings(DEFAULT_SETTINGS)
    repo.save(DEFAULT_SETTINGS)
  }, [repo])

  const value = useMemo(
    () => ({ settings, update, reset, persisted: repo.available }),
    [settings, update, reset, repo],
  )

  return value
}