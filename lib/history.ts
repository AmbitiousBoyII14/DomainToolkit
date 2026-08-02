'use client'

import { ScanResult } from './types'

const KEY = 'dtp_history'

export function getHistory(): ScanResult[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as ScanResult[]
  } catch {
    return []
  }
}

export function saveResult(result: ScanResult): void {
  if (typeof window === 'undefined') return
  const history = getHistory()
  // keep latest 200
  const updated = [result, ...history.filter(r => r.id !== result.id)].slice(0, 200)
  localStorage.setItem(KEY, JSON.stringify(updated))
}

export function deleteResult(id: string): void {
  if (typeof window === 'undefined') return
  const history = getHistory().filter(r => r.id !== id)
  localStorage.setItem(KEY, JSON.stringify(history))
}

export function toggleFavorite(id: string): void {
  if (typeof window === 'undefined') return
  const history = getHistory().map(r => r.id === id ? { ...r, isFavorite: !r.isFavorite } : r)
  localStorage.setItem(KEY, JSON.stringify(history))
}

export function clearHistory(): void {
  if (typeof window === 'undefined') return
  const favorites = getHistory().filter(r => r.isFavorite)
  localStorage.setItem(KEY, JSON.stringify(favorites))
}

export function getFavorites(): ScanResult[] {
  return getHistory().filter(r => r.isFavorite)
}
