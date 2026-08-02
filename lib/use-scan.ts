'use client'

import { useState, useCallback } from 'react'
import { ScanResult } from './types'
import { saveResult } from './history'
import { getStoredUser, canScan, incrementScanCount, PLAN_CONFIGS, isPlanAllowed, useAuth } from './auth'

interface ScanState {
  loading: boolean
  progress: number
  progressLabel: string
  result: ScanResult | null
  error: string | null
}

export function useScan(onScanSaved?: () => void) {
  const [state, setState] = useState<ScanState>({
    loading: false,
    progress: 0,
    progressLabel: '',
    result: null,
    error: null,
  })

  const { openAuthModal } = useAuth()

  const run = useCallback(async (tool: string, host: string) => {
    const trimmed = host
      .replace(/^https?:\/\//i, '')
      .replace(/^wss?:\/\//i, '')
      .split('/')[0]
      .split(':')[0]
      .trim()
      .toLowerCase()

    if (!trimmed) {
      setState(s => ({ ...s, error: 'Please enter a domain or host.' }))
      return
    }

    // Check auth access first (triggers modal if needed)
    const user = getStoredUser()
    const plan = user?.plan ?? 'free'
    const allowed = isPlanAllowed(plan, tool)

    if (!allowed) {
      openAuthModal(!user ? 'signup' : 'signin')
      return
    }

    // Enforce daily scan limit
    if (!canScan(plan)) {
      const limit = PLAN_CONFIGS[plan].dailyScans
      setState(s => ({
        ...s,
        error: `Daily limit reached (${limit} scans/day on ${PLAN_CONFIGS[plan].name} plan). Upgrade for more.`,
      }))
      return
    }

    setState({ loading: true, progress: 10, progressLabel: 'Connecting...', result: null, error: null })

    // Fake progress to show activity
    const ticker = setInterval(() => {
      setState(s => {
        if (s.progress >= 85) { clearInterval(ticker); return s }
        return { ...s, progress: s.progress + 8, progressLabel: 'Scanning...' }
      })
    }, 400)

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool, host: trimmed }),
      })
      clearInterval(ticker)
      const data = await res.json() as { success?: boolean; error?: string; type?: string; fields?: Record<string, string>; rows?: Record<string, string>[] }

      if (!res.ok || !data.success) {
        setState({ loading: false, progress: 0, progressLabel: '', result: null, error: data.error ?? 'Scan failed' })
        return
      }

      const result: ScanResult = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type: data.type ?? tool,
        target: trimmed,
        timestamp: Date.now(),
        success: true,
        fields: data.fields ?? {},
        rows: data.rows,
      }

      incrementScanCount()
      saveResult(result)
      onScanSaved?.()

      setState({ loading: false, progress: 100, progressLabel: 'Done', result, error: null })
    } catch (err) {
      clearInterval(ticker)
      setState({ loading: false, progress: 0, progressLabel: '', result: null, error: (err as Error).message ?? 'Network error' })
    }
  }, [onScanSaved])

  return { ...state, run }
}
