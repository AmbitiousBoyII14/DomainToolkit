'use client'
import { useEffect } from 'react'

export function ThemeScript() {
  useEffect(() => {
    const stored = localStorage.getItem('dtp_theme')
    if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark')
    }
  }, [])
  return null
}