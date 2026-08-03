'use client'
import { useState, useCallback } from 'react'
import type { ScanResult } from './types'
import { incrementScanCount } from './auth'
export function useScan(onScanSaved?: () => void) {
  const [loading, setLoading] = useState(false); const [progress, setProgress] = useState(0)
  const [progressLabel, setProgressLabel] = useState(''); const [result, setResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState('')
  const run = useCallback(async (tool: string, host: string) => {
    setLoading(true); setProgress(10); setProgressLabel('Starting...'); setError(''); setResult(null)
    const interval = setInterval(() => { setProgress(p => p < 90 ? p + 8 : p); setProgressLabel('Scanning...') }, 300)
    try {
      const res = await fetch('/api/scan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tool, host }) })
      const data = await res.json(); clearInterval(interval)
      if (data.error) { setError(data.error); setProgress(0) }
      else { setProgress(100); setProgressLabel('Done'); setResult({ id: `${Date.now()}`, type: data.type || tool, target: host, timestamp: Date.now(), success: true, fields: data.fields || {}, rows: data.rows }); incrementScanCount(); onScanSaved?.() }
    } catch (err) { clearInterval(interval); setError((err as Error).message || 'Scan failed'); setProgress(0) }
    finally { setLoading(false) }
  }, [onScanSaved])
  return { loading, progress, progressLabel, result, error, run }
}