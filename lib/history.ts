import type { ScanResult } from './types'
const KEY = 'dtp_history'
export function getHistory(): ScanResult[] { if (typeof window === 'undefined') return []; try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') } catch { return [] } }
export function addResult(result: ScanResult): void { if (typeof window === 'undefined') return; const h = getHistory(); h.unshift(result); localStorage.setItem(KEY, JSON.stringify(h.slice(0, 1000))) }
export function deleteResult(id: string): void { if (typeof window === 'undefined') return; localStorage.setItem(KEY, JSON.stringify(getHistory().filter(r => r.id !== id))) }
export function toggleFavorite(id: string): void { if (typeof window === 'undefined') return; localStorage.setItem(KEY, JSON.stringify(getHistory().map(r => r.id === id ? { ...r, isFavorite: !r.isFavorite } : r))) }
export function getFavorites(): ScanResult[] { return getHistory().filter(r => r.isFavorite) }
export function clearHistory(): void { if (typeof window === 'undefined') return; localStorage.setItem(KEY, JSON.stringify(getHistory().filter(r => r.isFavorite))) }