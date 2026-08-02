'use client'

import { useState } from 'react'
import { checkAllWebSocketPaths } from '@/lib/websocket-checker'
import {
  PageWrapper, PageHeading, InputCard, DomainInput,
  PrimaryBtn, ProgressBar, ResultsCard, KvRow, ErrorState, CopyButton, Pill,
} from '../scan-ui'
import type { ScanResult } from '@/lib/types'

const PATHS = ['/', '/ws', '/socket', '/socket.io', '/websocket', '/live', '/api/ws', '/chat']

export function WebSocketView({ onScanSaved }: { onScanSaved?: () => void }) {
  const [host, setHost] = useState('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressLabel, setProgressLabel] = useState('')
  const [result, setResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState('')

  const handleRun = async () => {
    const trimmed = host
      .replace(/^https?:\/\//i, '')
      .replace(/^wss?:\/\//i, '')
      .split('/')[0]
      .split(':')[0]
      .trim()
      .toLowerCase()

    if (!trimmed) {
      setError('Please enter a domain or host.')
      setResult(null)
      return
    }

    setLoading(true)
    setProgress(10)
    setProgressLabel('Initializing...')
    setError('')
    setResult(null)

    try {
      // Simulate progress while checking
      const progressInterval = setInterval(() => {
        setProgress((p) => {
          if (p >= 85) {
            clearInterval(progressInterval)
            return p
          }
          return p + 8
        })
        setProgressLabel('Scanning paths...')
      }, 400)

      // Run the WebSocket checks - RFC 6455 compliant
      const wsResults = await checkAllWebSocketPaths(trimmed, PATHS)

      clearInterval(progressInterval)

      // Create result object
      const scanResult: ScanResult = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type: 'websocket',
        target: trimmed,
        timestamp: Date.now(),
        success: true,
        fields: wsResults.fields,
        rows: wsResults.rows,
      }

      setProgress(100)
      setProgressLabel('Done')
      setResult(scanResult)
      onScanSaved?.()
    } catch (err) {
      setError((err as Error).message || 'Scan failed')
    } finally {
      setLoading(false)
    }
  }

  const detected = result?.fields['WebSocket Found'] === 'Yes'
  const copyText = result
    ? Object.entries(result.fields)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n')
    : ''

  return (
    <PageWrapper>
      <PageHeading
        title="WebSocket Tools"
        subtitle="Detects WS/WSS support, common paths, and RFC 6455 handshake headers"
      />

      {/* Paths info */}
      <div className="bg-muted/50 rounded-xl px-4 py-3 mb-4 border border-border">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
          Scanned paths
        </p>
        <p className="text-xs font-mono text-foreground">{PATHS.join('  ')}</p>
      </div>

      <InputCard>
        <DomainInput value={host} onChange={setHost} />
      </InputCard>

      <PrimaryBtn
        loading={loading}
        onClick={handleRun}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleRun()
        }}
        className="mb-4"
      >
        Check WebSocket
      </PrimaryBtn>

      {loading && <ProgressBar value={progress} label={progressLabel} />}
      {error && <ErrorState message={error} />}

      {result && (
        <>
          <div className="mb-3">
            <Pill variant={detected ? 'success' : 'warning'}>
              {detected ? 'WS DETECTED' : 'NOT FOUND'}
            </Pill>
          </div>

          <ResultsCard title="Handshake Details">
            {Object.entries(result.fields).map(([k, v]) => (
              <KvRow key={k} label={k} value={v} />
            ))}

            {result.rows && result.rows.length > 0 && (
              <div className="px-4 py-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Path Results
                </p>
                <div className="space-y-1.5">
                  {result.rows.map((row, i) => {
                    const ok = row['Upgraded'] === 'Yes'
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-xs font-mono text-foreground flex-1">
                          {row['Path']}
                        </span>
                        <span className="text-xs text-muted-foreground">{row['Status']}</span>
                        <Pill variant={ok ? 'success' : 'muted'}>{ok ? 'OK' : '-'}</Pill>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            <CopyButton text={copyText} />
          </ResultsCard>
        </>
      )}
    </PageWrapper>
  )
}
