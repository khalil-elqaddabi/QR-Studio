/**
 * Returns an absolute http/https URL when the input is safe to open/embed,
 * otherwise null. Prevents javascript:, data: and similar dangerous schemes
 * from being navigated to.
 */
export function safeExternalUrl(raw: string): string | null {
  const t = raw.trim()
  if (!t) return null
  try {
    const url = new URL(t)
    if (url.protocol === 'http:' || url.protocol === 'https:') return url.href
  } catch {
    /* not a parseable URL */
  }
  return null
}

export function openExternalUrl(raw: string): boolean {
  const url = safeExternalUrl(raw)
  if (!url) return false
  window.open(url, '_blank', 'noopener,noreferrer')
  return true
}