'use client'

import { useState } from 'react'
import { useScan } from '@/lib/use-scan'
import {
  PageWrapper, PageHeading, InputCard, DomainInput,
  PrimaryBtn, ProgressBar, ResultsCard, KvRow, ErrorState, CopyButton, Pill,
} from '../scan-ui'

export function SslView({ onScanSaved }: { onScanSaved?: () => void }) {
  const [host, setHost] = useState('')
  const { loading, progress, progressLabel, result, error, run } = useScan(onScanSaved)

  const handleRun = () => run('ssl', host)

  const trusted = result?.fields['Trusted']
  const copyText = result
    ? Object.entries(result.fields).map(([k, v]) => `${k}: ${v}`).join('\n')
    : ''

  return (
    <PageWrapper>
      <PageHeading title="SSL / TLS Tools" subtitle="Certificate info, chain trust, TLS version & ciphers" />

      <InputCard>
        <DomainInput value={host} onChange={setHost} />
      </InputCard>

      <PrimaryBtn
        loading={loading}
        onClick={handleRun}
        onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleRun() }}
        className="mb-4"
      >
        Check SSL
      </PrimaryBtn>

      {loading && <ProgressBar value={progress} label={progressLabel} />}
      {error   && <ErrorState message={error} />}

      {result && (
        <>
          {trusted && (
            <div className="mb-3">
              <Pill variant={trusted === 'Yes' ? 'success' : 'error'}>
                {trusted === 'Yes' ? 'TRUSTED' : 'UNTRUSTED'}
              </Pill>
            </div>
          )}
          <ResultsCard title="Certificate Details">
            {Object.entries(result.fields)
              .filter(([k]) => k !== 'Trusted')
              .map(([k, v]) => (
                <KvRow key={k} label={k} value={v} />
              ))}
            <CopyButton text={copyText} />
          </ResultsCard>
        </>
      )}
    </PageWrapper>
  )
}
