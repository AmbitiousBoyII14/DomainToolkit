'use client'

import { useState } from 'react'
import { useScan } from '@/lib/use-scan'
import {
  PageWrapper, PageHeading, InputCard, DomainInput, ToolSelect,
  PrimaryBtn, ProgressBar, ResultsCard, KvRow, ErrorState, CopyButton, Pill,
} from '../scan-ui'

const TOOLS = [
  { value: 'ping',               label: 'Ping / Reachability' },
  { value: 'port-scan',          label: 'Port Scanner (common)' },
  { value: 'http-response-time', label: 'HTTP Response Time' },
]

export function NetworkToolsView({ onScanSaved }: { onScanSaved?: () => void }) {
  const [host, setHost] = useState('')
  const [tool, setTool] = useState('ping')
  const { loading, progress, progressLabel, result, error, run } = useScan(onScanSaved)

  const handleRun = () => run(tool, host)

  const copyText = result
    ? Object.entries(result.fields).map(([k, v]) => `${k}: ${v}`).join('\n')
    : ''

  return (
    <PageWrapper>
      <PageHeading title="Network Tools" subtitle="Ping, port scanning &amp; HTTP response time" />

      <InputCard>
        <ToolSelect value={tool} onChange={setTool} options={TOOLS} />
        <DomainInput value={host} onChange={setHost} placeholder="example.com or 1.2.3.4" label="Host or IP" />
      </InputCard>

      <PrimaryBtn
        loading={loading}
        onClick={handleRun}
        onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleRun() }}
        className="mb-4"
      >
        Run Tool
      </PrimaryBtn>

      {loading && <ProgressBar value={progress} label={progressLabel} />}
      {error   && <ErrorState message={error} />}

      {result && (
        <ResultsCard title={result.type}>
          {Object.entries(result.fields).map(([k, v]) => (
            <KvRow key={k} label={k} value={v} />
          ))}

          {result.rows && result.rows.length > 0 && (
            <div className="px-4 py-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Port Scan Results</p>
              <div className="space-y-1.5">
                {result.rows.map((row, i) => {
                  const isOpen = row['Status'] === 'open'
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs font-mono text-foreground w-12 shrink-0">{row['Port']}</span>
                      <span className="text-xs text-muted-foreground flex-1">{row['Service']}</span>
                      <Pill variant={isOpen ? 'success' : 'muted'}>
                        {isOpen ? 'OPEN' : 'CLOSED'}
                      </Pill>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <CopyButton text={copyText} />
        </ResultsCard>
      )}
    </PageWrapper>
  )
}
