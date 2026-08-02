'use client'

import { useState } from 'react'
import { useScan } from '@/lib/use-scan'
import {
  PageWrapper, PageHeading, InputCard, DomainInput,
  PrimaryBtn, ProgressBar, ResultsCard, KvRow, ErrorState, CopyButton, Pill,
} from '../scan-ui'

export function HostingView({ onScanSaved }: { onScanSaved?: () => void }) {
  const [host, setHost] = useState('')
  const { loading, progress, progressLabel, result, error, run } = useScan(onScanSaved)

  const handleRun = () => run('hosting', host)

  const provider = result?.fields['Provider']
  const cdn      = result?.fields['CDN']
  const copyText = result
    ? Object.entries(result.fields).map(([k, v]) => `${k}: ${v}`).join('\n')
    : ''

  return (
    <PageWrapper>
      <PageHeading
        title="Hosting / CDN Detection"
        subtitle="Detects Cloudflare, AWS, Azure, GCP, Vercel, Netlify, and more"
      />

      <InputCard>
        <DomainInput value={host} onChange={setHost} />
      </InputCard>

      <PrimaryBtn
        loading={loading}
        onClick={handleRun}
        onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleRun() }}
        className="mb-4"
      >
        Detect Hosting
      </PrimaryBtn>

      {loading && <ProgressBar value={progress} label={progressLabel} />}
      {error   && <ErrorState message={error} />}

      {result && (
        <>
          {(provider || cdn) && (
            <div className="bg-card border border-border rounded-xl p-4 mb-3 flex flex-wrap gap-3">
              {provider && provider !== 'Unknown' && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Host Provider</p>
                  <Pill variant="primary">{provider}</Pill>
                </div>
              )}
              {cdn && cdn !== 'None detected' && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">CDN</p>
                  <Pill variant="success">{cdn}</Pill>
                </div>
              )}
            </div>
          )}

          <ResultsCard title="Detection Details">
            {Object.entries(result.fields).map(([k, v]) => (
              <KvRow key={k} label={k} value={v} />
            ))}
            <CopyButton text={copyText} />
          </ResultsCard>
        </>
      )}
    </PageWrapper>
  )
}
