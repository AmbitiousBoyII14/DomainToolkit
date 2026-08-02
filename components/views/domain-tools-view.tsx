'use client'

import { useState } from 'react'
import { useScan } from '@/lib/use-scan'
import {
  PageWrapper, PageHeading, InputCard, DomainInput, ToolSelect,
  PrimaryBtn, ProgressBar, ResultsCard, KvRow, ErrorState, CopyButton,
} from '../scan-ui'

const TOOLS = [
  { value: 'dns',             label: 'DNS Lookup' },
  { value: 'domain-overview', label: 'Domain Overview' },
  { value: 'http',            label: 'HTTP Inspect' },
  { value: 'whois',           label: 'WHOIS Lookup' },
  { value: 'subdomains',      label: 'Subdomain Finder' },
]

export function DomainToolsView({ onScanSaved }: { onScanSaved?: () => void }) {
  const [host, setHost] = useState('')
  const [tool, setTool] = useState('dns')
  const { loading, progress, progressLabel, result, error, run } = useScan(onScanSaved)

  const handleRun = () => run(tool, host)

  const copyText = result
    ? Object.entries(result.fields).map(([k, v]) => `${k}: ${v}`).join('\n')
    : ''

  return (
    <PageWrapper>
      <PageHeading title="Domain Tools" subtitle="DNS, WHOIS, HTTP & subdomain analysis" />

      <InputCard>
        <ToolSelect value={tool} onChange={setTool} options={TOOLS} />
        <DomainInput value={host} onChange={setHost} />
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
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Records</p>
              <div className="space-y-1">
                {result.rows.map((row, i) => (
                  <p key={i} className="text-xs font-mono text-foreground bg-muted rounded px-2 py-1">
                    {Object.entries(row).map(([k, v]) => `${k}: ${v}`).join('  •  ')}
                  </p>
                ))}
              </div>
            </div>
          )}
          <CopyButton text={copyText} />
        </ResultsCard>
      )}
    </PageWrapper>
  )
}
