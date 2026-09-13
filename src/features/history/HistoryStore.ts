import {
  createStorage,
  estimateJsonSize,
  readJson,
  writeJson,
} from '../../lib/storage/localStore'
import type { QRStyle } from '../../types/qr'

export interface HistoryItem {
  id: string
  title?: string
  type: string
  payload: string
  fields: Record<string, unknown>
  style: QRStyle
  createdAt: number
}

export interface SaveHistoryInput {
  title?: string
  type: string
  payload: string
  fields: Record<string, unknown>
  style: QRStyle
}

export interface HistoryStore {
  load(): HistoryItem[]
  save(input: SaveHistoryInput): { ok: boolean; droppedLogo: boolean }
  remove(id: string): void
  clear(): void
  available: boolean
  capacity(): { current: number; max: number }
}

const HISTORY_KEY = 'qr-studio-history'
const MAX_ITEMS = 30
const MAX_BYTES = 120_000

export function createHistoryId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function sizeOf(partial: unknown): number {
  return estimateJsonSize(partial)
}

export function createHistoryStore(storage?: Parameters<typeof createStorage>[0]): HistoryStore {
  const backend = createStorage(storage)

  const load = (): HistoryItem[] => {
    const items = readJson<HistoryItem[]>(backend, HISTORY_KEY, [])
    if (!Array.isArray(items)) return []
    return items
      .filter(
        (item) =>
          item &&
          typeof item.payload === 'string' &&
          typeof item.type === 'string' &&
          typeof item.createdAt === 'number',
      )
      .sort((a, b) => b.createdAt - a.createdAt)
  }

  const save = (input: SaveHistoryInput): { ok: boolean; droppedLogo: boolean } => {
    if (!backend.available) return { ok: false, droppedLogo: false }
    const items = load()

    const existing = items.find(
      (item) =>
        item.payload === input.payload &&
        item.type === input.type &&
        item.style.transparent === input.style.transparent,
    )

    const logoIncluded = input.style.logo ? { data: input.style.logo } : null

    const withLogoSize =
      sizeOf(baseShape(input)) + sizeOf({ l: logoIncluded }) + sizeOf({ i: existing?.id })
    const dropLogo = withLogoSize > MAX_BYTES
    if (dropLogo && logoIncluded) {
      input.style.logo = null
    }

    const record: HistoryItem = {
      id: existing?.id ?? createHistoryId(),
      title: input.title ?? existing?.title,
      type: input.type,
      payload: input.payload,
      fields: input.fields,
      style: input.style,
      createdAt: Date.now(),
    }

    let next = existing
      ? items.map((item) => (item.id === existing.id ? record : item))
      : [record, ...items]
    next = next.slice(0, MAX_ITEMS)

    while (next.length > 1 && sizeOf(next) > MAX_BYTES) {
      next = next.slice(0, -1)
    }

    const result = writeJson(backend, HISTORY_KEY, next)
    return { ok: result.ok, droppedLogo: dropLogo }
  }

  const remove = (id: string) => {
    writeJson(backend, HISTORY_KEY, load().filter((item) => item.id !== id))
  }

  const clear = () => {
    writeJson(backend, HISTORY_KEY, [])
  }

  return {
    load,
    save,
    remove,
    clear,
    available: backend.available,
    capacity: () => ({ current: sizeOf(load()), max: MAX_BYTES }),
  }
}

function baseShape(input: SaveHistoryInput): Record<string, unknown> {
  return {
    p: input.payload,
    t: input.type,
    f: input.fields,
    s: input.style,
  }
}