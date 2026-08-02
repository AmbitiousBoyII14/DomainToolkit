'use client'
const HISTORY_KEY = 'dtp_domain_history'; const MAX_HISTORY = 50
export function addDomainToHistory(domain: string) {
  if (typeof window === 'undefined') return
  const d = domain.trim().toLowerCase().replace(/^https?:\/\//i, '').split('/')[0]
  if (!d) return
  try {
    const h: string[] = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]')
    const i = h.findIndex(x => x === d); if (i >= 0) h.splice(i, 1)
    h.unshift(d); if (h.length > MAX_HISTORY) h.pop()
    localStorage.setItem(HISTORY_KEY, JSON.stringify(h))
  } catch {}
}
export function getDomainHistory(): string[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]') as string[] } catch { return [] }
}
export function suggestDomains(query: string, limit = 5): string[] {
  if (!query) return getDomainHistory().slice(0, limit)
  const q = query.toLowerCase()
  return getDomainHistory().filter(d => d.includes(q)).slice(0, limit)
}
