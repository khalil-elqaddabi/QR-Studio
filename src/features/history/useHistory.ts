import { useCallback, useMemo, useRef, useState } from 'react'
import { createHistoryStore, type HistoryItem, type SaveHistoryInput } from './HistoryStore'

export function useHistory(enabled: boolean) {
  const storeRef = useRef(createHistoryStore())
  const [items, setItems] = useState<HistoryItem[]>(() => storeRef.current.load())

  const store = storeRef.current

  const refresh = useCallback(() => setItems(store.load()), [store])

  const add = useCallback(
    (input: SaveHistoryInput) => {
      const result = store.save(input)
      setItems(store.load())
      return result
    },
    [store],
  )

  const remove = useCallback(
    (id: string) => {
      store.remove(id)
      setItems(store.load())
    },
    [store],
  )

  const clear = useCallback(() => {
    store.clear()
    setItems(store.load())
  }, [store])

  const value = useMemo(
    () => ({ items, available: store.available, enabled, add, remove, clear, refresh }),
    [items, enabled, store, add, remove, clear, refresh],
  )

  return value
}